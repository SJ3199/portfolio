@echo off
:: Portfolio Restore - Roll back to a previous state
:: Usage: restore.bat              (list restore points)
::        restore.bat AUTO         (restore to latest snapshot)
::        restore.bat <hash>       (restore to specific commit)

set PATH=C:\Program Files\Git\cmd;%PATH%
cd /d D:\portfolio

echo ============================================
echo  Portfolio Restore Tool
echo ============================================
echo.

if "%1"=="" (
    echo Available restore points:
    echo.
    git log --oneline --grep="RESTORE-POINT\|AUTO-SNAPSHOT" -20 2>nul
    echo.
    echo Usage:
    echo   restore.bat AUTO      - restore to latest snapshot
    echo   restore.bat 568fb00   - restore to specific snapshot
    exit /b 0
)

if /i "%1"=="AUTO" (
    for /f "delims=" %%i in ('git log --oneline --grep="AUTO-SNAPSHOT" --format="%%H" -1 2^>nul') do set HASH=%%i
    if "%HASH%"=="" (
        for /f "delims=" %%i in ('git log --oneline --grep="RESTORE-POINT" --format="%%H" -1 2^>nul') do set HASH=%%i
    )
) else (
    set HASH=%1
)

if "%HASH%"=="" (
    echo No snapshot found!
    exit /b 1
)

echo Restoring to: %HASH%
echo.
git reset --hard %HASH%

if %errorlevel% equ 0 (
    echo.
    echo Done! Rebuilding site...
    echo ============================================
    npx astro build 2>nul
    echo Build complete!
) else (
    echo Restore failed! Check snapshot hash.
    exit /b 1
)
