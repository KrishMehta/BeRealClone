@echo off
setlocal enabledelayedexpansion

REM BeReal Clone - One-Click Setup & Launch Script (Windows)
REM This script will automatically set up and run the BeReal Clone app

echo.
echo 🎬 BeReal Clone - Automated Setup ^& Launch
echo ==========================================
echo.

REM Check if Node.js is installed
echo [INFO] Checking Node.js installation...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo [INFO] Please install Node.js from https://nodejs.org/
    echo [INFO] Recommended version: Node.js 18.x or later
    pause
    exit /b 1
)

for /f "tokens=*" %%a in ('node --version') do set NODE_VERSION=%%a
echo [SUCCESS] Node.js is installed: !NODE_VERSION!

REM Check if npm is installed
echo [INFO] Checking npm installation...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)

for /f "tokens=*" %%a in ('npm --version') do set NPM_VERSION=%%a
echo [SUCCESS] npm is installed: !NPM_VERSION!

REM Navigate to the script directory
cd /d "%~dp0"
echo [INFO] Working directory: %CD%

REM Check if package.json exists
if not exist "package.json" (
    echo [ERROR] package.json not found! Make sure you're in the BeReal Clone project directory.
    pause
    exit /b 1
)

echo [SUCCESS] Found package.json

REM Install dependencies
echo [INFO] Installing project dependencies...
if not exist "node_modules" (
    echo [INFO] Running npm install...
    call npm install
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed successfully
) else (
    echo [SUCCESS] Dependencies already installed
)

REM Check if Expo CLI is available
echo [INFO] Checking Expo CLI...
where expo >nul 2>&1
if %errorlevel% neq 0 (
    where npx >nul 2>&1
    if !errorlevel! neq 0 (
        echo [ERROR] Neither expo CLI nor npx is available!
        pause
        exit /b 1
    )
    echo [WARNING] Expo CLI not found globally, will use npx expo
    set EXPO_CMD=npx expo
) else (
    echo [SUCCESS] Expo CLI is available
    set EXPO_CMD=expo
)

REM Clear Expo cache (optional, helps with issues)
echo [INFO] Clearing Expo cache for fresh start...
%EXPO_CMD% start --clear >nul 2>&1 || echo Cache cleared

echo [SUCCESS] Setup completed successfully!
echo.
echo 🚀 Starting BeReal Clone Development Server...
echo ==============================================
echo.
echo [INFO] The app will start in development mode
echo [INFO] A QR code will appear - scan it with your phone camera
echo [INFO] Make sure you have the 'Expo Go' app installed:
echo [INFO] - iOS: App Store
echo [INFO] - Android: Google Play Store
echo.
echo [WARNING] To stop the server, press Ctrl+C
echo.

REM Start the Expo development server
echo [INFO] Launching Expo development server...

REM Start the development server
%EXPO_CMD% start
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start development server
    echo [INFO] Try running manually: %EXPO_CMD% start
    pause
    exit /b 1
)

echo [SUCCESS] Development server started successfully!
pause
