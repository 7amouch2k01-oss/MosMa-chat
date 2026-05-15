@echo off
setlocal enabledelayedexpansion

REM ============================================
REM MosMA CHAT APPLICATION LOCAL SERVER
REM ============================================
REM Version: 1.0.0
REM Description: Launches the chat application locally
REM ============================================

title MosMA Chat - Local Server

REM Change to script directory
cd /d "%~dp0"

REM Color: Green text on black
color 0A

cls
echo.
echo ========================================
echo.
echo        ^>^>^> MosMA CHAT ^<^<^<
echo         Local Server Launcher
echo.
echo ========================================
echo.

REM Check Node.js installation
echo [*] Checking Node.js installation...
where node >nul 2>nul
if errorlevel 1 (
    color 0C
    echo.
    echo [ERROR] Node.js is NOT installed!
    echo.
    echo Please install Node.js from:
    echo   https://nodejs.org/
    echo.
    echo After installation, run this file again.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js found: %NODE_VERSION%

REM Check npm installation
where npm >nul 2>nul
if errorlevel 1 (
    color 0C
    echo [ERROR] npm is NOT installed!
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm found: %NPM_VERSION%
echo.

REM Check and install server dependencies
if not exist "node_modules" (
    echo [*] Installing server dependencies...
    echo This may take 1-2 minutes...
    call npm install --silent >nul 2>&1
    if errorlevel 1 (
        color 0C
        echo [ERROR] Failed to install server dependencies
        pause
        exit /b 1
    )
    echo [OK] Server dependencies installed
)

REM Check and install client dependencies
if not exist "client\node_modules" (
    echo [*] Installing client dependencies...
    echo This may take 2-3 minutes...
    cd client
    call npm install --silent >nul 2>&1
    cd ..
    if errorlevel 1 (
        color 0C
        echo [ERROR] Failed to install client dependencies
        pause
        exit /b 1
    )
    echo [OK] Client dependencies installed
)

echo.
echo ========================================
echo   SERVER DETAILS
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo.
echo ========================================
echo   STARTING SERVERS...
echo ========================================
echo.
echo Auto-opening browser in 3 seconds...
echo.
echo [INFO] Press Ctrl+C to stop all servers
echo [INFO] Logs will appear below:
echo.

REM Add small delay
timeout /t 3 /nobreak >nul

REM Open browser
start http://localhost:3000

REM Start development server
color 0B
call npm run dev

REM If we get here, servers stopped
color 0C
echo.
echo ========================================
echo   SERVER STOPPED
echo ========================================
echo.

pause
exit /b 0
