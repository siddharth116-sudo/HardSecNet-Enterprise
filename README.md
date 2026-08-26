# HardSecNet

**HardSecNet is a security posture, CIS compliance, and endpoint hardening platform for small and mid-sized environments.**

It continuously collects endpoint posture, maps findings to security baselines, explains risk, provides controlled remediation, and keeps an audit trail from a central web console.

This repository is the **canonical project**. The older PySide, duplicate web, and prototype repositories are treated as historical references, not separate products.

## Product

HardSecNet is organized around one workflow:

1. **Enroll** a Windows or Linux endpoint.
2. **Audit** its security posture.
3. **Score** compliance and identify failing controls.
4. **Explain** findings with deterministic remediation guidance or optional AI.
5. **Remediate** selected controls with explicit authorization.
6. **Verify** through the next endpoint audit.
7. **Report** the evidence through the dashboard and PDF export.

### Target customer

The strongest initial product position is **SMB / managed-service security operations**, not a general-purpose enterprise SIEM.

The MVP should win on:

- CIS-aligned endpoint hardening
- simple deployment
- continuous posture visibility
- evidence-backed remediation
- Windows + Linux support
- clear compliance reporting

## Architecture

```text
                         ┌──────────────────────┐
                         │  Operator / Security  │
                         │      Dashboard       │
                         └──────────┬───────────┘
                                    │ JWT / REST / WS
                                    ▼
                         ┌──────────────────────┐
                         │   Flask Control Plane │
                         │ auth / RBAC / API     │
                         └───────┬───────┬──────┘
                                 │       │
                         ┌───────▼───┐ ┌─▼────────┐
                         │ MongoDB   │ │  Redis   │
                         │ state/audit│ │ queue/cache│
                         └───────────┘ └────┬──────┘
                                            │
                         ┌──────────────────▼─────────────────┐
                         │         Endpoint Agents            │
                         │ Windows / Linux / scheduled audit  │
                         └───────────────┬────────────────────┘
                                         │
                         ┌───────────────▼────────────────────┐
                         │ Audit → Findings → Remediation     │
                         │ CIS Windows 11 + Linux checks      │
                         └────────────────────────────────────┘

Optional:
AI: Ollama / Claude
Alerts: Slack / Teams / Discord / Webhooks
Marketing site: website/
```

## Repository layout

| Path | Purpose |
|---|---|
| `app.py` | Flask control plane and API |
| `ai_engine.py` | AI + deterministic remediation explanations |
| `cis_engine.py` | CIS Windows 11 benchmark execution |
| `linux_auditor.py` | Linux posture checks |
| `agent/` | Dependency-free Windows/Linux endpoint agent |
| `cis_benchmarks/` | CIS benchmark metadata and control scripts |
| `Dashboard/` | Authenticated React operations console |
| `website/` | Public product/marketing site |
| `ReportGenerator.py` | PDF evidence reports |
| `crypto_util.py` | Encryption for stored node secrets |
| `deployment/` | Docker, Nginx, Caddy, MongoDB and Redis |
| `tests/` | Automated tests |
| `docs/` | Product, architecture and operating documentation |

## Important security rule

**Never commit `.env`, private keys, certificates, generated reports, machine snapshots, databases, or credentials.**

The uploaded historical projects contained generated artifacts and secret material. The canonical repository intentionally excludes those files.

## Local development

### Prerequisites

- Windows 10/11 for local Windows auditing/hardening
- Python 3.12 recommended
- Node.js 20+
- MongoDB
- Redis
- PowerShell 5.1+ or PowerShell 7+

### 1. Backend

```powershell
cd HardSecNet-Enterprise

python -m venv .venv
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt

Copy-Item .env.example .env
```

Generate a strong secret:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Put the generated value into `JWT_SECRET_KEY` in `.env`.

For local development, use:

