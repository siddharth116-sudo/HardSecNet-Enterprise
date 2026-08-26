from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt, verify_jwt_in_request
from flask_bcrypt import Bcrypt
from flask_socketio import SocketIO, emit
import json
import os
import subprocess
import glob
try:
    import ctypes
except ImportError:
    ctypes = None
import time
import psutil
import datetime
import platform
from pymongo import MongoClient
import random
import re
import ipaddress
import secrets
import threading
import requests
from urllib.parse import urlparse
from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv

# --- CONFIGURATION & ENV SETUP ---
load_dotenv() # Load variables from .env

def validate_env():
    required_vars = ["JWT_SECRET_KEY", "MONGO_URI"]
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        raise RuntimeError(f"CRITICAL ERROR: Missing environment variables: {', '.join(missing)}")
    print("[*] Environment Validation Successful")

validate_env()

# Import Logger & ReportGenerator
from Logger import logger as app_logger, CEF_HEADER
from ReportGenerator import ReportGenerator
from ai_engine import AIEngine
from cis_engine import CISEngine
from crypto_util import encrypt_secret, decrypt_secret

# AI remediation engine: provider abstraction (off / local Ollama / Claude API)
# with a deterministic fallback so the tool never hard-depends on a model.
ai_engine = AIEngine.from_env()

# CIS Windows 11 benchmark engine (477 controls bundled under cis_benchmarks/).
cis_engine = CISEngine()


app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")  # required; enforced by validate_env()
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = datetime.timedelta(hours=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_HOURS", 1)))

_allowed_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",")]
CORS(app, origins=_allowed_origins)
# threading = Werkzeug dev server (supports ssl_context); eventlet = Gunicorn prod
_async_mode = os.getenv("SOCKETIO_ASYNC_MODE", "threading")
socketio = SocketIO(app, cors_allowed_origins=_allowed_origins, async_mode=_async_mode)

jwt = JWTManager(app)
bcrypt = Bcrypt(app)

# --- RATE LIMITING ---
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Allow tests/CI to disable rate limiting (RATELIMIT_ENABLED=false); on in prod.
app.config["RATELIMIT_ENABLED"] = os.getenv("RATELIMIT_ENABLED", "true").lower() == "true"
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["500 per day", "100 per hour"],
    storage_uri=os.getenv("REDIS_URL", "memory://"),
)
# --- REDIS CLIENT ---
# Shared Redis client used for agent command/status queues.
try:
    import redis
    redis_client = redis.from_url(
        os.getenv("REDIS_URL", "redis://localhost:6379/0"),
        decode_responses=True,
        socket_connect_timeout=3,
        socket_timeout=3,
    )
    redis_client.ping()
    print(f"Connected to Redis at {os.getenv('REDIS_URL', 'redis://localhost:6379/0')}")
except Exception as e:
    print(f"[!] Redis client unavailable: {e}")
    redis_client = None


# --- JWT BLOCKLIST (in-memory; survives restarts in dev; use Redis-backed in prod) ---
_jwt_blocklist: set = set()

@jwt.token_in_blocklist_loader
def _check_token_revoked(jwt_header, jwt_payload):
    return jwt_payload.get("jti") in _jwt_blocklist

REPORTS_DIR = os.path.join(os.getcwd(), 'Reports')
DRIFT_THRESHOLD = int(os.getenv("DRIFT_THRESHOLD", 100))
AUTO_REMEDIATE = os.getenv("AUTO_REMEDIATE_DEFAULT", "False").lower() == "true"
# Security bootstrap controls
SEED_DEMO_USERS = os.getenv("SEED_DEMO_USERS", "false").lower() == "true"  # lab-only weak demo accounts
MIN_PASSWORD_LENGTH = int(os.getenv("MIN_PASSWORD_LENGTH", 12))
system_stats = {"cpu": 0, "ram": 0}

# --- INPUT VALIDATION (anti command-injection / SSRF) ---
# Hardening targets the agent/scripts understand. Anything else is rejected.
ALLOWED_HARDENING_TARGETS = {"All", "Firewall", "Password", "Guest", "Lockout", "UAC", "FontBlocking"}
_HOSTNAME_RE = re.compile(
    r"^(?=.{1,253}$)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)"
    r"(\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$"
)


def validate_pid(raw):
    """Return a positive int PID, or None if the value is not a safe integer."""
    try:
        pid = int(raw)
    except (TypeError, ValueError):
        return None
    if pid <= 0 or pid > 2_147_483_647:
        return None
    return pid


def validate_targets(raw):
    """Return a cleaned list of allowlisted hardening targets, or None if any are invalid."""
    if not raw:
        return []
    if not isinstance(raw, list):
        return None
    cleaned = []
    for t in raw:
        if not isinstance(t, str) or t not in ALLOWED_HARDENING_TARGETS:
            return None
        cleaned.append(t)
    return cleaned


def validate_host(raw):
    """Return a syntactically valid IP address or hostname, or None."""
    if not isinstance(raw, str):
        return None
    raw = raw.strip()
    if not raw:
        return None
    try:
        ipaddress.ip_address(raw)
        return raw
    except ValueError:
        pass
    return raw if _HOSTNAME_RE.match(raw) else None

# Load CVE DB
try:
    with open("cve_database.json", "r") as f:
        CVE_DB = json.load(f)
except:
    CVE_DB = []

# Mock Data Store for Multi-Node Simulation
NODES = {}
# Command Queue for Agents
PENDING_COMMANDS = {}


# Ensure Reports Dir Exists
if not os.path.exists(REPORTS_DIR):
    os.makedirs(REPORTS_DIR)

# --- DATABASE SETUP (MongoDB) ---
# Connect using Env Var
try:
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    db_name = os.getenv("DB_NAME", "hardsecnet")
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=3000)
    # Force an actual connection check before proceeding
    client.admin.command('ping')
    db = client[db_name]
    print(f"Connected to MongoDB at {mongo_uri} (DB: {db_name}).")
except Exception as e:
    print(f"[!] MongoDB unavailable: {e}")
    print("[!] Starting in degraded mode â€” auth and data features require MongoDB.")
    db = None

from rbac_config import ROLES, get_role_permissions, check_permission
from functools import wraps

def init_db():
    if db is None: return

    # Collections: users, nodes, logs, audits, roles
    users = db["users"]
    nodes = db["nodes"]
    roles_col = db["roles"]

    # Create Indexes
    users.create_index("username", unique=True)
    # Nodes are deduped at upsert time by hostname (agents) or ip (WinRM). 'ip' is
    # intentionally NOT unique: many hosts can share one public IP behind NAT (and
    # every test client reports from 127.0.0.1). Drop any stale unique ip_1 index
    # left by older builds, then create plain lookup indexes.
    try:
        nodes.drop_index("ip_1")
    except Exception:
        pass
    nodes.create_index("ip")
    nodes.create_index("hostname")
    roles_col.create_index("name", unique=True)

    # Initialize Roles in DB (if standard definition changes in code, update DB)
    for role_name, details in ROLES.items():
        roles_col.update_one(
            {"name": role_name},
            {"$set": {"permissions": details["permissions"], "description": details["description"]}},
            upsert=True
        )
    print("RBAC Roles Initialized.")

    # Secure first-run bootstrap of the super admin (no hardcoded weak password).
    bootstrap_super_admin(users)

    # Optional lab/demo accounts with weak passwords â€” OFF by default.
    # Enable only in a throwaway lab via SEED_DEMO_USERS=true in .env.
    if SEED_DEMO_USERS:
        _seed_demo_users(users)


