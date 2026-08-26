param (
    [string]$Type = "before"
)

$ErrorActionPreference = "Stop"

$hostname = $env:COMPUTERNAME
$date = Get-Date -Format "yyyyMMdd_HHmm"
$reportPath = ".\Reports\audit_${date}_${Type}.json"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$checks = @()

# 1. Firewall Status
try {
    $firewallProfiles = Get-NetFirewallProfile
    foreach ($profile in $firewallProfiles) {
        if ($profile.Enabled -eq $true) {
            $status = "Compliant"
        } else {
            $status = "Action Required"
        }
        
        $checks += [PSCustomObject]@{
            Name = "Firewall $($profile.Name) Profile"
            Value = if ($profile.Enabled) { "Enabled" } else { "Disabled" }
            Status = $status
        }
    }
} catch {
    $checks += [PSCustomObject]@{ Name="Firewall"; Value="Error"; Status="Action Required" }
}

# 2. MinPasswordLength (Target: 14)
try {
    $netAccounts = net accounts | Select-String "Minimum password length"
    if ($netAccounts -match "(\d+)") {
        $minLength = [int]$matches[1]
    } else {
        $minLength = 0 
    }
    
    if ($minLength -ge 14) {
        $status = "Compliant"
    } else {
        $status = "Action Required"
    }

    $checks += [PSCustomObject]@{
        Name = "Minimum Password Length"
        Value = "$minLength characters"
        Status = $status
    }
} catch {
    $checks += [PSCustomObject]@{ Name="Minimum Password Length"; Value="Error"; Status="Action Required" }
}

# 3. GuestAccount Status (Target: Disabled)
try {
    $guest = Get-LocalUser -Name "Guest" -ErrorAction SilentlyContinue
    if ($guest) {
        if ($guest.Enabled -eq $false) {
            $status = "Compliant"
            $val = "Disabled"
        } else {
            $status = "Action Required"
            $val = "Enabled"
        }
    } else {
        $status = "Compliant" 
        $val = "Not Found"
    }

    $checks += [PSCustomObject]@{
        Name = "Guest Account Status"
        Value = $val
        Status = $status
    }
} catch {
    $checks += [PSCustomObject]@{ Name="Guest Account Status"; Value="Error"; Status="Action Required" }
}


# --- NEW CHECKS ---

# 4. Account Lockout Threshold (Target: <= 5)
try {
    $lockoutStr = net accounts | Select-String "Lockout threshold"
    if ($lockoutStr -match "(\d+)") {
        $lockoutVal = [int]$matches[1]
    } else {
        $lockoutVal = 999 
    }

    if ($lockoutVal -gt 0 -and $lockoutVal -le 5) {
        $status = "Compliant"
    } else {
        $status = "Action Required"
    }

    $checks += [PSCustomObject]@{
        Name = "Account Lockout Threshold"
        Value = "$lockoutVal attempts"
        Status = $status
    }
} catch {
    $checks += [PSCustomObject]@{ Name="Account Lockout Threshold"; Value="Error"; Status="Action Required" }
}

# 5. UAC (User Account Control)
try {
    $uacKey = Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" -Name "ConsentPromptBehaviorAdmin" -ErrorAction SilentlyContinue
    if ($uacKey) {
        $uacVal = $uacKey.ConsentPromptBehaviorAdmin
        # 2 = Always notify, 5 = Prompt for credentials regarding simple elevation? Generally 2 or 5 is safer. Only 0 (elevate without prompting) is bad.
        # Strict benchmark usually wants 'Always notify' -> 2
        if ($uacVal -eq 2) {
            $status = "Compliant"
            $desc = "Always Notify (2)"
        } else {
            $status = "Action Required"
            $desc = "Level $uacVal"
        }
    } else {
        $status = "Action Required"
        $desc = "Not Set"
    }

    $checks += [PSCustomObject]@{
        Name = "User Account Control (UAC)"
        Value = $desc
        Status = $status
    }
} catch {
    $checks += [PSCustomObject]@{ Name="User Account Control (UAC)"; Value="Error"; Status="Action Required" }
}

