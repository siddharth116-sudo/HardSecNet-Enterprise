# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 9.2.3 - Ensure 'Windows Firewall: Private: Settings: Display a notification' is set to 'No'
# Status: reviewed_ready
# Review Notes: Firewall remediation implemented against the live Defender Firewall profile using Get-NetFirewallProfile and Set-NetFirewallProfile.

param([switch]$Apply, [switch]$Rollback, [switch]$Status)
$ErrorActionPreference = "Stop"

$ControlId = "9.2.3"
$Profile = "Private"
$Property = "NotifyOnListen"
$SettingTitle = "9.2.3 - Ensure 'Windows Firewall: Private: Settings: Display a notification' is set to 'No'"
$ExpectedDescription = "NotifyOnListen = False"
$DesiredValue = $false
$RollbackValue = $true
$BackupRoot = Join-Path $env:ProgramData 'HardSecNet\firewall_backups'
$BackupPath = Join-Path $BackupRoot "$ControlId.json"

function Test-IsAdmin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-CurrentValue {
    return (Get-NetFirewallProfile -Profile $Profile -ErrorAction Stop).$Property
}

function Format-Value([object]$Value) {
    if ($null -eq $Value) { return "<missing>" }
    if ($Value -is [bool]) { if ($Value) { return "True" } else { return "False" } }
    return [string]$Value
}

function Test-Compliant([object]$Current) {
    switch ($Property) {
        'LogMaxSizeKilobytes' {
            try { return ([int]$Current -ge [int]$DesiredValue) } catch { return $false }
        }
        default {
            return ([string]$Current -eq [string]$DesiredValue)
        }
    }
}

function Save-Backup {
    if (-not (Test-Path -LiteralPath $BackupRoot)) {
        New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null
    }
    @{ Profile = $Profile; Property = $Property; Value = Get-CurrentValue } |
        ConvertTo-Json -Depth 4 |
        Set-Content -LiteralPath $BackupPath -Encoding UTF8
}

function Restore-BackupValue {
    if (Test-Path -LiteralPath $BackupPath) {
        return (Get-Content -LiteralPath $BackupPath -Raw | ConvertFrom-Json).Value
    }
    return $RollbackValue
}

function Set-LiveValue([object]$Value) {
    if ($Value -is [bool]) { $Value = if ($Value) { 'True' } else { 'False' } }
    switch ($Property) {
        'Enabled' { Set-NetFirewallProfile -Profile $Profile -Enabled $Value -ErrorAction Stop }
        'DefaultInboundAction' { Set-NetFirewallProfile -Profile $Profile -DefaultInboundAction $Value -ErrorAction Stop }
        'NotifyOnListen' { Set-NetFirewallProfile -Profile $Profile -NotifyOnListen $Value -ErrorAction Stop }
        'AllowLocalFirewallRules' { Set-NetFirewallProfile -Profile $Profile -AllowLocalFirewallRules $Value -ErrorAction Stop }
        'AllowLocalIPsecRules' { Set-NetFirewallProfile -Profile $Profile -AllowLocalIPsecRules $Value -ErrorAction Stop }
        'LogFileName' { Set-NetFirewallProfile -Profile $Profile -LogFileName $Value -ErrorAction Stop }
        'LogMaxSizeKilobytes' { Set-NetFirewallProfile -Profile $Profile -LogMaxSizeKilobytes $Value -ErrorAction Stop }
        'LogBlocked' { Set-NetFirewallProfile -Profile $Profile -LogBlocked $Value -ErrorAction Stop }
        'LogAllowed' { Set-NetFirewallProfile -Profile $Profile -LogAllowed $Value -ErrorAction Stop }
        default { throw "Unsupported firewall property: $Property" }
    }
}

function Write-State {
    $current = Get-CurrentValue
    $label = if (Test-Compliant $current) { "ON" } else { "OFF" }
    Write-Output "Setting: $SettingTitle"
    Write-Output "Firewall profile: $Profile"
    Write-Output "Expected: $ExpectedDescription"
    Write-Output "Current value: $(Format-Value $current)"
    Write-Output "Status: $label"
    Write-Output "Benefit: applies the CIS benchmark to the live Windows Defender Firewall profile so the change is visible in Windows Security."
}

if ($Status) {
    Write-State
} elseif ($Rollback) {
    if (-not (Test-IsAdmin)) { throw "Administrator privileges are required to rollback firewall profile settings." }
    Set-LiveValue (Restore-BackupValue)
    Write-Output "Rollback applied to live firewall profile state."
    Write-State
} elseif ($Apply) {
    if (-not (Test-IsAdmin)) { throw "Administrator privileges are required to apply firewall profile settings." }
    Save-Backup
    Set-LiveValue $DesiredValue
    Write-Output "Applied CIS-aligned live firewall profile setting."
    Write-State
} else {
    Write-Output "Dry run: would set live firewall profile $Profile property $Property to $(Format-Value $DesiredValue)."
    Write-State
}
