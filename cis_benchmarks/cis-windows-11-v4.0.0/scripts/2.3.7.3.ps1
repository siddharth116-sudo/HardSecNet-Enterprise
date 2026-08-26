# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 2.3.7.3 - (BL) Ensure 'Interactive logon: Machine account lockout threshold' is set to '10 or fewer invalid logon attempts, but not 0'
# Source Page: 170
# Confidence: 0.96
# Status: review_required

$ErrorActionPreference = 'Stop'

# Audit guidance extracted from the benchmark
# Navigate to the UI Path articulated in the Remediation section and confirm it is set as
# prescribed. This group policy setting is backed by the following registry location with a
# REG_DWORD value of 10 or less, but not 0.
# HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System:MaxDevicePassw
# ordFailedAttempts

# Remediation candidate
# Manual review required
# Convert the remediation guidance below into a validated script action

# TODO: replace the commented/manual steps above with validated PowerShell or registry logic.