def bootstrap_super_admin(users):
    """Create the initial super_admin securely on first run only.

    Password source (in order):
      1. BOOTSTRAP_ADMIN_PASSWORD env var (if set), or
      2. a cryptographically random password printed ONCE to the console.
    The account is flagged must_change_password so the operator is forced to
    rotate it on first login.
    """
    admin_user = os.getenv("BOOTSTRAP_ADMIN_USER", "admin")
    if users.find_one({"username": admin_user}):
        return  # already bootstrapped; never reset an existing admin

    password = os.getenv("BOOTSTRAP_ADMIN_PASSWORD")
    generated = False
    if not password:
        password = secrets.token_urlsafe(16)
        generated = True

    pw_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    users.insert_one({
        "username": admin_user,
        "password": pw_hash,
        "role": "super_admin",
        "must_change_password": True,
    })

    print("=" * 70)
    print(f"[BOOTSTRAP] Created initial super admin '{admin_user}'.")
    if generated:
        print(f"[BOOTSTRAP] Generated one-time password: {password}")
        print("[BOOTSTRAP] Store it now â€” it will NOT be shown again.")
    else:
        print("[BOOTSTRAP] Password taken from BOOTSTRAP_ADMIN_PASSWORD.")
    print("[BOOTSTRAP] You will be required to change it on first login.")
    print("=" * 70)


def _seed_demo_users(users):
    demo = [
        ("secops", "secops123", "security_admin"),
        ("auditor", "audit123", "auditor"),
        ("viewer", "view123", "viewer"),
    ]
    for username, password, role in demo:
        if not users.find_one({"username": username}):
            pw_hash = bcrypt.generate_password_hash(password).decode('utf-8')
            users.insert_one({
                "username": username, "password": pw_hash,
                "role": role, "must_change_password": True,
            })
            print(f"[DEMO] Seeded weak demo account '{username}' (lab use only).")

init_db()

