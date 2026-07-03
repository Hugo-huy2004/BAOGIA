import re
import os
import hashlib
import hmac
from datetime import datetime
from collections import defaultdict

from services.rate_limit_service import rate_limiter

# Salt for pseudonymizing user identifiers in analytics. The intent telemetry
# only needs a STABLE per-user token (to measure per-user match coverage), not
# the real email — so we store an HMAC digest instead. Analytics can still
# group by user without the collection ever holding a real address.
_PSEUDONYM_SALT = (os.getenv("TELEMETRY_SALT") or os.getenv("INTERNAL_API_KEY") or "hugopsy-telemetry-salt").encode()


def pseudonymize(user_id: str) -> str:
    if not user_id or user_id == "unknown":
        return "unknown"
    return "u_" + hmac.new(_PSEUDONYM_SALT, user_id.encode(), hashlib.sha256).hexdigest()[:16]

# In-memory fallback for the classify cache (analytics log has no in-memory
# fallback — losing a log entry during rare Mongo downtime is fine).
_memory_cache: dict = {}
_memory_store_cap = 5000


def normalize(text: str) -> str:
    """Lowercase + trim + collapse whitespace, for exact-match cache lookups."""
    return re.sub(r"\s+", " ", (text or "").strip().lower())


class IntentInsightsService:
    """Tracks which tier (local / ai / cache / fallback) resolves each chat
    message, and caches AI-classified results so repeated/duplicate questions
    across users don't re-spend an AI call. Reuses rate_limiter's existing
    Mongo connection instead of opening a second client; degrades to an
    in-memory-only cache (and silently skips logging) if Mongo is unavailable.
    """

    @property
    def db(self):
        return rate_limiter.db

    async def get_cached(self, normalized_text: str) -> str | None:
        if not normalized_text:
            return None
        if normalized_text in _memory_cache:
            return _memory_cache[normalized_text]
        if self.db is not None:
            try:
                doc = self.db.intent_cache.find_one({"_id": normalized_text})
                if doc:
                    _memory_cache[normalized_text] = doc["intent"]
                    return doc["intent"]
            except Exception as e:
                print(f"⚠️ Intent cache read error: {e}")
        return None

    async def set_cached(self, normalized_text: str, intent_id: str) -> None:
        if not normalized_text or not intent_id:
            return
        if len(_memory_cache) < _memory_store_cap:
            _memory_cache[normalized_text] = intent_id
        if self.db is not None:
            try:
                self.db.intent_cache.update_one(
                    {"_id": normalized_text},
                    {"$set": {"intent": intent_id, "updated_at": datetime.now()}},
                    upsert=True
                )
            except Exception as e:
                print(f"⚠️ Intent cache write error: {e}")

    async def log_match(self, message: str, matched_via: str, intent_id: str | None, user_id: str) -> None:
        """Best-effort analytics log — never raises, never blocks the chat flow."""
        if self.db is None:
            return
        try:
            self.db.intent_match_logs.insert_one({
                "message": message,
                "matched_via": matched_via,  # "local" | "ai" | "cache" | "fallback"
                "intent": intent_id,
                "user_id": pseudonymize(user_id),  # HMAC digest, never the raw email
                "created_at": datetime.now()
            })
        except Exception as e:
            print(f"⚠️ Intent match log error: {e}")


# Singleton instance used across the application
intent_insights = IntentInsightsService()
