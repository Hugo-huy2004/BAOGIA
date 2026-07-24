// Smart local fallback engine — guarantees that HugoPSY ALWAYS answers with high-empathy,
// warm, natural Vietnamese replies even when the AI server is unreachable/overloaded.
import { findMatchingIntent, isCrisisText, removeVietnameseTones } from "../../../components/member/banhocduong/constants/intentClassifier";
import { CRISIS_HOTLINE_TEXT } from "../../../components/member/banhocduong/constants/hotlines";

function getFriendlyName(bio) {
  if (!bio?.displayName) return "cậu";
  const parts = bio.displayName.trim().split(" ");
  return parts[parts.length - 1];
}

const FALLBACK_OVERTHINKING = [
  "Bắt quả tang {name} lại đang overthinking rồi đúng không nào! 😜 Cái đầu nhỏ của cậu chứa cả vũ trụ luôn rồi đó. Thả lỏng hai vai xuống nè, xả hết cái đống suy nghĩ rối rắm đó ra đây cho tớ gánh bớt cho!",
  "Khi overthinking, bộ não mình hay tự biên tự diễn drama kinh dị dữ lắm {name} ơi! Nhưng có tớ ở đây rồi nè, nín đi tớ đền cho cốc trà sữa. Kể tớ nghe nút thắt nào đang làm cậu nhức đầu nhất đi?",
];

const FALLBACK_EXAM_FAMILY = [
  "Áp lực từ thi cử hay kỳ vọng{who} nhiều lúc đè nặng muốn gãy lưng luôn đúng ko {name}? Nhưng mà nè, cậu đã cố gắng giỏi lắm rồi á! Xả hết ấm ức ra với tớ đi, tớ luôn 100% đứng về phe cậu!",
  "Việc bị so sánh hay thấy mình chưa đủ giỏi thật sự đau lòng lắm {name} ơi. Nhưng cậu trong mắt tớ là độc bản xịn xố nhất đời luôn! Cứ tự tin lên, có tớ ở đây ôm ấp đồng hành nè 💙",
];

const FALLBACK_LONELINESS = [
  "Cảm giác ở giữa đám đông mà thấy mình như ở trên hành tinh khác đúng ko {name}? Lại đây tớ ôm một cái thật chặt nè 🫂 Cứ thoải mái xả hết lòng mình ra nhé, tớ nghe hết!",
  "Đôi khi mình không cần phải tỏ ra mạnh mẽ 24/7 đâu {name} ơi. Ở cạnh tớ, cậu cứ việc nhây, khóc hay than thở tùy thích — tớ bao trọn gói sự kiên nhẫn cho cậu!",
];

const FALLBACK_SAD = [
  "Nỗi buồn đến ghé thăm chút thui mà {name} ơi! Đừng tự dằn vặt mình nha. Tớ ở ngay cạnh cậu đây nè, cậu buồn bao nhiêu tớ thương bấy nhiêu 💙",
  "Nào nào, thương {name} nhiều lắm đó! Chuyện gì làm cậu trăn trở vậy, xả ra đây cho nhẹ lòng đi tớ nghe nè?",
  "Tớ nghe thấy nỗi buồn của {name} rồi nè. Đừng trốn một mình nữa nha, có tớ ở đây cùng cậu gỡ gạc lại nụ cười nè 😜"
];

const FALLBACK_STRESS = [
  "Oái! Cái chế độ stress nó đang hành hạ {name} của tớ đúng ko? Hít một hơi thật sâu rồi thở ra cùng tớ nào: 1... 2... 3... Thả lỏng đê, chuyện đâu còn có đó!",
  "Áp lực công việc/học hành dạo này dồn dập quá đúng ko? {name} đã siêu dũng cảm rồi á! Nghỉ tay 5 phút nhâm nhi miếng nước rồi tâm sự nhây với tớ nha.",
  "Căng thẳng quá là hại nhan sắc lắm nghen {name}! Cứ từ từ kể tớ nghe, tớ với cậu cùng gỡ từng chút một!"
];

