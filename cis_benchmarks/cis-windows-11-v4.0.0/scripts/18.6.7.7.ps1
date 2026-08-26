# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 18.6.7.7 - Ensure 'Set authentication rate limiter delay (milliseconds)' is set to 'Enabled: 2000' or more
# Source Page: 548
# Confidence: 0.96
# Status: review_required

$ErrorActionPreference = 'Stop'

# Audit guidance extracted from the benchmark
# Navigate to the UI Path articulated in the Remediation section and confirm it is set as
# prescribed. This group policy setting is backed by the following registry location with a
# REG_DWORD value of 2000 or more.
# HKLM\SOFTWARE\Policies\Microsoft\Windows\LanmanServer:InvalidAuthenticationDe
# layTimeInMs

# Remediation candidate
# Manual review required
# Convert the remediation guidance below into a validated script action

# TODO: replace the commented/manual steps above with validated PowerShell or registry logic.
