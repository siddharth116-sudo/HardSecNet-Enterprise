# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 1.1.6 - Ensure 'Relax minimum password length limits' is set to 'Enabled'
# Source Page: 53
# Confidence: 0.96
# Status: ready

param(
    [switch]$Apply,
    [switch]$Rollback,
    [switch]$Status
)

$ErrorActionPreference = 'Stop'

$ControlId = [System.IO.Path]::GetFileNameWithoutExtension($PSCommandPath)
$RegPath = 'HKLM:\System\CurrentControlSet\Control\SAM'
$RegName = 'RelaxMinimumPasswordLengthLimits'
$DesiredValue = 1

function Test-IsAdmin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-HardSecNetBackupDir {
    $base = Join-Path -Path $env:ProgramData -ChildPath 'HardSecNet\registry_backups'
    if (-not (Test-Path -LiteralPath $base)) {
        New-Item -ItemType Directory -Path $base -Force | Out-Null
    }
    return $base
}

function Read-CurrentValue {
    try {
        $item = Get-ItemProperty -LiteralPath $RegPath -ErrorAction Stop
        $value = $item.$RegName
        if ($null -eq $value) {
            return $null
        }
        return [int]$value
    } catch {
        return $null
    }
}

function Write-StatusLine([string]$Label, [string]$Value) {
    Write-Output ("{0}: {1}" -f $Label, $Value)
}

function Show-Value($Value) {
    if ($null -eq $Value) { return "<missing>" }
    return [string]$Value
}

$current = Read-CurrentValue
Write-StatusLine -Label 'Control' -Value $ControlId
Write-StatusLine -Label 'Registry' -Value ("{0}\{1}" -f $RegPath, $RegName)
Write-StatusLine -Label 'Current' -Value (Show-Value $current)
Write-StatusLine -Label 'Desired' -Value $DesiredValue

if ($Status -or (-not $Apply -and -not $Rollback)) {
    if ($null -ne $current -and $current -eq $DesiredValue) {
        Write-Output "Compliant: Relax minimum password length limits is enabled."
        exit 0
    }
    Write-Output ("Not compliant: RelaxMinimumPasswordLengthLimits is {0} (expected {1})." -f (Show-Value $current), $DesiredValue)
    exit 2
}

if (-not (Test-IsAdmin)) {
    throw "Administrator privileges are required to apply or rollback this registry-backed policy."
}

$backupDir = Get-HardSecNetBackupDir
$backup = Join-Path -Path $backupDir -ChildPath ("{0}.json" -f $ControlId)

if ($Rollback) {
    if (-not (Test-Path -LiteralPath $backup)) {
        throw "Rollback requested but no backup exists at $backup."
    }
    $payload = Get-Content -LiteralPath $backup -Raw -ErrorAction Stop | ConvertFrom-Json
    if ($payload.exists -eq $true) {
        if (-not (Test-Path -LiteralPath $RegPath)) {
            New-Item -Path $RegPath -Force | Out-Null
        }
        Set-ItemProperty -LiteralPath $RegPath -Name $RegName -Value ([int]$payload.value) -Type DWord -Force
        Write-Output "Rollback complete: restored $RegName=$($payload.value) from $backup."
    } else {
        Remove-ItemProperty -LiteralPath $RegPath -Name $RegName -ErrorAction SilentlyContinue
        Write-Output "Rollback complete: removed $RegName (restored to <missing>) from $backup."
    }
    exit 0
}

@{
    control = $ControlId
    path = $RegPath
    name = $RegName
    exists = ($null -ne $current)
    value = $current
    captured_at = (Get-Date).ToString('o')
} | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath $backup -Encoding UTF8 -Force

if (-not (Test-Path -LiteralPath $RegPath)) {
    New-Item -Path $RegPath -Force | Out-Null
}
Set-ItemProperty -LiteralPath $RegPath -Name $RegName -Value $DesiredValue -Type DWord -Force
Write-Output "Applied: $RegName set to $DesiredValue (backup saved to $backup)."
