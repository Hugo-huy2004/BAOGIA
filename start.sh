#!/bin/bash
# Khởi động Node.js server.
#
# Trước đây file này chạy song song uvicorn (Python AI, port 8000) + Node. Python
# đã tách sang Vercel (xem docs/tach-tai-render.md), nên ở đây chỉ còn Node.
#
# ponytail: giữ lại file này thay vì xoá, vì service trên Render có thể đang lưu
# `bash start.sh` trong ô Start Command của dashboard — xoá đi là deploy kế tiếp
# chết ngay với "start.sh: No such file or directory".
set -e
cd "$(dirname "${BASH_SOURCE[0]}")/server"
exec node server.js
