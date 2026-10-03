// "Tâm trí" của nhân vật đồng hành — phần KHÔNG thư viện nào có sẵn.
//
// Model ngôn ngữ (brain/companionBrain.js) chỉ là bộ não biết nói. Cái làm nhân
// vật có cái tôi nằm ở đây, chạy thuần trên máy, không gọi ra ngoài:
//   1. Cảm xúc riêng, HIỂN THỊ ĐƯỢC: giận · lẫy · buồn · khóc · bình yên · cười
//      · thương. Mỗi câu người dùng nói đẩy cảm xúc đi một hướng; tính khí từng
//      nhân vật quyết định nó phản ứng mạnh hay nhẹ, và cảm xúc tự lắng dần.
//   2. Chia sẻ: thỉnh thoảng nhân vật kể chuyện của chính nó.
//   3. Lời nhắc: hồ sơ + cảm xúc + nhiệm vụ của chặng + thư bàn giao.
//
// Giới hạn an toàn của cảm xúc (app tâm lý): nhân vật KHÔNG BAO GIỜ giận người
// dùng vì họ buồn, mệt hay thất bại. Giận chỉ khi bị mắng thẳng mặt, hoặc giận
// "bênh" khi người dùng tự chê mình. Lẫy chỉ khi lâu không gặp. Người dùng đang
// rất buồn thì mọi cảm xúc gắt bị chặn — chỉ còn buồn/thương cùng họ.
import { removeVietnameseTones } from "../constants/intentClassifier";

const STATE_KEY = (id) => `hugopsy_mind_${id}`;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const DAY_MS = 86_400_000;

// ── Bảng cảm xúc — 5 vùng của đồng hồ (giận → thương), 7 sắc thái ─────────────
export const EMOTIONS = {
  gian:  { zone: 0, label: "đang giận",      icon: "sentiment_extremely_dissatisfied", color: "#E5484D" },
  lay:   { zone: 0, label: "đang lẫy",       icon: "sentiment_frustrated",             color: "#E5484D" },
  buon:  { zone: 1, label: "đang buồn",      icon: "sentiment_sad",                    color: "#3E63DD" },
  khoc:  { zone: 1, label: "rưng rưng",      icon: "sentiment_very_dissatisfied",      color: "#3E63DD" },
  binh:  { zone: 2, label: "bình yên",       icon: "sentiment_calm",                   color: "#46A758" },
  cuoi:  { zone: 3, label: "đang cười",      icon: "sentiment_very_satisfied",         color: "#05A2C2" },
  thuong:{ zone: 4, label: "thương cậu lắm", icon: "favorite",                         color: "#8E4EC6" },
};
export const ZONE_COLORS = ["#E5484D", "#3E63DD", "#46A758", "#05A2C2", "#8E4EC6"];

// Cách cảm xúc lộ ra trong lời nói. Model nhỏ hay quên cảm xúc, nên câu mở đầu
// (`expr` trong hồ sơ từng nhân vật) được gắn chắc vào câu trả lời.
const EMOTION_STYLE = {
  gian: "Bạn đang giận nhẹ (kiểu giận vì thương, không xúc phạm). Nói thẳng, ngắn, rồi dịu lại.",
  lay: "Bạn đang dỗi nhẹ vì lâu không gặp. Giọng hờn đáng yêu, nhưng vẫn quan tâm.",
  buon: "Bạn đang buồn cùng người dùng. Nói chậm, ít chữ, không đùa.",
  khoc: "Bạn xúc động rưng rưng vì thương người dùng. Nói rất nhẹ, rồi an ủi.",
  binh: "Bạn đang bình yên. Giọng tự nhiên.",
  cuoi: "Bạn đang vui và cười. Giọng hớn hở.",
  thuong: "Bạn đang rất thương người dùng. Giọng ấm áp, trìu mến.",
};

