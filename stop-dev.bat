@echo off
echo Stopping WebSphere Development Environment...
echo.

echo Stopping all Node.js processes...
taskkill /F /IM node.exe 2>nul

echo.
echo ✅ All development servers stopped.
pause