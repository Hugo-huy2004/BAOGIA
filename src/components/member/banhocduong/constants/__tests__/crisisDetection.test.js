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

describe("isCrisisText — paraphrase catch-net (near-miss wording the base regex won't literal-match)", () => {
  const MUST_TRIGGER_PARAPHRASE = [
    "gio to chan song lam roi that su", // close paraphrase of "chán sống lắm rồi", extra words around it
    "to uoc gi minh co the bien mat khoi the gioi nay mai", // filler words ("có thể") inserted mid-phrase
    "khong con ai can toi dau nen thoi", // "còn" inserted — day-to-day phrasing near "không ai cần tôi nữa"
    "tam su chut la dao nay to cam thay khong con ly do nao de song tiep ca", // crisis clause embedded in a longer message
  ];
  MUST_TRIGGER_PARAPHRASE.forEach((t) => {
    it(`triggers on: "${t}"`, () => {
      expect(isCrisisText(t)).toBe(true);
    });
  });
});

// Regression test for a real false-positive incident: a first version of the
// paraphrase catch-net used whole-sentence Dice-bigram similarity, which
// scored this entirely cheerful message at 0.625 against "tớ không xứng đáng
// được sống trên đời này" — purely from sharing common Vietnamese particles
// ("không", "tôi", "được", "nay"/"đấy"), and fired the crisis/SOS flow on a
// user who just said they were headed out to have fun. Replaced with anchored
// regex (deterministic substring/order matching, bounded gaps only) so an
// unrelated sentence can never trip it no matter how many filler words it
// shares with a danger phrase. This exact message — and near-miss siblings
// that share the same particles as real trigger phrases — must never
// regress back to true.
describe("isCrisisText — must stay quiet on ordinary talk that shares filler words with trigger phrases", () => {
  const MUST_NOT_TRIGGER_PARAPHRASE = [
    "Không đâu, hôm nay tôi chuẩn bị được đi chơi đấy", // the reported false positive
    "hom nay hoc met qua chan ghe",
    "to buon vi bi diem kem thoi",
    "cuoc song sinh vien nhieu deadline thiet",
    "to hoi met nhung on thoi, mai on hon",
    "hom nay toi khong co gi de lam ca",
    "toi khong biet phai lam sao voi bai tap nay nua",
    "khong ai o nha ca nen toi hoi buon",
    "toi khong the chiu duoc mui vi nay",
    "gia nhu hom qua toi khong ngu quen thi tot roi",
    "toi can ban giup toi lam bai tap ve nha",
    "hom nay troi dep, toi muon di choi cong vien",
    "toi khong xung dang duoc diem cao vi lam bai kem",
    "ganh nang bai vo nhieu qua nhung khong sao",
  ];
  MUST_NOT_TRIGGER_PARAPHRASE.forEach((t) => {
    it(`stays quiet on: "${t}"`, () => {
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
