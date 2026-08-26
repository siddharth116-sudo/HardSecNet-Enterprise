# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 18.9.20.1.14 - Ensure 'Turn off Windows Error Reporting' is set to 'Enabled'
# Source Page: 705
# Confidence: 0.96
# Status: review_required

$ErrorActionPreference = 'Stop'

# Audit guidance extracted from the benchmark
# Navigate to the UI Path articulated in the Remediation section and confirm it is set as
# prescribed. This group policy setting is backed by the following registry locations with a
# REG_DWORD value of 1 (Disabled) and 0 (DoReport).
# HKLM\SOFTWARE\Policies\Microsoft\Windows\Windows Error Reporting:Disabled
# HKLM\SOFTWARE\Policies\Microsoft\PCHealth\ErrorReporting:DoReport

# Remediation candidate
# Manual review required
# Convert the remediation guidance below into a validated script action

# TODO: replace the commented/manual steps above with validated PowerShell or registry logic.
