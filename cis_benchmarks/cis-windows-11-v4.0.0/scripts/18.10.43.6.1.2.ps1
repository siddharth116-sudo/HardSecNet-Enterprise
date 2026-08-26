# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 18.10.43.6.1.2 - Ensure 'Configure Attack Surface Reduction rules: Set the state for each ASR rule' is configured
# Source Page: 994
# Confidence: 0.96
# Status: review_required

$ErrorActionPreference = 'Stop'

# Audit guidance extracted from the benchmark
# Navigate to the UI Path articulated in the Remediation section and confirm it is set as
# prescribed. This group policy setting is backed by the following registry location with a
# REG_SZ value of 1 for each rule.
# HKLM\SOFTWARE\Policies\Microsoft\Windows Defender\Windows Defender Exploit
# Guard\ASR\Rules:26190899-1602-49e8-8b27-eb1d0a1ce869
# HKLM\SOFTWARE\Policies\Microsoft\Windows Defender\Windows Defender Exploit
# Guard\ASR\Rules:3b576869-a4ec-4529-8536-b80a7769e899
# HKLM\SOFTWARE\Policies\Microsoft\Windows Defender\Windows Defender Exploit
# Guard\ASR\Rules:56a863a9-875e-4185-98a7-b882c64b5ce5
# HKLM\SOFTWARE\Policies\Microsoft\Windows Defender\Windows Defender Exploit
# Guard\ASR\Rules:5beb7efe-fd9a-4556-801d-275e5ffc04cc
# HKLM\SOFTWARE\Policies\Microsoft\Windows Defender\Windows Defender Exploit
# Guard\ASR\Rules:75668c1f-73b5-4cf0-bb93-3ecf5cb7cc84
# HKLM\SOFTWARE\Policies\Microsoft\Windows Defender\Windows Defender Exploit
# Guard\ASR\Rules:7674ba52-37eb-4a4f-a9a1-f0f9a1619a2c
# HKLM\SOFTWARE\Policies\Microsoft\Windows Defender\Windows Defender Exploit
# Guard\ASR\Rules:92e97fa1-2edf-4476-bdd6-9dd0b4dddc7b
# HKLM\SOFTWARE\Policies\Microsoft\Windows Defender\Windows Defender Exploit
# Guard\ASR\Rules:9e6c4e1f-7d60-472f-ba1a-a39ef669e4b2
# HKLM\SOFTWARE\Policies\Microsoft\Windows Defender\Windows Defender Exploit
# Guard\ASR\Rules:b2b3f03d-6a65-4f7b-a9c7-1c7ef74a9ba4
# HKLM\SOFTWARE\Policies\Microsoft\Windows Defender\Windows Defender Exploit
# Guard\ASR\Rules:be9ba2d9-53ea-4cdc-84e5-9b1eeee46550
# HKLM\SOFT

# Remediation candidate
# Manual policy mapping required
# Review the remediation text and map to a registry/GPO/script action

# TODO: replace the commented/manual steps above with validated PowerShell or registry logic.
