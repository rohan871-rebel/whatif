#!/usr/bin/env bash
set -e

echo "--- Installing Python Backend Dependencies ---"
pip install -r backend/requirements.txt

echo "--- Building React Frontend with Node.js ---"
cd frontend
npm install
npm run build
cd ..

echo "--- Render Build Completed Successfully ---"
