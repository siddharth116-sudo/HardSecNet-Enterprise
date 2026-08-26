$ErrorActionPreference = "Stop"

# Restore Logic: Find latest snapshot and apply
$latestSnapshot = Get-ChildItem -Path ".\Snapshots" -Directory | Sort-Object CreationTime -Descending | Select-Object -First 1

if ($latestSnapshot) {
    Write-Host "Rolling back to snapshot: $($latestSnapshot.FullName)"

    try {
        # 1. Restore Firewall
        Write-Host "Restoring Firewall Config..."
        # Note: netsh restore is complex, relying on text file might be hard. 
        # Ideally we'd use 'netsh advfirewall export' to create a binary backup file (wfw).
        # Since we used 'show allprofiles > txt' earlier, we can't easily restore from txt automatically.
        # Providing a warning instead for this proof of concept unless we change Snapshot logic.
        Write-Warning "Cannot automatically restore firewall from text file. Manual review required."

        # 2. Restore Local Security Policy
        if (Test-Path "$($latestSnapshot.FullName)\secpol.cfg") {
            Write-Host "Restoring Security Policy..."
            secedit /configure /db secedit.sdb /cfg "$($latestSnapshot.FullName)\secpol.cfg" /overwrite | Out-Null
        }

        # 3. Restore Registry
        if (Test-Path "$($latestSnapshot.FullName)\lsa.reg") {
            Write-Host "Restoring LSA Registry..."
            reg import "$($latestSnapshot.FullName)\lsa.reg"
        }
         if (Test-Path "$($latestSnapshot.FullName)\system_policies.reg") {
            Write-Host "Restoring System Policies..."
            reg import "$($latestSnapshot.FullName)\system_policies.reg"
        }

        Write-Host "Rollback Completed Successfully."
    } catch {
        Write-Error "Rollback Failed: $_"
        exit 1
    }
} else {
    Write-Error "No snapshots found to roll back to!"
    exit 1
}
