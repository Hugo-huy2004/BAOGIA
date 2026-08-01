// Single-source local fallback bridge — delegates 100% of intent matching to intentClassifier.js
import { findMatchingIntent, isCrisisText, removeVietnameseTones } from "../../../components/member/banhocduong/constants/intentClassifier";
import { CRISIS_HOTLINE_TEXT } from "../../../components/member/banhocduong/constants/hotlines";

function getFriendlyName(bio) {
  if (!bio?.displayName) return "cậu";
  const parts = bio.displayName.trim().split(" ");
  return parts[parts.length - 1];
}

const FALLBACK_POSITIVE = [
  "Ôi nghe thích thế {name} ơi! 🎉 Tinh thần sảng khoái, thoải mái không mệt mỏi là vibe tuyệt vời nhất luôn á. Giữ vững năng lượng tích cực này nha, hôm nay có gì vui kể tớ nghe với 😜",
  "Hế lô {name}! Thấy cậu vui vẻ, khỏe khoắn thế này tớ mừng lây luôn nè! 🥳 Tự thưởng cho mình một ly nước ngon hay làm điều mình thích để nạp thêm mood cực chill nha 🧋✨",
  "Tốt quá luôn {name} ơi! 🌸 Năng lượng tràn trề thế này là dư sức cân cả ngày rồi. Tớ luôn ở đây cùng chia sẻ niềm vui với cậu nè!"
];

const FALLBACK_DEFAULT = [
  "Hế lô {name} iu! Tớ đang lắng nghe từng chữ cậu nói đây nè. Kể tiếp cho tớ nghe đi, tớ hóng lắm đó 😜",
  "Tớ ở ngay đây nè {name}! Cứ tự nhiên trải lòng nha, tớ cân hết mọi cảm xúc của cậu luôn!",
  "Nghe rõ rồi nha {name}! Có điều gì đang làm cái đầu đáng yêu của cậu băn khoăn vậy, nói tớ nghe với!"
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function buildLocalReply(userText = "", opts = {}) {
  const bio = opts.bio || opts.profile || null;
  const historyLogs = opts.historyLogs || [];
  const clean = removeVietnameseTones(userText).toLowerCase();

  // 1. Single source of truth: check intentClassifier.js
  const matched = findMatchingIntent(userText, bio, historyLogs);
  if (matched) {
    const formattedReply = Array.isArray(matched.reply) ? matched.reply.join("\n\n") : matched.reply;
    return {
      reply: formattedReply,
      rawReplyArray: Array.isArray(matched.reply) ? matched.reply : [matched.reply],
      isCrisis: matched.id === "crisis",
      suggestPhq9: !!matched.suggestPhq9,
      suggestGad7: !!matched.suggestGad7,
      suggestWho5: !!matched.suggestWho5,
      suggestBigFive: !!matched.suggestBigFive,
      suggestDass42: !!matched.suggestDass42,
      suggestMmpi30: !!matched.suggestMmpi30,
      showInlineBreathing: !!matched.showInlineBreathing,
      showInlineCbt: !!matched.showInlineCbt,
      showInlineSleep: matched.id === "sleep",
      showInlineEval: matched.id === "evaluation",
      showInlineTherapy: matched.id === "therapy",
      quickActions: matched.quickActions || null,
      action: matched.action || null,
      bioUpdate: null,
    };
  }

  // 2. Crisis safety check
  if (isCrisisText(clean)) {
    return {
      reply: "Tớ thực sự lo lắng cho cậu khi đọc điều này. Cảm xúc của cậu rất quan trọng và cậu xứng đáng được giúp đỡ. " + CRISIS_HOTLINE_TEXT,
      isCrisis: true,
      suggestPhq9: false, suggestGad7: false, suggestWho5: false, suggestBigFive: false,
      showInlineBreathing: false, showInlineCbt: false,
      bioUpdate: null,
    };
  }

  // 3. Fallback selection: Check for positive mood vs default friendly greeting
  const name = getFriendlyName(bio);
  const isPositive = /\b(thoai mai|vui|khoe|tot|tuyet|khong met|sang khoai|yeu doi|binh yen|khong sao)\b/.test(clean);
  const replyTemplate = isPositive ? pick(FALLBACK_POSITIVE) : pick(FALLBACK_DEFAULT);
  const reply = replyTemplate.replace(/\{name\}/g, name);

  return {
    reply,
    suggestPhq9: false, suggestGad7: false, suggestWho5: false, suggestBigFive: false,
    showInlineBreathing: false,
    showInlineCbt: false,
    showInlineSleep: false,
    showInlineEval: false,
    showInlineTherapy: false,
    bioUpdate: null,
  };
}

export function streamLocalReply(userText, onChunk, onDone, opts = {}) {
  const result = buildLocalReply(userText, opts);
  onChunk?.(result.reply);
  setTimeout(() => {
    onDone?.(result);
  }, 100);
}

