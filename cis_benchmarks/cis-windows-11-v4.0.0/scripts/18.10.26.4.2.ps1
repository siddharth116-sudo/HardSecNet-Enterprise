# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 18.10.26.4.2 - Ensure 'System: Specify the maximum log file size (KB)' is set to 'Enabled: 32,768 or greater'
# Source Page: 959
# Confidence: 0.96
# Status: review_required

$ErrorActionPreference = 'Stop'

# Audit guidance extracted from the benchmark
# Navigate to the UI Path articulated in the Remediation section and confirm it is set as
# prescribed. This group policy setting is backed by the following registry location with a
# REG_DWORD value of 32768 or greater.
# HKLM\SOFTWARE\Policies\Microsoft\Windows\EventLog\System:MaxSize

# Remediation candidate
# Manual review required
# Convert the remediation guidance below into a validated script action

# TODO: replace the commented/manual steps above with validated PowerShell or registry logic.
