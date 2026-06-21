import os
from datetime import datetime, timedelta
from collections import defaultdict

# In-memory fallback
_memory_store: dict = defaultdict(int)

class RateLimitService:
    def __init__(self):
        self.mongo_client = None
        self.db = None
        self._try_connect_mongo()

    def _try_connect_mongo(self):
        try:
            from pymongo import MongoClient
            mongo_uri = os.getenv("MONGODB_URI", "")
            if mongo_uri:
                self.mongo_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=3000)
                # Trigger a lightweight server check to validate the connection early
                self.mongo_client.admin.command("ping")
                self.db = self.mongo_client.get_default_database()
                # Create TTL index so expired documents are auto-removed by MongoDB
                self.db.ai_rate_limits.create_index("expires_at", expireAfterSeconds=0)
                print("✅ Rate limit: Connected to MongoDB")
        except Exception as e:
            print(f"⚠️ Rate limit: MongoDB unavailable, using in-memory fallback. {e}")
            self.mongo_client = None
            self.db = None

    async def check_and_increment(self, user_id: str, action: str, max_tokens: int) -> tuple:
        """Returns (is_allowed, current_count).
        Increments the counter first, then checks the limit so the token is always consumed.
        """
        today = datetime.now().strftime("%Y-%m-%d")
        key = f"{action}_{user_id}_{today}"

        if self.db is not None:
            try:
                from pymongo.collection import ReturnDocument
                result = self.db.ai_rate_limits.find_one_and_update(
                    {"_id": key},
                    {
                        "$inc": {"count": 1},
                        "$setOnInsert": {
                            "expires_at": datetime.combine(
                                datetime.now().date() + timedelta(days=1),
                                datetime.min.time()
                            )
                        }
                    },
                    upsert=True,
                    return_document=ReturnDocument.AFTER
                )
                count = result["count"]
                return count <= max_tokens, count
            except Exception as e:
                print(f"⚠️ Rate limit MongoDB error (falling back to memory): {e}")
                # Fall through to in-memory

        # In-memory fallback
        _memory_store[key] += 1
        count = _memory_store[key]
        return count <= max_tokens, count

    async def get_remaining(self, user_id: str, action: str, max_tokens: int) -> int:
        today = datetime.now().strftime("%Y-%m-%d")
        key = f"{action}_{user_id}_{today}"

        if self.db is not None:
            try:
                doc = self.db.ai_rate_limits.find_one({"_id": key})
                used = doc["count"] if doc else 0
                return max(0, max_tokens - used)
            except Exception:
                pass

        return max(0, max_tokens - _memory_store.get(key, 0))

    async def consume_bonus_token(self, email: str, field: str) -> bool:
        """Atomically consume one purchased bonus token from Bio.<field>
        (bonusChatTokens / bonusCallTokens), shared with the Node server's
        Utility Store. Returns True if a token was available and consumed.
        """
        if not email or self.db is None:
            return False
        try:
            result = self.db.bios.find_one_and_update(
                {"email": email, field: {"$gt": 0}},
                {"$inc": {field: -1}}
            )
            return result is not None
        except Exception as e:
            print(f"⚠️ Rate limit bonus-token consume error: {e}")
            return False


# Singleton instance used across the application
rate_limiter = RateLimitService()
