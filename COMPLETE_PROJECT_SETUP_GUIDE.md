# 🏟️ ArenaOps - Complete Project Setup & Running Guide

## 📋 Table of Contents
1. [System Requirements](#system-requirements)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Database Setup](#database-setup)
4. [Backend Services Setup](#backend-services-setup)
5. [Frontend Setup](#frontend-setup)
6. [Running the Complete System](#running-the-complete-system)
7. [Verification & Testing](#verification--testing)
8. [Troubleshooting](#troubleshooting)

---

## 🖥️ System Requirements

### Required Software
- **Node.js**: v18.0.0 or higher
- **.NET SDK**: 8.0 or higher
- **SQL Server**: 2019 or higher (or Azure SQL)
- **Redis**: 7.0 or higher
- **Docker Desktop**: (Optional, for containerized infrastructure)
- **Git**: Latest version

### Operating System
- Windows 10/11 (Primary)
- Linux (Ubuntu 20.04+)
- macOS (10.15+)

### Hardware Recommendations
- **RAM**: 8GB minimum, 16GB recommended
- **CPU**: 4 cores minimum
- **Storage**: 10GB free space

---

## 🐳 Infrastructure Setup

### Option A: Docker Compose (Recommended for Development)

#### Step 1: Create Docker Compose File

Create `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  # Redis - Caching & Rate Limiting
  redis:
    image: redis:7-alpine
    container_name: arenaops-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes --requirepass arenaops_redis_pass
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - arenaops-network

  # SQL Server - Database
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: arenaops-sqlserver
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=ArenaOps@2024!
      - MSSQL_PID=Developer
    ports:
      - "1433:1433"
    volumes:
      - sqlserver-data:/var/opt/mssql
    restart: unless-stopped
    healthcheck:
      test: /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P ArenaOps@2024! -Q "SELECT 1" || exit 1
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - arenaops-network

volumes:
  redis-data:
    driver: local
  sqlserver-data:
    driver: local

networks:
  arenaops-network:
    driver: bridge
```


#### Step 2: Start Infrastructure

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f redis
docker-compose logs -f sqlserver

# Stop services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

#### Step 3: Verify Services

```bash
# Test Redis
docker exec -it arenaops-redis redis-cli ping
# Expected: PONG

# Test SQL Server
docker exec -it arenaops-sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "ArenaOps@2024!" -Q "SELECT @@VERSION"
```

---

### Option B: Manual Installation (Windows)

#### Redis Installation

1. **Download Redis for Windows**:
   - Visit: https://github.com/microsoftarchive/redis/releases
   - Download: `Redis-x64-3.0.504.msi`

2. **Install Redis**:
   ```powershell
   # Run installer
   # Default port: 6379
   # Install as Windows Service: Yes
   ```

3. **Verify Installation**:
   ```powershell
   redis-cli ping
   # Expected: PONG
   ```

#### SQL Server Installation

1. **Download SQL Server 2022 Developer Edition**:
   - Visit: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
   - Download Developer Edition (Free)

2. **Install SQL Server**:
   - Choose "Basic" installation
   - Accept defaults
   - Note the SA password

3. **Install SQL Server Management Studio (SSMS)**:
   - Download from: https://aka.ms/ssmsfullsetup
   - Install with defaults

4. **Verify Installation**:
   ```powershell
   sqlcmd -S localhost -U sa -P "YourPassword" -Q "SELECT @@VERSION"
   ```

---

## 🗄️ Database Setup

### Step 1: Create Databases

Using SSMS or sqlcmd:

```sql
-- Create AuthService Database
CREATE DATABASE ArenaOps_AuthDB;
GO

-- Create CoreService Database
CREATE DATABASE ArenaOps_CoreDB;
GO

-- Verify databases
SELECT name FROM sys.databases WHERE name LIKE 'ArenaOps%';
```

### Step 2: Run Migrations

#### AuthService Migrations

```bash
cd BACKEND/ArenaOps.AuthService/ArenaOps.AuthService.Infrastructure

# Add migration (if needed)
dotnet ef migrations add InitialCreate --startup-project ../ArenaOps.AuthService.API

# Apply migration
dotnet ef database update --startup-project ../ArenaOps.AuthService.API
```

#### CoreService Migrations

```bash
cd BACKEND/ArenaOps.CoreService/ArenaOps.CoreService.Infrastructure

# Add migration (if needed)
dotnet ef migrations add InitialCreate --startup-project ../ArenaOps.CoreService.API

# Apply migration
dotnet ef database update --startup-project ../ArenaOps.CoreService.API
```

### Step 3: Seed Initial Data (Optional)

```sql
-- Use ArenaOps_AuthDB
USE ArenaOps_AuthDB;
GO

-- Create Admin Role
INSERT INTO Roles (RoleId, Name, CreatedAt)
VALUES (NEWID(), 'Admin', GETUTCDATE());

-- Create Admin User (password: Admin@123)
-- Note: Use the actual hashed password from your application
```

---

## 🔧 Backend Services Setup

### AuthService Configuration

#### Step 1: Update Connection String

Edit `BACKEND/ArenaOps.AuthService/ArenaOps.AuthService.API/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "AuthDb": "Server=localhost;Database=ArenaOps_AuthDB;User Id=sa;Password=ArenaOps@2024!;Encrypt=True;TrustServerCertificate=True;MultipleActiveResultSets=True;"
  },
  "Redis": {
    "ConnectionString": "localhost:6379,password=arenaops_redis_pass,abortConnect=false"
  },
  "Jwt": {
    "Issuer": "ArenaOps",
    "Audience": "ArenaOps",
    "AccessTokenExpiryMinutes": 30,
    "RefreshTokenExpiryDays": 7,
    "KeyFilePath": "Keys/rsa-private.key"
  }
}
```

#### Step 2: Generate RSA Keys

```bash
cd BACKEND/ArenaOps.AuthService/ArenaOps.AuthService.API

# Create Keys directory
mkdir Keys

# Generate RSA key pair (use OpenSSL or .NET tool)
# For Windows with OpenSSL:
openssl genrsa -out Keys/rsa-private.key 2048
openssl rsa -in Keys/rsa-private.key -pubout -out Keys/rsa-public.key
```

#### Step 3: Build and Run

```bash
cd BACKEND/ArenaOps.AuthService/ArenaOps.AuthService.API

# Restore dependencies
dotnet restore

# Build
dotnet build

# Run
dotnet run
```

**Expected Output**:
```
Now listening on: http://localhost:5001
Application started. Press Ctrl+C to shut down.
```

---

### CoreService Configuration

#### Step 1: Update Connection String

Edit `BACKEND/ArenaOps.CoreService/ArenaOps.CoreService.API/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "CoreDb": "Server=localhost;Database=ArenaOps_CoreDB;User Id=sa;Password=ArenaOps@2024!;Encrypt=True;TrustServerCertificate=True;MultipleActiveResultSets=True;"
  },
  "Redis": {
    "ConnectionString": "localhost:6379,password=arenaops_redis_pass,abortConnect=false",
    "InstanceName": "ArenaOps_Dev_"
  },
  "Jwt": {
    "Issuer": "ArenaOps",
    "Audience": "ArenaOps",
    "JwksUrl": "http://localhost:5001/api/auth/.well-known/jwks"
  }
}
```

#### Step 2: Build and Run

```bash
cd BACKEND/ArenaOps.CoreService/ArenaOps.CoreService.API

# Restore dependencies
dotnet restore

# Build
dotnet build

# Run
dotnet run
```

**Expected Output**:
```
Now listening on: http://localhost:5007
Application started. Press Ctrl+C to shut down.
```

---

## 🎨 Frontend Setup

### Step 1: Install Dependencies

```bash
cd FRONTEND/arenaops-web

# Install Node packages
npm install
```

### Step 2: Configure Environment

Create `.env.local` file:

```env
# API Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Backend Services
NEXT_PUBLIC_AUTH_SERVICE_URL=http://localhost:5001
NEXT_PUBLIC_CORE_SERVICE_URL=http://localhost:5007

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_PAYMENTS=false
```

### Step 3: Update API Proxy Configuration

Edit `FRONTEND/arenaops-web/next.config.js` (if needed):

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: 'http://localhost:5001/api/auth/:path*',
      },
      {
        source: '/api/core/:path*',
        destination: 'http://localhost:5007/api/core/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
```

### Step 4: Build and Run

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

**Expected Output**:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

---

## 🚀 Running the Complete System

### Quick Start Script (Windows PowerShell)

Create `start-all.ps1` in project root:

```powershell
# Start Infrastructure
Write-Host "Starting Infrastructure..." -ForegroundColor Green
docker-compose up -d

# Wait for services to be ready
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Start AuthService
Write-Host "Starting AuthService..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd BACKEND\ArenaOps.AuthService\ArenaOps.AuthService.API; dotnet run"

# Wait a bit
Start-Sleep -Seconds 5

# Start CoreService
Write-Host "Starting CoreService..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd BACKEND\ArenaOps.CoreService\ArenaOps.CoreService.API; dotnet run"

# Wait a bit
Start-Sleep -Seconds 5

# Start Frontend
Write-Host "Starting Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd FRONTEND\arenaops-web; npm run dev"

Write-Host "`nAll services started!" -ForegroundColor Green
Write-Host "AuthService: http://localhost:5001/swagger" -ForegroundColor Cyan
Write-Host "CoreService: http://localhost:5007/swagger" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
```

Run the script:
```powershell
.\start-all.ps1
```

---

### Quick Start Script (Linux/macOS)

Create `start-all.sh` in project root:

```bash
#!/bin/bash

# Start Infrastructure
echo "Starting Infrastructure..."
docker-compose up -d

# Wait for services
echo "Waiting for services to start..."
sleep 10

# Start AuthService
echo "Starting AuthService..."
cd BACKEND/ArenaOps.AuthService/ArenaOps.AuthService.API
dotnet run &
AUTH_PID=$!
cd ../../..

# Wait
sleep 5

# Start CoreService
echo "Starting CoreService..."
cd BACKEND/ArenaOps.CoreService/ArenaOps.CoreService.API
dotnet run &
CORE_PID=$!
cd ../../..

# Wait
sleep 5

# Start Frontend
echo "Starting Frontend..."
cd FRONTEND/arenaops-web
npm run dev &
FRONTEND_PID=$!
cd ../..

echo ""
echo "All services started!"
echo "AuthService: http://localhost:5001/swagger"
echo "CoreService: http://localhost:5007/swagger"
echo "Frontend: http://localhost:3000"
echo ""
echo "Process IDs:"
echo "Auth: $AUTH_PID"
echo "Core: $CORE_PID"
echo "Frontend: $FRONTEND_PID"
```

Make executable and run:
```bash
chmod +x start-all.sh
./start-all.sh
```

---

### Manual Startup Order

1. **Start Infrastructure** (Redis, SQL Server)
2. **Start AuthService** (Port 5001)
3. **Start CoreService** (Port 5007)
4. **Start Frontend** (Port 3000)

---

## ✅ Verification & Testing

### 1. Infrastructure Health Checks

#### Redis
```bash
# Using redis-cli
redis-cli -h localhost -p 6379 -a arenaops_redis_pass ping
# Expected: PONG

# Using Docker
docker exec -it arenaops-redis redis-cli -a arenaops_redis_pass ping
```

#### SQL Server
```bash
# Using sqlcmd
sqlcmd -S localhost -U sa -P "ArenaOps@2024!" -Q "SELECT @@VERSION"

# Using Docker
docker exec -it arenaops-sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "ArenaOps@2024!" -Q "SELECT 1"
```

---

### 2. Backend API Health Checks

#### AuthService
```bash
# Health endpoint
curl http://localhost:5001/health

# Swagger UI
# Open: http://localhost:5001/swagger

# JWKS endpoint
curl http://localhost:5001/api/auth/.well-known/jwks
```

#### CoreService
```bash
# Health endpoint
curl http://localhost:5007/health

# Swagger UI
# Open: http://localhost:5007/swagger

# Test endpoint (requires auth)
curl http://localhost:5007/api/core/stadiums
```

---

### 3. Frontend Verification

```bash
# Open browser
http://localhost:3000

# Check pages:
# - Home: http://localhost:3000
# - Login: http://localhost:3000/login
# - Register: http://localhost:3000/register
```

---

### 4. End-to-End Test Flow

#### A. User Registration
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123",
    "firstName": "Test",
    "lastName": "User",
    "phoneNumber": "+1234567890"
  }'
```

#### B. User Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123"
  }'
```

Save the `accessToken` from response.

#### C. Access Protected Resource
```bash
curl -X GET http://localhost:5007/api/core/stadiums \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 5. Performance Checks

#### Redis Performance
```bash
redis-cli -h localhost -p 6379 -a arenaops_redis_pass --latency
# Expected: < 1ms average
```

#### Database Performance
```sql
-- Check active connections
SELECT 
    DB_NAME(dbid) as DatabaseName,
    COUNT(dbid) as NumberOfConnections
FROM sys.sysprocesses
WHERE dbid > 0
GROUP BY dbid;
```

#### API Response Times
```bash
# Using curl with timing
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5001/health

# Create curl-format.txt:
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_total:  %{time_total}\n
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Redis Connection Failed

**Error**: `StackExchange.Redis.RedisConnectionException`

**Solutions**:
```bash
# Check if Redis is running
docker ps | grep redis
# or
redis-cli ping

# Check Redis logs
docker logs arenaops-redis

# Restart Redis
docker restart arenaops-redis

# Verify connection string in appsettings
# Should be: localhost:6379,password=arenaops_redis_pass,abortConnect=false
```

---

#### 2. SQL Server Connection Failed

**Error**: `Microsoft.Data.SqlClient.SqlException`

**Solutions**:
```bash
# Check if SQL Server is running
docker ps | grep sqlserver

# Check SQL Server logs
docker logs arenaops-sqlserver

# Test connection
sqlcmd -S localhost -U sa -P "ArenaOps@2024!" -Q "SELECT 1"

# Verify connection string format
# Server=localhost;Database=ArenaOps_AuthDB;User Id=sa;Password=ArenaOps@2024!;...
```

---

#### 3. Port Already in Use

**Error**: `Address already in use`

**Solutions**:
```powershell
# Windows - Find process using port
netstat -ano | findstr :5001
netstat -ano | findstr :5007
netstat -ano | findstr :3000

# Kill process
taskkill /PID <process-id> /F

# Linux/macOS - Find and kill
lsof -ti:5001 | xargs kill -9
lsof -ti:5007 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

---

#### 4. Migration Failed

**Error**: `Unable to create migration`

**Solutions**:
```bash
# Clean and rebuild
dotnet clean
dotnet build

# Remove old migrations (if needed)
rm -rf Migrations/

# Create new migration
dotnet ef migrations add InitialCreate --startup-project ../ArenaOps.AuthService.API

# Apply migration with verbose logging
dotnet ef database update --startup-project ../ArenaOps.AuthService.API --verbose
```

---

#### 5. Frontend Build Errors

**Error**: `Module not found` or `Cannot find module`

**Solutions**:
```bash
# Clear cache and reinstall
rm -rf node_modules
rm package-lock.json
npm cache clean --force
npm install

# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

---

#### 6. CORS Errors

**Error**: `Access-Control-Allow-Origin`

**Solutions**:
- Ensure frontend uses the BFF proxy (routes through `/api/auth` and `/api/core`)
- Check `next.config.js` rewrites configuration
- Verify backend CORS settings in `Program.cs`

---

#### 7. JWT Validation Failed

**Error**: `IDX10503: Signature validation failed`

**Solutions**:
```bash
# Verify RSA keys exist
ls BACKEND/ArenaOps.AuthService/ArenaOps.AuthService.API/Keys/

# Regenerate keys if needed
openssl genrsa -out Keys/rsa-private.key 2048
openssl rsa -in Keys/rsa-private.key -pubout -out Keys/rsa-public.key

# Verify JWKS endpoint is accessible
curl http://localhost:5001/api/auth/.well-known/jwks

# Check CoreService JWT configuration points to correct JWKS URL
```

---

#### 8. Docker Services Won't Start

**Error**: `Error response from daemon`

**Solutions**:
```bash
# Check Docker is running
docker --version
docker ps

# Restart Docker Desktop (Windows/macOS)

# Check logs
docker-compose logs

# Remove and recreate
docker-compose down -v
docker-compose up -d

# Check disk space
docker system df
docker system prune -a
```

---

## 📊 Service Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                            │
│                    http://localhost:3000                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Frontend (BFF)                       │
│  - Server Components (SSR)                                      │
│  - Client Components (React)                                    │
│  - API Route Handlers (Proxy)                                   │
│  - Port: 3000                                                   │
└────────┬──────────────────────────┬─────────────────────────────┘
         │                          │
         │ /api/auth/*              │ /api/core/*
         ▼                          ▼
┌─────────────────────┐    ┌─────────────────────┐
│   AuthService       │    │   CoreService       │
│   Port: 5001        │    │   Port: 5007        │
│                     │    │                     │
│ - User Auth         │    │ - Stadiums          │
│ - JWT (RSA)         │    │ - Events            │
│ - Roles             │    │ - Bookings          │
│ - Refresh Tokens    │    │ - Payments          │
│ - Token Blacklist   │    │ - SignalR Hub       │
└──────┬──────────────┘    └──────┬──────────────┘
       │                          │
       │                          │
       ▼                          ▼
┌─────────────────────┐    ┌─────────────────────┐
│   AuthDB            │    │   CoreDB            │
│   SQL Server        │    │   SQL Server        │
│   Port: 1433        │    │   Port: 1433        │
└─────────────────────┘    └──────┬──────────────┘
                                  │
                                  ▼
                           ┌─────────────────────┐
                           │   Redis             │
                           │   Port: 6379        │
                           │                     │
                           │ - Caching           │
                           │ - Rate Limiting     │
                           │ - Token Blacklist   │
                           └─────────────────────┘
```

---

## 🔐 Security Configuration

### 1. JWT Configuration

**AuthService** generates JWT tokens using RSA asymmetric encryption:
- **Private Key**: Signs tokens (AuthService only)
- **Public Key**: Verifies tokens (CoreService via JWKS)

### 2. Redis Security

```bash
# Set Redis password
# In docker-compose.yml:
command: redis-server --appendonly yes --requirepass arenaops_redis_pass

# In appsettings:
"Redis": {
  "ConnectionString": "localhost:6379,password=arenaops_redis_pass,abortConnect=false"
}
```

### 3. SQL Server Security

```bash
# Use strong SA password
SA_PASSWORD=ArenaOps@2024!

# Create application-specific users (recommended)
CREATE LOGIN arenaops_auth WITH PASSWORD = 'StrongPassword123!';
CREATE USER arenaops_auth FOR LOGIN arenaops_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON DATABASE::ArenaOps_AuthDB TO arenaops_auth;
```

### 4. CORS Configuration

In `Program.cs`:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});
```

---

## 🌐 Environment-Specific Configuration

### Development Environment

```bash
# .env.development
NODE_ENV=development
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_AUTH_SERVICE_URL=http://localhost:5001
NEXT_PUBLIC_CORE_SERVICE_URL=http://localhost:5007
```

**Backend**:
- Use `appsettings.Development.json`
- Enable Swagger
- Detailed logging
- Local Redis and SQL Server

---

### Staging Environment

```bash
# .env.staging
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://staging.arenaops.com
NEXT_PUBLIC_AUTH_SERVICE_URL=https://auth-staging.arenaops.com
NEXT_PUBLIC_CORE_SERVICE_URL=https://core-staging.arenaops.com
```

**Backend**:
- Use `appsettings.Staging.json`
- Enable Swagger (restricted)
- Moderate logging
- Hosted Redis and SQL Server

---

### Production Environment

```bash
# .env.production
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://arenaops.com
NEXT_PUBLIC_AUTH_SERVICE_URL=https://auth.arenaops.com
NEXT_PUBLIC_CORE_SERVICE_URL=https://core.arenaops.com
```

**Backend**:
- Use `appsettings.Production.json`
- Disable Swagger
- Minimal logging (errors only)
- Managed Redis and SQL Server (Azure/AWS)

---

## 📈 Monitoring & Logging

### Application Logs

**Location**:
- AuthService: `BACKEND/ArenaOps.AuthService/ArenaOps.AuthService.API/Logs/`
- CoreService: `BACKEND/ArenaOps.CoreService/ArenaOps.CoreService.API/Logs/`

**View Logs**:
```bash
# Tail logs in real-time
tail -f BACKEND/ArenaOps.AuthService/ArenaOps.AuthService.API/Logs/arenaops-auth-*.log
tail -f BACKEND/ArenaOps.CoreService/ArenaOps.CoreService.API/Logs/arenaops-core-*.log
```

### Redis Monitoring

```bash
# Monitor Redis commands in real-time
redis-cli -a arenaops_redis_pass monitor

# Get Redis info
redis-cli -a arenaops_redis_pass info

# Check memory usage
redis-cli -a arenaops_redis_pass info memory

# List all keys (development only)
redis-cli -a arenaops_redis_pass keys "*"
```

### SQL Server Monitoring

```sql
-- Active connections
SELECT 
    DB_NAME(dbid) as DatabaseName,
    COUNT(dbid) as Connections,
    loginame as LoginName
FROM sys.sysprocesses
WHERE dbid > 0
GROUP BY dbid, loginame;

-- Long-running queries
SELECT 
    r.session_id,
    r.start_time,
    r.status,
    r.command,
    t.text as query_text,
    r.wait_type,
    r.wait_time
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.session_id > 50
ORDER BY r.start_time;
```

---

## 🧪 Testing Guide

### Unit Tests

```bash
# Run AuthService tests
cd BACKEND/ArenaOps.AuthService.Tests
dotnet test

# Run CoreService tests
cd BACKEND/ArenaOps.CoreService.Tests
dotnet test

# Run with coverage
dotnet test /p:CollectCoverage=true /p:CoverageReportFormat=opencover
```

### Integration Tests

```bash
# Ensure infrastructure is running
docker-compose up -d

# Run integration tests
cd BACKEND/ArenaOps.CoreService.Tests
dotnet test --filter Category=Integration
```

### Frontend Tests

```bash
cd FRONTEND/arenaops-web

# Run unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run E2E tests (if configured)
npm run test:e2e
```

---

## 🚢 Deployment Guide

### Docker Production Build

Create `Dockerfile` for each service:

**AuthService Dockerfile**:
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["ArenaOps.AuthService.API/ArenaOps.AuthService.API.csproj", "ArenaOps.AuthService.API/"]
RUN dotnet restore "ArenaOps.AuthService.API/ArenaOps.AuthService.API.csproj"
COPY . .
WORKDIR "/src/ArenaOps.AuthService.API"
RUN dotnet build "ArenaOps.AuthService.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ArenaOps.AuthService.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ArenaOps.AuthService.API.dll"]
```

**Build and Run**:
```bash
# Build image
docker build -t arenaops-auth:latest -f BACKEND/ArenaOps.AuthService/Dockerfile .

# Run container
docker run -d -p 5001:80 --name arenaops-auth arenaops-auth:latest
```

---

### Frontend Production Build

```bash
cd FRONTEND/arenaops-web

# Build for production
npm run build

# Start production server
npm start

# Or use Docker
docker build -t arenaops-web:latest .
docker run -d -p 3000:3000 --name arenaops-web arenaops-web:latest
```

---

## 📚 Additional Resources

### Documentation
- [Architecture Overview](docs/02-High-Level-Architecture.md)
- [Database Schema](docs/03-Database.md)
- [API Documentation](docs/04-Api-Documentation.md)
- [Stadium View Integration](docs/new%20one/INTEGRATION_COMPLETE.md)

### API Endpoints
- **AuthService Swagger**: http://localhost:5001/swagger
- **CoreService Swagger**: http://localhost:5007/swagger
- **JWKS Endpoint**: http://localhost:5001/api/auth/.well-known/jwks

### Useful Commands

```bash
# Check all service status
docker-compose ps
netstat -ano | findstr "5001 5007 3000 6379 1433"

# View all logs
docker-compose logs -f

# Restart specific service
docker-compose restart redis
docker-compose restart sqlserver

# Clean everything
docker-compose down -v
docker system prune -a
```

---

## 🎯 Quick Reference

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Frontend | 3000 | http://localhost:3000 | Next.js Web App |
| AuthService | 5001 | http://localhost:5001 | Authentication & Authorization |
| CoreService | 5007 | http://localhost:5007 | Business Logic & Data |
| Redis | 6379 | localhost:6379 | Cache & Rate Limiting |
| SQL Server | 1433 | localhost:1433 | Database |

### Default Credentials

**SQL Server**:
- Username: `sa`
- Password: `ArenaOps@2024!`

**Redis**:
- Password: `arenaops_redis_pass`

---

## ✅ Checklist

### Initial Setup
- [ ] Install Node.js 18+
- [ ] Install .NET 8 SDK
- [ ] Install Docker Desktop
- [ ] Clone repository
- [ ] Create docker-compose.yml

### Infrastructure
- [ ] Start Docker services
- [ ] Verify Redis connection
- [ ] Verify SQL Server connection
- [ ] Create databases
- [ ] Run migrations

### Backend
- [ ] Generate RSA keys
- [ ] Configure AuthService
- [ ] Configure CoreService
- [ ] Build AuthService
- [ ] Build CoreService
- [ ] Run AuthService
- [ ] Run CoreService
- [ ] Test Swagger endpoints

### Frontend
- [ ] Install npm packages
- [ ] Configure environment
- [ ] Build frontend
- [ ] Run frontend
- [ ] Test in browser

### Verification
- [ ] Register test user
- [ ] Login test user
- [ ] Access protected endpoints
- [ ] Test stadium view feature
- [ ] Check logs for errors

---

## 🆘 Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review logs in `Logs/` directories
3. Check Docker logs: `docker-compose logs`
4. Verify all services are running: `docker-compose ps`

---

**Last Updated**: April 4, 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
