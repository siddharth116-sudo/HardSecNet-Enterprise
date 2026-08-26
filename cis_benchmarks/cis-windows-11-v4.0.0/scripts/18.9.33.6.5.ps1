# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 18.9.33.6.5 - Ensure 'Require a password when a computer wakes (on battery)' is set to 'Enabled'
# Source Page: 748
# Confidence: 0.96
# Status: review_required

$ErrorActionPreference = 'Stop'

# Audit guidance extracted from the benchmark
# Navigate to the UI Path articulated in the Remediation section and confirm it is set as
# prescribed. This group policy setting is backed
# by the following registry location with a REG_DWORD value of 1.
# HKLM\SOFTWARE\Policies\Microsoft\Power\PowerSettings\0e796bdb-100d-47d6-a2d5-
# f7d2daa51f51:DCSettingIndex

# Remediation candidate
# Manual review required
# Convert the remediation guidance below into a validated script action

# TODO: replace the commented/manual steps above with validated PowerShell or registry logic.
