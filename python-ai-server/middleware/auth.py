import os
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.security import APIKeyHeader

INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")
api_key_header = APIKeyHeader(name="X-Internal-Key", auto_error=False)

async def verify_internal_key(request: Request, call_next):
    # Skip health check and root
    if request.url.path in ["/", "/health"]:
        return await call_next(request)

    key = request.headers.get("X-Internal-Key", "")
    if INTERNAL_API_KEY and key != INTERNAL_API_KEY:
        # raw ASGI middleware doesn't route through FastAPI's exception
        # handlers, so raising HTTPException here surfaces as a 500 — return
        # the response directly instead.
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})

    return await call_next(request)
