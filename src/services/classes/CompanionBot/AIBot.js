import BaseBot from "./BaseBot";
import pLimit from "p-limit";
import { buildLocalReply } from "./localFallback";
import { loadSecureMemory } from "../../../components/member/banhocduong/utils/secureMemory";
import { executeHybridRace } from "./hybridRaceEngine";

// Detect structured test-suggestion markers the server is asked to emit, e.g.
// "[[SUGGEST:phq9,gad7]]". Falls back to the old keyword scan for older server
// builds that haven't adopted the marker yet.
const SUGGEST_MARKER = /\[\[SUGGEST:\s*([a-z0-9,\s]+)\]\]/i;
const BUY_MARKER = /\[\[BUY:\s*([a-z0-9_]+)\]\]/i;
export function extractSuggestions(text) {
  const flags = {
    suggestPhq9: false,
    suggestGad7: false,
    suggestWho5: false,
    suggestBigFive: false,
    suggestDass42: false,
    suggestMmpi30: false,
    showInlineBreathing: false,
    showInlineCbt: false,
    showInlineBuy: null
  };

  let cleanText = text;
  const buyMatch = cleanText.match(BUY_MARKER);
  if (buyMatch) {
    flags.showInlineBuy = buyMatch[1].toLowerCase().trim();
    cleanText = cleanText.replace(BUY_MARKER, "").trim();
  }

  const m = cleanText.match(SUGGEST_MARKER);
  if (m) {
    const ids = m[1].toLowerCase().split(",").map((s) => s.trim());
    flags.suggestPhq9 = ids.includes("phq9");
    flags.suggestGad7 = ids.includes("gad7");
    flags.suggestWho5 = ids.includes("who5");
    flags.suggestBigFive = ids.includes("bigfive");
    // "mmpi" here means the real mmpi30 screener — previously misrouted to Big Five.
    flags.suggestMmpi30 = ids.includes("mmpi") || ids.includes("mmpi30");
    flags.suggestDass42 = ids.includes("dass") || ids.includes("dass42") || ids.includes("dass21");
    flags.showInlineBreathing = ids.includes("breathing") || ids.includes("breath");
    flags.showInlineCbt = ids.includes("cbt") || ids.includes("cbt_card");
    return { flags, cleanText: cleanText.replace(SUGGEST_MARKER, "").trim() };
  }
  // Legacy fallback: infer from mentioned test names in the reply prose.
  flags.suggestPhq9 = cleanText.includes("PHQ-9");
  flags.suggestGad7 = cleanText.includes("GAD-7");
  flags.suggestWho5 = cleanText.includes("WHO-5");
  flags.suggestBigFive = cleanText.includes("Big Five") || cleanText.includes("Nhân cách");
  flags.suggestDass42 = cleanText.includes("DASS-21") || cleanText.includes("DASS-42") || cleanText.includes("DASS42");
  flags.suggestMmpi30 = cleanText.includes("MMPI");

  // Dynamic keyword-based detection for interactive widgets
  const lowerText = cleanText.toLowerCase();
  flags.showInlineBreathing = lowerText.includes("[[breathing]]") || lowerText.includes("hít thở 4-7-8") || lowerText.includes("bài tập thở");
  flags.showInlineCbt = lowerText.includes("[[cbt]]") || lowerText.includes("thử thách suy nghĩ") || lowerText.includes("cbt nhật ký");

  // Clean any explicit inline widget tags from the text
  cleanText = cleanText.replace(/\[\[breathing\]\]/gi, "").replace(/\[\[cbt\]\]/gi, "").trim();

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
  "Hế lô đồ ngốc! 🌸 Tớ là HugoPSY đây, hôm nay ai chọc giận hay làm cậu buồn thế, khai mau tớ đền cho cốc trà sữa nào! 😜",
  "Cậu vào rồi nè! Tớ đang ngồi chờ mòn mỏi luôn á 😜 Hôm nay có drama gì hay có nỗi niềm gì xả cho tớ nghe đi!",
  "Ôi cậu quay lại rồi! 🥹 Đang định bắt cóc cậu ra tâm sự nè. Hôm nay thế nào rồi, ổn không hay lại overthinking nữa rồi hả?",
  "Heyyy người đẹp/đẹp trai ơi! Tớ ở đây nè. Kể tớ nghe hôm nay 1 từ mô tả vibe của cậu đi?",
  "Chào cậu nha! Tớ luôn sẵn sàng ngồi hóng nè — có chuyện gì bức bối cứ xả hết ra đây tớ gánh hết cho! 💙",
];
const LOCAL_GREETINGS_HEALING = [
  "Cậu đang trên đà phục hồi giỏi dữ nghen — tớ tự hào về cậu lắm luôn đó! 🌱 Hôm nay tâm trạng sao rồi nè?",
  "Hế lô cậu iu! Hành trình của cậu đang tiến triển siêu ngon luôn. Hôm nay muốn làm bài tập hay chỉ thích ngồi buôn chuyện nhây với tớ thôi?",
  "Tớ luôn ở cạnh ôm ấp cậu nha — cứ việc là chính mình, có tớ gánh hết nỗi niềm cho nè 💙",
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

    const checkins = logs.filter(l => l && l.type === "checkin" && l.mood && l.date);
    if (checkins.length > 0) {
      try {
        const days = new Set(checkins.map(c => {
          const d = new Date(c.date);
          return isNaN(d.getTime()) ? null : d.toDateString();
        }).filter(Boolean));
        let streak = 0;
        let cursor = new Date();
        if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
        while (days.has(cursor.toDateString()) && streak < 365) { streak++; cursor.setDate(cursor.getDate() - 1); }
        const latestMood = checkins[checkins.length - 1].mood;
        parts.push(`Streak check-in hiện tại: ${streak} ngày. Tâm trạng check-in gần nhất: ${latestMood}/5.`);
      } catch (e) {
        console.warn("Lỗi tính streak checkin:", e);
      }
    }

    ["phq9", "gad7", "who5", "dass42", "mmpi30", "bigfive"].forEach(testId => {
      const testLogs = logs.filter(l => l.test === testId || (l.type === "clinical_test" && l.test === testId));
      if (testLogs.length > 0) {
        const latest = testLogs[testLogs.length - 1];
        const daysAgo = Math.floor((Date.now() - new Date(latest.date || Date.now()).getTime()) / 86_400_000);
        const daysAgoStr = daysAgo <= 0 ? "hôm nay" : `${daysAgo} ngày trước`;
        if (testId === "dass42") {
          parts.push(`Test DASS-42 gần nhất: D:${latest.scores?.D ?? 0}/42, A:${latest.scores?.A ?? 0}/42, S:${latest.scores?.S ?? 0}/42 (${daysAgoStr}).`);
        } else if (testId === "mmpi30") {
          const elev = latest.clinical ? latest.clinical.filter(c => c.score >= 70).length : 0;
          parts.push(`Test MMPI-30 gần nhất: ${elev} thang vượt ngưỡng (${daysAgoStr}).`);
        } else if (testId === "bigfive") {
          const t = latest.traits || {};
          parts.push(`Test Big Five gần nhất: Hướng ngoại ${t.extraversion || 3.5}/5, Nhạy cảm ${t.neuroticism || 2.5}/5 (${daysAgoStr}).`);
        } else {
          parts.push(`Test ${testId.toUpperCase()} gần nhất: ${latest.score} điểm, ${daysAgoStr}.`);
        }
      }
    });

    const sleepLogs = (this.bio?.sleepLogs || []).filter(l => l.duration);
    if (sleepLogs.length > 0) {
      const avgDur = (sleepLogs.slice(-7).reduce((acc, l) => acc + (Number(l.duration) || 0), 0) / Math.min(sleepLogs.length, 7)).toFixed(1);
      const debt = Math.max(0, (7.5 - avgDur)).toFixed(1);
      parts.push(`Giấc ngủ 7 ngày gần đây: Trung bình ${avgDur}h/đêm${debt > 0 ? ` (Nợ giấc ngủ ${debt}h)` : ""}.`);
    }

    return parts.join(" ");
  }

  // secureMemory (src/components/member/banhocduong/utils/secureMemory.js) is
  // tracked entirely client-side today and only ever consulted by the local
  // (non-AI) intent classifier — the real Gemini conversation never saw it,
  // so it re-diagnosed the user's stress triggers and relationship context
  // from scratch every message. Condensing it into a short line here lets
  // the AI carry that understanding across the whole conversation for free
  // (no extra model calls, just a few more prompt tokens).
  _buildPsychProfile() {
    const TRIGGER_LABELS = {
      family: "gia đình", studies: "học tập", peers: "bạn bè",
      love: "tình cảm", health: "sức khoẻ/giấc ngủ"
    };
    const RELATIONSHIP_LABELS = {
      single_recently_broken_up: "vừa chia tay gần đây",
      in_relationship: "đang trong một mối quan hệ",
      has_crush: "đang có tình cảm với ai đó (crush)"
    };
    const PERSONALITY_TRAIT_LABELS = {
      overthinking: "xu hướng overthinking / nghĩ nhiều",
      perfectionism: "xu hướng cầu toàn / sợ sai",
      introverted_preference: "phong cách hướng nội / cần khoảng không riêng",
      emotional_sensitivity: "cảm nhận cảm xúc sâu sắc và nhạy cảm"
    };
    try {
      const memory = loadSecureMemory(this.bio);
      const parts = [];

      // Big Five traits from history logs
      const bigFiveLogs = (this.historyLogs || []).filter(l => (l.test === "bigfive" || (l.type === "clinical_test" && l.test === "bigfive")) && l.traits);
      if (bigFiveLogs.length > 0) {
        const bf = bigFiveLogs[bigFiveLogs.length - 1].traits;
        parts.push(`Hồ sơ nhân cách Big Five: Hướng ngoại ${bf.extraversion}/5, Dễ chịu ${bf.agreeableness}/5, Tận tụy ${bf.conscientiousness}/5, Nhạy cảm cảm xúc ${bf.neuroticism}/5, Cởi mở ${bf.openness}/5.`);
      }

      if (memory) {
        const triggers = (memory.stressTriggers || []).map(t => TRIGGER_LABELS[t]).filter(Boolean);
        if (triggers.length > 0) parts.push(`Chủ đề hay gây áp lực gần đây: ${triggers.join(", ")}.`);

        if (memory.relationshipStatus && RELATIONSHIP_LABELS[memory.relationshipStatus]) {
          parts.push(`Tình trạng tình cảm: ${RELATIONSHIP_LABELS[memory.relationshipStatus]}.`);
        }

        const personalityList = (memory.personalityTraits || []).map(p => PERSONALITY_TRAIT_LABELS[p]).filter(Boolean);
        if (personalityList.length > 0) {
          parts.push(`Đặc điểm tâm lý ghi nhận qua các lượt trò chuyện: ${personalityList.join(", ")}.`);
        }

        const trend = memory.sentimentTrend;
        if (Array.isArray(trend) && trend.length >= 3) {
          const avg = trend.reduce((a, b) => a + b, 0) / trend.length;
          if (avg <= -0.4) parts.push("Xu hướng cảm xúc vài lượt gần đây: nghiêng về tiêu cực.");
          else if (avg >= 0.4) parts.push("Xu hướng cảm xúc vài lượt gần đây: nghiêng về tích cực.");
        }

        if (memory.examDate) parts.push(`Có mốc thi/deadline sắp tới: ${memory.examDate}.`);
      }

      return parts.join(" ");
    } catch (_) {
      return "";
    }
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
    const psychProfile = this._buildPsychProfile();
    return {
      displayName: this.bio?.displayName || this.bio?.name || "",
      ...(age ? { age } : {}),
      ...(summary ? { wellnessSummary: summary } : {}),
      ...(psychProfile ? { psychProfile } : {})
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
      console.warn("AIBot chat error: server responded", res?.status);
    } catch (err) {
      console.warn("AIBot chat error:", err);
    }

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
      
    const isPWAStandalone = typeof window !== "undefined" && (
      window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
    );

    if (isPWAStandalone) {
      const hybridResult = await executeHybridRace({
        userMessage: message,
        opts: { bio: this.bio, historyLogs: this.historyLogs },
        onChunk,
        fetchCloudStream: async (timeoutMs) => {
          const userId = await this._aiUserId();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

          const res = await _streamLimit(() => fetch(`${API_URL}/chat/stream`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "X-Internal-Key": INTERNAL_KEY
            },
            body: JSON.stringify({ message, history: this._buildHistory(), bio: this._bioWithSummary(), userId }),
            signal: controller.signal
          })).finally(() => clearTimeout(timeoutId));

          if (!res || !res.ok) throw new Error("Cloud stream timeout/failed");
          
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let done = false, fullReply = "";

          while (!done) {
            const { value, done: rd } = await reader.read();
            done = rd;
            if (value) {
              const text = decoder.decode(value, { stream: true });
              fullReply += text;
              onChunk?.(fullReply);
            }
          }
          const { flags, cleanText } = extractSuggestions(fullReply);
          return { reply: cleanText, ...flags };
        }
      });

      this._replyCache.set(key, hybridResult);
      onDone?.(hybridResult);
      return;
    }

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

      if (!res || !res.ok) throw new Error(`Server responded ${res?.status ?? "no response"}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false, fullReply = "", buffer = "", serverError = false, serverErrorDetail = null, outOfTokens = false, outOfTokensMessage = "";

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
                  serverErrorDetail = p.error;
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
                serverErrorDetail = p.error;
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
        if (serverError) console.warn("AIBot chatStream server error:", serverErrorDetail);
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
