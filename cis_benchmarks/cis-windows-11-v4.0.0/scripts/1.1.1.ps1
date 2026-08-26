# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 1.1.1 - Ensure 'Enforce password history' is set to '24 or more password(s)'
# Source Page: 40
# Confidence: 0.96
# Status: ready

param(
    [switch]$Apply,
    [switch]$Rollback,
    [switch]$Status
)

$ErrorActionPreference = 'Stop'

$ControlId = [System.IO.Path]::GetFileNameWithoutExtension($PSCommandPath)
$SettingKey = 'PasswordHistorySize'
$DesiredValue = 24

function Test-IsAdmin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-HardSecNetBackupDir {
    $base = Join-Path -Path $env:ProgramData -ChildPath 'HardSecNet\policy_backups'
    if (-not (Test-Path -LiteralPath $base)) {
        New-Item -ItemType Directory -Path $base -Force | Out-Null
    }
    return $base
}

function Export-SecurityPolicy([string]$OutPath) {
    secedit /export /cfg "$OutPath" /areas SECURITYPOLICY | Out-Null
}

function Import-SecurityPolicy([string]$CfgPath) {
    $db = Join-Path -Path $env:TEMP -ChildPath ("hardsecnet-{0}.sdb" -f ([guid]::NewGuid().ToString('N')))
    secedit /configure /db "$db" /cfg "$CfgPath" /areas SECURITYPOLICY | Out-Null
}

function Get-SecPolValue([string]$CfgPath, [string]$Key) {
    foreach ($line in (Get-Content -LiteralPath $CfgPath -ErrorAction Stop)) {
        if ($line -match "^\s*$([regex]::Escape($Key))\s*=\s*(.+?)\s*$") {
            return $Matches[1].Trim()
        }
    }
    return $null
}

function Set-SecPolValue([string]$CfgPath, [string]$Key, [string]$Value) {
    $lines = Get-Content -LiteralPath $CfgPath -ErrorAction Stop
    $updated = $false
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^\s*$([regex]::Escape($Key))\s*=") {
            $lines[$i] = "$Key = $Value"
            $updated = $true
            break
        }
    }
    if (-not $updated) {
        $insertAt = ($lines | Select-String -SimpleMatch '[System Access]' -List).LineNumber
        if (-not $insertAt) {
            throw "Unable to locate [System Access] section in exported security policy."
        }
        $lines = @(
            $lines[0..($insertAt - 1)]
            "$Key = $Value"
            $lines[$insertAt..($lines.Count - 1)]
        )
    }
    Set-Content -LiteralPath $CfgPath -Value $lines -Encoding Unicode -Force
}

function Write-StatusLine([string]$Label, [string]$Value) {
    Write-Output ("{0}: {1}" -f $Label, $Value)
}

function Show-Value($Value) {
    if ($null -eq $Value) { return "<missing>" }
    return [string]$Value
}

$tmp = Join-Path -Path $env:TEMP -ChildPath ("{0}-{1}.cfg" -f $ControlId, ([guid]::NewGuid().ToString('N')))
Export-SecurityPolicy -OutPath $tmp
$current = Get-SecPolValue -CfgPath $tmp -Key $SettingKey

Write-StatusLine -Label 'Control' -Value $ControlId
Write-StatusLine -Label 'Setting' -Value $SettingKey
Write-StatusLine -Label 'Current' -Value (Show-Value $current)
Write-StatusLine -Label 'Desired' -Value $DesiredValue

if ($Status -or (-not $Apply -and -not $Rollback)) {
    if ($null -ne $current -and [int]$current -ge $DesiredValue) {
        Write-Output "Compliant: Enforce password history is $current (>= $DesiredValue)."
        exit 0
    }
    Write-Output ("Not compliant: Enforce password history is {0} (expected >= {1})." -f (Show-Value $current), $DesiredValue)
    exit 2
}

if (-not (Test-IsAdmin)) {
    throw "Administrator privileges are required to apply or rollback local security policy settings."
}

$backupDir = Get-HardSecNetBackupDir
$backup = Join-Path -Path $backupDir -ChildPath ("{0}.cfg" -f $ControlId)

if ($Rollback) {
    if (-not (Test-Path -LiteralPath $backup)) {
        throw "Rollback requested but no backup exists at $backup."
    }
    Import-SecurityPolicy -CfgPath $backup
    Write-Output "Rollback complete from $backup."
    exit 0
}

Copy-Item -LiteralPath $tmp -Destination $backup -Force
Set-SecPolValue -CfgPath $tmp -Key $SettingKey -Value ([string]$DesiredValue)
Import-SecurityPolicy -CfgPath $tmp
Write-Output "Applied: Enforce password history set to $DesiredValue (backup saved to $backup)."