// ── Đọc tín hiệu từ câu người dùng ─────────────────────────────────────────────
// ponytail: từ điển nhỏ, đủ để biết câu nghiêng về đâu. Muốn tinh hơn thì cho
// chính model chấm cảm xúc — đổi lại tốn thêm một lượt sinh chữ.
const has = (t, words) => words.some((w) => t.includes(w));
const SIGNALS = {
  insultBot: ["may ngu", "bot ngu", "do ngu", "vo dung", "nham chan", "im di", "cam mom", "may te", "ghet may", "stupid", "useless"],
  selfInsult: ["minh vo dung", "toi vo dung", "to vo dung", "em vo dung", "minh that bai", "minh te qua", "minh ngu", "to ngu", "toi ngu", "khong ra gi", "an hai", "ghet ban than"],
  verySad: ["khoc", "tuyet vong", "suy sup", "khong chiu noi", "kiet suc", "co don qua", "buon lam"],
  sad: ["buon", "met", "chan", "so", "lo", "cang thang", "ap luc", "co don", "that vong", "mat ngu", "sad", "tired", "lonely"],
  laugh: ["haha", "hihi", "keke", "kaka", "=))", ":))", "buon cuoi", "vui qua", "hai qua", "lol", "funny"],
  love: ["cam on", "thuong", "yeu", "quy", "may man co", "ban that tot", "thank", "love you", "co ban"],
  happy: ["vui", "on roi", "tot", "nhe nhom", "hanh phuc", "tuyet", "dat roi", "xong roi", "happy", "great"],
};

export function readSignal(text = "") {
  const t = removeVietnameseTones(String(text)).toLowerCase();
  if (has(t, SIGNALS.insultBot)) return "insultBot";
  if (has(t, SIGNALS.selfInsult)) return "selfInsult";
  if (has(t, SIGNALS.verySad)) return "verySad";
  if (has(t, SIGNALS.laugh)) return "laugh";
  if (has(t, SIGNALS.love)) return "love";
  if (has(t, SIGNALS.sad)) return "sad";
  if (has(t, SIGNALS.happy)) return "happy";
  return "neutral";
}

// Tín hiệu → cảm xúc mà nó gợi ra (trước khi qua tính khí).
const SIGNAL_TO_EMOTION = {
  insultBot: "gian", selfInsult: "gian", verySad: "khoc", sad: "buon",
  laugh: "cuoi", love: "thuong", happy: "cuoi", neutral: "binh",
};

// ── Trạng thái ────────────────────────────────────────────────────────────────
function fresh(companion) {
  return { emotion: companion.temperament.restEmotion || "binh", intensity: 0.4, turns: 0, lastSeen: Date.now() };
}

/**
 * Nạp tâm trí. Lâu không gặp (≥3 ngày) thì nhân vật lẫy — càng lâu càng lẫy;
 * nhân vật dễ hờn (`sulky` cao) lẫy rõ hơn.
 */
export function loadMind(companion) {
  let mind = null;
  try { mind = JSON.parse(localStorage.getItem(STATE_KEY(companion.id)) || "null"); } catch { /* ignore */ }
  if (!mind || !mind.emotion) return fresh(companion);
  const awayDays = Math.floor((Date.now() - (mind.lastSeen || Date.now())) / DAY_MS);
  if (awayDays >= 3) {
    return { ...mind, emotion: "lay", intensity: clamp(0.3 + awayDays * 0.08 * companion.temperament.sulky, 0.3, 1), awayDays };
  }
  return { ...mind, awayDays: 0 };
}

export function saveMind(companion, mind) {
  try {
    const { awayDays, ...rest } = mind; // eslint-disable-line no-unused-vars
    localStorage.setItem(STATE_KEY(companion.id), JSON.stringify({ ...rest, lastSeen: Date.now() }));
  } catch { /* ignore */ }
}

/** Nhân vật nghe một câu → cảm xúc của nó đổi theo tính khí. */
export function feel(companion, mind, userText) {
  const { temperament } = companion;
  const signal = readSignal(userText);
  let target = SIGNAL_TO_EMOTION[signal];
  // Tính khí: nhân vật dễ khóc thì buồn hoá khóc, khó khóc thì khóc hoá buồn…
  if (target === "buon" && temperament.tearful > 0.7) target = "khoc";
  if (target === "khoc" && temperament.tearful < 0.3) target = "buon";
  if (target === "cuoi" && signal === "happy" && temperament.cheerful < 0.4) target = "binh";
  if (target === "gian" && temperament.temper < 0.3) target = signal === "selfInsult" ? "thuong" : "buon";
  // Chặn an toàn: người dùng đang rất buồn thì không còn chỗ cho giận/lẫy/cười.
  if (signal === "verySad" && !["buon", "khoc", "thuong"].includes(target)) target = "buon";

  const reactivity = temperament.reactivity;
  // Lẫy tan khi người dùng nói chuyện lại — nhanh hay chậm tuỳ độ hờn.
  if (mind.emotion === "lay" && signal !== "insultBot") {
    const left = mind.intensity - (1 - temperament.sulky) * 0.6 - 0.2;
    if (left > 0.25) return { ...mind, intensity: left, turns: mind.turns + 1, awayDays: 0 };
  }
  if (signal === "neutral") {
    // Không có gì đáng kể: cảm xúc lắng dần về trạng thái nghỉ của nhân vật.
    const intensity = mind.intensity * 0.6;
    return { ...mind, emotion: intensity < 0.3 ? (temperament.restEmotion || "binh") : mind.emotion, intensity: Math.max(intensity, 0.3), turns: mind.turns + 1, awayDays: 0 };
  }
  const intensity = clamp(0.35 + reactivity * 0.6, 0, 1);
  return { ...mind, emotion: target, intensity, turns: mind.turns + 1, awayDays: 0 };
}

