@echo off
chcp 65001 >nul
title Mes Listes - tests
cd /d "%~dp0"

echo.
echo   ========================================
echo     Mes Listes - tests
echo   ========================================
echo.
echo   La page va s'ouvrir dans ton navigateur.
echo   Appuie sur "Lancer les tests".
echo.
echo   ----------------------------------------
echo   Laisse cette fenetre OUVERTE pendant les
echo   tests. Pour arreter : ferme-la.
echo   ----------------------------------------
echo.

rem Le navigateur est lance avant le serveur : il patientera le temps que
rem Python demarre, alors que l'inverse bloquerait sur le serveur.
start "" http://localhost:8124/tests.html

python -m http.server 8124

echo.
echo   Le serveur s'est arrete.
pause
