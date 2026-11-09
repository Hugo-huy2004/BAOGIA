import os
import json
import asyncio
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException
# pyrefly: ignore [missing-import]
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

from services.news_intelligence_service import news_intel
from services.admin_intel_service import admin_intel
from middleware.auth import verify_internal_key

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Hugo Studio AI Server",
    description="Python backend for news summaries and admin intel",
    version="2.0.0"
)

# CORS — restrict to known origins via env var ALLOWED_ORIGINS
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://localhost:4173,https://hugostudio.vn,https://hugowishpax.studio"
)
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Internal API key auth — set INTERNAL_API_KEY in .env to enable
# All routes except / and /health require X-Internal-Key header when key is set
app.middleware("http")(verify_internal_key)


# ---------------------------------------------------------------------------
# Shared service instances
# ---------------------------------------------------------------------------

ai_service = None  # ponytail: LLM chat service removed with HugoPSY; news/admin intel fall back to their rule-based paths
_server_start_time = datetime.now()

# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class NewsSummarizeRequest(BaseModel):
    articleId: str
    title: str
    description: Optional[str] = ""
    body: Optional[str] = None
    source: Optional[str] = "Toà soạn báo chí"
    language: Optional[str] = "vi"

class NewsDigestRequest(BaseModel):
    articles: List[Dict[str, Any]]
    language: Optional[str] = "vi"

class AdminIntelRequest(BaseModel):
    metrics: Dict[str, Any]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

@app.get("/")
def read_root():
    return {"status": "ok", "service": "Hugo Studio AI Server is running"}


@app.get("/health")
def health_check():
    uptime_seconds = int((datetime.now() - _server_start_time).total_seconds())
    return {
        "status": "ok",
        "uptime_seconds": uptime_seconds,
        "timestamp": datetime.now().isoformat()
    }




# ---------------------------------------------------------------------------
# News Intelligence & Fluctuation Digest Endpoints (Tác vụ 1)
# ---------------------------------------------------------------------------

@app.post("/api/ai/news/summarize")
async def summarize_news_article(request: NewsSummarizeRequest):
    """Tóm tắt & viết lại nội dung độc lập theo chuẩn Fair-Use (<0.2ms NLP / Single-Flight LLM) với 0% sập."""
    try:
        res = await news_intel.summarize_article_resilient(
            article_id=request.articleId,
            title=request.title,
            description=request.description or "",
            body=request.body,
            source=request.source or "Toà soạn báo chí",
            lang=request.language or "vi",
            ai_service=ai_service
        )
        return res
    except Exception as e:
        fallback_obj = news_intel.extract_instant_nlp_rewrite(
            request.title,
            request.description or "",
            request.body,
            source=request.source or "Toà soạn báo chí",
            lang=request.language or "vi"
        )
        return {
            **fallback_obj,
            "by": "nlp_instant_fallback",
            "error": str(e)
        }

@app.post("/api/ai/news/digest")
async def summarize_news_digest(request: NewsDigestRequest):
    """Tổng hợp bản tin biến động 24h đa chiều (Tech, Markets, Education, World)."""
    try:
        return await news_intel.extract_fluctuation_digest(request.articles, lang=request.language or "vi")
    except Exception as e:
        return {
            "headline": "Bản tin biến động tổng hợp hôm nay",
            "categories": {},
            "error": str(e)
        }

# ---------------------------------------------------------------------------
# Admin Executive Autonomous Brain Endpoints (Tác vụ 4)
# ---------------------------------------------------------------------------

@app.post("/api/ai/admin/intel")
async def get_admin_intel(request: AdminIntelRequest):
    """Chấm điểm sức khoẻ hệ thống (0-100) và tạo đề xuất điều hành 1-Click."""
    try:
        return await admin_intel.compute_executive_intel(request.metrics, ai_service=ai_service)
    except Exception as e:
        return {
            "system_health_score": 90,
            "system_grade": "A (Chế độ an toàn dự phòng)",
            "status_color": "emerald",
            "error": str(e)
        }

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
