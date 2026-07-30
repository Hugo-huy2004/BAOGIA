import { describe, it, expect } from "vitest";
import { StoreFeed, SpotlightSection } from "./storeFeed";

const DAY = 86400000;

const pack = (over = {}) => ({
  _id: "p1", name: "Gói nghe nhạc 30 ngày", priceJoy: 500,
  productType: "radio_time", radioMinutes: 1440, stock: -1, ...over,
});

/** Một entry giống hệt thứ /api/store/plans trả về. */
const plan = (appId, tier = "none", over = {}) => ({
  appId,
  label: appId === "radio" ? "HugoRadio" : appId,
  featureKey: `hugo${appId}`,
  trial: { days: 7, total: 0 },
  rent: { total: 165, priceJoy: 150, tax: 15, days: 30 },
  own: { total: 1386, priceJoy: 1260, tax: 126, savePercent: 30, equivMonths: 12, comparedTo: 1980 },
  state: { tier, unlocked: tier !== "none", expiresAt: null, trialUsed: false, ...over },
});

const kinds = (ctx) => new StoreFeed(ctx).compose().map(s => s.kind);
const find = (ctx, kind) => new StoreFeed(ctx).compose().find(s => s.kind === kind);

describe("StoreFeed — chỉ bày thứ có nghĩa", () => {
  it("hiển thị HugoSO trong cửa hàng và tìm kiếm được theo tên", () => {
    const result = find({ query: "hugoso" }, "search");
    expect(result.apps.map(({ app }) => app.id)).toContain("hugoso");
    expect(result.apps.find(({ app }) => app.id === "hugoso").ladder).toBeNull();
  });

  it("chưa mua gì thì không có mục Đã mua", () => {
    expect(kinds({})).not.toContain("orders");
  });

  it("có đơn thì mục Đã mua xuất hiện", () => {
    const orders = [{ _id: "o1", productName: "X", priceJoy: 10, purchaseCode: "ORD-1", createdAt: Date.now() }];
    expect(kinds({ orders })).toContain("orders");
  });

  it("kệ vật phẩm rỗng thì không hiện", () => {
    expect(kinds({})).not.toContain("packList");
    expect(kinds({ products: [pack()] })).toContain("packList");
  });

  it("chưa mở khoá app nào thì không mời tặng quà", () => {
    expect(kinds({ plans: [plan("radio", "none")] })).not.toContain("gift");
    expect(kinds({ plans: [plan("radio", "own")] })).toContain("gift");
  });
});

describe("StoreFeed — nhắc hạn chỉ khi hạn thật sắp hết", () => {
  it("còn cả tháng thì im", () => {
    const plans = [plan("radio", "rent", { expiresAt: new Date(Date.now() + 25 * DAY) })];
    expect(kinds({ plans })).not.toContain("expiring");
  });

  it("thuê còn 2 ngày thì nhắc", () => {
    const plans = [plan("radio", "rent", { expiresAt: new Date(Date.now() + 2 * DAY) })];
    expect(kinds({ plans })).toContain("expiring");
  });

  it("dùng thử được nhắc sớm hơn thuê", () => {
    const trial = [plan("radio", "trial", { expiresAt: new Date(Date.now() + 6 * DAY) })];
    const rent = [plan("radio", "rent", { expiresAt: new Date(Date.now() + 6 * DAY) })];
    expect(kinds({ plans: trial })).toContain("expiring");
    expect(kinds({ plans: rent })).not.toContain("expiring");
  });

  it("đã hết hạn (số ngày âm) thì không nhắc nữa", () => {
    const plans = [plan("radio", "rent", { expiresAt: new Date(Date.now() - 3 * DAY) })];
    expect(kinds({ plans })).not.toContain("expiring");
  });

  it("sắp hết trước thì nằm trên", () => {
    const plans = [
      plan("radio", "rent", { expiresAt: new Date(Date.now() + 4 * DAY) }),
      plan("aura", "rent", { expiresAt: new Date(Date.now() + 1 * DAY) }),
    ];
    expect(find({ plans }, "expiring").items[0].plan.appId).toBe("aura");
  });
});

describe("StoreFeed — tâm điểm ưu tiên app còn khoá", () => {
  it("chọn app chưa mở khoá thay vì app đã sở hữu", () => {
    const plans = [plan("radio", "own"), plan("aura", "none")];
    expect(find({ plans }, "spotlight").app.id).toBe("aura");
  });

  it("mở khoá hết rồi thì vẫn có tâm điểm, không để trống", () => {
    const plans = [plan("radio", "own"), plan("aura", "own")];
    expect(find({ plans }, "spotlight")).toBeTruthy();
  });

  it("app đang ở tâm điểm không lặp lại trong rail", () => {
    const plans = [plan("radio", "none")];
    const spotlight = find({ plans }, "spotlight");
    const rail = find({ plans }, "appRail");
    expect(rail.apps.map(x => x.app.id)).not.toContain(spotlight.app.id);
  });

  it("bảng bậc bám đúng app đang ở tâm điểm", () => {
    const plans = [plan("radio", "none"), plan("aura", "own")];
    expect(find({ plans }, "ladder").plan.appId).toBe(find({ plans }, "spotlight").app.id);
  });

  it("đã sở hữu thì không dội bảng giá vào mặt nữa", () => {
    expect(kinds({ plans: [plan("radio", "own")] })).not.toContain("ladder");
  });
});