export const emotionOf = (mind) => EMOTIONS[mind?.emotion] || EMOTIONS.binh;
export const moodLabel = (mind) => emotionOf(mind).label;

/** Avatar không có nét mặt — cảm xúc lộ qua dáng: nhún, tốc độ, độ tươi màu. */
export function avatarMotion(mind) {
  switch (mind?.emotion) {
    case "cuoi": return { state: "working", speed: 1.4, saturation: 1.8 };
    case "thuong": return { state: "default", speed: 1.1, saturation: 1.9 };
    case "gian": return { state: "working", speed: 2, saturation: 2.2, brightness: 0.85 };
    case "lay": return { state: "sleeping", speed: 0.8, saturation: 1.2 };
    case "buon": return { state: "default", speed: 0.6, saturation: 0.8, brightness: 0.9 };
    case "khoc": return { state: "sleeping", speed: 0.5, saturation: 0.6, brightness: 0.85 };
    default: return { state: "default", speed: 1 };
  }
}

// ── Lời nhắc cho model ─────────────────────────────────────────────────────────
const LANGUAGE_NAME = { vi: "tiếng Việt", nom: "tiếng Việt", en: "English", zh: "简体中文" };

function userSnapshot(bio, historyLogs) {
  const logs = historyLogs || [];
  const lastCheckin = logs.filter((l) => l?.type === "checkin" && typeof l.mood === "number").at(-1);
  const lastTest = logs.filter((l) => l?.test && l.severity).at(-1);
  const parts = [];
  if (lastCheckin) parts.push(`check-in gần nhất ${lastCheckin.mood}/5`);
  if (lastTest) parts.push(`${String(lastTest.test).toUpperCase()} gần nhất: ${lastTest.severity}`);
  return parts.join("; ");
}

/** Cứ 4 lượt nhân vật kể một mẩu chuyện của chính nó — có qua có lại mới là bạn. */
export const shouldShare = (mind) => mind.turns > 0 && mind.turns % 4 === 0 && !["buon", "khoc"].includes(mind.emotion);

// Đã thử thật với Qwen3.5-0.8B: lời nhắc dài nhiều luật làm model nhỏ rối vai.
// Giữ gọn: ai · cảm xúc · nhiệm vụ · đúng 2 câu.
export function buildCharacterPrompt({ companion, mind, days = 0, letter = null, bio, historyLogs, lang = "vi" }) {
  const name = bio?.displayName?.trim().split(" ").pop() || "cậu";
  const snapshot = userSnapshot(bio, historyLogs);
  const lines = [
    `Bạn là ${companion.name}, ${companion.voice.who}. Bạn đang trò chuyện với ${name}, hai bạn đã đồng hành ${Math.max(1, days)} ngày. Xưng "tớ", gọi "cậu".`,
    `Cảm xúc của bạn lúc này: ${emotionOf(mind).label}. ${EMOTION_STYLE[mind.emotion] || EMOTION_STYLE.binh}`,
    `Nhiệm vụ của bạn: ${companion.mission}.`,
  ];
  if (shouldShare(mind)) lines.push(`Lượt này hãy kể một chút chuyện của bạn: bạn là ${companion.self.backstory}, bạn thích ${companion.self.likes}.`);
  if (letter) lines.push(`Thư bàn giao từ ${letter.from}: ${letter.text}`);
  if (snapshot) lines.push(`Về ${name}: ${snapshot}.`);
  lines.push(
    `Trả lời ĐÚNG 2 câu ngắn, dưới 35 chữ: câu 1 thể hiện cảm xúc của bạn về điều ${name} vừa nói, câu 2 hỏi ${name} một câu. ${companion.voice.humor}`,
    "Không chẩn đoán, không nói về thuốc, không chê trách, không bịa số liệu. Nếu nghe chuyện tự làm hại bản thân thì khuyên gọi 111 hoặc 115 ngay.",
    `Trả lời bằng ${LANGUAGE_NAME[lang] || "tiếng Việt"}.`,
  );
  return lines.join("\n");
}

