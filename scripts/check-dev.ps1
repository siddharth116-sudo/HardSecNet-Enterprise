$ErrorActionPreference = "Continue"

Write-Host "== HardSecNet environment ==" -ForegroundColor Cyan
python --version
node --version
npm --version

Write-Host "`n== API ==" -ForegroundColor Cyan
try {
    $r = Invoke-WebRequest "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 5
    $r.Content
} catch {
    Write-Host "API unavailable: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n== MongoDB ==" -ForegroundColor Cyan
try {
    Test-NetConnection localhost -Port 27017 -WarningAction SilentlyContinue |
        Select-Object ComputerName,RemotePort,TcpTestSucceeded
} catch {}

Write-Host "`n== Redis ==" -ForegroundColor Cyan
try {
    Test-NetConnection localhost -Port 6379 -WarningAction SilentlyContinue |
        Select-Object ComputerName,RemotePort,TcpTestSucceeded
} catch {}
