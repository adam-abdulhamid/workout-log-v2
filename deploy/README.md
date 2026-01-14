# VPS Deployment Guide

This guide sets up Docker + Traefik for running multiple apps on a single VPS with automatic SSL.

## Prerequisites

- VPS with Docker and Docker Compose installed
- Domain DNS pointing to your VPS IP (e.g., `workout.adamabdulhamid.com` → VPS IP)
- Ports 80 and 443 open on your firewall

## Step 1: Set Up Traefik (One Time)

SSH into your VPS and run:

```bash
# Create a directory for Traefik
mkdir -p ~/traefik
cd ~/traefik

# Copy the traefik files (docker-compose.yml and traefik.yml) here
# Or clone/copy from this deploy/traefik directory

# Create the acme.json file for SSL certificates
touch acme.json
chmod 600 acme.json

# Create the shared network
docker network create traefik-public

# Start Traefik
docker compose up -d
```

## Step 2: Deploy Workout Log App

```bash
# Create a directory for the app
mkdir -p ~/apps/workout-log
cd ~/apps/workout-log

# Clone/copy your repo here, or just copy docker-compose.yml

# Create .env.local with your production credentials
cat > .env.local << 'EOF'
DATABASE_URL=postgresql://...your-neon-url...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
EOF

# Build and start
docker compose up -d --build
```

## Step 3: Verify

1. Visit https://workout.adamabdulhamid.com
2. Check logs if needed: `docker compose logs -f`

## Adding More Apps

For each new app, just create a docker-compose.yml with Traefik labels:

```yaml
services:
  app:
    build: .
    expose:
      - "3000"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.myapp.rule=Host(`myapp.adamabdulhamid.com`)"
      - "traefik.http.routers.myapp.entrypoints=websecure"
      - "traefik.http.routers.myapp.tls.certresolver=letsencrypt"
      - "traefik.http.services.myapp.loadbalancer.server.port=3000"
    networks:
      - traefik-public

networks:
  traefik-public:
    external: true
```

## Useful Commands

```bash
# View running containers
docker ps

# View logs
docker compose logs -f

# Rebuild and restart
docker compose up -d --build

# Stop
docker compose down

# Check Traefik dashboard (if enabled)
# https://traefik.adamabdulhamid.com
```

## Updating the App

```bash
cd ~/apps/workout-log
git pull  # or copy new files
docker compose up -d --build
```

## Clerk Production Keys

For production, create a new Clerk app or switch to production mode:
1. Go to Clerk Dashboard → Your App → API Keys
2. Toggle "Development" to "Production"
3. Use the production keys (pk_live_, sk_live_) in your .env.local
