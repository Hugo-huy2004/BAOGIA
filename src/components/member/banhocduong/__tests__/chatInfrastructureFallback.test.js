import { describe, expect, it } from "vitest";
import { isInfrastructureErrorText, normalizeAiResponse } from "../utils/chatInfrastructure";
import { buildLocalReply } from "../../../../services/classes/CompanionBot/localFallback";

describe("chat infrastructure fallback guard", () => {
  it("detects AI/server outage text before it reaches the chat bubble", () => {
    [
      "Tớ rất tiếc, máy chủ AI đang bị quá tải hoặc gặp sự cố kết nối.",
      "AI server unreachable",
      "Lỗi kết nối OpenRouter.",
      "AI_UNAVAILABLE",
      "Tất cả API Key đã bị quá tải (429).",
      "Tớ đang không thể kết nối đến máy chủ AI do sự cố mạng hoặc hạn mức.",
    ].forEach((text) => {
      expect(isInfrastructureErrorText(text)).toBe(true);
    });
  });

  it("does not treat ordinary emotional overload as infrastructure failure", () => {
    expect(isInfrastructureErrorText("Mình bị quá tải vì bài tập và deadline.")).toBe(false);
  });

  it("replaces unsafe infrastructure text with local safety reply", () => {
    const localReply = { reply: "Tớ nghe cậu rồi. Cậu muốn kể thêm không?" };
    const result = normalizeAiResponse(
      { reply: "Tớ rất tiếc, máy chủ AI đang bị quá tải hoặc gặp sự cố kết nối." },
      localReply
    );

    expect(result.reply).toBe(localReply.reply);
  });

  it("recommends interactive widgets based on emotions/keywords in local fallback", () => {
    const stressReply = buildLocalReply("Hôm nay mình mệt và áp lực bài tập quá");
    expect(stressReply.showInlineBreathing).toBe(true);

    const cbtReply = buildLocalReply("Tớ cảm thấy mình thật vô dụng");
    expect(cbtReply.showInlineCbt).toBe(true);
  });
});
