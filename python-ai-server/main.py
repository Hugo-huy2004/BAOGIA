import os
import json
import asyncio
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, WebSocket, WebSocketDisconnect
# pyrefly: ignore [missing-import]
from fastapi.responses import StreamingResponse
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

from services.gemini_service import GeminiService
from services.rate_limit_service import rate_limiter
from middleware.auth import verify_internal_key

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Hugo Studio AI Server",
    description="Python backend for AI companion, wellness analysis, OCR, and IoT",
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

ai_service = GeminiService()
_server_start_time = datetime.now()

# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, Any]]] = None
    bio: Optional[Dict[str, Any]] = None
    userId: Optional[str] = "unknown"

class TestAnalysisRequest(BaseModel):
    testName: str
    scores: Optional[Dict[str, Any]] = None
    validity: Optional[Dict[str, Any]] = None
    clinical: Optional[List[Dict[str, Any]]] = None
    lang: Optional[str] = "vi"
    bio: Optional[Dict[str, Any]] = None

class ProactivePushRequest(BaseModel):
    logs: List[Dict[str, Any]]
    bio: Optional[Dict[str, Any]] = None

class IotAnalyzeRequest(BaseModel):
    vitals: List[Dict[str, Any]]
    bio: Optional[Dict[str, Any]] = None

class SleepAnalyzeRequest(BaseModel):
    sleepLogs: List[Dict[str, Any]]
    bio: Optional[Dict[str, Any]] = None

class SmartPushRequest(BaseModel):
    bio: Optional[Dict[str, Any]] = None
    sleepLogs: Optional[List[Dict[str, Any]]] = None
    historyLogs: Optional[List[Dict[str, Any]]] = None
    streak: Optional[int] = 0
    lastCheckin: Optional[str] = None
    pendingActions: Optional[List[str]] = None

class WeeklyReportRequest(BaseModel):
    email: str
    historyLogs: Optional[List[Dict[str, Any]]] = None
    chatMessages: Optional[List[Dict[str, Any]]] = None
    bio: Optional[Dict[str, Any]] = None

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _client_id(user_id: str, req: Request) -> str:
    """Resolve a stable per-user identifier for rate limiting."""
    if user_id and user_id != "unknown":
        return user_id
    if req and req.client:
        return req.client.host
    return "unknown"

# ---------------------------------------------------------------------------
# Health & meta endpoints
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
        "api_key_count": len(ai_service.api_keys),
        "model": ai_service.model_name,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/ai/chat/remaining")
async def chat_remaining(userId: str = "unknown", req: Request = None):
    """Return remaining chat tokens for the calling user today."""
    MAX_CHAT_TOKENS = 3
    client_identifier = _client_id(userId, req)
    remaining = await rate_limiter.get_remaining(client_identifier, "chat", MAX_CHAT_TOKENS)
    return {"remaining": remaining, "max": MAX_CHAT_TOKENS}

# ---------------------------------------------------------------------------
# AI Chat endpoints
# ---------------------------------------------------------------------------

@app.post("/api/ai/proactive-push")
async def proactive_push(request: ProactivePushRequest):
    try:
        decision = await ai_service.generate_proactive_push(
            logs=request.logs,
            bio=request.bio
        )
        return decision
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/chat")
async def chat(request: ChatRequest, req: Request):
    MAX_CHAT_TOKENS = 3
    try:
        client_identifier = _client_id(request.userId, req)
        is_allowed, _ = await rate_limiter.check_and_increment(client_identifier, "chat", MAX_CHAT_TOKENS)
        if not is_allowed:
            return {"reply": f"Bạn đã sử dụng hết {MAX_CHAT_TOKENS} token trong ngày hôm nay để trò chuyện với AI. Vui lòng quay lại vào ngày mai nhé!"}

        reply = await ai_service.generate_chat_response(
            message=request.message,
            history=request.history,
            bio=request.bio
        )
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/chat/stream")
async def chat_stream(request: ChatRequest, req: Request):
    MAX_CHAT_TOKENS = 3
    try:
        client_identifier = _client_id(request.userId, req)
        is_allowed, _ = await rate_limiter.check_and_increment(client_identifier, "chat", MAX_CHAT_TOKENS)
        if not is_allowed:
            async def error_stream():
                yield f"data: {json.dumps({'error': f'Bạn đã sử dụng hết {MAX_CHAT_TOKENS} token trong ngày hôm nay để trò chuyện với AI. Vui lòng quay lại vào ngày mai nhé!'}, ensure_ascii=False)}\n\n"
                await asyncio.sleep(0.1)
            return StreamingResponse(error_stream(), media_type="text/event-stream")

        generator = ai_service.generate_chat_response_stream(
            message=request.message,
            history=request.history,
            bio=request.bio
        )
        return StreamingResponse(generator, media_type="text/event-stream")
    except Exception as e:
        print("Lỗi tại /api/ai/chat/stream:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/chat/audio")
