# ArenaOps Ngrok Tunnel Starter
# Run this script to expose your local environment

$configPath = Join-Path $PSScriptRoot "ngrok.yml"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " ArenaOps Ngrok Tunnels" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if authtoken is configured
$tokenCheck = ngrok config check
if ($tokenCheck -like "*no authtoken*") {
    Write-Host "WARNING: No ngrok authtoken found." -ForegroundColor Yellow
    Write-Host "Multiple tunnels require an authtoken. Get one at: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor DarkGray
    Write-Host "Then run: ngrok config add-authtoken <your-token>" -ForegroundColor DarkGray
}

Write-Host "`n----------------------------------------" -ForegroundColor DarkGray
Write-Host " PREPARING BACKEND (IIS + RSA KEYS)" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor DarkGray

# ---- RECOVERY LOGIC ----
Write-Host "Stopping IIS services..." -ForegroundColor Cyan
iisreset /stop

Write-Host "Patching AuthService web.config..." -ForegroundColor Cyan
$authConfig = @"
<?xml version=`"1.0`" encoding=`"utf-8`"?>
<configuration>
  <location path=`".`" inheritInChildApplications=`"false`">
    <system.webServer>
      <handlers>
        <add name=`"aspNetCore`" path=`"*`" verb=`"*`" modules=`"AspNetCoreModuleV2`" resourceType=`"Unspecified`" />
      </handlers>
      <aspNetCore processPath=`"dotnet`" arguments=`".\ArenaOps.AuthService.API.dll`" stdoutLogEnabled=`"true`" stdoutLogFile=`".\logs\stdout`" hostingModel=`"inprocess`">
        <environmentVariables>
          <environmentVariable name=`"ASPNETCORE_ENVIRONMENT`" value=`"Development`" />
        </environmentVariables>
      </aspNetCore>
    </system.webServer>
  </location>
</configuration>
"@
$authPath = "C:\inetpub\ArenaOps\AuthService\web.config"
if (Test-Path $authPath) {
    Set-Content -Path $authPath -Value $authConfig
} else {
    Write-Host "  Skipped: AuthService web.config not found." -ForegroundColor Gray
}

Write-Host "Patching CoreService web.config..." -ForegroundColor Cyan
$coreConfig = @"
<?xml version=`"1.0`" encoding=`"utf-8`"?>
<configuration>
  <location path=`".`" inheritInChildApplications=`"false`">
    <system.webServer>
      <handlers>
        <add name=`"aspNetCore`" path=`"*`" verb=`"*`" modules=`"AspNetCoreModuleV2`" resourceType=`"Unspecified`" />
      </handlers>
      <aspNetCore processPath=`"dotnet`" arguments=`".\ArenaOps.CoreService.API.dll`" stdoutLogEnabled=`"true`" stdoutLogFile=`".\logs\stdout`" hostingModel=`"inprocess`">
        <environmentVariables>
          <environmentVariable name=`"ASPNETCORE_ENVIRONMENT`" value=`"Development`" />
        </environmentVariables>
      </aspNetCore>
    </system.webServer>
  </location>
</configuration>
"@
$corePath = "C:\inetpub\ArenaOps\CoreService\web.config"
if (Test-Path $corePath) {
    Set-Content -Path $corePath -Value $coreConfig
} else {
    Write-Host "  Skipped: CoreService web.config not found." -ForegroundColor Gray
}

Write-Host "Restoring RSA Keys..." -ForegroundColor Cyan
$keyDir = "C:\inetpub\ArenaOps\CoreService\Keys"
if (!(Test-Path $keyDir)) {
    New-Item -ItemType Directory -Path $keyDir -Force | Out-Null
}
$sourceKey = "c:\Users\aflah\OneDrive\Desktop\ARENAOPS\BACKEND\ArenaOps.CoreService\ArenaOps.CoreService.API\Keys\rsa-public.key"
if (Test-Path $sourceKey) {
    Copy-Item $sourceKey -Destination "$keyDir\rsa-public.key" -Force
} else {
    Write-Host "  Skipped: Source RSA key not found." -ForegroundColor Gray
}

Write-Host "Starting IIS services..." -ForegroundColor Cyan
iisreset /start
Write-Host "Backend Recovery Complete!" -ForegroundColor Green

Write-Host "`n----------------------------------------" -ForegroundColor DarkGray
Write-Host " STARTING NGROK TUNNELS" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor DarkGray
Write-Host "Press Ctrl+C to stop.`n" -ForegroundColor DarkGray

# Start ngrok
ngrok start --config $configPath --all
