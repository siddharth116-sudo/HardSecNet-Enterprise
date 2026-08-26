"""HardSecNet Linux auditor.

Produces the same {Name, Value, Status} findings as the Windows Auditor, but for
Linux hosts -- covering the "internet background-noise attack" surface from the
project's architecture doc: SSH root login, password authentication, host
firewall, automatic patching, and basic account/password hygiene.

Each finding also carries Expected / Rationale / Remediation so the AI engine and
dashboard render Linux results exactly like CIS/Windows results.

The auditor reads configuration from the filesystem and a few shell commands. Both
are injectable (`root` prefix and `run_cmd`) so the logic is unit-testable on any
OS against fixture files.
"""
from __future__ import annotations

import datetime
import os
import platform
import shutil
import subprocess


def _default_run_cmd(args: list[str], timeout: int = 5):
    """Run a command, returning (returncode, stdout) or (None, '') if unavailable."""
    exe = shutil.which(args[0])
    if not exe:
        return None, ""
    try:
        proc = subprocess.run([exe, *args[1:]], capture_output=True, text=True, timeout=timeout)
        return proc.returncode, (proc.stdout or "")
    except (OSError, subprocess.TimeoutExpired):
        return None, ""


class LinuxAuditor:
    def __init__(self, root: str = "/", run_cmd=None):
        self.root = root
        self.run_cmd = run_cmd or _default_run_cmd

    # ----- helpers -----
    def _path(self, rel: str) -> str:
        return os.path.join(self.root, rel.lstrip("/"))

    def _read(self, rel: str) -> str | None:
        try:
            with open(self._path(rel), "r", encoding="utf-8", errors="replace") as f:
                return f.read()
        except OSError:
            return None

    def _sshd_value(self, key: str) -> str | None:
        """First uncommented directive wins (sshd semantics)."""
        text = self._read("/etc/ssh/sshd_config")
        if not text:
            return None
        for line in text.splitlines():
            s = line.strip()
            if not s or s.startswith("#"):
                continue
            parts = s.split(None, 1)
            if len(parts) == 2 and parts[0].lower() == key.lower():
                return parts[1].strip()
        return None

    @staticmethod
    def _finding(name, value, status, expected="", rationale="", remediation=""):
        return {
            "Name": name, "Value": value, "Status": status,
            "Expected": expected, "Rationale": rationale, "Remediation": remediation,
        }

    # ----- individual checks -----
    def check_ssh_root_login(self):
        val = self._sshd_value("PermitRootLogin")
        # CIS / hardening baseline wants root SSH login disabled.
        compliant = val is not None and val.lower() in ("no", "prohibit-password", "forced-commands-only")
        return self._finding(
            "SSH PermitRootLogin",
            val or "default (yes)",
            "Compliant" if compliant else "Action Required",
            expected="PermitRootLogin no",
            rationale="Allowing root to log in directly over SSH lets attackers brute-force the most powerful account.",
            remediation="Set 'PermitRootLogin no' in /etc/ssh/sshd_config, then: sudo systemctl restart sshd",
        )

    def check_ssh_password_auth(self):
        val = self._sshd_value("PasswordAuthentication")
        compliant = val is not None and val.lower() == "no"
        return self._finding(
            "SSH PasswordAuthentication",
            val or "default (yes)",
            "Compliant" if compliant else "Action Required",
            expected="PasswordAuthentication no",
            rationale="Password logins over SSH are guessable by botnets; key-based auth is far stronger.",
            remediation="Set 'PasswordAuthentication no' in /etc/ssh/sshd_config (after adding SSH keys), then: sudo systemctl restart sshd",
        )

    def check_ssh_empty_passwords(self):
        val = self._sshd_value("PermitEmptyPasswords")
        # Default is 'no'; only an explicit 'yes' is a problem.
        compliant = val is None or val.lower() == "no"
        return self._finding(
            "SSH PermitEmptyPasswords",
            val or "default (no)",
            "Compliant" if compliant else "Action Required",
            expected="PermitEmptyPasswords no",
            rationale="Permitting empty passwords lets anyone log into accounts that have no password set.",
            remediation="Set 'PermitEmptyPasswords no' in /etc/ssh/sshd_config, then: sudo systemctl restart sshd",
        )

    def check_firewall(self):
        rc, out = self.run_cmd(["ufw", "status"])
        if rc is not None and "status: active" in out.lower():
            return self._finding("Host Firewall (ufw)", "active", "Compliant",
                                 expected="firewall active",
                                 rationale="An active host firewall limits exposure of open ports to internet scans.",
                                 remediation="sudo ufw enable")
        if rc is not None and "status: inactive" in out.lower():
            return self._finding("Host Firewall (ufw)", "inactive", "Action Required",
                                 expected="firewall active",
                                 rationale="With the firewall off, every listening service is reachable from the network.",
                                 remediation="sudo ufw default deny incoming && sudo ufw allow OpenSSH && sudo ufw enable")
        # Fall back to nftables/iptables rule presence.
        rc2, out2 = self.run_cmd(["nft", "list", "ruleset"])
        if rc2 is not None and out2.strip():
            return self._finding("Host Firewall (nftables)", "rules present", "Compliant",
                                 expected="firewall active",
                                 rationale="An active host firewall limits exposure of open ports to internet scans.")
        return self._finding("Host Firewall", "not detected", "Action Required",
                             expected="firewall active",
                             rationale="No active host firewall detected; listening services are exposed to the network.",
                             remediation="sudo ufw default deny incoming && sudo ufw allow OpenSSH && sudo ufw enable")

    def check_auto_updates(self):
        text = self._read("/etc/apt/apt.conf.d/20auto-upgrades")
        enabled = bool(text) and 'Unattended-Upgrade "1"' in text
        return self._finding(
            "Automatic Security Updates",
            "enabled" if enabled else "disabled/not configured",
            "Compliant" if enabled else "Action Required",
            expected="unattended-upgrades enabled",
            rationale="Unpatched systems are compromised through known vulnerabilities scanned for automatically.",
            remediation="sudo apt-get install -y unattended-upgrades && sudo dpkg-reconfigure -plow unattended-upgrades",
        )

    def check_password_max_age(self):
        text = self._read("/etc/login.defs")
        value = None
        if text:
            for line in text.splitlines():
                s = line.strip()
                if s.startswith("PASS_MAX_DAYS"):
                    parts = s.split()
                    if len(parts) >= 2 and parts[1].lstrip("-").isdigit():
                        value = int(parts[1])
                    break
        compliant = value is not None and 0 < value <= 365
        return self._finding(
            "Password Maximum Age",
            f"{value} days" if value is not None else "not set",
            "Compliant" if compliant else "Action Required",
            expected="PASS_MAX_DAYS <= 365",
            rationale="Passwords that never expire give a stolen credential an unlimited useful lifetime.",
            remediation="Set 'PASS_MAX_DAYS 365' (or fewer) in /etc/login.defs",
        )

    def check_empty_password_accounts(self):
        text = self._read("/etc/shadow")
        if text is None:
            return self._finding("Accounts With Empty Passwords", "unreadable (need root)", "Error",
                                 expected="no empty-password accounts")
        empty = [line.split(":", 1)[0] for line in text.splitlines()
                 if len(line.split(":")) > 1 and line.split(":")[1] == ""]
        compliant = not empty
        return self._finding(
            "Accounts With Empty Passwords",
            "none" if compliant else ", ".join(empty),
            "Compliant" if compliant else "Action Required",
            expected="no empty-password accounts",
            rationale="An account with no password can be accessed by anyone with no credentials at all.",
            remediation="Lock or set a password for each listed account: sudo passwd -l <user>",
        )

    # ----- orchestration -----
    def run_checks(self) -> list[dict]:
        checks = []
        for fn in (
            self.check_ssh_root_login,
            self.check_ssh_password_auth,
            self.check_ssh_empty_passwords,
            self.check_firewall,
            self.check_auto_updates,
            self.check_password_max_age,
            self.check_empty_password_accounts,
        ):
            try:
                checks.append(fn())
            except Exception as exc:  # never let one check abort the audit
                checks.append(self._finding(fn.__name__, f"error: {exc}", "Error"))
        return checks

    def audit(self) -> dict:
        checks = self.run_checks()
        total = len(checks)
        compliant = sum(1 for c in checks if c["Status"] == "Compliant")
        scored = sum(1 for c in checks if c["Status"] in ("Compliant", "Action Required")) or 1
        return {
            "Hostname": platform.node(),
            "Timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "Type": "linux",
            "OS": "linux",
            "Score": round((compliant / scored) * 100),
            "Checks": checks,
        }


if __name__ == "__main__":
    import json
    print(json.dumps(LinuxAuditor().audit(), indent=2))