async def chat_audio(
    req: Request,
    file: UploadFile = File(...),
    history: str = Form("[]"),
    bio: str = Form("{}"),
    isCallMode: bool = Form(False),
    userId: str = Form("unknown")
):
    try:
        client_identifier = _client_id(userId, req)
        action = "call" if isCallMode else "audio_chat"
        max_tokens = 5 if isCallMode else 3

        is_allowed, _ = await rate_limiter.check_and_increment(client_identifier, action, max_tokens)
        if not is_allowed:
            return {"text": "Bạn đã sử dụng hết token trong ngày hôm nay. Vui lòng quay lại vào ngày mai nhé!", "audio_base64": None}

        audio_bytes = await file.read()
        mime_type = file.content_type or "audio/webm"
        parsed_history = json.loads(history)
        parsed_bio = json.loads(bio)

        response_data = await ai_service.generate_audio_response(
            audio_bytes=audio_bytes,
            mime_type=mime_type,
            history=parsed_history,
            bio=parsed_bio,
            is_call_mode=isCallMode
        )
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------------------------
# Clinical / psychological analysis endpoints
# ---------------------------------------------------------------------------

@app.post("/api/ai/analyze-test")
async def analyze_test(request: TestAnalysisRequest):
    try:
        analysis = await ai_service.analyze_test_results(
            test_name=request.testName,
            scores=request.scores,
            validity=request.validity,
            clinical=request.clinical,
            lang_detected=request.lang,
            bio=request.bio
        )
        return {"analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/analyze-report")
async def analyze_report(file: UploadFile = File(...)):
    content_type = file.content_type
    if not content_type or (not content_type.startswith("image/") and content_type != "application/pdf"):
        raise HTTPException(
            status_code=400,
            detail="Định dạng file không hợp lệ! Vui lòng gửi ảnh (PNG, JPG) hoặc file PDF bệnh án."
        )
    try:
        file_bytes = await file.read()
        extracted_data = await ai_service.analyze_medical_image_or_pdf(
            file_bytes=file_bytes,
            mime_type=content_type
        )
        return extracted_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý file bệnh án: {str(e)}")

# ---------------------------------------------------------------------------
# Wellness report endpoint
# ---------------------------------------------------------------------------

@app.post("/api/ai/report/weekly")
async def weekly_report(request: WeeklyReportRequest):
    """Tạo báo cáo sức khỏe tâm lý hàng tuần cho người dùng."""
    try:
        result = await ai_service.generate_weekly_report(
            history_logs=request.historyLogs or [],
            chat_messages=request.chatMessages or [],
            bio=request.bio
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------------------------
# IoT endpoints
# ---------------------------------------------------------------------------

@app.post("/api/iot/analyze-vitals")
async def analyze_iot_vitals(request: IotAnalyzeRequest):
    """Phân tích dữ liệu sinh trắc học từ thiết bị IoT."""
    try:
        result = await ai_service.analyze_iot_vitals(
            vitals_history=request.vitals,
            bio=request.bio
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/sleep/analyze")
async def analyze_sleep(request: SleepAnalyzeRequest):
    """Phân tích chất lượng giấc ngủ theo khoa học NSF/AASM."""
    try:
        result = await ai_service.analyze_sleep_health(
            sleep_logs=request.sleepLogs,
            bio=request.bio
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/notifications/smart-push")
async def smart_push(request: SmartPushRequest):
    """Tạo nội dung push notification cá nhân hoá (Duolingo-style)."""
    try:
        user_data = {
            "bio":            request.bio or {},
            "sleepLogs":      request.sleepLogs or [],
            "historyLogs":    request.historyLogs or [],
            "streak":         request.streak,
            "lastCheckin":    request.lastCheckin,
            "pendingActions": request.pendingActions or [],
        }
        result = await ai_service.generate_smart_push(user_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/iot")
async def iot_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for real-time IoT device data streaming.
    Devices push live vitals as JSON; server responds with AI analysis.
    Payload: { "vitals": [{...}], "bio": {...} }
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                vitals = payload.get("vitals", [])
                bio = payload.get("bio")

                if vitals:
                    analysis = await ai_service.analyze_iot_vitals(
                        vitals_history=vitals,
                        bio=bio
                    )
                    await websocket.send_text(json.dumps({
                        "type": "vitals_analysis",
                        "data": analysis,
                        "timestamp": datetime.now().isoformat()
                    }, ensure_ascii=False))
                else:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "No vitals data in payload"
                    }))
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON payload"
                }))
    except WebSocketDisconnect:
        print(f"IoT WebSocket disconnected: {websocket.client}")

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
