// Bộ não "đám mây" của nhân vật đồng hành HugoPSY — Cloudflare Workers AI, dự
// phòng bằng Groq; cả hai gói Free.
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

import Bio from "../models/Bio.js";
import LearningEvidence from "../models/LearningEvidence.js";
import SleepLog from "../models/SleepLog.js";
import CheckinRecord from "../models/CheckinRecord.js";

const MODEL = "@cf/qwen/qwen3-30b-a3b-fp8";
// Câu giống mẫu soạn sẵn đã bị intentRouter chặn trước, nên LLM chỉ còn nhận
// câu nói tự do: 40 lượt/ngày là dư cho người thật, và kẻ phá cần gấp đôi số
// tài khoản để vét cạn hạn mức chung.
const PER_MEMBER_DAILY = 40;
const GLOBAL_DAILY = 1300; // chừa biên dưới ~1.400 lượt của hạn mức miễn phí
const TIMEOUT_MS = 15_000;

// Nguồn dự phòng thứ hai khi Cloudflare hết lượt: Groq gói Free (không thẻ →
// vượt hạn mức là lỗi 429, không tính tiền). Hạn mức tính RIÊNG theo từng nhà
// cung cấp, nên cộng hai nguồn là gấp đôi sức chứa mà vẫn 0 đồng.
// Bảng hạn mức Groq Free của tài khoản (26/10/2026) không còn llama-3.3-70b;
// gpt-oss-120b: 1.000 lượt/ngày, 8K token/phút.
const GROQ_DAILY = 900;
const groqModel = () => (process.env.GROQ_MODELS || "openai/gpt-oss-120b").split(",")[0].trim();

// ponytail: đếm trong bộ nhớ tiến trình — Render chỉ chạy một tiến trình nên đủ;
// khởi động lại thì đếm lại từ 0 (lệch có lợi cho người dùng, Cloudflare vẫn là
// chốt cuối). Nếu chạy nhiều tiến trình thì chuyển sang Mongo/Redis.
let day = "";
let globalCount = 0;
let groqCount = 0;
const perMember = new Map();

function utcDay() {
  return new Date().toISOString().slice(0, 10);
}

function roll() {
  const today = utcDay();
  if (today !== day) {
    day = today;
    globalCount = 0;
    groqCount = 0;
    perMember.clear();
  }
}

const cfConfigured = () => Boolean(process.env.CF_AI_ACCOUNT_ID && process.env.CF_AI_TOKEN);
const groqConfigured = () => Boolean(process.env.GROQ_API_KEY);

