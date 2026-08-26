# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 2.3.7.7 - Ensure 'Interactive logon: Prompt user to change password before expiration' is set to 'between 5 and 14 days'
# Source Page: 178
# Confidence: 0.96
# Status: review_required

$ErrorActionPreference = 'Stop'

# Audit guidance extracted from the benchmark
# Navigate to the UI Path articulated in the Remediation section and confirm it is set as
# prescribed. This group policy setting is backed by the following registry location with a
# REG_DWORD value between 5 and 14.
# HKLM\SOFTWARE\Microsoft\Windows
# NT\CurrentVersion\Winlogon:PasswordExpiryWarning

# Remediation candidate
# Manual review required
# Convert the remediation guidance below into a validated script action

# TODO: replace the commented/manual steps above with validated PowerShell or registry logic.
