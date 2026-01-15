#!/bin/bash
set -e

echo "Pulling latest changes..."
git pull

echo "Rebuilding and restarting container..."
docker compose up -d --build

echo "Done! Container status:"
docker compose ps
