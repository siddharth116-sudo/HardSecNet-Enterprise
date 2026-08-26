# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 18.9.7.2 - Ensure 'Prevent device metadata retrieval from the Internet' is set to 'Enabled'
# Source Page: 667
# Confidence: 0.96
# Status: review_required

$ErrorActionPreference = 'Stop'

# Audit guidance extracted from the benchmark
# Navigate to the UI Path articulated in the Remediation section and confirm it is set as
# prescribed. This group policy setting is backed by the following registry location with a
# REG_DWORD value of 1.
# HKLM\SOFTWARE\Policies\Microsoft\Windows\Device
# Metadata:PreventDeviceMetadataFromNetwork
# Page 667

# Remediation candidate
# Manual review required
# Convert the remediation guidance below into a validated script action

# TODO: replace the commented/manual steps above with validated PowerShell or registry logic.
