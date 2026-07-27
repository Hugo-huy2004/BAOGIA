import { describe, it, expect } from "vitest";
import { StoreFeed, SpotlightSection } from "./storeFeed";

const pack = (over = {}) => ({
  _id: "p1", name: "Gói nghe 1 tháng", priceJoy: 500,
  productType: "radio_time", radioMinutes: 1440, stock: -1, ...over,
});

const kinds = (ctx) => new StoreFeed(ctx).compose().map(s => s.kind);
const find = (ctx, kind) => new StoreFeed(ctx).compose().find(s => s.kind === kind);

describe("StoreFeed — bày cái gì thì bày, đừng bày ô trống", () => {
  it("chưa mua gì thì không có mục Đã mua", () => {
    expect(kinds({})).not.toContain("orders");
  });

  it("có đơn thì mục Đã mua xuất hiện", () => {
    const orders = [{ _id: "o1", productName: "X", priceJoy: 10, purchaseCode: "ORD-1", createdAt: Date.now() }];
    expect(kinds({ orders })).toContain("orders");
  });

  it("kệ sản phẩm rỗng thì không hiện", () => {
    expect(kinds({})).not.toContain("packList");
    expect(kinds({ products: [pack(), pack({ _id: "p2", priceJoy: 900 })] })).toContain("packList");
  });

  it("gói nổi bật là gói rẻ nhất và không lặp lại ở kệ bên dưới", () => {
    const products = [pack({ _id: "cheap", priceJoy: 100 }), pack({ _id: "dear", priceJoy: 900 })];
    expect(find({ products }, "featuredPack").pack._id).toBe("cheap");
    const listed = find({ products }, "packList").packs.map(p => p._id);
    expect(listed).toEqual(["dear"]);
  });

  it("chỉ có một sản phẩm thì nó lên gói nổi bật, không còn kệ thừa", () => {
    const products = [pack({ _id: "only" })];
    const result = kinds({ products });
    expect(result).toContain("featuredPack");
    expect(result).not.toContain("packList");
  });
});

describe("StoreFeed — tìm kiếm chiếm trọn trang", () => {
  const products = [pack({ name: "Gói nghe nhạc 30 ngày" })];

  it("đang tìm thì các mục khác nhường chỗ", () => {
    expect(kinds({ products, query: "nghe" })).toEqual(["search"]);
  });

  it("khớp cả ứng dụng lẫn gói bằng cùng một từ khoá", () => {
    // "nhạc" có trong tên gói và trong tagline của HugoRadio.
    const hit = find({ products, query: "nhạc" }, "search");
    expect(hit.packs).toHaveLength(1);
    expect(hit.apps.map(a => a.id)).toContain("radio");
  });

  it("không khớp gì thì vẫn trả section rỗng để báo cho người dùng", () => {
    const miss = find({ products, query: "zzzz" }, "search");
    expect(miss.apps).toHaveLength(0);
    expect(miss.packs).toHaveLength(0);
  });
});

describe("StoreFeed — thứ tự", () => {
  it("spotlight luôn nằm trên rail ứng dụng và số dư đóng trang", () => {
    const result = kinds({ products: [pack()] });
    expect(result.indexOf("spotlight")).toBeLessThan(result.indexOf("appRail"));
    expect(result.at(-1)).toBe("balance");
  });

  it("ứng dụng trong ngày không lặp lại trong rail", () => {
    const rail = find({}, "appRail");
    const spotlight = find({}, "spotlight");
    expect(rail.apps.map(a => a.id)).not.toContain(spotlight.app.id);
  });
});

describe("SpotlightSection.pick", () => {
  it("cùng một ngày cho cùng một kết quả, ngày khác thì đổi", () => {
    const apps = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const day = new Date(Date.UTC(2026, 6, 27));
    expect(SpotlightSection.pick(apps, day)).toBe(SpotlightSection.pick(apps, new Date(Date.UTC(2026, 6, 27))));
    expect(SpotlightSection.pick(apps, day)).not.toBe(SpotlightSection.pick(apps, new Date(Date.UTC(2026, 6, 28))));
  });

  it("danh sách rỗng thì trả null chứ không nổ", () => {
    expect(SpotlightSection.pick([])).toBeNull();
  });
});
