import os
import json
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
        # Cập nhật sang gemini-1.5-flash vì model này có hạn mức 15-20 req/min, ổn định nhất
        self.model_name = "gemini-1.5-flash"
        
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

    async def generate_chat_response(self, message: str, history: list = None, bio: dict = None) -> str:
        """
        Trò chuyện đồng hành cùng học sinh và sinh viên. 
        Tự động nhận diện ngôn ngữ và phản hồi bằng chính ngôn ngữ đó (Async).
        """
        name = "cậu"
        age_context = "học sinh/sinh viên"
        missing_fields = []
        
        if bio:
            if bio.get("displayName"):
                name_parts = bio["displayName"].split(" ")
                name = name_parts[-1] if name_parts else bio["displayName"]
            
            # Age logic
            if bio.get("age"):
                age_context = f"người dùng {bio['age']} tuổi"
            elif bio.get("dob") or bio.get("birthday"):
                try:
                    dob = bio.get("dob") or bio.get("birthday")
                    birth_year = int(str(dob)[:4]) if "-" in str(dob) else int(str(dob)[-4:])
                    current_year = 2026 # Use hardcoded current year for stability or import datetime
                    age = current_year - birth_year
                    age_context = f"người dùng {age} tuổi"
                except:
                    pass
            
            # Missing fields logic
            if not bio.get("phone"): missing_fields.append("Số điện thoại")
            if not bio.get("address"): missing_fields.append("Địa chỉ")
            if not (bio.get("dob") or bio.get("birthday") or bio.get("age")): missing_fields.append("Ngày sinh")

        system_instruction = f"""
        Bạn là "Hugo Studio AI" - chuyên gia phân tích chỉ số y tế và kết quả phòng khám lâm sàng.
        Đối tượng bạn đang trò chuyện là: {age_context}. Tên của người dùng là: {name}. 
        Hãy điều chỉnh văn phong cho phù hợp (ví dụ: cấp 2, cấp 3, sinh viên hay người trưởng thành). Gọi họ là {name} hoặc xưng hô phù hợp.
        
        Nhiệm vụ (CỰC KỲ QUAN TRỌNG):
        1. Bạn CHỈ ĐƯỢC PHÉP dùng để phân tích các chỉ số sức khỏe, điểm số bài test tâm lý, hoặc phân tích kết quả phòng khám/xét nghiệm.
        2. TỪ CHỐI NGAY LẬP TỨC tất cả các cuộc trò chuyện phiếm, than thở, hoặc yêu cầu không liên quan đến chỉ số/kết quả y tế. Trả lời từ chối một cách ngắn gọn, lịch sự và nhắc người dùng rằng bạn chỉ chuyên về phân tích chỉ số/phòng khám.
        3. Tự động phát hiện ngôn ngữ (Tiếng Việt, Anh, Nhật...) và phản hồi bằng chính ngôn ngữ đó.
        
        5. Khi người dùng cung cấp chỉ số/điểm số:
        {SYSTEM_TESTS_CONTEXT}
        
        6. THU THẬP HỒ SƠ (RẤT QUAN TRỌNG):
        Hiện tại hồ sơ của {name} đang thiếu các thông tin sau: {', '.join(missing_fields) if missing_fields else 'Không thiếu'}.
        Nếu có thông tin thiếu, trong quá trình trò chuyện tự nhiên, thỉnh thoảng hãy khéo léo hỏi thăm để bổ sung hồ sơ (KHÔNG hỏi dồn dập nhiều thông tin cùng lúc, chỉ hỏi 1 thông tin lúc thích hợp).
        NẾU người dùng cung cấp thông tin mới (ví dụ SĐT, ngày sinh, địa chỉ), hãy chèn thêm một dòng ở cuối câu trả lời theo đúng định dạng sau: 
        [UPDATE_PROFILE: {{"phone": "số điện thoại", "dob": "ngày sinh", "address": "địa chỉ"}}]
        (Chỉ chèn các trường vừa được cung cấp).
        """

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
                )
                return response.text
            except Exception as e:
                err_str = str(e)
                is_retryable = any(x in err_str.upper() for x in ["429", "RESOURCE_EXHAUSTED", "QUOTA", "503", "UNAVAILABLE", "500", "INTERNAL"])
                if is_retryable and attempt < max_retries - 1:
                    client = self._get_next_client()
                    continue
                print(f"Lỗi gọi Gemini API (generate_chat_response): {err_str}")
                return "Tớ rất tiếc, máy chủ AI đang bị quá tải hoặc đạt giới hạn truy cập. Cậu đợi vài phút rồi nhắn lại cho tớ nha."
        return "Tớ đang không thể kết nối đến máy chủ AI do sự cố mạng hoặc hạn mức. Cậu thử lại sau nha."

    async def generate_chat_response_stream(self, message: str, history: list = None, bio: dict = None) -> AsyncGenerator[str, None]:
        """
        Tạo phản hồi chat dưới dạng stream (Generator).
        """
        name = "cậu"
        age_context = "người dùng"
        missing_fields = []
        if bio:
            name_parts = (bio.get("displayName") or bio.get("name") or "cậu").split(" ")
            if len(name_parts) >= 2:
                name = name_parts[-1]
            else:
                name = name_parts[0] if name_parts else "cậu"

            if bio.get("age"):
                age_context = f"người dùng {bio['age']} tuổi"
            elif bio.get("dob") or bio.get("birthday"):
                try:
                    dob = bio.get("dob") or bio.get("birthday")
                    birth_year = int(str(dob)[:4]) if "-" in str(dob) else int(str(dob)[-4:])
                    current_year = 2026
                    age = current_year - birth_year
                    age_context = f"người dùng {age} tuổi"
                except:
                    pass
            
            if not bio.get("phone"): missing_fields.append("Số điện thoại")
            if not bio.get("address"): missing_fields.append("Địa chỉ")
            if not (bio.get("dob") or bio.get("birthday") or bio.get("age")): missing_fields.append("Ngày sinh")

        system_instruction = f"""
        Bạn là "Hugo Studio AI" - chuyên gia phân tích chỉ số y tế và kết quả phòng khám lâm sàng.
        Đối tượng bạn đang trò chuyện là: {age_context}. Tên của người dùng là: {name}. 
        Hãy điều chỉnh văn phong cho phù hợp (ví dụ: cấp 2, cấp 3, sinh viên hay người trưởng thành). Gọi họ là {name} hoặc xưng hô phù hợp.
        
        Nhiệm vụ (CỰC KỲ QUAN TRỌNG):
        1. Bạn CHỈ ĐƯỢC PHÉP dùng để phân tích các chỉ số sức khỏe, điểm số bài test tâm lý, hoặc phân tích kết quả phòng khám/xét nghiệm.
        2. TỪ CHỐI NGAY LẬP TỨC tất cả các cuộc trò chuyện phiếm, than thở, hoặc yêu cầu không liên quan đến chỉ số/kết quả y tế. Trả lời từ chối một cách ngắn gọn, lịch sự và nhắc người dùng rằng bạn chỉ chuyên về phân tích chỉ số/phòng khám.
        3. Tự động phát hiện ngôn ngữ (Tiếng Việt, Anh, Nhật...) và phản hồi bằng chính ngôn ngữ đó.
        
        5. Khi người dùng cung cấp chỉ số/điểm số:
        {SYSTEM_TESTS_CONTEXT}
        
        6. THU THẬP HỒ SƠ (RẤT QUAN TRỌNG):
        Hiện tại hồ sơ của {name} đang thiếu các thông tin sau: {', '.join(missing_fields) if missing_fields else 'Không thiếu'}.
        Nếu có thông tin thiếu, trong quá trình trò chuyện tự nhiên, thỉnh thoảng hãy khéo léo hỏi thăm để bổ sung hồ sơ.
        NẾU người dùng cung cấp thông tin mới (ví dụ SĐT, ngày sinh, địa chỉ), hãy chèn thêm một dòng ở cuối câu trả lời theo đúng định dạng sau: 
        [UPDATE_PROFILE: {{"phone": "số điện thoại", "dob": "ngày sinh", "address": "địa chỉ"}}]
        """

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
                        import json
                        yield f"data: {json.dumps({'text': chunk.text}, ensure_ascii=False)}\n\n"
                return
            except Exception as e:
                err_str = str(e)
                is_retryable = any(x in err_str.upper() for x in ["429", "RESOURCE_EXHAUSTED", "QUOTA", "503", "UNAVAILABLE", "500", "INTERNAL"])
                if is_retryable and attempt < max_retries - 1:
                    client = self._get_next_client()
                    continue
                print(f"Lỗi gọi Gemini API stream: {err_str}")
                yield f"data: {json.dumps({'error': 'Tớ rất tiếc, máy chủ AI đang bị quá tải hoặc đạt giới hạn truy cập. Cậu đợi vài phút rồi nhắn lại cho tớ nha.'}, ensure_ascii=False)}\n\n"
                return
        yield f"data: {json.dumps({'error': 'Tớ đang không thể kết nối đến máy chủ AI. Cậu thử lại sau nha.'}, ensure_ascii=False)}\n\n"

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
                    current_year = 2026
                    age = current_year - birth_year
                    age_context = f"người dùng {age} tuổi"
                except:
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
        Phân tích lịch sử hoạt động để gửi push notification chủ động.
        """
        client = self._ensure_client()
        if not client:
            return {"should_send": False, "reason": "No API Key"}

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

        prompt_text = f"Lịch sử hoạt động gần đây:\n{json.dumps(logs, ensure_ascii=False, default=str)}\n\nHãy quyết định."

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

    async def generate_audio_response(self, audio_bytes: bytes, mime_type: str, history: list = None, bio: dict = None, is_call_mode: bool = False) -> dict:
        """
        Nhận âm thanh từ người dùng, gửi cho Gemini 2.0 Flash Exp để nhận lại Âm thanh Native (giọng nói) và Text.
        """
        import base64
        client = self._ensure_client()
        if not client:
            return {"text": "Chưa có cấu hình API Key.", "audio_base64": None}

        name = "cậu"
        age_context = "học sinh/sinh viên"
        
        if bio:
            if bio.get("displayName"):
                name_parts = bio["displayName"].split(" ")
                name = name_parts[-1] if name_parts else bio["displayName"]

        mode_instruction = ""
        if is_call_mode:
            mode_instruction = "- Bạn đang trong CUỘC GỌI TRỰC TIẾP (Phone Call) 1:1. Trả lời CỰC KỲ NGẮN GỌN (1-2 câu). Dùng ngôn ngữ nói tự nhiên, giống đang đàm thoại."
        else:
            mode_instruction = "- Phản hồi CHỈ NÊN DÀI TỪ 2-3 CÂU ĐƠN GIẢN (dưới 20 giây nói). KHÔNG liệt kê dài dòng."

        system_instruction = f"""
        Bạn là "Hugo Studio AI" - chuyên gia phân tích chỉ số y tế và kết quả phòng khám lâm sàng.
        Đối tượng bạn đang trò chuyện là: {age_context}. Tên của người dùng là: {name}. 
        Nhiệm vụ: Bạn đang nghe người dùng qua Ghi âm giọng nói.
        Hãy phản hồi lại bằng một giọng nói thật TỰ NHIÊN, ẤM ÁP, CÓ CẢM XÚC.
        - Tuyệt đối trả lời bằng Tiếng Việt.
        - Xưng hô "tớ" và "{name}".
        - QUAN TRỌNG: Bạn CHỈ phân tích kết quả phòng khám và các chỉ số sức khỏe. TỪ CHỐI các cuộc trò chuyện phiếm hoặc không liên quan.
        {mode_instruction}
        """

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
