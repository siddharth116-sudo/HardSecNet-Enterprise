# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 2.3.9.5 - Ensure 'Microsoft network server: Server SPN target name validation level' is set to 'Accept if provided by client' or higher
# Source Page: 202
# Confidence: 0.96
# Status: review_required

$ErrorActionPreference = 'Stop'

# Audit guidance extracted from the benchmark
# Navigate to the UI Path articulated in the Remediation section and confirm it is set as
# prescribed. This group policy setting is backed by the following registry location with a
# REG_DWORD value of 1 or 2.
# HKLM\SYSTEM\CurrentControlSet\Services\LanManServer\Parameters:SMBServerNameH
# ardeningLevel

# Remediation candidate
# Manual review required
# Convert the remediation guidance below into a validated script action

# TODO: replace the commented/manual steps above with validated PowerShell or registry logic.
