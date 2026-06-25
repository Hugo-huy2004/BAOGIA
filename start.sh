#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# start.sh — Khởi động cả Python AI server + Node.js Express server
# Chạy từ bất kỳ thư mục nào (dùng SCRIPT_DIR để resolve đường dẫn tuyệt đối)
# ─────────────────────────────────────────────────────────────────────────────

set -e

# Thư mục gốc của repo (nơi start.sh nằm)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 Repo root: $SCRIPT_DIR"

echo "🐍 Khởi động Python AI server trên port 8000..."
cd "$SCRIPT_DIR/python-ai-server"
uvicorn main:app --host 127.0.0.1 --port 8000 &
PYTHON_PID=$!
echo "✅ Python AI server PID: $PYTHON_PID"

echo "🟢 Khởi động Node.js server trên port $PORT..."
cd "$SCRIPT_DIR/server"
node server.js
