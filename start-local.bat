@echo off
REM SkillBridge Quick Start for Windows
REM Run this script to start both frontend and backend

echo.
echo ╔════════════════════════════════════════╗
echo ║  SkillBridge - Quick Start (Windows)    ║
echo ╚════════════════════════════════════════╝
echo.

REM Check if Node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Node.js not found! Please install from https://nodejs.org
    pause
    exit /b 1
)

echo ✓ Node.js found
node --version

echo.
echo Setting up backend...
cd skillbridge-backend
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo.
echo ⚠️  IMPORTANT: Database Setup
echo.
echo Before running, ensure you have:
echo 1. Created .env.local with:
echo    - DATABASE_URL (from Neon)
echo    - CLERK_API_KEY
echo    - CLERK_JWT_KEY
echo.
echo 2. Run schema initialization:
echo    npm run migrate
echo.
echo Start backend? (Y/N)
set /p start_backend=">> "
if /i "%start_backend%"=="Y" (
    echo Starting backend on http://localhost:3001...
    start cmd /k "npm run dev"
)

cd ..

echo.
echo Setting up frontend...
cd skillbridge-frontend
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo.
echo Frontend setup complete!
echo Ensure .env.local has:
echo - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
echo - NEXT_PUBLIC_BACKEND_URL
echo.
echo Start frontend? (Y/N)
set /p start_frontend=">> "
if /i "%start_frontend%"=="Y" (
    echo Starting frontend on http://localhost:3000...
    start cmd /k "npm run dev"
)

cd ..

echo.
echo ✓ Setup complete!
echo.
echo Frontend: http://localhost:3000
echo Backend: http://localhost:3001
echo.
pause
