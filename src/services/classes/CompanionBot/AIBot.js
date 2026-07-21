import BaseBot from "./BaseBot";
import pLimit from "p-limit";
import { buildLocalReply } from "./localFallback";

// Detect structured test-suggestion markers the server is asked to emit, e.g.
// "[[SUGGEST:phq9,gad7]]". Falls back to the old keyword scan for older server
// builds that haven't adopted the marker yet.
const SUGGEST_MARKER = /\[\[SUGGEST:\s*([a-z0-9,\s]+)\]\]/i;
function extractSuggestions(text) {
  const flags = {
    suggestPhq9: false,
    suggestGad7: false,
    suggestWho5: false,
    suggestBigFive: false,
    showInlineBreathing: false,
    showInlineCbt: false
  };
  const m = text.match(SUGGEST_MARKER);
  if (m) {
    const ids = m[1].toLowerCase().split(",").map((s) => s.trim());
    flags.suggestPhq9 = ids.includes("phq9");
    flags.suggestGad7 = ids.includes("gad7");
    flags.suggestWho5 = ids.includes("who5");
    flags.suggestBigFive = ids.includes("bigfive") || ids.includes("mmpi");
    flags.showInlineBreathing = ids.includes("breathing") || ids.includes("breath");
    flags.showInlineCbt = ids.includes("cbt") || ids.includes("cbt_card");
    return { flags, cleanText: text.replace(SUGGEST_MARKER, "").trim() };
  }
  // Legacy fallback: infer from mentioned test names in the reply prose.
  flags.suggestPhq9 = text.includes("PHQ-9");
  flags.suggestGad7 = text.includes("GAD-7");
  flags.suggestWho5 = text.includes("WHO-5");
  flags.suggestBigFive = text.includes("Big Five") || text.includes("Nhân cách");

  // Dynamic keyword-based detection for interactive widgets
  const lowerText = text.toLowerCase();
  flags.showInlineBreathing = lowerText.includes("[[breathing]]") || lowerText.includes("hít thở 4-7-8") || lowerText.includes("bài tập thở");
  flags.showInlineCbt = lowerText.includes("[[cbt]]") || lowerText.includes("thử thách suy nghĩ") || lowerText.includes("cbt nhật ký");

  // Clean any explicit inline widget tags from the text
  let cleanText = text.replace(/\[\[breathing\]\]/gi, "").replace(/\[\[cbt\]\]/gi, "").trim();

  return { flags, cleanText };
}

// Module-level concurrency limiter — shared across all AIBot instances so
// concurrent streaming calls from the same page queue instead of flooding
// the server. Max 2 in-flight AI streams at once; extras wait their turn.
const _streamLimit = pLimit(2);

// The Python AI server has no public subdomain of its own — it's reached
// same-origin through the main API gateway's /api/ai/* proxy (see
// server/routes/aiProxyRoutes.js), exactly like every other /api/* route.
const API_BASE = import.meta.env.VITE_API_URL || "/api";
const API_URL = `${API_BASE}/ai`;
const INTERNAL_KEY = import.meta.env.VITE_INTERNAL_API_KEY || "";
const AI_USER_ID_SALT = import.meta.env.VITE_AI_USER_ID_SALT || "hugopsy-ai-user-v1";