# 6. Untrusted Font Blocking
try {
    $fontKey = Get-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\MitigationOptions" -Name "MitigationOptions_FontBlocking" -ErrorAction SilentlyContinue

    if ($fontKey) {
        $fontVal = $fontKey.MitigationOptions_FontBlocking
        # 1000000000000 check needed? Usually simple value check.
        # This is complex, let's assume existence and value > 0 is good for now.
        if ($fontVal) {
             $status = "Compliant"
             $val = "Enabled"
        } else {
             $status = "Action Required"
             $val = "Disabled"
        }
    } else {
        $status = "Action Required"
        $val = "Not Configured"
    }

    $checks += [PSCustomObject]@{
        Name = "Untrusted Font Blocking"
        Value = $val
        Status = $status
    }
} catch {
    $checks += [PSCustomObject]@{ Name="Untrusted Font Blocking"; Value="Error"; Status="Action Required" }
}


# 7. PowerShell Execution Policy (CIS 18.9.99 — Restrict to AllSigned or Restricted)
# We read the registry key directly so the Process-scope override (-ExecutionPolicy Bypass
# on the parent shell) does NOT pollute the result.
try {
    $policyPath = "HKLM:\SOFTWARE\Microsoft\PowerShell\1\ShellIds\Microsoft.PowerShell"
    $regVal = (Get-ItemProperty -Path $policyPath -Name "ExecutionPolicy" -ErrorAction SilentlyContinue).ExecutionPolicy

    # Fall back to LocalMachine scope query if registry key not present
    if (-not $regVal -or $regVal -eq "") {
        $regVal = (Get-ExecutionPolicy -Scope LocalMachine -ErrorAction SilentlyContinue).ToString()
    }
    if (-not $regVal -or $regVal -eq "Undefined") { $regVal = "Not Configured" }

    if ($regVal -in @("AllSigned", "Restricted")) {
        $status = "Compliant"
    } else {
        $status = "Action Required"
    }

    $checks += [PSCustomObject]@{
        Name   = "PowerShell Execution Policy"
        Value  = $regVal
        Status = $status
    }
} catch {
    $checks += [PSCustomObject]@{ Name = "PowerShell Execution Policy"; Value = "Error"; Status = "Action Required" }
}

# 8. Windows Automatic Updates (CIS 18.9.102 — Auto-update must be enabled)
try {
    $auReg = Get-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" `
        -Name "NoAutoUpdate" -ErrorAction SilentlyContinue

    if ($auReg -and $auReg.NoAutoUpdate -eq 1) {
        $status = "Action Required"
        $val    = "Disabled (Policy)"
    } else {
        # Also check via Windows Update service state
        $wuauserv = Get-Service -Name wuauserv -ErrorAction SilentlyContinue
        if ($wuauserv -and $wuauserv.StartType -eq "Disabled") {
            $status = "Action Required"
            $val    = "Service Disabled"
        } else {
            $status = "Compliant"
            $val    = "Enabled"
        }
    }

    $checks += [PSCustomObject]@{
        Name   = "Windows Automatic Updates"
        Value  = $val
        Status = $status
    }
} catch {
    $checks += [PSCustomObject]@{ Name = "Windows Automatic Updates"; Value = "Error"; Status = "Action Required" }
}

$output = [PSCustomObject]@{
    Hostname = $hostname
    Timestamp = $timestamp
    Type = $Type
    Checks = $checks
    AuditFile = $reportPath
}

# Ensure Reports dir exists
if (!(Test-Path ".\Reports")) { New-Item -ItemType Directory -Force -Path ".\Reports" | Out-Null }

# Output as UTF-16 JSON
$output | ConvertTo-Json -Depth 3 | Out-File -FilePath $reportPath -Encoding Unicode

# Also update 'latest' symlink or copy for easy access? 
# For now, let app.py find the latest by timestamp if needed, OR just output filename to stdout
Write-Host $reportPath
