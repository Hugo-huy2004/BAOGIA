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
        
        # Safely list index names across Pinecone SDK versions
        index_names = []
        try:
            indexes_obj = pc.list_indexes()
            if hasattr(indexes_obj, "names"):
                index_names = list(indexes_obj.names())
            elif isinstance(indexes_obj, (list, tuple)):
                index_names = [
                    idx.name if hasattr(idx, "name") else (idx.get("name") if isinstance(idx, dict) else str(idx))
                    for idx in indexes_obj
                ]
        except Exception as err:
            logger.warning(f"Could not list Pinecone indexes: {err}")

        if PINECONE_INDEX_NAME not in index_names:
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
                if isinstance(result, dict) and "embedding" in result:
                    return result["embedding"]
                elif hasattr(result, "embedding"):
                    return result.embedding
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
                
                # Convert QueryResponse object or dict safely
                raw_matches = []
                if hasattr(res, "to_dict"):
                    raw_matches = res.to_dict().get("matches", [])
                elif isinstance(res, dict):
                    raw_matches = res.get("matches", [])
                elif hasattr(res, "matches"):
                    raw_matches = res.matches

                results = []
                for match in raw_matches:
                    match_id = match.get("id") if isinstance(match, dict) else getattr(match, "id", "")
                    match_score = match.get("score", 0.0) if isinstance(match, dict) else getattr(match, "score", 0.0)
                    match_meta = match.get("metadata", {}) if isinstance(match, dict) else getattr(match, "metadata", {})
                    results.append({
                        "id": match_id,
                        "score": float(match_score),
                        "metadata": match_meta
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
