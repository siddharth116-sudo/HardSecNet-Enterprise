import os
import socket

import pytest


def _mongo_up():
    s = socket.socket()
    s.settimeout(0.5)
    try:
        s.connect(("127.0.0.1", 27017))
        return True
    except Exception:
        return False
    finally:
        s.close()


pytestmark = pytest.mark.skipif(not _mongo_up(), reason="MongoDB not reachable on 127.0.0.1:27017")


@pytest.fixture(scope="module")
def backend():
    # Configure a throwaway test database before importing the app.
    os.environ["JWT_SECRET_KEY"] = "test-jwt-secret"
    os.environ["MONGO_URI"] = "mongodb://localhost:27017/"
    os.environ["DB_NAME"] = "hardsecnet_test"
    os.environ["BOOTSTRAP_ADMIN_PASSWORD"] = "TestAdminPass123"
    os.environ["RATELIMIT_ENABLED"] = "false"  # don't rate-limit the test suite
    from pymongo import MongoClient
    MongoClient("mongodb://localhost:27017/")["hardsecnet_test"]["users"].drop()
    import app as backend_module
    return backend_module


@pytest.fixture()
def client(backend):
    return backend.app.test_client()


def _token(client):
    r = client.post("/api/login", json={"username": "admin", "password": "TestAdminPass123"})
    body = r.get_json()
    return body["access_token"], body.get("refresh_token")


# ---- pure helpers (live in app.py) ----
def test_validate_pid_rejects_injection(backend):
    assert backend.validate_pid("1234") == 1234
    assert backend.validate_pid("1; Remove-Item C:/ -Recurse") is None
    assert backend.validate_pid("-5") is None


def test_validate_targets_allowlist(backend):
    assert backend.validate_targets(["Firewall", "UAC"]) == ["Firewall", "UAC"]
    assert backend.validate_targets(["; calc.exe"]) is None


def test_validate_host(backend):
    assert backend.validate_host("10.0.0.5") == "10.0.0.5"
    assert backend.validate_host("a;b|c") is None


def test_apply_remediation(backend):
    checks = [
        {"Name": "Firewall Domain Profile", "Value": "Disabled", "Status": "Action Required"},
        {"Name": "User Account Control (UAC)", "Value": "0", "Status": "Action Required"},
        {"Name": "Guest Account Status", "Value": "Enabled", "Status": "Action Required"},
    ]
    fixed = backend.apply_remediation(checks, ["Firewall", "UAC"])  # targeted
    assert fixed == 2
    assert sum(1 for c in checks if c["Status"] != "Compliant") == 1  # Guest still failing


# ---- endpoints ----
def test_login_issues_access_and_refresh(client):
    access, refresh = _token(client)
    assert access and refresh


def test_bad_login_rejected(client):
    assert client.post("/api/login", json={"username": "admin", "password": "wrong"}).status_code == 401


def test_refresh_returns_new_access(client):
    _, refresh = _token(client)
    r = client.post("/api/refresh", headers={"Authorization": f"Bearer {refresh}"})
    assert r.status_code == 200 and r.get_json().get("access_token")


def test_kill_process_rejects_injection(client):
    access, _ = _token(client)
    r = client.post("/api/kill-process", json={"pid": "1; rm -rf /"},
                    headers={"Authorization": f"Bearer {access}"})
    assert r.status_code == 400


def test_webhook_ssrf_guard(client):
    access, _ = _token(client)
    H = {"Authorization": f"Bearer {access}"}
    assert client.post("/api/integrations/webhook/test", json={"url": "http://hooks.slack.com/x"}, headers=H).status_code == 400
    assert client.post("/api/integrations/webhook/test", json={"url": "https://localhost/x"}, headers=H).status_code == 400
    assert client.post("/api/integrations/webhook/test", json={"url": "https://10.0.0.5/x"}, headers=H).status_code == 400


def test_change_password_enforces_min_length(client):
    access, _ = _token(client)
    r = client.post("/api/change-password",
                    json={"current_password": "TestAdminPass123", "new_password": "short"},
                    headers={"Authorization": f"Bearer {access}"})
    assert r.status_code == 400


def test_agent_report_requires_key_when_configured(client, monkeypatch):
    report = {"Hostname": "AGENT-T", "Checks": [{"Name": "x", "Value": "y", "Status": "Compliant"}]}
    # No key configured -> open (backward compatible)
    monkeypatch.delenv("AGENT_API_KEY", raising=False)
    assert client.post("/api/submit-report", json=report).status_code in (200, 503)
    # Key configured -> must match
    monkeypatch.setenv("AGENT_API_KEY", "k3y")
    assert client.post("/api/submit-report", json=report).status_code == 401
    assert client.post("/api/submit-report", json=report, headers={"X-Agent-Key": "wrong"}).status_code == 401
    assert client.post("/api/submit-report", json=report, headers={"X-Agent-Key": "k3y"}).status_code in (200, 503)


# ---- multi-client workspaces ----
def test_workspace_create_enroll_and_filter(client, monkeypatch):
    monkeypatch.delenv("AGENT_API_KEY", raising=False)
    access, _ = _token(client)
    H = {"Authorization": f"Bearer {access}"}

    # create a client workspace -> gets an enrollment token
    r = client.post("/api/workspaces", json={"name": "Acme WS Test"}, headers=H)
    assert r.status_code == 201
    ws = r.get_json()
    assert ws["name"] == "Acme WS Test" and ws["enrollment_token"]
    wid, wtoken = ws["id"], ws["enrollment_token"]

    # an agent presenting the token enrolls into that workspace
    rep = {"Hostname": "acme-ws-host", "Checks": [{"Name": "Firewall", "Value": "Disabled", "Status": "Action Required"}]}
    assert client.post("/api/submit-report", json=rep, headers={"X-Workspace-Token": wtoken}).status_code in (200, 503)

    # the workspace list reflects the node
    wl = client.get("/api/workspaces", headers=H).get_json()
    acme = next(w for w in wl if w["id"] == wid)
    assert acme["node_count"] >= 1

    # /api/nodes?workspace=<id> returns only that client's host
    scoped = client.get(f"/api/nodes?workspace={wid}", headers=H).get_json()
    assert "acme-ws-host" in scoped
    assert "LOCALHOST" not in scoped  # LOCALHOST is the default workspace, not Acme


def test_workspace_create_requires_name(client):
    access, _ = _token(client)
    r = client.post("/api/workspaces", json={"name": ""}, headers={"Authorization": f"Bearer {access}"})
    assert r.status_code == 400
