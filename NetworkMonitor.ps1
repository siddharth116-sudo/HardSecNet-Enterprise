$ErrorActionPreference = "SilentlyContinue"

# Get all TCP connections
$connections = Get-NetTCPConnection | Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, State, OwningProcess

# Group by Process ID (OwningProcess)
$grouped = $connections | Group-Object OwningProcess

$monitorData = @()

foreach ($group in $grouped) {
    $procId = $group.Name
    
    # Get Process Details
    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    $procName = if ($proc) { $proc.ProcessName } else { "Unknown" }
    
    # Filter Remote IPs (exclude 0.0.0.0, ::, and Loopback for the "Endpoint" display)
    # We want to show 127.0.0.1 if it's an active connection, but maybe distinguish it.
    # For "IsExternal", we strictly mean non-loopback.
    
    $allRemotes = $group.Group.RemoteAddress | Select-Object -Unique
    $externalIPs = $allRemotes | Where-Object { $_ -notin @("0.0.0.0", "::", "127.0.0.1", "::1") }
    
    # Determine Status
    $isExternal = ($externalIPs.Count -gt 0)
    
    # Formatting Remote Addresses for Display
    if ($externalIPs) {
        $displayRemote = $externalIPs -join ", "
    }
    elseif ($allRemotes -contains "127.0.0.1" -or $allRemotes -contains "::1") {
        $displayRemote = "Loopback (Localhost)"
    }
    else {
        $displayRemote = "Global Listener (0.0.0.0)"
    }
    
    # Ports
    $ports = $group.Group.LocalPort | Select-Object -Unique | Sort-Object { [int]$_ }
    $displayPorts = $ports -join ", "
    
    # States
    $states = $group.Group.State | Select-Object -Unique
    $displayState = $states -join "/"

    $monitorData += [PSCustomObject]@{
        ProcessName   = $procName
        PID           = $procId
        RemoteAddress = $displayRemote
        LocalPorts    = $displayPorts
        State         = $displayState
        IsExternal    = $isExternal
        Count         = $group.Count
    }
}

# Sort by IsExternal (Interesting ones first), then Name
$monitorData | Sort-Object -Property @{Expression = "IsExternal"; Descending = $true }, ProcessName | ConvertTo-Json -Depth 2
