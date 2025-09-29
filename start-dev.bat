@echo off
echo Starting Notion App Development Environment...
echo.

echo Starting MongoDB (if not already running)...
start "MongoDB" cmd /k "mongod --dbpath=C:\data\db"
timeout /t 3

echo Starting Backend Server...
start "Backend" cmd /k "cd server && npm run dev"
timeout /t 3

echo Starting Frontend...
start "Frontend" cmd /k "npm start"

echo.
echo All services started!
echo - Frontend: http://localhost:3000
echo - Backend: http://localhost:5000
echo - MongoDB: mongodb://localhost:27017
echo.
pause