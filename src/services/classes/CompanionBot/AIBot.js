import BaseBot from "./BaseBot";
import pLimit from "p-limit";

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
      formData.append("userId", this.bio?.email || "unknown");
      const res = await fetchWithRetry(`${API_URL}/chat/audio`, { method: "POST", body: formData });
      if (res?.ok) return await res.json();
    } catch (_) {}
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

  async chat(message) {
    const key = this._cacheKey(message);
    if (this._replyCache.has(key)) return this._replyCache.get(key);
    try {
      const res = await fetchWithRetry(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: this._buildHistory(), bio: this._bioWithSummary(), userId: this.bio?.email || "unknown" })
      });
      if (res?.ok) {
        const data = await res.json();
        let replyText = data.reply || "";
        let bioUpdate = null;
        const updateRegex = /\[UPDATE_PROFILE:\s*({.*?})\]/i;
        const match = replyText.match(updateRegex);
        if (match?.[1]) {
          try { bioUpdate = JSON.parse(match[1]); } catch (_) {}
          replyText = replyText.replace(updateRegex, "").trim();
        }
        const result = {
          reply: replyText,
          suggestPhq9:    replyText.includes("PHQ-9")    || replyText.includes("Trầm cảm"),
          suggestGad7:    replyText.includes("GAD-7")    || replyText.includes("Lo âu"),
          suggestWho5:    replyText.includes("WHO-5")    || replyText.includes("Hạnh phúc"),
          suggestBigFive: replyText.includes("Big Five") || replyText.includes("MMPI") || replyText.includes("Nhân cách"),
          bioUpdate
        };
        if (this._replyCache.size > 40) this._replyCache.delete(this._replyCache.keys().next().value);
        this._replyCache.set(key, result);
        return result;
      }
    } catch (_) {}

    return {
      reply: `Tớ ghi nhận chia sẻ của cậu: "${message}". Hiện tớ đang offline tạm thời, nhưng tớ vẫn luôn bên cậu nhé!`,
      suggestPhq9: false, suggestGad7: false, suggestWho5: false, suggestBigFive: false, bioUpdate: null
    };
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
      const res = await _streamLimit(() => fetchWithRetry(`${API_URL}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: this._buildHistory(), bio: this._bioWithSummary(), userId: this.bio?.email || "unknown" })
      }));
      if (!res?.ok) throw new Error("Server error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false, fullReply = "", buffer = "", serverError = false;

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
                  serverError = true;
                  fullReply = "Tớ rất tiếc, máy chủ AI đang bị quá tải hoặc gặp sự cố kết nối. Cậu thử lại sau ít phút hoặc thực hành các bài tập tự trị liệu nhé!";
                  onChunk?.(fullReply);
                }
              } catch (_) {
                if (rawContent) {
                  fullReply += rawContent;
                  onChunk?.(fullReply);
                }
              }
            } catch (_) {}
          }
        }
      }
      if (serverError && !fullReply.trim()) {
        fullReply = "Tớ rất tiếc, máy chủ AI đang bị quá tải hoặc gặp sự cố kết nối. Cậu thử lại sau ít phút hoặc thực hành các bài tập tự trị liệu nhé!";
        onChunk?.(fullReply);
      }
      if (buffer.trim().startsWith("data: ")) {
        try {
          const rawContent = buffer.substring(6).trim();
          try {
            const p = JSON.parse(rawContent);
            if (p.text) { fullReply += p.text; onChunk?.(fullReply); }
            else if (p.error) {
              serverError = true;
              fullReply = "Tớ rất tiếc, máy chủ AI đang bị quá tải hoặc gặp sự cố kết nối. Cậu thử lại sau ít phút hoặc thực hành các bài tập tự trị liệu nhé!";
              onChunk?.(fullReply);
            }
          } catch (_) {
            if (rawContent) {
              fullReply += rawContent;
              onChunk?.(fullReply);
            }
          }
        } catch (_) {}
      }

      let replyText = fullReply, bioUpdate = null;
      const updateRegex = /\[UPDATE_PROFILE:\s*({.*?})\]/i;
      const match = replyText.match(updateRegex);
      if (match?.[1]) {
        try { bioUpdate = JSON.parse(match[1]); } catch (_) {}
        replyText = replyText.replace(updateRegex, "").trim();
      }

      const result = {
        reply: replyText,
        suggestPhq9:    replyText.includes("PHQ-9")    || replyText.includes("Trầm cảm"),
        suggestGad7:    replyText.includes("GAD-7")    || replyText.includes("Lo âu"),
        suggestWho5:    replyText.includes("WHO-5")    || replyText.includes("Hạnh phúc"),
        suggestBigFive: replyText.includes("Big Five") || replyText.includes("MMPI") || replyText.includes("Nhân cách"),
        bioUpdate
      };
      // Cache successful streaming replies so identical follow-up messages skip the server.
      if (replyText && !bioUpdate) {
        if (this._replyCache.size > 40) this._replyCache.delete(this._replyCache.keys().next().value);
        this._replyCache.set(key, result);
      }
      onDone?.(result);
    } catch (err) {
      console.warn("AIBot chatStream error:", err);
      onDone?.({
        reply: "Tớ đang gặp sự cố kết nối. Cậu hãy thử lại sau nhé!",
        suggestPhq9: false, suggestGad7: false, suggestWho5: false, suggestBigFive: false, bioUpdate: null
      });
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
          userId: this.bio?.email || "unknown"
        })
      });
      if (res?.ok) {
        return await res.json();
      }
    } catch (_) {}
    return { intent: "fallback" };
  }

  logLocalMatch(message, intentId) {
    // Fire-and-forget telemetry — never await, never let a failure affect the chat UI.
    fetchWithRetry(`${API_URL}/intent/log-local`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, intentId, userId: this.bio?.email || "unknown" })
    }).catch(() => {});
  }

  async getRemainingTokens() {
    try {
      const res = await fetchWithRetry(`${API_URL}/chat/remaining?userId=${encodeURIComponent(this.bio?.email || "unknown")}`, {
        method: "GET"
      });
      if (res?.ok) {
        return await res.json();
      }
    } catch (_) {}
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
    } catch (_) {}
    return null;
  }
}
