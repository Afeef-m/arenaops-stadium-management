# ArenaOps — AWS Free Tier Deployment (Single EC2 + MonsterDB)

**Last Updated**: 2026-04-14
**Status**: Ready for Implementation
**Cost**: ~$0–1/month (Free Tier)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Deployment](#step-by-step-deployment)
4. [Troubleshooting](#troubleshooting)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Cost Breakdown](#cost-breakdown)

---

## Architecture Overview

### Setup Diagram

```
┌─────────────────────────────────────────┐
│     EC2 t2.micro (Linux, 1GB RAM)      │
│  ────────────────────────────────────   │
│  ┌──────────────────────────────────┐   │
│  │      Docker & Docker Compose     │   │
│  ├──────────────────────────────────┤   │
│  │  • AuthService       (port 3001) │   │
│  │  • CoreService       (port 3002) │   │
│  │  • Frontend/Next.js  (port 3000) │   │
│  │  • Nginx             (port 80/443)   │
│  │  • Redis (optional)  (port 6379) │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
         ↓
    MonsterDB SQL Server (existing)
```

### Why This Setup?

- ✅ **Free**: t2.micro + EBS 20GB = $0/month (12 months)
- ✅ **Simple**: Single server, no complex networking
- ✅ **Existing DB**: Reuses current MonsterDB connection
- ✅ **Containerized**: Easy to scale up later or migrate
- ✅ **Production-ready**: Nginx reverse proxy, SSL support

### Limitations

⚠️ **1GB RAM is tight:**
- Each service gets ~250MB
- No headroom for traffic spikes
- Redis is optional (can use in-memory cache)

**Upgrade Path**: Move to `t2.small` ($8/month) or auto-scale with load balancer later.

---

## Prerequisites

Before starting, ensure you have:

- [ ] AWS Account (sign up for Free Tier)
- [ ] EC2 key pair created
- [ ] MonsterDB SQL Server connection details:
  - Host (e.g., `monsterdb.com`)
  - Database name: `ArenaOps`
  - Username & Password
- [ ] Domain name (optional but recommended for production)
- [ ] Git repo cloned locally with:
  - Latest `BACKEND/ArenaOps.AuthService/`
  - Latest `BACKEND/ArenaOps.CoreService/`
  - Latest `FRONTEND/arenaops-web/`
- [ ] Docker installed on local machine
- [ ] AWS CLI configured: `aws configure`

---

## Step-by-Step Deployment

### Step 1: Launch EC2 Instance (Free Tier)

#### 1.1 Go to AWS Console

1. Navigate to **[AWS EC2 Dashboard](https://console.aws.amazon.com/ec2/)**
2. Click **Launch Instance**

#### 1.2 Configure Instance

| Setting | Value |
|---------|-------|
| **Name** | `arenaops-prod` |
| **AMI** | Ubuntu 22.04 LTS (free tier eligible) |
| **Instance Type** | `t2.micro` (1 vCPU, 1GB RAM) |
| **Key Pair** | Create new: `arenaops-key` |
| **Security Group** | Create new: `arenaops-sg` |

#### 1.3 Add Security Group Rules

| Type | Protocol | Port | Source |
|------|----------|------|--------|
| HTTP | TCP | 80 | 0.0.0.0/0 (Anywhere) |
| HTTPS | TCP | 443 | 0.0.0.0/0 (Anywhere) |
| SSH | TCP | 22 | Your IP only |

#### 1.4 Storage

- **Root volume**: 20GB (free tier = 30GB/month)
- **Type**: gp2 or gp3

#### 1.5 Launch

Click **Launch Instance** and download the key pair (`.pem` file).

**Cost**: $0 (free tier)

---

### Step 2: Connect to EC2 & Install Docker

#### 2.1 SSH into Instance

```bash
# On your local machine
ssh -i arenaops-key.pem ubuntu@YOUR_EC2_PUBLIC_IP

# Note: Replace YOUR_EC2_PUBLIC_IP with the actual IP from AWS Console
# Example: ec2-54-123-45-67.compute-1.amazonaws.com
```

#### 2.2 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

#### 2.3 Install Docker

```bash
# Install Docker
sudo apt install -y docker.io docker-compose

# Add ubuntu user to docker group (to run without sudo)
sudo usermod -aG docker ubuntu

# Log out and back in for group changes to take effect
exit
ssh -i arenaops-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

#### 2.4 Verify Installation

```bash
docker --version
# Output: Docker version 24.0.x, build xxxxx

docker-compose --version
# Output: Docker Compose version 2.x.x
```

---

### Step 3: Create Docker Images

#### 3.1 Build AuthService

On **your local machine**:

```bash
cd BACKEND/ArenaOps.AuthService

# Publish for Release
dotnet publish -c Release -o bin/Release/net8.0/publish

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine
WORKDIR /app
COPY bin/Release/net8.0/publish .
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80
ENTRYPOINT ["dotnet", "ArenaOps.AuthService.API.dll"]
EOF

# Build image
docker build -t authservice:latest .

# Save as tar
docker save authservice:latest -o authservice.tar
```

#### 3.2 Build CoreService

```bash
cd BACKEND/ArenaOps.CoreService

# Publish for Release
dotnet publish -c Release -o bin/Release/net8.0/publish

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine
WORKDIR /app
COPY bin/Release/net8.0/publish .
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80
ENTRYPOINT ["dotnet", "ArenaOps.CoreService.API.dll"]
EOF

# Build image
docker build -t coreservice:latest .

# Save as tar
docker save coreservice:latest -o coreservice.tar
```

#### 3.3 Build Frontend

```bash
cd FRONTEND/arenaops-web

# Build Next.js
npm run build

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY .next ./.next
COPY public ./public
EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "start"]
EOF

# Build image
docker build -t frontend:latest .

# Save as tar
docker save frontend:latest -o frontend.tar
```

---

### Step 4: Upload Images to EC2

#### 4.1 Transfer Docker Images

```bash
# On your local machine, in the directory where tar files are located

scp -i arenaops-key.pem authservice.tar ubuntu@YOUR_EC2_IP:/tmp/
scp -i arenaops-key.pem coreservice.tar ubuntu@YOUR_EC2_IP:/tmp/
scp -i arenaops-key.pem frontend.tar ubuntu@YOUR_EC2_IP:/tmp/
```

#### 4.2 Load Images on EC2

```bash
# SSH into EC2
ssh -i arenaops-key.pem ubuntu@YOUR_EC2_IP

# Load images
docker load -i /tmp/authservice.tar
docker load -i /tmp/coreservice.tar
docker load -i /tmp/frontend.tar

# Verify
docker images
# Should show: authservice, coreservice, frontend
```

---

### Step 5: Create docker-compose.yml

Create `/home/ubuntu/docker-compose.yml`:

```bash
cat > /home/ubuntu/docker-compose.yml << 'EOF'
version: '3.8'

services:
  authservice:
    image: authservice:latest
    ports:
      - "3001:80"
    environment:
      ConnectionStrings__DefaultConnection: "Server=your-monsterdb-host;Initial Catalog=ArenaOps;User Id=sa;Password=YOUR_DB_PASSWORD;Encrypt=true;TrustServerCertificate=true;"
      Redis__Host: "redis"
      Redis__Port: "6379"
      Jwt__PrivateKeyPath: "/app/Keys/private_key.pem"
      Jwt__PublicKeyPath: "/app/Keys/public_key.pem"
      ASPNETCORE_ENVIRONMENT: "Production"
    volumes:
      - "./Keys:/app/Keys:ro"
    restart: unless-stopped
    mem_limit: 256m
    memswap_limit: 256m
    depends_on:
      - redis

  coreservice:
    image: coreservice:latest
    ports:
      - "3002:80"
    environment:
      ConnectionStrings__DefaultConnection: "Server=your-monsterdb-host;Initial Catalog=ArenaOps;User Id=sa;Password=YOUR_DB_PASSWORD;Encrypt=true;TrustServerCertificate=true;"
      Redis__Host: "redis"
      Redis__Port: "6379"
      Jwt__PublicKeyPath: "/app/Keys/public_key.pem"
      ASPNETCORE_ENVIRONMENT: "Production"
    volumes:
      - "./Keys:/app/Keys:ro"
    depends_on:
      - redis
    restart: unless-stopped
    mem_limit: 256m
    memswap_limit: 256m

  frontend:
    image: frontend:latest
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: "http://YOUR_EC2_IP"
      AUTH_SERVICE_URL: "http://authservice:80"
      CORE_SERVICE_URL: "http://coreservice:80"
      NODE_ENV: "production"
    restart: unless-stopped
    mem_limit: 256m
    memswap_limit: 256m
    depends_on:
      - authservice
      - coreservice

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
    mem_limit: 128m
    memswap_limit: 128m
    command: redis-server --appendonly yes

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "./nginx.conf:/etc/nginx/nginx.conf:ro"
    depends_on:
      - authservice
      - coreservice
      - frontend
    restart: unless-stopped
    mem_limit: 128m
    memswap_limit: 128m
EOF
```

**Replace these values:**
- `your-monsterdb-host` → Your MonsterDB hostname (e.g., `sql.monsterdb.com`)
- `YOUR_DB_PASSWORD` → Your database password
- `YOUR_EC2_IP` → Your EC2 public IP

---

### Step 6: Copy JWT Keys to EC2

#### 6.1 Create Keys Directory

```bash
# On EC2
mkdir -p /home/ubuntu/Keys
```

#### 6.2 Copy RSA Keys

```bash
# On your local machine
scp -i arenaops-key.pem BACKEND/ArenaOps.AuthService/Keys/private_key.pem ubuntu@YOUR_EC2_IP:/home/ubuntu/Keys/
scp -i arenaops-key.pem BACKEND/ArenaOps.AuthService/Keys/public_key.pem ubuntu@YOUR_EC2_IP:/home/ubuntu/Keys/
```

#### 6.3 Verify on EC2

```bash
ls -la /home/ubuntu/Keys/
```

---

### Step 7: Setup Nginx Reverse Proxy

Create `/home/ubuntu/nginx.conf`:

```bash
cat > /home/ubuntu/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream authservice {
        server authservice:80;
    }

    upstream coreservice {
        server coreservice:80;
    }

    upstream frontend {
        server frontend:3000;
    }

    # Redirect HTTP to HTTPS (if SSL is configured)
    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl default_server;

        # SSL certificates (update paths after obtaining certificates)
        # ssl_certificate /etc/nginx/ssl/fullchain.pem;
        # ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        location /api/auth/ {
            proxy_pass http://authservice/api/auth/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_http_version 1.1;
        }

        location /api/core/ {
            proxy_pass http://coreservice/api/core/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_http_version 1.1;
        }

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
EOF
```

---

### Step 8: Start Services

#### 8.1 Start Docker Compose

```bash
# On EC2
cd /home/ubuntu

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs (follow mode)
docker-compose logs -f
```

#### 8.2 Verify Services Are Running

```bash
# Check port listening
curl http://localhost/
# Should return Frontend HTML

curl http://localhost/api/auth/health
# Should return 200 OK

curl http://localhost/api/core/health
# Should return 200 OK
```

---

### Step 9: Setup DNS (Optional but Recommended)

#### 9.1 Get EC2 Public IP

```bash
# Option 1: From AWS Console
# Services → EC2 → Instances → your instance → Elastic IPs

# Option 2: From CLI
aws ec2 describe-instances --instance-ids i-xxxxxxxx --query 'Reservations[0].Instances[0].PublicIpAddress' --output text
```

#### 9.2 Update Domain DNS

If you own a domain:

1. Go to your domain registrar (GoDaddy, Route 53, Namecheap, etc.)
2. Add an **A record**:
   ```
   Name: app
   Type: A
   Value: YOUR_EC2_PUBLIC_IP
   TTL: 300
   ```
3. Wait 5–10 minutes for DNS to propagate
4. Test: `ping app.yourdomain.com`

---

### Step 10: Setup SSL Certificate (Free with Let's Encrypt)

#### 10.1 Install Certbot

```bash
# On EC2
sudo apt install -y certbot python3-certbot-nginx
```

#### 10.2 Obtain Certificate

```bash
# Stop nginx temporarily
docker-compose down

# Request certificate (replace with your domain)
sudo certbot certonly --standalone -d app.yourdomain.com
# Follow prompts, choose "Agree to terms"

# Certificate will be at: /etc/letsencrypt/live/app.yourdomain.com/
```

#### 10.3 Update nginx.conf

```bash
# Edit nginx.conf to uncomment SSL lines
sed -i 's|# ssl_certificate|ssl_certificate|g' /home/ubuntu/nginx.conf

# Update paths to match your domain
sed -i 's|fullchain.pem|/etc/letsencrypt/live/app.yourdomain.com/fullchain.pem|g' /home/ubuntu/nginx.conf
sed -i 's|privkey.pem|/etc/letsencrypt/live/app.yourdomain.com/privkey.pem|g' /home/ubuntu/nginx.conf

# Restart services
cd /home/ubuntu
docker-compose up -d
```

#### 10.4 Auto-Renew Certificate

```bash
# Certbot auto-renewal cron job (usually already configured)
sudo certbot renew --dry-run

# Verify monthly renewal
sudo systemctl status certbot.timer
```

---

## Troubleshooting

### Issue: Services won't start (Out of Memory)

```bash
# Check memory usage
docker stats
free -h

# Solution: Disable Redis or reduce memory limits
# Edit docker-compose.yml and reduce mem_limit values
```

### Issue: Can't connect to MonsterDB

```bash
# Test connection from EC2
telnet your-monsterdb-host 1433

# Check connection string in docker-compose.yml
docker logs authservice
docker logs coreservice

# Verify firewall allows EC2 → MonsterDB
# May need to whitelist EC2 public IP in MonsterDB firewall
```

### Issue: 502 Bad Gateway (Nginx error)

```bash
# Check if services are running
docker-compose ps

# Check Nginx logs
docker logs nginx

# Check backend logs
docker logs authservice
docker logs coreservice
```

### Issue: High Disk Usage

```bash
# Check available space
df -h

# Clean up old Docker data
docker system prune -a --volumes
```

### Issue: JWT Key Not Found

```bash
# Verify keys exist
ls -la /home/ubuntu/Keys/

# Check permissions
sudo chown -R ubuntu:ubuntu /home/ubuntu/Keys/
chmod 644 /home/ubuntu/Keys/*

# Restart services
docker-compose restart authservice coreservice
```

---

## Monitoring & Maintenance

### Check Service Status

```bash
# SSH into EC2 and run
docker-compose ps

# View real-time resource usage
docker stats

# View logs for all services
docker-compose logs -f --tail=50
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart authservice
```

### Update Services

```bash
# Pull latest code changes (if using CI/CD)
cd /home/ubuntu

# Rebuild images locally and re-upload tar files
# Then reload and restart:
docker load -i authservice.tar
docker-compose up -d authservice
```

### Backup MonsterDB Data

```bash
# SQL Server backup (run from your local machine or MonsterDB console)
BACKUP DATABASE ArenaOps
TO DISK = '/var/opt/mssql/backup/ArenaOps_YYYYMMDD.bak';

# Schedule weekly backup (cron job)
# Connect to MonsterDB and create SQL Agent job or scheduled backup
```

---

## Cost Breakdown

### Free Tier (First 12 Months)

| Service | Limit | Cost |
|---------|-------|------|
| **EC2 t2.micro** | 750 hrs/month | **$0** |
| **EBS** | 30GB/month | **$0** |
| **Data Transfer (out)** | 100GB/month | **$0** |
| **MonsterDB** | Existing | **Already paying** |
| **Route 53** (DNS) | $0.50/zone | **~$0.50** |
| **Total** | — | **$0–1/month** |

### After 12 Months (if you keep running)

| Service | Monthly Cost |
|---------|--------------|
| EC2 t2.micro | $7.87 |
| EBS 20GB | $2.00 |
| Data transfer | ~$0.09/GB × usage |
| Route 53 | $0.50 |
| **Total** | **~$15–20/month** |

### Upgrade Path

If you need more power:
- **t2.small** ($8/month) – 2GB RAM, 2 vCPU
- **t3.micro** ($7.85/month) – Burstable, newer generation
- **Load Balancer + Auto-scaling** – $20+/month for HA setup

---

## Quick Reference

### Connection Commands

```bash
# SSH into EC2
ssh -i arenaops-key.pem ubuntu@YOUR_EC2_IP

# Enter container shell
docker exec -it authservice sh
docker exec -it frontend sh

# View real-time logs
docker-compose logs -f authservice

# Restart all services
docker-compose restart

# Stop all services
docker-compose stop

# Start all services
docker-compose start
```

### URLs After Deployment

```
Frontend:     http://YOUR_EC2_IP
Auth API:     http://YOUR_EC2_IP/api/auth/
Core API:     http://YOUR_EC2_IP/api/core/
Redis:        YOUR_EC2_IP:6379 (internal only)
```

### Important Files on EC2

```
/home/ubuntu/docker-compose.yml      # Main config
/home/ubuntu/nginx.conf              # Reverse proxy config
/home/ubuntu/Keys/                   # JWT keys
/var/lib/docker/volumes/             # Docker volumes
```

---

## Next Steps

1. ✅ Launch EC2 instance
2. ✅ Install Docker & Docker Compose
3. ✅ Build and upload Docker images
4. ✅ Configure services via docker-compose.yml
5. ✅ Start services and test connectivity
6. ✅ Setup DNS (optional)
7. ✅ Setup SSL with Let's Encrypt (optional)
8. ✅ Monitor and maintain

---

## Support & Issues

If you encounter problems:

1. Check logs: `docker-compose logs -f`
2. Verify connection strings in docker-compose.yml
3. Ensure MonsterDB is accessible from EC2
4. Check AWS Security Groups allow HTTP/HTTPS
5. Review troubleshooting section above

---

## Summary

You now have ArenaOps running on **AWS Free Tier** for **~$0/month** with:
- ✅ Containerized backend services
- ✅ Next.js frontend
- ✅ Nginx reverse proxy
- ✅ Redis caching
- ✅ SSL/HTTPS support
- ✅ Easy scaling path

**Next upgrade**: Move to t2.small ($8/month) or RDS for database when free tier expires.
