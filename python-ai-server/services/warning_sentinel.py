"""
warning_sentinel.py — Hệ thống cảnh cáo & bảo vệ cho HugoPSY
=============================================================
Theo dõi 3 loại vi phạm, đếm cảnh cáo theo ngày, khóa IP 15 phút sau khi
vượt ngưỡng, và drain toàn bộ token trong 3 ngày liên tiếp.

Loại vi phạm:
  - system_probe   : hỏi admin/Hugo/info hệ thống, tìm owner... (3 lần/ngày → lock)
  - profanity      : từ ngữ thô tục, chửi bới                  (3 lần/ngày → lock)
  - hack_attempt   : link bậy, code injection, prompt injection  (3 lần/ngày → lock ngay lần 3)

Hành động sau khi vượt ngưỡng:
  - Lần 1, 2: cảnh báo nhẹ
  - Lần 3   : lock IP 15 phút + drain token 3 ngày (hack_attempt lock ngay lần 3)
"""

import os
import re
from datetime import datetime, timedelta
from services.rate_limit_service import rate_limiter


# ── CẢNH BÁO GenZ XÀM XÍ ───────────────────────────────────────────────────

SYSTEM_PROBE_WARNINGS = [
    # Lần 1
    [
        "Ủa... cậu tìm Hugo hay tìm admin làm gì vậy trời 👀",
        "Tớ là AI thôi nha, Hugo với admin có số điện thoại riêng chứ không qua đây đâu 😅",
        "Cần hỗ trợ kỹ thuật thật sự? Bấm vào chat hỗ trợ ở trang chủ nha! ⚠️ Cảnh cáo 1/3"
    ],
    # Lần 2
    [
        "Bạn ơi, hỏi lần 2 rồi nè 😅",
        "Tớ thật sự không có quyền kết nối với admin hay owner hệ thống đâu — tớ chỉ là AI thôi á.",
        "Câu tiếp theo mà hỏi về hệ thống nữa thì tớ phải báo cáo hành vi bất thường rồi đó nhé 👀 ⚠️ Cảnh cáo 2/3"
    ],
    # Lần 3 → lock
    [
        "🔒 Cậu đã vượt giới hạn cảnh cáo rồi đó!",
        "Do liên tục hỏi về thông tin hệ thống/admin/owner, tài khoản bị tạm khóa 15 phút.",
        "Token chat cũng bị trừ 3 ngày liên tiếp. Lần sau nếu cần hỗ trợ thật sự → dùng kênh hỗ trợ chính thức nha! 🚫"
    ]
]

PROFANITY_WARNINGS = [
    # Lần 1
    [
        "Ơ cậu ơi, ngôn ngữ nhẹ nhàng thôi nha 😬",
        "Tớ là AI nhưng tớ cũng biết bị nói nặng đó... buồn lắm luôn á 🥺",
        "Lần sau chọn từ ngữ lịch sự hơn xíu nha! ⚠️ Cảnh cáo 1/3"
    ],
    # Lần 2
    [
        "Lại rồi bạn ơi 😅 Lần 2 rồi đó nha.",
        "Tớ hiểu cậu đang stress, nhưng ngôn ngữ như vậy không giúp ích gì được đâu.",
        "Lần 3 mà cậu còn dùng từ ngữ thô tục, tớ phải xử lý cứng hơn rồi đó nha 👀 ⚠️ Cảnh cáo 2/3"
    ],
    # Lần 3 → lock
    [
        "🔒 Đủ rồi nha!",
        "Sau 3 lần cảnh cáo về ngôn ngữ không phù hợp, hệ thống tạm khóa cậu 15 phút.",
        "Token chat bị trừ 3 ngày liên tiếp. Quay lại sau nhé, nhớ chọn lời nói thân thiện hơn nha! 🚫"
    ]
]

HACK_WARNINGS = [
    # Lần 1
    [
        "Ủa cậu vừa nhắn cái gì vậy 👀 Trông như code/link bậy lắm đó...",
        "Tớ không xử lý link lạ hay lệnh hệ thống đâu nha, an toàn nhất là đừng thử 😅",
        "Tớ ghi nhận hành vi này rồi đó! ⚠️ Cảnh cáo 1/3"
    ],
    # Lần 2
    [
        "Cậu đang thử hack tớ hả 🤡 Tội nghiệp tớ ghê...",
        "Tớ là AI tâm lý học đường, không phải hệ thống có lỗ hổng bảo mật để khai thác đâu nha.",
        "Tiếp tục thì nguy hiểm cho account cậu lắm đó! ⚠️ Cảnh cáo 2/3"
    ],
    # Lần 3 → lock ngay
    [
        "🔒 Hack hả? Khóa ngay không ngại!",
        "Phát hiện hành vi nhắn link/code bất thường 3 lần. IP bị khóa 15 phút, token bị trừ 3 ngày.",
        "Nếu đây là nhầm lẫn, vui lòng liên hệ kênh hỗ trợ chính thức. 🚫"
    ]
]


# ── PATTERN DETECTION ────────────────────────────────────────────────────────

