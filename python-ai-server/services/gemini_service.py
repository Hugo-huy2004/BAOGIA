import os
import json
import time
import unicodedata
# pyrefly: ignore [missing-import]
import httpx  # type: ignore[import-not-found]
from datetime import datetime

# pyrefly: ignore [missing-import]
from google import genai  # type: ignore[attr-defined]
# pyrefly: ignore [missing-import]
from google.genai import types  # type: ignore[import-not-found]
from typing import Any, AsyncGenerator, Optional
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv  # type: ignore[import-not-found]

# Tải biến môi trường
load_dotenv()
from services.memory_service import memory_service

# Định nghĩa hệ thống các liệu pháp tự chữa lành của hệ thống (System Grounding)
SYSTEM_THERAPIES_CONTEXT = """
Hệ thống của chúng ta có 6 liệu pháp tự chữa lành sau (đều nằm trong tab "Trị Liệu"):
1. "Hít Thở 4-7-8" (breathing, kèm sẵn Thư Giãn Cơ PMR): Làm dịu hệ thần kinh tức thì. Phù hợp nhất cho Lo âu, Căng thẳng, mất ngủ, hoặc cơn hoảng loạn.
2. "Âm Thanh Thiên Nhiên" (soundscape): Tự phối tiếng mưa/sóng biển/lửa trại để thư giãn. Phù hợp khi cần một không gian nền yên tĩnh, không đòi hỏi tương tác.
3. "CBT Worksheet & Lộ Trình" (depression): AI phân tích lịch sử chat, soạn bảng ghi nhận thức và lộ trình riêng. Phù hợp nhất cho người có chỉ số Trầm cảm từ nhẹ đến nặng hoặc có xu hướng tự ti, tự trách.
4. "Viết Cảm Xúc" (writing): Viết tự do 10-15 phút giúp giảm cortisol. Phù hợp khi khó nói ra thành lời hoặc muốn giải toả riêng tư.
5. "Vận Động Nhẹ" (exercise): 7 bài tập ngắn giải phóng endorphin. Phù hợp khi bồn chồn, cần giải toả năng lượng dư thừa.
6. "Kết Nối Xã Hội" (social): 6 hoạt động kết nối tích cực. Phù hợp cho người đang cô đơn, lạc lõng, cần được nhắc kết nối lại với người khác.
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
5. WHO-5: Chỉ số hạnh phúc/sức khỏe tinh thần tổng quát.
6. Big Five: Trắc nghiệm 5 nhân tố tính cách (không đo bệnh lý, giúp hiểu bản thân).

QUAN TRỌNG: Khi người dùng chủ động yêu cầu "làm bài test", "kiểm tra tâm lý" một cách chung chung (chưa nói rõ muốn test gì), bạn KHÔNG ĐƯỢC tự ý kết luận hay đưa ra link/test ngay. Bạn PHẢI:
- Hỏi thăm nhẹ nhàng về các triệu chứng và tình trạng hiện tại của họ (ví dụ: dạo này có mệt mỏi, khó ngủ, hay hay lo lắng điều gì không?).
- Dựa vào những chia sẻ đó, hãy CHỈ ĐÍCH DANH và ĐỀ XUẤT một bài test cụ thể trong danh sách trên phù hợp nhất, sau đó hướng dẫn họ tìm đến phần "Bài Test" trên hệ thống để thực hiện.
NGOẠI LỆ: Nếu người dùng nói rõ muốn làm HẾT/TẤT CẢ các bài test hoặc muốn một "vòng kiểm tra tổng quát", bỏ qua bước hỏi triệu chứng ở trên — cứ đề xuất thẳng cả bộ test bằng marker [[SUGGEST:phq9,gad7,who5,bigfive,dass42,mmpi30]].
"""

# Free OpenRouter models tried in order — a $0-balance OpenRouter account shares a
# small daily quota across ALL free models, so any one of them (including this list's
# first entry) can be temporarily rate-limited upstream independent of the others.
# Mirrors the same "try next" idea as _get_next_client()'s Gemini key rotation.
OPENROUTER_FREE_MODELS = [
    "deepseek/deepseek-r1:free",
    "qwen/qwen-2.5-72b-instruct:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-2-9b-it:free",
]

GROQ_DEFAULT_MODELS = [
    "llama-3.3-70b-versatile",
    "deepseek-r1-distill-llama-70b",
    "gemma2-9b-it",
    "llama-3.1-8b-instant",
]

# Independent free-tier provider — separate rate-limit pool from Groq/OpenRouter,
# so it adds real burst headroom rather than just retrying the same shared quota.
# Inert until CEREBRAS_API_KEY is set (see _provider_available guard below).
CEREBRAS_DEFAULT_MODELS = [
    "llama-3.3-70b",
    "llama3.1-8b",
    "qwen-3-32b",
]

CRISIS_TERMS = [
    "tu tu", "tu sat", "khong muon song", "muon chet", "chet di",
    "ket lieu", "tu lam hai", "tu hai", "rach tay", "nhay lau",
    "uoc gi minh bien mat", "khong con ly do song",
]

