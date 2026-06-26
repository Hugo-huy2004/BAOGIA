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
from services.intent_insights_service import intent_insights, normalize
from services.warning_sentinel import warning_sentinel
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
    persona: Optional[str] = "companion"

class IntentClassifyRequest(BaseModel):
    message: str
    userId: Optional[str] = "unknown"

class LocalIntentLogRequest(BaseModel):
    message: str
    intentId: Optional[str] = None
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

class TherapeuticStoryRequest(BaseModel):
    mood: Optional[str] = None
    context: Optional[str] = ""
    bio: Optional[Dict[str, Any]] = None

class MeditationScriptRequest(BaseModel):
    mood: Optional[str] = None
    context: Optional[str] = ""
    bio: Optional[Dict[str, Any]] = None

class CbtWorksheetRequest(BaseModel):
    historyLogs: Optional[List[Dict[str, Any]]] = None
    chatMessages: Optional[List[Dict[str, Any]]] = None
    bio: Optional[Dict[str, Any]] = None

class ActionPlanRequest(BaseModel):
    historyLogs: Optional[List[Dict[str, Any]]] = None
    bio: Optional[Dict[str, Any]] = None

class DeepReportRequest(BaseModel):
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

def _client_ip(req: Request) -> str:
    if req and req.client:
        return req.client.host or ""
    return ""

def _lock_message(minutes: int) -> str:
    return f"🔒 Token PSY của cậu đang bị khóa tạm thời. Vui lòng quay lại sau khoảng {minutes} phút nữa nhé."

def _sentinel_text(messages: list[str]) -> str:
    return "|||".join(messages)

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


MAX_CHAT_TOKENS = 10  # Daily chat budget. Free social/crisis intents = 0, intent-answered questions = -1, full LLM = -3.


@app.get("/api/ai/chat/remaining")
async def chat_remaining(userId: str = "unknown", req: Request = None):
    """Return remaining chat tokens for the calling user today."""
    client_identifier = _client_id(userId, req)
    ip = _client_ip(req)
    lock_minutes = warning_sentinel.get_lock_remaining_minutes(client_identifier, ip)
    remaining = await rate_limiter.get_remaining(client_identifier, "chat", MAX_CHAT_TOKENS)
    return {"remaining": 0 if lock_minutes > 0 else remaining, "max": MAX_CHAT_TOKENS, "locked": lock_minutes > 0, "lockMinutes": lock_minutes}

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


