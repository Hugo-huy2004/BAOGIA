import { describe, it, expect } from "vitest";
import { isCrisisText, removeVietnameseTones } from "../intentClassifier";

// isCrisisText runs on tone-stripped, lowercased text (that's how the classifier
// feeds it), so the corpus is passed through removeVietnameseTones here too.
const crisis = (raw) => isCrisisText(removeVietnameseTones(raw).toLowerCase());

describe("isCrisisText — must-catch (self-harm / suicidal ideation)", () => {
  const MUST_TRIGGER = [
    "tôi muốn tự tử",
    "mình không muốn sống nữa",
    "tao muốn kết liễu đời mình",
    "tôi muốn chết quá",
    "chẳng còn muốn sống",
    "tôi muốn biến mất vĩnh viễn",
    "cuộc sống này không còn ý nghĩa gì nữa",
    "nếu tôi chết thì mọi người sẽ tốt hơn",
    "tôi muốn tự làm đau bản thân",
    "muốn kết thúc tất cả",
    "không ai cần tôi nữa",
  ];
  MUST_TRIGGER.forEach((t) => {
    it(`triggers on: "${t}"`, () => {
      expect(crisis(t)).toBe(true);
    });
  });
});

describe("isCrisisText — must-NOT-trigger (hyperbole / ordinary talk)", () => {
  const MUST_NOT_TRIGGER = [
    "đói chết mất",
    "cười chết đi được",
    "buồn ngủ chết đi được",
    "hôm nay mệt chết luôn",
    "bài tập nhiều muốn chết",
    "tôi thích chơi game",
    "hôm nay tôi hơi buồn",
    "trời nóng chết đi được",
    "học căng thẳng quá",
    "",
  ];
  MUST_NOT_TRIGGER.forEach((t) => {
    it(`does not trigger on: "${t}"`, () => {
      expect(crisis(t)).toBe(false);
    });
  });
});

describe("removeVietnameseTones", () => {
  it("strips diacritics and lowercases", () => {
    expect(removeVietnameseTones("Tôi muốn chết")).toBe("toi muon chet");
    expect(removeVietnameseTones("Đường")).toBe("duong");
  });
  it("is safe on empty input", () => {
    expect(removeVietnameseTones("")).toBe("");
    expect(removeVietnameseTones(null)).toBe("");
  });
});
