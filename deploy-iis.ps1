# ============================================================
# ArenaOps IIS Deploy Script
# Run this in an ADMINISTRATOR PowerShell
# ============================================================

Import-Module WebAdministration

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " ArenaOps IIS Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Stop IIS
Write-Host "`n[1/5] Stopping IIS..." -ForegroundColor Yellow
iisreset /stop

# 2. Paths
$source = "C:\Users\aflah\OneDrive\Desktop\ARENAOPS\publish"
$dest = "C:\inetpub\ArenaOps"

# 3. Create destination folders if they don't exist
Write-Host "[2/5] Preparing destination folders..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "$dest\AuthService\Keys" -Force | Out-Null
New-Item -ItemType Directory -Path "$dest\AuthService\logs" -Force | Out-Null
New-Item -ItemType Directory -Path "$dest\CoreService\Keys" -Force | Out-Null
New-Item -ItemType Directory -Path "$dest\CoreService\logs" -Force | Out-Null

# 4. Deploy files
Write-Host "[3/5] Copying AuthService files..." -ForegroundColor Yellow
Copy-Item -Path "$source\AuthService\*" -Destination "$dest\AuthService\" -Recurse -Force

Write-Host "[4/5] Copying CoreService files..." -ForegroundColor Yellow
Copy-Item -Path "$source\CoreService\*" -Destination "$dest\CoreService\" -Recurse -Force

# 5. Copy RSA Keys (won't overwrite if already there)
Write-Host "[5/5] Ensuring RSA keys are in place..." -ForegroundColor Yellow
$authKeySource = "C:\Users\aflah\OneDrive\Desktop\ARENAOPS\BACKEND\ArenaOps.AuthService\ArenaOps.AuthService.API\Keys\rsa-private.key"
$coreKeySource = "C:\Users\aflah\OneDrive\Desktop\ARENAOPS\BACKEND\ArenaOps.CoreService\ArenaOps.CoreService.API\Keys\rsa-public.key"

if (Test-Path $authKeySource) {
    Copy-Item -Path $authKeySource -Destination "$dest\AuthService\Keys\" -Force
    Write-Host "  RSA private key -> AuthService/Keys/ " -ForegroundColor Green
} else {
    Write-Host "  WARNING: rsa-private.key not found at source!" -ForegroundColor Red
}

if (Test-Path $coreKeySource) {
    Copy-Item -Path $coreKeySource -Destination "$dest\CoreService\Keys\" -Force
    Write-Host "  RSA public key  -> CoreService/Keys/ " -ForegroundColor Green
} else {
    Write-Host "  WARNING: rsa-public.key not found at source!" -ForegroundColor Red
}

# 6. Start IIS
Write-Host "`nStarting IIS..." -ForegroundColor Yellow
iisreset /start

Write-Host "`n========================================" -ForegroundColor Green
Write-Host " Deployment completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nTest your endpoints:"
Write-Host "  Auth Swagger:  http://localhost/auth/swagger"
Write-Host "  Core Swagger:  http://localhost/core/swagger"
Write-Host "  Health Check:  http://localhost/core/health"
Write-Host ""
