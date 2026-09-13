#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "=== [1/5] Installing Python dependencies ==="
pip install -r backend/requirements.txt

echo "=== [2/5] Installing Frontend dependencies ==="
cd frontend
npm install

echo "=== [3/5] Building Frontend bundle ==="
npm run build
cd ..

echo "=== [4/5] Deploying static assets to Backend ==="
mkdir -p backend/static
rm -rf backend/static/*
cp -r frontend/dist/* backend/static/

echo "=== [5/5] Initializing Database Curriculum Seed ==="
python -m backend.seed

echo "=== Build completed successfully! ==="
