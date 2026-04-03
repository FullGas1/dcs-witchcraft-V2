@echo off
TITLE DCS Witchcraft V2 Server

:: 1. Détection des dossiers (Chemins relatifs)
set "SCRIPT_DIR=%~dp0"
set "WORKING_DIR=%SCRIPT_DIR%..\src"
set "NODE_BIN=%SCRIPT_DIR%..\bin\node.exe"

:: 2. Basculement vers le dossier source
cd /d "%WORKING_DIR%"

echo --- WITCHCRAFT V2 CONFIGURATION (PORTABLE) ---
echo Working Directory: %CD%
echo ----------------------------------------------

:: 3. Vérification et exécution via le binaire local
if exist "%NODE_BIN%" (
    echo [OK] Moteur Node.js portable detecte.
    echo [OK] Starting Node.js Engine...
    
    :: Appel direct du node.exe local pour éviter l'erreur "non reconnu"
    "%NODE_BIN%" server.js
) else (
    echo [ERROR] node.exe est introuvable dans : %NODE_BIN%
    echo.
    echo Verifiez que vous avez bien place node.exe dans le dossier "bin".
    pause
    exit /b
)

pause