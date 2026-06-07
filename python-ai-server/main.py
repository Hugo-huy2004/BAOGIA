import os
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from services.gemini_service import GeminiService

app = FastAPI(
    title="Hugo Studio AI Server",
    description="Python backend specialized for AI analysis, OCR, and companion chat",
    version="1.0.0"
)

# Cấu hình CORS để frontend React gọi trực tiếp
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Cho phép tất cả các nguồn kết nối
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Khởi tạo dịch vụ Gemini
ai_service = GeminiService()

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, Any]]] = None
    bio: Optional[Dict[str, Any]] = None

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

@app.get("/")
def read_root():
    return {"status": "ok", "service": "Hugo Studio AI Server is running"}

@app.post("/api/ai/proactive-push")
async def proactive_push(request: ProactivePushRequest):
    """
    Endpoint phân tích lịch sử để quyết định gửi Push Notification chủ động.
    """
    try:
        decision = await ai_service.generate_proactive_push(
            logs=request.logs,
            bio=request.bio
        )
        return decision
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/chat")
async def chat(request: ChatRequest):
    """
    Endpoint xử lý trò chuyện đồng cảm và thông minh của AI.
    """
    try:
        reply = await ai_service.generate_chat_response(
            message=request.message,
            history=request.history,
            bio=request.bio
        )
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/chat/audio")
async def chat_audio(
    file: UploadFile = File(...),
    history: str = Form("[]"),
    bio: str = Form("{}"),
    isCallMode: bool = Form(False)
):
    """
    Endpoint xử lý trò chuyện bằng âm thanh (Native Audio).
    """
    import json
    try:
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

@app.post("/api/ai/analyze-test")
async def analyze_test(request: TestAnalysisRequest):
    """
    Endpoint phân tích kết quả các bài kiểm tra trắc nghiệm tâm lý.
    """
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
async def analyze_report(
    file: UploadFile = File(...)
):
    """
    Endpoint OCR bệnh án và trích xuất dữ liệu tự động từ hình ảnh / PDF.
    """
    # Kiểm tra loại file
    content_type = file.content_type
    if not content_type or (not content_type.startswith("image/") and content_type != "application/pdf"):
        raise HTTPException(
            status_code=400, 
            detail="Định dạng file không hợp lệ! Vui lòng gửi ảnh (PNG, JPG) hoặc file PDF bệnh án."
        )

    try:
        # Đọc dữ liệu bytes từ file upload
        file_bytes = await file.read()
        
        # Gọi Gemini Vision OCR
        extracted_data = await ai_service.analyze_medical_image_or_pdf(
            file_bytes=file_bytes,
            mime_type=content_type
        )
        return extracted_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý file bệnh án: {str(e)}")

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    # Mặc định lắng nghe ở cổng 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
