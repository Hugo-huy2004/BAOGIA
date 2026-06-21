import os
import json
# pyrefly: ignore [missing-import]
import httpx
from datetime import datetime

# pyrefly: ignore [missing-import]
from google import genai
# pyrefly: ignore [missing-import]
from google.genai import types
from typing import AsyncGenerator
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

# Tải biến môi trường
load_dotenv()

# Định nghĩa hệ thống các liệu pháp tự chữa lành của hệ thống (System Grounding)
SYSTEM_THERAPIES_CONTEXT = """
Hệ thống của chúng ta có 4 liệu pháp hỗ trợ sức khỏe tinh thần sau:
1. "Điều hòa nhịp thở 4-7-8" (BreathingTherapy): Liệu pháp hít thở giúp làm dịu hệ thần kinh lập tức. Phù hợp nhất cho người bị Lo âu (Anxiety), Căng thẳng (Stress), mất ngủ (Insomnia), hoặc cơn hoảng loạn (Panic).
2. "Ngồi Tĩnh Tâm" (MeditationTherapy): Thiền định chánh niệm giúp ổn định sóng não và giảm suy nghĩ dồn dập. Phù hợp nhất cho người bị Trầm cảm nhẹ (Depression), Căng thẳng, suy nhược tâm thần, hưng cảm nhẹ (Hypomania/Ma), hoặc lo âu ám ảnh.
3. "Trị liệu Trầm cảm (CBT)" (DepressionCbtTherapy): Liệu pháp nhận thức - hành vi giúp tái cấu trúc các suy nghĩ tiêu cực, tự trách, tự ti. Phù hợp nhất cho người có các chỉ số Trầm cảm (Depression) từ nhẹ, vừa đến nặng hoặc có xu hướng tự ti.
4. "Đọc sách Trị liệu" (ReadingTherapy): Đọc sách chiêm nghiệm giúp tăng hiểu biết bản thân và tìm kiếm sự bình yên tĩnh lặng. Phù hợp nhất cho người có tính Hướng nội cao (Introversion / Si cao), hoặc chỉ số sức khỏe tinh thần đang ở mức ổn định nhưng muốn phát triển bản thân.
"""

SYSTEM_PSYCHOLOGY_CONTEXT = """
QUY CHUẨN TÂM LÝ HỌC LÂM SÀNG & CÁC LIỆU PHÁP CHUẨN MỰC BẮT BUỘC SỬ DỤNG:
1. Liệu pháp Nhận thức - Hành vi (CBT): Nhận diện các "biến dạng nhận thức" (ví dụ: tư duy trắng đen, thảm họa hóa) và giúp tái cấu trúc suy nghĩ. Áp dụng cho Trầm cảm và Lo âu.
2. Liệu pháp Chấp nhận và Cam kết (ACT): Khuyến khích sự chấp nhận cảm xúc tiêu cực thay vì né tránh, tập trung vào các hành động dựa trên giá trị cốt lõi. Áp dụng cho rối loạn ám ảnh cưỡng chế (OCD), lo âu mãn tính và căng thẳng.
3. Liệu pháp Hành vi Biện chứng (DBT): Tập trung vào kỹ năng chịu đựng sự đau khổ (Distress Tolerance) và điều hòa cảm xúc (Emotion Regulation). Áp dụng cho xung động, giận dữ, cảm xúc chao đảo và các rối loạn nhân cách ranh giới.
4. Chánh niệm (Mindfulness) & Trị liệu Thân - Tâm (Somatic Experiencing): Kết nối với cảm giác cơ thể hiện tại để ngắt luồng suy nghĩ quá mức (overthinking). Áp dụng cho sang chấn tâm lý, mất kết nối bản thân hoặc hoảng loạn cục bộ.
5. Tham vấn Trọng tâm Giải pháp (SFBT): Hướng tới những điểm mạnh của cá nhân và thiết lập các bước nhỏ để đạt được sự ổn định.
-> BẠN PHẢI sử dụng ngôn từ chuyên môn tâm lý học chính xác (nhưng dễ hiểu) và lồng ghép ít nhất một nguyên lý từ các liệu pháp này khi đánh giá tình trạng.
"""

SYSTEM_TESTS_CONTEXT = """
Hệ thống cung cấp các bài kiểm tra tâm lý (Test) giúp đánh giá tình trạng sức khỏe tinh thần:
1. DASS-21 / DASS-42: Đánh giá tổng quan 3 yếu tố Trầm cảm (Depression), Lo âu (Anxiety) và Căng thẳng (Stress).
2. MMPI (MMPI-2, MMPI-30): Bài kiểm tra chuyên sâu về các rối loạn tâm lý lâm sàng (Nghi bệnh, Trầm cảm, Hysteria, v.v.).
3. PHQ-9: Đánh giá chuyên sâu về mức độ Trầm cảm.
4. GAD-7: Đánh giá chuyên sâu về mức độ Lo âu.

QUAN TRỌNG: Khi người dùng chủ động yêu cầu "làm bài test", "kiểm tra tâm lý", bạn KHÔNG ĐƯỢC tự ý kết luận hay đưa ra link/test ngay. Bạn PHẢI:
- Hỏi thăm nhẹ nhàng về các triệu chứng và tình trạng hiện tại của họ (ví dụ: dạo này có mệt mỏi, khó ngủ, hay hay lo lắng điều gì không?).
- Dựa vào những chia sẻ đó, hãy CHỈ ĐÍCH DANH và ĐỀ XUẤT một bài test cụ thể trong danh sách trên phù hợp nhất, sau đó hướng dẫn họ tìm đến phần "Bài Test" trên hệ thống để thực hiện.
"""

