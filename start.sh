#!/usr/bin/env bash
# ==============================================================================
# PatchPilot: One-Command Launcher (Self-Hostable)
# AI for Open Source: Issue Triage and First Reply Engine
# ==============================================================================

set -e

echo "=========================================================="
echo " PatchPilot: AI for Open Source Engine"
echo " Initializing Services..."
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Setup Backend Python Virtual Environment
if [ ! -d "backend/venv" ]; then
    echo "[1/4] Setting up Python virtual environment..."
    python3 -m venv backend/venv
    ./backend/venv/bin/pip install --upgrade pip
    ./backend/venv/bin/pip install -r backend/requirements.txt
else
    echo "[1/4] Python virtual environment verified."
fi

# 2. Setup Frontend Node Dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "[2/4] Installing frontend dependencies..."
    npm --prefix frontend install
else
    echo "[2/4] Frontend node modules verified."
fi

# 3. Start Backend Server
echo "[3/4] Starting FastAPI backend on http://0.0.0.0:8000..."
./backend/venv/bin/python backend/run.py &
BACKEND_PID=$!

# Trap signals to gracefully kill child processes
cleanup() {
    echo ""
    echo "Shutting down PatchPilot services..."
    kill "$BACKEND_PID" 2>/dev/null || true
    kill "$FRONTEND_PID" 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 4. Start Frontend Server
echo "[4/4] Starting Vite frontend on http://0.0.0.0:5173..."
npm --prefix frontend run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

echo ""
echo "=========================================================="
echo " PatchPilot is running:"
echo " Web Application:       http://localhost:5173"
echo " REST API Gateway:      http://localhost:8000"
echo " Interactive OpenAPI:   http://localhost:8000/docs"
echo "=========================================================="
echo " Press CTRL+C to stop all services."

wait
