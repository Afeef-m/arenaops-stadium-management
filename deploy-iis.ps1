# ============================================================
# ArenaOps IIS Deploy Script (Build + Deploy)
# Run this in an ADMINISTRATOR PowerShell
# ============================================================

param(
    [switch]$SkipBuild,   # Use -SkipBuild to skip dotnet publish
    [switch]$AuthOnly,    # Deploy only AuthService
    [switch]$CoreOnly     # Deploy only CoreService
)

Import-Module WebAdministration

$backendDir = "C:\Users\aflah\OneDrive\Desktop\ARENAOPS\BACKEND"
$publishDir = "C:\Users\aflah\OneDrive\Desktop\ARENAOPS\publish"
$iisDir = "C:\inetpub\ArenaOps"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " ArenaOps IIS Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# ---- STEP 1: BUILD ----
if (-not $SkipBuild) {
    if (-not $CoreOnly) {
        Write-Host "`n[BUILD] Publishing AuthService..." -ForegroundColor Yellow
        dotnet publish "$backendDir\ArenaOps.AuthService\ArenaOps.AuthService.API\ArenaOps.AuthService.API.csproj" -c Release -o "$publishDir\AuthService" --nologo -v quiet
        if ($LASTEXITCODE -ne 0) { Write-Host "AuthService build FAILED!" -ForegroundColor Red; exit 1 }
        Write-Host "  AuthService build OK" -ForegroundColor Green
    }

    if (-not $AuthOnly) {
        Write-Host "[BUILD] Publishing CoreService..." -ForegroundColor Yellow
        dotnet publish "$backendDir\ArenaOps.CoreService\ArenaOps.CoreService.API\ArenaOps.CoreService.API.csproj" -c Release -o "$publishDir\CoreService" --nologo -v quiet
        if ($LASTEXITCODE -ne 0) { Write-Host "CoreService build FAILED!" -ForegroundColor Red; exit 1 }
        Write-Host "  CoreService build OK" -ForegroundColor Green
    }
}
else {
    Write-Host "`n[BUILD] Skipped (using existing publish)" -ForegroundColor DarkGray
}

# ---- STEP 2: STOP IIS ----
Write-Host "`n[DEPLOY] Stopping IIS..." -ForegroundColor Yellow
iisreset /stop | Out-Null

# ---- STEP 3: CREATE FOLDERS ----
New-Item -ItemType Directory -Path "$iisDir\AuthService\Keys" -Force | Out-Null
New-Item -ItemType Directory -Path "$iisDir\AuthService\logs" -Force | Out-Null
New-Item -ItemType Directory -Path "$iisDir\CoreService\Keys" -Force | Out-Null
New-Item -ItemType Directory -Path "$iisDir\CoreService\logs" -Force | Out-Null

# ---- STEP 4: COPY FILES ----
if (-not $CoreOnly) {
    Write-Host "[DEPLOY] Copying AuthService..." -ForegroundColor Yellow
    Copy-Item -Path "$publishDir\AuthService\*" -Destination "$iisDir\AuthService\" -Recurse -Force
}

if (-not $AuthOnly) {
    Write-Host "[DEPLOY] Copying CoreService..." -ForegroundColor Yellow
    Copy-Item -Path "$publishDir\CoreService\*" -Destination "$iisDir\CoreService\" -Recurse -Force
}

# ---- STEP 5: RSA KEYS ----
Write-Host "[DEPLOY] Ensuring RSA keys..." -ForegroundColor Yellow
$authKey = "$backendDir\ArenaOps.AuthService\ArenaOps.AuthService.API\Keys\rsa-private.key"
$coreKey = "$backendDir\ArenaOps.CoreService\ArenaOps.CoreService.API\Keys\rsa-public.key"

if (Test-Path $authKey) {
    Copy-Item -Path $authKey -Destination "$iisDir\AuthService\Keys\" -Force
    Write-Host "  rsa-private.key -> AuthService/Keys/" -ForegroundColor Green
}
if (Test-Path $coreKey) {
    Copy-Item -Path $coreKey -Destination "$iisDir\CoreService\Keys\" -Force
    Write-Host "  rsa-public.key  -> CoreService/Keys/" -ForegroundColor Green
}

# ---- STEP 6: START IIS ----
Write-Host "`n[DEPLOY] Starting IIS..." -ForegroundColor Yellow
iisreset /start | Out-Null

# ---- DONE ----
Write-Host "`n========================================" -ForegroundColor Green
Write-Host " Deployment completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Endpoints:" -ForegroundColor Cyan
Write-Host "  Auth Swagger:  http://localhost/auth/swagger"
Write-Host "  Core Swagger:  http://localhost/core/swagger"
Write-Host "  Health Check:  http://localhost/core/health"
Write-Host ""
Write-Host "Usage tips:" -ForegroundColor DarkGray
Write-Host "  .\deploy-iis.ps1              # Build + Deploy all"
Write-Host "  .\deploy-iis.ps1 -SkipBuild   # Deploy without rebuilding"
Write-Host "  .\deploy-iis.ps1 -AuthOnly    # Only deploy AuthService"
Write-Host "  .\deploy-iis.ps1 -CoreOnly    # Only deploy CoreService"
Write-Host ""
