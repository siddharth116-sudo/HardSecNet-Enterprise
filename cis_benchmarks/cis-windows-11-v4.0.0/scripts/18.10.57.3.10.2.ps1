# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 18.10.57.3.10.2 - Ensure 'Set time limit for disconnected sessions' is set to 'Enabled: 1 minute'
# Source Page: 1114
# Confidence: 0.96
# Status: review_required

$ErrorActionPreference = 'Stop'

# Audit guidance extracted from the benchmark
# Navigate to the UI Path articulated in the Remediation section and confirm it is set as
# prescribed. This group policy setting is backed by the following registry location with a
# REG_DWORD value of 60000.
# HKLM\SOFTWARE\Policies\Microsoft\Windows NT\Terminal
# Services:MaxDisconnectionTime
# Page 1114

# Remediation candidate
# Manual review required
# Convert the remediation guidance below into a validated script action

# TODO: replace the commented/manual steps above with validated PowerShell or registry logic.
