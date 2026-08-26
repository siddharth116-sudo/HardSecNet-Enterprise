param (
    [string[]]$Targets = @("All")
)

# Robustness: Check if Targets was passed as a single comma-separated string
if ($Targets.Count -eq 1 -and $Targets[0] -match ",") {
    $Targets = $Targets[0] -split "," | ForEach-Object { $_.Trim() }
}

$ErrorActionPreference = "Continue" # Don't stop on single error, try to fix others

Write-Host "Starting System Hardening... Targets: $Targets"

function Should-Run {
    param([string]$Name)
    if ($Targets -contains "All" -or $Targets -contains $Name) { return $true }
    return $false
}

try {
    # 1. Enforce Firewall
    if (Should-Run "Firewall") {
        Write-Host "Enforcing Firewall Profiles..."
        netsh advfirewall set allprofiles state on
        if ($LASTEXITCODE -ne 0) { Write-Error "Failed to set firewall state." }
    }

    # 2. Enforce Password Policy (Minimum Length 14)
    if (Should-Run "Password") {
        Write-Host "Enforcing Minimum Password Length (14)..."
        try { net accounts /minpwlen:14 } catch { Write-Error "Failed to set password length." }
    }

    # 3. Disable Guest Account
    if (Should-Run "Guest") {
        Write-Host "Disabling Guest Account..."
        try { net user Guest /active:no } catch { Write-Error "Failed to disable Guest account." }
    }

    # 4. Account Lockout Threshold (5 attempts)
    if (Should-Run "Lockout") {
        Write-Host "Setting Account Lockout Threshold (5)..."
        try { net accounts /lockoutthreshold:5 } catch { Write-Error "Failed to set lockout threshold." }
    }

    # 5. UAC (Registry)
    if (Should-Run "UAC") {
        Write-Host "Setting UAC to Always Notify..."
        try { Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" -Name "ConsentPromptBehaviorAdmin" -Value 2 -Force }
        catch { Write-Error "Failed to set UAC." }
    }

    # 6. Untrusted Font Blocking (Registry)
    if (Should-Run "FontBlocking") {
        # Ensure key exists first
        if (!(Test-Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\MitigationOptions")) {
            New-Item -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\MitigationOptions" -Force | Out-Null
        }
        Write-Host "Enabling Untrusted Font Blocking..."
        try { Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\MitigationOptions" -Name "MitigationOptions_FontBlocking" -Value "1000000000000" -Force }
        catch { Write-Error "Failed to set Font Blocking." }
    }

    # 7. PowerShell Execution Policy (CIS 18.9.99 — Set to AllSigned)
    # NOTE: We write the registry key directly instead of using Set-ExecutionPolicy.
    # Set-ExecutionPolicy succeeds but emits a non-fatal "override" warning when the
    # Process scope (set by -ExecutionPolicy Bypass on the parent shell) is more specific.
    # Writing the registry key directly avoids that warning and is the same net effect.
    if (Should-Run "ExecutionPolicy") {
        Write-Host "Setting PowerShell Execution Policy to AllSigned (via registry)..."
        try {
            $policyPath = "HKLM:\SOFTWARE\Microsoft\PowerShell\1\ShellIds\Microsoft.PowerShell"
            if (!(Test-Path $policyPath)) {
                New-Item -Path $policyPath -Force | Out-Null
            }
            Set-ItemProperty -Path $policyPath -Name "ExecutionPolicy" -Value "AllSigned" -Force
            $verified = (Get-ItemProperty -Path $policyPath -Name "ExecutionPolicy" -ErrorAction SilentlyContinue).ExecutionPolicy
            if ($verified -eq "AllSigned") {
                Write-Host "Execution Policy set to AllSigned at LocalMachine scope."
            } else {
                Write-Error "Registry write appeared to succeed but value is: $verified"
            }
        } catch {
            Write-Error "Failed to set PowerShell Execution Policy: $_"
        }
    }

    # 8. Windows Automatic Updates (CIS 18.9.102 — Enable auto-updates via registry)
    if (Should-Run "AutoUpdate") {
        Write-Host "Enabling Windows Automatic Updates..."
        try {
            $auPath = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU"
            if (!(Test-Path $auPath)) {
                New-Item -Path $auPath -Force | Out-Null
            }
            # 0 = auto-updates enabled; 4 = auto download and schedule install
            Set-ItemProperty -Path $auPath -Name "NoAutoUpdate"       -Value 0 -Force
            Set-ItemProperty -Path $auPath -Name "AUOptions"          -Value 4 -Force
            Set-ItemProperty -Path $auPath -Name "ScheduledInstallDay" -Value 0 -Force

            # Ensure the Windows Update service is not disabled
            $svc = Get-Service -Name wuauserv -ErrorAction SilentlyContinue
            if ($svc -and $svc.StartType -eq "Disabled") {
                Set-Service -Name wuauserv -StartupType Automatic
            }
        } catch {
            Write-Error "Failed to enable Automatic Updates: $_"
        }
    }

    Write-Host "Hardening Pass Complete!"

} catch {
    Write-Error "Critical Script Failure: $_"
    exit 1
}
