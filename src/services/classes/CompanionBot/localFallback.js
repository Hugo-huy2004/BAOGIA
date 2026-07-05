// Smart local reply engine — the guarantee that HugoPSY ALWAYS answers, even
// when the AI server is unreachable/overloaded. Instead of surfacing a raw
// "connection error" (which breaks trust exactly when a user is opening up),
// we compose a warm, context-aware reply from local knowledge:
//
//   1. crisis text        → immediate safety response + hotline (never skipped)
//   2. keyword/topic match → getRandomResponse's curated topic banks
//   3. reflective fallback → mirror the user's own words back as a question
//
// The user never learns the AI was down; the conversation simply continues.
import { getRandomResponse } from "../../../components/member/banhocduong/constants/randomResponses";
import { isCrisisText, removeVietnameseTones } from "../../../components/member/banhocduong/constants/intentClassifier";
import { CRISIS_HOTLINE_TEXT } from "../../../components/member/banhocduong/constants/hotlines";

// Openers that keep replies feeling fresh across a long offline stretch.
const REFLECTIVE_OPENERS = [
  "Tớ nghe cậu rồi",
  "Cảm ơn cậu đã tin tưởng kể cho tớ",
  "Tớ hiểu điều cậu đang nói",
  "Tớ đang ở đây cùng cậu",
  "Điều cậu chia sẻ quan trọng với tớ",
];

const REFLECTIVE_QUESTIONS = [
  "Cậu có muốn kể thêm cho tớ nghe không?",
  "Điều đó khiến cậu cảm thấy thế nào?",
  "Cậu nghĩ điều gì đang tác động nhiều nhất đến cậu lúc này?",
  "Cậu đã cảm thấy như vậy được bao lâu rồi?",
  "Nếu được, cậu muốn mọi chuyện thay đổi theo hướng nào?",
];

const LOCAL_FIRST_TERMS = [
  "met", "stress", "ap luc", "chan", "buon", "co don", "lo lang", "so", "qua tai",
  "hoc", "thi", "deadline", "diem", "bai tap", "truong",
  "gia dinh", "ba me", "bo me", "ban be", "nguoi yeu", "chia tay",
  "mat ngu", "kho ngu", "khoc", "tu ti", "that bai",
];

const COMPLEX_REQUEST_TERMS = [
  "phan tich", "chan doan", "ke hoach", "lo trinh", "bao cao", "giai thich ket qua",
  "dass", "phq", "gad", "who", "mmpi", "big five", "pdf", "anh", "benh an",
];

// Requests/questions must reach the real LLM — a canned empathy line answering
// "tôi muốn liên kết với chế độ ngủ" is exactly what makes the bot feel dumb.
const REQUEST_TERMS = [
  "?", "muon", "lam sao", "the nao", "cach nao", "cach ", "giup", "huong dan",
  "vi sao", "tai sao", "la gi", "o dau", "lien ket", "che do", "ket noi",
  "mo ", "bat ", "tat ", "cai dat", "thiet lap", "co the",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// A short phrase from the user's own message, cleaned of trailing punctuation,
// so the reflective reply feels specifically about what they said.
function extractTheme(text) {
  const cleaned = String(text || "").trim().replace(/[."!?…]+$/g, "");
  if (cleaned.length === 0 || cleaned.length > 60) return null;
  return cleaned;
}

export function shouldUseLocalFirstReply(userText = "") {
  const raw = String(userText || "").trim();
  if (!raw) return false;
  const clean = removeVietnameseTones(raw).toLowerCase();
  if (isCrisisText(clean)) return true;
  if (raw.length > 120) return false;
  if (COMPLEX_REQUEST_TERMS.some(term => clean.includes(term))) return false;
  // Anything phrased as a question or request goes to the real LLM.
  if (REQUEST_TERMS.some(term => clean.includes(term))) return false;
  // Only short, plain emotional shares are answered locally. Everything else
  // (the old "≤70 chars" catch-all is gone) reaches the AI so replies actually
  // match what the user said.
  return LOCAL_FIRST_TERMS.some(term => clean.includes(term));
}

// Returns the full reply object shape ChatTab's onDone expects, so a local
// fallback is a drop-in for a real AI response.
export function buildLocalReply(userText = "", { aspectId = null } = {}) {
  const clean = removeVietnameseTones(userText).toLowerCase();

  if (isCrisisText(clean)) {
    return {
      reply:
        "Tớ thực sự lo lắng cho cậu khi đọc điều này. Cảm xúc của cậu rất quan trọng và cậu xứng đáng được giúp đỡ. " +
        CRISIS_HOTLINE_TEXT,
      isCrisis: true,
      suggestPhq9: false, suggestGad7: false, suggestWho5: false, suggestBigFive: false,
      bioUpdate: null,
    };
  }

  // Topic-matched empathy from the curated banks (stress/sad/sleep/…).
  let reply = getRandomResponse(userText, aspectId);

  // Reflective layer ONLY when no topic bank matched (i.e. the reply came from
  // the generic default pool) — and it now mirrors the user's own words so it
  // stays about what they actually said, instead of replacing a good topical
  // reply with a random canned opener (the old behaviour that felt off-topic).
  const toned = (userText || "").toLowerCase();
  const hasTopicMatch = /căng thẳng|stress|áp lực|quá tải|kiệt sức|lo âu|lo lắng|sợ|buồn|khóc|đau|chán|tệ|ngủ|bạn bè|người yêu|yêu|chia tay|học|thi|điểm|trường|gia đình|bố|mẹ|ba|má|cô đơn|một mình|vui|hạnh phúc|ổn|khỏe|tuyệt|động lực|lười/.test(toned);
  const theme = extractTheme(userText);
  if (!hasTopicMatch && theme && userText.length >= 12) {
    reply = `${pick(REFLECTIVE_OPENERS)} — "${theme}". ${pick(REFLECTIVE_QUESTIONS)}`;
  }

  return {
    reply,
    suggestPhq9: false, suggestGad7: false, suggestWho5: false, suggestBigFive: false,
    bioUpdate: null,
  };
}

// Convenience for streaming callers: drive onChunk/onDone with a local reply.
export function streamLocalReply(userText, onChunk, onDone, opts = {}) {
  const result = buildLocalReply(userText, opts);
  onChunk?.(result.reply);
  onDone?.(result);
}
