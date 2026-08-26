# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 18.10.57.2.2 - Ensure 'Disable Cloud Clipboard integration for server-to-client data transfer' is set to 'Enabled'
# Source Page: 1075
# Confidence: 0.96
# Status: review_required

$ErrorActionPreference = 'Stop'

# Audit guidance extracted from the benchmark
# Navigate to the UI Path articulated in the Remediation section and confirm it is set as
# prescribed. This group policy setting is backed by the following registry location with a
# REG_DWORD value of 1.
# HKLM\SOFTWARE\Policies\Microsoft\Windows NT\Terminal
# Services\Client:DisableCloudClipboardIntegration

# Remediation candidate
# Manual review required
# Convert the remediation guidance below into a validated script action

# TODO: replace the commented/manual steps above with validated PowerShell or registry logic.