function fallbackHash(input) {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i += 1) {
    h1 ^= input.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193);
    h2 = Math.imul(h2 ^ input.charCodeAt(i), 0x85ebca6b);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, "0")}${(h2 >>> 0).toString(16).padStart(8, "0")}`;
}

async function pseudonymizeUserId(rawUserId) {
  const normalized = String(rawUserId || "").trim().toLowerCase();
  if (!normalized || normalized === "unknown") return "unknown";
  const input = `${AI_USER_ID_SALT}:${normalized}`;
  try {
    if (globalThis.crypto?.subtle) {
      const bytes = new TextEncoder().encode(input);
      const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
      const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
      return `u_${hex.slice(0, 32)}`;
    }
  } catch (_) {
    /* fall through to non-PII deterministic fallback */
  }
  return `u_${fallbackHash(input)}`;
}

// 1 retry (2 total attempts) instead of 2 retries (3 attempts) — when the
// server is overloaded each extra attempt multiplies the load. Backoff: 800ms.
async function fetchWithRetry(url, options, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { ...options, headers: { ...options.headers, "X-Internal-Key": INTERNAL_KEY } });
      if (res.ok) return res;
      if (res.status >= 400 && res.status < 500) return res;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 800));
        continue;
      }
      return null;
    } catch (err) {
      if (attempt === retries) return null;
      await new Promise(r => setTimeout(r, 800));
    }
  }
  return null;
}

// Greetings served locally — zero server cost, instant display.
const LOCAL_GREETINGS_ACTIVE = [
  "Heyyy! Tớ là HugoPSY 🌸 Hôm nay cậu vibe sao rồi?",
  "Cậu vào rồi nè! Tớ đang chờ mà 😊 Có điều gì đang làm cậu suy nghĩ không?",
  "Ôi cậu quay lại rồi! 🥹 Dạo này cậu ổn không, hay có gì muốn xả không?",
  "Hey cậu ơi! Tớ ở đây. Hôm nay cậu cảm thấy thế nào — 1 từ thôi cũng được nha?",
  "Chào cậu! Tớ luôn sẵn nghe — cậu đang ổn, hay có điều gì đang trăn trở?",
];
const LOCAL_GREETINGS_HEALING = [
  "Cậu đang trên đà phục hồi — tớ tự hào về cậu lắm! 🌱 Hôm nay sao rồi?",
  "Chào cậu! Hành trình của cậu đang đi rất tốt đó. Hôm nay muốn làm bài tập hay chỉ tâm sự thôi?",
  "Tớ luôn đồng hành cùng cậu nha — tiếp tục bước tiếp cùng nhau nhé. Hôm nay cậu cảm thấy gì? 💙",
];


export default class AIBot extends BaseBot {
  constructor(...args) {
    super(...args);
    // Session-scoped LRU cache: normalized message → full reply object.
    // Prevents identical messages from hitting the server repeatedly.
    this._replyCache = new Map();
    // Minimum ms between streaming AI calls to protect the server from bursts.
    this._lastStreamTs = 0;
    this._aiUserIdPromise = null;
  }

  // Serve greeting locally — zero server call, instant display.
  async getGreeting() {
    const pool = this.healingActive ? LOCAL_GREETINGS_HEALING : LOCAL_GREETINGS_ACTIVE;
    const base = pool[Math.floor(Math.random() * pool.length)];
    const name = this.bio?.displayName?.split(" ").at(-1);
    return name ? base.replace(/cậu/i, name).replace(/Cậu/i, name) : base;
  }

  // Serve dialogue-tree responses from the pre-written text directly —
  // AI rewriting every selection was a major source of unnecessary API calls.
  async getResponse(selectedItem, type) {
    const responses = selectedItem[type];
    return Array.isArray(responses) ? responses[0] : (responses || "");
  }

  async streamResponse(selectedItem, type, onChunk, onDone) {
    const responses = selectedItem[type];
    const text = Array.isArray(responses) ? responses.join("\n\n") : (responses || "");
    // Serve dialogue responses locally (no streaming needed for pre-written text)
    onChunk?.(text);
    onDone?.({ reply: text, suggestPhq9: false, suggestGad7: false, suggestWho5: false, suggestBigFive: false, bioUpdate: null });
  }

  async chatAudio(audioBlob, isCallMode = false) {
    try {
      const mappedHistory = this._buildHistory();
      const formData = new FormData();
      formData.append("file", audioBlob, "voice.webm");
      formData.append("history", JSON.stringify(mappedHistory));
      formData.append("bio", JSON.stringify(this._bioWithSummary() || {}));
      formData.append("isCallMode", isCallMode);
      formData.append("userId", await this._aiUserId());
      const res = await fetchWithRetry(`${API_URL}/chat/audio`, { method: "POST", body: formData });
      if (res?.ok) return await res.json();
    } catch (_) { /* ignore */ }
    return null;
  }

  // Recent actual conversation turns (last 7 days only, see ChatTab.jsx's
  // CHAT_RETENTION_MS) — this was previously mapping over historyLogs (mood/
  // test indicator entries, which have no .sender/.text) and so was silently
  // sending almost no real context to the LLM. Now uses the real chat array.
  _buildHistory(limit = 6) {
    return (this.chatMessages || []).slice(-limit).map(log => ({
      role: log.sender === "bot" ? "model" : "user",
      content: log.text || log.desc || ""
    })).filter(i => i.content !== "");
  }

  // Long-term "memory" substitute: since raw chat is pruned after 7 days,
  // this condenses historyLogs (mood check-ins, clinical test scores, streak)
  // into a short Vietnamese summary attached to `bio` so the AI can still
  // speak as if it remembers the user's journey beyond the 7-day window.
  _buildWellnessSummary() {
    const logs = this.historyLogs || [];
    if (logs.length === 0) return "";
    const parts = [];

    const checkins = logs.filter(l => l.type === "checkin" && l.mood);
    if (checkins.length > 0) {
      const days = new Set(checkins.map(c => new Date(c.date).toDateString()));
      let streak = 0;
      let cursor = new Date();
      if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
      while (days.has(cursor.toDateString())) { streak++; cursor.setDate(cursor.getDate() - 1); }
      const latestMood = checkins[checkins.length - 1].mood;
      parts.push(`Streak check-in hiện tại: ${streak} ngày. Tâm trạng check-in gần nhất: ${latestMood}/5.`);
    }

    ["phq9", "gad7", "who5"].forEach(testId => {
      const testLogs = logs.filter(l => l.test === testId);
      if (testLogs.length > 0) {
        const latest = testLogs[testLogs.length - 1];
        const daysAgo = Math.floor((Date.now() - new Date(latest.date).getTime()) / 86_400_000);
        parts.push(`Test ${testId.toUpperCase()} gần nhất: ${latest.score} điểm, ${daysAgo <= 0 ? "hôm nay" : `${daysAgo} ngày trước`}.`);
      }
    });

    return parts.join(" ");
  }

  // Builds the ONLY bio payload ever sent to the third-party AI server
  // (Gemini/OpenRouter). Deliberately a strict allow-list, not the raw Bio
  // document — `this.bio` carries email, phone, address, exact birthday,
  // body measurements etc., none of which should ever leave the client and
  // reach an external AI provider. Only a display name and a derived age
  // *number* (no birthdate) go out, plus the aggregated wellness summary.
  _bioWithSummary() {
    let age = null;
    const dob = this.bio?.dob || this.bio?.birthday;
    if (dob) {
      const year = parseInt(String(dob).match(/\d{4}/)?.[0], 10);
      if (year) age = new Date().getFullYear() - year;
    }
    const summary = this._buildWellnessSummary();
    return {
      displayName: this.bio?.displayName || this.bio?.name || "",
      ...(age ? { age } : {}),
      ...(summary ? { wellnessSummary: summary } : {})
    };
  }

  _cacheKey(message) {
    return message.trim().toLowerCase().slice(0, 120);
  }

  _aiUserId() {
    if (!this._aiUserIdPromise) {
      this._aiUserIdPromise = pseudonymizeUserId(this.bio?.email || this.bio?.id || "unknown");
    }
    return this._aiUserIdPromise;
  }

  async chat(message) {
    const key = this._cacheKey(message);
    if (this._replyCache.has(key)) return this._replyCache.get(key);
    try {
      const res = await fetchWithRetry(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: this._buildHistory(), bio: this._bioWithSummary(), userId: await this._aiUserId() })
      });
      if (res?.ok) {
        const data = await res.json();
        let replyText = data.reply || "";
        let bioUpdate = null;
        const updateRegex = /\[UPDATE_PROFILE:\s*({.*?})\]/i;
        const match = replyText.match(updateRegex);
        if (match?.[1]) {
          try { bioUpdate = JSON.parse(match[1]); } catch (_) { /* ignore */ }
          replyText = replyText.replace(updateRegex, "").trim();
        }
        const { flags, cleanText } = extractSuggestions(replyText);
        const result = { reply: cleanText, ...flags, bioUpdate };
        if (this._replyCache.size > 40) this._replyCache.delete(this._replyCache.keys().next().value);
        this._replyCache.set(key, result);
        return result;
      }
    } catch (_) { /* ignore */ }

    // Server unreachable → smart local reply. The user never sees a raw error.
    return buildLocalReply(message);
  }

  async chatStream(message, onChunk, onDone) {
    // Rate-limit: enforce minimum 1.5s between AI streaming calls per instance.
    const now = Date.now();
    if (now - this._lastStreamTs < 1500) {
      const cached = this._replyCache.get(this._cacheKey(message));
      if (cached) {
        onChunk?.(cached.reply);
        onDone?.(cached);
        return;
      }
    }
    this._lastStreamTs = Date.now();

    // Cache hit: serve immediately without streaming.
    const key = this._cacheKey(message);
    if (this._replyCache.has(key)) {
      const cached = this._replyCache.get(key);
      onChunk?.(cached.reply);
      onDone?.(cached);
      return;
    }

    try {
      const userId = await this._aiUserId();
      
      // Use AbortController to prevent long hangs or server offline messages.
      // Falls back to local matching response instantly if connection hangs for 3.5 seconds.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await _streamLimit(() => fetch(`${API_URL}/chat/stream`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Internal-Key": INTERNAL_KEY
        },
        body: JSON.stringify({ message, history: this._buildHistory(), bio: this._bioWithSummary(), userId }),
        signal: controller.signal
      })).finally(() => clearTimeout(timeoutId));

      if (!res || !res.ok) throw new Error("Server error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false, fullReply = "", buffer = "", serverError = false, outOfTokens = false, outOfTokensMessage = "";

      while (!done) {
        const { value, done: rd } = await reader.read();
        done = rd;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();
          for (let line of lines) {
            line = line.trim();
            if (!line.startsWith("data: ")) continue;
            try {
              const rawContent = line.substring(6).trim();
              try {
                const p = JSON.parse(rawContent);
                if (p.text) { fullReply += p.text; onChunk?.(fullReply); }
                else if (p.error) {
                  // Flag only — never stream the raw error text to the user.
                  // The local fallback below produces a natural reply instead.
                  serverError = true;
                }
              } catch (_) {
                if (rawContent) {
                  fullReply += rawContent;
                  onChunk?.(fullReply);
                }
              }
            } catch (_) { /* ignore */ }
          }
        }
      }
      if (buffer.trim().startsWith("data: ")) {
        try {
          const rawContent = buffer.substring(6).trim();
          try {
            const p = JSON.parse(rawContent);
            if (p.text) { fullReply += p.text; onChunk?.(fullReply); }
            else if (p.error) {
              if (p.error === "OUT_OF_TOKENS") {
                outOfTokens = true;
                outOfTokensMessage = p.message || "Bạn đã sử dụng hết token trò chuyện. Bạn có muốn dùng JOY để đổi thêm token không?";
              } else {
                serverError = true;
              }
            }
          } catch (_) {
            if (rawContent) {
              fullReply += rawContent;
              onChunk?.(fullReply);
            }
          }
        } catch (_) { /* ignore */ }
      }

      let replyText = fullReply, bioUpdate = null;
      const updateRegex = /\[UPDATE_PROFILE:\s*({.*?})\]/i;
      const match = replyText.match(updateRegex);
      if (match?.[1]) {
        try { bioUpdate = JSON.parse(match[1]); } catch (_) { /* ignore */ }
        replyText = replyText.replace(updateRegex, "").trim();
      }

      if (outOfTokens) {
        onDone?.({
          outOfTokens: true,
          reply: outOfTokensMessage,
          suggestPhq9: false, suggestGad7: false, suggestWho5: false, suggestBigFive: false, bioUpdate: null
        });
        return;
      }

      // Server errored (or streamed nothing usable) → compose a warm local
      // reply and stream it in, so the user always gets a real answer.
      if (serverError || !replyText.trim()) {
        const local = buildLocalReply(message);
        onChunk?.(local.reply);
        onDone?.(local);
        return;
      }

      const { flags, cleanText } = extractSuggestions(replyText);
      const result = { reply: cleanText, ...flags, bioUpdate };
      // Cache successful streaming replies so identical follow-up messages skip the server.
      if (cleanText && !bioUpdate) {
        if (this._replyCache.size > 40) this._replyCache.delete(this._replyCache.keys().next().value);
        this._replyCache.set(key, result);
      }
      onDone?.(result);
    } catch (err) {
      console.warn("AIBot chatStream error:", err);
      // Network/parse failure → local fallback, never a bare error message.
      const local = buildLocalReply(message);
      onChunk?.(local.reply);
      onDone?.(local);
    }
  }

  async classifyIntent(message) {
    try {
      const res = await fetchWithRetry(`${API_URL}/intent/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: this._buildHistory(6),
          bio: this._bioWithSummary(),
          userId: await this._aiUserId()
        })
      });
      if (res?.ok) {
        return await res.json();
      }
    } catch (_) { /* ignore */ }
    return { intent: "fallback" };
  }

  logLocalMatch(message, intentId) {
    // Fire-and-forget telemetry — never await, never let a failure affect the chat UI.
    this._aiUserId()
      .then((userId) => fetchWithRetry(`${API_URL}/intent/log-local`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, intentId, userId })
      }))
      .catch(() => { /* ignore */ });
  }

  async getRemainingTokens() {
    try {
      const res = await fetchWithRetry(`${API_URL}/chat/remaining?userId=${encodeURIComponent(await this._aiUserId())}`, {
        method: "GET"
      });
      if (res?.ok) {
        return await res.json();
      }
    } catch (_) { /* ignore */ }
    return null;
  }

  async analyzeTest(testName, scores, validity = null, clinical = null, lang = "vi") {
    try {
      const res = await fetchWithRetry(`${API_URL}/analyze-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testName, scores, validity, clinical, lang, bio: this._bioWithSummary() })
      });
      if (res?.ok) { const data = await res.json(); return data.analysis; }
    } catch (_) { /* ignore */ }
    return null;
  }
}
