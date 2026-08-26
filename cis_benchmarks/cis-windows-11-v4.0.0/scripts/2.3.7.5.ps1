# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 2.3.7.5 - Configure 'Interactive logon: Message text for users attempting to log on'
# Source Page: 174
# Confidence: 0.96
# Status: review_required

$ErrorActionPreference = 'Stop'

# Audit guidance extracted from the benchmark
# Navigate to the UI Path articulated in the Remediation section and confirm it is set as
# prescribed. This group policy setting is backed by the following registry location with a
# REG_SZ value of text.
# HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System:LegalNoticeTex
# t
# Page 174

# Remediation candidate
# Manual review required
# Convert the remediation guidance below into a validated script action

# TODO: replace the commented/manual steps above with validated PowerShell or registry logic.
