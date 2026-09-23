"""
hugopsy_companion_engine.py
======================================================================
Bộ đồng hành tâm lý HugoPsy — phần chạy CỤC BỘ, không phụ thuộc AI ngoài.

Thứ tự xử lý một tin nhắn:
  1. Radar khủng hoảng — chạy TRƯỚC mọi thứ, trên mọi tin nhắn, không ngoại lệ.
  2. Câu chào hỏi quen thuộc — trả lời tức thì, không tốn hạn mức AI.
  3. Gemini (nếu gọi được).
  4. Bộ đồng hành cục bộ — khi AI ngoài nghẽn hoặc lỗi. Người dùng KHÔNG BAO
     GIỜ được thấy "AI_UNAVAILABLE"; ở buồng trị liệu, một lỗi kỹ thuật là một
     cánh cửa đóng sập vào mặt người đang cần nói chuyện.

──────────────────────────────────────────────────────────────────────
BA LỖI ĐÃ SỬA NGÀY 2026-09-23 — đừng dựng lại chúng:

1. **Khung SSE phải là JSON.** Trước đây các nhánh cục bộ phát
   `data: <chữ thô>\n\n`. Client (`AIBot.js`) tách luồng theo từng DÒNG và chỉ
   nhận dòng bắt đầu bằng `data: `, nên mọi thứ sau dấu xuống dòng ĐẦU TIÊN bị
   vứt. Tin khủng hoảng dài 181 ký tự tới tay người dùng chỉ còn 65 — **toàn bộ
   số hotline bị cắt mất**. Nay mọi nhánh đều phát `data: {"text": ...}` như
   nhánh Gemini: xuống dòng được JSON thoát, không còn cắt.

2. **Mất dấu cách giữa các mẩu.** Client gọi `.trim()` trên từng mẩu, nên kiểu
   chia "bốn từ một mẩu" rồi thêm dấu cách ở cuối làm chữ dính vào nhau:
   "Cảm ơn Huy đãtin tưởng và mởlòng…". Đây chính là cảm giác "bot trả lời rời
   rạc". Chữ nay nằm trong trường JSON nên dấu cách sống sót.

3. **So khớp phải BỎ DẤU cả hai phía.** Từ khoá viết không dấu ("buon", "ap
   luc") mà lại đem so với chữ người dùng gõ có dấu ("buồn", "áp lực") thì
   không bao giờ khớp. Đo thực tế: 4/5 câu tiếng Việt rơi vào câu chung chung,
   và bộ nhớ đệm chào hỏi trúng 0/5. Đó là lý do bot nhạt và lặp. Nay mọi phép
   so khớp đều đi qua `_norm()`.
"""

import re
import asyncio
import json as _json
import json
import os as _os
from typing import Any, AsyncGenerator, Dict, List, Optional

# ── Bỏ dấu tiếng Việt ────────────────────────────────────────────────────────
# Hai chuỗi PHẢI bằng nhau về độ dài, nếu không `str.maketrans` ném ValueError
# ngay lúc nạp module — và radar khủng hoảng chết theo. Có kiểm tra ở dưới.
_ACCENTS = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ"
_PLAIN = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd"
assert len(_ACCENTS) == len(_PLAIN), "bảng bỏ dấu lệch độ dài"
_DEACCENT = str.maketrans(_ACCENTS, _PLAIN)


def _norm(text: str) -> str:
    """Chữ thường, bỏ dấu, bỏ dấu câu, gom khoảng trắng. Dùng cho MỌI phép so khớp."""
    t = (text or "").strip().lower().translate(_DEACCENT)
    t = re.sub(r"[^\w\s]", " ", t)
    return re.sub(r"\s+", " ", t).strip()


# ── Kho tri thức dùng chung ──────────────────────────────────────────────────
# Lời lẽ và từ khoá nằm ở `shared/hugopsyKnowledge.json`, KHÔNG nằm trong tệp
# này. Lý do: khi Node không gọi được máy chủ Python, `aiProxyRoutes.js` phải
# tự trả lời — và nó từng trả về đúng MỘT câu chào cho mọi tin nhắn, kể cả tin
# nhắn khủng hoảng (không một số hotline nào). Hai bộ não thì sớm muộn cũng
# lệch nhau; một tệp JSON thì cả hai cùng đọc.
_KNOWLEDGE_PATH = _os.path.join(
    _os.path.dirname(_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))),
    "shared", "hugopsyKnowledge.json",
)
with open(_KNOWLEDGE_PATH, encoding="utf-8") as _f:
    _KNOWLEDGE = _json.load(_f)

