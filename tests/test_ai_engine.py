from ai_engine import AIEngine

eng = AIEngine(mode="off")  # deterministic, no model calls


def test_failing_summary_lists_risk_and_fix():
    checks = [{"Name": "Firewall Domain Profile", "Value": "Disabled", "Status": "Action Required"}]
    out = eng.summarize_audit(checks, "HOST1")
    assert "1 of 1" in out
    assert "Risk:" in out
    assert "netsh advfirewall set allprofiles state on" in out  # from the knowledge map


def test_all_compliant():
    checks = [{"Name": "Firewall", "Value": "Enabled", "Status": "Compliant"}]
    assert "compliant" in eng.summarize_audit(checks, "HOST1").lower()


def test_empty_audit():
    assert "audit" in eng.summarize_audit([], "HOST1").lower()


def test_prefers_finding_rationale_over_keyword_map():
    # A finding that carries its own rationale should use it, not the generic keyword text
    checks = [{
        "Name": "SSH PasswordAuthentication", "Value": "yes", "Status": "Action Required",
        "Rationale": "Password logins over SSH are guessable by botnets.",
        "Remediation": "Set 'PasswordAuthentication no' in /etc/ssh/sshd_config",
    }]
    out = eng.summarize_audit(checks, "web-prod-01")
    assert "guessable by botnets" in out
    assert "/etc/ssh/sshd_config" in out  # remediation field surfaces as the fix


def test_caching_is_consistent():
    checks = [{"Name": "UAC", "Value": "0", "Status": "Action Required"}]
    assert eng.summarize_audit(checks, "H") == eng.summarize_audit(checks, "H")
