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

// Centralized API Key Pool for rotation
const KEYS = () => {
  const list = [];
  if (process.env.GEMINI_API_KEY) list.push(process.env.GEMINI_API_KEY);
  if (process.env.GEMINI_API_KEY_2) list.push(process.env.GEMINI_API_KEY_2);
  if (process.env.GEMINI_API_KEY_3) list.push(process.env.GEMINI_API_KEY_3);
  for (let i = 4; i <= 10; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`];
    if (k) list.push(k);
  }
  return list;
};

let currentKeyIndex = 0;

// Khóa bị Google từ chối ("API key not valid") — loại khỏi vòng xoay cho tới
// lần khởi động sau. Trước đây một khóa chết trong pool 3 khóa làm HỎNG 1/3 số
// lần gọi AI của TOÀN hệ thống: 400 không được thử lại, hàm trả null, và mỗi
// nơi gọi lại rơi vào câu trả lời dự phòng của mình — nhìn từ ngoài y như "AI
// lúc hiểu lúc không".
const deadKeys = new Set();

function getNextKey() {
  const pool = KEYS().filter((k) => !deadKeys.has(k));
  if (pool.length === 0) return null;
  const key = pool[currentKeyIndex % pool.length];
  currentKeyIndex++;
  return key;
}

function markKeyDead(key, reason) {
  if (!key || deadKeys.has(key)) return;
  deadKeys.add(key);
  const live = KEYS().filter((k) => !deadKeys.has(k)).length;
  console.error(`❌ Gemini: loại 1 khóa hỏng (${reason}). Còn ${live}/${KEYS().length} khóa dùng được — sửa GEMINI_API_KEY* trong server/.env.`);
}

const GEN_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEN_MODEL_LITE = process.env.GEMINI_MODEL_LITE || 'gemini-2.5-flash-lite';
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'text-embedding-004';

// Conservative free-tier defaults scaled by number of keys in the pool.
const RPM_LIMIT = () => {
  const count = Math.max(1, KEYS().length);
  return Number(process.env.GEMINI_RPM_LIMIT || (15 * count));
};
const RPD_LIMIT = () => {
  const count = Math.max(1, KEYS().length);
  return Number(process.env.GEMINI_RPD_LIMIT || (1500 * count));
};
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
// `lowPriority:true` (bot / bulk jobs) is dropped when quota is saturated, but
// interactive calls (HugoPSY, support, moderation) always attempt so background
// work can never starve a user talking to the AI.
export async function generateRaw({ contents, systemInstruction, generationConfig, model, cacheKey, cacheTtlMs = 0, lowPriority = false } = {}) {
  if (cacheKey) { const c = cacheGet(cacheKey); if (c != null) return c; }

  const q = getQuotaStatus();
  if (lowPriority && q.saturated) { sendAlert('Gemini quota saturated (dropped low-priority call)', q); return null; }

  // List of free fallback models to try if the primary one is throttled/fails
  const FREE_MODELS = [
    model || (q.level >= 0.6 ? GEN_MODEL_LITE : GEN_MODEL),
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b'
  ];
  const uniqueModels = [...new Set(FREE_MODELS)];

  let lastErr;
  for (const currentModel of uniqueModels) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const key = getNextKey();
      if (!key) {
        lastErr = new Error('No API keys available in the pool');
        break;
      }
      const formattedSystemInstruction = typeof systemInstruction === 'string'
        ? { parts: [{ text: systemInstruction }] }
        : systemInstruction;
      const body = { contents, ...(formattedSystemInstruction ? { systemInstruction: formattedSystemInstruction } : {}), ...(generationConfig ? { generationConfig } : {}) };
      // Thiếu hẳn dòng này: `rawFetch(url, body)` bên dưới gọi một biến chưa
      // khai báo, nên MỌI lời gọi generateRaw đều ném ReferenceError. Lỗi đó
      // rơi đúng vào catch bên dưới và bị ghi log thành "Model X failed", nên
      // nhìn như Gemini lỗi chứ không phải code sai — vòng thử lại chạy hết 5
      // model rồi mới chịu thua. Dựng URL theo đúng khuôn của embed() bên dưới.
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${key}`;

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
        console.warn(`[AI Gateway] Model ${currentModel} failed with key (Status ${e.status}).`);
        // Khóa hỏng thì lỗi nằm ở KHÓA, không phải ở câu hỏi — đổi khóa rồi thử
        // lại ngay, đừng bỏ cuộc và trả null.
        if (e.status === 400 && /API key not valid|API_KEY_INVALID/i.test(e.body || '')) {
          markKeyDead(key, 'API key not valid');
          if (KEYS().some((k) => !deadKeys.has(k))) { attempt--; continue; }
          return null;
        }
        const isRetryable = e.status === 429 || e.status >= 500;
        if (!isRetryable) {
          return null; // Don't retry client errors like 400 Bad Request
        }
        if (attempt < MAX_ATTEMPTS - 1) {
          await sleep(Math.min(BACKOFF_BASE_MS() * 2 ** attempt, 8000) + Math.random() * 250);
          continue;
        }
        break; // Try next model
      }
    }
  }

  if (consecFailures >= 5) sendAlert('Gemini generate failing on all free models and keys', { status: lastErr?.status, msg: lastErr?.message });
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
  const clean = String(text).replace(/\s+/g, ' ').trim().slice(0, 2000);
  if (!clean) return null;
  const ck = 'emb:' + clean;
  const cached = cacheGet(ck); if (cached) return cached;

  if (getQuotaStatus().saturated) return null;

  const EMBED_MODELS = [EMBED_MODEL, 'text-embedding-004'];
  const uniqueEmbedModels = [...new Set(EMBED_MODELS)];

  let lastErr;
  for (const currentModel of uniqueEmbedModels) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const key = getNextKey();
      if (!key) {
        lastErr = new Error('No API keys available in the pool');
        break;
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:embedContent?key=${key}`;
      try {
        minuteHits.push(Date.now()); dayCount++;
        const data = await rawFetch(url, { content: { parts: [{ text: clean }] } });
        consecFailures = 0;
        const vec = data?.embedding?.values || null;
        if (vec) {
          cacheSet(ck, vec, 24 * 60 * 60 * 1000);
          return vec;
        }
      } catch (e) {
        lastErr = e; consecFailures++;
        const isRetryable = e.status === 429 || e.status >= 500;
        if (!isRetryable) {
          return null; // Don't retry client errors like 400 Bad Request
        }
        if (attempt < MAX_ATTEMPTS - 1) {
          await sleep(Math.min(BACKOFF_BASE_MS() * 2 ** attempt, 6000));
          continue;
        }
        break;
      }
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
