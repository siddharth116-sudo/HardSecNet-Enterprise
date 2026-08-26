# CIS Benchmark: CIS Microsoft Windows 11 Stand-alone Benchmark
# Control: 17.7.2 - Ensure 'Audit Authentication Policy Change' is set to include 'Success'
# Status: reviewed_ready
# Review Notes: Audit policy remediation implemented using auditpol with the benchmark-provided subcategory GUID.

param([switch]$Apply, [switch]$Rollback, [switch]$Status)
$ErrorActionPreference = "Stop"

$SubcategoryGuid = "{0cce9230-69ae-11d9-bed3-505054503030}"
$SettingTitle = "17.7.2 - Ensure 'Audit Authentication Policy Change' is set to include 'Success'"
$ExpectSuccess = $true
$ExpectFailure = $false
$ExpectedDescription = "Success=Enabled; Failure=Disabled"
$RollbackDescription = "Rollback disables auditing for this subcategory so the system returns to a local not-configured style state."

function Get-AuditPolicyLine {
    $output = & auditpol /get /subcategory:"$SubcategoryGuid"
    if ($LASTEXITCODE -ne 0) {
        throw "auditpol /get failed for $SubcategoryGuid"
    }
    foreach ($line in $output) {
        if ($line -match [regex]::Escape($SubcategoryGuid)) {
            return $line.Trim()
        }
    }
    foreach ($line in $output) {
        if ($line -match 'Success' -or $line -match 'Failure' -or $line -match 'No Auditing') {
            return $line.Trim()
        }
    }
    return ($output -join " `n")
}

function Get-AuditFlags([string]$Line) {
    $normalized = $Line.ToLowerInvariant()
    return [pscustomobject]@{
        Success = ($normalized -match 'success')
        Failure = ($normalized -match 'failure')
        Raw = $Line
    }
}

function Test-Compliant($Flags) {
    return ($Flags.Success -eq $ExpectSuccess -and $Flags.Failure -eq $ExpectFailure)
}

function Write-State {
    $line = Get-AuditPolicyLine
    $flags = Get-AuditFlags $line
    $label = if (Test-Compliant $flags) { "ON" } else { "OFF" }
    Write-Output "Setting: $SettingTitle"
    Write-Output "Audit subcategory: $SubcategoryGuid"
    Write-Output "Expected: $ExpectedDescription"
    Write-Output "Current policy: $($flags.Raw)"
    Write-Output "Status: $label"
    Write-Output "Benefit: aligns advanced audit policy coverage with the CIS benchmark for this event category."
}

function Set-DesiredPolicy {
    $successValue = if ($ExpectSuccess) { 'enable' } else { 'disable' }
    $failureValue = if ($ExpectFailure) { 'enable' } else { 'disable' }
    & auditpol /set /subcategory:"$SubcategoryGuid" /success:$successValue /failure:$failureValue | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "auditpol /set failed for $SubcategoryGuid"
    }
}

function Clear-Policy {
    & auditpol /set /subcategory:"$SubcategoryGuid" /success:disable /failure:disable | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "auditpol rollback failed for $SubcategoryGuid"
    }
}

if ($Status) {
    Write-State
} elseif ($Rollback) {
    Clear-Policy
    Write-Output $RollbackDescription
    Write-State
} elseif ($Apply) {
    Set-DesiredPolicy
    Write-Output "Applied CIS-aligned audit policy."
    Write-State
} else {
    Write-Output "Dry run: would set auditpol $SubcategoryGuid to $ExpectedDescription."
    Write-State
}
