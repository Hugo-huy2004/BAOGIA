import BaseBot from "./BaseBot";

const getAiUrl = () => {
  if (import.meta.env.VITE_AI_URL) return import.meta.env.VITE_AI_URL;
  const apiUrl = import.meta.env.VITE_API_URL || "";
  if (apiUrl.startsWith("http")) {
    try {
      const url = new URL(apiUrl);
      if (url.hostname.startsWith("api.")) {
        url.hostname = url.hostname.replace("api.", "ai.");
        return `${url.protocol}//${url.hostname}`;
      }
    } catch (e) {}
  }
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    if (window.location.hostname.includes("hugowishpax.studio")) {
      return `${window.location.protocol}//ai.hugowishpax.studio`;
    }
  }
  return "http://localhost:8000";
};

const API_URL = getAiUrl();
const INTERNAL_KEY = import.meta.env.VITE_INTERNAL_API_KEY || "";

async function fetchWithRetry(url, options, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { ...options, headers: { ...options.headers, "X-Internal-Key": INTERNAL_KEY } });
      if (res.ok) return res;
      if (res.status >= 400 && res.status < 500) return res; // Don't retry client errors
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  return null;
}

export default class AIBot extends BaseBot {

  async getGreeting() {
    try {
      const res = await fetchWithRetry(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Hãy đưa ra một câu chào thân mật bằng tiếng Việt dành cho người dùng quay trở lại không gian đồng hành chữa lành sức khỏe tinh thần.",
          history: [],
          bio: this.bio,
          userId: this.bio?.email || "unknown"
        })
      });
      if (res?.ok) {
        const data = await res.json();
        return data.reply;
      }
    } catch (_) {}

    const name = this.bio?.displayName || "cậu";
    return this.healingActive
      ? `Chào ${name}! Tớ là Bạn Học Đường AI của cậu đây. Cậu đang trong lộ trình phục hồi — hôm nay cậu thấy thế nào?`
      : `Chào ${name}! Tớ là AI Đồng Hành chuyên biệt. Tớ ở đây để lắng nghe mà không phán xét. Dạo này cậu thế nào?`;
  }

  async getResponse(selectedItem, type) {
    const responses = selectedItem[type];
    const baseText = Array.isArray(responses) ? responses[0] : (responses || "");
    try {
      const res = await fetchWithRetry(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Viết lại câu phản hồi sau đây một cách đồng cảm, ấm áp, sâu sắc và tự nhiên hơn, xưng hô 'tớ' và 'cậu': "${baseText}"`,
          history: [],
          bio: this.bio,
          userId: this.bio?.email || "unknown"
        })
      });
      if (res?.ok) { const data = await res.json(); return data.reply; }
    } catch (_) {}
    const name = this.bio?.displayName ? this.bio.displayName.split(" ").at(-1) : "cậu";
    return `${baseText} (${name} nhé!)`;
  }

  async streamResponse(selectedItem, type, onChunk, onDone) {
    const responses = selectedItem[type];
    const baseText = Array.isArray(responses) ? responses[0] : (responses || "");
    const prompt = `Viết lại câu phản hồi sau đây một cách đồng cảm, ấm áp, sâu sắc và tự nhiên hơn, xưng hô 'tớ' và 'cậu': "${baseText}"`;
    return this.chatStream(prompt, onChunk, onDone);
  }

  async chatAudio(audioBlob, isCallMode = false) {
    try {
      const mappedHistory = this._buildHistory();
      const formData = new FormData();
      formData.append("file", audioBlob, "voice.webm");
      formData.append("history", JSON.stringify(mappedHistory));
      formData.append("bio", JSON.stringify(this.bio || {}));
      formData.append("isCallMode", isCallMode);
      formData.append("userId", this.bio?.email || "unknown");
      const res = await fetchWithRetry(`${API_URL}/api/ai/chat/audio`, { method: "POST", body: formData });
      if (res?.ok) return await res.json();
    } catch (_) {}
    return null;
  }

  _buildHistory(limit = 8) {
    return (this.historyLogs || []).slice(-limit).map(log => ({
      role: log.sender === "bot" ? "model" : "user",
      content: log.text || log.desc || ""
    })).filter(i => i.content !== "");
  }

  async chat(message) {
    try {
      const res = await fetchWithRetry(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: this._buildHistory(), bio: this.bio, userId: this.bio?.email || "unknown" })
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
        return {
          reply: replyText,
          suggestPhq9:    replyText.includes("PHQ-9")    || replyText.includes("Trầm cảm"),
          suggestGad7:    replyText.includes("GAD-7")    || replyText.includes("Lo âu"),
          suggestWho5:    replyText.includes("WHO-5")    || replyText.includes("Hạnh phúc"),
          suggestBigFive: replyText.includes("Big Five") || replyText.includes("MMPI") || replyText.includes("Nhân cách"),
          bioUpdate
        };
      }
    } catch (_) {}

    return {
      reply: `Tớ ghi nhận chia sẻ của cậu: "${message}". Hiện tớ đang offline tạm thời, nhưng tớ vẫn luôn bên cậu nhé!`,
      suggestPhq9: false, suggestGad7: false, suggestWho5: false, suggestBigFive: false, bioUpdate: null
    };
  }

  async chatStream(message, onChunk, onDone) {
    try {
      const res = await fetchWithRetry(`${API_URL}/api/ai/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: this._buildHistory(), bio: this.bio, userId: this.bio?.email || "unknown" })
      });
      if (!res?.ok) throw new Error("Server error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false, fullReply = "", buffer = "";

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
              const p = JSON.parse(line.substring(6));
              if (p.text) { fullReply += p.text; onChunk?.(fullReply); }
              else if (p.error) { fullReply += p.error; onChunk?.(fullReply); }
            } catch (_) {}
          }
        }
      }
      if (buffer.trim().startsWith("data: ")) {
        try {
          const p = JSON.parse(buffer.substring(6).trim());
          if (p.text) { fullReply += p.text; onChunk?.(fullReply); }
        } catch (_) {}
      }

      let replyText = fullReply, bioUpdate = null;
      const updateRegex = /\[UPDATE_PROFILE:\s*({.*?})\]/i;
      const match = replyText.match(updateRegex);
      if (match?.[1]) {
        try { bioUpdate = JSON.parse(match[1]); } catch (_) {}
        replyText = replyText.replace(updateRegex, "").trim();
      }

      onDone?.({
        reply: replyText,
        suggestPhq9:    replyText.includes("PHQ-9")    || replyText.includes("Trầm cảm"),
        suggestGad7:    replyText.includes("GAD-7")    || replyText.includes("Lo âu"),
        suggestWho5:    replyText.includes("WHO-5")    || replyText.includes("Hạnh phúc"),
        suggestBigFive: replyText.includes("Big Five") || replyText.includes("MMPI") || replyText.includes("Nhân cách"),
        bioUpdate
      });
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
      const res = await fetchWithRetry(`${API_URL}/api/ai/intent/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      if (res?.ok) {
        return await res.json();
      }
    } catch (_) {}
    return { intent: "fallback" };
  }

  async analyzeTest(testName, scores, validity = null, clinical = null, lang = "vi") {
    try {
      const res = await fetchWithRetry(`${API_URL}/api/ai/analyze-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testName, scores, validity, clinical, lang, bio: this.bio })
      });
      if (res?.ok) { const data = await res.json(); return data.analysis; }
    } catch (_) {}
    return null;
  }
}
