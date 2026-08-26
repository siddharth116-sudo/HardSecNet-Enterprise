"""HardSecNet CIS benchmark engine.

Runs the bundled CIS Microsoft Windows 11 benchmark controls (one PowerShell
script per control, under cis_benchmarks/) in read-only -Status mode and maps the
results into HardSecNet's standard {Name, Value, Status} finding shape so the
existing dashboard and AI remediation engine consume them unchanged.

Two script templates are supported:
  * Registry controls (~471): print "Status: ON" / "Status: OFF".
  * Security-policy controls (~9): print "Compliant:" / "Not compliant:" and
    exit 0 (compliant) or 2 (not compliant).

Control metadata (title, profile level, rationale) comes from benchmark_items.json.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess

_DEFAULT_BASE = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "cis_benchmarks", "cis-windows-11-v4.0.0",
)


class CISEngine:
    def __init__(self, base_dir: str | None = None):
        self.base_dir = base_dir or _DEFAULT_BASE
        self.scripts_dir = os.path.join(self.base_dir, "scripts")
        self.items_path = os.path.join(self.base_dir, "benchmark_items.json")
        self._catalog: dict | None = None

    # ----- availability -----
    def powershell_available(self) -> bool:
        return shutil.which("powershell") is not None or shutil.which("pwsh") is not None

    def _powershell(self) -> str:
        return shutil.which("powershell") or shutil.which("pwsh") or "powershell"

    def available(self) -> bool:
        return os.path.isdir(self.scripts_dir) and self.powershell_available()

    # ----- catalog -----
    def load_catalog(self) -> dict:
        if self._catalog is not None:
            return self._catalog
        catalog: dict[str, dict] = {}
        with open(self.items_path, encoding="utf-8") as f:
            items = json.load(f)
        for it in items:
            bid = it.get("benchmark_id")
            if not bid:
                continue
            title = ""
            audit_logic = it.get("audit_logic") or []
            if isinstance(audit_logic, list) and audit_logic:
                title = audit_logic[0].get("expected", "") or ""
            title = title or it.get("title", "") or f"Control {bid}"
            catalog[bid] = {
                "benchmark_id": bid,
                "title": title.strip(),
                "profile_level": it.get("profile_level", "") or "",
                "rationale": (it.get("rationale") or "").strip(),
            }
        self._catalog = catalog
        return catalog

    def list_controls(self, level: str | None = None) -> list[dict]:
        controls = list(self.load_catalog().values())
        if level:
            controls = [c for c in controls if c["profile_level"].upper() == level.upper()]
        # Stable, human order by dotted benchmark id (1.1.1 < 1.2.1 < 18.1.1.1)
        controls.sort(key=lambda c: [int(p) if p.isdigit() else p for p in c["benchmark_id"].split(".")])
        return controls

    def _script_path(self, bid: str) -> str | None:
        p = os.path.join(self.scripts_dir, f"{bid}.ps1")
        return p if os.path.isfile(p) else None

    # ----- execution -----
    def run_control(self, bid: str, timeout: int = 25) -> dict:
        meta = self.load_catalog().get(
            bid, {"benchmark_id": bid, "title": f"Control {bid}", "profile_level": "", "rationale": ""}
        )
        path = self._script_path(bid)
        if not path:
            return self._finding(meta, "Error", "Script not found")
        if not self.powershell_available():
            return self._finding(meta, "Error", "PowerShell not available on this host")
        try:
            proc = subprocess.run(
                [self._powershell(), "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path, "-Status"],
                capture_output=True, text=True, timeout=timeout,
            )
        except subprocess.TimeoutExpired:
            return self._finding(meta, "Error", "Timed out")
        except OSError as exc:
            return self._finding(meta, "Error", f"Run failed: {exc}")
        status, value = self._parse_output(proc.stdout, proc.returncode)
        return self._finding(meta, status, value)

    @staticmethod
    def _parse_output(stdout: str, returncode: int) -> tuple[str, str]:
        text = stdout or ""
        low = text.lower()
        current = None
        for line in text.splitlines():
            stripped = line.strip()
            low_line = stripped.lower()
            if low_line.startswith("current value:"):
                current = stripped.split(":", 1)[1].strip()
            elif low_line.startswith("current:") and current is None:
                current = stripped.split(":", 1)[1].strip()
        # Registry template
        if "status: on" in low:
            return "Compliant", current or "ON"
        if "status: off" in low:
            return "Action Required", current or "OFF"
        # Security-policy template (Compliant:/Not compliant: + exit 0/2)
        if "not compliant" in low or returncode == 2:
            return "Action Required", current or "Not compliant"
        if "compliant" in low or returncode == 0:
            return "Compliant", current or "Compliant"
        return "Error", current or f"Exit code {returncode}"

    @staticmethod
    def _finding(meta: dict, status: str, value: str) -> dict:
        return {
            "Name": f"[{meta['benchmark_id']}] {meta['title']}",
            "Value": value,
            "Status": status,
            "BenchmarkId": meta["benchmark_id"],
            "ProfileLevel": meta.get("profile_level", ""),
            "Expected": meta.get("title", ""),
            "Rationale": meta.get("rationale", ""),
        }

    def run_audit(self, level: str | None = None, ids: list[str] | None = None,
                  limit: int | None = None, timeout: int = 25) -> list[dict]:
        if ids:
            targets = ids
        else:
            targets = [c["benchmark_id"] for c in self.list_controls(level=level)]
            if limit:
                targets = targets[:limit]
        return [self.run_control(bid, timeout=timeout) for bid in targets]
