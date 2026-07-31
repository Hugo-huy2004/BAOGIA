"""Vercel Python entrypoint — chỉ là vỏ bọc quanh app FastAPI ở main.py.

Vercel nạp file này và tự nhận diện biến `app` là một ASGI application.
main.py nằm ở thư mục cha nên phải thêm nó vào sys.path (Python chỉ tự thêm
thư mục chứa chính file này, tức là api/).

Chạy local vẫn dùng `uvicorn main:app` như cũ — file này không ảnh hưởng.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app  # noqa: E402

__all__ = ["app"]
