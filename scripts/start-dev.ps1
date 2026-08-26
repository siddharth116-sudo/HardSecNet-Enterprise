$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "HardSecNet development startup" -ForegroundColor Cyan

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    throw "Python is not installed or not on PATH."
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js is not installed or not on PATH."
}

if (-not (Test-Path ".venv\Scripts\python.exe")) {
    python -m venv .venv
}

& ".venv\Scripts\python.exe" -m pip install -r requirements.txt

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example. Review it before continuing." -ForegroundColor Yellow
}

if (-not (Test-Path "Dashboard\node_modules")) {
    Push-Location Dashboard
    npm install
    Pop-Location
}

Write-Host "Starting Flask API in a new window..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location '$root'; .\.venv\Scripts\Activate.ps1; python app.py"

Write-Host "Starting React dashboard in a new window..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location '$root\Dashboard'; npm run dev"

Write-Host ""
Write-Host "API:       http://localhost:5000/api/health"
Write-Host "Dashboard: http://localhost:5173"
Write-Host ""
Write-Host "MongoDB and Redis must already be running." -ForegroundColor Yellow