describe("StoreFeed — bấm 'Xem gói' app nào cũng ra bảng bậc app đó", () => {
  const plans = [plan("radio", "none"), plan("aura", "none"), plan("ide", "none")];

  it("app ngoài tâm điểm vẫn có bảng bậc khi được chọn", () => {
    const other = find({ plans }, "appRail").apps.find(x => x.ladder)?.app.id;
    expect(find({ plans, focus: other }, "ladder").plan.appId).toBe(other);
  });

  it("app được chọn lên luôn tâm điểm và không lặp lại trong rail", () => {
    const feed = { plans, focus: "ide" };
    expect(find(feed, "spotlight").app.id).toBe("ide");
    expect(find(feed, "appRail").apps.map(x => x.app.id)).not.toContain("ide");
  });

  it("đã sở hữu mà tự bấm xem gói thì vẫn được xem", () => {
    expect(kinds({ plans: [plan("radio", "own")], focus: "radio" })).toContain("ladder");
  });

  it("app miễn phí không dựng bảng bậc rỗng", () => {
    expect(kinds({ plans, focus: "bio" })).not.toContain("ladder");
  });
});

describe("StoreFeed — tìm kiếm chiếm trọn trang", () => {
  const products = [pack()];

  it("đang tìm thì các mục khác nhường chỗ", () => {
    expect(kinds({ products, query: "nhạc" })).toEqual(["search"]);
  });

  it("khớp cả ứng dụng lẫn vật phẩm bằng cùng một từ khoá", () => {
    const hit = find({ products, query: "nhạc" }, "search");
    expect(hit.packs).toHaveLength(1);
    expect(hit.apps.map(x => x.app.id)).toContain("radio");
  });

  it("kết quả tìm kiếm mang theo bậc giá để vẽ đúng nút", () => {
    const hit = find({ products, plans: [plan("radio", "own")], query: "radio" }, "search");
    expect(hit.apps.find(x => x.app.id === "radio").state.tier).toBe("own");
  });

  it("không khớp gì thì vẫn báo cho người dùng biết", () => {
    const miss = find({ products, query: "zzzz" }, "search");
    expect(miss.apps).toHaveLength(0);
    expect(miss.packs).toHaveLength(0);
  });
});

describe("StoreFeed — thứ tự marketing", () => {
  it("tâm điểm → nhắc hạn → bảng bậc → rail, số dư đóng trang", () => {
    const plans = [plan("radio", "rent", { expiresAt: new Date(Date.now() + 2 * DAY) })];
    const result = kinds({ plans, products: [pack()] });
    expect(result.indexOf("spotlight")).toBeLessThan(result.indexOf("expiring"));
    expect(result.indexOf("expiring")).toBeLessThan(result.indexOf("appRail"));
    expect(result.at(-1)).toBe("balance");
  });

  it("mời tặng quà nằm sau kệ hàng, trước lịch sử", () => {
    const orders = [{ _id: "o1", productName: "X", priceJoy: 10, purchaseCode: "C", createdAt: Date.now() }];
    const result = kinds({ plans: [plan("radio", "own")], products: [pack()], orders });
    expect(result.indexOf("packList")).toBeLessThan(result.indexOf("gift"));
    expect(result.indexOf("gift")).toBeLessThan(result.indexOf("orders"));
  });
});

describe("StoreFeed.planOf", () => {
  it("tra được bảng bậc theo appId, app miễn phí trả null", () => {
    const feed = new StoreFeed({ plans: [plan("radio", "none")] });
    expect(feed.planOf("radio").label).toBe("HugoRadio");
    expect(feed.planOf("bio")).toBeNull();
  });
});

describe("SpotlightSection.rotate", () => {
  it("cùng một ngày cho cùng kết quả, ngày khác thì đổi", () => {
    const list = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const day = new Date(Date.UTC(2026, 6, 27));
    expect(SpotlightSection.rotate(list, day)).toBe(SpotlightSection.rotate(list, new Date(Date.UTC(2026, 6, 27))));
    expect(SpotlightSection.rotate(list, day)).not.toBe(SpotlightSection.rotate(list, new Date(Date.UTC(2026, 6, 28))));
  });

  it("danh sách rỗng thì trả null chứ không nổ", () => {
    expect(SpotlightSection.rotate([])).toBeNull();
  });
});
