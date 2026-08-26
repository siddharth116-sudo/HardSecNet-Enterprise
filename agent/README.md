# HardSecNet Agent

A small, **dependency-free** (Python stdlib only) agent that audits a host and reports
its security posture to the HardSecNet server. Works on **Windows** and **Linux**.

## What it sends
It runs a local audit (Windows: firewall, UAC, guest account, password policy, lockout;
Linux: SSH config, firewall, patching, account hygiene) and POSTs the findings to
`{server}/api/submit-report`. The node then appears on the dashboard with an AI summary,
and you can remediate it from there.

## Requirements
- Python 3.9+ on the target host (no `pip install` needed — stdlib only).
- Network access to the HardSecNet server.
- If the server sets `AGENT_API_KEY`, the agent must be given the same key.

## Quick test (no install)
```bash
# Linux
python3 hardsecnet_agent.py --server https://your-server --key <AGENT_KEY> --workspace-token <CLIENT_TOKEN> --once
```
```powershell
# Windows
python hardsecnet_agent.py --server https://your-server --key <AGENT_KEY> --workspace-token <CLIENT_TOKEN> --once
```
`--workspace-token` enrolls the host into a client workspace (copy it from the
dashboard's **Clients** view). Add `--insecure` only for self-signed/dev certs.

## Install as a service (the production way)
`--once` is for testing. Installed agents audit **continuously** — any change on
the host (firewall toggled, policy edited) shows up on the dashboard within one
interval, no manual runs.

### Linux (systemd)
```bash
sudo ./install.sh https://your-server <AGENT_KEY> <CLIENT_TOKEN> 600
#   -> installs to /opt/hardsecnet-agent, runs continuously, audits every 600s
systemctl status hardsecnet-agent
```

### Windows (Scheduled Task, run elevated)
```powershell
.\install.ps1 -Server https://your-server -Key <AGENT_KEY> -WorkspaceToken <CLIENT_TOKEN> -IntervalMinutes 10
#   -> registers the "HardSecNet Agent" task, audits every 10 minutes as SYSTEM
```

## Configuration (env vars)
| Variable | Meaning | Default |
| :--- | :--- | :--- |
| `HSN_SERVER` | Server base URL | `http://localhost:5000` |
| `HSN_AGENT_KEY` | Shared agent key (`X-Agent-Key`) | _(none)_ |
| `HSN_WORKSPACE_TOKEN` | Client workspace enrollment token (`X-Workspace-Token`) | _(none)_ |
| `HSN_INTERVAL` | Seconds between audits (loop mode) | `600` |
| `HSN_HOSTNAME` | Override reported hostname | machine name |
