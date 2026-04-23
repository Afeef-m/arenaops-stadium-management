# AWS Deployment Execution Plan

## PHASE 0 — Before EC2
- [ ] Test Local Backend Services in Docker (AuthService, CoreService, Nginx)

## PHASE 1 — Prepare Backend Images
- [ ] Phase 1.1: `dotnet publish -c Release` for AuthService
- [ ] Phase 1.2: `dotnet publish -c Release` for CoreService
- [ ] Phase 1.3: Create Dockerfile for AuthService
- [ ] Phase 1.4: Create Dockerfile for CoreService
- [ ] Phase 1.5: Build `authservice` Docker image
- [ ] Phase 1.6: Build `coreservice` Docker image
- [ ] Phase 1.7: Save authservice image to `.tar` (`docker save authservice -o authservice.tar`)
- [ ] Phase 1.8: Save coreservice image to `.tar` (`docker save coreservice -o coreservice.tar`)

## PHASE 2 — Setup AWS EC2 Server
- [ ] Create EC2 Instance (t2.micro, Ubuntu 22.04, 20GB)
- [ ] Open Ports: 22, 80, 443
- [ ] Install Docker and docker-compose on EC2

## PHASE 3 — Upload & Load Docker Images on EC2
- [ ] SCP `authservice.tar` to EC2
- [ ] SCP `coreservice.tar` to EC2
- [ ] Load `authservice` image on EC2 (`docker load`)
- [ ] Load `coreservice` image on EC2 (`docker load`)

## PHASE 4 — Run via docker-compose & Nginx on EC2
- [ ] Create `docker-compose.yml` on EC2
- [ ] Create `nginx.conf` on EC2
- [ ] Start backend services (`docker-compose up -d`)
- [ ] Verify health endpoints via EC2 IP

## PHASE 5 — Connect Vercel
- [ ] Create Vercel project (if not exists)
- [ ] Set `NEXT_PUBLIC_API_URL` environment variable
- [ ] Test frontend to backend connectivity

## PHASE 6 — (Optional) Domain + HTTPS
- [ ] Setup Domain and Route53/DNS
- [ ] Configure Let's Encrypt / Certbot
