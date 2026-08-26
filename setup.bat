@echo off
TITLE HardSecNet Enterprise Setup
COLOR 0A

echo ==================================================
echo       HARDSECNET ENTERPRISE INSTALLER v2.0
echo ==================================================
echo.

echo [1/4] Checking Python Environment...
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed! Please install Python 3.10+ and add to PATH.
    PAUSE
    EXIT
)
echo [OK] Python found.

echo.
echo [2/4] Installing Core Dependencies...
echo -------------------------------------
pip install flask flask-cors flask-bcrypt flask-jwt-extended psutil apscheduler reportlab ollama peewee requests
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies. Check internet connection.
    PAUSE
    EXIT
)
echo [OK] Dependencies installed.

echo.
echo [3/4] Initializing AI Engine (Docker)...
echo -------------------------------------
echo Ensuring Ollama container is up...
docker-compose -f deployment/docker-compose.yml up -d ollama
IF %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Docker Compose failed to start Ollama. Ensure Docker Desktop is running.
) ELSE (
    echo [OK] Ollama container started.
)

echo.
echo [4/4] Finalizing Environment...
if not exist "Reports" mkdir Reports
if not exist "Snapshots" mkdir Snapshots
echo [OK] Directories created.

echo.
echo ==================================================
echo           SETUP COMPLETE - READY TO DEPLOY
echo ==================================================
echo.
echo [INSTRUCTIONS]
echo 1. Run 'python app.py' as Administrator.
echo 2. Open dashboard at http://localhost:5173
echo.
PAUSE
