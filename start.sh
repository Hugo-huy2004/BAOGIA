#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# start.sh — Khởi động cả Python AI server + Node.js Express server
# Chạy từ bất kỳ thư mục nào (dùng SCRIPT_DIR để resolve đường dẫn tuyệt đối)
# ─────────────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 Repo root: $SCRIPT_DIR"

echo "🐍 Khởi động Python AI server trên port 8000..."
cd "$SCRIPT_DIR/python-ai-server"
uvicorn main:app --host 127.0.0.1 --port 8000 &
PYTHON_PID=$!
echo "✅ Python AI server PID: $PYTHON_PID"

# Đợi Python sẵn sàng trước khi start Node.js (tối đa 30 giây)
echo "⏳ Đang chờ Python AI server sẵn sàng..."
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:8000/health > /dev/null 2>&1; then
    echo "✅ Python AI server đã sẵn sàng (sau ${i}s)"
    break
  fi
  sleep 1
done

echo "🟢 Khởi động Node.js server trên port $PORT..."
cd "$SCRIPT_DIR/server"
node server.js
