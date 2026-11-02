import { API_BASE } from "../config/apiBase";

/**
 * Nhận diện ngôn ngữ + dịch bài Cộng đồng sang ngôn ngữ người đọc.
 * 1) Trình duyệt có LanguageDetector / Translator (Chrome, chạy TRÊN MÁY, miễn phí, không gửi chữ đi) → dùng nó.
 * 2) Không có → máy chủ dịch một lần mỗi bài mỗi ngôn ngữ (POST /today/posts/:id/translate, lưu lại).
 * Liên kết và đoạn mã không được tính khi nhận diện.
 */
const STRIP = /```[\s\S]*?```|`[^`\n]+`|https?:\/\/\S+/g;
const VI = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
const cache = new Map();

export async function detectLang(raw) {
  const text = String(raw || "").replace(STRIP, " ").trim();
  if (text.length < 2) return null;
  try {
    if (typeof self !== "undefined" && "LanguageDetector" in self && (await self.LanguageDetector.availability()) === "available") {
      const [top] = await (await self.LanguageDetector.create()).detect(text);
      if (top?.confidence > 0.6) return top.detectedLanguage.split("-")[0];
    }
  } catch { /* rơi về đoán theo ký tự */ }
  if (/[㐀-鿿]/.test(text)) return "zh";
  if (VI.test(text)) return "vi";
  return /[a-z]{2,}/i.test(text) ? "en" : null;
}

async function onDevice(text, from, to) {
  if (typeof self === "undefined" || !("Translator" in self)) return null;
  try {
    const options = { sourceLanguage: from, targetLanguage: to };
    if ((await self.Translator.availability(options)) !== "available") return null;
    return await (await self.Translator.create(options)).translate(text);
  } catch { return null; }
}

/** Bản dịch của bài `post` sang `to`, hoặc null nếu không cần/không dịch được. */
export async function translatePost(post, from, to) {
  const key = `${post.key}:${to}`;
  if (cache.has(key)) return cache.get(key);
  const job = (async () => {
    const local = from ? await onDevice(post.text, from, to) : null;
    if (local) return local;
    const r = await fetch(`${API_BASE}/today/posts/${post.key}/translate?board=edu`, {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to, board: "edu" }),
    });
    return r.ok ? (await r.json()).text || null : null;
  })().catch(() => null);
  cache.set(key, job);
  const result = await job;
  if (!result) cache.delete(key); // lần sau thử lại
  return result;
}