CRISIS_TERMS: List[str] = _KNOWLEDGE["crisisTerms"]
CRISIS_RESPONSE_VI: str = _KNOWLEDGE["crisisResponse"]
INTENSIFIERS: List[str] = _KNOWLEDGE["intensifiers"]
TOPICS: List[Dict[str, Any]] = _KNOWLEDGE["topics"]
COMMON_INTENT_REPLIES: Dict[str, str] = {
    _norm(k): v for k, v in _KNOWLEDGE["commonReplies"].items()
}
ADDRESS = _KNOWLEDGE["address"]
PHRASES = _KNOWLEDGE["phrases"]


def detect_address(message: str, history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, str]:
    """Chọn cách xưng hô theo cách NGƯỜI DÙNG tự xưng.

    Tiếng Việt không có đại từ trung tính. Gọi một người đang xưng "em" là
    "bạn" nghe xa cách; gọi người xưng "tôi" là "cậu" nghe suồng sã. Trước đây
    bot gọi tất cả là "bạn" trong khi phần còn lại của HugoPSY gọi "cậu" —
    người dùng bị đổi cách gọi giữa chừng ngay trong một màn hình.

    Dò trên cả lịch sử vì đại từ thường chỉ xuất hiện ở câu đầu.
    """
    texts = [message] + [(t or {}).get("content", "") for t in (history or [])
                         if (t or {}).get("role") == "user"]
    counts: Dict[int, int] = {}
    for text in texts:
        tokens = _norm(text).split()
        for index, rule in enumerate(ADDRESS["detect"]):
            hits = sum(1 for cue in rule["cues"] if cue in tokens)
            if hits:
                counts[index] = counts.get(index, 0) + hits
    if not counts:
        return ADDRESS["default"]
    # Hoà thì lấy luật đứng trước: "em/con/cháu" rõ nghĩa hơn "mình/tôi".
    best = min(counts, key=lambda i: (-counts[i], i))
    return ADDRESS["detect"][best]


def _lower_first(text: str) -> str:
    """Hạ chữ cái đầu để nối sau dấu gạch ngang. Nếu câu mở đầu bằng chỗ trống
    thì đổi luôn chỗ trống sang biến thường, vì `.lower()` không với tới được
    chữ nằm trong `{User}`."""
    for upper, lower in (("{User}", "{user}"), ("{Self}", "{self}")):
        if text.startswith(upper):
            return lower + text[len(upper):]
    return text[:1].lower() + text[1:]


def render(text: str, address: Dict[str, str], name: str = "") -> str:
    """Đổ đại từ vào chỗ trống. Chuỗi trong kho tri thức KHÔNG chứa đại từ cứng."""
    out = text
    for key in ("User", "user", "Self", "self"):
        out = out.replace("{" + key + "}", address.get(key, ""))
    return out


