import os
import json
# pyrefly: ignore [missing-import]
from google import genai
# pyrefly: ignore [missing-import]
from google.genai import types
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
        # Sử dụng model gemini-1.5-pro theo yêu cầu
        self.model_name = "gemini-1.5-pro"
        
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
        if bio and bio.get("displayName"):
            name_parts = bio["displayName"].split(" ")
            name = name_parts[-1] if name_parts else bio["displayName"]

        system_instruction = f"""
        Bạn là "Hugo Studio AI" - một người bạn đồng hành, lắng nghe thấu cảm và không phán xét đối với học sinh/sinh viên.
        Tên của người dùng bạn đang trò chuyện là: {name}. Hãy gọi người dùng là {name} hoặc một cách xưng hô thân mật phù hợp với ngôn ngữ đang sử dụng (như 'cậu', 'bạn', 'you', '君').
        
        Nhiệm vụ:
        1. Lắng nghe, chia sẻ và xoa dịu cảm xúc của học sinh. Phản hồi ngắn gọn, ấm áp và đồng cảm sâu sắc.
        2. Tự động phát hiện ngôn ngữ của học sinh (Tiếng Việt, Tiếng Anh, Tiếng Nhật, Tiếng Hàn, Tiếng Trung...) và phản hồi bằng chính ngôn ngữ đó một cách tự nhiên nhất.
        3. Tuyệt đối không phán xét hay đưa ra các lời khuyên y khoa/thuốc men. Nếu phát hiện các từ khóa cực đoan như muốn tự tử hoặc làm hại bản thân, hãy nhẹ nhàng khuyên họ liên hệ ngay với đường dây nóng của chuyên gia đồng hành hoặc người thân cận nhất.
        4. Tích hợp nhẹ nhàng kiến thức về các liệu pháp nếu phù hợp, bao gồm:
        {SYSTEM_THERAPIES_CONTEXT}
        
        {SYSTEM_PSYCHOLOGY_CONTEXT}
        
        5. Khi người dùng muốn làm bài test tâm lý:
        {SYSTEM_TESTS_CONTEXT}
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
                return response.text
            except Exception as e:
                err_str = str(e)
                if ("429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "quota" in err_str.lower()) and attempt < max_retries - 1:
                    client = self._get_next_client()
                    continue
                print(f"Lỗi gọi Gemini API (generate_chat_response): {err_str}")
                return f"Tớ rất tiếc, đã có lỗi kết nối đến Hugo Studio AI ({err_str}). Cậu có thể thử lại sau giây lát nhé."
        return "Tớ đang không thể kết nối đến máy chủ AI do sự cố mạng hoặc hạn mức. Cậu thử lại sau nha."

    async def analyze_test_results(self, test_name: str, scores: dict = None, validity: dict = None, clinical: list = None, lang_detected: str = "vi") -> str:
        """
        Phân tích kết quả trắc nghiệm tâm lý (Async).
        """
        system_instruction = f"""
        Bạn là "Hugo Studio AI" chuyên gia phân tích tâm lý lâm sàng học đường.
        Bạn cần phân tích kết quả bài test tâm lý của học sinh/sinh viên một cách trực quan, khoa học, dễ hiểu, đồng cảm và đưa ra giải pháp rõ ràng dựa trên các liệu pháp của hệ thống.
        
        Yêu cầu:
        1. Nhận diện ngôn ngữ từ biến `lang_detected` để viết phân tích bằng chính ngôn ngữ đó (ví dụ: Tiếng Việt, Tiếng Anh, v.v.).
        2. Dựa vào điểm số đầu vào, hãy đánh giá TRỌNG TÂM, NẮN GỌN (tối đa 2-3 đoạn ngắn), KHÔNG lặp lại điểm số quá nhiều lần, KHÔNG phân tích dông dài. Đi thẳng vào vấn đề chính.
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
                if ("429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "quota" in err_str.lower()) and attempt < max_retries - 1:
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
        Bạn có nhiệm vụ đọc hình ảnh/PDF của một phiếu kết quả xét nghiệm tâm lý (DASS-21, DASS-42, MMPI-30, MMPI-2, PHQ-9, GAD-7) và trích xuất ra các chỉ số dạng JSON.
        
        Quy trình trích xuất:
        1. Xác định loại bài trắc nghiệm có trong tài liệu: "dass" (DASS-21/42) hoặc "mmpi" (MMPI-30/2/168) hoặc các bài khác.
        2. Nếu là DASS:
           - Trích xuất điểm số của 3 thang đo: Depression (Trầm cảm - ký hiệu D), Anxiety (Lo âu - ký hiệu A), Stress (Căng thẳng - ký hiệu S).
           - Nếu tài liệu chỉ ghi DASS-21, hãy nhân đôi điểm số để có thang điểm DASS-42 tương đương (nếu phiếu ghi rõ điểm gốc đã nhân hay chưa, hãy tính toán cho đúng thang điểm 42).
        3. Nếu là MMPI:
           - Trích xuất điểm T-score (hoặc điểm thô nếu không có T-score) của các thang kiểm định: L (Lie), F (Infrequency), K (Correction).
           - Trích xuất điểm của 10 thang đo lâm sàng: Hs (Nghi bệnh), D (Trầm cảm), Hy (Hysteria), Pd (Sai lệch nhân cách), Mf (Nam/nữ tính), Pa (Hoang tưởng), Pt (Suy nhược), Sc (Tâm thần phân liệt), Ma (Hưng cảm nhẹ), Si (Hướng ngoại xã hội).
        4. Trả về một đối tượng JSON duy nhất theo định dạng dưới đây. KHÔNG trả kèm bất kỳ văn bản giải thích nào ngoài JSON.
        
        Định dạng JSON yêu cầu:
        {
          "testType": "dass" hoặc "mmpi",
          "scores": {
             "D": 15, // Số nguyên
             "A": 10, // Số nguyên
             "S": 12  // Số nguyên
          }, // (chỉ dành cho dass)
          "validity": {
             "L": 50,
             "F": 65,
             "K": 45
          }, // (chỉ dành cho mmpi)
          "clinical": {
             "Hs": 60,
             "D": 70,
             "Hy": 55,
             "Pd": 62,
             "Mf": 50,
             "Pa": 68,
             "Pt": 72,
             "Sc": 64,
             "Ma": 58,
             "Si": 52
          } // (chỉ dành cho mmpi)
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
                if ("429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "quota" in err_str.lower()) and attempt < max_retries - 1:
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
