// Bộ não của nhân vật đồng hành — model ngôn ngữ chạy NGAY TRÊN MÁY người dùng
// (WebLLM + WebGPU). Tin nhắn không rời khỏi máy; máy chủ không phải nghĩ gì.
//
// Vì sao Qwen3.5-0.8B: đã thử thật 03/10 cùng một lời nhắc nhân vật tiếng Việt.
// Gemma 3 1B trả lời lặp, lạc đề, có lượt còn khuyên "tìm thuốc" — không dùng
// được cho app tâm lý. Qwen3.5-0.8B nói tiếng Việt trôi chảy, giữ đúng vai và câu
// cửa miệng, còn thừa thẻ <think> và hay nói dài — cleanReply() xử lý hai tật đó.
//
// File model tải MỘT lần từ CDN Hugging Face của mlc-ai rồi nằm trong
// Cache Storage của trình duyệt; những lần sau nạp từ máy, chạy được cả offline.
// Thư viện (6MB) chỉ được import khi thật sự cần — người không bật bộ não không
// phải tải nó.
//
// Máy không có WebGPU hoặc không đủ bộ nhớ → isSupported() = false và chat tự
// dùng bộ luật soạn sẵn (cũng chạy trên máy).

export const BRAIN_MODEL_ID = "Qwen3.5-0.8B-q4f16_1-MLC";

let enginePromise = null;
let engine = null;

const loadLib = () => import("@mlc-ai/web-llm");

/** Máy có chạy được không: cần WebGPU và một adapter thật. */
export async function isSupported() {
  try {
    if (typeof navigator === "undefined" || !navigator.gpu) return false;
    const adapter = await navigator.gpu.requestAdapter();
    return Boolean(adapter);
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

// Làm gọn câu trả lời của model nhỏ: bỏ khối suy nghĩ <think>, bỏ rào mã/gạch
// đầu dòng, giữ đúng xưng hô "tớ", và cắt ở tối đa 3 câu.
export function cleanReply(raw = "", { final = false } = {}) {
  let text = String(raw)
    .replace(/<think>[\s\S]*?(<\/think>|$)/g, "")
    .replace(/```[\s\S]*?(```|$)/g, "")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/\b(T|t)ôi\b/g, (_, c) => (c === "T" ? "Tớ" : "tớ"))
    .trim();
  if (final) {
    const sentences = text.match(/[^.!?…]+[.!?…]+["”)]?|[^.!?…]+$/g) || [text];
    text = sentences.slice(0, 3).join(" ").replace(/\s+/g, " ").trim();
  }
  return text;
}

/**
 * Sinh câu trả lời, gọi onDelta(chữĐãLàmGọn) mỗi khi có chữ mới.
 * Trả về câu trả lời hoàn chỉnh đã làm gọn.
 */
export async function think(messages, onDelta) {
  if (!engine) throw new Error("brain asleep");
  const stream = await engine.chat.completions.create({
    messages,
    stream: true,
    temperature: 0.7,
    top_p: 0.9,
    // ~3 câu tiếng Việt; dài hơn thì model nhỏ bắt đầu lan man.
    max_tokens: 140,
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
  return cleanReply(raw, { final: true });
}
