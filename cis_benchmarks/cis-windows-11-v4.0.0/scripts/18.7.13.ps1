# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 18.7.13 - Ensure 'Point and Print Restrictions: When updating drivers for an existing connection' is set to 'Enabled: Show warning and elevation prompt'
# Source Page: 624
# Confidence: 0.96
# Status: review_required

$ErrorActionPreference = 'Stop'

# Audit guidance extracted from the benchmark
# Navigate to the UI Path articulated in the Remediation section and confirm it is set as
# prescribed. This group policy setting is backed by the following registry location with a
# REG_DWORD value of 0.
# HKLM\Software\Policies\Microsoft\Windows
# NT\Printers\PointAndPrint:UpdatePromptSettings
# Page 624

# Remediation candidate
# Manual review required
# Convert the remediation guidance below into a validated script action

# TODO: replace the commented/manual steps above with validated PowerShell or registry logic.
