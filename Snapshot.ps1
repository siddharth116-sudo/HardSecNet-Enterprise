$ErrorActionPreference = "Stop"

# Create timestamped folder
$date = Get-Date -Format "yyyyMMdd_HHmm"
$snapshotPath = Join-Path -Path ".\Snapshots" -ChildPath $date
New-Item -Path $snapshotPath -ItemType Directory -Force | Out-Null

Write-Host "Creating Snapshot in $snapshotPath..."

# 1. Export Registry Keys
Write-Host "Exporting LSA Policy..."
reg export "HKLM\SYSTEM\CurrentControlSet\Control\Lsa" "$snapshotPath\lsa.reg" /y

Write-Host "Exporting System Policies..."
# Note: Specific policies might vary, exporting the whole Policies key for snapshot
reg export "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" "$snapshotPath\system_policies.reg" /y

# 2. Local Security Policy
Write-Host "Exporting Local Security Policy..."
secedit /export /cfg "$snapshotPath\secpol.cfg" | Out-Null

# 3. Firewall Config
Write-Host "Exporting Firewall Config..."
netsh advfirewall show allprofiles > "$snapshotPath\firewall_config.txt"

Write-Host "Snapshot Complete!"