export function isConfigured() {
  return cfConfigured() || groqConfigured();
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

// ── Ngữ cảnh học tập ──────────────────────────────────────────────────────────
// Phần "thông minh" không nằm ở model mà ở chỗ nó BIẾT người đang nói chuyện:
// học tới đâu, bỏ học mấy hôm, đêm qua ngủ ra sao. Máy chủ tự dựng từ DB —
// client không chèn hay sửa được. Chỉ là số liệu thật; không có thì bỏ dòng đó,
// tuyệt đối không bịa.
const SNAPSHOT_TTL_MS = 10 * 60 * 1000;
const snapshots = new Map();
const DAY_MS = 24 * 60 * 60 * 1000;

const daysAgo = (date) => Math.floor((Date.now() - new Date(date).getTime()) / DAY_MS);

export async function learningSnapshot(memberEmail) {
  const hit = snapshots.get(memberEmail);
  if (hit && hit.exp > Date.now()) return hit.text;

  const bio = await Bio.findOne({ email: memberEmail }, "_id completedLessons").lean();
  const [recent, sleep, checkin] = await Promise.all([
    bio ? LearningEvidence.find({ ownerMemberId: bio._id, status: "active" }, "title occurredAt")
      .sort({ occurredAt: -1 }).limit(20).lean() : [],
    SleepLog.findOne({ email: memberEmail }, "date duration quality").sort({ date: -1 }).lean(),
    CheckinRecord.findOne({ email: memberEmail }, "consecutiveDays lastCheckinDate").lean(),
  ]);

  const facts = [];
  const done = bio?.completedLessons?.length || 0;
  if (done) facts.push(`đã hoàn thành ${done} bài học`);
  if (recent.length) {
    const last = recent[0];
    const gap = daysAgo(last.occurredAt);
    const week = recent.filter((e) => daysAgo(e.occurredAt) < 7).length;
    facts.push(`bài gần nhất "${last.title}" ${gap === 0 ? "hôm nay" : `${gap} ngày trước`}`);
    facts.push(`7 ngày qua xong ${week} bài`);
  }
  if (checkin?.consecutiveDays > 1) facts.push(`điểm danh liền ${checkin.consecutiveDays} ngày`);
  if (sleep && daysAgo(sleep.date) <= 1 && sleep.duration) {
    facts.push(`đêm qua ngủ ${Number(sleep.duration).toFixed(1)} tiếng${sleep.quality ? `, tự chấm ${sleep.quality}/5` : ""}`);
  }

  const text = facts.join("; ");
  snapshots.set(memberEmail, { text, exp: Date.now() + SNAPSHOT_TTL_MS });
  if (snapshots.size > 2000) snapshots.delete(snapshots.keys().next().value);
  return text;
}

// Nhân cách cố định do MÁY CHỦ giữ — client dựng phần nhân vật/giọng, nhưng
// không gỡ được những luật này. Xếp theo thứ tự ưu tiên:
//   1. Vai: tri kỷ lắng nghe, không khuyên sáo rỗng.
//   2. Cảm xúc: công nhận TRƯỚC rồi mới mở hướng tích cực. Kéo thẳng sang "vui
//      lên đi" là tích cực độc hại (toxic positivity) — tâm lý học coi đó là
//      phủ nhận cảm xúc, người nghe thấy mình bị gạt đi.
//   3. Không hoàn hảo: nói như người thật, có từ đệm, dám nói "tớ không chắc".
//   4. Học tập: đồng hành, không phải máy tra cứu, không giải hộ.
const COACH_RULES = [
  "Bạn là người bạn tri kỷ: lắng nghe sâu, đáp đúng điều họ vừa kể, đặt họ làm trung tâm. Không đưa lời khuyên sáo rỗng; chỉ khuyên khi họ hỏi.",
  "Luôn công nhận cảm xúc của họ trước, rồi mới giúp họ thấy một điều tích cực có thật hoặc một bước nhỏ tiếp theo — mọi câu đều để lại một hướng đi. Không phủ nhận nỗi buồn, không bảo họ \"vui lên\".",
  "Nói tự nhiên như người thật: dùng vừa phải từ đệm như \"ừm\", \"à\", \"nè\", \"nha\"; chưa hiểu thì hỏi lại; không chắc thì nói không chắc. Nếu được hỏi thẳng, thành thật rằng bạn là bạn đồng hành AI.",
  "Bạn là bạn đồng hành học tập và tinh thần, không phải công cụ tra cứu. Khi được hỏi kiến thức hay nhờ làm bài: đừng giải hộ, đừng liệt kê đáp án; hỏi họ đang kẹt ở bước nào, gợi ý chia nhỏ việc và khích lệ họ tự làm.",
].join(" ");

// Mức tiêu cực đo bằng embedding (intentRouter.analyzeMessage) → cách đáp.
function moodRule(negativity) {
  if (typeof negativity !== "number") return "";
  if (negativity >= 70) return `Câu vừa rồi rất nặng lòng (tiêu cực ${negativity}%): ưu tiên lắng nghe và ở bên họ, đừng khuyên, đừng vội kéo sang tích cực.`;
  if (negativity <= 30) return `Câu vừa rồi tích cực/bình thường (tiêu cực ${negativity}%): mừng cùng hoặc trò chuyện nhẹ nhàng.`;
  return `Câu vừa rồi hơi chùng (tiêu cực ${negativity}%): công nhận nhẹ nhàng rồi hỏi thêm.`;
}
// Chỉ thêm khi CÓ số liệu: không có mà vẫn bảo "nhắc tiến độ" là model tự bịa.
const PROGRESS_RULE = "Khi hợp lúc, nhắc nhẹ tới tiến độ học thật dưới đây — khen cái họ đã làm, nếu bỏ học vài hôm thì rủ quay lại bằng một việc thật nhỏ, không trách. Không nhắc số liệu nào khác.";

function withContext(messages, snapshot, negativity) {
  const rules = [COACH_RULES, snapshot && PROGRESS_RULE, moodRule(negativity)].filter(Boolean).join(" ");
  const extra = snapshot ? `${rules}\nSố liệu thật về người này: ${snapshot}.` : rules;
  if (messages[0]?.role === "system") {
    return [{ role: "system", content: `${messages[0].content}\n${extra}` }, ...messages.slice(1)];
  }
  return [{ role: "system", content: extra }, ...messages];
}

const fail = (message, status) => Object.assign(new Error(message), { status });

async function postJson(url, headers, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return { res, data: await res.json().catch(() => null) };
  } catch (err) {
    if (err.name === "AbortError") throw fail("ai_timeout", 503);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Qwen3 "nghĩ" trước khi nói nếu không tắt — chậm gấp đôi, tốn neuron.
const noThink = (messages) => messages.map((m, i) => (i === messages.length - 1 ? { ...m, content: `${m.content} /no_think` } : m));

async function askCloudflare(messages, opts) {
  const { res, data } = await postJson(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_AI_ACCOUNT_ID}/ai/run/${MODEL}`,
    { Authorization: `Bearer ${process.env.CF_AI_TOKEN}` },
    { messages: noThink(messages), max_tokens: 120, temperature: 0.7, top_p: 0.9, ...opts },
  );
  if (!res.ok || !data?.success) {
    // Cloudflare báo hết hạn mức ngày → khoá đến hết ngày cho đỡ gọi vô ích.
    if (res.status === 429) globalCount = GLOBAL_DAILY;
    throw fail(`cf_ai_${res.status}`, res.status === 429 ? 429 : 503);
  }
  globalCount += 1;
  // Câu trả lời là JSON thì Cloudflare tự parse sẵn thành object trong `response`.
  const out = data.result?.response ?? data.result?.choices?.[0]?.message?.content ?? "";
  return typeof out === "string" ? out : JSON.stringify(out);
}

async function askGroq(messages, opts) {
  // gpt-oss là model suy luận: tắt phần suy nghĩ để chỉ nhận câu trả lời.
  const reasoning = groqModel().includes("gpt-oss") ? { reasoning_effort: "low", include_reasoning: false } : {};
  const { res, data } = await postJson(
    "https://api.groq.com/openai/v1/chat/completions",
    { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    { model: groqModel(), messages, max_tokens: 160, temperature: 0.7, top_p: 0.9, ...reasoning, ...opts },
  );
  if (!res.ok) {
    if (res.status === 429) groqCount = GROQ_DAILY;
    throw fail(`groq_${res.status}`, res.status === 429 ? 429 : 503);
  }
  groqCount += 1;
  return data?.choices?.[0]?.message?.content ?? "";
}

// Qwen3 trên Cloudflare có lúc lờ `/no_think`: nghĩ thành chữ ("Okay, let's see.
// The user asked…") tới hết max_tokens, không kịp đóng </think> — đo thật trên
// prod 26/10. Có </think> thì lấy phần sau; còn lại mà vẫn là dòng suy nghĩ thì
// coi như hỏng để chuyển sang nguồn kế, tuyệt đối không đưa nó cho người dùng.
const REASONING_LEAK = /<\/?think>|^(okay|ok|alright|hmm|so|let me|let's|first)\b|\bthe user\b/i;

function cleanReply(text) {
  let out = String(text || "");
  const close = out.lastIndexOf("</think>");
  if (close !== -1) out = out.slice(close + "</think>".length);
  out = out.trim();
  if (REASONING_LEAK.test(out)) throw fail("ai_reasoning_leak", 503);
  return out;
}

/**
 * Trả { reply } hoặc ném lỗi có `status` (429 hết lượt, 503 chưa cấu hình/lỗi).
 * Thử lần lượt Cloudflare → Groq; nguồn nào hết lượt hay lỗi thì sang nguồn kế.
 */
export async function think(memberEmail, messages, { negativity } = {}) {
  if (!isConfigured()) throw fail("brain_not_configured", 503);
  roll();
  const used = perMember.get(memberEmail) || 0;
  if (used >= PER_MEMBER_DAILY) throw fail("brain_quota", 429);

  const snapshot = await learningSnapshot(memberEmail).catch(() => "");
  const prompt = withContext(messages, snapshot, negativity);
  const providers = [
    cfConfigured() && globalCount < GLOBAL_DAILY && askCloudflare,
    groqConfigured() && groqCount < GROQ_DAILY && askGroq,
  ].filter(Boolean);
  if (!providers.length) throw fail("brain_quota", 429);

  let lastErr;
  for (const ask of providers) {
    try {
      const reply = cleanReply(await ask(prompt));
      if (!reply) throw fail("ai_empty", 503);
      perMember.set(memberEmail, used + 1);
      return { reply };
    } catch (err) {
      lastErr = err;
      console.warn(`[companion brain] ${ask.name} failed: ${err.message}`);
    }
  }
  throw lastErr;
}

/**
 * Gọi LLM cho việc máy (phân loại, trả JSON): cùng chuỗi Cloudflare → Groq và
 * cùng hạn mức chung với chat, không tính vào lượt của thành viên nào.
 * Trả chữ thô sau </think>; nguồn nào lỗi thì sang nguồn kế.
 */
export async function complete(messages, opts = {}) {
  roll();
  const providers = [
    cfConfigured() && globalCount < GLOBAL_DAILY && askCloudflare,
    groqConfigured() && groqCount < GROQ_DAILY && askGroq,
  ].filter(Boolean);
  if (!providers.length) throw fail("brain_quota", 429);
  let lastErr;
  for (const ask of providers) {
    try {
      const text = String(await ask(messages, opts) || "");
      const close = text.lastIndexOf("</think>");
      return (close === -1 ? text : text.slice(close + "</think>".length)).trim();
    } catch (err) {
      lastErr = err;
      console.warn(`[brain complete] ${ask.name} failed: ${err.message}`);
    }
  }
  throw lastErr;
}
