param(
    [switch]$Apply,
    [switch]$Rollback,
    [switch]$Status
)

$ErrorActionPreference = 'Stop'

$ControlId = '1.1.2'
$SettingTitle = "Ensure 'Maximum password age' is set to '365 or fewer days, but not 0'"
$DesiredMax = 365
$RollbackMax = 42
$BackupRoot = Join-Path $env:ProgramData 'HardSecNet\policy_backups'
$BackupPath = Join-Path $BackupRoot "$ControlId-maxpwage.txt"

function Test-IsAdmin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-MaxPasswordAge {
    $output = & net accounts 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "net accounts failed."
    }
    foreach ($line in $output) {
        if ($line -match 'Maximum password age\s+(.+)$') {
            $raw = $Matches[1].Trim()
            if ($raw -match 'UNLIMITED') {
                return [pscustomobject]@{ Raw = $raw; Value = 0 }
            }
            if ($raw -match '(\d+)') {
                return [pscustomobject]@{ Raw = $raw; Value = [int]$Matches[1] }
            }
            return [pscustomobject]@{ Raw = $raw; Value = $null }
        }
    }
    return [pscustomobject]@{ Raw = '<missing>'; Value = $null }
}

function Write-State {
    $state = Get-MaxPasswordAge
    $compliant = ($null -ne $state.Value -and $state.Value -ge 1 -and $state.Value -le $DesiredMax)
    $label = if ($compliant) { 'ON' } else { 'OFF' }
    Write-Output "Setting: $ControlId - $SettingTitle"
    Write-Output "Command: net accounts"
    Write-Output "Expected: Maximum password age = 1..$DesiredMax"
    Write-Output "Current value: $($state.Raw)"
    Write-Output "Status: $label"
    Write-Output "Benefit: limits how long a local password can remain unchanged, reducing stale-credential risk."
}

function Ensure-Backup([int]$CurrentValue) {
    if (-not (Test-Path -LiteralPath $BackupRoot)) {
        New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null
    }
    Set-Content -LiteralPath $BackupPath -Value ([string]$CurrentValue) -Encoding ASCII -Force
}

if ($Status) {
    Write-State
    exit 0
}

if ($Rollback) {
    if (-not (Test-IsAdmin)) {
        throw 'Administrator privileges are required to rollback password policy settings.'
    }
    if (-not (Test-Path -LiteralPath $BackupPath)) {
        & net accounts /MAXPWAGE:$RollbackMax | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw 'net accounts rollback failed.'
        }
        Write-Output "Rollback backup not found. Applied demo rollback value $RollbackMax days."
        Write-State
        exit 0
    }
    $rawBackup = (Get-Content -LiteralPath $BackupPath -ErrorAction Stop | Select-Object -First 1).Trim()
    $restoreValue = if ($rawBackup -match '^\d+$') { [int]$rawBackup } else { $RollbackMax }
    & net accounts /MAXPWAGE:$restoreValue | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "net accounts rollback failed for value $restoreValue."
    }
    Write-Output "Rollback complete: maximum password age restored to $restoreValue days."
    Write-State
    exit 0
}

if ($Apply) {
    if (-not (Test-IsAdmin)) {
        throw 'Administrator privileges are required to apply password policy settings.'
    }
    $current = Get-MaxPasswordAge
    if ($null -ne $current.Value) {
        Ensure-Backup -CurrentValue $current.Value
    }
    & net accounts /MAXPWAGE:$DesiredMax | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "net accounts apply failed for value $DesiredMax."
    }
    Write-Output "Applied: maximum password age set to $DesiredMax days."
    Write-State
    exit 0
}

Write-Output "Dry run: would set maximum password age to $DesiredMax days."
Write-State
