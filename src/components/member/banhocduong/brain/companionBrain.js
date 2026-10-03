// Bộ não của nhân vật đồng hành — model ngôn ngữ chạy NGAY TRÊN MÁY người dùng
// (WebLLM + WebGPU). Tin nhắn không rời khỏi máy; máy chủ không phải nghĩ gì.
//
// Vì sao Qwen3-1.7B: đã thử thật 03/10 cùng một lời nhắc nhân vật tiếng Việt.
//   - Gemma 3 1B: lặp, lạc đề, có lượt khuyên "tìm thuốc" — loại.
//   - Qwen3.5-0.8B: trôi chảy nhưng nói chung chung, không bám điều người dùng kể.
//   - Qwen3-1.7B: ngắn, bám đúng chi tiết ("sợ rớt môn giải tích"), đúng giọng,
//     ~1 giây/câu. Đổi lại cần ~2GB bộ nhớ GPU → chỉ chạy trên máy đủ mạnh;
//     máy còn lại dùng bộ não đám mây (thinkRemote → /api/companion/brain).
// Thử nhiều lượt (03/10) cho thấy 1.7B vẫn lặp/lạc ý, nên thứ tự cuối cùng là:
// thành viên → đám mây (thinkRemote); khách → bộ não trên máy; rồi bộ câu soạn sẵn.
//
// File model tải MỘT lần từ CDN Hugging Face của mlc-ai rồi nằm trong
// Cache Storage của trình duyệt; những lần sau nạp từ máy, chạy được cả offline.
// Thư viện (6MB) chỉ được import khi thật sự cần — người không bật bộ não không
// phải tải nó.
//
// Máy không có WebGPU hoặc không đủ bộ nhớ → isSupported() = false và chat tự
// dùng bộ luật soạn sẵn (cũng chạy trên máy).

export const BRAIN_MODEL_ID = "Qwen3-1.7B-q4f16_1-MLC";

let enginePromise = null;
let engine = null;

const loadLib = () => import("@mlc-ai/web-llm");

/**
 * Máy có chạy nổi bộ não trên máy không: cần WebGPU có shader-f16 (model q4f16)
 * và đủ RAM — `deviceMemory` chỉ Chrome có và bị làm tròn xuống; không biết thì
 * cho thử, nạp hỏng thì client vẫn còn bộ não đám mây.
 */
export async function isSupported() {
  try {
    if (typeof navigator === "undefined" || !navigator.gpu) return false;
    if (typeof navigator.deviceMemory === "number" && navigator.deviceMemory < 4) return false;
    const adapter = await navigator.gpu.requestAdapter();
    return Boolean(adapter?.features?.has("shader-f16"));
  } catch {
    return false;
  }
}

const READY_KEY = `hugopsy_brain_ready:${BRAIN_MODEL_ID}`;

/**
 * Model đã nằm sẵn trong máy chưa (nạp lại không tốn mạng).
 * KHÔNG dùng hasModelInCache của thư viện: hỏi nó là phải tải 6MB thư viện
 * trước — mọi máy có WebGPU sẽ tốn 6MB mỗi lần mở chat dù chưa bao giờ đánh
 * thức. Cờ do wake() ghi + cache "webllm/model" còn tồn tại là đủ.
 */
export async function isDownloaded() {
  try {
    return localStorage.getItem(READY_KEY) === "1" && (await caches.has("webllm/model"));
  } catch {
    return false;
  }
}

export const isAwake = () => Boolean(engine);

/**
 * Nạp model (tải nếu chưa có). Gọi nhiều lần vẫn chỉ nạp một lần.
 * onProgress nhận { progress: 0…1, text }.
 */
export function wake(onProgress) {
  if (!enginePromise) {
    enginePromise = (async () => {
      const { CreateWebWorkerMLCEngine } = await loadLib();
      const worker = new Worker(new URL("./brain.worker.js", import.meta.url), { type: "module" });
      engine = await CreateWebWorkerMLCEngine(worker, BRAIN_MODEL_ID, {
        initProgressCallback: (report) => onProgress?.(report),
      });
      try { localStorage.setItem(READY_KEY, "1"); } catch { /* ignore */ }
      return engine;
    })().catch((err) => {
      enginePromise = null; // lần sau thử lại được
      throw err;
    });
  }
  return enginePromise;
}

