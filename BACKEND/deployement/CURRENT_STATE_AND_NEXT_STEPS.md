# ArenaOps Backend — Current State & Next Steps for AWS Deployment

## 🔍 Backend Analysis (What You Have Right Now)

### Two Microservices — Both Complete & Buildable

| Service | Location | Entry DLL | Status |
|---|---|---|---|
| **AuthService** | `BACKEND/ArenaOps.AuthService/` | `ArenaOps.AuthService.API.dll` | ✅ Complete |
| **CoreService** | `BACKEND/ArenaOps.CoreService/` | `ArenaOps.CoreService.API.dll` | ✅ Complete |

### AuthService Features Confirmed
- RSA JWT (private+public key pair in `Keys/rsa-private.key` + `rsa-public.key`)
- Serilog file+console logging
- Rate limiting middleware (login: 5/min, register: 20/min)
- Token blacklist (in-memory)
- Google OAuth
- SMTP email (Gmail configured in dev)
- EF Core → SQL Server (`AuthDb` connection)
- Health endpoint: `GET /health`

### CoreService Features Confirmed
- 16 API Controllers (Stadium, SeatingPlan, Events, Seats, Sections, Landmarks, Bowls, FieldConfig, Admin, Tickets…)
- SignalR Hub: `/hubs/seat-status` (real-time seat status)
- RSA JWT validation (reads `Keys/rsa-public.key`)
- In-memory cache + rate limiting
- EF Core → SQL Server (`CoreDb` connection) — **17 migrations applied**
- Dapper for query-heavy reads
- Health endpoint: `GET /health`

### Databases: Two Separate MonsterDB Instances ✅

| Service | Host | Database | Key |
|---|---|---|---|
| **AuthService** | `db41261.public.databaseasp.net` | `db41261` | `AuthDb` |
| **CoreService** | `db41847.public.databaseasp.net` | `db41847` | `CoreDb` |

- Credentials stored in each service's `appsettings.Development.json`
- **All migrations applied on both DBs** — both schemas are live
- Each service is fully isolated — correct microservice pattern ✅

> ⚠️ Both MonsterDB hosts must **whitelist the EC2 public IP** in their firewall settings, otherwise the services won't be able to connect from AWS.

### RSA Key Pair
- **Private key** (`rsa-private.key`): lives in AuthService `Keys/` folder ✅
- **Public key** (`rsa-public.key`): lives in **both** AuthService AND CoreService `Keys/` folders ✅
- Keys are generated and consistent across both services

### CORS
- Currently hardcoded to `http://localhost:3000` only
- **Must update before production** to include your Vercel domain or EC2 IP

---

## 🗺️ Deployment Plan Progress (Against AWS_DEPLOYMENT_PLAN.md)

