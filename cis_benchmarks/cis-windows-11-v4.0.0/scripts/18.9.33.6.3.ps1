# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 18.9.33.6.3 - (BL) Ensure 'Allow standby states (S1-S3) when sleeping (on battery)' is set to 'Disabled'
# Source Page: 744
# Confidence: 0.96
# Status: review_required

$ErrorActionPreference = 'Stop'

# Audit guidance extracted from the benchmark
# Navigate to the UI Path articulated in the Remediation section and confirm it is set as
# prescribed. This group policy setting is backed
# by the following registry location with a REG_DWORD value of 0.
# HKLM\SOFTWARE\Policies\Microsoft\Power\PowerSettings\abfc2519-3608-4c2a-94ea-
# 171b0ed546ab:DCSettingIndex

# Remediation candidate
# Manual review required
# Convert the remediation guidance below into a validated script action

# TODO: replace the commented/manual steps above with validated PowerShell or registry logic.
