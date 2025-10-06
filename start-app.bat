@echo off
echo Starting My Notion App...
echo.

echo Checking if MongoDB is running...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo MongoDB is already running.
) else (
    echo Starting MongoDB...
    start "MongoDB" mongod --dbpath "C:\data\db"
    timeout /t 3 >nul
)

echo.
echo Starting the application (Frontend + Backend)...
npm run dev

pause