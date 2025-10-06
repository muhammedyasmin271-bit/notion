Write-Host "Starting My Notion App..." -ForegroundColor Green
Write-Host ""

# Check if MongoDB is running
$mongoProcess = Get-Process -Name "mongod" -ErrorAction SilentlyContinue
if ($mongoProcess) {
    Write-Host "MongoDB is already running." -ForegroundColor Yellow
} else {
    Write-Host "Starting MongoDB..." -ForegroundColor Blue
    
    # Try to start MongoDB as a service first
    try {
        Start-Service -Name "MongoDB" -ErrorAction Stop
        Write-Host "MongoDB service started successfully." -ForegroundColor Green
    } catch {
        Write-Host "MongoDB service not found. Starting manually..." -ForegroundColor Yellow
        
        # Create data directory if it doesn't exist
        if (!(Test-Path "C:\data\db")) {
            New-Item -ItemType Directory -Path "C:\data\db" -Force
            Write-Host "Created MongoDB data directory: C:\data\db" -ForegroundColor Green
        }
        
        # Start MongoDB manually
        Start-Process -FilePath "mongod" -ArgumentList "--dbpath", "C:\data\db" -WindowStyle Minimized
        Write-Host "MongoDB started manually." -ForegroundColor Green
    }
    
    # Wait a moment for MongoDB to start
    Start-Sleep -Seconds 3
}

Write-Host ""
Write-Host "Starting the application (Frontend + Backend)..." -ForegroundColor Green
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend API will be available at: http://localhost:5000/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Yellow
Write-Host ""

# Start the application
npm run dev