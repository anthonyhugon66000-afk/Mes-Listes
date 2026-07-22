@echo off
chcp 65001 >nul
title Mes Listes - serveur local
cd /d "%~dp0"

echo.
echo   ========================================
echo     Mes Listes - serveur local
echo   ========================================
echo.
echo   Sur cet ordinateur :
echo      http://localhost:8124
echo.
echo   Sur ton iPhone (meme Wi-Fi) :

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  for /f "tokens=1" %%b in ("%%a") do echo      http://%%b:8124
)

echo.
echo   ----------------------------------------
echo   Laisse cette fenetre OUVERTE pendant que
echo   tu utilises l'application.
echo.
echo   Pour arreter : ferme cette fenetre.
echo   ----------------------------------------
echo.

python -m http.server 8124

echo.
echo   Le serveur s'est arrete.
pause
