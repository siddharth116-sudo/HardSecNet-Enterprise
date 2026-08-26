# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 2.3.17.2 - Ensure 'User Account Control: Behavior of the elevation prompt for administrators in Admin Approval Mode' is set to 'Prompt for consent on the secure desktop' or higher
# Source Page: 270
# Confidence: 0.96
# Status: review_required

$ErrorActionPreference = 'Stop'

# Audit guidance extracted from the benchmark
# Navigate to the UI Path articulated in the Remediation section and confirm it is set as
# prescribed. This group policy setting is backed by the following registry location with a
# REG_DWORD value of 1 or 2.
# HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System:ConsentPromptB
# ehaviorAdmin
# Page 270

# Remediation candidate
# Manual review required
# Convert the remediation guidance below into a validated script action

# TODO: replace the commented/manual steps above with validated PowerShell or registry logic.
