@echo off
TITLE Witchcraft Cleanup
echo Killing all Node.js instances...
taskkill /f /im node.exe
echo.
echo [DONE] Port 3000 should now be free.
timeout /t 3