const FALLBACK_DEFAULT = [
  "Hế lô {name} iu! Tớ đang lắng nghe từng chữ cậu nói đây nè. Kể tiếp cho tớ nghe đi, tớ hóng lắm đó 😜",
  "Tớ ở ngay đây nè {name}! Cứ tự nhiên trải lòng nha, tớ cân hết mọi cảm xúc của cậu luôn!",
  "Nghe rõ rồi nha {name}! Có điều gì đang làm cái đầu đáng yêu của cậu băn khoăn vậy, nói tớ nghe với!"
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const WHO_PATTERNS = [
  { who: "của bố mẹ", regex: /\b(bo me|ba me|gia dinh)\b/ },
  { who: "của bạn bè", regex: /\b(ban than|ban be|dam ban)\b/ },
  { who: "của người yêu", regex: /\b(nguoi yeu|ny|ban trai|ban gai)\b/ },
  { who: "của thầy cô", regex: /\b(thay co|giao vien|giao su)\b/ },
];

export function buildLocalReply(userText = "", opts = {}) {
  const bio = opts.bio || opts.profile || null;
  const historyLogs = opts.historyLogs || [];
  const clean = removeVietnameseTones(userText).toLowerCase();

  // Try intentClassifier first for rich matching
  const matched = findMatchingIntent(userText, bio, historyLogs);
  if (matched) {
    const formattedReply = Array.isArray(matched.reply) ? matched.reply.join("\n\n") : matched.reply;
    const isOverthinking = /\b(overthinking|suy nghi nhieu|suy nghi tieu cuc|quan tri|loan len|be tac)\b/.test(clean);
    const isExamFamily = /\b(thi cu|diem so|gia dinh|bo me|ba me|ky vong|so sanh|rot mon|ap luc hoc)\b/.test(clean);
    const isSad = /\b(buon|khoc|dau long|chan nan|toi te|khong on|that vong|nan long)\b/.test(clean);
    const isStress = /\b(cang thang|stress|ap luc|qua tai|kiet suc|burn.?out|lo au|lo lang|hoang loan|anxiety|panic|met|so hai)\b/.test(clean);
    const isLowSelfEsteem = /\b(tu ti|that bai|vo dung|khong bang ai)\b/.test(clean);

    const isSleep = /\b(ngu|mat ngu|kho ngu|thuc khuya|thieu ngu|bao cao giac ngu|tinh chu ky ngu|giac ngu)\b/.test(clean);
    const isEval = /\b(bao cao|danh gia|ket qua test|diem phuc hoi|ho so tam ly|chi so|dass|phq|gad)\b/.test(clean);
    const isTherapy = /\b(tri lieu|bai tap|hit tho|cbt|chan niem|am nhac 432hz|nhac 432hz)\b/.test(clean);

    const showInlineBreathing = !!matched.showInlineBreathing || matched.id === "anxiety" || matched.id === "sleep" || isStress || isOverthinking;
    const showInlineCbt = !!matched.showInlineCbt || matched.id === "sadness" || matched.id === "academic_stress" || matched.id === "breakup" || matched.id === "low_self_esteem" || matched.id === "family_conflict" || isSad || isExamFamily || isOverthinking || isLowSelfEsteem;

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
      showInlineBreathing,
      showInlineCbt,
      showInlineSleep: isSleep || matched.id === "sleep",
      showInlineEval: isEval || matched.id === "evaluation",
      showInlineTherapy: isTherapy || matched.id === "therapy",
      quickActions: matched.quickActions || null,
      action: matched.action || null,
      bioUpdate: null,
    };
  }

  if (isCrisisText(clean)) {
    return {
      reply:
        "Tớ thực sự lo lắng cho cậu khi đọc điều này. Cảm xúc của cậu rất quan trọng và cậu xứng đáng được giúp đỡ. " +
        CRISIS_HOTLINE_TEXT,
      isCrisis: true,
      suggestPhq9: false, suggestGad7: false, suggestWho5: false, suggestBigFive: false,
      showInlineBreathing: false,
      showInlineCbt: false,
      bioUpdate: null,
    };
  }

  const name = getFriendlyName(bio);
  const whoMatch = WHO_PATTERNS.find((p) => p.regex.test(clean));
  const who = whoMatch ? ` ${whoMatch.who}` : "";

  let replyTemplate = "";
  const isOverthinking = /\b(overthinking|suy nghi nhieu|suy nghi tieu cuc|quan tri|loan len|be tac)\b/.test(clean);
  const isExamFamily = /\b(thi cu|diem so|gia dinh|bo me|ba me|ky vong|so sanh|rot mon|ap luc hoc)\b/.test(clean);
  const isLoneliness = /\b(co don|mot minh|khong ai hieu|lac long|bo roi|tachtiet)\b/.test(clean);
  const isStress = /\b(cang thang|stress|ap luc|qua tai|kiet suc|burn.?out|lo au|lo lang|hoang loan|anxiety|panic|met|so hai)\b/.test(clean);
  const isSad = /\b(buon|khoc|dau long|chan nan|toi te|khong on|that vong|nan long)\b/.test(clean);
  const isLowSelfEsteem = /\b(tu ti|that bai|vo dung|khong bang ai)\b/.test(clean);

  if (isOverthinking) {
    replyTemplate = pick(FALLBACK_OVERTHINKING);
  } else if (isExamFamily) {
    replyTemplate = pick(FALLBACK_EXAM_FAMILY);
  } else if (isLoneliness) {
    replyTemplate = pick(FALLBACK_LONELINESS);
  } else if (isStress) {
    replyTemplate = pick(FALLBACK_STRESS);
  } else if (isSad) {
    replyTemplate = pick(FALLBACK_SAD);
  } else {
    replyTemplate = pick(FALLBACK_DEFAULT);
  }

  const reply = replyTemplate.replace(/\{name\}/g, name).replace(/\{who\}/g, who);
  const isSleep = /\b(ngu|mat ngu|kho ngu|thuc khuya|thieu ngu|bao cao giac ngu|tinh chu ky ngu|giac ngu)\b/.test(clean);
  const isEval = /\b(bao cao|danh gia|ket qua test|diem phuc hoi|ho so tam ly|chi so|dass|phq|gad)\b/.test(clean);
  const isTherapy = /\b(tri lieu|bai tap|hit tho|cbt|chan niem|am nhac 432hz|nhac 432hz)\b/.test(clean);

  const showInlineBreathing = isStress || isOverthinking;
  const showInlineCbt = isSad || isExamFamily || isOverthinking || isLowSelfEsteem;

  return {
    reply,
    suggestPhq9: false, suggestGad7: false, suggestWho5: false, suggestBigFive: false,
    showInlineBreathing,
    showInlineCbt,
    showInlineSleep: isSleep,
    showInlineEval: isEval,
    showInlineTherapy: isTherapy,
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
