@echo off
echo Starting WebSphere Development Environment...
echo.

REM Kill any existing node processes
echo Stopping any existing Node.js processes...
taskkill /F /IM node.exe 2>nul

REM Wait a moment for processes to stop
timeout /t 2 /nobreak >nul

echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d %~dp0backend && npm start"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

echo Starting Frontend Development Server...
start "Frontend Dev Server" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ✅ Both servers are starting...
echo 📍 Backend: http://localhost:5000
echo 📍 Frontend: http://localhost:3000
echo.
echo Press any key to exit this script (servers will continue running)...
pause >nul