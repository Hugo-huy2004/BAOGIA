import { sendAlert } from '../utils/alert.js';

// ─── Central AI Gateway ──────────────────────────────────────────────────────
// Every Gemini call in the app should go through here so we get, in one place:
//   • quota accounting (sliding-window RPM + daily RPD + token totals)
//   • response caching (dedupe identical prompts)
//   • retry with exponential backoff on 429 / 5xx
//   • automatic model downgrade (flash → flash-lite) as we approach the limit
//   • a health signal so background jobs (the bot) can pause when quota is low
//   • alerting when calls start failing
// Degrades gracefully to null (no AI) when GEMINI_API_KEY is missing.

const KEY = () => process.env.GEMINI_API_KEY;
const GEN_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEN_MODEL_LITE = process.env.GEMINI_MODEL_LITE || 'gemini-2.5-flash-lite';
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'text-embedding-004';

// Conservative free-tier defaults; override via env for a paid key. Read
// dynamically (not frozen at import) so they're configurable/testable at runtime.
const RPM_LIMIT = () => Number(process.env.GEMINI_RPM_LIMIT || 15);
const RPD_LIMIT = () => Number(process.env.GEMINI_RPD_LIMIT || 200);
const BACKOFF_BASE_MS = () => Number(process.env.GEMINI_BACKOFF_MS || 1500);
const MAX_ATTEMPTS = 3;

// ── Quota counters ──
let minuteHits = [];            // request timestamps (last 60s)
let dayStart = startOfToday();
let dayCount = 0;
let tokensToday = 0;
let consecFailures = 0;

function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
function rollDay() { const s = startOfToday(); if (s !== dayStart) { dayStart = s; dayCount = 0; tokensToday = 0; } }
function pruneMinute() { const cut = Date.now() - 60_000; minuteHits = minuteHits.filter((t) => t > cut); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function getQuotaStatus() {
  rollDay(); pruneMinute();
  const rpm = minuteHits.length;
  const rpd = dayCount;
  const rpmLimit = RPM_LIMIT(), rpdLimit = RPD_LIMIT();
  const level = Math.max(rpm / rpmLimit, rpd / rpdLimit);
  return {
    rpm, rpd, rpmLimit, rpdLimit, tokensToday,
    level: Number(level.toFixed(2)),
    saturated: level >= 1,               // stop issuing new calls
    healthy: level < 0.85 && consecFailures < 5, // safe for background jobs
  };
}

// Test-only reset so quota state doesn't leak between test cases.
export function __resetQuota() { minuteHits = []; dayStart = startOfToday(); dayCount = 0; tokensToday = 0; consecFailures = 0; }

// ── Response cache ──
const cache = new Map();
const CACHE_MAX = 600;
function cacheGet(k) { const e = cache.get(k); if (!e) return null; if (e.exp < Date.now()) { cache.delete(k); return null; } return e.val; }
function cacheSet(k, val, ttl) { if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value); cache.set(k, { val, exp: Date.now() + ttl }); }

async function rawFetch(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) { const t = await res.text().catch(() => ''); const e = new Error(`gemini ${res.status}`); e.status = res.status; e.body = t.slice(0, 300); throw e; }
  return res.json();
}

// Core generate — accepts a full Gemini request (multi-turn contents supported).
export async function generateRaw({ contents, systemInstruction, generationConfig, model, cacheKey, cacheTtlMs = 0 } = {}) {
  const key = KEY();
  if (!key) return null;
  if (cacheKey) { const c = cacheGet(cacheKey); if (c != null) return c; }

  const q = getQuotaStatus();
  if (q.saturated) { sendAlert('Gemini quota saturated', q); return null; }
  // Auto-downgrade to the lite model once we cross 60% of a limit.
  const chosen = model || (q.level >= 0.6 ? GEN_MODEL_LITE : GEN_MODEL);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${chosen}:generateContent?key=${key}`;
  const body = { contents, ...(systemInstruction ? { systemInstruction } : {}), ...(generationConfig ? { generationConfig } : {}) };

  let lastErr;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      minuteHits.push(Date.now()); dayCount++;
      const data = await rawFetch(url, body);
      tokensToday += data?.usageMetadata?.totalTokenCount || 0;
      consecFailures = 0;
      const text = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
      if (cacheKey && cacheTtlMs > 0) cacheSet(cacheKey, text, cacheTtlMs);
      return text;
    } catch (e) {
      lastErr = e; consecFailures++;
      if ((e.status === 429 || e.status >= 500) && attempt < MAX_ATTEMPTS - 1) {
        await sleep(Math.min(BACKOFF_BASE_MS() * 2 ** attempt, 8000) + Math.random() * 250);
        continue;
      }
      break;
    }
  }
  if (consecFailures >= 5) sendAlert('Gemini generate failing', { model: chosen, status: lastErr?.status, msg: lastErr?.message });
  return null;
}

// Convenience: single-prompt generate. `temperature` is folded into generationConfig.
export function generate(prompt, opts = {}) {
  const { temperature, generationConfig, ...rest } = opts;
  const gc = temperature != null ? { ...(generationConfig || {}), temperature } : generationConfig;
  return generateRaw({
    contents: [{ role: 'user', parts: [{ text: String(prompt || '') }] }],
    ...(gc ? { generationConfig: gc } : {}),
    ...rest,
  });
}

// Embeddings go through the same quota accounting + cache.
export async function embed(text) {
  const key = KEY();
  if (!key || !text) return null;
  const clean = String(text).replace(/\s+/g, ' ').trim().slice(0, 2000);
  if (!clean) return null;
  const ck = 'emb:' + clean;
  const cached = cacheGet(ck); if (cached) return cached;

  if (getQuotaStatus().saturated) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${key}`;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      minuteHits.push(Date.now()); dayCount++;
      const data = await rawFetch(url, { content: { parts: [{ text: clean }] } });
      consecFailures = 0;
      const vec = data?.embedding?.values || null;
      if (vec) cacheSet(ck, vec, 24 * 60 * 60 * 1000);
      return vec;
    } catch (e) {
      consecFailures++;
      if ((e.status === 429 || e.status >= 500) && attempt < MAX_ATTEMPTS - 1) {
        await sleep(Math.min(BACKOFF_BASE_MS() * 2 ** attempt, 6000));
        continue;
      }
      break;
    }
  }
  return null;
}

export function cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || !a.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
