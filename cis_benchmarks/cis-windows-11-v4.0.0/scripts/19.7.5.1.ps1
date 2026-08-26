# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 19.7.5.1 - Ensure 'Do not preserve zone information in file attachments' is set to 'Disabled'
# Status: reviewed_ready
# Review Notes: Current-user administrative-template remediation implemented against the active user's policy hive.

param([switch]$Apply, [switch]$Rollback, [switch]$Status)
$ErrorActionPreference = "Stop"

$Path = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Policies\Attachments"
$Name = "SaveZoneInformation"
$PropertyType = "DWord"
$DesiredValue = 2
$ExpectedDescription = "SaveZoneInformation = 2"
$SettingTitle = "19.7.5.1 - Ensure 'Do not preserve zone information in file attachments' is set to 'Disabled'"
$RollbackDescription = "Rollback removes the current-user policy value so the setting returns to local default or Not Configured behavior."

function Ensure-RegistryPath {
    if (-not (Test-Path $Path)) {
        New-Item -Path $Path -Force | Out-Null
    }
}

function Get-CurrentValue {
    if (-not (Test-Path $Path)) { return $null }
    $item = Get-ItemProperty -Path $Path -Name $Name -ErrorAction SilentlyContinue
    if ($null -eq $item) { return $null }
    return $item.$Name
}

function Set-DesiredValue {
    Ensure-RegistryPath
    $current = Get-CurrentValue
    if ($null -eq $current) {
        New-ItemProperty -Path $Path -Name $Name -PropertyType $PropertyType -Value $DesiredValue -Force | Out-Null
    } else {
        Set-ItemProperty -Path $Path -Name $Name -Value $DesiredValue
    }
}

function Remove-DesiredValue {
    if (Test-Path $Path) {
        Remove-ItemProperty -Path $Path -Name $Name -ErrorAction SilentlyContinue
    }
}

function Test-Compliant([object]$Current) {
    if ($null -eq $Current) { return $false }
    try { return ([int64]$Current -eq [int64]$DesiredValue) } catch { return $false }
}

function Write-State {
    $current = Get-CurrentValue
    $on = Test-Compliant $current
    $label = if ($on) { "ON" } else { "OFF" }
    Write-Output "Setting: $SettingTitle"
    Write-Output "Registry: $Path\$Name"
    Write-Output "Expected: $ExpectedDescription"
    $display = if ($null -eq $current) { "<not configured>" } else { [string]$current }
    Write-Output "Current value: $display"
    Write-Output "Status: $label"
    Write-Output "Benefit: aligns the current-user Windows policy with the CIS benchmark for this setting."
}

if ($Status) {
    Write-State
} elseif ($Rollback) {
    Remove-DesiredValue
    Write-Output $RollbackDescription
    Write-State
} elseif ($Apply) {
    Set-DesiredValue
    Write-Output "Applied CIS-aligned current-user policy value."
    Write-State
} else {
    Write-Output "Dry run: would set $Path\$Name to $DesiredValue."
    Write-State
}
