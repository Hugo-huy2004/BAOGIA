// Bộ não "đám mây" của nhân vật đồng hành HugoPSY — Cloudflare Workers AI.
//
// Bộ não CHÍNH cho thành viên (03/10/2026). Thử thật: model 1–2B chạy trên máy
// lặp và lạc ý qua nhiều lượt, nên mọi thành viên gọi model 30B ở đây; khách
// dùng bộ não trên máy; hết hạn mức thì client lùi về bộ câu soạn sẵn. 0 đồng ở
// mọi tầng — vượt hạn mức miễn phí là lỗi chứ không tính tiền (gói Free). Không dùng aiGateway.js vì gateway đó chỉ dành cho
// Gemini (khoá, quota, cache của Gemini).
//
// Hạn mức miễn phí Workers AI: 10.000 neuron/ngày, reset 00:00 UTC, vượt là lỗi.
// Qwen3-30B-A3B: ~4.625 neuron / 1 triệu token vào, ~30.475 / 1 triệu token ra →
// một lượt (~1.000 vào + ~80 ra) ≈ 7 neuron → ~1.400 lượt/ngày cho CẢ hệ thống.
//
// Token riêng chỉ có quyền "Workers AI – Read" + "Workers AI – Edit" (CF_AI_TOKEN;
// thiếu Edit là Cloudflare báo "Authentication error") — KHÔNG dùng lại
// CLOUDFLARE_API_TOKEN của tường lửa: lộ token chat thì không được mất luôn
// quyền sửa firewall.

const MODEL = "@cf/qwen/qwen3-30b-a3b-fp8";
const PER_MEMBER_DAILY = 80;
const GLOBAL_DAILY = 1300; // chừa biên dưới ~1.400 lượt của hạn mức miễn phí
const TIMEOUT_MS = 15_000;

// ponytail: đếm trong bộ nhớ tiến trình — Render chỉ chạy một tiến trình nên đủ;
// khởi động lại thì đếm lại từ 0 (lệch có lợi cho người dùng, Cloudflare vẫn là
// chốt cuối). Nếu chạy nhiều tiến trình thì chuyển sang Mongo/Redis.
let day = "";
let globalCount = 0;
const perMember = new Map();

function utcDay() {
  return new Date().toISOString().slice(0, 10);
}

function roll() {
  const today = utcDay();
  if (today !== day) {
    day = today;
    globalCount = 0;
    perMember.clear();
  }
}

export function isConfigured() {
  return Boolean(process.env.CF_AI_ACCOUNT_ID && process.env.CF_AI_TOKEN);
}

const ROLES = new Set(["system", "user", "assistant"]);

/** Chặn payload lạ: tối đa 12 tin, mỗi tin ≤ 2.000 ký tự, tổng ≤ 8.000. */
export function sanitizeMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 12) return null;
  let total = 0;
  const clean = [];
  for (const m of messages) {
    if (!m || !ROLES.has(m.role) || typeof m.content !== "string") return null;
    const content = m.content.slice(0, 2000);
    total += content.length;
    clean.push({ role: m.role, content });
  }
  if (total > 8000 || clean.at(-1).role !== "user") return null;
  return clean;
}

/**
 * Trả { reply } hoặc ném lỗi có `status` (429 hết lượt, 503 chưa cấu hình/lỗi).
 */
export async function think(memberEmail, messages) {
  if (!isConfigured()) throw Object.assign(new Error("brain_not_configured"), { status: 503 });
  roll();
  const used = perMember.get(memberEmail) || 0;
  if (used >= PER_MEMBER_DAILY || globalCount >= GLOBAL_DAILY) {
    throw Object.assign(new Error("brain_quota"), { status: 429 });
  }

  // Qwen3 "nghĩ" trước khi nói nếu không tắt — chậm gấp đôi, tốn neuron.
  const payload = messages.map((m, i) => (i === messages.length - 1 ? { ...m, content: `${m.content} /no_think` } : m));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_AI_ACCOUNT_ID}/ai/run/${MODEL}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.CF_AI_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload, max_tokens: 120, temperature: 0.7, top_p: 0.9 }),
        signal: controller.signal,
      },
    );
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      // Cloudflare báo hết hạn mức ngày → khoá đến hết ngày cho đỡ gọi vô ích.
      if (res.status === 429) globalCount = GLOBAL_DAILY;
      throw Object.assign(new Error(`cf_ai_${res.status}`), { status: res.status === 429 ? 429 : 503 });
    }
    const reply = data.result?.response ?? data.result?.choices?.[0]?.message?.content ?? "";
    if (!reply.trim()) throw Object.assign(new Error("cf_ai_empty"), { status: 503 });
    perMember.set(memberEmail, used + 1);
    globalCount += 1;
    return { reply };
  } catch (err) {
    if (err.name === "AbortError") throw Object.assign(new Error("cf_ai_timeout"), { status: 503 });
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
