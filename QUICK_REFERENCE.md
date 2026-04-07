# ArenaOps - Quick Reference Card

## 🚀 Quick Start

```bash
# Windows
.\start-all.ps1

# Linux/macOS
chmod +x start-all.sh
./start-all.sh
```

## 🔗 Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | - |
| **AuthService** | http://localhost:5001/swagger | - |
| **CoreService** | http://localhost:5007/swagger | - |
| **Redis** | localhost:6379 | Password: `arenaops_redis_pass` |
| **SQL Server** | localhost:1433 | User: `sa`, Password: `ArenaOps@2024!` |

## 📦 Docker Commands

```bash
# Start infrastructure
docker-compose up -d

# Stop infrastructure
docker-compose down

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Restart service
docker-compose restart redis
docker-compose restart sqlserver

# Clean everything
docker-compose down -v
```

## 🔧 Service Commands

### AuthService
```bash
cd BACKEND/ArenaOps.AuthService/ArenaOps.AuthService.API
dotnet run
```

### CoreService
```bash
cd BACKEND/ArenaOps.CoreService/ArenaOps.CoreService.API
dotnet run
```

### Frontend
```bash
cd FRONTEND/arenaops-web
npm run dev
```

## 🗄️ Database Commands

### Create Databases
```sql
CREATE DATABASE ArenaOps_AuthDB;
CREATE DATABASE ArenaOps_CoreDB;
```

### Run Migrations
```bash
# AuthService
cd BACKEND/ArenaOps.AuthService/ArenaOps.AuthService.Infrastructure
dotnet ef database update --startup-project ../ArenaOps.AuthService.API

# CoreService
cd BACKEND/ArenaOps.CoreService/ArenaOps.CoreService.Infrastructure
dotnet ef database update --startup-project ../ArenaOps.CoreService.API
```

## 🧪 Testing

### Health Checks
```bash
# Redis
redis-cli -a arenaops_redis_pass ping

# SQL Server
sqlcmd -S localhost -U sa -P "ArenaOps@2024!" -Q "SELECT 1"

# AuthService
curl http://localhost:5001/health

# CoreService
curl http://localhost:5007/health
```

### API Testing
```bash
# Register user
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123"}'
```

## 🔍 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5001
taskkill /PID <pid> /F

# Linux/macOS
lsof -ti:5001 | xargs kill -9
```

### Redis Connection Failed
```bash
# Check Redis
docker logs arenaops-redis

# Restart Redis
docker restart arenaops-redis
```

### SQL Server Connection Failed
```bash
# Check SQL Server
docker logs arenaops-sqlserver

# Restart SQL Server
docker restart arenaops-sqlserver
```

### Clear Everything
```bash
# Stop all services
docker-compose down -v

# Clean Docker
docker system prune -a

# Clean .NET
dotnet clean

# Clean Node
rm -rf node_modules .next
npm install
```

## 📊 Monitoring

### View Logs
```bash
# Docker logs
docker-compose logs -f redis
docker-compose logs -f sqlserver

# Application logs
tail -f BACKEND/ArenaOps.AuthService/ArenaOps.AuthService.API/Logs/*.log
tail -f BACKEND/ArenaOps.CoreService/ArenaOps.CoreService.API/Logs/*.log
```

### Redis Monitoring
```bash
redis-cli -a arenaops_redis_pass monitor
redis-cli -a arenaops_redis_pass info
redis-cli -a arenaops_redis_pass keys "*"
```

### SQL Server Monitoring
```sql
-- Active connections
SELECT DB_NAME(dbid), COUNT(*) FROM sys.sysprocesses WHERE dbid > 0 GROUP BY dbid;

-- Long queries
SELECT session_id, start_time, status, command FROM sys.dm_exec_requests WHERE session_id > 50;
```

## 🛑 Stop Services

```bash
# Windows
.\stop-all.ps1

# Linux/macOS
./stop-all.sh
```

## 📚 Documentation

- **Complete Setup**: `COMPLETE_PROJECT_SETUP_GUIDE.md`
- **Architecture**: `docs/02-High-Level-Architecture.md`
- **Database**: `docs/03-Database.md`
- **API Docs**: `docs/04-Api-Documentation.md`
- **Stadium View**: `docs/new one/INTEGRATION_COMPLETE.md`

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| Port in use | Kill process using the port |
| Redis connection failed | Check password in appsettings |
| SQL connection failed | Verify SA password |
| Migration failed | Clean and rebuild |
| Docker won't start | Restart Docker Desktop |
| Frontend build error | Clear node_modules and reinstall |

---

**Quick Help**: For detailed troubleshooting, see `COMPLETE_PROJECT_SETUP_GUIDE.md`
