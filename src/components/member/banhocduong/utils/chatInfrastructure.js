import { removeVietnameseTones } from "../constants/intentClassifier";

export function isInfrastructureErrorText(text = "") {
  const t = removeVietnameseTones(String(text)).toLowerCase();
  return (
    t.includes("may chu ai") ||
    t.includes("ai server unreachable") ||
    t.includes("ai_unavailable") ||
    t.includes("loi ket noi openrouter") ||
    t.includes("loi duong truyen openrouter") ||
    (t.includes("tat ca api key") && t.includes("qua tai")) ||
    (t.includes("khong the ket noi") && t.includes("may chu ai")) ||
    (t.includes("qua tai") && (t.includes("gemini") || t.includes("openrouter") || t.includes("api key"))) ||
    (t.includes("su co ket noi") && t.includes("thu lai sau"))
  );
}

export function replaceInfrastructureText(text, safeText) {
  return isInfrastructureErrorText(text) ? safeText : text;
}

export function normalizeAiResponse(botResponse, localSafetyReply) {
  if (!botResponse || isInfrastructureErrorText(botResponse.reply)) {
    return { ...localSafetyReply, reply: localSafetyReply.reply };
  }
  return botResponse;
}