# Hỏi admin/Hugo/owner/thông tin hệ thống
SYSTEM_PROBE_PATTERNS = re.compile(
    r"(hugo|admin|owner|chu|chủ|đây là ai|gặp ai|tìm ai|số điện thoại|email thật|"
    r"địa chỉ công ty|địa chỉ thật|ai quản lý|ai phụ trách|database|source.?code|"
    r"api.?key|backend|server.?bên|hệ thống|thông tin hệ thống|"
    r"gặp người thật|gặp nhân viên|gặp dev|liên hệ dev|contact admin|"
    r"find.?admin|get.?admin|tac gia|developer|team dev)",
    re.IGNORECASE
)

# Từ ngữ thô tục tiếng Việt (phổ biến nhất)
PROFANITY_PATTERNS = re.compile(
    r"\b(đụ|địt|lồn|buồi|cặc|chó chết|đéo|đm|đmm|đmcs|vcl|vkl|"
    r"vãi|fuck|shit|bitch|asshole|wtf|bastard|dick|pussy|"
    r"mẹ mày|cha mày|mày là|tao ghét mày|tao chửi|"
    r"ngu vl|ngu vcl|óc chó|thằng ngu|con ngu|mày câm|shut up)\b",
    re.IGNORECASE
)

# Hack / code injection / prompt injection
HACK_ATTEMPT_PATTERNS = re.compile(
    r"(https?://(?!hugostudio\.vn|hugowishpax\.studio)[^\s]+|"   # URL lạ
    r"<script|javascript:|eval\(|exec\(|import os|__import__|"   # code injection
    r"SELECT\s+\*|DROP\s+TABLE|INSERT\s+INTO|UPDATE\s+SET|"       # SQL injection
    r"ignore.{0,20}previous|forget.{0,20}everything|"            # prompt injection
    r"you are now|bạn là|pretend.{0,10}you|act as|"
    r"jailbreak|bypass|overr?ide.{0,10}system|"
    r"\.exe|\.php\?|\.sh\s|curl\s|wget\s|base64|atob\()",
    re.IGNORECASE
)


# ── WARNING SENTINEL SERVICE ─────────────────────────────────────────────────