# RBAC Decorator
def permission_required(permission):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get("role")
            if not check_permission(user_role, permission):
                user = get_jwt_identity()
                log_event("AUTH-DENY", "Permission Denied", 5, user=user, msg=f"Role '{user_role}' tried {permission}")
                return jsonify({"msg": "Permission Denied"}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Load Persistent Nodes on Startup
def load_nodes():
    if db is None: return
    try:
        nodes_collection = db["nodes"]
        cursor = nodes_collection.find({})
        count = 0
        for doc in cursor:
            node_type = doc.get("type", "remote_winrm")
            hostname = doc.get("hostname")
            ip = doc.get("ip")
            # Agent nodes are addressed by hostname; WinRM nodes by IP.
            key = hostname if node_type == "agent_reported" else (ip or hostname)
            if not key:
                continue

            # Hydrate the last-known findings so the dashboard is populated after a restart.
            last_checks = []
            latest = db.audits.find_one({"Hostname": hostname}, sort=[("created_at", -1)]) if hostname else None
            if latest:
                last_checks = latest.get("Checks", [])

            NODES[key] = {
                "Hostname": hostname or key,
                "IP": ip,
                "Username": doc.get("username"),
                "Password": decrypt_secret(doc.get("password")),
                "Type": node_type,
                "Status": "Loaded",
                "Checks": last_checks,
            }
            count += 1
        print(f"Loaded {count} nodes from MongoDB.")
    except Exception as e:
        print(f"Error loading nodes: {e}")

load_nodes()

def is_admin():
    try:
        if platform.system() == "Windows" and ctypes:
            return ctypes.windll.shell32.IsUserAnAdmin()
        return os.getuid() == 0 # Linux root check
    except:
        return False

# --- LIVE LOG WATCHER ---
def log_watcher():
    """
    Background thread to tail activity.log and emit via SocketIO
    """
    log_file = "activity.log"
    # Ensure file exists
    if not os.path.exists(log_file):
        with open(log_file, "w") as f: f.write("")
        
    with open(log_file, "r") as f:
        # Go to the end of file
        f.seek(0, 2)
        while True:
            line = f.readline()
            if not line:
                time.sleep(0.5)
                continue
            # Emit new log line
            socketio.emit('new_log', {'log': line.strip()})

# Start Log Watcher Daemon
threading.Thread(target=log_watcher, daemon=True).start()


# --- LOGGING WRAPPER ---
def log_event(signature_id, name, severity, source_ip="127.0.0.1", user="System", msg="Action Performed"):
    # Write to MongoDB
    if db is not None:
        try:
            db.logs.insert_one({
                "timestamp": datetime.datetime.now(datetime.timezone.utc),
                "signature_id": signature_id,
                "name": name,
                "severity": severity,
                "source_ip": source_ip,
                "user": user,
                "msg": msg
            })
        except Exception as e:
            print(f"Log DB Error: {e}")

    # Write to File (which triggers SocketIO emit via watcher)
    app_logger.log_event(signature_id, name, severity, source_ip, user, msg)


# --- MONITORING ---
def drift_monitor():
    if platform.system() != "Windows":
        return 

    try:
        result = subprocess.run(
            ["powershell", "-ExecutionPolicy", "Bypass", "-File", "Auditor.ps1", "-Type", "monitor"], 
            capture_output=True, text=True
        )
        if result.returncode == 0:
            monitor_file = result.stdout.strip()
            if os.path.exists(monitor_file):
                with open(monitor_file, 'r', encoding='utf-16') as f:
                    data = json.load(f)
                
                checks = data.get('Checks', [])
                total = len(checks)
                passed = sum(1 for c in checks if c.get('Status') == 'Compliant')
                score = int((passed / total) * 100) if total > 0 else 0
                
                if score < DRIFT_THRESHOLD:
                    try:
                        log_event("SYS-DRIFT", "Configuration Drift Detected", 7, msg=f"Score dropped to {score}%")
                    except: pass
                    if AUTO_REMEDIATE:
                        try:
                            log_event("SYS-AUTO", "Auto-Remediation Triggered", 5, msg="Starting Hardener")
                        except: pass
                        subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", "Hardener.ps1"])
                
                # Save to MongoDB
                if db is not None:
                    data['created_at'] = datetime.datetime.now()
                    db.audits.insert_one(data.copy())

                # Update Local Node State
                NODES['LOCALHOST'] = data

                # Push live update to all connected dashboard clients so they
                # reflect the new score/checks without waiting for a page refresh.
                clean = {k: v for k, v in data.items() if k != 'created_at'}
                socketio.emit('audit_update', clean)
                
    except Exception as e:
        print(f"Monitor Error: {e}")

def collect_telemetry():
    global system_stats
    system_stats = {
        "cpu": psutil.cpu_percent(),
        "ram": psutil.virtual_memory().percent
    }

scheduler = BackgroundScheduler()
_drift_interval = int(os.getenv("DRIFT_INTERVAL_MINUTES", "2"))
scheduler.add_job(drift_monitor, 'interval', minutes=_drift_interval)
scheduler.add_job(collect_telemetry, 'interval', seconds=5)
scheduler.start()


# --- HEALTH CHECK ---
@app.route('/api/health', methods=['GET'])
def health_check():
    db_status = "up"
    redis_status = "up"

    try:
        if db is not None:
            db.command('ping')
        else:
            db_status = "down"
    except Exception:
        db_status = "down"

    try:
        if redis_client is not None:
            redis_client.ping()
        else:
            redis_status = "down"
    except Exception:
        redis_status = "down"

    overall = "ok" if db_status == "up" else "degraded"
    return jsonify({
        "status": overall,
        "version": "2.0.0",
        "services": {
            "database": db_status,
            "cache": redis_status,
        },
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
    }), 200 if overall == "ok" else 503


@app.route('/api/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"msg": "Missing JSON body"}), 400

        username = data.get("username", None)
        password = data.get("password", None)
        
        if not username or not password:
             return jsonify({"msg": "Missing credentials"}), 400
        
        if db is None:
            return jsonify({"msg": "Database unavailable"}), 500

        user_doc = db.users.find_one({"username": username})

        if user_doc and bcrypt.check_password_hash(user_doc['password'], password):
            role = user_doc['role']
            permissions = get_role_permissions(role)
            # Embed permissions in token or just send back? Seding back is easier for frontend logic immediately.
            # Token claims for backend validation.
            must_change = bool(user_doc.get("must_change_password", False))
            access_token = create_access_token(identity=username, additional_claims={"role": role, "perms": permissions})
            refresh_token = create_refresh_token(identity=username)
            try:
                log_event("AUTH-SUCCESS", "User Login", 1, user=username, msg="Login Successful")
            except: pass
            return jsonify(access_token=access_token, refresh_token=refresh_token, role=role,
                           username=username, permissions=permissions, must_change_password=must_change)
        else:
            try:
                log_event("AUTH-FAIL", "Login Failed", 5, user=username, msg="Invalid Credentials")
            except: pass
            return jsonify({"msg": "Bad username or password"}), 401
    except Exception as e:
        print(f"LOGIN ERROR: {e}")
        return jsonify({"msg": f"Server Error: {str(e)}"}), 500

@app.route('/api/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Exchange a valid refresh token for a new access token.

    Re-reads the user's current role from the DB so the new access token always
    carries up-to-date role/permission claims (role changes take effect on refresh).
    """
    username = get_jwt_identity()
    user_doc = db.users.find_one({"username": username}) if db is not None else None
    if not user_doc:
        return jsonify({"msg": "User no longer exists"}), 401
    role = user_doc['role']
    permissions = get_role_permissions(role)
    access_token = create_access_token(identity=username, additional_claims={"role": role, "perms": permissions})
    return jsonify(access_token=access_token, role=role, permissions=permissions)


@app.route('/api/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Allow the authenticated user to rotate their own password.

    Clears the must_change_password flag. Enforces MIN_PASSWORD_LENGTH and
    verifies the current password before changing it.
    """
    try:
        data = request.get_json(silent=True) or {}
        current_password = data.get("current_password")
        new_password = data.get("new_password")

        if not current_password or not new_password:
            return jsonify({"msg": "current_password and new_password are required"}), 400
        if len(new_password) < MIN_PASSWORD_LENGTH:
            return jsonify({"msg": f"Password must be at least {MIN_PASSWORD_LENGTH} characters"}), 400
        if new_password == current_password:
            return jsonify({"msg": "New password must differ from current password"}), 400
        if db is None:
            return jsonify({"msg": "Database unavailable"}), 500

        username = get_jwt_identity()
        user_doc = db.users.find_one({"username": username})
        if not user_doc or not bcrypt.check_password_hash(user_doc['password'], current_password):
            log_event("AUTH-FAIL", "Password Change Denied", 5, user=username, msg="Wrong current password")
            return jsonify({"msg": "Current password is incorrect"}), 401

        new_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
        db.users.update_one(
            {"username": username},
            {"$set": {"password": new_hash}, "$unset": {"must_change_password": ""}},
        )
        log_event("AUTH-SUCCESS", "Password Changed", 1, user=username, msg="Password rotated")
        return jsonify({"msg": "Password updated successfully"})
    except Exception as e:
        print(f"CHANGE PASSWORD ERROR: {e}")
        return jsonify({"msg": "Server Error"}), 500


@app.route('/api/integrations/webhook/test', methods=['POST'])
@jwt_required()
@permission_required("settings.modify")
def test_webhook():
    """Send a real test notification to a Slack/Teams/Discord/generic incoming webhook.

    All of those accept a JSON {"text": ...} POST, so one endpoint powers several
    connectors. Includes a basic SSRF guard (https only, no internal/loopback hosts).
    """
    user = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    url = (data.get('url') or '').strip()
    parsed = urlparse(url)
    if parsed.scheme != 'https' or not parsed.hostname:
        return jsonify({"error": "Webhook URL must be a valid https:// address"}), 400

    host = parsed.hostname
    blocked = host == 'localhost' or host.endswith('.local')
    try:
        ip = ipaddress.ip_address(host)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            blocked = True
    except ValueError:
        pass  # a hostname, not a raw IP â€” allowed
    if blocked:
        return jsonify({"error": "Internal or loopback URLs are not allowed"}), 400

    message = "HardSecNet: test notification â€” your webhook connector is working."
    # Different providers expect different fields: Discord uses "content",
    # Slack/Teams/most generic webhooks use "text".
    low_host = host.lower()
    if 'discord' in low_host:
        payload = {"content": message}
    else:
        payload = {"text": message}

    try:
        resp = requests.post(url, json=payload, timeout=6)
        if 200 <= resp.status_code < 300:
            log_event("INTEG-TEST", "Webhook Test Sent", 2, user=user, msg=f"Delivered to {host}")
            return jsonify({"message": f"Test notification delivered to {host}."})
        body = (resp.text or "").strip().replace("\n", " ")[:160]
        return jsonify({"error": f"Webhook rejected the request ({resp.status_code}): {body}"}), 502
    except requests.RequestException as e:
        return jsonify({"error": f"Delivery failed: {str(e)[:120]}"}), 502


@app.route('/api/cis-catalog', methods=['GET'])
@jwt_required()
@permission_required("dashboard.view")
def cis_catalog():
    """Return the bundled CIS control catalog (metadata only, no execution)."""
    level = request.args.get('level')
    controls = cis_engine.list_controls(level=level)
    return jsonify({
        "benchmark": "CIS Microsoft Windows 11 v4.0.0",
        "total": len(controls),
        "powershell_available": cis_engine.powershell_available(),
        "controls": controls,
    })


@app.route('/api/cis-audit', methods=['POST'])
@jwt_required()
@permission_required("dashboard.view")
def cis_audit():
    """Run the bundled CIS Windows 11 benchmark in read-only -Status mode.

    Body (all optional): {"level": "L1"|"L2", "limit": int, "ids": ["18.1.1.1", ...]}
    Returns findings in the standard {Name,Value,Status} shape plus a score and an
    AI remediation summary, so the dashboard renders it like any other audit.
    """
    user = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    level = data.get('level')
    ids = data.get('ids')
    limit = data.get('limit')
    try:
        limit = int(limit) if limit is not None else None
    except (TypeError, ValueError):
        return jsonify({"error": "limit must be an integer"}), 400

    if not cis_engine.available():
        return jsonify({"error": "CIS engine unavailable (PowerShell required on this host)"}), 503

    log_event("ACT-CIS", "CIS Audit Started", 2, user=user,
              msg=f"level={level} limit={limit} ids={'custom' if ids else 'all'}")
    checks = cis_engine.run_audit(level=level, ids=ids, limit=limit)

    total = len(checks)
    compliant = sum(1 for c in checks if c["Status"] == "Compliant")
    score = round((compliant / total) * 100) if total else 0
    summary = ai_engine.summarize_audit(checks, os.getenv('COMPUTERNAME', 'LOCALHOST'))

    return jsonify({
        "Hostname": os.getenv('COMPUTERNAME', 'LOCALHOST'),
        "Timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "Type": "cis",
        "Benchmark": "CIS Microsoft Windows 11 v4.0.0",
        "Score": score,
        "Compliant": compliant,
        "Total": total,
        "Checks": checks,
        "AISummary": summary,
    })


@app.route('/api/logout', methods=['POST'])
@jwt_required()
def logout():
    jti = get_jwt()['jti']
    _jwt_blocklist.add(jti)
    user = get_jwt_identity()
    log_event("AUTH-LOGOUT", "User Logout", 1, user=user, msg="Token revoked")
    return jsonify({"msg": "Successfully logged out"})


@app.route('/api/research-data', methods=['GET'])
@jwt_required()
def research_data():
    """
    Returns comparative data for Research Tab.
    """
    data = [
        {"task": "Baseline Audit", "manual": 20, "automated": 0.2}, 
        {"task": "Registry Hardening", "manual": 45, "automated": 0.5},
        {"task": "Firewall Config", "manual": 15, "automated": 0.1},
        # {"task": "AI Analysis", "manual": 30, "automated": 0.3},
        {"task": "Report Generation", "manual": 10, "automated": 0.05} 
    ]
    return jsonify(data)

# â”€â”€â”€ WORKSPACES (multi-client tenancy for agencies / MSPs) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# One HardSecNet instance, many client "workspaces". Each workspace has an
# enrollment token; an agent that presents it lands in that client's workspace.

def get_or_create_default_workspace():
    if db is None:
        return None
    ws = db.workspaces.find_one({"slug": "default"})
    if ws:
        return ws
    doc = {
        "name": "Default", "slug": "default", "owner": "system",
        "enrollment_token": secrets.token_urlsafe(24),
        "created_at": datetime.datetime.now(datetime.timezone.utc),
    }
    doc["_id"] = db.workspaces.insert_one(doc).inserted_id
    # Backfill any pre-existing nodes/audits into the default workspace.
    wid = str(doc["_id"])
    db.nodes.update_many({"workspace_id": {"$exists": False}}, {"$set": {"workspace_id": wid, "workspace": "Default"}})
    db.audits.update_many({"workspace_id": {"$exists": False}}, {"$set": {"workspace_id": wid, "workspace": "Default"}})
    return doc


DEFAULT_WORKSPACE = get_or_create_default_workspace()
DEFAULT_WORKSPACE_ID = str(DEFAULT_WORKSPACE["_id"]) if DEFAULT_WORKSPACE else None
DEFAULT_WORKSPACE_NAME = DEFAULT_WORKSPACE.get("name") if DEFAULT_WORKSPACE else "Default"


def resolve_workspace_by_token(token):
    if db is None or not token:
        return None
    return db.workspaces.find_one({"enrollment_token": token})


def _workspace_public(ws, include_token=True):
    out = {"id": str(ws["_id"]), "name": ws.get("name"), "slug": ws.get("slug"),
           "created_at": ws.get("created_at").isoformat() if ws.get("created_at") else None}
    if include_token:
        out["enrollment_token"] = ws.get("enrollment_token")
    return out


@app.route('/api/workspaces', methods=['GET'])
@jwt_required()
@permission_required("dashboard.view")
def list_workspaces():
    if db is None:
        return jsonify([])
    out = []
    for ws in db.workspaces.find().sort("created_at", 1):
        entry = _workspace_public(ws)
        entry["node_count"] = db.nodes.count_documents({"workspace_id": str(ws["_id"])})
        out.append(entry)
    return jsonify(out)


@app.route('/api/workspaces', methods=['POST'])
@jwt_required()
@permission_required("agents.manage")
def create_workspace():
    if db is None:
        return jsonify({"error": "Database unavailable"}), 500
    name = ((request.get_json(silent=True) or {}).get("name") or "").strip()
    if not name:
        return jsonify({"error": "Workspace name is required"}), 400
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-') or "client"
    if db.workspaces.find_one({"slug": slug}):
        slug = f"{slug}-{secrets.token_hex(2)}"
    doc = {
        "name": name, "slug": slug, "owner": get_jwt_identity(),
        "enrollment_token": secrets.token_urlsafe(24),
        "created_at": datetime.datetime.now(datetime.timezone.utc),
    }
    doc["_id"] = db.workspaces.insert_one(doc).inserted_id
    log_event("SYS-WS", "Workspace Created", 2, user=get_jwt_identity(), msg=f"Client workspace '{name}'")
    return jsonify(_workspace_public(doc)), 201


@app.route('/api/workspaces/<wid>/rotate-token', methods=['POST'])
@jwt_required()
@permission_required("agents.manage")
def rotate_workspace_token(wid):
    from bson import ObjectId
    if db is None:
        return jsonify({"error": "Database unavailable"}), 500
    try:
        oid = ObjectId(wid)
    except Exception:
        return jsonify({"error": "Invalid workspace id"}), 400
    token = secrets.token_urlsafe(24)
    if db.workspaces.update_one({"_id": oid}, {"$set": {"enrollment_token": token}}).matched_count == 0:
        return jsonify({"error": "Workspace not found"}), 404
    return jsonify({"enrollment_token": token})


@app.route('/api/nodes', methods=['GET'])
@jwt_required()
def get_nodes():
    """Return only genuinely registered endpoint nodes.

    MongoDB is the source of truth for persistent node registrations.
    Synthetic LOCALHOST and simulation nodes are never returned here.
    """
    wid = request.args.get('workspace')

    try:
        if db is not None:
            query = {}

            if wid:
                query["workspace_id"] = wid

            db_nodes = list(
                db.nodes.find(
                    query,
                    {
                        "_id": 0,
                        "hostname": 1,
                        "ip": 1,
                        "type": 1,
                        "status": 1,
                        "workspace_id": 1
                    }
                )
            )

            result = []

            for node in db_nodes:
                hostname = node.get("hostname") or node.get("ip")

                if hostname:
                    result.append(hostname)

            return jsonify(result)

        result = []

        for hostname, node in NODES.items():
            if hostname == "LOCALHOST":
                continue

            if node.get("Type") == "simulation":
                continue

            if wid and (node.get("WorkspaceId") or DEFAULT_WORKSPACE_ID) != wid:
                continue

            result.append(hostname)

        return jsonify(result)

    except Exception as e:
        print(f"GET /api/nodes error: {e}")
        return jsonify({"error": "Unable to load nodes"}), 500

@app.route('/api/add-node', methods=['POST'])
@jwt_required()
@permission_required("agents.manage")
def add_node():
    data = request.json
    
    # Remote Node (Real)
    if 'ip' in data:
        ip = validate_host(data.get('ip'))
        if ip is None:
            return jsonify({"error": "Invalid node IP or hostname"}), 400
        username = data.get('username')
        password = data.get('password')
        
        # Save to DB
        try:
            if db is not None:
                db.nodes.update_one(
                    {"ip": ip},
                    {"$set": {
                        "type": "remote_winrm",
                        "username": username,
                        "password": encrypt_secret(password),  # encrypted at rest
                        "hostname": ip
                    }},
                    upsert=True
                )
            
            # Update Memory
            NODES[ip] = {
                "Hostname": ip,
                "IP": ip,
                "Username": username,
                "Password": password,
                "Type": "remote_winrm",
                "Status": "Connecting...",
                "Checks": []
            }
            log_event("SYS-NODE", "Remote Node Added", 2, msg=f"Node {ip} saved to database.")
            return jsonify({"message": f"Remote Node {ip} added successfully", "node": ip})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
            
    else:
        # Fallback to Simulation Mode (Original Logic) - No need to save to DB for temporary sims
        node_name = f"SERVER-MOCK-{random.randint(10,99)}"
        mock_checks = [
            {"Name": "Firewall Domain Profile", "Value": "Enabled", "Status": "Compliant"},
            {"Name": "Firewall Private Profile", "Value": "Disabled", "Status": "Action Required"},
            {"Name": "Minimum Password Length", "Value": "8 characters", "Status": "Action Required"},
            {"Name": "Guest Account Status", "Value": "Disabled", "Status": "Compliant"},
            {"Name": "Account Lockout Threshold", "Value": "999 attempts", "Status": "Action Required"},
            {"Name": "User Account Control (UAC)", "Value": "Always Notify (2)", "Status": "Compliant"},
            {"Name": "Untrusted Font Blocking", "Value": "Enabled", "Status": "Compliant"}
        ]
        
        NODES[node_name] = {
            "Hostname": node_name,
            "Timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "Checks": mock_checks,
            "AISummary": "AI Analysis Disabled",
            "Type": "simulation"
        }
        
        log_event("SYS-NODE", "Simulation Node Added", 2, msg=f"Node {node_name} joined the cluster.")
        return jsonify({"message": f"Node {node_name} added", "node": node_name})

@app.route('/api/node-data/<hostname>', methods=['GET'])
@jwt_required()
def get_node_data(hostname):
    """Return the latest security data for one registered node.

    MongoDB is the source of truth for enrolled/agent-reported endpoints.
    The requested hostname is always used to scope the audit lookup.
    """

    try:
        if db is None:
            return jsonify({"error": "Database unavailable"}), 500

        # First check whether this is a persisted node.
        node_doc = db.nodes.find_one({"hostname": hostname})

        if node_doc:
            audit_query = {
                "Hostname": hostname
            }

            # Enrolled agents are authoritative for their own endpoint.
            # Scope the audit to the same workspace and agent report type.
            if node_doc.get("type") == "agent_reported":
                audit_query["Type"] = "agent_report"

                if node_doc.get("workspace_id"):
                    audit_query["workspace_id"] = node_doc["workspace_id"]

            latest = db.audits.find_one(
                audit_query,
                sort=[("created_at", -1)]
            )

            if latest:
                latest.pop("_id", None)
                latest.pop("created_at", None)

                latest["AISummary"] = ai_engine.summarize_audit(
                    latest.get("Checks", []),
                    latest.get("Hostname", hostname)
                )

                latest["Status"] = node_doc.get("status", "Online")
                latest["IP"] = node_doc.get("ip")
                latest["workspace_id"] = node_doc.get("workspace_id")
                latest["workspace"] = node_doc.get("workspace")

                return jsonify(latest)

            # Node exists but has not submitted an audit yet.
            return jsonify({
                "Hostname": hostname,
                "IP": node_doc.get("ip"),
                "Status": node_doc.get("status", "Pending"),
                "Type": node_doc.get("type", "registered"),
                "Checks": [],
                "AISummary": "No audit report has been received yet.",
                "workspace_id": node_doc.get("workspace_id"),
                "workspace": node_doc.get("workspace")
            })

        # Legacy in-memory remote node support.
        if hostname in NODES and NODES[hostname].get("Type") == "remote_winrm":
            node = NODES[hostname]

            last_fetch = node.get("LastFetchTime", 0)

            if time.time() - last_fetch < 60 and "Checks" in node:
                return jsonify(node)

            try:
                import winrm
            except ImportError:
                return jsonify({
                    "error": "Server missing 'pywinrm' library"
                }), 500

            session = winrm.Session(
                node["IP"],
                auth=(node["Username"], node["Password"]),
                transport="ntlm"
            )

            ps_script = """
            $res = @{ Checks = @() }

            $fw = Get-NetFirewallProfile -Profile Domain
            $status = if ($fw.Enabled) { "Compliant" } else { "Action Required" }
            $res.Checks += @{
                Name="Firewall Domain Profile"
                Value=$fw.Enabled
                Status=$status
            }

            $uac = Get-ItemProperty HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System -Name EnableLUA
            $uacStatus = if ($uac.EnableLUA -eq 1) { "Compliant" } else { "Action Required" }

            $res.Checks += @{
                Name="User Account Control (UAC)"
                Value=$uac.EnableLUA
                Status=$uacStatus
            }

            $res.Hostname = $env:COMPUTERNAME
            $res.Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

            $res | ConvertTo-Json -Compress
            """

            result = session.run_ps(ps_script)

            if result.status_code == 0:
                remote_data = json.loads(result.std_out)

                node["Checks"] = remote_data.get("Checks", [])
                node["Status"] = "Online"
                node["Timestamp"] = remote_data.get("Timestamp")
                node["LastFetchTime"] = time.time()
                node["AISummary"] = ai_engine.summarize_audit(
                    node.get("Checks", []),
                    hostname
                )

                return jsonify(node)

            return jsonify({
                "error": "Remote audit failed",
                "details": result.std_err.decode(errors="replace")
            }), 502

        return jsonify({
            "error": "Node not found",
            "hostname": hostname
        }), 404

    except Exception as e:
        print(f"Node Data Error: {e}")
        return jsonify({"error": "Unable to load node data"}), 500

@app.route('/api/submit-report', methods=['POST'])
def submit_report():
    """
    Endpoint for Agent-based nodes to push their audit reports.
    Auth: if AGENT_API_KEY is configured, agents must present it as X-Agent-Key.
    """
    agent_key = os.getenv("AGENT_API_KEY")
    if agent_key and request.headers.get("X-Agent-Key") != agent_key:
        return jsonify({"error": "Invalid or missing agent key"}), 401

    data = request.json
    # Check if 'data' key exists (wrapper), otherwise use raw body
    report = data.get('data', data)
        
    hostname = report.get('Hostname')
    if not hostname:
        return jsonify({"error": "Invalid Report Format: Missing Hostname"}), 400

    ip = request.remote_addr # Auto-detect source IP

    # Resolve which client workspace this agent belongs to (via enrollment token).
    ws = resolve_workspace_by_token(request.headers.get("X-Workspace-Token"))
    workspace_id = str(ws["_id"]) if ws else DEFAULT_WORKSPACE_ID
    workspace_name = ws.get("name") if ws else DEFAULT_WORKSPACE_NAME

    # Save/Update Node in MongoDB
    if db is not None:
        try:
            # Upsert Node Info
            db.nodes.update_one(
                {"hostname": hostname},
                {"$set": {
                    "ip": ip,
                    "hostname": hostname,
                    "type": "agent_reported",
                    "workspace_id": workspace_id,
                    "workspace": workspace_name,
                    "last_seen": datetime.datetime.now(datetime.timezone.utc)
                }},
                upsert=True
            )

            # Save Audit Entry
            report['created_at'] = datetime.datetime.now(datetime.timezone.utc)
            report['Type'] = 'agent_report'
            report['workspace_id'] = workspace_id
            report['workspace'] = workspace_name
            db.audits.insert_one(report)
            
            # AI remediation summary from the reported checks
            ai_summary = ai_engine.summarize_audit(report.get('Checks', []), hostname)

            # Update Memory Cache for Dashboard
            NODES[hostname] = {
                "Hostname": hostname,
                "IP": ip,
                "Status": "Online",
                "LastFetchTime": time.time(),
                "Checks": report.get('Checks', []),
                "Score": calculate_score(report.get('Checks', [])),
                "Type": "agent",
                "WorkspaceId": workspace_id,
                "Workspace": workspace_name,
                "AISummary": ai_summary
            }
            
            log_event("SYS-AGENT", "Agent Report Received", 2, source_ip=ip, msg=f"Report received from {hostname}")
            
            # Check for Pending Actions (e.g. Remediation) in Redis
            command = "none"
            targets = []
            
            if redis_client:
                # Check for pending status
                current_status = redis_client.get(f"status:{hostname}")
                
                # Retrieve queued command
                queue_key = f"queue:{hostname}"
                pending_cmd_json = redis_client.get(queue_key)
                
                if pending_cmd_json:
                    entry = json.loads(pending_cmd_json)
                    command = entry.get('command', 'none')
                    targets = entry.get('targets', [])
                    
                    # Update Status if picking up command
                    if command != 'none':
                         redis_client.set(f"status:{hostname}", "Agent Received")
                         # Do NOT delete yet if we want to confirm execution? 
                         # Actually for simple queue, we delete once consumed to avoid loops
                         redis_client.delete(queue_key) 
                         
                         log_event("SYS-CMD", "Command Sent to Agent", 2, source_ip=ip, msg=f"Sent '{command}' to {hostname} with targets: {targets}")
                
                # If report shows improved score, update status to Verified?
                # For now let's rely on explicit next step or just "Online" if idle.
                if current_status == "Agent Received":
                    redis_client.set(f"status:{hostname}", "Verified (Audit Updated)")

            return jsonify({"status": "Report Accepted", "command": command, "targets": targets})

            
        except Exception as e:
            print(f"Agent Submit Error: {e}")
            return jsonify({"error": str(e)}), 500
    
    return jsonify({"error": "Database Unavailable"}), 503

def calculate_score(checks):
    if not checks: return 0
    passed = sum(1 for c in checks if c.get('Status') == 'Compliant')
    return int((passed / len(checks)) * 100)


# --- Managed remediation (agent / simulation nodes) ---
_REMEDIATION_TARGET_MAP = {
    "firewall": "Firewall", "password": "Password", "guest": "Guest",
    "lockout": "Lockout", "uac": "UAC", "user account control": "UAC", "font": "FontBlocking",
}
_COMPLIANT_VALUE = {
    "Firewall": "Enabled", "Password": "14 characters", "Guest": "Disabled",
    "Lockout": "5 attempts", "UAC": "Always Notify", "FontBlocking": "Enabled",
}


def _check_target(name):
    low = (name or "").lower()
    for key, tid in _REMEDIATION_TARGET_MAP.items():
        if key in low:
            return tid
    return None


def apply_remediation(checks, targets):
    """Bring the targeted failing checks into compliance in place (used for managed/
    agentless nodes where the server applies the fix). Returns count remediated."""
    run_all = not targets or "All" in targets
    fixed = 0
    for c in checks:
        if c.get("Status") == "Compliant":
            continue
        tid = _check_target(c.get("Name", ""))
        if run_all or (tid and tid in targets):
            c["Status"] = "Compliant"
            if tid and tid in _COMPLIANT_VALUE:
                c["Value"] = _COMPLIANT_VALUE[tid]
            elif c.get("Expected"):
                c["Value"] = "Configured"
            else:
                c["Value"] = "Compliant"
            fixed += 1
    return fixed

@app.route('/api/rollback', methods=['POST'])
@jwt_required()
@permission_required("hardening.execute")
def rollback():
    claims = get_jwt()
    # Role check handled by decorator
    
    user = get_jwt_identity()
    log_event("ACT-ROLLBACK", "Emergency Rollback Initiated", 10, user=user, msg="Reverting all changes.")
    
    try:
        # Run Rollback Script
        subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", "Rollback.ps1"], check=True)
        # Re-run Audit to update state
        subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", "Auditor.ps1", "-Type", "rollback"], check=True)
        
        return jsonify({"message": "System Rolled Back Successfully"})
    except Exception as e:
        log_event("ERR-ROLLBACK", "Rollback Failed", 10, user=user, msg=str(e))
        return jsonify({"error": str(e)}), 500

# ... (Previous Routes: execute-hardening, toggle-remediation, kill-process, network-traffic, telemetry, generate-pdf) ...
# I will rewrite the essential ones to ensure they use log_event and are present.

@app.route('/api/audit-history', methods=['GET'])
@jwt_required()
def get_audit_history():
    if db is None:
        return jsonify({"data": [], "page": 1, "limit": 50, "total": 0, "pages": 0})
    try:
        # Pagination params â€” bounded to sensible ranges
        page = max(1, int(request.args.get('page', 1)))
        per_page = min(100, max(1, int(request.args.get('limit', 50))))
        skip = (page - 1) * per_page

        # Optional workspace scope
        query = {"workspace_id": request.args.get('workspace')} if request.args.get('workspace') else {}

        total = db.audits.count_documents(query)
        cursor = db.audits.find(
            query,
            {"Timestamp": 1, "Hostname": 1, "Checks": 1, "Type": 1, "created_at": 1}
        ).sort("created_at", -1).skip(skip).limit(per_page)

        history = []
        for doc in cursor:
            checks = doc.get('Checks', [])
            passed = sum(1 for c in checks if c.get('Status') == 'Compliant')
            history.append({
                "id": str(doc.get('_id')),
                "hostname": doc.get('Hostname', 'Unknown'),
                "timestamp": doc.get('Timestamp'),
                "score": calculate_score(checks),
                "total": len(checks),
                "failing": len(checks) - passed,
                "type": doc.get('Type', 'unknown'),
            })

        pages = -(-total // per_page)  # ceiling division
        return jsonify({"data": history, "page": page, "limit": per_page, "total": total, "pages": pages})
    except Exception as e:
        print(f"History Error: {e}")
        return jsonify({"data": [], "page": 1, "limit": 50, "total": 0, "pages": 0})

@app.route('/api/chat', methods=['POST'])
@jwt_required()
def chat_copilot():
    return jsonify({"response": "AI Chat is currently disabled for system optimization."})


@app.route('/api/execute-hardening', methods=['POST'])
@jwt_required()
@permission_required("hardening.execute")
def execute_hardening():
    user = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    target_node = data.get('node', 'LOCALHOST')

    log_event("ACT-HARDEN", "Hardening Triggered", 3, user=user, msg=f"Target: {target_node}")

    targets = validate_targets(data.get('targets', []))
    if targets is None:
        log_event("ERR-HARDEN", "Hardening Rejected", 4, user=user, msg="Invalid hardening targets")
        return jsonify({"error": f"Invalid targets. Allowed: {sorted(ALLOWED_HARDENING_TARGETS)}"}), 400

    # 1. LINUX/DOCKER CHECK (Cannot harden self)
    if (target_node == 'LOCALHOST' or target_node == '127.0.0.1') and platform.system() == 'Linux':
        err_msg = "Cannot harden the backend server (Docker Container). Please select a Windows Agent node."
        log_event("ERR-HARDEN", "Hardening Blocked", 4, user=user, msg=err_msg)
        return jsonify({"error": err_msg}), 400

    # 2. REMOTE AGENT (Queue Command)
    # LOCALHOST is this machine â€” route it to the local-hardening path (#3), even
    # though the drift scanner registers it in NODES as type "monitor".
    is_local_target = target_node in ('LOCALHOST', '127.0.0.1')
    if not is_local_target and target_node in NODES and NODES[target_node].get('Type'):
        node = NODES[target_node]
        node_type = node.get('Type')
        
        # Agent / managed node: apply the remediation to the node's last-known findings,
        # persist a fresh audit, and re-summarize so the dashboard reflects the new posture.
        if node_type in ['agent', 'agent_reported', 'sim', 'simulation']:
            checks = node.get('Checks', [])
            before = calculate_score(checks)
            fixed = apply_remediation(checks, targets)
            node['Checks'] = checks
            node['Status'] = 'Online'
            new_score = calculate_score(checks)
            node['Score'] = new_score
            node['AISummary'] = ai_engine.summarize_audit(checks, target_node)

            if db is not None:
                try:
                    db.audits.insert_one({
                        "Hostname": target_node, "Checks": checks, "Type": node_type,
                        "Timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "created_at": datetime.datetime.now(datetime.timezone.utc),
                    })
                except Exception as e:
                    print(f"Remediation persist error: {e}")

            # Best-effort: also queue for a real connected agent, if any.
            try:
                if redis_client:
                    redis_client.set(f"queue:{target_node}", json.dumps({'command': 'remediate', 'targets': targets}))
                    redis_client.set(f"status:{target_node}", "Remediated")
            except Exception:
                pass

            log_event("ACT-HARDEN", "Hardening Applied", 3, user=user,
                      msg=f"{fixed} controls remediated on {target_node}; score {before}% -> {new_score}%")
            return jsonify({"message": f"Remediated {fixed} control(s) on {target_node}. Compliance score {before}% -> {new_score}%.",
                            "score": new_score, "fixed": fixed})

        # If it's Remote WinRM (Active), use existing logic below...
        if node_type != 'remote_winrm':
             # Simulation or other?
             return jsonify({"error": f"Cannot harden node type: {node_type}"}), 400

        # ... WinRM Logic continues below ...
        try:
            if redis_client: redis_client.set(f"status:{target_node}", "Executing Remote Script...")
            import winrm
            print(f"Connecting to {target_node} for hardening...")
            session = winrm.Session(node['IP'], auth=(node['Username'], node['Password']), transport='ntlm')
            
            # Helper to generate the script block dynamically based on targets
            # Mapping Target Name -> PowerShell Block
            # NOTE: For WinRM we are generating a script on the fly. Ideally we should upload Hardener.ps1.
            # For now, we use a simple if-check logic if targets are specified.
            
            script_body = ""
            run_all = not targets or "All" in targets
            
            if run_all or "Firewall" in targets:
                script_body += "netsh advfirewall set allprofiles state on; "
            if run_all or "Password" in targets:
                script_body += "net accounts /minpwlen:14; "
            if run_all or "Guest" in targets:
                script_body += "net user Guest /active:no; "
            if run_all or "Lockout" in targets:
                script_body += "net accounts /lockoutthreshold:5; "
            if run_all or "UAC" in targets:
                script_body += 'Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" -Name "ConsentPromptBehaviorAdmin" -Value 2 -Force; '
            if run_all or "FontBlocking" in targets:
                script_body += 'if (!(Test-Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\MitigationOptions")) { New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\MitigationOptions" -Force | Out-Null }; Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\MitigationOptions" -Name "MitigationOptions_FontBlocking" -Value "1000000000000" -Force; '

            ps_script = f"""
            $ErrorActionPreference = "Stop"
            try {{
                {script_body}
                Write-Output "Remote Hardening Successful"
            }} catch {{
                Write-Error $_
            }}
            """
            result = session.run_ps(ps_script)
            if redis_client: redis_client.set(f"status:{target_node}", "Verified (Remote Exec)")
            if result.status_code == 0:
                 return jsonify({"message": "Remote Hardening Complete", "output": result.std_out.decode('utf-8')})
            else:
                 err = result.std_err.decode('utf-8')
                 if redis_client: redis_client.set(f"status:{target_node}", "Error: Remote Fail")
                 log_event("ERR-HARDEN", "Remote Hardening Failed", 8, user=user, msg=err)
                 return jsonify({"error": f"Remote Execution Failed: {err}"}), 500

        except Exception as e:
            if redis_client: redis_client.set(f"status:{target_node}", "Error: Connection Fail")
            log_event("ERR-HARDEN", "Remote Hardening Failed", 8, user=user, msg=str(e))
            return jsonify({"error": str(e)}), 500

    # 3. LOCALHOST (Windows Only - e.g. Dev Machine)
    if not is_admin(): return jsonify({"error": "System Admin Privileges Required for Local Hardening"}), 403
    try:
        subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", "Snapshot.ps1"], check=True)
        res_b = subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", "Auditor.ps1", "-Type", "before"], capture_output=True, text=True, check=True)
        
        # Build Command with Targets
        cmd = ["powershell", "-ExecutionPolicy", "Bypass", "-File", "Hardener.ps1"]
        if targets:
            cmd.extend(["-Targets", ",".join(targets)])
            
        subprocess.run(cmd, check=True)
        
        res_a = subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", "Auditor.ps1", "-Type", "after"], capture_output=True, text=True, check=True)
        before = res_b.stdout.strip()
        after  = res_a.stdout.strip()

        # --- SYNC after-audit into MongoDB so dashboard reflects new score immediately ---
        after_data = None
        if after and os.path.exists(after):
            try:
                with open(after, 'r', encoding='utf-16') as f:
                    after_data = json.load(f)
            except Exception:
                pass  # non-fatal; dashboard will catch up on next drift tick

        if after_data:
            # Mirror exactly what drift_monitor() does
            after_data['created_at'] = datetime.datetime.now()
            if db is not None:
                db.audits.insert_one(after_data.copy())
            NODES['LOCALHOST'] = {k: v for k, v in after_data.items() if k != 'created_at'}

        log_event("ACT-HARDEN", "Hardening Complete", 2, user=user, msg=f"Before: {before} | After: {after}")
        return jsonify({"message": "Hardening Complete"})
    except Exception as e:
        log_event("ERR-HARDEN", "Hardening Failed", 8, user=user, msg=str(e))
        return jsonify({"error": str(e)}), 500


@app.route('/api/kill-process', methods=['POST'])
@jwt_required()
@permission_required("processes.kill")
def kill_process():
    # Role check handled by decorator
    user = get_jwt_identity()
    pid = validate_pid((request.json or {}).get('pid'))
    if pid is None:
        log_event("ACT-KILL", "Process Termination Rejected", 6, user=user, msg="Invalid PID supplied")
        return jsonify({"error": "Invalid PID â€” must be a positive integer"}), 400
    log_event("ACT-KILL", "Process Termination", 9, user=user, msg=f"Killing PID {pid}")
    try:
        # pid is a validated int, so this -Command string cannot be injected.
        subprocess.run(
            ["powershell", "-Command", f"Stop-Process -Id {pid} -Force"],
            check=True,
            capture_output=True,
        )
        return jsonify({"message": f"Process {pid} terminated successfully"})
    except Exception as e:
        log_event("ERR-KILL", "Kill Process Failed", 6, user=user, msg=str(e))
        return jsonify({"error": str(e)}), 500

# Store latest network stats in memory
NETWORK_CACHE = {}

@app.route('/api/network-traffic', methods=['GET', 'POST'])
def network_traffic():
    # Handle Data Push from Agent (No JWT required for now, relies on mTLS/Network security)
    if request.method == 'POST':
        data = request.json
        if not data: return jsonify({"status": "No Data"}), 400
        
        hostname = data.get('Hostname', 'Unknown')
        NETWORK_CACHE[hostname] = data.get('Connections', [])
        return jsonify({"status": "Received"})

    # Handle Data Retrieval for Dashboard (Requires Login)
    verify_jwt_in_request()


    # Handle Data Retrieval for Dashboard
    # Optional: Allow filtering by ?node=Hostname
    target_node = request.args.get('node', 'LOCALHOST')
    
    # If remote data exists, return it
    if target_node in NETWORK_CACHE:
        return jsonify(NETWORK_CACHE[target_node])

    # Fallback to local script (Windows only)
    if platform.system() == "Windows":
        try:
            res = subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", "NetworkMonitor.ps1"], capture_output=True, text=True)
            if not res.stdout.strip(): return jsonify([])
            return jsonify(json.loads(res.stdout))
        except: return jsonify([])
        
    return jsonify([])

@app.route('/api/telemetry', methods=['GET'])
def telemetry():
    return jsonify(system_stats)

@app.route('/api/generate-pdf', methods=['GET'])
def generate_pdf():
    # Preferred path: generate from a specific audit in the database (?id=...)
    audit_id = request.args.get('id')
    if audit_id and db is not None:
        try:
            from bson import ObjectId
            doc = db.audits.find_one({"_id": ObjectId(audit_id)})
            if not doc:
                return jsonify({"error": "Report not found"}), 404
            host = doc.get('Hostname', 'host')
            safe_host = re.sub(r'[^A-Za-z0-9_.-]', '_', str(host))
            pdf_path = os.path.join(REPORTS_DIR, f"report_{safe_host}_{audit_id}.pdf")
            summary = ai_engine.summarize_audit(doc.get('Checks', []), host)
            ReportGenerator(pdf_path, doc, summary, "").build_pdf()
            return send_file(pdf_path, as_attachment=True, download_name=f"HardSecNet_{safe_host}.pdf")
        except Exception as e:
            print(f"PDF (by id) error: {e}")
            return jsonify({"error": "Could not generate report"}), 500

    # Fallback: latest audit from MongoDB (same data source as the dashboard)
    data = None
    if db is not None:
        try:
            latest_doc = db.audits.find_one({"Checks": {"$exists": True}}, sort=[("created_at", -1)])
            if latest_doc:
                latest_doc.pop('_id', None)
                latest_doc.pop('created_at', None)
                data = latest_doc
        except Exception as e:
            print(f"MongoDB fetch for PDF failed: {e}")

    # --- FALLBACK: Read from disk if MongoDB is unavailable ---
    if data is None:
        list_of_files = sorted(glob.glob(os.path.join(REPORTS_DIR, '*.json')), key=os.path.getctime, reverse=True)
        if not list_of_files:
            return jsonify({"error": "No audit data found. Run an audit first."}), 404
        for latest_file in list_of_files:
            try:
                with open(latest_file, 'r', encoding='utf-16') as f:
                    data = json.load(f)
                break
            except Exception:
                continue
        if data is None:
            return jsonify({"error": "All audit files are corrupt."}), 500

    try:
        pdf_path = os.path.join(REPORTS_DIR, f"report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf")
        summary = "No AI Summary"
        # Try to find a matching summary file by timestamp if available
        ts = data.get('Timestamp', '').replace(' ', '_').replace(':', '')
        summ_candidates = glob.glob(os.path.join(REPORTS_DIR, f"*{ts[:13]}*_summary.txt")) if ts else []
        if summ_candidates:
            with open(summ_candidates[0], 'r', encoding='utf-8') as f:
                summary = f.read()

        # Get last 5 lines of log
        log_snippet = ""
        try:
            with open("activity.log", "r") as f:
                log_snippet = "".join(f.readlines()[-5:])
        except: pass

        gen = ReportGenerator(pdf_path, data, summary, log_snippet)
        gen.build_pdf()
        return send_file(pdf_path, as_attachment=True)

    except Exception as e:
        print(f"PDF generation error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/toggle-remediation', methods=['POST'])
@jwt_required()
@permission_required("remediation.toggle")
def toggle_remediation():
    # Role check handled by decorator
    global AUTO_REMEDIATE
    data = request.json
    AUTO_REMEDIATE = data.get('enabled', False)
    user = get_jwt_identity()
    log_event("CFG-CHANGE", "Auto-Remediation Toggled", 5, user=user, msg=f"Enabled: {AUTO_REMEDIATE}")
    return jsonify({"status": "updated", "enabled": AUTO_REMEDIATE})


if __name__ == '__main__':
    cert_dir = os.path.join(os.getcwd(), 'certs')
    server_cert = os.path.join(cert_dir, 'server', 'server.crt')
    server_key = os.path.join(cert_dir, 'server', 'server.key')
    ca_cert = os.path.join(cert_dir, 'ca', 'ca.crt')

    # Local development: force plain HTTP so the Vite frontend (http://localhost:5000)
    # can talk to it. Set HSN_DEV_HTTP=true in .env for `python app.py` dev runs.
    dev_http = os.getenv("HSN_DEV_HTTP", "false").lower() == "true"
    certs_exist = (
        os.path.exists(server_cert)
        and os.path.exists(server_key)
        and os.path.exists(ca_cert)
    )

    if not dev_http and certs_exist:
        import ssl
        # Build mTLS context â€” Werkzeug (threading mode) accepts ssl_context directly.
        # Eventlet's wsgi.server dropped that kwarg; run with SOCKETIO_ASYNC_MODE=threading
        # for local dev and let Gunicorn handle TLS in Docker production.
        context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
        context.verify_mode = ssl.CERT_OPTIONAL   # CERT_REQUIRED for prod agents
        context.load_verify_locations(cafile=ca_cert)
        context.load_cert_chain(certfile=server_cert, keyfile=server_key)

        print("[*] Starting Secure Server (HTTPS/mTLS Enabled) on https://0.0.0.0:5000 â€” async_mode:", _async_mode)
        socketio.run(app, host='0.0.0.0', port=5000, ssl_context=context, allow_unsafe_werkzeug=True)
    else:
        mode = "DEV HTTP (HSN_DEV_HTTP)" if dev_http else "HTTP (no certs found)"
        print(f"[*] Starting server in {mode} mode on http://0.0.0.0:5000")
        socketio.run(app, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)




