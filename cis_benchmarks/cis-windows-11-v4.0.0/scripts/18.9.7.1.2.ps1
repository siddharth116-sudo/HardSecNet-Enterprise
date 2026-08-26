# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 18.9.7.1.2 - (BL) Ensure 'Prevent installation of devices using drivers that match these device setup classes: Prevent installation of devices using drivers for these device setup' is set to 'IEEE 1394 device setup classes'
# Source Page: 662
# Confidence: 0.96
# Status: review_required

$ErrorActionPreference = 'Stop'

# Audit guidance extracted from the benchmark
# Navigate to the UI Path articulated in the Remediation section and confirm it is set as
# prescribed. This group policy setting is backed by the following registry location with a
# REG_SZ value of {d48179be-ec20-11d1-b6b8-00c04fa372a7}, {7ebefbc0-3200-
# 11d2-b4c2-00a0C9697d07}, {c06ff265-ae09-48f0-812c-16753d7cba83}, and
# {6bdd1fc1-810f-11d0-bec7-08002be2092f}.
# HKLM\SOFTWARE\Policies\Microsoft\Windows\DeviceInstall\Restrictions\DenyDevic
# eClasses:<numeric value>

# Remediation candidate
# Manual review required
# Convert the remediation guidance below into a validated script action

# TODO: replace the commented/manual steps above with validated PowerShell or registry logic.
