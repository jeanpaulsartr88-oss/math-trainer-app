#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "=== [1/4] Installing Python dependencies ==="
pip install -r backend/requirements.txt

echo "=== [2/4] Installing Frontend dependencies ==="
cd frontend
npm install

echo "=== [3/4] Building Frontend bundle ==="
npm run build
cd ..

echo "=== [4/4] Deploying static assets to Backend ==="
mkdir -p backend/static
rm -rf backend/static/*
cp -r frontend/dist/* backend/static/

echo "=== Build completed successfully! ==="