class HugoPsyCompanionEngine:
    """Bộ đồng hành cục bộ. Không gọi mạng, không giữ trạng thái giữa các request.

    Mọi thứ cần để trả lời đều nằm trong tham số truyền vào (`message`, `bio`,
    `history`) — nhờ vậy chạy được ở bất kỳ tiến trình nào và không rò dữ liệu
    của người này sang người khác.
    """

    # ── Nhận diện ────────────────────────────────────────────────────────────
    def is_crisis(self, message: str) -> bool:
        """Chạy trên MỌI tin nhắn, trước mọi tầng khác. Không được bọc trong try
        nào ở phía gọi mà nuốt mất lỗi."""
        norm = f" {_norm(message)} "
        return any(f" {term} " in norm for term in CRISIS_TERMS)

    def detect_topics(self, message: str, limit: int = 2) -> List[Dict[str, Any]]:
        """Trả về các chủ đề khớp, xếp theo độ khớp giảm dần.

        Trả về NHIỀU chủ đề chứ không phải một: người ta hiếm khi chỉ mang tới
        một vấn đề. "Áp lực thi cử làm em mất ngủ" là hai chuyện, và đáp lại
        được cả hai mới ra cảm giác được nghe.
        """
        norm = f" {_norm(message)} "
        scored = []
        for topic in TOPICS:
            hits = [k for k in topic["keys"] if f" {k} " in norm]
            if hits:
                # Cụm dài khớp thì chắc chắn hơn cụm một chữ ("met" vs "kiet suc").
                scored.append((max(len(h) for h in hits), len(hits), topic))
        scored.sort(key=lambda item: (item[0], item[1]), reverse=True)
        picked = [topic for _, _, topic in scored[:limit]]
        # Chủ đề PHỤ phải khớp chắc tay mới được nhắc: một chữ ngắn trúng tình
        # cờ ("sợ", "chán") kéo theo cả một câu lạc đề, nghe như bot đoán mò.
        if len(picked) > 1:
            longest, hits, _ = scored[1]
            if longest < 5 and hits < 2:
                picked = picked[:1]
        return picked

    @staticmethod
    def _is_intense(message: str) -> bool:
        norm = f" {_norm(message)} "
        return any(f" {word} " in norm for word in INTENSIFIERS)

    @staticmethod
    def _turn_index(history: Optional[List[Dict[str, Any]]]) -> int:
        """Đếm số lượt NGƯỜI DÙNG đã nói. Dùng để xoay vòng câu chữ, nên cùng một
        chủ đề nhắc lại vẫn nghe khác đi."""
        if not history:
            return 0
        return sum(1 for turn in history if (turn or {}).get("role") == "user")

    @staticmethod
    def _said_before(history: Optional[List[Dict[str, Any]]], text: str) -> bool:
        """Bot đã nói câu này trong phiên chưa. Lặp nguyên văn là thứ làm lộ máy móc."""
        if not history or not text:
            return False
        needle = _norm(text)[:60]
        return any(
            needle and needle in _norm((turn or {}).get("content", ""))
            for turn in history
            if (turn or {}).get("role") == "model"
        )

    @staticmethod
    def _topic_streak(topic: Dict[str, Any], history: Optional[List[Dict[str, Any]]]) -> int:
        """Người dùng đã nhắc chủ đề này bao nhiêu lượt trong phiên."""
        if not history:
            return 0
        count = 0
        for turn in history:
            if (turn or {}).get("role") != "user":
                continue
            norm = _norm((turn or {}).get("content", ""))
            if any(k in norm for k in topic["keys"]):
                count += 1
        return count

    def _pick(self, options: List[str], seed: int,
              history: Optional[List[Dict[str, Any]]] = None) -> str:
        """Chọn một câu, ưu tiên câu chưa nói trong phiên này."""
        if not options:
            return ""
        order = [options[(seed + offset) % len(options)] for offset in range(len(options))]
        for candidate in order:
            if not self._said_before(history, candidate):
                return candidate
        return order[0]

    # ── Soạn lời đáp ─────────────────────────────────────────────────────────
    def generate_local_empathic_reply(
        self,
        message: str,
        bio: Optional[Dict[str, Any]] = None,
        history: Optional[List[Dict[str, Any]]] = None,
    ) -> str:
        """Soạn một lượt đáp.

        Khung một lượt: PHẢN CHIẾU điều vừa nghe → (nối chủ đề thứ hai nếu có)
        → MỘT cánh cửa mở ra, là câu hỏi hoặc lời đề nghị, không bao giờ cả hai.
        Dồn nhiều câu hỏi một lúc làm người đang mệt thấy bị tra hỏi.
        """
        name = (bio or {}).get("displayName") or (bio or {}).get("name") or ""
        turn = self._turn_index(history)
        address = detect_address(message, history)
        topics = self.detect_topics(message)
        parts: List[str] = []

        # Xưng tên ở lượt đầu cho ấm, sau đó thôi — gọi tên mỗi câu nghe như máy
        # bán hàng, và đó là một phần của cảm giác "mờ nhạt".
        if turn == 0 and name:
            parts.append(f"Chào {name}.")

        if not topics:
            # Không khớp chủ đề nào: KHÔNG đoán bừa cảm xúc của người ta.
            parts.append(self._pick(PHRASES["genericReflect"], turn, history))
            parts.append(self._pick(PHRASES["genericAsk"], turn, history))
            return render(" ".join(p for p in parts if p), address)

        primary = topics[0]
        streak = self._topic_streak(primary, history)

        # Quay lại cùng một chỗ đau nhiều lần là một THÔNG TIN, không phải lỗi.
        # Nói ra điều đó thật hơn là xoay vòng câu phản chiếu cho tới khi hết.
        if streak >= 3:
            parts.append(self._pick(PHRASES["streakReflect"], turn, history))
            parts.append(self._pick(PHRASES["streakAsk"], turn, history))
            return render(" ".join(p for p in parts if p), address)

        parts.append(self._pick(primary["reflect"], turn, history))

        # Chủ đề thứ hai: nói rõ là mình nghe thấy CẢ HAI. Đây là phần "đa diện".
        if len(topics) > 1:
            second = topics[1]
            parts.append(
                PHRASES["secondTopic"] + _lower_first(self._pick(second["reflect"], turn + 1, history))
            )

        # Cảm xúc đang mạnh thì công nhận trước, chưa đưa bài tập.
        if self._is_intense(message):
            parts.append(self._pick(PHRASES["intense"], turn, history))
            parts.append(self._pick(primary["ask"], turn, history))
        elif primary.get("offer") and turn > 0 and turn % 2 == 0:
            # Chỉ đề nghị bài tập khi đã nghe được một lúc, và không đề nghị
            # liên tục. Đưa bài tập ngay câu đầu làm người ta thấy bị gạt đi.
            parts.append(primary["offer"])
        else:
            parts.append(self._pick(primary["ask"], turn, history))

        return render(" ".join(p for p in parts if p), address)

    # ── Phát luồng ───────────────────────────────────────────────────────────
    @staticmethod
    def _sse(text: str) -> str:
        """MỘT khung SSE duy nhất cho mọi nhánh, luôn là JSON.

        Đây là chỗ đã từng cắt cụt tin khủng hoảng. `json.dumps` thoát dấu xuống
        dòng thành `\\n`, nên cả khối nhiều dòng đi trọn trong MỘT dòng `data: `.
        Đừng bao giờ quay lại phát chữ thô.
        """
        return f"data: {json.dumps({'text': text}, ensure_ascii=False)}\n\n"

    async def _type_out(self, text: str, size: int = 4, delay: float = 0.015) -> AsyncGenerator[str, None]:
        """Nhả chữ theo từng mẩu cho có nhịp gõ.

        Dấu cách nằm Ở ĐẦU mẩu sau, không phải cuối mẩu trước: client `.trim()`
        từng mẩu nên dấu cách cuối sẽ bị cắt, làm chữ dính nhau. Ở đây chữ đi
        trong JSON nên an toàn, nhưng vẫn giữ quy tắc này cho chắc.
        """
        words = text.split(" ")
        for i in range(0, len(words), size):
            chunk = " ".join(words[i:i + size])
            if i:
                chunk = " " + chunk
            yield self._sse(chunk)
            await asyncio.sleep(delay)

    async def stream_chat_resilient(
        self,
        message: str,
        history: Optional[List[Dict[str, Any]]] = None,
        bio: Optional[Dict[str, Any]] = None,
        gemini_service: Optional[Any] = None,
    ) -> AsyncGenerator[str, None]:
        """Luồng trả lời. Không có đường nào dẫn tới việc người dùng thấy lỗi."""

        # 1. Khủng hoảng — trước tất cả, kể cả trước bộ nhớ đệm và AI ngoài.
        #    Gửi nguyên khối một lần, KHÔNG chia mẩu: số hotline không được
        #    nhỏ giọt từng chữ trước mắt người đang hoảng.
        if self.is_crisis(message):
            yield self._sse(render(CRISIS_RESPONSE_VI, detect_address(message, history)))
            yield "data: [DONE]\n\n"
            return

        # 2. Câu quen thuộc — trả lời ngay, không tiêu hạn mức AI.
        cached = COMMON_INTENT_REPLIES.get(_norm(message))
        if cached:
            cached = render(cached, detect_address(message, history))
            async for frame in self._type_out(cached, size=3, delay=0.02):
                yield frame
            yield "data: [DONE]\n\n"
            return

        # 3. AI ngoài. Nhánh này tự phát khung SSE riêng của nó.
        if gemini_service:
            try:
                async for chunk in gemini_service.generate_chat_response_stream(
                    message, history=history, bio=bio
                ):
                    yield chunk
                return
            except Exception as error:  # noqa: BLE001 — hỏng kiểu gì cũng phải có lời đáp
                print(f"[hugopsy] AI ngoài lỗi ({error}) → chuyển sang bộ đồng hành cục bộ")

        # 4. Bộ đồng hành cục bộ.
        async for frame in self._type_out(
            self.generate_local_empathic_reply(message, bio=bio, history=history)
        ):
            yield frame
        yield "data: [DONE]\n\n"


hugopsy_engine = HugoPsyCompanionEngine()
