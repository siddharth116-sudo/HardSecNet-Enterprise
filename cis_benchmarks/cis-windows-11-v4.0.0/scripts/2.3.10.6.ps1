# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 2.3.10.6 - Ensure 'Network access: Named Pipes that can be accessed anonymously' is set to 'None'
# Source Page: 215
# Confidence: 0.96
# Status: review_required

$ErrorActionPreference = 'Stop'

# Audit guidance extracted from the benchmark
# Navigate to the UI Path articulated in the Remediation section and confirm it is set as
# prescribed. This group policy setting is backed by the following registry location with a
# REG_MULTI_SZ value that is blank i.e. no value in key.
# HKLM\SYSTEM\CurrentControlSet\Services\LanManServer\Parameters:NullSessionPip
# es

# Remediation candidate
# Manual review required
# Convert the remediation guidance below into a validated script action

# TODO: replace the commented/manual steps above with validated PowerShell or registry logic.
