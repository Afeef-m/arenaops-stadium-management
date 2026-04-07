# ArenaOps - Complete System Startup Script (Windows PowerShell)
# This script starts all services in the correct order

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ArenaOps System Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Start Infrastructure
Write-Host "[1/4] Starting Infrastructure (Docker)..." -ForegroundColor Green
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start Docker services" -ForegroundColor Red
    Write-Host "Please ensure Docker Desktop is running" -ForegroundColor Yellow
    exit 1
}

# Wait for services to be ready
Write-Host "Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Verify Redis
Write-Host "Verifying Redis..." -ForegroundColor Yellow
docker exec arenaops-redis redis-cli -a arenaops_redis_pass ping | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Redis is ready" -ForegroundColor Green
} else {
    Write-Host "✗ Redis failed to start" -ForegroundColor Red
}

# Verify SQL Server
Write-Host "Verifying SQL Server..." -ForegroundColor Yellow
docker exec arenaops-sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "ArenaOps@2024!" -Q "SELECT 1" | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ SQL Server is ready" -ForegroundColor Green
} else {
    Write-Host "✗ SQL Server failed to start" -ForegroundColor Red
}

Write-Host ""

# Step 2: Start AuthService
Write-Host "[2/4] Starting AuthService..." -ForegroundColor Green
$authPath = "BACKEND\ArenaOps.AuthService\ArenaOps.AuthService.API"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $authPath; Write-Host 'Starting AuthService...' -ForegroundColor Cyan; dotnet run"

Write-Host "Waiting for AuthService to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""

# Step 3: Start CoreService
Write-Host "[3/4] Starting CoreService..." -ForegroundColor Green
$corePath = "BACKEND\ArenaOps.CoreService\ArenaOps.CoreService.API"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $corePath; Write-Host 'Starting CoreService...' -ForegroundColor Cyan; dotnet run"

Write-Host "Waiting for CoreService to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""

# Step 4: Start Frontend
Write-Host "[4/4] Starting Frontend..." -ForegroundColor Green
$frontendPath = "FRONTEND\arenaops-web"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $frontendPath; Write-Host 'Starting Frontend...' -ForegroundColor Cyan; npm run dev"

Write-Host "Waiting for Frontend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  All Services Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Yellow
Write-Host "  Frontend:    http://localhost:3000" -ForegroundColor Cyan
Write-Host "  AuthService: http://localhost:5001/swagger" -ForegroundColor Cyan
Write-Host "  CoreService: http://localhost:5007/swagger" -ForegroundColor Cyan
Write-Host ""
Write-Host "Infrastructure:" -ForegroundColor Yellow
Write-Host "  Redis:       localhost:6379" -ForegroundColor Cyan
Write-Host "  SQL Server:  localhost:1433" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C in each window to stop services" -ForegroundColor Yellow
Write-Host ""
