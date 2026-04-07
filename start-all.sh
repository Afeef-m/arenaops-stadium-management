#!/bin/bash
# ArenaOps - Complete System Startup Script (Linux/macOS)
# This script starts all services in the correct order

echo "========================================"
echo "  ArenaOps System Startup"
echo "========================================"
echo ""

# Step 1: Start Infrastructure
echo "[1/4] Starting Infrastructure (Docker)..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to start Docker services"
    echo "Please ensure Docker is running"
    exit 1
fi

# Wait for services to be ready
echo "Waiting for services to initialize..."
sleep 15

# Verify Redis
echo "Verifying Redis..."
docker exec arenaops-redis redis-cli -a arenaops_redis_pass ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Redis is ready"
else
    echo "✗ Redis failed to start"
fi

# Verify SQL Server
echo "Verifying SQL Server..."
docker exec arenaops-sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "ArenaOps@2024!" -Q "SELECT 1" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ SQL Server is ready"
else
    echo "✗ SQL Server failed to start"
fi

echo ""

# Step 2: Start AuthService
echo "[2/4] Starting AuthService..."
cd BACKEND/ArenaOps.AuthService/ArenaOps.AuthService.API
dotnet run > ../../../logs/auth.log 2>&1 &
AUTH_PID=$!
echo "AuthService PID: $AUTH_PID"
cd ../../..

echo "Waiting for AuthService to start..."
sleep 10

echo ""

# Step 3: Start CoreService
echo "[3/4] Starting CoreService..."
cd BACKEND/ArenaOps.CoreService/ArenaOps.CoreService.API
dotnet run > ../../../logs/core.log 2>&1 &
CORE_PID=$!
echo "CoreService PID: $CORE_PID"
cd ../../..

echo "Waiting for CoreService to start..."
sleep 10

echo ""

# Step 4: Start Frontend
echo "[4/4] Starting Frontend..."
cd FRONTEND/arenaops-web
npm run dev > ../../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
cd ../..

echo "Waiting for Frontend to start..."
sleep 5

echo ""
echo "========================================"
echo "  All Services Started!"
echo "========================================"
echo ""
echo "Service URLs:"
echo "  Frontend:    http://localhost:3000"
echo "  AuthService: http://localhost:5001/swagger"
echo "  CoreService: http://localhost:5007/swagger"
echo ""
echo "Infrastructure:"
echo "  Redis:       localhost:6379"
echo "  SQL Server:  localhost:1433"
echo ""
echo "Process IDs:"
echo "  Auth:     $AUTH_PID"
echo "  Core:     $CORE_PID"
echo "  Frontend: $FRONTEND_PID"
echo ""
echo "Logs are in ./logs/ directory"
echo ""
echo "To stop all services, run: ./stop-all.sh"
echo ""

# Save PIDs to file for stop script
mkdir -p logs
echo "$AUTH_PID" > logs/auth.pid
echo "$CORE_PID" > logs/core.pid
echo "$FRONTEND_PID" > logs/frontend.pid
