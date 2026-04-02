@echo off
TITLE DCS Witchcraft V2 Server

:: 1. Detect script directory (the \windows folder)
:: %~dp0 includes the trailing backslash
set "SCRIPT_DIR=%~dp0"

:: 2. Move to the \src folder relative to the script location
:: /d allows changing drive and directory simultaneously
cd /d "%SCRIPT_DIR%..\src"

echo --- WITCHCRAFT V2 CONFIGURATION (PORTABLE) ---
echo Working Directory: %CD%
echo ----------------------------------------------

:: 3. Verification and Execution
if exist server.js (
    echo [OK] Starting Node.js Engine...
    node server.js
) else (
    echo [ERROR] server.js not found in:
    echo %CD%
    echo.
    echo Please ensure the "src" folder exists alongside the "windows" folder.
    pause
)

:: Keep window open if the server stops or crashes
pause