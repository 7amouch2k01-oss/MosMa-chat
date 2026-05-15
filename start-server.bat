@echo off
setlocal enabledelayedexpansion

REM MosMA Chat Application Local Server Launcher
REM This script starts the backend and frontend servers

echo.
echo ========================================
echo   MosMA Chat Application - Local Server
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed or not in PATH
    pause
    exit /b 1
)

echo [INFO] Node.js found: 
node --version
echo.
echo [INFO] npm found:
npm --version
echo.

REM Check if node_modules exist, if not install dependencies
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    if !ERRORLEVEL! NEQ 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if client/node_modules exist
if not exist "client\node_modules" (
    echo [INFO] Installing client dependencies...
    cd client
    call npm install
    cd ..
    if !ERRORLEVEL! NEQ 0 (
        echo [ERROR] Failed to install client dependencies
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo   Starting Servers...
echo ========================================
echo.
echo The application will be available at:
echo   http://localhost:3000 (Frontend)
echo   http://localhost:5000 (Backend API)
echo.
echo [INFO] Press Ctrl+C to stop all servers
echo.

REM Start the development server
call npm run dev

pause