```text
HSN_DEV_HTTP=true
FLASK_DEBUG=0
MONGO_URI=mongodb://localhost:27017/
REDIS_URL=redis://localhost:6379/0
HSN_AI_MODE=off
AGENT_API_KEY=local-development-key
```

Start the API:

```powershell
python app.py
```

Health check:

```text
http://localhost:5000/api/health
```

### 2. Dashboard

Open a second PowerShell:

```powershell
cd HardSecNet-Enterprise\Dashboard
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

On the first backend start, create/use the bootstrap admin configured through `.env`. Change that password immediately after first login.

### 3. Run an endpoint agent

From the project root:

```powershell
python agent\hardsecnet_agent.py --server http://localhost:5000 --key local-development-key --once
```

The endpoint should then appear in the dashboard.

For continuous collection:

```powershell
python agent\hardsecnet_agent.py --server http://localhost:5000 --key local-development-key --interval 600
```

For a client workspace, add:

```powershell
--workspace-token <CLIENT_WORKSPACE_TOKEN>
```

## Full production path

For a real deployment, use the Docker stack:

```powershell
cd deployment
Copy-Item .env.example .env
```

Configure:

- `DOMAIN`
- `MONGO_USER`
- `MONGO_PASSWORD`
- `JWT_SECRET_KEY`
- `BOOTSTRAP_ADMIN_PASSWORD`
- `AGENT_API_KEY`

Then:

```powershell
docker compose up -d --build
```

The production architecture is:

```text
Internet
   ↓
Caddy HTTPS
   ↓
Nginx
   ├── React dashboard
   └── /api + /socket.io
          ↓
       Flask
       ├── MongoDB
       └── Redis
```

See `deployment/DEPLOYMENT.md` for the cloud deployment runbook.

## Endpoint installation

### Windows

The agent is intentionally dependency-free.

Run once:

```powershell
python agent\hardsecnet_agent.py --server https://YOUR_DOMAIN --key YOUR_AGENT_KEY --workspace-token YOUR_WORKSPACE_TOKEN --once
```

Install as a scheduled task:

```powershell
.\agent\install.ps1 -Server https://YOUR_DOMAIN -Key YOUR_AGENT_KEY -WorkspaceToken YOUR_WORKSPACE_TOKEN -IntervalMinutes 10
```

### Linux

Run once:

```bash
python3 agent/hardsecnet_agent.py --server https://YOUR_DOMAIN --key YOUR_AGENT_KEY --workspace-token YOUR_WORKSPACE_TOKEN --once
```

Install the systemd service:

```bash
sudo ./agent/install.sh https://YOUR_DOMAIN YOUR_AGENT_KEY YOUR_WORKSPACE_TOKEN 600
```

## Testing

Backend/unit tests:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

Frontend:

```powershell
cd Dashboard
npm run build
npm run lint
```

## Product boundaries

This is a security-hardening product, not an offensive security platform.

The system should:

- audit defensive configuration
- identify drift
- provide controlled remediation
- preserve evidence
- enforce authorization
- keep secrets out of source control

It should not evolve into an unrestricted remote command execution platform.

## Product roadmap

### V1 — Final-year / portfolio release

- Windows CIS auditing
- Linux auditing
- endpoint agent
- dashboard
- authentication/RBAC
- remediation workflow
- audit history
- PDF evidence
- Docker deployment
- public marketing site

### V1.1 — Pilot readiness

- stronger agent enrollment
- persistent command/job state
- immutable audit event model
- better remediation verification
- backup/restore procedures
- observability and metrics
- installer/package distribution

### V2 — Commercial platform

- multi-tenant isolation
- policy packs
- scheduled compliance campaigns
- alert routing
- organization-wide reporting
- billing/subscription layer
- agent update channel
- cloud-hosted control plane

## Project status

The codebase is a **production-oriented final-year project / pilot MVP**, not a claim of enterprise certification.

Generated benchmark remediation scripts must be reviewed and tested before deployment to production systems.
