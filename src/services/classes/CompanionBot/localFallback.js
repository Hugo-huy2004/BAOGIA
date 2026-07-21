// Smart local fallback engine — the guarantee that HugoPSY ALWAYS answers, even
// when the AI server is unreachable/overloaded. Used strictly as a reactive
// fallback (network error, API limit) rather than proactively intercepting.
import { isCrisisText, removeVietnameseTones } from "../../../components/member/banhocduong/constants/intentClassifier";
import { CRISIS_HOTLINE_TEXT } from "../../../components/member/banhocduong/constants/hotlines";

const REFLECTIVE_OPENERS = [
  "Tớ nghe cậu rồi",
  "Cảm ơn cậu đã chia sẻ với tớ nhé",
  "Tớ hiểu cảm giác đó của cậu",
  "Tớ đang ở đây cùng cậu",
  "Điều cậu vừa nói rất đáng để lưu tâm",
];

const REFLECTIVE_QUESTIONS = [
  "Cậu có thể nói thêm về điều này được không?",
  "Cảm giác này có đang ảnh hưởng nhiều đến sinh hoạt của cậu không?",
  "Có điều gì cụ thể xảy ra gần đây khiến cậu cảm thấy như vậy không?",
  "Cậu nghĩ điều gì sẽ giúp cậu thấy dễ chịu hơn lúc này?",
];

const FALLBACK_SAD = [
  "Nỗi buồn hay sự mỏi mệt là những cảm xúc rất bình thường của con người. Cậu không cần phải gồng mình tỏ ra ổn đâu. Tớ ở đây lắng nghe cậu.",
  "Đôi khi việc cảm thấy không vui hay chán nản là tín hiệu cơ thể và tâm lý của cậu cần được nghỉ ngơi. Hãy cứ chậm lại một chút nhé.",
  "Tớ nghe thấy nỗi buồn của cậu rồi. Hãy nhớ rằng cậu không phải đối diện với nó một mình."
];

const FALLBACK_STRESS = [
  "Khi bị căng thẳng hay áp lực, hệ thần kinh của mình thường rơi vào trạng thái quá tải. Hãy dành ra 2 phút để hít thở sâu cùng tớ nhé.",
  "Áp lực từ việc học hay cuộc sống đôi khi thật nặng nề. Cậu đang cố gắng rất nhiều rồi, hãy cho phép mình được nghỉ tay một chút nhé.",
  "Căng thẳng kéo dài có thể khiến mọi thứ trở nên mờ mịt. Hãy cùng tớ reset lại tinh thần bằng một bài tập nhỏ nha."
];

const FALLBACK_DEFAULT = [
  "Cảm ơn cậu đã tin tưởng kể cho tớ nghe. Cậu có muốn tâm sự thêm về chuyện này không?",
  "Tớ đang lắng nghe cậu đây. Dạo gần đây cuộc sống của cậu có nhiều thay đổi gì không?",
  "Tớ nghe rõ rồi. Không sao hết, cứ từ từ chia sẻ với tớ mọi chuyện nhé."
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function extractTheme(text) {
  const cleaned = String(text || "").trim().replace(/[."!?…]+$/g, "");
  if (cleaned.length === 0 || cleaned.length > 60) return null;
  return cleaned;
}

export function buildLocalReply(userText = "", { aspectId = null } = {}) {
  const clean = removeVietnameseTones(userText).toLowerCase();

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

  // Determine fallback response pool based on keywords
  let reply = "";
  const isStress = /cang thang|stress|ap luc|qua tai|kiet suc|burn.?out|lo au|lo lang|so|hoang loan|anxiety|panic|met/.test(clean);
  const isSad = /buon|khoc|dau|chan|te|toi|khong on|that vong|nan|co don|mot minh/.test(clean);

  if (isStress) {
    reply = pick(FALLBACK_STRESS);
  } else if (isSad) {
    reply = pick(FALLBACK_SAD);
  } else {
    const theme = extractTheme(userText);
    if (theme && userText.length >= 12) {
      reply = `${pick(REFLECTIVE_OPENERS)} — "${theme}". ${pick(REFLECTIVE_QUESTIONS)}`;
    } else {
      reply = pick(FALLBACK_DEFAULT);
    }
  }

  // Attach interactive widget recommendations
  const showInlineBreathing = isStress;
  const showInlineCbt = isSad || /tu ti|that bai|be tac|vo dung|khong bang ai|overthinking|suy nghi/.test(clean);

  return {
    reply,
    suggestPhq9: false, suggestGad7: false, suggestWho5: false, suggestBigFive: false,
    showInlineBreathing,
    showInlineCbt,
    bioUpdate: null,
  };
}

export function streamLocalReply(userText, onChunk, onDone, opts = {}) {
  const result = buildLocalReply(userText, opts);
  onChunk?.(result.reply);
  onDone?.(result);
}
