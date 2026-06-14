@echo off
REM ============================================
REM MosMA Chat Application - Quick Start
REM ============================================
REM This is a simple launcher that starts the development server
REM 
REM How to use:
REM 1. Run this file by double-clicking it
REM 2. The application will open automatically in your browser
REM 3. Press Ctrl+C to stop the server when done

cd /d "%~dp0"

REM Check for Node.js
where node >nul 2>nul
if errorlevel 1 (
    color 0C
    echo.
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Then try running this file again.
    echo.
    pause
    exit /b 1
)

REM Install dependencies on first run
if not exist "node_modules" (
    echo Installing dependencies... This may take 2-3 minutes.
    call pnpm install
)

if not exist "client\node_modules" (
    echo Installing client dependencies... This may take 2-3 minutes.
    cd client
    call pnpm install
    cd ..
)

echo.
echo Starting MosMA Chat Application...
echo Application URL: http://localhost:3000
echo API URL: http://localhost:5000
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul

REM Open browser
start http://localhost:3000

REM Start dev server
call pnpm run dev

pause
