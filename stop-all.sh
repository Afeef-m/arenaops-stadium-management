#!/bin/bash
# ArenaOps - Stop All Services Script (Linux/macOS)

echo "========================================"
echo "  Stopping ArenaOps Services"
echo "========================================"
echo ""

# Stop backend services
if [ -f logs/auth.pid ]; then
    AUTH_PID=$(cat logs/auth.pid)
    echo "Stopping AuthService (PID: $AUTH_PID)..."
    kill $AUTH_PID 2>/dev/null
    rm logs/auth.pid
fi

if [ -f logs/core.pid ]; then
    CORE_PID=$(cat logs/core.pid)
    echo "Stopping CoreService (PID: $CORE_PID)..."
    kill $CORE_PID 2>/dev/null
    rm logs/core.pid
fi

if [ -f logs/frontend.pid ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    echo "Stopping Frontend (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null
    rm logs/frontend.pid
fi

# Stop Docker services
echo "Stopping Docker services..."
docker-compose down

echo ""
echo "All services stopped!"
echo ""
