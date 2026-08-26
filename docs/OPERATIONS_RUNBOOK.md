# HardSecNet Operations Runbook

## Developer flow

```text
Start MongoDB + Redis
        ↓
Start Flask API
        ↓
Start React dashboard
        ↓
Open dashboard
        ↓
Authenticate
        ↓
Enroll endpoint
        ↓
Run agent audit
        ↓
Review findings
        ↓
Select remediation
        ↓
Agent receives command
        ↓
Agent applies remediation
        ↓
Agent audits again
        ↓
Dashboard verifies posture
        ↓
Export evidence
```

## Do not skip verification

A remediation response from the control plane is not proof that the operating-system setting changed.

The authoritative state is the **post-remediation endpoint audit**.

Therefore the product workflow should always be:

`requested → dispatched → applied → re-audited → verified`

## Local troubleshooting

### API does not start

Check:

```powershell
python --version
python -c "import flask, pymongo, redis; print('dependencies ok')"
```

Then:

```powershell
python app.py
```

### Dashboard cannot reach API

Check:

```powershell
Invoke-WebRequest http://localhost:5000/api/health
```

Then confirm `Dashboard/.env` points to:

```text
VITE_API_BASE_URL=http://localhost:5000
```

### Agent report rejected

Confirm:

- API is reachable
- `AGENT_API_KEY` matches
- the agent uses the same key
- MongoDB is running
- the JSON report contains `Hostname` and `Checks`

### Windows audit fails

Run the agent from an elevated PowerShell session and verify:

```powershell
Get-NetFirewallProfile
Get-LocalUser -Name Guest
net accounts
```

### Linux audit fails

Verify the agent can read:

```text
/etc/ssh/sshd_config
/etc/passwd
/etc/shadow
```

Some checks require root privileges.

## Production incident principle

Never use the dashboard as an unrestricted shell.

Every remediation action should remain:

- authenticated
- authorized
- scoped
- logged
- reviewable
- followed by verification
