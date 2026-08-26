# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 2.3.10.7 - Ensure 'Network access: Remotely accessible registry paths' is configured
# Source Page: 217
# Confidence: 0.96
# Status: review_required

$ErrorActionPreference = 'Stop'

# Audit guidance extracted from the benchmark
# Navigate to the UI Path articulated in the Remediation section and confirm it is set as
# prescribed. This group policy setting is backed by the following registry location with a
# REG_MULTI_SZ value of System\CurrentControlSet\Control\ProductOptions,
# System\CurrentControlSet\Control\Server Applications and
# Software\Microsoft\Windows NT\CurrentVersion.
# HKLM\SYSTEM\CurrentControlSet\Control\SecurePipeServers\Winreg\AllowedExactPa
# ths:Machine

# Remediation candidate
Policies\Security Options\Network access: Remotely accessible registry paths

# TODO: replace the commented/manual steps above with validated PowerShell or registry logic.
