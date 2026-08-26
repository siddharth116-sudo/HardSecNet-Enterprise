"""HardSecNet AI remediation engine.

Turns raw compliance findings (the {Name, Value, Status} checks produced by the
agent / Auditor.ps1) into plain-English risk explanations plus the exact commands
needed to fix them.

Design goals (ported from the pyside AgentEngine):
  * Provider abstraction: 'off' (deterministic only), 'local' (Ollama), 'claude'.
  * Always degrade gracefully — if the model is disabled or unreachable, a
    deterministic, useful summary is still returned. The tool never hard-depends
    on a model being up.

Configuration is entirely via environment variables (see .env.example):
  HSN_AI_MODE            off | local | claude          (default: off)
  HSN_AI_TIMEOUT         request timeout seconds        (default: 6)
  HSN_OLLAMA_ENDPOINT    http://127.0.0.1:11434/api/generate
  HSN_OLLAMA_MODEL       e.g. phi3                      (default: phi3)
  CLAUDE_API_KEY         Anthropic API key (mode=claude)
  CLAUDE_MODEL           e.g. claude-sonnet-4-6         (default: claude-sonnet-4-6)
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

# Plain-English risk + remediation hints for the checks the tool knows about.
# Matched by case-insensitive substring against a finding's Name. Used both to
# enrich the deterministic fallback and to give the LLM grounded context.
_KNOWLEDGE = [
    ("firewall", "The host firewall is off, leaving services directly exposed to network and internet scans.",
     "netsh advfirewall set allprofiles state on"),
    ("uac", "User Account Control is weakened, so malware can silently gain administrator rights.",
     'Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" -Name EnableLUA -Value 1 -Force'),
    ("password", "Password policy is too weak, making accounts easy to brute-force or guess.",
     "net accounts /minpwlen:14"),
    ("guest", "The built-in Guest account is enabled, allowing anonymous local access.",
     "net user Guest /active:no"),
    ("lockout", "No account lockout is set, so attackers can try unlimited passwords.",
     "net accounts /lockoutthreshold:5"),
    ("smb", "An insecure SMB configuration can expose file shares to network attacks.",
     'Set-SmbServerConfiguration -EnableSMB1Protocol $false -Force'),
    ("rdp", "Remote Desktop exposure increases the brute-force and exploit surface.",
     'Set-ItemProperty -Path "HKLM:\\System\\CurrentControlSet\\Control\\Terminal Server" -Name fDenyTSConnections -Value 1'),
]

_NONCOMPLIANT = {"action required", "non-compliant", "noncompliant", "critical error", "fail", "failed"}


def _knowledge_for(name: str):
    low = (name or "").lower()
    for key, risk, fix in _KNOWLEDGE:
        if key in low:
            return risk, fix
    return None, None


def _is_noncompliant(status: str) -> bool:
    return (status or "").strip().lower() in _NONCOMPLIANT


def _first_sentence(text: str, limit: int = 220) -> str:
    text = " ".join((text or "").split())
    if not text:
        return ""
    dot = text.find(". ")
    chosen = text[: dot + 1] if 0 < dot < limit else text[:limit]
    return chosen.strip()


def _risk_for(check: dict) -> str:
    """Best available risk explanation: the finding's own benchmark rationale when
    present (CIS / Linux carry one), else the built-in keyword knowledge (legacy
    Windows checks), else a generic line."""
    rationale = _first_sentence(check.get("Rationale", ""))
    if rationale:
        return rationale
    krisk, _ = _knowledge_for(check.get("Name", ""))
    return krisk or "This setting deviates from the security baseline."


class AIEngine:
    def __init__(self, mode="off", timeout=6.0, ollama_endpoint="", ollama_model="phi3",
                 claude_api_key="", claude_model="claude-sonnet-4-6"):
        self.mode = mode
        self.timeout = timeout
        self.ollama_endpoint = ollama_endpoint
        self.ollama_model = ollama_model
        self.claude_api_key = claude_api_key
        self.claude_model = claude_model
        self._cache: dict[str, str] = {}

    @classmethod
    def from_env(cls) -> "AIEngine":
        return cls(
            mode=os.getenv("HSN_AI_MODE", "off").lower(),
            timeout=float(os.getenv("HSN_AI_TIMEOUT", "6")),
            ollama_endpoint=os.getenv("HSN_OLLAMA_ENDPOINT", "http://127.0.0.1:11434/api/generate"),
            ollama_model=os.getenv("HSN_OLLAMA_MODEL", "phi3"),
            claude_api_key=os.getenv("CLAUDE_API_KEY", ""),
            claude_model=os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6"),
        )

    # ----- public API -----
    def summarize_audit(self, checks, hostname=None) -> str:
        """Return a plain-English summary + remediation for a list of checks.

        Always returns a useful string; uses a deterministic fallback whenever the
        configured model is off or unreachable. Results are cached by content so
        repeated dashboard polls do not re-query the model.
        """
        checks = checks or []
        cache_key = self._cache_key(checks, hostname)
        if cache_key in self._cache:
            return self._cache[cache_key]

        fallback = self._deterministic_summary(checks, hostname)
        summary = fallback
        if self.mode == "local":
            generated = self._ollama(self._build_prompt(checks, hostname))
            if generated:
                summary = generated
        elif self.mode == "claude" and self.claude_api_key:
            generated = self._claude(self._build_prompt(checks, hostname))
            if generated:
                summary = generated

        self._cache[cache_key] = summary
        return summary

    # ----- prompt + fallback -----
    def _failing(self, checks):
        return [c for c in checks if _is_noncompliant(c.get("Status", ""))]

    def _deterministic_summary(self, checks, hostname) -> str:
        total = len(checks)
        failing = self._failing(checks)
        host = f" on {hostname}" if hostname else ""
        if total == 0:
            return "No audit data available yet. Run an audit to generate findings."
        if not failing:
            return f"All {total} checks are compliant{host}. No action required."

        lines = [
            f"{len(failing)} of {total} checks need attention{host}. "
            "Prioritize the items below - each lists the risk and the exact fix:",
            "",
        ]
        for c in failing:
            name = c.get("Name", "Unknown check")
            _, kfix = _knowledge_for(name)
            fix = (c.get("Remediation") or "").strip() or kfix
            lines.append(f"- {name} [{c.get('Status', 'Action Required')}]")
            lines.append(f"    Risk: {_risk_for(c)}")
            if fix:
                lines.append(f"    Fix:  {fix}")
            elif c.get("Expected"):
                lines.append(f"    Target: {c.get('Expected')}")
        return "\n".join(lines)

    def _build_prompt(self, checks, hostname) -> str:
        failing = self._failing(checks)
        lines = [
            "You are a senior security engineer. Explain the risks below to a junior "
            "developer in plain English, then give the exact Windows command to fix each. "
            "Be concise. Do not invent findings beyond those listed.",
            f"Host: {hostname or 'unknown'}",
            "Findings needing attention:",
        ]
        for c in failing:
            _, fix = _knowledge_for(c.get("Name", ""))
            lines.append(
                f"- {c.get('Name')}: status={c.get('Status')}, value={c.get('Value')}"
                + (f"; risk={_risk_for(c)}")
                + (f"; suggested_fix={fix}" if fix else "")
            )
        if not failing:
            lines.append("- (all checks compliant)")
        return "\n".join(lines)

    # ----- providers -----
    def _ollama(self, prompt: str):
        payload = json.dumps({"model": self.ollama_model, "prompt": prompt, "stream": False}).encode("utf-8")
        req = urllib.request.Request(
            self.ollama_endpoint, data=payload,
            headers={"Content-Type": "application/json"}, method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:  # nosec B310 - local user-configured endpoint
                generated = str(json.loads(resp.read().decode("utf-8")).get("response", "")).strip()
            return generated or None
        except (OSError, TimeoutError, urllib.error.URLError, json.JSONDecodeError) as exc:
            print(f"[ai_engine] Ollama unavailable, using deterministic fallback: {exc}")
            return None

    def _claude(self, prompt: str):
        payload = json.dumps({
            "model": self.claude_model,
            "max_tokens": 800,
            "messages": [{"role": "user", "content": prompt}],
        }).encode("utf-8")
        req = urllib.request.Request(
            "https://api.anthropic.com/v1/messages", data=payload,
            headers={
                "Content-Type": "application/json",
                "x-api-key": self.claude_api_key,
                "anthropic-version": "2023-06-01",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:  # nosec B310 - fixed Anthropic API URL
                body = json.loads(resp.read().decode("utf-8"))
            parts = body.get("content", [])
            text = "".join(p.get("text", "") for p in parts if p.get("type") == "text").strip()
            return text or None
        except (OSError, TimeoutError, urllib.error.URLError, json.JSONDecodeError) as exc:
            print(f"[ai_engine] Claude API unavailable, using deterministic fallback: {exc}")
            return None

    # ----- cache -----
    @staticmethod
    def _cache_key(checks, hostname) -> str:
        import hashlib
        blob = json.dumps(
            [(c.get("Name"), c.get("Status")) for c in checks] + [hostname],
            sort_keys=True, default=str,
        )
        return hashlib.sha256(blob.encode("utf-8")).hexdigest()