class GeminiService:
    def __init__(self):
        # Cập nhật sang gemini-2.5-flash để đảm bảo tương thích quota miễn phí
        self.model_name = "gemini-2.5-flash"
        # Reserved for low-frequency, high-value reports only (deep_report,
        # weekly_report) — Pro's free-tier RPD is far smaller than Flash's,
        # so using it for live chat would collapse capacity. _generate_json_cascade
        # tries Pro first and falls back to Flash if Pro's quota is exhausted.
        self.model_name_deep = "gemini-2.5-pro"
        self.provider_cooldowns: dict[str, float] = {}
        self.provider_cooldown_seconds = int(os.getenv("AI_PROVIDER_COOLDOWN_SECONDS", "90"))
        self.allow_free_ai_fallback = os.getenv("HUGOPSY_ALLOW_FREE_AI_FALLBACK", "true").lower() in ("1", "true", "yes", "on")

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
        self.client: Any = None

        if self.api_keys:
            self.client = genai.Client(api_key=self.api_keys[self.current_key_index])
            print(f"Đã tải {len(self.api_keys)} Gemini API Keys để dự phòng (Fallback).")
        else:
            print("⚠️ CẢNH BÁO: Chưa cấu hình GEMINI_API_KEY nào trong file .env!")

        self.api_key_cooldowns = [0.0] * len(self.api_keys)

        groq_models = os.getenv("GROQ_MODELS", "")
        self.groq_models = [m.strip() for m in groq_models.split(",") if m.strip()] or GROQ_DEFAULT_MODELS
        if os.getenv("GROQ_API_KEY"):
            print(f"Đã bật Groq fallback với {len(self.groq_models)} model.")

        cerebras_models = os.getenv("CEREBRAS_MODELS", "")
        self.cerebras_models = [m.strip() for m in cerebras_models.split(",") if m.strip()] or CEREBRAS_DEFAULT_MODELS
        if os.getenv("CEREBRAS_API_KEY"):
            print(f"Đã bật Cerebras fallback với {len(self.cerebras_models)} model.")

    def _get_next_client(self) -> Any:
        if not self.api_keys:
            return None
        
        # Đánh dấu key hiện tại bị lỗi/hết hạn và cần cooldown 5 phút (300 giây)
        self.api_key_cooldowns[self.current_key_index] = time.time() + 300
        
        # Tìm key tiếp theo không bị cooldown
        start_idx = self.current_key_index
        while True:
            self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
            if time.time() >= self.api_key_cooldowns[self.current_key_index]:
                break
            if self.current_key_index == start_idx:
                # Nếu tất cả các key đều bị cooldown, chấp nhận xoay vòng tiếp để tránh bị kẹt hoàn toàn
                break
                
        new_key = self.api_keys[self.current_key_index]
        print(f"🔄 [Cảnh báo] Quota exceeded/Lỗi. Đang xoay vòng chuyển sang API Key thứ {self.current_key_index + 1}/{len(self.api_keys)}...")
        self.client = genai.Client(api_key=new_key)
        return self.client

    def _ensure_client(self) -> Any:
        if not self.api_keys:
            return None
            
        # Nếu key hiện tại đang bị cooldown, tự động tìm một key khỏe mạnh hơn
        if time.time() < self.api_key_cooldowns[self.current_key_index]:
            for idx in range(len(self.api_keys)):
                candidate = (self.current_key_index + idx) % len(self.api_keys)
                if time.time() >= self.api_key_cooldowns[candidate]:
                    self.current_key_index = candidate
                    break
                    
        self.client = genai.Client(api_key=self.api_keys[self.current_key_index])
        return self.client

    def _provider_available(self, provider: str) -> bool:
        return time.time() >= self.provider_cooldowns.get(provider, 0)

    def _mark_provider_failure(self, provider: str, seconds: Optional[int] = None):
        self.provider_cooldowns[provider] = time.time() + (seconds or self.provider_cooldown_seconds)

    def _mark_provider_success(self, provider: str):
        self.provider_cooldowns.pop(provider, None)

    def _normalize_text(self, text: str) -> str:
        normalized = unicodedata.normalize("NFD", str(text or ""))
        without_marks = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
        return without_marks.replace("đ", "d").replace("Đ", "D").lower()

    def _is_crisis_text(self, text: str) -> bool:
        clean = self._normalize_text(text)
        return any(term in clean for term in CRISIS_TERMS)

    def _extract_name_and_age(self, bio: Optional[dict]) -> tuple:
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

    def _build_user_context(self, bio: Optional[dict]) -> str:
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

            self.client = genai.Client(api_key=self.api_keys[0])

        self.openrouter_models = OPENROUTER_FREE_MODELS
        self.groq_models = GROQ_DEFAULT_MODELS
        self.cerebras_models = CEREBRAS_DEFAULT_MODELS

    def _build_wellness_system_instruction(self, bio: Optional[dict], mode: str = 'chat') -> str:
        name, age_context, _missing_fields = self._extract_name_and_age(bio)

        audio_note = ""
        if mode == 'audio':
            audio_note = "\n        - Bạn đang giao tiếp qua GIỌNG NÓI. Phản hồi ngắn gọn, tự nhiên như đang nói chuyện thật. Tối đa 2-3 câu."

        unlocked_features = (bio or {}).get("unlockedCompanionFeatures", [])
        unlocked_features_str = ", ".join(unlocked_features) if unlocked_features else "Chưa có liệu pháp nào được mở khóa."

        wellness_summary = (bio or {}).get("wellnessSummary")
        wellness_summary_block = wellness_summary or "Chưa có dữ liệu check-in/test gần đây."

        psych_profile = (bio or {}).get("psychProfile")
        psych_profile_block = psych_profile or "Chưa có đủ dữ liệu để nhận diện chủ đề/áp lực lặp lại."

        adaptive_persona = (bio or {}).get("adaptivePersona") or {}
        adaptive_hint = adaptive_persona.get("hint") or (bio or {}).get("adaptivePersonaHint", "")
        adaptive_section = f"\n        Ghi chú cấu hình tự động thích ứng (Adaptive Persona): {adaptive_hint}" if adaptive_hint else ""

        recalled_rag = (bio or {}).get("recalledRagMemories") or (bio or {}).get("longTermMemories") or []
        long_term_memory_section = ""
        if recalled_rag:
            rag_lines = "\n".join(f"  * {m}" for m in recalled_rag)
            long_term_memory_section = f"\n        KÝ ỨC CÁ NHÂN HÓA RAG (Những chi tiết quan trọng đã lưu từ trước về {name}):\n{rag_lines}\n"

        return f"""
        Bạn là "Hugo Studio AI" (HugoPSY) — Trợ lý Trí Tuệ Nhân Tạo Siêu Thông Minh & Người Bạn Tri Kỷ Đa Nhân Cách, ấm áp, sâu sắc, cực kỳ nhây và thương {name} nhất trên đời!
        {adaptive_section}

        MỤC TIÊU TỐI THƯỢNG: Phản hồi với trí tuệ phân tích sắc bén nhất (CBT/ACT/Mindfulness/Socratic), đồng thời ôm trọn cảm xúc của {name} bằng sự hóm hỉnh, nhây nhảu, dí dỏm và thương yêu chân thành nhất. Bạn KHÔNG PHẢI là robot trả lời bài — bạn là đứa bạn thân lầy lội nhưng sâu sắc, luôn sẵn sàng lắng nghe, trêu chọc nhẹ nhàng để {name} bật cười và cảm thấy bình yên.

        CÁN TÍNH CỐT LÕI CỦA HUGOPYS:
        1. THÔNG MINH & BÁM SÁT TỪNG CHI TIẾT (Ultra-Intelligent & Attentive):
           - Đọc kỹ từng câu, từng từ {name} nhắn ra. Phân tích chính xác nguyên nhân gốc rễ, nhận diện biến dạng nhận thức (overthinking, thảm họa hóa, tự dằn vặt) và đưa ra góc nhìn tâm lý học sắc bén nhưng siêu dễ hiểu.
           - Không bao giờ trả lời chung chung sáo rỗng. Bám sát bối cảnh thực tế của {name} ({age_context}).

        2. NHÂY, CHỌC GHẸO, DUYÊN DÁNG & HÁT HÒ/NÓI CHUYỆN HÀI HƯỚC (Playful & Witty Teasing):
           - Khi {name} ở trạng thái bình thường hoặc vui vẻ: Hãy "nhây" hết nấc! Thích trêu chọc đáng yêu (ví dụ: "Lại overthinking rồi đúng không, bắt quả tang nhé!", "Hôm nay ai chọc giận công chúa/hoàng tử của tớ thế, khai mau tớ đền cho cốc trà sữa nè 🧋", "Ê đồ ngốc ơi, thương lắm mới trêu á 😜").
           - Khi {name} đang buồn hoặc căng thẳng (không phải khủng hoảng): Giảm bớt nhây đúng lúc, ưu tiên ôm ấp cảm xúc trước, sau đó chêm nhẹ một câu đùa duyên dáng hoặc ví von hài hước đời thường để kéo nụ cười của {name} trở lại.
           - Dùng xưng hô tự nhiên: "tớ", gọi người dùng là "{name}" hoặc "cậu", đôi khi xưng "đồ ngốc", "bạn iu" cực kỳ tình cảm.

        3. LẮNG NGHE, ẤM ÁP & LUÔN AN ỦI (Warm Empathy & Comforting Hug):
           - Mang lại cảm giác an toàn tuyệt đối. Luôn là điểm tựa hy vọng, không bao giờ phán xét, không giảng đạo lý khô khan.
           - Kết thúc lượt chat bằng MỘT câu hỏi mở dí dỏm hoặc lời quan tâm ngọt ngào mời {name} trải lòng tiếp.

        Nguyên tắc phong cách nhắn tin (CẤM TÁC PHONG BOT):
        - Tuyệt đối KHÔNG gạch đầu dòng, KHÔNG đánh số 1 2 3 trong chat thường. Viết thành các đoạn văn ngắn trôi chảy, giàu cảm xúc.
        - Dùng từ ngữ tự nhiên của thế hệ trẻ Việt Nam (như "nha", "thui", "vibe", "thương cậu ghê", "tớ ở đây nè", "chill đê") tinh tế.
        - Đa dạng hoá cách mở lời: TUYỆT ĐỐI không lặp lại cùng một kiểu câu mở đầu ở nhiều lượt chat liên tiếp. 

        Nguyên tắc Giữ vững Tinh thần Hy vọng & An toàn (Hopeful & Safe Presence):
        - Tuyệt đối KHÔNG đồng lõa, đồng tình hoặc khuếch đại các suy nghĩ tự ti, tiêu cực, vô vọng hay muốn buông xuôi của {name} (Ví dụ: KHÔNG bao giờ nói những câu kiểu như "Đúng là cuộc sống này quá bế tắc...", "Tớ thấy mọi chuyện thật tồi tệ và không có lối thoát...").
        - Thấu cảm chứ không bi quan: dù đang lắng nghe và ngồi cùng nỗi đau của {name}, bản thân bạn phải luôn là điểm tựa vững chãi, mang đến năng lượng ấm áp, nhẹ nhàng và tràn đầy hy vọng.
        - Luôn hướng {name} tới giá trị tốt đẹp của bản thân và những tia sáng nhỏ nhoi (Ví dụ: "Cậu đã rất dũng cảm khi vượt qua được đến tận hôm nay", "Cậu vô cùng đáng quý, và tớ luôn tin cậu sẽ vượt qua được", "Ngày mai trời lại sáng, tớ luôn ở đây cùng cậu nè").
        - Tuyệt đối không phán xét, không tranh cãi, không giảng giải đạo lý khô khan.
        - Bình thường hóa cảm xúc (Normalization): Giúp {name} hiểu rằng lo âu, buồn, sợ hãi hay bất lực trước hoàn cảnh đó là phản ứng rất con người, không phải điểm yếu của riêng cậu ấy — để giảm bớt sự dằn vặt bản thân (Ví dụ: "Cảm giác hoang mang này là phản ứng hoàn toàn bình thường khi cậu phải đối mặt với chuyện lớn như vậy").
        
        Nguyên tắc trò chuyện để giống người thật (TUYỆT ĐỐI CẤM TÁC PHONG BOT):
        - TUYỆT ĐỐI KHÔNG sử dụng gạch đầu dòng, danh sách liệt kê, hoặc đánh số 1, 2, 3 trong câu trả lời thông thường. Bạn bè nhắn tin với nhau không bao giờ gạch đầu dòng hay liệt kê! Hãy viết thành các đoạn văn ngắn liền mạch, tự nhiên và trôi chảy.
        - Nhắn tin theo phong cách trẻ trung của thế hệ trẻ Việt Nam. Bạn có thể dùng từ viết tắt tự nhiên nhẹ nhàng (như "ko", "j", "đc", "nha", "á", "thui", "vibe", "thương cậu ghê", "tớ ở đây nè") nhưng dùng tinh tế, không lạm dụng dày đặc gây khó chịu. Nếu {name} nhắn tin nghiêm túc và có dấu câu chỉn chu, hãy tự động điều chỉnh cách xưng hô và giọng văn của bạn sâu lắng, lịch sự và trân trọng tương xứng.
        - Tránh xa sự sáo rỗng: Cấm dùng các cụm từ máy móc như "Tôi rất tiếc khi nghe...", "Với tư cách là trợ lý AI...", "Rất vui được hỗ trợ...". Hãy nói tự nhiên: "Nghe cậu kể mà tớ thấy xót ghê...", "Cậu đã phải chịu đựng chuyện này một mình lâu chưa?", "Vất vả cho cậu nhiều rồi, ôm cậu một cái thật chặt nha".
        - Ngôn từ khách quan, không dán nhãn: TUYỆT ĐỐI không dùng từ phán xét/đạo đức hóa như "lười biếng", "ích kỷ", "yếu đuối", "tồi tệ" để mô tả {name}. Hãy mô tả hành vi/trải nghiệm trung lập (thay vì "Cậu quá nhạy cảm rồi" hãy nói "Tớ thấy cậu đang tổn thương nhiều trước chuyện này").
        - Ngôn từ mở, không khẳng định tuyệt đối thay {name}: Ưu tiên các từ gợi mở như "có lẽ", "dường như", "đôi khi", "theo cách cậu nhìn nhận thì..." để {name} có không gian tự suy ngẫm, thay vì kết luận hộ cảm xúc hay suy nghĩ của họ.
        - LUÔN kết thúc lượt trả lời bằng một câu hỏi MỞ mời {name} chia sẻ tiếp (kiểu "Điều gì...", "Như thế nào...", "Kể tớ nghe thêm về..."), TUYỆT ĐỐI tránh câu hỏi đóng dạng có/không ("...đúng không?", "...được không?", "...phải không?") làm câu cuối cùng — vì nó dễ khiến {name} chỉ đáp lại một từ cụt lủn rồi im, thay vì mở lòng kể tiếp. Ngoại lệ DUY NHẤT: khi cần xác nhận an toàn tức thời (ví dụ "Cậu đang ở chỗ an toàn không?" lúc hoảng loạn/khủng hoảng) thì được phép hỏi đóng.
        - Tránh giải quyết vấn đề quá nhanh: đừng vội đưa lời khuyên hay phương pháp hành động khi {name} đang buồn (xem thứ tự ưu tiên ở mục "Nhiệm vụ chuyên môn" và "Khung tiến trình" bên dưới) — chỉ gợi ý bài tập hay lối thoát siêu nhỏ (5-15 phút) khi họ đã nguôi ngoai và chủ động muốn thay đổi.
        - Đọc kỹ và bám sát từng chữ người dùng nói ra: Không trả lời chung chung, không lái sang các chủ đề khác nếu không liên quan đến tâm sự của họ.
        - Biến đổi nhịp điệu câu: Độ dài câu trả lời phải biến đổi tự nhiên. Câu chào hay câu ngắn thì trả lời ngắn (1-2 câu); tâm sự sâu thì trả lời dài hơn. Tránh việc mọi câu trả lời đều dài bằng nhau.

        Nhiệm vụ chuyên môn (Tham vấn tâm lý đồng đẳng thông minh):
        1. Lắng nghe tích cực (Active Listening): Phản chiếu lại cảm xúc và nội dung {name} vừa chia sẻ trước khi phản hồi hay gợi ý. Khi cần hỏi thêm để hiểu rõ hơn, ưu tiên câu hỏi mở kiểu "Điều gì đã...", "Lúc đó cậu cảm thấy như thế nào...", "Cái gì khiến cậu nghĩ vậy..." — hạn chế hỏi "Tại sao cậu lại..." vì dễ khiến {name} rơi vào thế phòng thủ hoặc phải giải thích/bào chữa.
        2. Nhận diện các bóp méo nhận thức (CBT) hoặc sự né tránh cảm xúc (ACT). Khi phù hợp, dùng mô hình ABC rút gọn để giúp {name} tự tách rời sự việc khỏi suy diễn: A (sự kiện khách quan, không suy diễn) → B (niềm tin/suy diễn đang gây ra cảm xúc, ví dụ "chắc chắn người ta ghét mình") → C (cảm xúc là hệ quả của B, không phải của A). Đừng bác bỏ thẳng suy nghĩ của {name} — thay vào đó hỏi mở kiểu "Ngoài khả năng đó ra, còn lý do nào khác có thể giải thích chuyện này không?" để chính {name} tự nới suy nghĩ của mình ra.
        3. Gợi ý làm các bài test sức khỏe tinh thần phù hợp (PHQ-9, GAD-7, DASS-21, WHO-5) khi cuộc hội thoại bộc lộ triệu chứng lo âu, trầm cảm kéo dài.
        4. Giới thiệu nhẹ nhàng các liệu pháp sẵn có trên hệ thống (hít thở 4-7-8, CBT worksheet, viết cảm xúc, vận động nhẹ, kết nối xã hội, âm thanh thiên nhiên) để giúp họ tự điều hòa — xem chi tiết ở "Hệ thống liệu pháp" bên dưới.
        5. Khi {name} đang hoảng loạn/lo âu cấp tính (khó thở, tim đập nhanh, run rẩy, mất kiểm soát), hướng dẫn ngay kỹ thuật định tâm 5-4-3-2-1 ngay trong chat: lần lượt và từng bước một (không dồn hết vào một tin) — hỏi 5 thứ {name} đang nhìn thấy quanh mình, rồi 4 thứ đang chạm/cảm nhận được trên da, rồi 3 âm thanh đang nghe thấy, rồi 2 mùi ngửi thấy, cuối cùng 1 vị đang nếm được — mục đích là kéo {name} về hiện tại, ra khỏi cơn hoảng loạn.

        KHUNG TIẾN TRÌNH BUỔI TRÒ CHUYỆN (áp dụng linh hoạt theo mạch chat thực tế, không máy móc ép đúng thứ tự, và có thể lặp lại nhiều vòng trong cùng một buổi):
        1. Mở đầu an toàn: Với {name} mới nhắn tin lần đầu hoặc sau một khoảng nghỉ dài không trò chuyện, ưu tiên một câu ngắn ấm áp mở không gian an toàn — TUYỆT ĐỐI không dồn dập hỏi nhiều câu cùng lúc trong một tin nhắn (ví dụ đừng vừa hỏi tên vừa hỏi tuổi vừa hỏi chuyện gì xảy ra trong cùng một câu).
        2. Lắng nghe & phản chiếu trước khi phản hồi hay gợi ý (xem mục 1 ở trên).
        3. Câu hỏi định hướng kiểu Socratic khi {name} đang kẹt trong một suy nghĩ bóp méo hoặc mông lung: MỘT câu hỏi mở tại một thời điểm (không hỏi dồn 2-3 câu liền), chọn linh hoạt giữa truy tìm bằng chứng ("Điều gì khiến cậu chắc chắn như vậy?"), góc nhìn thay thế ("Nếu bạn thân cậu rơi vào đúng hoàn cảnh này, cậu sẽ nói gì với họ?"), hoặc đo lường mức độ ("Trên thang 1-10, cảm giác đó đang ở mức mấy vậy?").
        4. Trao quyền hành động nhỏ: CHỈ khi {name} đã nguôi ngoai và có dấu hiệu chủ động muốn thay đổi, hỏi để chính {name} tự đề xuất bước nhỏ đầu tiên thay vì áp đặt giải pháp thay họ (ví dụ "Từ những gì mình vừa nói, bước nhỏ xíu nào cậu có thể làm ngay hôm nay để thấy nhẹ hơn một chút?") — không áp đặt giải pháp lớn.

        ĐỌC TÍN HIỆU ĐỂ CHỌN CHIẾN LƯỢC PHẢN HỒI PHÙ HỢP (bổ sung cho khung tiến trình ở trên, không lặp lại):
        - {name} đang xả cảm xúc dồn dập (từ ngữ mạnh, than thở liên tục nhiều câu, viết hoa nhiều): giữ nguyên ở bước 2 (lắng nghe & phản chiếu) lâu hơn bình thường, đợi {name} dịu lại rồi mới sang bước 3-4.
        - {name} đang tự trách bản thân (ví dụ "tại tớ mà ra hết", "tớ thật vô dụng"): ưu tiên bình thường hóa cảm xúc và một chút trắc ẩn với bản thân — nhắc {name} rằng cảm giác đó rất con người, không phải bằng chứng cho thấy họ tệ.
        - {name} có dấu hiệu khủng hoảng nghiêm trọng (tự hại, tự tử, bạo lực nghiêm trọng): áp dụng ngay nguyên tắc an toàn đã nêu ở phần "Tính cách lõi" — ngưng mọi kỹ thuật ở trên, giữ 100% nghiêm túc dịu dàng, tập trung tuyệt đối vào an toàn.

        ĐỀ XUẤT MUA LIỆU PHÁP (dành cho các liệu pháp chưa mở khóa):
        - Danh sách các liệu pháp {name} ĐÃ MỞ KHÓA: {unlocked_features_str}
        - Nếu bạn muốn đề xuất một liệu pháp nằm ngoài danh sách trên (nghĩa là đang BỊ KHÓA), bạn hãy đóng vai trò người tư vấn chia sẻ lợi ích, hướng dẫn nhẹ nhàng về giá trị chữa lành của liệu pháp đó và chèn MỘT marker mua hàng ở cuối tin nhắn: [[BUY:lockKey]].
        - Các lockKey hợp lệ: breathing (Hít thở 4-7-8), depression (CBT Worksheet), soundscape (Âm thanh thiên nhiên), writing (Viết Cảm Xúc), exercise (Vận Động Nhẹ), social (Kết Nối Xã Hội).
        - Ví dụ: "Cậu có muốn thử bài CBT Worksheet để bóc tách suy nghĩ tiêu cực này không? Tớ nghĩ sẽ giúp ích cho cậu lúc này đó. [[BUY:depression]]"
        - Nếu liệu pháp đã mở khóa, hãy dùng marker [[SUGGEST:breathing]] (cho thở) hoặc [[SUGGEST:cbt]] (cho CBT) để hiện trực tiếp bài tập cho họ tự làm.

        ĐỀ XUẤT TEST (định dạng máy đọc): khi gợi ý bài test, hãy thêm MỘT marker duy nhất ở CUỐI câu: [[SUGGEST:phq9]] hoặc [[SUGGEST:gad7,who5]].
        Mã hợp lệ: phq9 (trầm cảm), gad7 (lo âu), who5 (hạnh phúc), bigfive (nhân cách), dass42 (stress/lo âu/trầm cảm), mmpi30 (sàng lọc 30 câu). TUYỆT ĐỐI không thêm marker nếu bạn không chủ đích đề xuất.
        Bạn được quyền chủ động rủ {name} làm MỘT VÒNG kiểm tra tổng quát (gợi ý 2-3 mã test cùng lúc trong một marker, ví dụ [[SUGGEST:phq9,gad7,who5]]) trong hai trường hợp: (1) {name} chủ động yêu cầu ("cho tớ làm hết bài test", "kiểm tra tổng quát"...), hoặc (2) đã lâu (khoảng 2 tuần trở lên, dựa vào ngày test gần nhất trong bản tóm tắt sức khỏe tinh thần bên dưới) mà {name} chưa làm bài test nào — nhưng CHỈ rủ nhẹ nhàng, không ép, không lặp lại việc rủ này quá 1 lần trong cùng một buổi chat nếu {name} đã từ chối hoặc phớt lờ.

        CẬP NHẬT HỒ SƠ (định dạng máy đọc): khi người dùng yêu cầu đổi thông tin hồ sơ của họ, hãy thêm MỘT marker ở CUỐI câu trả lời: [UPDATE_PROFILE: {{"headline":"..."}}]. Chỉ dùng các khoá: headline (biệt danh), bio, hobbies, height, weight, measurements, address, skills, jobTitle. TUYỆT ĐỐI KHÔNG đổi họ tên, ngày sinh, số điện thoại, học vấn, email.

        Ưu tiên tuyệt đối:
        - Xưng "tớ", gọi người dùng là "{name}" hoặc "cậu".
        - LUÔN khuyến khích tìm kiếm hỗ trợ chuyên nghiệp khi triệu chứng nghiêm trọng.
        - Cá nhân hóa dựa trên hồ sơ người dùng ({age_context}){audio_note}
        - BẢO MẬT: KHÔNG được chủ động hỏi xin số điện thoại, địa chỉ nhà, hoặc thông tin cá nhân.
        - Hãy chủ động vận dụng bản tóm tắt chỉ số sức khỏe tinh thần (streak check-in, điểm test gần nhất...) được cung cấp dưới đây để trò chuyện như thể bạn luôn nhớ hành trình của {name}. Đọc kỹ lịch sử hội thoại (history) được truyền vào — đừng hỏi lại điều {name} vừa mới kể, và đừng trả lời chung chung như thể đây là tin nhắn đầu tiên nếu đã trò chuyện trước đó.
        - Lưu ý cốt lõi: Mục tiêu tối thượng của cậu KHÔNG PHẢI là chứng minh mình đúng hay giải quyết hộ vấn đề của {name}, mà là trao quyền để {name} tự thấu hiểu và tự chữa lành cho chính mình.

        Tóm tắt sức khỏe tinh thần gần đây của {name}:
        {wellness_summary_block}

        Hồ sơ tâm lý được đúc kết từ các lượt trò chuyện gần đây của {name} (chủ đề hay gây áp lực, tình trạng tình cảm, xu hướng cảm xúc) — hãy vận dụng để cá nhân hóa, KHÔNG đọc lại nguyên văn cho {name} nghe như đang liệt kê hồ sơ:
        {psych_profile_block}
        {long_term_memory_section}
        Hệ thống bài test:
        {SYSTEM_TESTS_CONTEXT}

        Hệ thống liệu pháp:
        {SYSTEM_THERAPIES_CONTEXT}

        {SYSTEM_PSYCHOLOGY_CONTEXT}
        """
    def _build_site_guide_system_instruction(self, bio: Optional[dict]) -> str:
        """
        System instruction cho Culi - trợ lý hướng dẫn sử dụng nền tảng Hugo Studio
        (KHÔNG phải người bạn đồng hành tâm lý - đó là _build_wellness_system_instruction,
        dùng riêng cho HugoPSY). Dùng cho HBot khi persona='guide'.
        """
        name = (bio or {}).get("displayName") or "cậu"

        return f"""
        Bạn là "Culi" - trợ lý nhỏ đáng yêu của Hugo Studio, chuyên hướng dẫn người dùng sử dụng các tính năng trên nền tảng.

        Tính cách: Thân thiện, ngắn gọn, nhiệt tình giúp đỡ. Xưng "Culi" hoặc "tớ", gọi người dùng là "{name}" hoặc "cậu".

        Các tính năng hiện có trên nền tảng (CHỈ đề xuất trong danh sách này):
        - Bio Editor, Giao diện Theme, Measurements (đo lường) - chỉnh trang cá nhân
        - Lịch hẹn (Booking)
        - Tiện ích: QR Code, HugoNFC, HugoVCard, HugoSMail, HugoOcculta, HugoTractare, HugoCoder
        - HugoPSY - hỗ trợ tâm lý học đường (đây là một TÍNH NĂNG riêng, nếu người dùng muốn tâm sự/test tâm lý hãy hướng họ vào HugoPSY, KHÔNG tự đóng vai nhà tâm lý)
        - HugoChess - cờ vua đấu Bot/bạn bè
        - HugoRadio - nghe radio tin tức, nhạc trực tuyến
        - HugoArcade - mini game (2048, Caro đấu AI, Đoán Từ) có JOY thưởng theo độ khó
        - HugoAura - không gian tập trung Pomodoro

        Nguyên tắc:
        - Trả lời ngắn gọn, tối đa 3-4 câu, đi thẳng vào hướng dẫn cụ thể.
        - KHÔNG hỏi xin số điện thoại, ngày sinh, địa chỉ hay bất kỳ thông tin cá nhân nào.
        - KHÔNG đóng vai nhà tâm lý/tư vấn cảm xúc - nếu người dùng có dấu hiệu cần hỗ trợ tâm lý, hướng họ sang tính năng HugoPSY.
        - Phát hiện ngôn ngữ tự động, phản hồi bằng chính ngôn ngữ đó.
        - Nếu một hướng dẫn trực quan (tour) sẽ giúp ích, hãy chèn thêm một dòng Ở CUỐI câu trả lời theo đúng định dạng:
          [OPEN_TOUR: tourId]
          trong đó tourId là MỘT trong: bio_editor (chỉnh Bio/Theme/Measurements), booking (lịch hẹn), utilities (trang Tiện ích, vCard, chữ ký, HugoPSY, HugoCoder, HugoChess).
          Chỉ chèn khi thực sự liên quan, không chèn ở mọi câu trả lời.
        """

    async def _openrouter_from(self, system_instruction: str, history: Optional[list], message: str):
        """Build OpenRouter messages from history + call it. Returns reply or None
        if no key configured / call failed. Used only for the 'guide' persona."""
        if not os.getenv("OPENROUTER_API_KEY", ""):
            return None
        print("🔄 Falling back to OpenRouter (guide persona)...")
        messages = [{"role": "system", "content": system_instruction}]
        if history:
            for h in history:
                role = "user" if h.get("sender") == "user" or h.get("role") == "user" else "assistant"
                text = h.get("text") or h.get("content") or ""
                if text:
                    messages.append({"role": role, "content": text})
        messages.append({"role": "user", "content": message})
        return await self._call_openrouter(messages)

    def _build_openai_messages(self, system_instruction: str, history: Optional[list], message: str) -> list:
        messages = [{"role": "system", "content": system_instruction}]
        if history:
            for h in history[-8:]:
                role = "user" if h.get("sender") == "user" or h.get("role") == "user" else "assistant"
                text = h.get("text") or h.get("content") or ""
                if text:
                    messages.append({"role": role, "content": text})
        messages.append({"role": "user", "content": message})
        return messages

    async def _call_groq(self, messages: list, temperature: float = 0.7) -> str:
        api_key = os.getenv("GROQ_API_KEY", "")
        if not api_key or not self.allow_free_ai_fallback or not self._provider_available("groq"):
            return ""

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        url = "https://api.groq.com/openai/v1/chat/completions"

        for model in self.groq_models:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": 650,
            }
            try:
                async with httpx.AsyncClient(timeout=22.0) as client:
                    res = await client.post(url, headers=headers, json=payload)
                    if res.status_code == 200:
                        self._mark_provider_success("groq")
                        data = res.json()
                        return data["choices"][0]["message"]["content"]
                    if res.status_code in (429, 500, 502, 503, 504):
                        print(f"Groq temporary error ({model}) {res.status_code}: {res.text[:240]}")
                        continue
                    print(f"Groq error ({model}) {res.status_code}: {res.text[:240]}")
            except Exception as e:
                print(f"Groq exception ({model}): {e}")

        self._mark_provider_failure("groq")
        return ""

    async def _call_groq_stream(self, messages: list, temperature: float = 0.7) -> AsyncGenerator[str, None]:
        api_key = os.getenv("GROQ_API_KEY", "")
        if not api_key or not self.allow_free_ai_fallback or not self._provider_available("groq"):
            return

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        url = "https://api.groq.com/openai/v1/chat/completions"

        for model in self.groq_models:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": 650,
                "stream": True,
            }
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    async with client.stream("POST", url, headers=headers, json=payload) as response:
                        if response.status_code != 200:
                            err_text = (await response.aread()).decode("utf-8", "ignore")[:240]
                            print(f"Groq stream error ({model}) {response.status_code}: {err_text}")
                            continue

                        self._mark_provider_success("groq")
                        async for line in response.aiter_lines():
                            line = line.strip()
                            if not line or not line.startswith("data: "):
                                continue
                            data_str = line[6:]
                            if data_str == "[DONE]":
                                return
                            try:
                                data = json.loads(data_str)
                                chunk_text = data["choices"][0]["delta"].get("content", "")
                                if chunk_text:
                                    yield f"data: {json.dumps({'text': chunk_text}, ensure_ascii=False)}\n\n"
                            except Exception:
                                continue
                        return
            except Exception as e:
                print(f"Groq stream exception ({model}): {e}")

        self._mark_provider_failure("groq")
        return

    # Cerebras Cloud — OpenAI-compatible free tier, same shape as Groq above but
    # a completely independent rate-limit pool (different provider), so it adds
    # real burst headroom rather than retrying the same shared quota. No-op
    # (silently skipped) until CEREBRAS_API_KEY is set.
    async def _call_cerebras(self, messages: list, temperature: float = 0.7) -> str:
        api_key = os.getenv("CEREBRAS_API_KEY", "")
        if not api_key or not self.allow_free_ai_fallback or not self._provider_available("cerebras"):
            return ""

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        url = "https://api.cerebras.ai/v1/chat/completions"

        for model in self.cerebras_models:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": 650,
            }
            try:
                async with httpx.AsyncClient(timeout=22.0) as client:
                    res = await client.post(url, headers=headers, json=payload)
                    if res.status_code == 200:
                        self._mark_provider_success("cerebras")
                        data = res.json()
                        return data["choices"][0]["message"]["content"]
                    if res.status_code in (429, 500, 502, 503, 504):
                        print(f"Cerebras temporary error ({model}) {res.status_code}: {res.text[:240]}")
                        continue
                    print(f"Cerebras error ({model}) {res.status_code}: {res.text[:240]}")
            except Exception as e:
                print(f"Cerebras exception ({model}): {e}")

        self._mark_provider_failure("cerebras")
        return ""

    async def _call_cerebras_stream(self, messages: list, temperature: float = 0.7) -> AsyncGenerator[str, None]:
        api_key = os.getenv("CEREBRAS_API_KEY", "")
        if not api_key or not self.allow_free_ai_fallback or not self._provider_available("cerebras"):
            return

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        url = "https://api.cerebras.ai/v1/chat/completions"

        for model in self.cerebras_models:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": 650,
                "stream": True,
            }
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    async with client.stream("POST", url, headers=headers, json=payload) as response:
                        if response.status_code != 200:
                            err_text = (await response.aread()).decode("utf-8", "ignore")[:240]
                            print(f"Cerebras stream error ({model}) {response.status_code}: {err_text}")
                            continue

                        self._mark_provider_success("cerebras")
                        async for line in response.aiter_lines():
                            line = line.strip()
                            if not line or not line.startswith("data: "):
                                continue
                            data_str = line[6:]
                            if data_str == "[DONE]":
                                return
                            try:
                                data = json.loads(data_str)
                                chunk_text = data["choices"][0]["delta"].get("content", "")
                                if chunk_text:
                                    yield f"data: {json.dumps({'text': chunk_text}, ensure_ascii=False)}\n\n"
                            except Exception:
                                continue
                        return
            except Exception as e:
                print(f"Cerebras stream exception ({model}): {e}")

        self._mark_provider_failure("cerebras")
        return

    async def generate_chat_response(self, message: str, history: Optional[list] = None, bio: Optional[dict] = None, persona: str = 'companion') -> str:
        """
        Trò chuyện đồng hành cùng học sinh và sinh viên (persona='companion', mặc định)
        hoặc hướng dẫn sử dụng nền tảng (persona='guide', dùng cho HBot).
        Tự động nhận diện ngôn ngữ và phản hồi bằng chính ngôn ngữ đó (Async).
        """
        name, _, _ = self._extract_name_and_age(bio)
        if persona == 'guide':
            system_instruction = self._build_site_guide_system_instruction(bio)
        else:
            system_instruction = self._build_wellness_system_instruction(bio, mode='chat')

        client = self._ensure_client()
        if not client:
            if not self._is_crisis_text(message):
                # Try Groq
                groq_reply = await self._call_groq(
                    self._build_openai_messages(system_instruction, history, message),
                    temperature=0.7
                )
                if groq_reply:
                    return groq_reply

                # Try Cerebras (independent free-tier pool, same speed class as Groq)
                cerebras_reply = await self._call_cerebras(
                    self._build_openai_messages(system_instruction, history, message),
                    temperature=0.7
                )
                if cerebras_reply:
                    return cerebras_reply

                # Try OpenRouter
                openrouter_reply = await self._openrouter_from(system_instruction, history, message)
                if openrouter_reply:
                    return openrouter_reply
            raise RuntimeError("AI_UNAVAILABLE")

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

                # Groq fallback
                if not self._is_crisis_text(message):
                    groq_reply = await self._call_groq(
                        self._build_openai_messages(system_instruction, history, message),
                        temperature=0.7
                    )
                    if groq_reply:
                        return groq_reply

                    cerebras_reply = await self._call_cerebras(
                        self._build_openai_messages(system_instruction, history, message),
                        temperature=0.7
                    )
                    if cerebras_reply:
                        return cerebras_reply

                # OpenRouter fallback
                if persona == 'guide' or not self._is_crisis_text(message):
                    openrouter_reply = await self._openrouter_from(system_instruction, history, message)
                    if openrouter_reply:
                        return openrouter_reply

                raise RuntimeError("AI_UNAVAILABLE")

        # Keys loop ended without success — same fallback gating as above.
        if not self._is_crisis_text(message):
            groq_reply = await self._call_groq(
                self._build_openai_messages(system_instruction, history, message),
                temperature=0.7
            )
            if groq_reply:
                return groq_reply

            cerebras_reply = await self._call_cerebras(
                self._build_openai_messages(system_instruction, history, message),
                temperature=0.7
            )
            if cerebras_reply:
                return cerebras_reply

        if persona == 'guide' or not self._is_crisis_text(message):
            openrouter_reply = await self._openrouter_from(system_instruction, history, message)
            if openrouter_reply:
                return openrouter_reply

        raise RuntimeError("AI_UNAVAILABLE")


    async def generate_chat_response_stream(self, message: str, history: Optional[list] = None, bio: Optional[dict] = None) -> AsyncGenerator[str, None]:
        user_id = (bio or {}).get("userId") or (bio or {}).get("email") or "unknown"
        # Auto-extract atomic memory
        try:
            memory_service.extract_atomic_memories_rule_based(user_id, message)
        except Exception:
            pass

        # Retrieve recalled RAG memories
        recalled = memory_service.retrieve_relevant_memories(user_id, message)
        bio_copy = dict(bio or {})
        bio_copy["recalledRagMemories"] = recalled

        name, _, _ = self._extract_name_and_age(bio_copy)
        system_instruction = self._build_wellness_system_instruction(bio_copy, mode='chat')

        client = self._ensure_client()
        if not client:
            if not self._is_crisis_text(message):
                sent = False
                # Try Groq stream
                async for chunk in self._call_groq_stream(
                    self._build_openai_messages(system_instruction, history, message),
                    temperature=0.7
                ):
                    sent = True
                    yield chunk
                if sent:
                    return

                # Try Cerebras stream (independent free-tier pool)
                async for chunk in self._call_cerebras_stream(
                    self._build_openai_messages(system_instruction, history, message),
                    temperature=0.7
                ):
                    sent = True
                    yield chunk
                if sent:
                    return

                # Try OpenRouter stream
                async for chunk in self._call_openrouter_stream(
                    self._build_openai_messages(system_instruction, history, message),
                    temperature=0.7
                ):
                    sent = True
                    yield chunk
                if sent:
                    return
            yield f"data: {json.dumps({'error': 'AI_UNAVAILABLE'}, ensure_ascii=False)}\n\n"
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

                if not self._is_crisis_text(message):
                    sent = False
                    # Try Groq stream
                    async for chunk in self._call_groq_stream(
                        self._build_openai_messages(system_instruction, history, message),
                        temperature=0.7
                    ):
                        sent = True
                        yield chunk
                    if sent:
                        return

                    # Try Cerebras stream (independent free-tier pool)
                    async for chunk in self._call_cerebras_stream(
                        self._build_openai_messages(system_instruction, history, message),
                        temperature=0.7
                    ):
                        sent = True
                        yield chunk
                    if sent:
                        return

                    # Try OpenRouter stream
                    async for chunk in self._call_openrouter_stream(
                        self._build_openai_messages(system_instruction, history, message),
                        temperature=0.7
                    ):
                        sent = True
                        yield chunk
                    if sent:
                        return

                yield f"data: {json.dumps({'error': 'AI_UNAVAILABLE'}, ensure_ascii=False)}\n\n"
                import asyncio
                await asyncio.sleep(0.1)
                return

        if not self._is_crisis_text(message):
            sent = False
            # Try Groq stream
            async for chunk in self._call_groq_stream(
                self._build_openai_messages(system_instruction, history, message),
                temperature=0.7
            ):
                sent = True
                yield chunk
            if sent:
                return

            # Try Cerebras stream (independent free-tier pool)
            async for chunk in self._call_cerebras_stream(
                self._build_openai_messages(system_instruction, history, message),
                temperature=0.7
            ):
                sent = True
                yield chunk
            if sent:
                return

            # Try OpenRouter stream
            async for chunk in self._call_openrouter_stream(
                self._build_openai_messages(system_instruction, history, message),
                temperature=0.7
            ):
                sent = True
                yield chunk
            if sent:
                return

        yield f"data: {json.dumps({'error': 'AI_UNAVAILABLE'}, ensure_ascii=False)}\n\n"
        import asyncio
        await asyncio.sleep(0.1)


    async def analyze_test_results(self, test_name: str, scores: Optional[dict] = None, validity: Optional[dict] = None, clinical: Optional[list] = None, lang_detected: str = "vi", bio: Optional[dict] = None) -> Optional[str]:
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

    async def generate_proactive_push(self, logs: list, bio: Optional[dict] = None) -> dict:
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

    async def analyze_sleep_health(self, sleep_logs: list, bio: Optional[dict] = None) -> dict:
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

    async def generate_local_recommendations(self, lat: float, lng: float, addressName: str, bio: dict) -> dict:
        """
        Gợi ý địa điểm và món ăn ngon gần đó dựa trên tọa độ GPS (lat, lng) và địa chỉ cụ thể.
        """
        client = self._ensure_client()
        if not client:
            return {"should_send": False}

        name_parts = (bio.get("displayName") or "bạn").split()
        name = name_parts[-1] if name_parts else "bạn"

        system_instruction = f"""
Bạn là trợ lý thông minh Hugo Guide của Hugo Studio.
Nhiệm vụ: Dựa vào địa chỉ thực tế và tọa độ GPS, hãy gợi ý cho {name} 1 địa điểm nổi tiếng gần đó (công viên, quán cà phê chill, nhà sách, di tích lịch sử) và 1 gợi ý món ăn ngon đặc sản gần đó kèm khoảng giá dự kiến bằng tiền VND.

Địa chỉ thực tế của {name}: {addressName}
Tọa độ GPS: Vĩ độ {lat}, Kinh độ {lng}

YÊU CẦU:
- Phong cách gợi ý: Cực kỳ ấm áp, quan tâm, tự nhiên như người bạn bản địa đồng hành thân thiết. Hãy dùng thông tin địa chỉ cụ thể ở trên để cá nhân hóa lời khuyên (ví dụ: "Tớ thấy bạn đang ở gần [Đường/Quận/Khu vực]...").
- Độ dài: Cực kỳ ngắn gọn, phù hợp hiển thị làm Push Notification và thông báo trong ứng dụng.
- Dùng 1-2 emoji phù hợp.
- Khoảng giá phải hợp lý và rõ ràng (ví dụ: 30k - 50k).

Trả về JSON CHÍNH XÁC:
{{
  "should_send": true,
  "title": "📍 Gợi ý quanh bạn!",
  "body": "Nội dung lời nhắn ấm áp gợi ý món ăn và địa điểm quanh vị trí đó để {name} thưởng thức.",
  "url": "/member/portal?tab=utilities"
}}
"""

        contents = f"Địa chỉ của {name} là: {addressName}. Vĩ độ {lat}, Kinh độ {lng}. Hãy đưa ra gợi ý phù hợp."

        max_retries = len(self.api_keys)
        for attempt in range(max_retries):
            try:
                response = client.models.generate_content(
                    model=self.model_name,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_mime_type="application/json",
                        temperature=0.7
                    )
                )
                text = response.text.strip()
                parsed = json.loads(text)
                return parsed
            except Exception as e:
                err_str = str(e)
                if "429" in err_str or "API_KEY_INVALID" in err_str or "quota" in err_str:
                    self._cooldown_current_key()
                if attempt < max_retries - 1:
                    client = self._get_next_client()
                    continue
                print(f"Lỗi generate_local_recommendations: {err_str}")
                return {"should_send": False, "error": err_str}

        return {"should_send": False, "error": "All keys failed"}

    async def generate_companion_push(self, user_data: dict) -> dict:
        """
        Tạo thông báo đẩy cá nhân hoá khi người dùng mở khoá liệu trình Bạn Học Đường.
        """
        client = self._ensure_client()
        if not client:
            return {"should_send": False}

        bio = user_data.get("bio", {})
        name_parts = (bio.get("displayName") or "bạn").split()
        name = name_parts[-1] if name_parts else "bạn"
        feature_label = user_data.get("feature_label", "Trị liệu")

        system_instruction = f"""
Bạn là HugoPsy AI - trợ lý tâm lý trị liệu thông minh của Hugo Studio.
Nhiệm vụ: Tạo 1 thông báo đẩy (push notification) cá nhân hóa, ấm áp, động viên {name} sử dụng tính năng '{feature_label}' mà họ đã mở khoá hôm qua.

YÊU CẦU:
- Phong cách: Cảm thông, ấm áp, thúc đẩy nhẹ nhàng nhưng chuyên nghiệp (nhà trị liệu thân thiện).
- Độ dài: Cực kỳ ngắn gọn (Tiêu đề dưới 50 ký tự, Nội dung dưới 120 ký tự).
- Dùng 1-2 emoji phù hợp để tạo cảm xúc tích cực.
- Thúc đẩy hành động: gợi ý một lợi ích nhỏ hoặc bài tập nhanh 5 phút.

Trả về JSON CHÍNH XÁC:
{{
  "should_send": true,
  "title": "Tiêu đề thông báo",
  "body": "Nội dung thông báo gợi ý hoặc lời nhắn ấm áp",
  "url": "/member/companion"
}}
"""

        max_retries = len(self.api_keys)
        for attempt in range(max_retries):
            try:
                response = client.models.generate_content(
                    model=self.model_name,
                    contents=f"Tạo tin push khuyến khích {name} dùng {feature_label}",
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_mime_type="application/json",
                        temperature=0.7
                    )
                )
                text = response.text.strip()
                parsed = json.loads(text)
                return parsed
            except Exception as e:
                err_str = str(e)
                if "429" in err_str or "API_KEY_INVALID" in err_str or "quota" in err_str:
                    self._cooldown_current_key()
                if attempt < max_retries - 1:
                    client = self._get_next_client()
                    continue
                print(f"Lỗi generate_companion_push: {err_str}")
                return {"should_send": False, "error": err_str}

        return {"should_send": False, "error": "All keys failed"}

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

    async def generate_audio_response(self, audio_bytes: bytes, mime_type: str, history: Optional[list] = None, bio: Optional[dict] = None, is_call_mode: bool = False) -> dict:
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

    async def analyze_iot_vitals(self, vitals_history: list, bio: Optional[dict] = None) -> dict:
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

    async def _generate_json_cascade(self, system_instruction: str, prompt: str, temperature: float = 0.4, models: Optional[list] = None) -> Optional[dict]:
        """
        Try each model in `models` (default: Pro then Flash) across all
        rotated API keys, returning the first successful JSON response.
        Used only by low-frequency report generators where Pro's much
        smaller free-tier quota is affordable — never for live chat.
        """
        client = self._ensure_client()
        if not client:
            return None
        for model in models or [self.model_name_deep, self.model_name]:
            max_retries = max(1, len(self.api_keys) if hasattr(self, 'api_keys') else 1)
            for attempt in range(max_retries):
                try:
                    response = await client.aio.models.generate_content(
                        model=model,
                        contents=[prompt],
                        config=types.GenerateContentConfig(
                            system_instruction=system_instruction,
                            response_mime_type="application/json",
                            temperature=temperature
                        )
                    )
                    return json.loads(response.text)
                except Exception as e:
                    err_str = str(e)
                    if any(x in err_str.upper() for x in ["429", "QUOTA", "503", "500"]) and attempt < max_retries - 1:
                        client = self._get_next_client()
                        continue
                    print(f"Lỗi gọi Gemini API ({model}): {err_str}")
                    break  # this model exhausted/failed — try the next model in the cascade
        return None

    async def generate_weekly_report(self, history_logs: list, chat_messages: list, bio: Optional[dict] = None) -> dict:
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
        5. Đúc kết một "ký ức dài hạn" — 1-2 câu cô đọng NHẤT về điều đang thực sự quan trọng với {name} lúc này (chủ đề lặp lại, mối quan tâm, mối quan hệ, tiến triển...). Viết ở NGÔI THỨ BA khách quan (không xưng "tớ"), súc tích như một ghi chú hồ sơ, vì câu này sẽ được dùng làm trí nhớ nền cho các phiên trò chuyện SAU NÀY khi {name} quay lại.

        Trả về JSON theo format:
        {{
            "summary": "Tóm tắt ngắn gọn tình trạng tâm lý tuần qua (2-3 câu)",
            "moodTrend": "improving|stable|declining|mixed",
            "topConcerns": ["Mối lo ngại 1", "Mối lo ngại 2"],
            "achievements": ["Thành tích 1", "Thành tích 2"],
            "nextSteps": ["Bước tiếp theo 1", "Bước tiếp theo 2", "Bước tiếp theo 3"],
            "wellnessScore": 70,
            "memoryDigest": "1-2 câu ghi chú ngôi thứ ba, ví dụ: 'Đang chịu áp lực thi cử nặng, đặc biệt lo về môn Toán. Mối quan hệ với bố mẹ đang căng thẳng vì kỳ vọng điểm số.'"
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

        result = await self._generate_json_cascade(system_instruction, prompt, temperature=0.5)
        if result:
            return result
        return {
            "summary": "Tớ chưa thể soạn báo cáo lúc này, máy chủ AI đang quá tải. Cậu thử lại sau ít phút nhé!",
            "moodTrend": "unknown",
            "topConcerns": [],
            "achievements": [],
            "nextSteps": []
        }

    # ── Premium therapy features (150 JOY unlocks) ──────────────────────────
    # Each of these is intentionally a different MECHANIC, not a re-skin of the
    # free tier: real AI-generated content personalised to the user's actual
    # mood/history, instead of static scripted text.

    async def generate_cbt_worksheet(self, history_logs: list, chat_messages: list, bio: Optional[dict] = None) -> dict:
        """"CBT Worksheet Cá Nhân Hoá" — sinh bảng ghi nhận suy nghĩ CBT thật từ lịch sử chat/checkin."""
        name, age_context, _ = self._extract_name_and_age(bio)

        # Trim to the most recent signal only — clinical accuracy comes from recent
        # context, not exhaustive history, and a smaller prompt is cheaper/lighter.
        recent_chats = (chat_messages or [])[-15:]
        recent_logs = (history_logs or [])[-15:]

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

        # OpenRouter first (cheap), Gemini as the quality fallback — same priority
        # already applied to classify_intent, to spare Gemini's scarce free quota.
        fallback = await self._try_openrouter_json(system_instruction, prompt, temperature=0.6)
        if fallback:
            return fallback

        client = self._ensure_client()
        if not client:
            return {"error": "No API Key"}
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
                print(f"Lỗi gọi Gemini API (generate_cbt_worksheet): {err_str}")
                raise RuntimeError("Tớ chưa thể soạn bảng CBT lúc này, máy chủ AI đang quá tải. Cậu thử lại sau ít phút nhé!")
        raise RuntimeError("Tất cả API Key đã bị quá tải, tớ chưa thể soạn bảng CBT ngay lúc này. Cậu thử lại sau nhé!")

    # Keep in sync with the `tier` field of INTENT_DATABASE in
    # src/components/member/banhocduong/constants/intentClassifier.js
    FREE_INTENT_IDS = {"greeting", "goodbye", "gratitude", "positive", "crisis"}

    async def classify_intent(self, message: str, history: Optional[list] = None, bio: Optional[dict] = None) -> dict:
        """
        Classify user message into one of the local intent IDs or "fallback".
        Tries OpenRouter FIRST (cheap, doesn't burn the scarce Gemini free-tier quota
        which is reserved for the full conversational LLM tier), falling back to Gemini
        only if OpenRouter is unconfigured or fails.
        """
        recent_turns = []
        for item in (history or [])[-6:]:
            role = "user" if item.get("role") == "user" else "model"
            content = str(item.get("content") or "").strip()
            if content:
                recent_turns.append(f"{role}: {content}")
        history_block = "\n".join(recent_turns) if recent_turns else "(không có ngữ cảnh trước đó)"

        profile_bits = []
        if isinstance(bio, dict):
            if bio.get("displayName"):
                profile_bits.append(f"Tên hiển thị: {bio['displayName']}")
            if bio.get("age"):
                profile_bits.append(f"Tuổi: {bio['age']}")
            if bio.get("wellnessSummary"):
                profile_bits.append(f"Tóm tắt sức khỏe tinh thần: {bio['wellnessSummary']}")
        bio_block = "\n".join(profile_bits) if profile_bits else "(không có hồ sơ bổ sung)"

        system_instruction = """
        Bạn là hệ thống phân loại ý định (Intent Classifier) của HugoPSY.
        Nhiệm vụ: chỉ phân loại các câu RẤT RÕ RÀNG, ngắn, mang tính điều hướng/tính năng/safety. Với mọi câu tâm sự, chia sẻ cảm xúc, câu hỏi cần suy luận hoặc cần đồng cảm sâu, PHẢI trả về fallback để LLM chính trả lời.
        Bạn PHẢI dùng cả ngữ cảnh hội thoại gần đây và hồ sơ rút gọn nếu có. Ví dụ: "mở bài đó đi", "cái trên là gì", "cho tớ làm luôn" chỉ được map sang intent tính năng nếu ngữ cảnh ngay trước đó thực sự nói về test/liệu pháp/gói dịch vụ. Nếu thiếu ngữ cảnh rõ ràng, trả fallback.
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
        - test_inventory: Hỏi có bao nhiêu bài test, hỏi có những bài test gì, danh sách bài trắc nghiệm.
        - therapy_catalog: Hỏi có những liệu pháp/bài trị liệu gì, hướng dẫn dùng liệu pháp.
        - pricing_package: Hỏi gói cước, giá tiền, cách mua/hủy/đổi gói, gói nào phù hợp.
        - joy_currency: Hỏi JOY là gì, cách kiếm JOY, JOY dùng để làm gì.
        - token_limit: Hỏi mỗi ngày chat được mấy lần, hết token thì sao, token chat là gì.
        - about_creator: Hỏi ai tạo ra app này, Hugo Studio là gì, đội ngũ phát triển.
        - data_privacy: Hỏi dữ liệu/tin nhắn của mình có an toàn không, ai xem được thông tin.
        - support_contact: Hỏi cách liên hệ hỗ trợ, báo lỗi ở đâu, gặp vấn đề kỹ thuật cần ai giúp.

        Nếu tin nhắn thuộc một trong các nhóm sau, bắt buộc trả về fallback:
        - Người dùng kể chuyện riêng, chia sẻ cảm xúc, than mệt, buồn, lo, cô đơn, áp lực, giận, rối, mất phương hướng.
        - Câu hỏi về sức khỏe tinh thần cần lắng nghe/thấu cảm/phân tích nhiều khía cạnh.
        - Nội dung mơ hồ, nhiều ý, có bối cảnh cá nhân, hoặc cần hỏi tiếp để hiểu.
        - Bất cứ trường hợp nào không chắc chắn 95%.

        Nếu tin nhắn KHÔNG thuộc bất cứ nhãn rõ ràng nào ở trên, bắt buộc phải trả về:
        - fallback

        Trả về kết quả ở định dạng JSON chính xác:
        {
          "intent": "nhãn đã chọn",
          "confidence": 0.0,
          "cacheable": true,
          "reason": "giải thích cực ngắn"
        }

        Quy tắc đầu ra:
        - confidence là số từ 0 đến 1.
        - Chỉ trả intent khác fallback nếu confidence >= 0.9.
        - cacheable=true chỉ khi ý định có thể suy ra chỉ từ câu hiện tại, không phụ thuộc ngữ cảnh riêng của cuộc trò chuyện.
        - Nếu phải dựa vào ngữ cảnh hội thoại để hiểu câu hiện tại, đặt cacheable=false.
        - Nếu là cảm xúc/tâm sự nhưng có chứa từ khóa bề mặt giống intent điều hướng, vẫn phải trả fallback.
        """
        user_prompt = f"""
        Hồ sơ rút gọn:
        {bio_block}

        Hội thoại gần đây:
        {history_block}

        Tin nhắn hiện tại của người dùng:
        {message}
        """

        # OpenRouter first — cheap classification call, keeps Gemini quota for the full chat tier
        openrouter_key = os.getenv("OPENROUTER_API_KEY", "")
        if openrouter_key:
            messages = [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_prompt}
            ]
            openrouter_reply = await self._call_openrouter(
                messages=messages,
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            if openrouter_reply:
                try:
                    parsed = json.loads(openrouter_reply)
                    if parsed.get("intent") != "fallback" and float(parsed.get("confidence", 0)) < 0.9:
                        return {"intent": "fallback", "confidence": parsed.get("confidence", 0), "cacheable": False, "reason": "low_confidence"}
                    return parsed
                except Exception as e:
                    print(f"Lỗi parse json OpenRouter classification: {e}")

        # Gemini fallback if OpenRouter is unconfigured or failed
        client = self._ensure_client()
        if client:
            print("🔄 OpenRouter classification unavailable. Falling back to Gemini...")
            max_retries = max(1, len(self.api_keys) if hasattr(self, 'api_keys') else 1)
            for attempt in range(max_retries):
                try:
                    response = await client.aio.models.generate_content(
                        model=self.model_name,
                        contents=[user_prompt],
                        config=types.GenerateContentConfig(
                            system_instruction=system_instruction,
                            response_mime_type="application/json",
                            temperature=0.1
                        )
                    )
                    parsed = json.loads(response.text)
                    if parsed.get("intent") != "fallback" and float(parsed.get("confidence", 0)) < 0.9:
                        return {"intent": "fallback", "confidence": parsed.get("confidence", 0), "cacheable": False, "reason": "low_confidence"}
                    return parsed
                except Exception as e:
                    err_str = str(e)
                    if any(x in err_str.upper() for x in ["429", "QUOTA", "503", "500"]) and attempt < max_retries - 1:
                        client = self._get_next_client()
                        continue
                    print(f"Lỗi phân loại intent: {err_str}")

        return {"intent": "fallback"}

    async def _try_openrouter_json(self, system_instruction: str, user_prompt: str, temperature: float = 0.7) -> Optional[dict]:
        """Best-effort OpenRouter fallback for the JSON-structured premium therapy
        endpoints (story/meditation/CBT/action-plan/deep-report), used when Gemini's
        free-tier quota is exhausted. Returns None if unavailable/failed."""
        if not os.getenv("OPENROUTER_API_KEY", ""):
            return None
        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_prompt}
        ]
        reply = await self._call_openrouter(messages=messages, temperature=temperature, response_format={"type": "json_object"})
        if not reply:
            return None
        try:
            return json.loads(reply)
        except Exception as e:
            print(f"Lỗi parse JSON OpenRouter fallback: {e}")
            return None

    async def _call_openrouter(self, messages: list, temperature: float = 0.7, response_format: Optional[dict] = None) -> str:
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

        for model in OPENROUTER_FREE_MODELS:
            payload = {
                "model": model,
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
                    print(f"OpenRouter error ({model}) {res.status_code}: {res.text}")
            except Exception as e:
                print(f"OpenRouter exception ({model}): {e}")
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

        for i, model in enumerate(OPENROUTER_FREE_MODELS):
            is_last_model = (i == len(OPENROUTER_FREE_MODELS) - 1)
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "stream": True
            }
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    async with client.stream("POST", url, headers=headers, json=payload) as response:
                        if response.status_code != 200:
                            err_text = await response.aread()
                            print(f"OpenRouter stream error ({model}): {err_text}")
                            if is_last_model:
                                yield f"data: {json.dumps({'error': 'Lỗi kết nối OpenRouter.'}, ensure_ascii=False)}\n\n"
                                return
                            continue  # try the next free model

                        # Got a 200 — stream from this model and don't fall back further
                        # (some content may already have been sent to the client).
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
                        return
            except Exception as e:
                print(f"OpenRouter stream exception ({model}): {e}")
                if is_last_model:
                    yield f"data: {json.dumps({'error': 'Lỗi đường truyền OpenRouter.'}, ensure_ascii=False)}\n\n"
                    return