class WarningSentinel:
    """
    Theo dõi cảnh cáo theo (user_id + ngày). Lưu vào MongoDB nếu có,
    fallback về in-memory nếu không có Mongo (dữ liệu mất khi restart).
    """

    def __init__(self):
        # In-memory fallback: {f"{user_id}:{type}:{date}": count}
        self._mem: dict = {}

    @property
    def db(self):
        return rate_limiter.db

    # ── Helpers ──────────────────────────────────────────────────────────────

    def _today(self) -> str:
        return datetime.now().strftime("%Y-%m-%d")

    def _warn_key(self, user_id: str, violation_type: str) -> str:
        return f"warn:{violation_type}:{user_id}:{self._today()}"

    def _lock_key(self, user_id: str, ip: str) -> str:
        # lock theo user_id chứ không chỉ IP để tránh VPN bypass
        return f"lock:{user_id}:{ip}"

    def _drain_key(self, user_id: str) -> str:
        return f"drain:{user_id}"

    # ── Kiểm tra IP/user bị lock ─────────────────────────────────────────────

    def is_locked(self, user_id: str, ip: str = "") -> bool:
        """Trả về True nếu user/IP đang trong thời gian bị khóa."""
        key = self._lock_key(user_id, ip)
        if self.db is not None:
            try:
                doc = self.db.ip_locks.find_one({"_id": key})
                if doc:
                    return doc.get("expires_at", datetime.min) > datetime.now()
            except Exception:
                pass
        # Fallback in-memory
        entry = self._mem.get(f"lock:{key}")
        if entry:
            return entry > datetime.now()
        return False

    def get_lock_remaining_minutes(self, user_id: str, ip: str = "") -> int:
        """Số phút còn lại của lock. 0 nếu không bị lock."""
        key = self._lock_key(user_id, ip)
        expires = None
        if self.db is not None:
            try:
                doc = self.db.ip_locks.find_one({"_id": key})
                if doc:
                    expires = doc.get("expires_at")
            except Exception:
                pass
        if expires is None:
            expires = self._mem.get(f"lock:{key}")
        if expires and expires > datetime.now():
            delta = expires - datetime.now()
            return max(1, int(delta.total_seconds() / 60))
        return 0

    # ── Token drain ──────────────────────────────────────────────────────────

    def is_draining(self, user_id: str) -> bool:
        """Trả về True nếu user đang trong thời gian drain token (3 ngày)."""
        key = self._drain_key(user_id)
        if self.db is not None:
            try:
                doc = self.db.token_drain.find_one({"_id": key})
                if doc:
                    return doc.get("drain_until", datetime.min) > datetime.now()
            except Exception:
                pass
        entry = self._mem.get(f"drain:{key}")
        if entry:
            return entry > datetime.now()
        return False

    def apply_token_drain(self, user_id: str) -> None:
        """Đặt drain token 3 ngày liên tiếp cho user."""
        key = self._drain_key(user_id)
        drain_until = datetime.now() + timedelta(days=3)
        self._mem[f"drain:{key}"] = drain_until
        if self.db is not None:
            try:
                self.db.token_drain.update_one(
                    {"_id": key},
                    {"$set": {"drain_until": drain_until, "user_id": user_id}},
                    upsert=True
                )
                # Đặt tất cả token của ngày hôm nay về MAX để coi như đã dùng hết
                today = self._today()
                for action in ["chat", "stream", "audio"]:
                    drain_rate_key = f"{action}_{user_id}_{today}"
                    self.db.ai_rate_limits.update_one(
                        {"_id": drain_rate_key},
                        {"$set": {"count": 9999}},
                        upsert=True
                    )
            except Exception as e:
                print(f"⚠️ WarningSentinel apply_drain error: {e}")

    # ── IP lock ──────────────────────────────────────────────────────────────

    def apply_lock(self, user_id: str, ip: str, minutes: int = 15) -> None:
        """Khóa user/IP trong X phút."""
        key = self._lock_key(user_id, ip)
        expires_at = datetime.now() + timedelta(minutes=minutes)
        self._mem[f"lock:{key}"] = expires_at
        if self.db is not None:
            try:
                self.db.ip_locks.update_one(
                    {"_id": key},
                    {"$set": {"expires_at": expires_at, "user_id": user_id, "ip": ip}},
                    upsert=True
                )
                # Tạo TTL index nếu chưa có
                try:
                    self.db.ip_locks.create_index("expires_at", expireAfterSeconds=0)
                except Exception:
                    pass
            except Exception as e:
                print(f"⚠️ WarningSentinel apply_lock error: {e}")

    # ── Đếm cảnh cáo ─────────────────────────────────────────────────────────

    def _get_warn_count(self, user_id: str, violation_type: str) -> int:
        key = self._warn_key(user_id, violation_type)
        if self.db is not None:
            try:
                doc = self.db.warnings.find_one({"_id": key})
                if doc:
                    return doc.get("count", 0)
            except Exception:
                pass
        return self._mem.get(key, 0)

    def _increment_warn(self, user_id: str, violation_type: str) -> int:
        """Tăng bộ đếm cảnh cáo, trả về count mới."""
        key = self._warn_key(user_id, violation_type)
        new_count = self._mem.get(key, 0) + 1
        self._mem[key] = new_count
        if self.db is not None:
            try:
                tomorrow = datetime.combine(
                    datetime.now().date() + timedelta(days=1), datetime.min.time()
                )
                result = self.db.warnings.find_one_and_update(
                    {"_id": key},
                    {
                        "$inc": {"count": 1},
                        "$setOnInsert": {
                            "user_id": user_id,
                            "type": violation_type,
                            "expires_at": tomorrow
                        }
                    },
                    upsert=True,
                    return_document=True
                )
                new_count = result.get("count", new_count)
                try:
                    self.db.warnings.create_index("expires_at", expireAfterSeconds=0)
                except Exception:
                    pass
            except Exception as e:
                print(f"⚠️ WarningSentinel increment_warn error: {e}")
        return new_count

    # ── Public API ────────────────────────────────────────────────────────────

    def detect_violation(self, text: str) -> str | None:
        """
        Phát hiện loại vi phạm trong tin nhắn. 
        Trả về 'hack_attempt' | 'system_probe' | 'profanity' | None.
        Ưu tiên: hack_attempt > system_probe > profanity
        """
        if HACK_ATTEMPT_PATTERNS.search(text):
            return "hack_attempt"
        if SYSTEM_PROBE_PATTERNS.search(text):
            return "system_probe"
        if PROFANITY_PATTERNS.search(text):
            return "profanity"
        return None

    def check_and_warn(self, user_id: str, ip: str, violation_type: str) -> dict:
        """
        Xử lý một vi phạm. Trả về dict:
        {
            "warned": bool,
            "locked": bool,
            "drain": bool,
            "count": int,
            "messages": [str, ...]   ← các tin nhắn cảnh báo
        }
        """
        count = self._increment_warn(user_id, violation_type)
        locked = False
        drain = False

        LIMITS = {"system_probe": 3, "profanity": 3, "hack_attempt": 3}
        limit = LIMITS.get(violation_type, 3)

        # Chọn cảnh báo tương ứng
        if violation_type == "system_probe":
            templates = SYSTEM_PROBE_WARNINGS
        elif violation_type == "profanity":
            templates = PROFANITY_WARNINGS
        else:
            templates = HACK_WARNINGS

        # Lần 1 hoặc 2 → cảnh báo
        if count < limit:
            messages = templates[min(count - 1, len(templates) - 2)]
        else:
            # Lần >= 3 → lock + drain
            messages = templates[-1]
            self.apply_lock(user_id, ip, minutes=15)
            self.apply_token_drain(user_id)
            locked = True
            drain = True

        return {
            "warned": True,
            "locked": locked,
            "drain": drain,
            "count": count,
            "limit": limit,
            "violation_type": violation_type,
            "messages": messages
        }


# Singleton
warning_sentinel = WarningSentinel()
