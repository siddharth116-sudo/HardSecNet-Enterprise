#!/usr/bin/env bash
# HardSecNet agent installer (Linux).
# Usage:  sudo ./install.sh <SERVER_URL> [AGENT_KEY] [WORKSPACE_TOKEN] [INTERVAL_SECONDS]
# Example: sudo ./install.sh https://hardsecnet.example.com my-agent-key client-token 600
set -euo pipefail

SERVER="${1:?Usage: sudo ./install.sh <SERVER_URL> [AGENT_KEY] [WORKSPACE_TOKEN] [INTERVAL]}"
KEY="${2:-}"
WORKSPACE_TOKEN="${3:-}"
INTERVAL="${4:-600}"

INSTALL_DIR="/opt/hardsecnet-agent"
ENV_FILE="/etc/hardsecnet-agent.env"
PY="$(command -v python3 || true)"
[ -n "$PY" ] || { echo "python3 is required"; exit 1; }

echo "[*] Installing HardSecNet agent to ${INSTALL_DIR}"
install -d "$INSTALL_DIR"
install -m 0755 "$(dirname "$0")/hardsecnet_agent.py" "$INSTALL_DIR/"
install -m 0644 "$(dirname "$0")/linux_auditor.py" "$INSTALL_DIR/"

cat > "$ENV_FILE" <<EOF
HSN_SERVER=${SERVER}
HSN_AGENT_KEY=${KEY}
HSN_WORKSPACE_TOKEN=${WORKSPACE_TOKEN}
HSN_INTERVAL=${INTERVAL}
EOF
chmod 600 "$ENV_FILE"

cat > /etc/systemd/system/hardsecnet-agent.service <<EOF
[Unit]
Description=HardSecNet host agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
EnvironmentFile=${ENV_FILE}
ExecStart=${PY} ${INSTALL_DIR}/hardsecnet_agent.py
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now hardsecnet-agent.service
echo "[OK] HardSecNet agent installed and running. Check: systemctl status hardsecnet-agent"
