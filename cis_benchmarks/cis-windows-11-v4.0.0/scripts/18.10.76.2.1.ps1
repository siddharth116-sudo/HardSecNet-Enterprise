# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 18.10.76.2.1 - Ensure 'Configure Windows Defender SmartScreen' is set to 'Enabled: Warn and prevent bypass'
# Source Page: 1165
# Confidence: 0.96
# Status: review_required

$ErrorActionPreference = 'Stop'

# Audit guidance extracted from the benchmark
# Navigate to the UI Path articulated in the Remediation section and confirm it is set as
# prescribed. This group policy setting is backed by the following registry locations with a
# REG_DWORD value of 1 (EnableSmartScreen) and REG_SZ value of Block
# (ShellSmartScreenLevel).
# HKLM\SOFTWARE\Policies\Microsoft\Windows\System:EnableSmartScreen
# HKLM\SOFTWARE\Policies\Microsoft\Windows\System:ShellSmartScreenLevel
# Page 1165

# Remediation candidate
# Manual review required
# Convert the remediation guidance below into a validated script action

# TODO: replace the commented/manual steps above with validated PowerShell or registry logic.
