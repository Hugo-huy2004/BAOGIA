import os
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "hugo-studio-index")

pinecone_client = None
index = None

if PINECONE_API_KEY:
    try:
        from pinecone import Pinecone, ServerlessSpec
        pc = Pinecone(api_key=PINECONE_API_KEY)
        
        # Check if index exists, create if not present
        existing_indexes = [idx.name for idx in pc.list_indexes()]
        if PINECONE_INDEX_NAME not in existing_indexes:
            try:
                pc.create_index(
                    name=PINECONE_INDEX_NAME,
                    dimension=768, # Default dimension for Gemini text-embedding-004
                    metric="cosine",
                    spec=ServerlessSpec(cloud="aws", region="us-east-1")
                )
                logger.info(f"Created Pinecone index '{PINECONE_INDEX_NAME}'")
            except Exception as e:
                logger.warning(f"Could not auto-create Pinecone index: {e}")
        
        index = pc.Index(PINECONE_INDEX_NAME)
        logger.info(f"✅ Connected to Pinecone index '{PINECONE_INDEX_NAME}'")
    except Exception as e:
        logger.warning(f"⚠️ Pinecone initialization failed: {e}. Vector operations will use in-memory fallback.")
else:
    logger.info("ℹ️ PINECONE_API_KEY not configured. Pinecone vector features running in mock mode.")


class VectorService:
    def __init__(self):
        self.in_memory_store = {} # Fallback store if Pinecone API key is missing

    def generate_embedding(self, text: str) -> List[float]:
        """Generate 768-dim embedding using Google Gemini API or deterministic fallback."""
        try:
            import google.generativeai as genai
            api_key = os.getenv("GEMINI_API_KEY", "")
            if api_key:
                genai.configure(api_key=api_key)
                result = genai.embed_content(
                    model="models/text-embedding-004",
                    content=text,
                    task_type="retrieval_document"
                )
                if "embedding" in result:
                    return result["embedding"]
        except Exception as e:
            logger.warning(f"Gemini embedding error: {e}")
        
        # Simple deterministic vector fallback for dev / test
        import hashlib
        seed = int(hashlib.md5(text.encode('utf-8')).hexdigest(), 16)
        import random
        rnd = random.Random(seed)
        return [rnd.uniform(-1.0, 1.0) for _ in range(768)]

    async def upsert_text(self, doc_id: str, text: str, metadata: Optional[Dict[str, Any]] = None, namespace: str = "default") -> Dict[str, Any]:
        """Embed text and upsert vector to Pinecone (or fallback in-memory store)."""
        vector = self.generate_embedding(text)
        meta = metadata or {}
        meta["text"] = text[:1000] # Store snippet in metadata

        if index:
            try:
                index.upsert(
                    vectors=[{
                        "id": doc_id,
                        "values": vector,
                        "metadata": meta
                    }],
                    namespace=namespace
                )
                return {"status": "success", "storage": "pinecone", "id": doc_id}
            except Exception as e:
                logger.error(f"Pinecone upsert failed: {e}")

        # Fallback in-memory
        key = f"{namespace}:{doc_id}"
        self.in_memory_store[key] = {
            "id": doc_id,
            "values": vector,
            "metadata": meta,
            "text": text
        }
        return {"status": "success", "storage": "in_memory_fallback", "id": doc_id}

    async def query_similar(self, query_text: str, top_k: int = 5, namespace: str = "default", filter_dict: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Find most relevant documents by text embedding cosine similarity."""
        query_vector = self.generate_embedding(query_text)

        if index:
            try:
                res = index.query(
                    vector=query_vector,
                    top_k=top_k,
                    include_metadata=True,
                    namespace=namespace,
                    filter=filter_dict
                )
                results = []
                for match in res.get("matches", []):
                    results.append({
                        "id": match["id"],
                        "score": match["score"],
                        "metadata": match.get("metadata", {})
                    })
                return results
            except Exception as e:
                logger.error(f"Pinecone query failed: {e}")

        # Fallback in-memory cosine similarity
        import math
        def cosine_similarity(v1, v2):
            dot = sum(a * b for a, b in zip(v1, v2))
            norm1 = math.sqrt(sum(a * a for a in v1))
            norm2 = math.sqrt(sum(b * b for b in v2))
            return dot / (norm1 * norm2 + 1e-9)

        matches = []
        prefix = f"{namespace}:"
        for k, v in self.in_memory_store.items():
            if k.startswith(prefix):
                sim = cosine_similarity(query_vector, v["values"])
                matches.append({
                    "id": v["id"],
                    "score": sim,
                    "metadata": v["metadata"]
                })
        matches.sort(key=lambda x: x["score"], reverse=True)
        return matches[:top_k]

vector_service = VectorService()
