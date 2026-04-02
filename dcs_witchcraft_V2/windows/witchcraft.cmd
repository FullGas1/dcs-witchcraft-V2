@echo off
TITLE DCS Witchcraft V2 Server

:: 1. On force le passage sur le disque E:
E:

:: 2. On se déplace précisément dans le dossier src
cd "\DCS\Edition_Missions_Outils\WitchCraft\dcs_witchcraft_V2\src"

echo --- CONFIGURATION V2 ---
echo Dossier de travail : %CD%
echo -----------------------

:: 3. On vérifie la présence du fichier avant de lancer
if exist server.js (
    echo [OK] Lancement de Node...
    node server.js
) else (
    echo [ERREUR] server.js est introuvable dans %CD%
    echo Verifiez le chemin dans le fichier .cmd
    pause
)

:: Garder la fenêtre ouverte en cas d'arrêt du serveur
pause