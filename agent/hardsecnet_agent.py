#!/usr/bin/env python3
"""HardSecNet host agent â€” a dependency-free (stdlib-only) auditor that reports to
the HardSecNet server.

Audits the local host (Windows or Linux) and POSTs the findings to
{server}/api/submit-report. Configure via environment variables or CLI flags:

  HSN_SERVER     base URL of the server, e.g. https://hardsecnet.example.com:5000
  HSN_AGENT_KEY  shared agent key (sent as X-Agent-Key; required if the server sets one)
  HSN_INTERVAL   seconds between audits in loop mode (default 600)
  HSN_HOSTNAME   override the reported hostname (default: this machine's name)

Usage:
  python hardsecnet_agent.py --once                 # audit + report once, then exit
  python hardsecnet_agent.py                         # loop every HSN_INTERVAL seconds
  python hardsecnet_agent.py --server https://h:5000 --key abc --once
"""
import argparse
import json
import os
import platform
import ssl
import subprocess
import sys
import time
import urllib.request

IS_WINDOWS = platform.system() == "Windows"

WINDOWS_AUDIT_PS = r"""
$ErrorActionPreference='SilentlyContinue'
$checks=@()

foreach($p in (Get-NetFirewallProfile)){
  $on=$p.Enabled
  $checks += [PSCustomObject]@{
    Name="Firewall $($p.Name) Profile"
    Value=if($on){"Enabled"}else{"Disabled"}
    Status=if($on){"Compliant"}else{"Action Required"}
  }
}

$u=(Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System' -Name ConsentPromptBehaviorAdmin).ConsentPromptBehaviorAdmin
$checks += [PSCustomObject]@{
  Name="User Account Control (UAC)"
  Value=if($u -eq 2){"Always Notify"}else{"Level $u"}
  Status=if($u -eq 2){"Compliant"}else{"Action Required"}
}

$g=(Get-LocalUser -Name Guest).Enabled
$checks += [PSCustomObject]@{
  Name="Guest Account Status"
  Value=if($g){"Enabled"}else{"Disabled"}
  Status=if($g){"Action Required"}else{"Compliant"}
}

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator
)

if ($isAdmin) {
  $cfg = Join-Path $env:TEMP "hardsecnet-policy-$([guid]::NewGuid()).cfg"

  try {
    secedit /export /cfg $cfg /quiet | Out-Null

    if ($LASTEXITCODE -eq 0 -and (Test-Path $cfg)) {
      $policy = Get-Content $cfg -ErrorAction Stop

      $ml = 0
      $lt = 0

      $match = $policy | Select-String '^MinimumPasswordLength\s*=\s*(\d+)'
      if ($match) {
        $ml = [int]$match.Matches[0].Groups[1].Value
      }

      $match = $policy | Select-String '^LockoutBadCount\s*=\s*(\d+)'
      if ($match) {
        $lt = [int]$match.Matches[0].Groups[1].Value
      }

      $checks += [PSCustomObject]@{
        Name="Minimum Password Length"
        Value="$ml characters"
        Status=if($ml -ge 14){"Compliant"}else{"Action Required"}
      }

      $checks += [PSCustomObject]@{
        Name="Account Lockout Threshold"
        Value="$lt attempts"
        Status=if($lt -gt 0 -and $lt -le 5){"Compliant"}else{"Action Required"}
      }
    }
    else {
      $checks += [PSCustomObject]@{
        Name="Password Policy Collection"
        Value="secedit export failed."
        Status="Unknown"
      }
    }
  }
  catch {
    $checks += [PSCustomObject]@{
      Name="Password Policy Collection"
      Value="Unable to read local security policy."
      Status="Unknown"
    }
  }
  finally {
    Remove-Item $cfg -Force -ErrorAction SilentlyContinue
  }
}
else {
  $checks += [PSCustomObject]@{
    Name="Minimum Password Length"
    Value="Administrator privileges required"
    Status="Unknown"
  }

  $checks += [PSCustomObject]@{
    Name="Account Lockout Threshold"
    Value="Administrator privileges required"
    Status="Unknown"
  }
}

[PSCustomObject]@{
  Hostname=$env:COMPUTERNAME
  Type="agent_report"
  Checks=$checks
} | ConvertTo-Json -Depth 5
"""


def gather():
    """Return an audit report dict {Hostname, Type, Checks:[...]} for this host."""
    if IS_WINDOWS:
        proc = subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass",
                               "-Command", WINDOWS_AUDIT_PS],
                              capture_output=True, text=True, timeout=60)
        report = json.loads(proc.stdout)
        if isinstance(report.get("Checks"), dict):  # single check -> ConvertTo-Json emits an object
            report["Checks"] = [report["Checks"]]
        return report
    # Linux / other POSIX
    from linux_auditor import LinuxAuditor
    return LinuxAuditor().audit()


def submit(report, server, agent_key, insecure=False, workspace_token=""):
    url = server.rstrip("/") + "/api/submit-report"
    data = json.dumps(report).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if agent_key:
        headers["X-Agent-Key"] = agent_key
    if workspace_token:
        headers["X-Workspace-Token"] = workspace_token  # enroll into a client workspace
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    ctx = ssl._create_unverified_context() if insecure else None
    with urllib.request.urlopen(req, timeout=15, context=ctx) as resp:
        return resp.status, resp.read().decode("utf-8", "replace")


def run_once(server, agent_key, insecure, workspace_token=""):
    host = os.getenv("HSN_HOSTNAME")
    report = gather()
    if host:
        report["Hostname"] = host
    failing = sum(1 for c in report.get("Checks", []) if c.get("Status") != "Compliant")
    try:
        status, _ = submit(report, server, agent_key, insecure, workspace_token)
        print(f"[agent] {report.get('Hostname')}: {len(report.get('Checks', []))} checks "
              f"({failing} failing) -> server {status}")
        return True
    except Exception as e:
        print(f"[agent] submit failed: {e}", file=sys.stderr)
        return False


def main():
    ap = argparse.ArgumentParser(description="HardSecNet host agent")
    ap.add_argument("--server", default=os.getenv("HSN_SERVER", "http://localhost:5000"))
    ap.add_argument("--key", default=os.getenv("HSN_AGENT_KEY", ""))
    ap.add_argument("--workspace-token", default=os.getenv("HSN_WORKSPACE_TOKEN", ""),
                    help="client workspace enrollment token (routes this host to that client)")
    ap.add_argument("--interval", type=int, default=int(os.getenv("HSN_INTERVAL", "600")))
    ap.add_argument("--once", action="store_true", help="run a single audit then exit")
    ap.add_argument("--insecure", action="store_true", help="skip TLS verification (self-signed servers)")
    args = ap.parse_args()

    print(f"[agent] HardSecNet agent on {platform.system()} -> {args.server}")
    if args.once:
        sys.exit(0 if run_once(args.server, args.key, args.insecure, args.workspace_token) else 1)
    while True:
        run_once(args.server, args.key, args.insecure, args.workspace_token)
        time.sleep(max(30, args.interval))


if __name__ == "__main__":
    main()


