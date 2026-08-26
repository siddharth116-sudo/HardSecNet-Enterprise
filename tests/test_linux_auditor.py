from linux_auditor import LinuxAuditor

NO_CMD = lambda args, timeout=5: (None, "")  # firewall/updates probes return "unavailable"


def _write(root, rel, content):
    p = root / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content)


def test_insecure_ssh_root_login(tmp_path):
    _write(tmp_path, "etc/ssh/sshd_config", "Port 22\nPermitRootLogin yes\nPasswordAuthentication yes\n")
    checks = LinuxAuditor(root=str(tmp_path), run_cmd=NO_CMD).run_checks()
    root_login = next(c for c in checks if c["Name"] == "SSH PermitRootLogin")
    assert root_login["Status"] == "Action Required"
    assert "PermitRootLogin no" in root_login["Remediation"]


def test_secure_ssh_root_login(tmp_path):
    _write(tmp_path, "etc/ssh/sshd_config", "PermitRootLogin no\nPasswordAuthentication no\n")
    checks = LinuxAuditor(root=str(tmp_path), run_cmd=NO_CMD).run_checks()
    assert next(c for c in checks if c["Name"] == "SSH PermitRootLogin")["Status"] == "Compliant"


def test_empty_password_account_flagged(tmp_path):
    _write(tmp_path, "etc/ssh/sshd_config", "PermitRootLogin no\n")
    _write(tmp_path, "etc/shadow", "root:$6$x:19000::::::\nbackup::19000::::::\n")
    checks = LinuxAuditor(root=str(tmp_path), run_cmd=NO_CMD).run_checks()
    empty = next(c for c in checks if c["Name"] == "Accounts With Empty Passwords")
    assert empty["Status"] == "Action Required"
    assert "backup" in empty["Value"]


def test_audit_shape(tmp_path):
    _write(tmp_path, "etc/ssh/sshd_config", "PermitRootLogin no\n")
    rep = LinuxAuditor(root=str(tmp_path), run_cmd=NO_CMD).audit()
    assert rep["Type"] == "linux"
    assert isinstance(rep["Checks"], list) and rep["Checks"]
    assert 0 <= rep["Score"] <= 100
