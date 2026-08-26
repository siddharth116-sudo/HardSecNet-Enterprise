# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 18.10.26.2.2 - Ensure 'Security: Specify the maximum log file size (KB)' is set to 'Enabled: 196,608 or greater'
# Source Page: 949
# Confidence: 0.96
# Status: review_required

$ErrorActionPreference = 'Stop'

# Audit guidance extracted from the benchmark
# Navigate to the UI Path articulated in the Remediation section and confirm it is set as
# prescribed. This group policy setting is backed by the following registry location with a
# REG_DWORD value of 196608 or greater.
# HKLM\SOFTWARE\Policies\Microsoft\Windows\EventLog\Security:MaxSize

# Remediation candidate
# Manual review required
# Convert the remediation guidance below into a validated script action

# TODO: replace the commented/manual steps above with validated PowerShell or registry logic.
