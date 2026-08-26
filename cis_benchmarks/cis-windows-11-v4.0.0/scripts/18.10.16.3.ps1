# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 18.10.16.3 - Ensure 'Disable OneSettings Downloads' is set to 'Enabled'
# Status: reviewed_ready
# Review Notes: Administrative-template registry remediation implemented from benchmark-provided policy path and exact value.

param([switch]$Apply, [switch]$Rollback, [switch]$Status)
$ErrorActionPreference = "Stop"

$Path = "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection"
$Name = "DisableOneSettingsDow"
$PropertyType = "DWord"
$DesiredValue = 1
$ExpectedDescription = "DisableOneSettingsDow = 1"
$SettingTitle = "18.10.16.3 - Ensure 'Disable OneSettings Downloads' is set to 'Enabled'"
$RollbackDescription = "Rollback removes the policy value so the setting returns to local default or Not Configured behavior."

function Ensure-RegistryPath {
    if (-not (Test-Path $Path)) {
        New-Item -Path $Path -Force | Out-Null
    }
}

function Get-CurrentValue {
    if (-not (Test-Path $Path)) {
        return $null
    }
    $item = Get-ItemProperty -Path $Path -Name $Name -ErrorAction SilentlyContinue
    if ($null -eq $item) {
        return $null
    }
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

function Format-Value([object]$Value) {
    if ($null -eq $Value) {
        return "<not configured>"
    }
    if ($Value -is [array]) {
        return ($Value -join ', ')
    }
    return [string]$Value
}

function Write-State {
    $current = Get-CurrentValue
    $on = Test-Compliant $current
    $label = if ($on) { "ON" } else { "OFF" }
    Write-Output "Setting: $SettingTitle"
    Write-Output "Registry: $Path\$Name"
    Write-Output "Expected: $ExpectedDescription"
    Write-Output "Current value: $(Format-Value $current)"
    Write-Output "Status: $label"
    Write-Output "Benefit: aligns the local administrative-template policy with the CIS benchmark for this Windows setting."
}

if ($Status) {
    Write-State
} elseif ($Rollback) {
    Remove-DesiredValue
    Write-Output $RollbackDescription
    Write-State
} elseif ($Apply) {
    Set-DesiredValue
    Write-Output "Applied CIS-aligned policy value."
    Write-State
} else {
    Write-Output "Dry run: would set $Path\$Name to $(Format-Value $DesiredValue)."
    Write-State
}
