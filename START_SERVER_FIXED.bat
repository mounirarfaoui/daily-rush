@echo off
echo ========================================
echo Daily Rush - Local Web Server
echo ========================================
echo.

REM Change to the directory where this batch file is located
cd /d "%~dp0"

echo Current directory: %CD%
echo.

REM Try Node.js with custom server.js
node --version >nul 2>&1
if %errorlevel% == 0 (
    if exist "server.js" (
        echo ✅ Starting server with Node.js...
        echo.
        echo 🌐 Your app will be available at:
        echo    http://localhost:8000
        echo.
        echo 📝 Press Ctrl+C to stop the server
        echo.
        node server.js
        goto :end
    ) else (
        echo ❌ server.js not found in current directory
        echo.
    )
)

REM Try Python
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Starting server with Python...
    echo.
    echo 🌐 Your app will be available at:
    echo    http://localhost:8000
    echo.
    echo 📝 Press Ctrl+C to stop the server
    echo.
    python -m http.server 8000
    goto :end
)

echo.
echo ❌ ERROR: No web server found!
echo.
echo Please install one of the following:
echo.
echo Option 1: Install Node.js (Recommended)
echo   Download from: https://nodejs.org/
echo.
echo Option 2: Install Python
echo   Download from: https://www.python.org/downloads/
echo   Make sure to check "Add Python to PATH"
echo.
pause

:end

