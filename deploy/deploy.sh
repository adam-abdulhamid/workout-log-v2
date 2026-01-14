#!/bin/bash
# Deploy workout-log to VPS
# Usage: ./deploy.sh user@your-vps-ip

set -e

if [ -z "$1" ]; then
  echo "Usage: ./deploy.sh user@your-vps-ip"
  exit 1
fi

VPS=$1
APP_DIR="~/apps/workout-log"

echo "📦 Deploying to $VPS..."

# Sync project files (excluding node_modules, .next, etc.)
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '.env.local' \
  --exclude 'deploy' \
  --exclude 'scripts' \
  ../ "$VPS:$APP_DIR/"

# Run build on VPS
ssh "$VPS" "cd $APP_DIR && docker compose up -d --build"

echo "✅ Deployed! Check https://workout.adamabdulhamid.com"
