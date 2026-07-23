import { describe, it, expect } from "vitest";
import { buildLocalReply } from "../localFallback";

// Regression: bare "toi" in the isSad keyword regex matched the ordinary
// pronoun "tôi" ("I") — which strips to "toi" too — so almost any message
// mistakenly got the sad-fallback pool + an unrelated CBT worksheet card.
describe("buildLocalReply", () => {
  it("does not treat an ordinary sentence containing 'tôi' as sad", () => {
    const { showInlineCbt } = buildLocalReply("tôi ngủ không được nha cậu ơi");
    expect(showInlineCbt).toBe(false);
  });

  it("does not treat 'ở đâu' (where) as physical pain ('đau')", () => {
    const { showInlineBreathing, showInlineCbt } = buildLocalReply("cậu ở đâu vậy");
    expect(showInlineBreathing).toBe(false);
    expect(showInlineCbt).toBe(false);
  });

  it("still recognizes an actual sad message", () => {
    const { showInlineCbt } = buildLocalReply("tôi cảm thấy buồn và chán nản quá");
    expect(showInlineCbt).toBe(true);
  });

  it("still recognizes an actual stress message", () => {
    const { showInlineBreathing } = buildLocalReply("tôi đang áp lực và căng thẳng quá");
    expect(showInlineBreathing).toBe(true);
  });
});