/**
 * Tin nhắn cho model: system → một lượt mẫu đúng giọng → 6 tin gần nhất (cắt
 * 300 ký tự mỗi tin cho vừa ngữ cảnh) → câu người dùng vừa nói.
 */
export function buildMessages({ companion, characterPrompt, history = [], userText }) {
  const turns = history
    .filter((m) => m?.text && (m.sender === "user" || m.sender === "bot"))
    .slice(-6)
    .map((m) => ({ role: m.sender === "user" ? "user" : "assistant", content: String(m.text).slice(0, 300) }));
  while (turns.length && turns[0].role !== "user") turns.shift();
  const merged = [];
  for (const turn of [...turns, { role: "user", content: userText }]) {
    const last = merged.at(-1);
    if (last && last.role === turn.role) last.content += `\n${turn.content}`;
    else merged.push({ ...turn });
  }
  return [
    { role: "system", content: characterPrompt },
    { role: "user", content: "Hôm nay tớ hơi mệt." },
    { role: "assistant", content: companion.sample },
    ...merged,
  ];
}

/** Gắn câu mở đầu đúng cảm xúc + đúng giọng nhân vật nếu model quên. */
export function voiceReply(companion, mind, reply) {
  const expr = companion.expr?.[mind.emotion];
  if (!expr || !reply) return reply;
  const head = removeVietnameseTones(reply.slice(0, 24)).toLowerCase();
  return head.includes(removeVietnameseTones(expr).toLowerCase().slice(0, 4)) ? reply : `${expr} ${reply}`;
}

/** Câu nhân vật nói khi gặp lại sau nhiều ngày — lẫy, tất định, đúng giọng. */
export function sulkGreeting(companion, mind) {
  if (mind?.emotion !== "lay" || !mind.awayDays) return null;
  return `${companion.expr?.lay || "Hừ."} Cậu đi đâu ${mind.awayDays} ngày liền vậy, tớ lẫy rồi đó. Mà thôi, kể tớ nghe mấy hôm nay cậu thế nào đi?`;
}

// ── Thư bàn giao ───────────────────────────────────────────────────────────────
const TOPICS = [
  { id: "học tập", words: ["hoc", "thi", "deadline", "do an", "diem", "bai tap"] },
  { id: "gia đình", words: ["gia dinh", "bo ", "me ", "ba ", "phu huynh"] },
  { id: "các mối quan hệ", words: ["chia tay", "nguoi yeu", "crush", "ban be", "co don"] },
  { id: "lo âu", words: ["lo ", "so ", "hoang", "bon chon", "overthinking"] },
  { id: "kiệt sức", words: ["met", "kiet suc", "burnout", "chan"] },
  { id: "giấc ngủ", words: ["ngu", "mat ngu", "tran troc"] },
  { id: "tiếng Anh", words: ["tieng anh", "english", "ielts", "toeic"] },
];

/**
 * Nhân vật cũ viết thư cho nhân vật mới: điều đã biết về người dùng, để chat
 * khép lại mà trí nhớ không mất. Viết tất định từ dữ liệu — không nhờ model.
 */
export function writeHandoffLetter({ from, to, days, chatMessages = [], historyLogs = [] }) {
  const userText = chatMessages
    .filter((m) => m?.sender === "user" && m.text)
    .map((m) => ` ${removeVietnameseTones(String(m.text)).toLowerCase()} `)
    .join(" ");
  const topics = TOPICS.filter((t) => t.words.some((w) => userText.includes(w))).map((t) => t.id).slice(0, 3);
  const lastCheckin = historyLogs.filter((l) => l?.type === "checkin" && typeof l.mood === "number").at(-1);
  const parts = [`Cậu ấy đã đi cùng ${from.name} ${days} ngày.`];
  if (topics.length) parts.push(`Cậu ấy hay tâm sự về ${topics.join(", ")}.`);
  if (lastCheckin) parts.push(`Lần check-in gần nhất được ${lastCheckin.mood}/5.`);
  parts.push(`Nhờ ${to.name} chăm cậu ấy thật tốt nhé.`);
  return { from: from.name, to: to.name, text: parts.join(" "), date: new Date().toISOString() };
}
