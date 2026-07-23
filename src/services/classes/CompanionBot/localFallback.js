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
  "Có vẻ như đầu óc {name} đang chạy liên tục không ngừng nghỉ đúng không? Cảm giác bị ngợp bởi hàng đống suy nghĩ trong đầu thật sự mệt mỏi lắm. Cậu muốn trút bớt những điều đang lo lắng ra đây với tớ không?",
  "Khi overthinking, mọi viễn cảnh tệ nhất dường như đều kéo đến cùng một lúc. Nhưng tớ ở đây rồi {name}, cậu cứ thả lỏng từ từ và kể tớ nghe nút thắt nào đang làm cậu rối nhất nhé.",
];

const FALLBACK_EXAM_FAMILY = [
  "Áp lực từ thi cử và kỳ vọng{who} đôi khi nặng nề như một tảng đá đè lên ngực vậy. {name} đã cố gắng rất nhiều rồi. Cứ xả hết những bức bối đó ra với tớ nha, tớ luôn đứng về phía cậu.",
  "Việc bị so sánh hay mang cảm giác chưa đủ tốt thật sự đau lắm {name}. Nhưng cậu biết không, giá trị của cậu không chỉ nằm ở điểm số hay kỳ vọng của người khác. Tớ vẫn luôn ở đây lắng nghe cậu.",
];

const FALLBACK_LONELINESS = [
  "Cảm giác xung quanh đông người nhưng chẳng ai thật sự hiểu mình thật sự rất cô đơn {name} ơi. Cảm ơn cậu đã tin tưởng mở lời với tớ. Hôm nay cậu đã trải qua những gì, kể tớ nghe nha?",
  "Đôi khi tất cả những gì mình cần chỉ là một khoảng không an toàn để không phải gồng mình tỏ ra mạnh mẽ. Ở đây với tớ, {name} cứ thoải mái là chính mình nhé.",
];

const FALLBACK_SAD = [
  "Nỗi buồn hay sự mỏi mệt là những cảm xúc rất bình thường của con người. {name} không cần phải gồng mình tỏ ra ổn đâu. Tớ ở đây ôm lấy cảm xúc này cùng cậu.",
  "Đôi khi việc cảm thấy không vui hay chán nản là tín hiệu cơ thể và tâm lý của cậu cần được nghỉ ngơi. Hãy cứ chậm lại một chút nhé {name}, tớ đang lắng nghe đây.",
  "Tớ nghe thấy nỗi buồn của {name} rồi. Hãy nhớ rằng cậu không phải đối diện với nó một mình đâu nha."
];

const FALLBACK_STRESS = [
  "Khi bị căng thẳng hay áp lực quá tải, hệ thần kinh của mình rất cần một khoảng dừng. {name} hãy thả lỏng hai vai xuống, hít một hơi thật sâu cùng tớ nhé.",
  "Áp lực từ học tập và cuộc sống đôi khi thật nặng nề. {name} đang cố gắng rất nhiều rồi, hãy cho phép mình được nghỉ tay một chút nha.",
  "Căng thẳng kéo dài có thể khiến mọi thứ trở nên mờ mịt. Cứ từ từ chia sẻ với tớ {name}, tớ sẽ cùng cậu gỡ từng chút một."
];

const FALLBACK_DEFAULT = [
  "Cảm ơn {name} đã tin tưởng kể cho tớ nghe. Cậu đang cảm thấy thế nào rõ nhất lúc này, chia sẻ thêm với tớ nha?",
  "Tớ đang lắng nghe {name} đây. Cứ từ từ trải lòng, tớ luôn ở đây đồng hành cùng cậu.",
  "Tớ nghe rõ rồi. Không sao hết {name}, có điều gì đang làm cậu suy nghĩ, cứ kể tớ nghe nhé."
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
