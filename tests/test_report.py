from ReportGenerator import ReportGenerator


def test_builds_valid_pdf(tmp_path):
    audit = {
        "Hostname": "WIN-APP-01",
        "Timestamp": "2026-06-27 12:00",
        "Type": "agent_report",
        "Checks": [
            {"Name": "Firewall Domain Profile", "Value": "Disabled", "Status": "Action Required"},
            {"Name": "Firewall Public Profile", "Value": "Enabled", "Status": "Compliant"},
        ],
    }
    out = tmp_path / "report.pdf"
    ReportGenerator(str(out), audit, "Two checks, one needs attention.", "").build_pdf()
    assert out.exists()
    assert out.read_bytes()[:4] == b"%PDF"  # real PDF
    assert out.stat().st_size > 1000


def test_handles_empty_checks(tmp_path):
    out = tmp_path / "empty.pdf"
    ReportGenerator(str(out), {"Hostname": "H", "Checks": []}, None, "").build_pdf()
    assert out.exists() and out.read_bytes()[:4] == b"%PDF"
