# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 2.3.7.4 - Ensure 'Interactive logon: Machine inactivity limit' is set to '900 or fewer second(s), but not 0'
# Source Page: 172
# Confidence: 0.96
# Status: review_required

$ErrorActionPreference = 'Stop'

# Audit guidance extracted from the benchmark
# Navigate to the UI Path articulated in the Remediation section and confirm it is set as
# prescribed. This group policy setting is backed by the following registry location with a
# REG_DWORD value of 900 or less, but not 0.
# HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System:InactivityTime
# outSecs

# Remediation candidate
# Manual review required
# Convert the remediation guidance below into a validated script action

# TODO: replace the commented/manual steps above with validated PowerShell or registry logic.
