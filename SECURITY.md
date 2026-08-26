# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| `main` | ✅ Active |

## Reporting a Vulnerability

Do **not** open a public GitHub issue for security vulnerabilities.

Instead, report security concerns by emailing the maintainer directly or opening a **private security advisory** via the GitHub Security tab.

Please include:
- A clear description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if known)

Expect a response within **72 hours**. Disclosed vulnerabilities will be credited in the release notes unless you prefer anonymity.

## Security Design Principles

This project follows these principles:
- Principle of least privilege — agents operate with minimal required permissions
- No secrets hardcoded — all credentials are managed via environment variables or encrypted config
- Audit-first design — all hardening actions are logged before execution
- Rollback safety — every remediation step has a corresponding rollback operation
