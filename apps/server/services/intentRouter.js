// Định tuyến intent TRƯỚC khi gọi LLM: câu nào giống một mẫu câu soạn sẵn đủ
// mức thì trả tên intent cho client tự dựng câu trả lời, không tốn lượt LLM.
// Mục tiêu: phần lớn tin nhắn không bao giờ chạm model sinh chữ — LLM có bị
// đánh cạn hạn mức thì chat vẫn sống.
//
// Embedding bằng Cloudflare Workers AI `bge-m3` (đa ngôn ngữ, gói Free). Một câu
// ngắn ~0,02 neuron → 10.000 neuron/ngày đủ vài trăm nghìn câu: thực tế vô hạn.
//
// Đo thật 26/10/2026 (40 câu mới, 543 mẫu câu), so với qwen3-embedding-0.6b và
// embeddinggemma-300m thì bge-m3 tách tốt nhất. Ngưỡng 0,75: 0/10 câu nói
// chuyện tự do bị chặn nhầm; câu lệch intent đều rơi vào intent gần nghĩa
// ("hơi stress" → anxiety). Hạ ngưỡng là bắt đầu chặn câu tự do ("trời mưa" 0,73).
import { readFileSync } from 'node:fs';

const MODEL = '@cf/baai/bge-m3';
const THRESHOLD = 0.75;
const BATCH = 50;
const PATTERNS = JSON.parse(readFileSync(new URL('../../../packages/shared/companionIntentPatterns.json', import.meta.url), 'utf8'));

// Câu mốc để đo % tiêu cực bằng CHÍNH vector đã nhúng cho định tuyến — không tốn
// thêm lượt gọi. Đo thật 26/10: 15 câu mới, mọi câu tiêu cực 66–96%, tích cực/
// trung tính 4–45%; hiểu cả phủ định ("tớ không buồn đâu" 20%).
const NEGATIVE_ANCHORS = ['tớ buồn lắm', 'tớ thấy tuyệt vọng', 'tớ mệt mỏi và chán nản', 'tớ sợ hãi và lo lắng', 'tớ tức giận', 'tớ cô đơn quá', 'tớ thấy mình vô dụng', 'mọi thứ thật tệ', 'tớ áp lực quá', 'tớ muốn khóc'];
const POSITIVE_ANCHORS = ['tớ vui lắm', 'hôm nay thật tuyệt', 'tớ thấy hạnh phúc', 'tớ tự hào về bản thân', 'tớ thấy bình yên', 'cảm ơn cậu nhiều', 'tớ hào hứng quá', 'mọi chuyện ổn cả', 'hôm nay trời đẹp', 'tớ vừa đi chơi về'];

let bank = null; // [{ id, vec }]
let anchors = null; // { neg: vec[], pos: vec[] }
let warming = null;
const queryCache = new Map();

const configured = () => Boolean(process.env.CF_AI_ACCOUNT_ID && process.env.CF_AI_TOKEN);

async function embed(texts) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_AI_ACCOUNT_ID}/ai/run/${MODEL}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.CF_AI_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: texts }),
      signal: AbortSignal.timeout(10_000),
    },
  );
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) throw new Error(`embed_${res.status}`);
  return data.result.data.map((v) => {
    const n = Math.hypot(...v);
    return v.map((x) => x / n);
  });
}

// Khủng hoảng KHÔNG nằm trong ngân hàng: chỉ luật cục bộ trên máy được bắt nó.
async function buildBank() {
  const flat = Object.entries(PATTERNS)
    .filter(([id]) => id !== 'crisis')
    .flatMap(([id, list]) => list.map((text) => ({ id, text })));
  const out = [];
  for (let i = 0; i < flat.length; i += BATCH) {
    const vecs = await embed(flat.slice(i, i + BATCH).map((f) => f.text));
    vecs.forEach((vec, j) => out.push({ id: flat[i + j].id, vec }));
  }
  const [neg, pos] = [await embed(NEGATIVE_ANCHORS), await embed(POSITIVE_ANCHORS)];
  anchors = { neg, pos };
  bank = out;
  console.log(`[intentRouter] ${out.length} mẫu câu đã nhúng`);
}

// Dựng ngân hàng ở nền (~10 giây, 11 lượt gọi). Chưa xong thì tin nhắn đi
// thẳng LLM như cũ — không bắt người dùng chờ.
function warm() {
  if (!warming) warming = buildBank().catch((err) => { warming = null; console.warn('[intentRouter] warm failed:', err.message); });
}

const dot = (a, b) => { let d = 0; for (let i = 0; i < a.length; i++) d += a[i] * b[i]; return d; };

const top3 = (vec, set) => set.map((v) => dot(vec, v)).sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0) / 3;

/**
 * Phân tích một tin nhắn. Không bao giờ ném lỗi; chưa sẵn sàng → null.
 *   intent     — { id, score } khi đủ giống để trả lời bằng câu soạn sẵn, không thì null
 *   nearest    — intent gần nhất dù dưới ngưỡng (gợi ý chủ đề cho LLM)
 *   negativity — 0–100, mức tiêu cực của câu
 */
export async function analyzeMessage(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 300);
  if (!clean || !configured()) return null;
  if (!bank) { warm(); return null; }
  try {
    let vec = queryCache.get(clean);
    if (!vec) {
      [vec] = await embed([clean]);
      if (queryCache.size >= 2000) queryCache.delete(queryCache.keys().next().value);
      queryCache.set(clean, vec);
    }
    let nearest = null;
    for (const item of bank) {
      const score = dot(vec, item.vec);
      if (!nearest || score > nearest.score) nearest = { id: item.id, score };
    }
    const margin = top3(vec, anchors.neg) - top3(vec, anchors.pos);
    return {
      intent: nearest && nearest.score >= THRESHOLD ? nearest : null,
      nearest,
      negativity: Math.round(100 / (1 + Math.exp(-margin * 25))),
    };
  } catch (err) {
    console.warn('[intentRouter]', err.message);
    return null;
  }
}