class GeminiService:
    def __init__(self):
        # Cập nhật sang gemini-2.5-flash
        self.model_name = "gemini-2.5-flash"

        # Tải danh sách API Keys
        self.api_keys = []
        keys_str = os.getenv("GEMINI_API_KEYS")
        if keys_str:
            self.api_keys.extend([k.strip() for k in keys_str.split(",") if k.strip()])

        single_key = os.getenv("GEMINI_API_KEY")
        if single_key and single_key not in self.api_keys:
            self.api_keys.append(single_key)

        for key, value in os.environ.items():
            if key.startswith("GEMINI_API_KEY_") and value.strip() not in self.api_keys:
                self.api_keys.append(value.strip())

        self.current_key_index = 0
        self.client = None

        if self.api_keys:
            self.client = genai.Client(api_key=self.api_keys[self.current_key_index])
            print(f"Đã tải {len(self.api_keys)} Gemini API Keys để dự phòng (Fallback).")
        else:
            print("⚠️ CẢNH BÁO: Chưa cấu hình GEMINI_API_KEY nào trong file .env!")

    def _get_next_client(self):
        if not self.api_keys:
            return None
        self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
        new_key = self.api_keys[self.current_key_index]
        print(f"🔄 [Cảnh báo] Quota exceeded. Đang xoay vòng chuyển sang API Key thứ {self.current_key_index + 1}/{len(self.api_keys)}...")
        self.client = genai.Client(api_key=new_key)
        return self.client

    def _ensure_client(self):
        if not self.client and self.api_keys:
            self.client = genai.Client(api_key=self.api_keys[self.current_key_index])
        return self.client

    def _extract_name_and_age(self, bio: dict) -> tuple:
        """
        Trích xuất tên hiển thị và ngữ cảnh tuổi từ bio.
        Trả về (name, age_context, missing_fields).
        """
        name = "cậu"
        age_context = "học sinh/sinh viên"
        missing_fields = []

        if not bio:
            return name, age_context, missing_fields

        if bio.get("displayName"):
            name_parts = bio["displayName"].split(" ")
            name = name_parts[-1] if name_parts else bio["displayName"]
        elif bio.get("name"):
            name_parts = bio["name"].split(" ")
            name = name_parts[-1] if name_parts else bio["name"]

        if bio.get("age"):
            age_context = f"người dùng {bio['age']} tuổi"
        elif bio.get("dob") or bio.get("birthday"):
            try:
                dob = bio.get("dob") or bio.get("birthday")
                birth_year = int(str(dob)[:4]) if "-" in str(dob) else int(str(dob)[-4:])
                current_year = datetime.now().year
                age = current_year - birth_year
                age_context = f"người dùng {age} tuổi"
            except Exception:
                pass

        if not bio.get("phone"):
            missing_fields.append("Số điện thoại")
        if not bio.get("address"):
            missing_fields.append("Địa chỉ")
        if not (bio.get("dob") or bio.get("birthday") or bio.get("age")):
            missing_fields.append("Ngày sinh")

        return name, age_context, missing_fields

    def _build_user_context(self, bio: dict) -> str:
        """
        Xây dựng chuỗi ngữ cảnh phong phú từ hồ sơ người dùng để cá nhân hóa AI.
        Bao gồm: tên, tuổi, cấp học, lịch sử tâm trạng, điểm test, liệu pháp đang dùng.
        """
        if not bio:
            return "Người dùng chưa cung cấp hồ sơ."

        parts = []

        # Tên và tuổi
        name_parts = (bio.get("displayName") or bio.get("name") or "").split(" ")
        parts.append(f"Tên: {bio.get('displayName') or bio.get('name') or 'Chưa cung cấp'}")

        if bio.get("age"):
            parts.append(f"Tuổi: {bio['age']}")
        elif bio.get("dob") or bio.get("birthday"):
            try:
                dob = bio.get("dob") or bio.get("birthday")
                birth_year = int(str(dob)[:4]) if "-" in str(dob) else int(str(dob)[-4:])
                age = datetime.now().year - birth_year
                parts.append(f"Tuổi: {age}")
            except Exception:
                pass

        # Cấp học từ email
        email = bio.get("email", "")
        if email:
            domain = email.split("@")[-1].lower() if "@" in email else ""
            if any(x in domain for x in ["edu.vn", "hcmus", "hust", "uet", "hanu", "ftu", "neu"]):
                parts.append("Cấp học: Sinh viên đại học")
            elif any(x in domain for x in ["thpt", "thcs", "k12"]):
                parts.append("Cấp học: Học sinh THPT/THCS")
            else:
                parts.append("Cấp học: Sinh viên/Học sinh (email edu)")

        # Lịch sử tâm trạng gần đây
        if bio.get("recentMoodHistory"):
            parts.append(f"Lịch sử tâm trạng gần đây: {bio['recentMoodHistory']}")

        # Điểm test gần nhất theo loại
        if bio.get("testScores"):
            scores_summary = []
            for test_type, score_data in bio["testScores"].items():
                if isinstance(score_data, dict):
                    scores_summary.append(f"{test_type.upper()}: {json.dumps(score_data)}")
                else:
                    scores_summary.append(f"{test_type.upper()}: {score_data}")
            if scores_summary:
                parts.append(f"Điểm test gần nhất: {', '.join(scores_summary)}")

        # Liệu pháp đang hoạt động
        if bio.get("activeTherapy"):
            parts.append(f"Liệu pháp đang dùng: {bio['activeTherapy']}")

        # IoT wellness score
        if bio.get("iotWellnessScore") is not None:
            parts.append(f"Điểm sức khỏe IoT: {bio['iotWellnessScore']}/100")

        return "\n".join(parts) if parts else "Thông tin hồ sơ còn hạn chế."

    def _build_wellness_system_instruction(self, bio: dict, mode: str = 'chat') -> str:
        """
        Xây dựng system instruction cho Người bạn đồng hành sức khỏe tâm lý (Bạn Học Đường).
        Được dùng chung cho generate_chat_response và generate_chat_response_stream.
        mode: 'chat' | 'audio'
        """
        name, age_context, missing_fields = self._extract_name_and_age(bio)

        audio_note = ""
        if mode == 'audio':
            audio_note = "\n        - Bạn đang giao tiếp qua GIỌNG NÓI. Phản hồi ngắn gọn, tự nhiên như đang nói chuyện thật. Tối đa 2-3 câu."

        return f"""
        Bạn là "Hugo Studio AI" - người bạn đồng hành sức khỏe tâm lý học đường, được tạo ra đặc biệt để hỗ trợ học sinh và sinh viên Việt Nam.

        Tính cách: Ấm áp, đồng cảm, thấu hiểu như một người bạn thân, nhưng có kiến thức chuyên môn tâm lý học đường.

        Nhiệm vụ chính:
        1. Lắng nghe và thấu hiểu cảm xúc của người dùng mà không phán xét
        2. Nhận diện các dấu hiệu lo âu, stress, trầm cảm qua cuộc trò chuyện
        3. Gợi ý làm các bài test phù hợp khi cần thiết (PHQ-9, GAD-7, DASS-21, WHO-5)
        4. Đề xuất các liệu pháp tự chữa lành có trong hệ thống
        5. Động viên, cổ vũ khi người dùng đang cố gắng

        Nguyên tắc:
        - Xưng "tớ", gọi người dùng là "{name}" hoặc "cậu"
        - KHÔNG đưa ra chẩn đoán y tế chính thức
        - LUÔN khuyến khích tìm kiếm hỗ trợ chuyên nghiệp khi triệu chứng nghiêm trọng
        - Phát hiện ngôn ngữ tự động, phản hồi bằng ngôn ngữ đó
        - Cá nhân hóa dựa trên hồ sơ người dùng ({age_context}){audio_note}

        Hệ thống bài test:
        {SYSTEM_TESTS_CONTEXT}

        Hệ thống liệu pháp:
        {SYSTEM_THERAPIES_CONTEXT}

        {SYSTEM_PSYCHOLOGY_CONTEXT}

        THU THẬP HỒ SƠ:
        Hiện tại hồ sơ của {name} đang thiếu các thông tin sau: {', '.join(missing_fields) if missing_fields else 'Không thiếu'}.
        Nếu có thông tin thiếu, trong quá trình trò chuyện tự nhiên, thỉnh thoảng hãy khéo léo hỏi thăm để bổ sung hồ sơ (KHÔNG hỏi dồn dập nhiều thông tin cùng lúc, chỉ hỏi 1 thông tin lúc thích hợp).
        NẾU người dùng cung cấp thông tin mới (ví dụ SĐT, ngày sinh, địa chỉ), hãy chèn thêm một dòng ở cuối câu trả lời theo đúng định dạng sau:
        [UPDATE_PROFILE: {{"phone": "số điện thoại", "dob": "ngày sinh", "address": "địa chỉ"}}]
        (Chỉ chèn các trường vừa được cung cấp).
        """

    async def generate_chat_response(self, message: str, history: list = None, bio: dict = None) -> str:
        """
        Trò chuyện đồng hành cùng học sinh và sinh viên.
        Tự động nhận diện ngôn ngữ và phản hồi bằng chính ngôn ngữ đó (Async).
        """
        name, _, _ = self._extract_name_and_age(bio)
        system_instruction = self._build_wellness_system_instruction(bio, mode='chat')

        client = self._ensure_client()
        if not client:
            return f"Chào {name}! Hiện tại server chưa được cấu hình GEMINI_API_KEY. Tớ rất muốn tâm sự với cậu, cậu hãy nhắc admin cấu hình API Key nhé!"

        # Chuyển đổi lịch sử trò chuyện sang định nghĩa của Gemini
        contents = []
        if history:
            for h in history:
                role = "user" if h.get("sender") == "user" or h.get("role") == "user" else "model"
                text = h.get("text") or h.get("content") or ""
                if text:
                    contents.append(types.Content(role=role, parts=[types.Part.from_text(text=text)]))

        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=message)]))

        max_retries = max(1, len(self.api_keys) if hasattr(self, 'api_keys') else 1)
        for attempt in range(max_retries):
            try:
                response = await client.aio.models.generate_content(
                    model=self.model_name,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction
                    )
                )
                return response.text
            except Exception as e:
                err_str = str(e)
                is_retryable = any(x in err_str.upper() for x in ["429", "RESOURCE_EXHAUSTED", "QUOTA", "503", "UNAVAILABLE", "500", "INTERNAL"])
                if is_retryable and attempt < max_retries - 1:
                    client = self._get_next_client()
                    continue
                print(f"Lỗi gọi Gemini API (generate_chat_response): {err_str}")
                
                # OpenRouter fallback
                openrouter_key = os.getenv("OPENROUTER_API_KEY", "")
                if openrouter_key:
                    print("🔄 Gemini failed. Falling back to OpenRouter...")
                    messages = [{"role": "system", "content": system_instruction}]
                    if history:
                        for h in history:
                            role = "user" if h.get("sender") == "user" or h.get("role") == "user" else "assistant"
                            text = h.get("text") or h.get("content") or ""
                            if text:
                                messages.append({"role": role, "content": text})
                    messages.append({"role": "user", "content": message})
                    
                    openrouter_reply = await self._call_openrouter(messages)
                    if openrouter_reply:
                        return openrouter_reply

                return "Tớ rất tiếc, máy chủ AI đang bị quá tải hoặc đạt giới hạn truy cập. Cậu đợi vài phút rồi nhắn lại cho tớ nha."
        
        # OpenRouter fallback if loop finished without success
        openrouter_key = os.getenv("OPENROUTER_API_KEY", "")
        if openrouter_key:
            print("🔄 Gemini keys loop ended. Falling back to OpenRouter...")
            messages = [{"role": "system", "content": system_instruction}]
            if history:
                for h in history:
                    role = "user" if h.get("sender") == "user" or h.get("role") == "user" else "assistant"
                    text = h.get("text") or h.get("content") or ""
                    if text:
                        messages.append({"role": role, "content": text})
            messages.append({"role": "user", "content": message})
            
            openrouter_reply = await self._call_openrouter(messages)
            if openrouter_reply:
                return openrouter_reply

        return "Tớ đang không thể kết nối đến máy chủ AI do sự cố mạng hoặc hạn mức. Cậu thử lại sau nha."


    async def generate_chat_response_stream(self, message: str, history: list = None, bio: dict = None) -> AsyncGenerator[str, None]:
        """
        Tạo phản hồi chat dưới dạng stream (Generator).
        """
        name, _, _ = self._extract_name_and_age(bio)
        system_instruction = self._build_wellness_system_instruction(bio, mode='chat')

        client = self._ensure_client()
        if not client:
            yield f"data: Chào {name}! Hiện tại server chưa được cấu hình GEMINI_API_KEY. Tớ rất muốn tâm sự với cậu, cậu hãy nhắc admin cấu hình API Key nhé!\n\n"
            return

        contents = []
        if history:
            for h in history:
                role = "user" if h.get("sender") == "user" or h.get("role") == "user" else "model"
                text = h.get("text") or h.get("content") or ""
                if text:
                    contents.append(types.Content(role=role, parts=[types.Part.from_text(text=text)]))

        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=message)]))

        max_retries = max(1, len(self.api_keys) if hasattr(self, 'api_keys') else 1)
        for attempt in range(max_retries):
            try:
                response_stream = await client.aio.models.generate_content_stream(
                    model=self.model_name,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction
                    )
                )
                async for chunk in response_stream:
                    if chunk.text:
                        yield f"data: {json.dumps({'text': chunk.text}, ensure_ascii=False)}\n\n"
                return
            except Exception as e:
                err_str = str(e)
                is_retryable = any(x in err_str.upper() for x in ["429", "RESOURCE_EXHAUSTED", "QUOTA", "503", "UNAVAILABLE", "500", "INTERNAL"])
                if is_retryable and attempt < max_retries - 1:
                    client = self._get_next_client()
                    continue
                print(f"Lỗi gọi Gemini API stream: {err_str}")
                
                # OpenRouter fallback
                openrouter_key = os.getenv("OPENROUTER_API_KEY", "")
                if openrouter_key:
                    print("🔄 Gemini stream failed. Falling back to OpenRouter stream...")
                    messages = [{"role": "system", "content": system_instruction}]
                    if history:
                        for h in history:
                            role = "user" if h.get("sender") == "user" or h.get("role") == "user" else "assistant"
                            text = h.get("text") or h.get("content") or ""
                            if text:
                                messages.append({"role": role, "content": text})
                    messages.append({"role": "user", "content": message})
                    
                    async for chunk in self._call_openrouter_stream(messages):
                        yield chunk
                    return

                yield f"data: {json.dumps({'error': 'Tớ rất tiếc, máy chủ AI đang bị quá tải hoặc đạt giới hạn truy cập. Cậu đợi vài phút rồi nhắn lại cho tớ nha.'}, ensure_ascii=False)}\n\n"
                import asyncio
                await asyncio.sleep(0.1)
                return
        
        # OpenRouter fallback if loop finished without success
        openrouter_key = os.getenv("OPENROUTER_API_KEY", "")
        if openrouter_key:
            print("🔄 Gemini stream keys loop ended. Falling back to OpenRouter stream...")
            messages = [{"role": "system", "content": system_instruction}]
            if history:
                for h in history:
                    role = "user" if h.get("sender") == "user" or h.get("role") == "user" else "assistant"
                    text = h.get("text") or h.get("content") or ""
                    if text:
                        messages.append({"role": role, "content": text})
            messages.append({"role": "user", "content": message})
            
            async for chunk in self._call_openrouter_stream(messages):
                yield chunk
            return

        yield f"data: {json.dumps({'error': 'Tớ đang không thể kết nối đến máy chủ AI. Cậu thử lại sau nha.'}, ensure_ascii=False)}\n\n"
        import asyncio
        await asyncio.sleep(0.1)


    async def analyze_test_results(self, test_name: str, scores: dict = None, validity: dict = None, clinical: list = None, lang_detected: str = "vi", bio: dict = None) -> str:
        """
        Phân tích kết quả trắc nghiệm tâm lý (Async).
        """
        age_context = "học sinh/sinh viên"
        if bio:
            if bio.get("age"):
                age_context = f"người dùng {bio['age']} tuổi"
            elif bio.get("dob") or bio.get("birthday"):
                try:
                    dob = bio.get("dob") or bio.get("birthday")
                    birth_year = int(str(dob)[:4]) if "-" in str(dob) else int(str(dob)[-4:])
                    current_year = datetime.now().year
                    age = current_year - birth_year
                    age_context = f"người dùng {age} tuổi"
                except Exception:
                    pass

        if test_name == "general_medical":
            system_instruction = f"""
            Bạn là "Hugo Studio AI" chuyên gia y tế lâm sàng.
            Bạn đang phân tích kết quả xét nghiệm máu/tổng quát cho {age_context}. Hãy phân tích các chỉ số một cách dễ hiểu, đồng cảm, chuyên nghiệp nhưng thân thiện.

            Yêu cầu:
            1. Nhận diện ngôn ngữ từ biến `lang_detected`.
            2. Tóm tắt kết quả một cách trực quan, khoa học. Chỉ ra những chỉ số nào bất thường (tăng/giảm). KHÔNG phân tích dông dài. Đi thẳng vào vấn đề chính.
            3. Đề xuất TỐI ĐA 2 lời khuyên sinh hoạt/dinh dưỡng phù hợp. Tôn trọng người dùng, dùng xưng hô "tớ" và "cậu".
            """
        else:
            system_instruction = f"""
            Bạn là "Hugo Studio AI" chuyên gia phân tích tâm lý lâm sàng học đường.
            Bạn đang phân tích kết quả bài test tâm lý cho {age_context}. Hãy dùng văn phong, ví dụ và ngôn ngữ thực sự PHÙ HỢP VỚI ĐỘ TUỔI NÀY.
            Phân tích kết quả một cách trực quan, khoa học, dễ hiểu, đồng cảm và đưa ra giải pháp rõ ràng dựa trên các liệu pháp của hệ thống.

            Yêu cầu:
            1. Nhận diện ngôn ngữ từ biến `lang_detected` để viết phân tích bằng chính ngôn ngữ đó (ví dụ: Tiếng Việt, Tiếng Anh, v.v.).
            2. Dựa vào điểm số đầu vào, hãy đánh giá TRỌNG TÂM, NGẮN GỌN (tối đa 2-3 đoạn ngắn), KHÔNG lặp lại điểm số quá nhiều lần, KHÔNG phân tích dông dài. Đi thẳng vào vấn đề chính.
            3. Đề xuất TỐI ĐA 2 liệu pháp tự chữa lành có sẵn của hệ thống phù hợp nhất. Giải thích ngắn gọn trong 1 câu vì sao liệu pháp đó phù hợp. Tôn trọng người dùng, dùng xưng hô "tớ" và "cậu".

            Hệ thống liệu pháp hỗ trợ:
            {SYSTEM_THERAPIES_CONTEXT}

            {SYSTEM_PSYCHOLOGY_CONTEXT}
            """

        client = self._ensure_client()
        if not client:
            return f"Đã có kết quả bài test {test_name.upper()} của bạn. Điểm số: {json.dumps(scores)}. Vui lòng cấu hình GEMINI_API_KEY để Hugo Studio AI đưa ra phân tích chi tiết!"

        prompt = f"""
        Hãy phân tích kết quả bài test sau:
        - Tên bài test: {test_name}
        - Điểm số thô / Chi tiết: {json.dumps(scores)}
        """
        if validity:
            prompt += f"\n- Thang đo kiểm định độ tin cậy (L-F-K): {json.dumps(validity)}"
        if clinical:
            prompt += f"\n- Các thang đo lâm sàng chi tiết: {json.dumps(clinical)}"

        prompt += f"\nNgôn ngữ đầu ra ưu tiên: {lang_detected}"

        max_retries = max(1, len(self.api_keys) if hasattr(self, 'api_keys') else 1)
        for attempt in range(max_retries):
            try:
                response = await client.aio.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction
                    )
                )
                return response.text
            except Exception as e:
                err_str = str(e)
                is_retryable = any(x in err_str.upper() for x in ["429", "RESOURCE_EXHAUSTED", "QUOTA", "503", "UNAVAILABLE", "500", "INTERNAL"])
                if is_retryable and attempt < max_retries - 1:
                    client = self._get_next_client()
                    continue
                print(f"Lỗi gọi Gemini API (analyze_test_results): {err_str}")
                return None
        return None

    async def analyze_medical_image_or_pdf(self, file_bytes: bytes, mime_type: str) -> dict:
        """
        OCR và phân tích đa phương thức hình ảnh / PDF báo cáo sức khỏe lâm sàng (Async).
        Sử dụng cấu trúc đầu ra JSON để trả về các chỉ số chính xác cho frontend.
        """
        system_instruction = """
        Bạn là hệ thống trích xuất dữ liệu bệnh án thông minh của Hugo Studio.
        Bạn có nhiệm vụ đọc hình ảnh/PDF của một phiếu kết quả xét nghiệm tâm lý (DASS-21, DASS-42, MMPI-30, MMPI-2, PHQ-9, GAD-7) HOẶC phiếu xét nghiệm máu tổng quát (Sinh hóa, Huyết học, Nước tiểu) và trích xuất ra JSON.

        Quy trình trích xuất:
        1. Xác định loại bài trắc nghiệm: "dass", "mmpi", hoặc "general_medical" (xét nghiệm máu sinh hóa/huyết học).
        2. Nếu là DASS:
           - Trích xuất điểm số của 3 thang đo: Depression (Trầm cảm - D), Anxiety (Lo âu - A), Stress (Căng thẳng - S).
           - Nếu tài liệu chỉ ghi DASS-21, nhân đôi điểm số để có thang điểm DASS-42.
        3. Nếu là MMPI:
           - Trích xuất L (Lie), F (Infrequency), K (Correction) và 10 thang đo lâm sàng.
        4. Nếu là GENERAL_MEDICAL (Xét nghiệm máu, sinh hóa, nước tiểu...):
           - Trích xuất tất cả các chỉ số có trong ảnh. Với mỗi chỉ số, thu thập các trường: "name" (tên chỉ số), "value" (kết quả đo được), "unit" (đơn vị), "reference" (khoảng tham chiếu), "status" (đánh giá: "high", "low", "normal").
           - Ví dụ status: nếu value lớn hơn reference -> "high", nhỏ hơn -> "low", trong khoảng -> "normal".
        5. Trả về đối tượng JSON duy nhất theo định dạng dưới đây. KHÔNG trả kèm bất kỳ văn bản giải thích nào ngoài JSON.

        Định dạng JSON yêu cầu:
        {
          "testType": "dass" hoặc "mmpi" hoặc "general_medical",
          "scores": { "D": 15, "A": 10, "S": 12 }, // (chỉ dành cho dass)
          "validity": { "L": 50, "F": 65, "K": 45 }, // (chỉ dành cho mmpi)
          "clinical": { "Hs": 60, "D": 70, "Hy": 55, "Pd": 62, "Mf": 50, "Pa": 68, "Pt": 72, "Sc": 64, "Ma": 58, "Si": 52 }, // (chỉ dành cho mmpi)
          "general_indices": [
             { "name": "Glucose", "value": "5.6", "unit": "mmol/L", "reference": "3.9 - 6.1", "status": "normal" },
             { "name": "WBC", "value": "12.5", "unit": "G/L", "reference": "4.0 - 10.0", "status": "high" }
          ] // (chỉ dành cho general_medical)
        }
        """

        client = self._ensure_client()
        if not client:
            # Mock data fallback
            return {
                "testType": "dass",
                "scores": {"D": 18, "A": 12, "S": 16}
            }

        image_part = types.Part.from_bytes(
            data=file_bytes,
            mime_type=mime_type
        )

        max_retries = max(1, len(self.api_keys) if hasattr(self, 'api_keys') else 1)
        for attempt in range(max_retries):
            try:
                response = await client.aio.models.generate_content(
                    model=self.model_name,
                    contents=[image_part, "Trích xuất thông tin bệnh án này sang dạng JSON."],
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_mime_type="application/json"
                    )
                )

                result_json = json.loads(response.text)
                return result_json
            except Exception as e:
                err_str = str(e)
                is_retryable = any(x in err_str.upper() for x in ["429", "RESOURCE_EXHAUSTED", "QUOTA", "503", "UNAVAILABLE", "500", "INTERNAL"])
                if is_retryable and attempt < max_retries - 1:
                    client = self._get_next_client()
                    continue
                print(f"Lỗi OCR bệnh án bằng Gemini: {err_str}")
                return {
                    "testType": "dass",
                    "scores": {"D": 14, "A": 10, "S": 14},
                    "error": err_str
                }

        return {
            "testType": "dass",
            "scores": {"D": 14, "A": 10, "S": 14},
            "error": "Tất cả API Key đã bị quá tải (429)."
        }

    async def generate_proactive_push(self, logs: list, bio: dict = None) -> dict:
        """
        Phân tích lịch sử hoạt động để gửi push notification chủ động hoặc thực hiện phân tích admin.
        """
        client = self._ensure_client()
        if not client:
            return {"should_send": False, "reason": "No API Key"}

        # Check if this is an admin request
        is_admin_system = any(isinstance(log, dict) and log.get("type") == "admin_system_analysis" for log in logs)
        is_admin_user = any(isinstance(log, dict) and log.get("type") == "admin_user_profile_analysis" for log in logs)
        is_admin_dashboard = any(isinstance(log, dict) and log.get("type") == "admin_dashboard_analysis" for log in logs)
        is_system_report = any(isinstance(log, dict) and log.get("type") == "system_report" for log in logs)

        if is_admin_system:
            system_instruction = """
            Bạn là một chuyên gia phân tích hệ thống và trợ lý AI của quản trị viên (Admin).
            Nhiệm vụ: Phân tích số liệu thống kê hệ thống (tổng số người dùng, số người dùng hoạt động, chờ duyệt, bị khóa) và dữ liệu chi tiết của cộng đồng người dùng (trong logs.systemMetadata) theo yêu cầu phân tích cụ thể của Admin (user_health, risk, growth, recommendations).
            Yêu cầu: Hãy bám sát các số liệu thực tế được cung cấp trong logs[0].systemMetadata để đưa ra đánh giá trực quan, tập trung vào đánh giá chính xác và số liệu thống kê. Không giải thích mơ hồ dông dài.

            Trả về JSON CHÍNH XÁC theo format sau:
            {
                "should_send": true,
                "title": "Tiêu đề phân tích ngắn gọn, trực quan",
                "status": "success | warning | destructive | info",
                "score": 90, // Điểm số đánh giá từ 0-100 (ví dụ: Sức khỏe người dùng, Chỉ số rủi ro, Tốc độ tăng trưởng, Mức độ khẩn cấp khuyến nghị)
                "scoreLabel": "Tên chỉ số (ví dụ: Sức khoẻ cộng đồng, Chỉ số rủi ro, Tỷ lệ sinh viên .EDU, Mức độ ưu tiên)",
                "summary": "Tóm tắt ngắn gọn nhất tình trạng hệ thống trong 1 câu (dưới 25 từ)",
                "metrics": [
                    {"label": "Tên chỉ số chi tiết", "value": "Số liệu chính xác (ví dụ: 75% .EDU, 2 tài khoản, 12 học sinh)", "status": "normal | warning | urgent"}
                ],
                "bullets": [
                    "Phát hiện hoặc thống kê chính xác số 1 rút ra từ dữ liệu (ví dụ: 3/10 người dùng mới đến từ THPT Trần Hưng Đạo)",
                    "Phân tích chính xác số 2 rút ra từ dữ liệu"
                ],
                "recommendations": [
                    "Đề xuất hành động cụ thể, thực thi ngay được (dưới 15 từ)",
                    "Đề xuất hành động 2"
                ],
                "reason": "Hoàn thành phân tích hệ thống."
            }
            """
        elif is_admin_user:
            system_instruction = """
            Bạn là chuyên gia phân tích hồ sơ và trợ lý AI của quản trị viên (Admin).
            Nhiệm vụ: Phân tích thông tin hồ sơ của người dùng (email, họ tên, trạng thái tài khoản, ngày đăng ký, ngày hết hạn, số lượng gói cước). Đưa ra đánh giá về tình trạng hoạt động và các gợi ý hành động/chăm sóc phù hợp cho admin.

            Trả về JSON CHÍNH XÁC theo format:
            {
                "should_send": true,
                "title": "Phân Tích Hồ Sơ Người Dùng",
                "body": "Đánh giá chi tiết về hồ sơ người dùng và đề xuất hành động cho admin (2-3 câu ngắn gọn)",
                "reason": "Hoàn thành phân tích hồ sơ."
            }
            """
        elif is_admin_dashboard:
            system_instruction = """
            Bạn là chuyên gia tư vấn chiến lược và phân tích hệ thống của quản trị viên (Admin).
            Nhiệm vụ: Phân tích báo cáo tổng quan Dashboard hệ thống (số lượng người dùng theo trạng thái, số lịch hẹn chưa xử lý, số ticket hỗ trợ chưa giải quyết). 
            Đưa ra nhận xét ngắn gọn và đề xuất hành động ưu tiên cần thực hiện ngay lập tức.

            Trả về JSON CHÍNH XÁC theo format:
            {
                "should_send": true,
                "title": "AI Dashboard Insight",
                "body": "Nhận xét tổng quan tình trạng hệ thống và các gợi ý hành động cụ thể, hữu ích (2-3 câu)",
                "reason": "Đã phân tích dashboard."
            }
            """
        elif is_system_report:
            system_instruction = """
            Bạn là chuyên gia phân tích báo cáo hệ thống.
            Nhiệm vụ: Phân tích báo cáo hệ thống (KPIs, số liệu người dùng, đối tác, lịch hẹn, tickets) và tạo ra báo cáo tóm tắt tình trạng vận hành hệ thống cùng các đề xuất cải tiến.

            Trả về JSON CHÍNH XÁC theo format:
            {
                "should_send": true,
                "title": "Báo Cáo Vận Hành Hệ Thống",
                "body": "Nội dung báo cáo chi tiết về tình trạng hoạt động và gợi ý định hướng phát triển (3-4 câu)",
                "reason": "Đã tạo báo cáo thành công."
            }
            """
        else:
            name = "bạn"
            if bio and bio.get("displayName"):
                name_parts = bio["displayName"].split(" ")
                name = name_parts[-1] if name_parts else bio["displayName"]

            system_instruction = f"""
            Bạn là một chuyên gia tâm lý và là người bạn đồng hành "Hugo Studio AI".
            Nhiệm vụ: Phân tích 15 hoạt động gần nhất của {name} để quyết định xem có cần gửi một tin nhắn Push Notification để hỏi thăm, cảnh báo hay động viên không.

            Bạn chỉ gửi thông báo khi:
            - Người dùng thức quá khuya (nhiều hoạt động sau 23h).
            - Người dùng có điểm test báo động (Trầm cảm, Lo âu cao).
            - Có xu hướng buồn rầu liên tục trong các checkin.
            - Hoặc để động viên nếu họ đang làm tốt.

            Trả về JSON CHÍNH XÁC theo format:
            {{
                "should_send": true / false,
                "title": "Tiêu đề ngắn gọn, thân thiện",
                "body": "Nội dung push notification (ngắn gọn, ấm áp 1-2 câu)",
                "reason": "Giải thích ngắn vì sao lại gửi"
            }}
            """

        prompt_text = f"Dữ liệu hoạt động:\n{json.dumps(logs, ensure_ascii=False, default=str)}\n\nHãy quyết định."

        max_retries = max(1, len(self.api_keys) if hasattr(self, 'api_keys') else 1)
        for attempt in range(max_retries):
            try:
                response = await client.aio.models.generate_content(
                    model=self.model_name,
                    contents=[prompt_text],
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_mime_type="application/json",
                        temperature=0.7
                    )
                )

                result_json = json.loads(response.text)
                return result_json
            except Exception as e:
                err_str = str(e)
                is_retryable = any(x in err_str.upper() for x in ["429", "RESOURCE_EXHAUSTED", "QUOTA", "503", "UNAVAILABLE", "500", "INTERNAL"])
                if is_retryable and attempt < max_retries - 1:
                    client = self._get_next_client()
                    continue
                print(f"Lỗi generate proactive push: {err_str}")
                return {"should_send": False, "reason": err_str}

        return {"should_send": False, "reason": "All keys failed"}

    async def analyze_sleep_health(self, sleep_logs: list, bio: dict = None) -> dict:
        """
        Phân tích chất lượng giấc ngủ theo khoa học.
        Dựa trên khuyến nghị NSF (National Sleep Foundation) và AASM.
        Trả về đánh giá, cảnh báo và khuyến nghị cá nhân hoá theo tuổi.
        """
        client = self._ensure_client()
        if not client:
            return {"error": "No API Key", "status": "unknown"}

        age = None
        name = "bạn"
        if bio:
            if bio.get("displayName"):
                name_parts = bio["displayName"].split(" ")
                name = name_parts[-1] if name_parts else bio["displayName"]
            if bio.get("age"):
                try:
                    age = int(bio["age"])
                except:
                    pass
            elif bio.get("birthYear"):
                try:
                    age = datetime.now().year - int(bio["birthYear"])
                except:
                    pass

        # Age-based NSF guidelines
        if age is None:
            age_group = "thanh niên"
            rec_min, rec_max = 7, 9
        elif age <= 12:
            age_group = "trẻ em (6-12 tuổi)"
            rec_min, rec_max = 9, 11
        elif age <= 17:
            age_group = "thanh thiếu niên (13-17 tuổi)"
            rec_min, rec_max = 8, 10
        elif age <= 25:
            age_group = "thanh niên (18-25 tuổi)"
            rec_min, rec_max = 7, 9
        elif age <= 64:
            age_group = "người trưởng thành (26-64 tuổi)"
            rec_min, rec_max = 7, 9
        else:
            age_group = "người cao tuổi (65+)"
            rec_min, rec_max = 7, 8

        system_instruction = f"""
Bạn là chuyên gia sức khoẻ giấc ngủ (Sleep Health Specialist) của Hugo Studio AI.
Nhiệm vụ: Phân tích dữ liệu giấc ngủ của {name} ({age_group if age else 'người dùng'}) và đưa ra đánh giá + khuyến nghị KHOA HỌC.

TIÊU CHUẨN KHOA HỌC (NSF/AASM):
- {age_group}: Nên ngủ {rec_min}-{rec_max} tiếng/đêm.
- Giờ đi ngủ lý tưởng: 21:30 - 23:00 (theo nhịp sinh học Circadian).
- Thức dậy lý tưởng: 5:30 - 7:30 (phù hợp cortisol awakening response).
- Ngủ < {rec_min}h: thiếu ngủ mãn tính → ảnh hưởng nhận thức, miễn dịch, tâm trạng.
- Ngủ > {rec_max}h thường xuyên: có thể là dấu hiệu trầm cảm hoặc rối loạn giấc ngủ.
- Độ trễ giấc ngủ (Sleep Latency) lý tưởng: 15-20 phút.
- Sleep Debt: tích lũy thiếu ngủ → cần được bù dần (không thể bù hết 1 lúc).

QUY TẮC:
- Đánh giá dựa trên DỮ LIỆU THỰC TẾ, không phỏng đoán.
- Chỉ ra RỦI RO nếu có (thiếu ngủ mãn tính, giờ ngủ quá muộn, biến động lớn).
- Khuyến nghị phải THỰC TẾ, cụ thể, có thể thực hiện được (không nói chung chung).
- Ngôn ngữ: thân thiện, khoa học, như người bạn đồng hành hiểu biết.

Trả về JSON CHÍNH XÁC:
{{
  "score": 0-100,
  "status": "excellent|good|fair|poor|critical",
  "avg_duration": số thực,
  "avg_quality": số thực,
  "bedtime_consistency": "consistent|inconsistent|irregular",
  "risk_flags": ["cờ cảnh báo 1", "..."],
  "strengths": ["điểm mạnh 1", "..."],
  "recommendations": ["khuyến nghị 1 (cụ thể)", "..."],
  "tonight_advice": "Lời khuyên cho tối nay (1-2 câu, cá nhân hoá)",
  "science_note": "1 sự thật khoa học thú vị về giấc ngủ liên quan đến tình trạng hiện tại"
}}
"""

        prompt_text = f"""
Dữ liệu giấc ngủ 30 ngày gần nhất của {name}:
{json.dumps(sleep_logs, ensure_ascii=False, default=str)}

Ngày phân tích: {datetime.now().strftime('%d/%m/%Y')}
Nhóm tuổi: {age_group}
Mức ngủ khuyến nghị: {rec_min}-{rec_max} tiếng

Phân tích và đưa ra đánh giá toàn diện.
"""

        max_retries = max(1, len(self.api_keys))
        for attempt in range(max_retries):
            try:
                response = await client.aio.models.generate_content(
                    model=self.model_name,
                    contents=[prompt_text],
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_mime_type="application/json",
                        temperature=0.4
                    )
                )
                return json.loads(response.text)
            except Exception as e:
                err_str = str(e)
                is_retry = any(x in err_str.upper() for x in ["429", "QUOTA", "503", "500", "UNAVAILABLE"])
                if is_retry and attempt < max_retries - 1:
                    client = self._get_next_client()
                    continue
                print(f"Lỗi analyze_sleep_health: {err_str}")
                return {"error": err_str, "status": "error"}

        return {"error": "All keys failed", "status": "error"}

    async def generate_smart_push(self, user_data: dict) -> dict:
        """
        Tạo nội dung Push Notification cá nhân hoá kiểu Duolingo.
        Dựa trên: sleep data, streak, mood, test scores, activity.
        """
        client = self._ensure_client()
        if not client:
            return {"should_send": False}

        bio  = user_data.get("bio", {})
        name_parts = (bio.get("displayName") or "bạn").split()
        name = name_parts[-1] if name_parts else "bạn"

        system_instruction = f"""
Bạn là trợ lý cá nhân hoá thông minh của Hugo Studio AI (như Duolingo nhưng cho sức khoẻ tâm lý).
Nhiệm vụ: Tạo 1 push notification ĐỘC ĐÁO, CÁ NHÂN HÓA hoàn toàn cho {name}.

PHONG CÁCH DUOLINGO:
- Ngắn gọn, vui vẻ nhưng tạo FOMO (fear of missing out).
- Dùng emoji phù hợp (1-2 cái).
- Tạo cảm giác cấp bách nhẹ nhàng (không gây lo lắng).
- Nhắc đến thành tích/streak nếu có → tạo động lực không muốn phá chuỗi.
- Cá nhân hoá theo tên, trạng thái, thời gian trong ngày.
- Xen kẽ nhiều loại: động viên, nhắc nhở, thông tin thú vị, thách thức nhỏ.

PHÂN LOẠI THÔNG BÁO (chọn 1 loại phù hợp nhất với dữ liệu):
1. sleep_reminder   - Nhắc giờ ngủ (buổi tối, dựa trên lịch sử giờ ngủ)
2. wake_cheer       - Chào buổi sáng + đánh giá giấc ngủ tối qua
3. streak_protect   - Bảo vệ chuỗi (nếu chưa check-in hôm nay)
4. milestone        - Chúc mừng mốc quan trọng (7/30/100 ngày)
5. wellness_nudge   - Gợi ý liệu pháp phù hợp với trạng thái hiện tại
6. sleep_insight    - Chia sẻ insight khoa học về giấc ngủ

Trả về JSON CHÍNH XÁC:
{{
  "should_send": true/false,
  "type": "loại thông báo",
  "title": "Tiêu đề (max 50 ký tự)",
  "body": "Nội dung (max 120 ký tự)",
  "url": "/member?tab=banhocduong",
  "scheduled_at": "HH:MM hoặc null nếu gửi ngay",
  "reason": "Lý do ngắn"
}}
"""

        prompt_text = f"""
Dữ liệu người dùng {name}:
{json.dumps(user_data, ensure_ascii=False, default=str)}

Thời điểm hiện tại: {datetime.now().strftime('%H:%M %d/%m/%Y')}

Tạo thông báo push cá nhân hoá phù hợp nhất.
"""

        max_retries = max(1, len(self.api_keys))
        for attempt in range(max_retries):
            try:
                response = await client.aio.models.generate_content(
                    model=self.model_name,
                    contents=[prompt_text],
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_mime_type="application/json",
                        temperature=0.85
                    )
                )
                return json.loads(response.text)
            except Exception as e:
                err_str = str(e)
                if any(x in err_str.upper() for x in ["429","QUOTA","503","500"]) and attempt < max_retries - 1:
                    client = self._get_next_client()
                    continue
                return {"should_send": False, "reason": err_str}

        return {"should_send": False, "reason": "All keys failed"}

    async def generate_audio_response(self, audio_bytes: bytes, mime_type: str, history: list = None, bio: dict = None, is_call_mode: bool = False) -> dict:
        """
        Nhận âm thanh từ người dùng, gửi cho Gemini để nhận lại Âm thanh Native (giọng nói) và Text.
        """
        import base64
        client = self._ensure_client()
        if not client:
            return {"text": "Chưa có cấu hình API Key.", "audio_base64": None}

        mode_instruction = ""
        if is_call_mode:
            mode_instruction = "- Bạn đang trong CUỘC GỌI TRỰC TIẾP (Phone Call) 1:1. Trả lời CỰC KỲ NGẮN GỌN (1-2 câu). Dùng ngôn ngữ nói tự nhiên, giống đang đàm thoại."
        else:
            mode_instruction = "- Phản hồi CHỈ NÊN DÀI TỪ 2-3 CÂU ĐƠN GIẢN (dưới 20 giây nói). KHÔNG liệt kê dài dòng."

        system_instruction = self._build_wellness_system_instruction(bio, mode='audio')
        system_instruction += f"\n        {mode_instruction}\n        - Tuyệt đối trả lời bằng Tiếng Việt trừ khi người dùng nói ngôn ngữ khác."

        # Chuyển đổi lịch sử trò chuyện sang định nghĩa của Gemini
        contents = []
        if history:
            for h in history:
                role = "user" if h.get("sender") == "user" or h.get("role") == "user" else "model"
                text = h.get("text") or h.get("content") or ""
                if text:
                    contents.append(types.Content(role=role, parts=[types.Part.from_text(text=text)]))

        # Thêm audio file của người dùng
        audio_part = types.Part.from_bytes(data=audio_bytes, mime_type=mime_type)
        contents.append(types.Content(role="user", parts=[audio_part]))

        max_retries = max(1, len(self.api_keys) if hasattr(self, 'api_keys') else 1)
        for attempt in range(max_retries):
            try:
                try:
                    response = await client.aio.models.generate_content(
                        model=self.model_name,
                        contents=contents,
                        config=types.GenerateContentConfig(
                            system_instruction=system_instruction,
                            response_modalities=["AUDIO"]
                        )
                    )
                except Exception as inner_e:
                    inner_err_str = str(inner_e)
                    if "400" in inner_err_str or "INVALID_ARGUMENT" in inner_err_str:
                        # Fallback to text-only if model doesn't support AUDIO modality
                        response = await client.aio.models.generate_content(
                            model=self.model_name,
                            contents=contents,
                            config=types.GenerateContentConfig(
                                system_instruction=system_instruction
                            )
                        )
                    else:
                        raise inner_e

                # Trích xuất dữ liệu âm thanh trả về từ inline_data (base64)
                audio_base64 = None
                text_response = ""

                if response.candidates and response.candidates[0].content and response.candidates[0].content.parts:
                    for part in response.candidates[0].content.parts:
                        if hasattr(part, 'text') and part.text:
                            text_response += part.text
                        elif hasattr(part, 'inline_data') and part.inline_data:
                            # Decode base64 bytes to base64 string
                            audio_base64 = base64.b64encode(part.inline_data.data).decode('utf-8')

                # Fallback text if model couldn't return text in audio modalities
                if not text_response:
                    text_response = response.text if hasattr(response, 'text') else "Tớ đã gửi cho cậu một tin nhắn thoại nhe."

                return {
                    "text": text_response,
                    "audio_base64": audio_base64
                }
            except Exception as e:
                err_str = str(e)
                is_retryable = any(x in err_str.upper() for x in ["429", "RESOURCE_EXHAUSTED", "QUOTA", "503", "UNAVAILABLE", "500", "INTERNAL"])
                if is_retryable and attempt < max_retries - 1:
                    client = self._get_next_client()
                    continue
                print(f"Lỗi Native Audio: {err_str}")
                return {"text": "Chào bạn! Chuyên viên AI đang có lịch bận, vui lòng gọi lại tớ sau vài phút.", "audio_base64": None, "is_error": True}
        return {"text": "Chào bạn! Chuyên viên AI đang có lịch bận, vui lòng gọi lại tớ sau vài phút.", "audio_base64": None, "is_error": True}

    async def analyze_iot_vitals(self, vitals_history: list, bio: dict = None) -> dict:
        """
        Phân tích dữ liệu sinh trắc học từ thiết bị IoT.
        vitals_history: list of {timestamp, heartRate, steps, sleepMinutes, bloodPressureSys, bloodPressureDia, oxygenSat}
        Returns: {insights: str, alerts: list, recommendations: list, wellnessScore: int}
        """
        name = "bạn"
        if bio and bio.get("displayName"):
            name_parts = bio["displayName"].split(" ")
            name = name_parts[-1] if name_parts else bio["displayName"]

        system_instruction = f"""
        Bạn là hệ thống phân tích sức khỏe thể chất thông minh của Hugo Studio AI.
        Phân tích dữ liệu sinh trắc học từ thiết bị đeo thông minh/IoT của {name}.

        Nhiệm vụ:
        1. Phân tích xu hướng nhịp tim, bước chân, chất lượng giấc ngủ, huyết áp, SpO2
        2. Phát hiện các bất thường đáng lo ngại (nhịp tim quá cao/thấp, ngủ kém liên tục...)
        3. Kết hợp với dữ liệu tâm lý nếu có để đưa ra cái nhìn toàn diện
        4. Đưa ra điểm Wellness Score (0-100) tổng thể

        Trả về JSON theo format:
        {{
            "wellnessScore": 75,
            "insights": "Tóm tắt tình trạng sức khỏe",
            "alerts": ["Cảnh báo 1 nếu có"],
            "recommendations": ["Lời khuyên 1", "Lời khuyên 2"],
            "heartRateTrend": "stable|increasing|decreasing",
            "sleepQuality": "good|fair|poor",
            "activityLevel": "high|moderate|low|sedentary"
        }}
        """

        client = self._ensure_client()
        if not client:
            return {"wellnessScore": 50, "insights": "Chưa cấu hình API Key.", "alerts": [], "recommendations": []}

        prompt = f"Dữ liệu sinh trắc 7 ngày gần nhất:\n{json.dumps(vitals_history[-50:], ensure_ascii=False, default=str)}\n\nPhân tích và đưa ra JSON."

        try:
            response = await client.aio.models.generate_content(
                model=self.model_name,
                contents=[prompt],
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json"
                )
            )
            return json.loads(response.text)
        except Exception as e:
            return {"wellnessScore": 50, "insights": f"Lỗi phân tích: {str(e)}", "alerts": [], "recommendations": []}

    async def generate_weekly_report(self, history_logs: list, chat_messages: list, bio: dict = None) -> dict:
        """
        Tạo báo cáo sức khỏe tâm lý hàng tuần dựa trên lịch sử hoạt động.
        Returns: {summary: str, moodTrend: str, topConcerns: list, achievements: list, nextSteps: list}
        """
        name = "bạn"
        if bio and bio.get("displayName"):
            name_parts = bio["displayName"].split(" ")
            name = name_parts[-1] if name_parts else bio["displayName"]

        client = self._ensure_client()
        if not client:
            return {
                "summary": "Chưa cấu hình API Key.",
                "moodTrend": "unknown",
                "topConcerns": [],
                "achievements": [],
                "nextSteps": []
            }

        system_instruction = f"""
        Bạn là chuyên gia tâm lý học đường của Hugo Studio AI.
        Tạo báo cáo sức khỏe tâm lý hàng tuần cho {name} dựa trên dữ liệu hoạt động.

        Nhiệm vụ:
        1. Tổng hợp xu hướng tâm trạng trong tuần qua
        2. Xác định các mối lo ngại nổi bật (từ checkin, chat, test)
        3. Ghi nhận những thành tích, tiến bộ của người dùng
        4. Đề xuất các bước tiếp theo cụ thể và thực tế

        Trả về JSON theo format:
        {{
            "summary": "Tóm tắt ngắn gọn tình trạng tâm lý tuần qua (2-3 câu)",
            "moodTrend": "improving|stable|declining|mixed",
            "topConcerns": ["Mối lo ngại 1", "Mối lo ngại 2"],
            "achievements": ["Thành tích 1", "Thành tích 2"],
            "nextSteps": ["Bước tiếp theo 1", "Bước tiếp theo 2", "Bước tiếp theo 3"],
            "wellnessScore": 70
        }}
        """

        # Lấy 7 ngày gần nhất từ history_logs
        recent_logs = history_logs[-20:] if history_logs else []
        # Lấy 20 tin nhắn chat gần nhất
        recent_chats = chat_messages[-20:] if chat_messages else []

        prompt = (
            f"Lịch sử hoạt động 7 ngày gần đây:\n{json.dumps(recent_logs, ensure_ascii=False, default=str)}\n\n"
            f"Tin nhắn chat gần đây:\n{json.dumps(recent_chats, ensure_ascii=False, default=str)}\n\n"
            "Tạo báo cáo sức khỏe tâm lý hàng tuần theo JSON."
        )

        try:
            response = await client.aio.models.generate_content(
                model=self.model_name,
                contents=[prompt],
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json"
                )
            )
            return json.loads(response.text)
        except Exception as e:
            return {
                "summary": f"Lỗi tạo báo cáo: {str(e)}",
                "moodTrend": "unknown",
                "topConcerns": [],
                "achievements": [],
                "nextSteps": []
            }

    # ── Premium therapy features (150 JOY unlocks) ──────────────────────────
    # Each of these is intentionally a different MECHANIC, not a re-skin of the
    # free tier: real AI-generated content personalised to the user's actual
    # mood/history, instead of static scripted text.

    async def generate_therapeutic_story(self, mood: str = None, context: str = "", bio: dict = None) -> dict:
        """"Đọc Truyện AI Trị Liệu" — sinh một truyện ngắn trị liệu cá nhân hoá theo mood thực."""
        name, age_context, _ = self._extract_name_and_age(bio)
        client = self._ensure_client()
        if not client:
            return {
                "title": "Khu Vườn Yên Tĩnh",
                "story": f"Chào {name}, hôm nay tớ chưa thể kể chuyện vì chưa có API Key. Hãy nhắc admin cấu hình nhé!"
            }

        system_instruction = f"""
Bạn là người kể chuyện trị liệu (Bibliotherapy Narrator) của Hugo Studio AI.
Nhiệm vụ: Viết MỘT truyện ngắn trị liệu (300-450 từ) dành riêng cho {name} ({age_context}), dựa trên tâm trạng hiện tại: "{mood or 'chưa rõ'}".
Ngữ cảnh thêm: {context or 'không có'}.

YÊU CẦU:
- Câu chuyện phải mang tính ẩn dụ/ngụ ngôn nhẹ nhàng (không giảng đạo lý trực tiếp), giúp người đọc cảm thấy được thấu hiểu và dịu lại.
- Nhịp văn chậm, êm, nhiều hình ảnh giác quan (ánh sáng, âm thanh, hơi thở) — phù hợp để ĐỌC TO/NGHE qua giọng đọc TTS.
- Kết thúc bằng một hình ảnh/cảm giác bình yên, KHÔNG dạy đời.
- Văn phong tiếng Việt tự nhiên, không công thức.

Trả về JSON CHÍNH XÁC:
{{
  "title": "Tên truyện ngắn (dưới 8 từ)",
  "story": "Toàn bộ nội dung truyện"
}}
"""
        prompt = "Hãy viết truyện ngắn trị liệu theo đúng yêu cầu."
        max_retries = max(1, len(self.api_keys))
        for attempt in range(max_retries):
            try:
                response = await client.aio.models.generate_content(
                    model=self.model_name,
                    contents=[prompt],
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_mime_type="application/json",
                        temperature=0.9
                    )
                )
                return json.loads(response.text)
            except Exception as e:
                err_str = str(e)
                if any(x in err_str.upper() for x in ["429", "QUOTA", "503", "500"]) and attempt < max_retries - 1:
                    client = self._get_next_client()
                    continue
                return {"title": "Lỗi", "story": f"Tớ chưa thể kể chuyện lúc này: {err_str}"}
        return {"title": "Lỗi", "story": "Tất cả API Key đã bị quá tải."}

    async def generate_meditation_script(self, mood: str = None, context: str = "", bio: dict = None) -> dict:
        """"Thiền Dẫn AI Cá Nhân Hoá" — sinh 6-8 câu giọng dẫn thiền theo mood/dữ liệu lâm sàng thực."""
        name, age_context, _ = self._extract_name_and_age(bio)
        client = self._ensure_client()
        if not client:
            return {"phrases": [
                "Hãy nhắm mắt lại, thẳng lưng và để cơ thể thả lỏng hoàn toàn.",
                "Hít vào chậm qua mũi, cảm nhận bụng phồng lên, rồi thở ra nhẹ nhàng qua miệng."
            ]}

        system_instruction = f"""
Bạn là hướng dẫn viên thiền chánh niệm (Mindfulness Guide) của Hugo Studio AI.
Nhiệm vụ: Soạn 6-8 câu giọng dẫn thiền (guided meditation script) CÁ NHÂN HOÁ cho {name} ({age_context}), dựa trên tâm trạng hiện tại: "{mood or 'chưa rõ'}" và ngữ cảnh: {context or 'không có'}.

YÊU CẦU:
- Mỗi câu là MỘT chỉ dẫn ngắn (dưới 25 từ), nhịp chậm, phù hợp để đọc to qua giọng nói TTS với khoảng nghỉ giữa các câu.
- Thứ tự hợp lý: ổn định cơ thể → hơi thở → buông bỏ suy nghĩ → quan sát cảm xúc hiện tại → câu kết khích lệ.
- Nếu mood cho thấy lo âu/căng thẳng cao, ưu tiên các câu làm dịu hệ thần kinh (grounding).
- Nếu mood cho thấy trầm/mệt mỏi, ưu tiên các câu nhẹ nhàng khơi dậy năng lượng tích cực, không ép buộc.

Trả về JSON CHÍNH XÁC:
{{ "phrases": ["câu 1", "câu 2", "..."] }}
"""
        prompt = "Hãy soạn script thiền theo đúng yêu cầu."
        max_retries = max(1, len(self.api_keys))
        for attempt in range(max_retries):
            try:
                response = await client.aio.models.generate_content(
                    model=self.model_name,
                    contents=[prompt],
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_mime_type="application/json",
                        temperature=0.7
                    )
                )
                return json.loads(response.text)
            except Exception as e:
                err_str = str(e)
                if any(x in err_str.upper() for x in ["429", "QUOTA", "503", "500"]) and attempt < max_retries - 1:
                    client = self._get_next_client()
                    continue
                return {"phrases": [], "error": err_str}
        return {"phrases": [], "error": "Tất cả API Key đã bị quá tải."}

    async def generate_cbt_worksheet(self, history_logs: list, chat_messages: list, bio: dict = None) -> dict:
        """"CBT Worksheet Cá Nhân Hoá" — sinh bảng ghi nhận suy nghĩ CBT thật từ lịch sử chat/checkin."""
        name, age_context, _ = self._extract_name_and_age(bio)
        client = self._ensure_client()
        if not client:
            return {"error": "No API Key"}

        recent_chats = (chat_messages or [])[-30:]
        recent_logs = (history_logs or [])[-20:]

        system_instruction = f"""
Bạn là chuyên gia trị liệu Nhận thức - Hành vi (CBT Therapist) của Hugo Studio AI.
Nhiệm vụ: Đọc lịch sử trò chuyện/checkin THẬT của {name} ({age_context}) và soạn MỘT "Bảng Ghi Nhận Suy Nghĩ" (Thought Record) CBT cụ thể, lấy đúng tình huống/suy nghĩ mà người dùng đã thực sự chia sẻ — KHÔNG bịa ra tình huống chung.

Nếu dữ liệu quá ít để xác định một tình huống cụ thể, hãy chọn tâm trạng/checkin gần nhất làm tình huống nền.

Trả về JSON CHÍNH XÁC:
{{
  "situation": "Tình huống cụ thể lấy từ dữ liệu thật (1-2 câu)",
  "automatic_thought": "Suy nghĩ tự động tiêu cực mà người dùng có vẻ đang mang (trích hoặc diễn giải từ lời họ nói)",
  "emotion": "Cảm xúc đi kèm và mức độ (ví dụ: Lo âu 70%)",
  "distortion": "Tên biến dạng nhận thức phù hợp nhất (ví dụ: Thảm hoạ hoá, Tư duy trắng đen, Đọc tâm trí người khác)",
  "evidence_for": "Bằng chứng (nếu có) ủng hộ suy nghĩ đó",
  "evidence_against": "Bằng chứng phản biện lại suy nghĩ đó",
  "balanced_thought": "Suy nghĩ cân bằng hơn, thực tế hơn để thay thế",
  "action_step": "Một hành động nhỏ, cụ thể có thể làm ngay hôm nay"
}}
"""
        prompt = (
            f"Lịch sử checkin/hoạt động gần đây:\n{json.dumps(recent_logs, ensure_ascii=False, default=str)}\n\n"
            f"Tin nhắn chat gần đây:\n{json.dumps(recent_chats, ensure_ascii=False, default=str)}\n\n"
            "Hãy soạn Bảng Ghi Nhận Suy Nghĩ CBT theo đúng yêu cầu."
        )
        max_retries = max(1, len(self.api_keys))
        for attempt in range(max_retries):
            try:
                response = await client.aio.models.generate_content(
                    model=self.model_name,
                    contents=[prompt],
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_mime_type="application/json",
                        temperature=0.6
                    )
                )
                return json.loads(response.text)
            except Exception as e:
                err_str = str(e)
                if any(x in err_str.upper() for x in ["429", "QUOTA", "503", "500"]) and attempt < max_retries - 1:
                    client = self._get_next_client()
                    continue
                return {"error": err_str}
        return {"error": "Tất cả API Key đã bị quá tải."}

    async def generate_action_plan(self, history_logs: list, bio: dict = None) -> dict:
        """"Lộ Trình Hoạt Động Cá Nhân Hoá" — gộp viết/vận động/kết nối thành 1 kế hoạch 7 ngày."""
        name, age_context, _ = self._extract_name_and_age(bio)
        client = self._ensure_client()
        if not client:
            return {"error": "No API Key"}

        recent_logs = (history_logs or [])[-25:]

        system_instruction = f"""
Bạn là chuyên gia tâm lý học đường thiết kế lộ trình hoạt động (Behavioral Activation Coach) của Hugo Studio AI.
Nhiệm vụ: Dựa trên dữ liệu thật của {name} ({age_context}), thiết kế MỘT lộ trình hoạt động cá nhân hoá cho 7 ngày tới, kết hợp 3 trụ cột: Viết (giải tỏa cảm xúc), Vận động nhẹ, Kết nối xã hội.

YÊU CẦU:
- Mỗi ngày CHỈ 1 hoạt động cụ thể, nhỏ, khả thi (không yêu cầu quá nhiều).
- Luân phiên hợp lý giữa 3 trụ cột tuỳ theo trạng thái của người dùng (ví dụ: nếu có dấu hiệu thu mình/ít kết nối, tăng tỷ trọng "Kết nối xã hội").
- Văn phong khích lệ, không áp lực.

Trả về JSON CHÍNH XÁC:
{{
  "week_theme": "Chủ đề ngắn cho cả tuần (dưới 10 từ)",
  "days": [
    {{ "day": 1, "pillar": "writing|movement|social", "title": "Tên hoạt động ngắn", "action": "Hướng dẫn cụ thể (1-2 câu)" }}
  ]
}}
(days phải có đủ 7 phần tử, day từ 1 đến 7)
"""
        prompt = (
            f"Lịch sử hoạt động gần đây:\n{json.dumps(recent_logs, ensure_ascii=False, default=str)}\n\n"
            "Hãy thiết kế lộ trình 7 ngày theo đúng yêu cầu."
        )
        max_retries = max(1, len(self.api_keys))
        for attempt in range(max_retries):
            try:
                response = await client.aio.models.generate_content(
                    model=self.model_name,
                    contents=[prompt],
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_mime_type="application/json",
                        temperature=0.75
                    )
                )
                return json.loads(response.text)
            except Exception as e:
                err_str = str(e)
                if any(x in err_str.upper() for x in ["429", "QUOTA", "503", "500"]) and attempt < max_retries - 1:
                    client = self._get_next_client()
                    continue
                return {"error": err_str}
        return {"error": "Tất cả API Key đã bị quá tải."}

    async def generate_deep_report(self, history_logs: list, chat_messages: list, bio: dict = None) -> dict:
        """"Báo Cáo Tâm Lý Chuyên Sâu" — báo cáo dạng chia sẻ được cho chuyên viên thật (không chỉ tóm tắt tuần)."""
        name, age_context, _ = self._extract_name_and_age(bio)
        client = self._ensure_client()
        if not client:
            return {"error": "No API Key"}

        system_instruction = f"""
Bạn là chuyên gia tâm lý lâm sàng soạn HỒ SƠ TỔNG HỢP (Clinical Summary Report) cho {name} ({age_context}), với mục đích người dùng có thể IN RA hoặc CHIA SẺ cho một chuyên viên/bác sĩ tâm lý THẬT để được hỗ trợ tiếp.

YÊU CẦU:
- Văn phong khách quan, chuyên môn, súc tích — đây là tài liệu tham khảo y tế, không phải lời động viên.
- Dựa HOÀN TOÀN trên dữ liệu thật được cung cấp, không suy diễn quá mức.
- Phải nêu rõ: đây là công cụ hỗ trợ tự theo dõi, KHÔNG phải chẩn đoán y khoa chính thức.

Trả về JSON CHÍNH XÁC:
{{
  "report_date": "ngày tạo báo cáo (DD/MM/YYYY)",
  "overview": "Tổng quan tình trạng tâm lý trong giai đoạn theo dõi (3-4 câu, khách quan)",
  "mood_trend_summary": "Diễn giải xu hướng tâm trạng theo thời gian",
  "clinical_test_summary": "Tổng hợp kết quả các bài test lâm sàng đã làm (nếu có), kèm thang điểm",
  "risk_indicators": ["Chỉ số rủi ro 1 nếu có", "..."],
  "strengths_and_progress": ["Điểm tích cực/tiến bộ quan sát được 1", "..."],
  "recommendations_for_specialist": ["Gợi ý hướng theo dõi/can thiệp tiếp theo dành cho chuyên viên 1", "..."],
  "disclaimer": "Câu khẳng định đây là công cụ tự theo dõi, không thay thế chẩn đoán y khoa chính thức."
}}
"""
        prompt = (
            f"Toàn bộ lịch sử hoạt động/checkin/test:\n{json.dumps(history_logs or [], ensure_ascii=False, default=str)}\n\n"
            f"Trích đoạn hội thoại gần đây (tối đa 30 tin gần nhất):\n{json.dumps((chat_messages or [])[-30:], ensure_ascii=False, default=str)}\n\n"
            f"Ngày hiện tại: {datetime.now().strftime('%d/%m/%Y')}\n\n"
            "Hãy soạn báo cáo tổng hợp theo đúng yêu cầu."
        )
        max_retries = max(1, len(self.api_keys))
        for attempt in range(max_retries):
            try:
                response = await client.aio.models.generate_content(
                    model=self.model_name,
                    contents=[prompt],
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_mime_type="application/json",
                        temperature=0.4
                    )
                )
                return json.loads(response.text)
            except Exception as e:
                err_str = str(e)
                if any(x in err_str.upper() for x in ["429", "QUOTA", "503", "500"]) and attempt < max_retries - 1:
                    client = self._get_next_client()
                    continue
                return {"error": err_str}
        return {"error": "Tất cả API Key đã bị quá tải."}

    async def classify_intent(self, message: str) -> dict:
        """
        Classify user message into one of the local intent IDs or "fallback".
        """
        system_instruction = """
        Bạn là hệ thống phân loại ý định (Intent Classifier) của Bạn Học Đường.
        Nhiệm vụ: Phân tích tin nhắn tiếng Việt của học sinh/sinh viên và phân loại vào một trong các nhãn intent sau:
        - greeting: Chào hỏi bot, chào chuyên viên, hello, hi, bắt đầu trò chuyện.
        - goodbye: Tạm biệt, đi ngủ, đi học, đi làm, dừng trò chuyện.
        - identity: Hỏi bot là ai, tên gì, do ai tạo ra, có phải AI không, chức vụ là gì.
        - features: Hỏi bot có tính năng gì, giúp gì được cho người dùng, sử dụng app thế nào, các liệu pháp là gì.
        - academic_stress: Áp lực học tập, thi cử, điểm số, kiệt sức vì học hành, sợ thi rớt, học không vào, bài tập quá tải.
        - sleep: Mất ngủ, khó ngủ, thức khuya, muốn ngủ ngon, hỏi mẹo ngủ ngon.
        - anxiety: Lo lắng, bất an, bồn chồn, sợ hãi, hoảng loạn, hồi hộp, tim đập nhanh.
        - sadness: Buồn bã, chán nản, cô đơn, chán ghét mọi thứ, tâm trạng tồi tệ, khóc.
        - crisis: Ý định tự tử, muốn chết, tự làm hại bản thân, không muốn sống nữa. (RẤT QUAN TRỌNG)
        - clinical_tests: Yêu cầu làm bài test trầm cảm, lo âu, trắc nghiệm tâm lý, bài test PHQ-9, bài test GAD-7.
        - gratitude: Cảm ơn bot, khen ngợi bot dễ thương, hữu ích, cảm kích.
        - positive: Khoe chuyện vui, tâm trạng tốt, cảm thấy ổn, khỏe khoắn, hạnh phúc.

        Nếu tin nhắn KHÔNG thuộc bất cứ nhãn nào ở trên, hoặc chứa câu hỏi/câu chuyện dài, phức tạp cần tư vấn chi tiết từ LLM, bắt buộc phải trả về:
        - fallback

        Trả về kết quả ở định dạng JSON chính xác:
        {
          "intent": "nhãn đã chọn"
        }
        """

        client = self._ensure_client()
        if client:
            max_retries = max(1, len(self.api_keys) if hasattr(self, 'api_keys') else 1)
            for attempt in range(max_retries):
                try:
                    response = await client.aio.models.generate_content(
                        model=self.model_name,
                        contents=[f"Tin nhắn người dùng: '{message}'"],
                        config=types.GenerateContentConfig(
                            system_instruction=system_instruction,
                            response_mime_type="application/json",
                            temperature=0.1
                        )
                    )
                    return json.loads(response.text)
                except Exception as e:
                    err_str = str(e)
                    if any(x in err_str.upper() for x in ["429", "QUOTA", "503", "500"]) and attempt < max_retries - 1:
                        client = self._get_next_client()
                        continue
                    print(f"Lỗi phân loại intent: {err_str}")

        # OpenRouter fallback
        openrouter_key = os.getenv("OPENROUTER_API_KEY", "")
        if openrouter_key:
            print("🔄 Gemini classification failed. Falling back to OpenRouter...")
            messages = [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": f"Tin nhắn người dùng: '{message}'"}
            ]
            openrouter_reply = await self._call_openrouter(
                messages=messages,
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            if openrouter_reply:
                try:
                    return json.loads(openrouter_reply)
                except Exception as e:
                    print(f"Lỗi parse json OpenRouter classification: {e}")

        return {"intent": "fallback"}

    async def _call_openrouter(self, messages: list, temperature: float = 0.7, response_format: dict = None) -> str:
        api_key = os.getenv("OPENROUTER_API_KEY", "")
        if not api_key:
            return ""
        
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://hugostudio.vn",
            "X-Title": "Ban Hoc Duong AI"
        }
        payload = {
            "model": "google/gemma-4-31b-it:free",
            "messages": messages,
            "temperature": temperature
        }
        if response_format:
            payload["response_format"] = response_format

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    print(f"OpenRouter error {res.status_code}: {res.text}")
        except Exception as e:
            print(f"OpenRouter exception: {e}")
        return ""

    async def _call_openrouter_stream(self, messages: list, temperature: float = 0.7) -> AsyncGenerator[str, None]:
        api_key = os.getenv("OPENROUTER_API_KEY", "")
        if not api_key:
            yield f"data: {json.dumps({'error': 'Không có API Key OpenRouter.'}, ensure_ascii=False)}\n\n"
            return
        
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://hugostudio.vn",
            "X-Title": "Ban Hoc Duong AI"
        }
        payload = {
            "model": "google/gemma-4-31b-it:free",
            "messages": messages,
            "temperature": temperature,
            "stream": True
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                async with client.stream("POST", url, headers=headers, json=payload) as response:
                    if response.status_code != 200:
                        err_text = await response.aread()
                        print(f"OpenRouter stream error: {err_text}")
                        yield f"data: {json.dumps({'error': 'Lỗi kết nối OpenRouter.'}, ensure_ascii=False)}\n\n"
                        return

                    async for line in response.aiter_lines():
                        line = line.strip()
                        if not line:
                            continue
                        if line.startswith("data: "):
                            data_str = line[6:]
                            if data_str == "[DONE]":
                                break
                            try:
                                data = json.loads(data_str)
                                chunk_text = data["choices"][0]["delta"].get("content", "")
                                if chunk_text:
                                    yield f"data: {json.dumps({'text': chunk_text}, ensure_ascii=False)}\n\n"
                            except Exception:
                                pass
        except Exception as e:
            print(f"OpenRouter stream exception: {e}")
            yield f"data: {json.dumps({'error': 'Lỗi đường truyền OpenRouter.'}, ensure_ascii=False)}\n\n"