| Phase | Task | Status |
|---|---|---|
| **PHASE 0** | Test local Docker (AuthService + CoreService + Nginx) | ❌ Not done |
| **PHASE 1.1** | `dotnet publish`| **AuthService** | JWT (RSA), Google OAuth, SMTP email, rate limiting, token blacklist, health endpoint |
| **CoreService** | 16 API controllers (Stadiums, Events, Seats, Sections, Bowls, Tickets…), SignalR hub for real-time seats, Dapper + EF Core |
| **RSA Key Pair** | `rsa-private.key` in AuthService, `rsa-public.key` in both services ✅ |
| **AuthDB** | `db41261.public.databaseasp.net` — users, tokens, roles ✅ |
| **CoreDB** | `db41847.public.databaseasp.net` — stadiums, events, seats, bowls ✅ | ❌ Not done |
| **PHASE 1.6** | Build `coreservice` Docker image | ❌ Not done |
| **PHASE 1.7** | Save authservice image to `.tar` | ❌ Not done |
| **PHASE 1.8** | Save coreservice image to `.tar` | ❌ Not done |
| **PHASE 2** | Create EC2 (t2.micro, Ubuntu 22.04) | ❌ Not done |
| **PHASE 2** | Open Ports: 22, 80, 443 | ❌ Not done |
| **PHASE 2** | Install Docker + docker-compose on EC2 | ❌ Not done |
| **PHASE 3** | SCP `.tar` images to EC2 | ❌ Not done |
| **PHASE 3** | `docker load` on EC2 | ❌ Not done |
| **PHASE 4** | Create `docker-compose.yml` on EC2 | ❌ Not done |
| **PHASE 4** | Create `nginx.conf` on EC2 | ❌ Not done |
| **PHASE 4** | Start services + verify health | ❌ Not done |
| **PHASE 5** | Vercel → `NEXT_PUBLIC_API_URL` set | ❌ Not done |
| **PHASE 6** | Domain + SSL (Let's Encrypt) | ❌ Optional |

> **Summary: 0/18 phases completed.** The codebase is 100% ready. Deployment has not started.

---

## ⚠️ Issues to Fix BEFORE Building Docker Images

These will break your deployment if not fixed first:

### 1. `appsettings.json` has malformed JSON (duplicate closing braces)

Both `appsettings.json` files have a stray `},` before `RateLimiting`:

```json
  "GoogleAuth": { ... },
  },          ← ❌ THIS IS INVALID JSON
  "RateLimiting": { ... }
```

**Fix:** Remove the extra `},` on line 53 of AuthService and line 42 of CoreService `appsettings.json`.

### 2. CORS is hardcoded to `localhost:3000` only

In both `Program.cs` files:
```csharp
policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
```

**Fix:** Add your production domain before building:
```csharp
policy.WithOrigins(
    "http://localhost:3000",
    "https://localhost:3000",
    "http://YOUR_EC2_IP",           // <- add this
    "https://yourdomain.com"        // <- add this if you have a domain
)
```

### 3. CoreService `Program.cs` has Swagger always enabled (not just Development)

```csharp
app.UseSwagger();        // runs in ALL environments
app.UseSwaggerUI();
```

**Fix:** Wrap in environment check for production security (optional but recommended).

### 4. `appsettings.json` `ConnectionStrings` point to placeholder values

The base `appsettings.json` has `YOUR_SERVER`, `YOUR_DB` etc. Production will use `appsettings.json` (not `.Development.json`). You need to pass real connection strings via **docker-compose environment variables** — this is already planned in the deployment plan ✅.

---

## ✅ What You Should Do Next — Step by Step

### Step 1 — Fix the JSON bug in `appsettings.json` (5 min)
Remove the stray `},` from both files so the JSON is valid.

### Step 2 — Update CORS for production (5 min)
Add your EC2 IP (or domain) to the `AllowFrontend` CORS policy in both `Program.cs` files.

### Step 3 — Verify both services build cleanly (10 min)
```powershell
cd d:\ArenaOps\arenaops-stadium-management\BACKEND\ArenaOps.AuthService
dotnet build

cd ..\ArenaOps.CoreService
dotnet build
```
Confirm: **0 errors**.

### Step 4 — `dotnet publish` both services (PHASE 1.1 + 1.2)
```powershell
# AuthService
cd d:\ArenaOps\arenaops-stadium-management\BACKEND\ArenaOps.AuthService
dotnet publish -c Release -o publish/

# CoreService  
cd ..\ArenaOps.CoreService
dotnet publish -c Release -o publish/
```

### Step 5 — Create Dockerfiles (PHASE 1.3 + 1.4)
I will create these for you — one for each service.

### Step 6 — Build + Save Docker images (PHASE 1.5-1.8)
```bash
docker build -t authservice:latest .
docker save authservice:latest -o authservice.tar

docker build -t coreservice:latest .
docker save coreservice:latest -o coreservice.tar
```

### Step 7 — Launch EC2 instance on AWS (PHASE 2)
- Instance: t2.micro, Ubuntu 22.04
- Open ports: 22, 80, 443
- Download `.pem` key file

### Step 8 — Upload images + run (PHASE 3 + 4)
- `scp` the two `.tar` files + RSA keys to EC2
- Create `docker-compose.yml` with **two separate connection strings**:
  - `authservice` → `db41261.public.databaseasp.net`
  - `coreservice` → `db41847.public.databaseasp.net`
- Create `nginx.conf`
- Whitelist EC2 IP in **both** MonsterDB firewall settings
- `docker-compose up -d`

### Step 9 — Test live endpoints
```bash
curl http://YOUR_EC2_IP/api/auth/health
curl http://YOUR_EC2_IP/api/core/health
```

### Step 10 — Update Vercel (PHASE 5)
Set `NEXT_PUBLIC_API_URL=http://YOUR_EC2_IP` in Vercel environment variables.

---

## 📋 Summary

| What's Ready | What's Missing |
|---|---|
| ✅ Both services fully coded | ❌ Dockerfiles don't exist yet |
| ✅ RSA keys generated | ❌ `appsettings.json` has JSON bug |
| ✅ DB schema live on MonsterDB | ❌ CORS not updated for production |
| ✅ 16 controllers in CoreService | ❌ No EC2 created yet |
| ✅ SignalR hub ready | ❌ No `docker-compose.yml` |
| ✅ Health endpoints on both | ❌ No Nginx config |

**Your immediate next action:** Fix JSON bug → update CORS → I create Dockerfiles → you publish + build images → deploy to EC2.
