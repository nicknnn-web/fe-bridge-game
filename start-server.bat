@echo off
echo ==========================================
echo   Auyologic GEO Platform - Start Server
echo ==========================================
echo.

REM Check backend directory
if not exist "trashbox\backend" (
    echo [ERROR] Backend directory not found: trashbox\backend
    pause
    exit /b 1
)

cd trashbox\backend

REM Check node_modules
if not exist "node_modules" (
    echo [INFO] Dependencies not found, running npm install...
    echo.
    npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencies installed
    echo.
)

echo [START] Starting backend server...
echo [URL]   http://localhost:3001
echo.

REM Start backend server in new window
start "Backend Server" cmd /k "npm start"

echo [WAIT] Waiting for server to start...
timeout /t 3 /nobreak >nul

echo [OPEN] Opening Chrome...
start chrome http://localhost:3001/dashboard.html

echo.
echo ==========================================
echo [OK] Server started and Chrome opened
echo ==========================================
echo.
pause
