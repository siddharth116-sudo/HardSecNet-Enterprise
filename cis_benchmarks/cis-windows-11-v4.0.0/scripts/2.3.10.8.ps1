# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 2.3.10.8 - Ensure 'Network access: Remotely accessible registry paths and sub-paths' is configured
# Source Page: 219
# Confidence: 0.96
# Status: review_required

$ErrorActionPreference = 'Stop'

# Audit guidance extracted from the benchmark
# Navigate to the UI Path articulated in the Remediation section and confirm it is set as
# prescribed. This group policy setting is backed by the following registry location with a
# REG_DWORD value of System\CurrentControlSet\Control\Print\Printers,
# System\CurrentControlSet\Services\Eventlog, Software\Microsoft\OLAP
# Server, Software\Microsoft\Windows NT\CurrentVersion\Print,
# Software\Microsoft\Windows NT\CurrentVersion\Windows,
# System\CurrentControlSet\Control\ContentIndex,
# System\CurrentControlSet\Control\Terminal Server,
# System\CurrentControlSet\Control\Terminal Server\UserConfig,
# System\CurrentControlSet\Control\Terminal
# Server\DefaultUserConfiguration, Software\Microsoft\Windows
# NT\CurrentVersion\Perflib and
# System\CurrentControlSet\Services\SysmonLog.
# HKLM\SYSTEM\CurrentControlSet\Control\SecurePipeServers\Winreg\AllowedPaths:M
# achine
# Page 220

# Remediation candidate
Policies\Security Options\Network access: Remotely accessible registry paths

# TODO: replace the commented/manual steps above with validated PowerShell or registry logic.