// Làm gọn câu trả lời của model nhỏ. Thử thật 03/10: dù lời nhắc dặn "2 câu
// dưới 35 chữ", Qwen3.5-0.8B vẫn viết 2 câu rất dài, lặp ý — nên giới hạn được
// cắt CỨNG ở đây chứ không trông vào model: 1 câu, cộng câu hỏi theo sau nếu
// tổng còn ngắn, tối đa ~40 chữ. Đồng thời bỏ <think>, rào mã, gạch đầu dòng và
// sửa xưng hô (model hay nhại "mày"/"tôi" của người dùng).
const MAX_WORDS = 40;
export function cleanReply(raw = "", { final = false } = {}) {
  let text = String(raw)
    .replace(/<think>[\s\S]*?(<\/think>|$)/g, "")
    .replace(/```[\s\S]*?(```|$)/g, "")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/\b(T|t)ôi\b/g, (_, c) => (c === "T" ? "Tớ" : "tớ"))
    .replace(/\b(M|m)ày\b/g, (_, c) => (c === "M" ? "Cậu" : "cậu"))
    .replace(/\s+/g, " ")
    .trim();
  if (!final) return text;
  const sentences = (text.match(/[^.!?…]+[.!?…]+["”)]?|[^.!?…]+$/g) || [text]).map((x) => x.trim());
  const words = (x) => x.split(" ").filter(Boolean).length;
  // Tối đa 2 câu bất kỳ, thêm câu thứ 3 nếu là câu hỏi — miễn tổng ≤ MAX_WORDS.
  // (Chỉ giữ 1 câu thì model 30B bị cụt mất phần khen/an ủi cụ thể.)
  let out = sentences[0] || "";
  sentences.slice(1, 3).forEach((next, i) => {
    if ((i === 0 || next.endsWith("?")) && words(out) + words(next) <= MAX_WORDS) out += ` ${next}`;
  });
  if (words(out) > MAX_WORDS) {
    const cut = out.split(" ").slice(0, MAX_WORDS).join(" ");
    const lastComma = cut.lastIndexOf(",");
    out = `${(lastComma > cut.length * 0.3 ? cut.slice(0, lastComma) : cut).replace(/[,;:]$/, "")}.`;
  }
  return out;
}

/**
 * Sinh câu trả lời, gọi onDelta(chữĐãLàmGọn) mỗi khi có chữ mới.
 * Trả về câu trả lời hoàn chỉnh đã làm gọn.
 */
export async function think(messages, onDelta, { strip = (x) => x } = {}) {
  if (!engine) throw new Error("brain asleep");
  const stream = await engine.chat.completions.create({
    messages,
    stream: true,
    temperature: 0.7,
    top_p: 0.9,
    // Đủ cho ~40 chữ tiếng Việt; dài hơn thì model nhỏ bắt đầu lan man.
    max_tokens: 70,
    frequency_penalty: 0.3,
    // Qwen3.x mặc định "nghĩ" trước khi nói — chậm gấp đôi mà không hay hơn ở đây.
    extra_body: { enable_thinking: false },
  });
  let raw = "";
  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content || "";
    if (!delta) continue;
    raw += delta;
    const live = cleanReply(raw);
    if (live) onDelta?.(live);
  }
  return cleanReply(strip(cleanReply(raw)), { final: true });
}

/**
 * Bộ não đám mây (Cloudflare Workers AI qua Node). Ném lỗi khi hết hạn mức hoặc
 * chưa cấu hình — gọi bên ngoài tự lùi về bộ câu soạn sẵn.
 */
export async function thinkRemote(messages, { strip = (x) => x } = {}) {
  const apiBase = import.meta.env.VITE_API_URL || "/api";
  const res = await fetch(`${apiBase}/companion/brain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error(`brain_remote_${res.status}`);
  const data = await res.json();
  return cleanReply(strip(cleanReply(data.reply || "")), { final: true });
}
