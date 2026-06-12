import os
from fastapi import Request, HTTPException
from fastapi.security import APIKeyHeader

INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")
api_key_header = APIKeyHeader(name="X-Internal-Key", auto_error=False)

async def verify_internal_key(request: Request, call_next):
    # Skip health check and root
    if request.url.path in ["/", "/health"]:
        return await call_next(request)

    key = request.headers.get("X-Internal-Key", "")
    if INTERNAL_API_KEY and key != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")

    return await call_next(request)
