# Remote_Agent_Setup.ps1
# Run this on the Target Machine (Friend's Laptop / VM) as Administrator

Write-Host "--- HardSecNet Remote Agent Setup ---" -ForegroundColor Cyan

# 1. Set Network Profile to Private (Required for WinRM)
Write-Host "[*] Setting Network Profile to Private..."
try {
    Get-NetConnectionProfile | Set-NetConnectionProfile -NetworkCategory Private -ErrorAction SilentlyContinue
    Write-Host "[+] Network set to Private." -ForegroundColor Green
}
catch {
    Write-Host "[!] Could not set network profile. (Might already be private or restricted)" -ForegroundColor Yellow
}

# 2. Enable WinRM (Remote Management)
Write-Host "[*] Enabling WinRM..."
try {
    Enable-PSRemoting -Force -SkipNetworkProfileCheck -ErrorAction Stop
    Write-Host "[+] WinRM Enabled." -ForegroundColor Green
}
catch {
    Write-Host "[!] WinRM Enable Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Allow ICMP (Ping)
Write-Host "[*] Allowing Ping (ICMP)..."
try {
    New-NetFirewallRule -DisplayName "Allow inbound ICMPv4" -Direction Inbound -Protocol ICMPv4 -IcmpType 8 -RemoteAddress Any -Action Allow -ErrorAction SilentlyContinue | Out-Null
    Write-Host "[+] Ping Allowed." -ForegroundColor Green
}
catch {
    Write-Host "[!] Could not add Firewall rule for Ping." -ForegroundColor Yellow
}

# 4. Display IP Address
$ipInfo = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254*" }
$ip = $ipInfo.IPAddress

Write-Host "`n------------------------------------------------"
Write-Host "SETUP COMPLETE" -ForegroundColor Cyan
Write-Host "------------------------------------------------"
Write-Host "Run this on the Friend's Laptop:"
Write-Host "1. Ensure you have a local admin account (e.g. HardSecAdmin)"
Write-Host "2. Connect from the Dashboard using the IP below:"
Write-Host ""
Write-Host "TARGET IP ADDRESS: $ip" -ForegroundColor Green
Write-Host "------------------------------------------------"
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
