@echo off
:: Portfolio Auto-Snapshot - only saves when files changed

set PATH=C:\Program Files\Git\cmd;%PATH%
cd /d D:\portfolio

git add -A 2>nul
git diff --cached --quiet 2>nul
if %errorlevel% equ 0 exit /b 0

for /f "tokens=1-4 delims=/ " %%a in ('date /t') do (set d=%%a-%%b-%%c)
for /f "tokens=1-2 delims=: " %%a in ('time /t') do (set t=%%a:%%b)
git commit -m "AUTO-SNAPSHOT: %d% %t%" 2>nul
exit /b 0
