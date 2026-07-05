// Text embeddings via Gemini (free tier). Returns null gracefully when no API
// key is configured or on error, so every caller degrades to non-AI behaviour.
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'text-embedding-004';

// Small in-memory LRU-ish cache to avoid re-embedding identical text.
const cache = new Map();
const CACHE_MAX = 800;

export async function embedText(text) {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !text) return null;
  const clean = String(text).replace(/\s+/g, ' ').trim().slice(0, 2000);
  if (!clean) return null;
  if (cache.has(clean)) return cache.get(clean);

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { parts: [{ text: clean }] } }),
      }
    );
    if (!r.ok) throw new Error('embed ' + r.status);
    const d = await r.json();
    const vec = d?.embedding?.values || null;
    if (vec) {
      if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
      cache.set(clean, vec);
    }
    return vec;
  } catch (e) {
    console.warn('[embed]', e.message);
    return null;
  }
}

// Cosine similarity in [-1, 1]; 0 if either vector missing / mismatched.
export function cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || !a.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
