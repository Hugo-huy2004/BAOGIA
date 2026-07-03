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
  if (raw.length > 180) return false;
  if (COMPLEX_REQUEST_TERMS.some(term => clean.includes(term))) return false;
  if (LOCAL_FIRST_TERMS.some(term => clean.includes(term))) return true;
  return raw.length <= 70 && /[.!?…]?$/.test(raw);
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

  // For longer, open-ended shares, add a reflective layer so it doesn't feel
  // like a canned line — mirror their theme back plus a gentle follow-up.
  const theme = extractTheme(userText);
  if (theme && userText.length >= 24 && Math.random() < 0.75) {
    reply = `${pick(REFLECTIVE_OPENERS)}. ${pick(REFLECTIVE_QUESTIONS)}`;
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
