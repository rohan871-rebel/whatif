#!/usr/bin/env bash
set -e

# Add local node and cloudflared to PATH if present
if [ -d "/Users/rohangudla/.local/node/bin" ]; then
    export PATH="/Users/rohangudla/.local/node/bin:$PATH"
fi
if [ -d "/Users/rohangudla/.local/bin" ]; then
    export PATH="/Users/rohangudla/.local/bin:$PATH"
fi

echo "================================================================="
echo "   GHOST SIGNAL — WHAT IF? | Biomedical AI Reliability Platform "
echo "   Optic Forge Hackathon Research Suite                          "
echo "================================================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "[1/4] Checking Python environment..."
python3 -m pip install -q -r "$BACKEND_DIR/requirements.txt"

echo "[2/4] Ensuring frontend build exists..."
if [ ! -d "$FRONTEND_DIR/dist" ]; then
    cd "$FRONTEND_DIR"
    npm install
    npm run build
fi

echo "[3/4] Launching FastAPI Backend (serving UI + API + llms.txt)..."
cd "$BACKEND_DIR"
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "[4/4] Launching Vite Frontend Dev Server (port 5173)..."
cd "$FRONTEND_DIR"
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

# Optional Public Tunnel
TUNNEL_PID=""
if [ "$1" == "--public" ] || [ "$PUBLIC" == "1" ]; then
    echo "Creating public HTTPS tunnel for AI & web access..."
    cloudflared tunnel --url http://127.0.0.1:8000 > "$ROOT_DIR/tunnel.log" 2>&1 &
    TUNNEL_PID=$!
    sleep 3
    TUNNEL_URL=$(grep -o 'https://[-a-zA-Z0-9.]*\.trycloudflare\.com' "$ROOT_DIR/tunnel.log" | head -n 1 || echo "")
fi

cleanup() {
    echo "Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID $TUNNEL_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

echo "================================================================="
echo "   GHOST SIGNAL IS RUNNING:"
echo "   ➜ Local UI:            http://localhost:5173"
echo "   ➜ Unified Backend/UI:  http://localhost:8000"
echo "   ➜ REST API & Docs:     http://localhost:8000/docs"
echo "   ➜ AI Spec (llms.txt):  http://localhost:8000/llms.txt"
if [ -n "$TUNNEL_URL" ]; then
    echo "   ➜ PUBLIC HTTPS URL:    $TUNNEL_URL"
    echo "   ➜ Public AI Spec:      $TUNNEL_URL/llms.txt"
fi
echo "================================================================="
echo "Press Ctrl+C to terminate all services."

wait
