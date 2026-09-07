import { IndexedDBStorage } from "../../utils/indexedDBStorage";

const DEFAULT_TIMEOUT_MS = 12000;

class VocabService {
  constructor({ baseUrl, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    this.baseUrl = baseUrl || import.meta.env.VITE_API_URL || "/api";
    this.timeoutMs = timeoutMs;
  }

  async request(path, options = {}) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), this.timeoutMs);
    const { signal: callerSignal, ...requestOptions } = options;
    const signal = callerSignal || controller.signal;

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        credentials: "include",
        ...requestOptions,
        signal,
      });
      const data = await response.json().catch(() => ({}));
      return { ...data, _status: response.status, _ok: response.ok };
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  get(path, options) {
    return this.request(path, { ...options, method: "GET" });
  }

  async cachedGet(path, cacheKey, options) {
    try {
      const data = await this.get(path, options);
      if (data?._ok) {
        await IndexedDBStorage.saveCache(cacheKey, data);
        return data;
      }
    } catch {
      // Fall through to the last successful response.
    }
    return IndexedDBStorage.getCache(cacheKey);
  }

  post(path, body, options) {
    return this.request(path, {
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
      body: JSON.stringify(body),
    });
  }

  async stream(path, body, onChunk, options = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      credentials: "include",
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      body: JSON.stringify(body),
    });
    if (!response.ok || !response.body) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || data.error || `AI request failed (${response.status})`);
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = JSON.parse(line.slice(5).trim());
        if (payload.error) throw new Error(payload.message || payload.error);
        if (payload.text) { fullText += payload.text; onChunk?.(payload.text); }
      }
      if (done) break;
    }
    return fullText;
  }
}

const vocabApi = new VocabService();

export { VocabService };
export default vocabApi;
