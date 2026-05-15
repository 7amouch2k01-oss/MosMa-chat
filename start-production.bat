@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

REM MosMA Chat Application - Production Build Launcher
REM This script builds and starts the application with optimized production setup

set "LOG_FILE=server.log"
set "PORT=5000"
set "NODE_ENV=production"

echo.
echo ========================================
echo   MosMA Chat - Production Server
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [SUCCESS] Node.js is installed
node --version
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo [INFO] Installing server dependencies...
    call npm install --production
    if !ERRORLEVEL! NEQ 0 (
        echo [ERROR] Failed to install server dependencies
        pause
        exit /b 1
    )
)

REM Check if client build exists, if not build it
if not exist "client\dist" (
    echo [INFO] Building client application...
    echo This may take a few minutes on first run...
    echo.
    
    if not exist "client\node_modules" (
        cd client
        call npm install
        cd ..
    )
    
    call npm run build
    if !ERRORLEVEL! NEQ 0 (
        echo [ERROR] Failed to build client
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo   Starting MosMA Chat Server
echo ========================================
echo.
echo [INFO] Backend: http://localhost:%PORT%
echo [INFO] Frontend: http://localhost:%PORT%
echo [INFO] Logs: %LOG_FILE%
echo.
echo [INFO] Opening browser in 3 seconds...
echo.

REM Wait 3 seconds and open browser
timeout /t 3 /nobreak >nul
start http://localhost:%PORT%

echo [INFO] Starting server...
echo [INFO] Press Ctrl+C in this window to stop the server
echo.

REM Start the server with logging
call node server.js > "%LOG_FILE%" 2>&1

if !ERRORLEVEL! NEQ 0 (
    echo.
    echo [ERROR] Server stopped unexpectedly
    echo Check %LOG_FILE% for details
    pause
)

pause
