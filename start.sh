#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# start.sh — Khởi động cả Python AI server + Node.js Express server
# trong cùng 1 Render Web Service (Node.js runtime).
#
# Cách hoạt động:
#   • Python FastAPI chạy nền trên port 8000 (internal only)
#   • Node.js Express chạy chính trên $PORT (Render expose ra ngoài)
#   • Node.js đã proxy /api/ai/* → http://127.0.0.1:8000 (xem aiProxyRoutes.js)
# ─────────────────────────────────────────────────────────────────────────────

set -e

echo "🐍 Khởi động Python AI server trên port 8000..."
cd python-ai-server
pip install -r requirements.txt --quiet
uvicorn main:app --host 127.0.0.1 --port 8000 &
PYTHON_PID=$!
echo "✅ Python AI server PID: $PYTHON_PID"

# Về root để chạy Node.js
cd ..

echo "🟢 Khởi động Node.js server trên port $PORT..."
cd server
node server.js