@app.post("/api/ai/intent/classify")
async def classify_intent(request: IntentClassifyRequest, req: Request):
    try:
        client_identifier = _client_id(request.userId, req)
        ip = _client_ip(req)
        lock_minutes = warning_sentinel.get_lock_remaining_minutes(client_identifier, ip)
        if lock_minutes > 0:
            return {"reply": _lock_message(lock_minutes), "locked": True, "lockMinutes": lock_minutes}

        violation_type = warning_sentinel.detect_violation(request.message)
        if violation_type:
            result = warning_sentinel.check_and_warn(client_identifier, ip, violation_type)
            return {"reply": _sentinel_text(result["messages"]), "warning": True, "locked": result.get("locked", False), "warningCount": result.get("count", 0), "lockMinutes": 180 if result.get("locked") else 0}

        remaining = await rate_limiter.get_remaining(client_identifier, "chat", MAX_CHAT_TOKENS)
        if remaining <= 0:
            # Out of free tokens — skip the classification call entirely (saves an AI call);
            # the LLM tier will correctly explain "hết token" if the message escalates there.
            return {"intent": "fallback"}

        normalized = normalize(request.message)
        cached_intent = await intent_insights.get_cached(normalized)
        if cached_intent:
            intent_id = cached_intent
            await intent_insights.log_match(request.message, "cache", intent_id, client_identifier)
        else:
            result = await ai_service.classify_intent(request.message)
            intent_id = result.get("intent") if isinstance(result, dict) else None
            await intent_insights.log_match(request.message, "ai", intent_id, client_identifier)
            if intent_id and intent_id != "fallback":
                await intent_insights.set_cached(normalized, intent_id)

        if intent_id and intent_id != "fallback":
            weight = 0 if intent_id in ai_service.FREE_INTENT_IDS else 1
            if weight > 0:
                await rate_limiter.check_and_increment(client_identifier, "chat", MAX_CHAT_TOKENS, weight=weight)
        return {"intent": intent_id or "fallback"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/intent/log-local")
async def log_local_intent_match(request: LocalIntentLogRequest, req: Request):
    """Fire-and-forget telemetry for the frontend's free, zero-API-call local
    Dice-match (findMatchingIntent) — without this, that tier is invisible to
    the same analytics that track the AI-classify and fallback tiers."""
    client_identifier = _client_id(request.userId, req)
    await intent_insights.log_match(request.message, "local", request.intentId, client_identifier)
    return {"ok": True}


@app.post("/api/ai/chat")
async def chat(request: ChatRequest, req: Request):
    LLM_WEIGHT = 3

    try:
        client_identifier = _client_id(request.userId, req)
        ip = _client_ip(req)
        lock_minutes = warning_sentinel.get_lock_remaining_minutes(client_identifier, ip)
        if lock_minutes > 0:
            async def locked_stream():
                yield f"data: {json.dumps({'text': _lock_message(lock_minutes), 'locked': True, 'lockMinutes': lock_minutes}, ensure_ascii=False)}\n\n"
                await asyncio.sleep(0.1)
            return StreamingResponse(locked_stream(), media_type="text/event-stream")

        violation_type = warning_sentinel.detect_violation(request.message)
        if violation_type:
            result = warning_sentinel.check_and_warn(client_identifier, ip, violation_type)
            async def warning_stream():
                for idx, msg in enumerate(result["messages"]):
                    text = msg if idx == 0 else f"|||{msg}"
                    yield f"data: {json.dumps({'text': text, 'warning': True, 'locked': result.get('locked', False), 'warningCount': result.get('count', 0), 'lockMinutes': 180 if result.get('locked') else 0}, ensure_ascii=False)}\n\n"
                    await asyncio.sleep(0.05)
            return StreamingResponse(warning_stream(), media_type="text/event-stream")

        remaining = await rate_limiter.get_remaining(client_identifier, "chat", MAX_CHAT_TOKENS)
        if remaining < LLM_WEIGHT:
            email = request.userId if request.userId and "@" in request.userId else (request.bio or {}).get("email")
            if not await rate_limiter.consume_bonus_token(email, "bonusChatTokens"):
                return {"reply": f"Bạn đã sử dụng hết {MAX_CHAT_TOKENS} token trong ngày hôm nay để trò chuyện với AI. Vui lòng quay lại vào ngày mai nhé!"}

        reply = await ai_service.generate_chat_response(
            message=request.message,
            history=request.history,
            bio=request.bio,
            persona=request.persona
        )
        # Only charge after a confirmed successful reply — errors never cost a token.
        await rate_limiter.check_and_increment(client_identifier, "chat", MAX_CHAT_TOKENS, weight=LLM_WEIGHT)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/chat/stream")
async def chat_stream(request: ChatRequest, req: Request):
    LLM_WEIGHT = 3
    try:
        client_identifier = _client_id(request.userId, req)
        remaining = await rate_limiter.get_remaining(client_identifier, "chat", MAX_CHAT_TOKENS)
        if remaining < LLM_WEIGHT:
            email = request.userId if request.userId and "@" in request.userId else (request.bio or {}).get("email")
            if not await rate_limiter.consume_bonus_token(email, "bonusChatTokens"):
                async def error_stream():
                    yield f"data: {json.dumps({'error': f'Bạn đã sử dụng hết {MAX_CHAT_TOKENS} token trong ngày hôm nay để trò chuyện với AI. Vui lòng quay lại vào ngày mai nhé!'}, ensure_ascii=False)}\n\n"
                    await asyncio.sleep(0.1)
                return StreamingResponse(error_stream(), media_type="text/event-stream")

        inner_generator = ai_service.generate_chat_response_stream(
            message=request.message,
            history=request.history,
            bio=request.bio
        )

        async def charged_stream():
            had_error = False
            async for chunk in inner_generator:
                if chunk.strip().startswith("data: "):
                    try:
                        payload = json.loads(chunk.strip()[6:])
                        if isinstance(payload, dict) and "error" in payload:
                            had_error = True
                    except Exception:
                        pass
                yield chunk
            # Only charge after a confirmed successful, error-free stream — errors never cost a token.
            if not had_error:
                await rate_limiter.check_and_increment(client_identifier, "chat", MAX_CHAT_TOKENS, weight=LLM_WEIGHT)

        return StreamingResponse(charged_stream(), media_type="text/event-stream")
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
        parsed_bio = json.loads(bio)

        is_allowed, _ = await rate_limiter.check_and_increment(client_identifier, action, max_tokens)
        if not is_allowed:
            bonus_field = "bonusCallTokens" if isCallMode else "bonusChatTokens"
            if not await rate_limiter.consume_bonus_token(parsed_bio.get("email"), bonus_field):
                return {"text": "Bạn đã sử dụng hết token trong ngày hôm nay. Vui lòng quay lại vào ngày mai nhé!", "audio_base64": None}

        audio_bytes = await file.read()
        mime_type = file.content_type or "audio/webm"
        parsed_history = json.loads(history)

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
# Premium therapy endpoints (150 JOY unlocks — gated on the Node side)
# ---------------------------------------------------------------------------

@app.post("/api/ai/therapy/story")
async def therapeutic_story(request: TherapeuticStoryRequest):
    """"Đọc Truyện AI Trị Liệu" — truyện ngắn trị liệu cá nhân hoá theo mood thực."""
    try:
        return await ai_service.generate_therapeutic_story(
            mood=request.mood, context=request.context or "", bio=request.bio
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/therapy/meditation-script")
async def meditation_script(request: MeditationScriptRequest):
    """"Thiền Dẫn AI Cá Nhân Hoá" — script giọng dẫn thiền theo mood/dữ liệu thực."""
    try:
        return await ai_service.generate_meditation_script(
            mood=request.mood, context=request.context or "", bio=request.bio
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/therapy/cbt-worksheet")
async def cbt_worksheet(request: CbtWorksheetRequest):
    """"CBT Worksheet Cá Nhân Hoá" — bảng ghi nhận suy nghĩ CBT từ lịch sử chat/checkin thật."""
    try:
        return await ai_service.generate_cbt_worksheet(
            history_logs=request.historyLogs or [], chat_messages=request.chatMessages or [], bio=request.bio
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/therapy/action-plan")
async def action_plan(request: ActionPlanRequest):
    """"Lộ Trình Hoạt Động Cá Nhân Hoá" — gộp viết/vận động/kết nối thành kế hoạch 7 ngày."""
    try:
        return await ai_service.generate_action_plan(
            history_logs=request.historyLogs or [], bio=request.bio
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/therapy/deep-report")
async def deep_report(request: DeepReportRequest):
    """"Báo Cáo Tâm Lý Chuyên Sâu" — hồ sơ tổng hợp chia sẻ được cho chuyên viên thật."""
    try:
        return await ai_service.generate_deep_report(
            history_logs=request.historyLogs or [], chat_messages=request.chatMessages or [], bio=request.bio
        )
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
