# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 1.2.3 - Ensure 'Allow Administrator account lockout' is set to 'Enabled'
# Source Page: 62
# Confidence: 0.9000000000000001
# Status: review_required

$ErrorActionPreference = 'Stop'

# Manual review required
#
# Reason: The CIS remediation guidance for "Allow Administrator account lockout" must be mapped to the
# correct Windows 11 policy storage (Local Security Policy / security template key or registry-backed
# setting). This generated stub does not provide that mapping, and implementing it without confirming
# the authoritative key/value would be speculative.
#
# Next step for a safe conversion:
# - Identify the exact underlying setting (e.g., security policy export key name or registry value)
#   on Windows 11 for this control, then implement Status/Apply/Rollback with backups.
