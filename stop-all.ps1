# ArenaOps - Stop All Services Script (Windows PowerShell)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Stopping ArenaOps Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop .NET processes
Write-Host "Stopping backend services..." -ForegroundColor Yellow
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*ArenaOps*"
} | Stop-Process -Force

# Stop Node processes
Write-Host "Stopping frontend..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*arenaops-web*"
} | Stop-Process -Force

# Stop Docker services
Write-Host "Stopping Docker services..." -ForegroundColor Yellow
docker-compose down

Write-Host ""
Write-Host "All services stopped!" -ForegroundColor Green
Write-Host ""
