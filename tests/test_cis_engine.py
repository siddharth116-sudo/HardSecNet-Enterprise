from cis_engine import CISEngine

eng = CISEngine()


def test_catalog_loads():
    catalog = eng.load_catalog()
    assert len(catalog) >= 400  # bundled CIS Windows 11 benchmark
    # every entry has the fields the dashboard/AI rely on
    sample = next(iter(catalog.values()))
    for key in ("benchmark_id", "title", "profile_level"):
        assert key in sample


def test_registry_template_on_is_compliant():
    status, value = CISEngine._parse_output("Setting: x\nStatus: ON\n", 0)
    assert status == "Compliant"


def test_registry_template_off_is_action_required():
    status, value = CISEngine._parse_output("Setting: x\nStatus: OFF\nCurrent value: <not configured>", 0)
    assert status == "Action Required"
    assert value == "<not configured>"


def test_secedit_template_compliant():
    status, _ = CISEngine._parse_output("Compliant: Enforce password history is 24.", 0)
    assert status == "Compliant"


def test_secedit_template_noncompliant_by_exit_code():
    status, _ = CISEngine._parse_output("Not compliant: value is 0.", 2)
    assert status == "Action Required"


def test_list_controls_filters_by_level():
    l1 = eng.list_controls(level="L1")
    assert all(c["profile_level"].upper() == "L1" for c in l1)
    assert 0 < len(l1) <= len(eng.list_controls())
