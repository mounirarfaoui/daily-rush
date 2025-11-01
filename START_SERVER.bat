@echo off
echo ========================================
echo Daily Rush - Local Web Server
echo ========================================
echo.

REM Change to script directory first
cd /d "%~dp0"

REM Try Python first
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Starting server with Python...
    echo.
    echo Open your browser to: http://localhost:8000/index.html
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    python -m http.server 8000
    goto :end
)

REM Try Node.js (using custom server.js)
node --version >nul 2>&1
if %errorlevel% == 0 (
    if exist "server.js" (
        echo Starting server with Node.js...
        echo.
        echo Open your browser to: http://localhost:8000
        echo.
        echo Press Ctrl+C to stop the server
        echo.
        node server.js
        goto :end
    )
)

REM Try PHP
php --version >nul 2>&1
if %errorlevel% == 0 (
    echo Starting server with PHP...
    echo.
    echo Open your browser to: http://localhost:8000/index.html
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    php -S localhost:8000
    goto :end
)

echo.
echo ERROR: No web server found!
echo.
echo Please install one of the following:
echo.
echo Option 1: Install Python
echo   Download from: https://www.python.org/downloads/
echo   Make sure to check "Add Python to PATH" during installation
echo.
echo Option 2: Install Node.js
echo   Download from: https://nodejs.org/
echo.
echo Option 3: Install PHP
echo   Download from: https://www.php.net/downloads
echo.
echo Option 4: Use Visual Studio Code Live Server Extension
echo   1. Install VS Code
echo   2. Install "Live Server" extension
echo   3. Right-click index.html and select "Open with Live Server"
echo.
pause

:end
