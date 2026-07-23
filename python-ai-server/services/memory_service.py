import os
import json
import time
from typing import List, Dict, Any, Optional

MEMORY_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "user_memories")
os.makedirs(MEMORY_DIR, exist_ok=True)

class MemoryService:
    """
    Atomic Memory Extractor & Vector/Digest RAG Memory Service for HugoPSY.
    Stores persistent personal memories (facts, triggers, goals, relationships)
    per pseudonymized userId.
    """

    def _get_memory_file(self, user_id: str) -> str:
        safe_id = "".join([c if c.isalnum() else "_" for c in str(user_id or "unknown")])
        return os.path.join(MEMORY_DIR, f"mem_{safe_id}.json")

    def load_memories(self, user_id: str) -> List[Dict[str, Any]]:
        file_path = this._get_memory_file(user_id) if hasattr(this := self, "_get_memory_file") else self._get_memory_file(user_id)
        if not os.path.exists(file_path):
            return []
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def save_memories(self, user_id: str, memories: List[Dict[str, Any]]) -> None:
        file_path = self._get_memory_file(user_id)
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(memories, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Lỗi khi lưu ký ức cho {user_id}: {e}")

    def add_memory(self, user_id: str, category: str, content: str, score: float = 1.0) -> None:
        if not content or not content.strip():
            return
        memories = self.load_memories(user_id)
        
        # Check duplicate content
        for m in memories:
            if m.get("content", "").strip().lower() == content.strip().lower():
                m["timestamp"] = time.time()
                self.save_memories(user_id, memories)
                return

        memories.append({
            "id": f"mem_{int(time.time()*1000)}",
            "category": category, # 'family', 'academic', 'emotion', 'goal', 'trigger'
            "content": content.strip(),
            "timestamp": time.time(),
            "score": score
        })

        # Keep max 50 atomic memories per user
        if len(memories) > 50:
            memories = sorted(memories, key=lambda x: x.get("timestamp", 0), reverse=True)[:50]

        self.save_memories(user_id, memories)

    def retrieve_relevant_memories(self, user_id: str, query_text: str, max_items: int = 5) -> List[str]:
        memories = self.load_memories(user_id)
        if not memories:
            return []

        clean_query = (query_text or "").lower()
        matched = []

        # Simple semantic keyword matching for RAG recall
        for m in memories:
            content = m.get("content", "")
            content_lower = content.lower()
            category = m.get("category", "")
            
            # Match keywords
            is_match = any(word in clean_query for word in content_lower.split() if len(word) > 2)
            if is_match or len(memories) <= 3:
                matched.append(f"[{category.upper()}] {content}")

        if not matched and memories:
            # Fallback to recent 3 memories
            recent = sorted(memories, key=lambda x: x.get("timestamp", 0), reverse=True)[:max_items]
            matched = [f"[{m.get('category', 'FACT').upper()}] {m.get('content')}" for m in recent]

        return matched[:max_items]

    def extract_atomic_memories_rule_based(self, user_id: str, text: str) -> None:
        clean = (text or "").lower()

        # Family / Parents
        if any(kw in clean for kw in ["bố mạ", "ba mẹ", "bố ép", "mẹ ép", "phụ huynh", "gia đình"]):
            if "ép" in clean or "bắt" in clean:
                self.add_memory(user_id, "family", "Gia đình có xu hướng áp đặt hoặc gây áp lực", 1.2)
            elif "cãi nhau" in clean or "mâu thuẫn" in clean:
                self.add_memory(user_id, "family", "Có mâu thuẫn hoặc căng thẳng với gia đình", 1.2)

        # Academic / Exams
        if any(kw in clean for kw in ["điểm số", "rớt môn", "thi trượt", "học kém", "thi đại học", "ngành y", "ngành it"]):
            if "rớt" in clean or "kém" in clean:
                self.add_memory(user_id, "academic", "Lo lắng về kết quả học tập hoặc sợ rớt môn", 1.1)

        # Overthinking / Insomnia
        if any(kw in clean for kw in ["mất ngủ", "khó ngủ", "overthinking", "thức đến 2-3h", "thức khuya"]):
            self.add_memory(user_id, "trigger", "Thường xuyên overthinking hoặc mất ngủ về đêm", 1.1)

memory_service = MemoryService()
