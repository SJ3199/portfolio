@echo off
title Portfolio Server
cd /d D:\portfolio

echo === Sam Portfolio Server ===
echo.

node gen-gallery.cjs
echo.

start "Portfolio Watcher" /min cmd /c "title Watcher && node D:\portfolio\watch-images.cjs"
start "Astro Dev" /min cmd /c "title Astro && npx astro dev --host --port 4321"

echo Server starting at http://WIN-FH22VJAO99L:4321
echo Modify images -> refresh browser -> instant update
echo.
echo This window will close in 5 seconds...
timeout /t 5 >nul
exit
