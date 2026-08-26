<#
HardSecNet agent installer (Windows). Run from an elevated PowerShell.
Usage:
  .\install.ps1 -Server https://hardsecnet.example.com -Key my-agent-key -WorkspaceToken <client-token> -IntervalMinutes 10
#>
param(
    [Parameter(Mandatory = $true)][string]$Server,
    [string]$Key = "",
    [string]$WorkspaceToken = "",
    [int]$IntervalMinutes = 10
)

$ErrorActionPreference = "Stop"
$installDir = "$env:ProgramFiles\HardSecNet Agent"
$python = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $python) { throw "Python is required and was not found on PATH." }

Write-Host "[*] Installing HardSecNet agent to $installDir"
New-Item -ItemType Directory -Force -Path $installDir | Out-Null
Copy-Item "$PSScriptRoot\hardsecnet_agent.py" $installDir -Force
Copy-Item "$PSScriptRoot\linux_auditor.py" $installDir -Force   # harmless on Windows; keeps the folder portable

# Persist config as machine environment variables for the scheduled task
[Environment]::SetEnvironmentVariable("HSN_SERVER", $Server, "Machine")
[Environment]::SetEnvironmentVariable("HSN_AGENT_KEY", $Key, "Machine")
[Environment]::SetEnvironmentVariable("HSN_WORKSPACE_TOKEN", $WorkspaceToken, "Machine")

$action  = New-ScheduledTaskAction -Execute $python -Argument "`"$installDir\hardsecnet_agent.py`" --once" -WorkingDirectory $installDir
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes)
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName "HardSecNet Agent" -Action $action -Trigger $trigger -Principal $principal -Force | Out-Null
Start-ScheduledTask -TaskName "HardSecNet Agent"
Write-Host "[OK] HardSecNet agent installed. It audits this host every $IntervalMinutes minutes (Task Scheduler: 'HardSecNet Agent')."
