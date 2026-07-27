import { STORE_APPS, PRODUCT_GROUPS, perkLabel } from "./storeData";

/**
 * Thuật toán bày hàng của Hugo Store.
 *
 * Cửa hàng KHÔNG chia tab. Thay vào đó mỗi mảng nội dung là một `StoreSection`
 * tự trả lời hai câu: "lúc này tôi có đáng hiện không?" (`isVisible`) và "hiện
 * ra thì trông thế nào?" (`build`). `StoreFeed` gom chúng lại, lọc, xếp theo
 * độ ưu tiên rồi trả về một danh sách mô tả thuần dữ liệu để lớp view vẽ.
 *
 * Nhờ vậy: chưa mua gì thì không có mục "Đã mua", không có mã thì không có ví
 * mã, đang tìm kiếm thì cả trang nhường chỗ cho kết quả — người dùng không
 * phải tự bấm qua lại giữa mấy cái tab.
 */

const norm = (value) => String(value || "").toLowerCase();

/** Có khớp từ khoá tìm kiếm với bất kỳ trường nào không. */
const matches = (query, ...fields) => !query || fields.some(f => norm(f).includes(query));

export class StoreSection {
  /**
   * @param {string} id  khoá ổn định (đặt tay, không lấy constructor.name —
   *                     minifier đổi tên lớp là hỏng React key).
   * @param {number} priority  nhỏ hơn thì nằm trên.
   * @param {object} ctx  bối cảnh cửa hàng, xem `StoreFeed`.
   */
  constructor(id, priority, ctx) {
    this.id = id;
    this.priority = priority;
    this.ctx = ctx;
  }

  isVisible() {
    return true;
  }

  /** @returns {object|null} mô tả để view vẽ, hoặc null nếu không có gì. */
  build() {
    return null;
  }
}

/** Đang gõ tìm kiếm thì kết quả chiếm trọn trang. */
export class SearchResultsSection extends StoreSection {
  constructor(ctx) {
    super("search", 0, ctx);
  }

  isVisible() {
    return Boolean(this.ctx.query);
  }

  build() {
    const { query, products } = this.ctx;
    const apps = STORE_APPS.filter(a => matches(query, a.label, a.tagline));
    const packs = products.filter(p => matches(query, p.name, p.description, perkLabel(p)));

    return {
      kind: "search",
      title: apps.length + packs.length > 0 ? "Kết quả tìm kiếm" : "Không tìm thấy gì",
      subtitle:
        apps.length + packs.length > 0
          ? `${apps.length} ứng dụng · ${packs.length} gói`
          : "Thử một từ khoá khác xem sao.",
      apps,
      packs,
    };
  }
}

/** Ứng dụng được chọn trong ngày — khối tím lớn mở đầu trang. */
export class SpotlightSection extends StoreSection {
  constructor(ctx) {
    super("spotlight", 10, ctx);
  }

  isVisible() {
    return !this.ctx.query;
  }

  /** Xoay theo ngày để cùng một ngày ai cũng thấy cùng một ứng dụng. */
  static pick(apps, today = new Date()) {
    if (!apps.length) return null;
    const days = Math.floor(
      (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(2026, 0, 1)) / 86400000
    );
    return apps[((days % apps.length) + apps.length) % apps.length];
  }

  build() {
    const app = SpotlightSection.pick(STORE_APPS);
    return app ? { kind: "spotlight", app } : null;
  }
}

/** Gói rẻ nhất — chỗ dễ bắt đầu nhất cho người mới. */
export class FeaturedPackSection extends StoreSection {
  constructor(ctx) {
    super("featured", 20, ctx);
  }

  isVisible() {
    return !this.ctx.query && this.ctx.products.length > 0;
  }

  build() {
    const pack = [...this.ctx.products].sort((a, b) => a.priceJoy - b.priceJoy)[0];
    return pack ? { kind: "featuredPack", title: "Gói được chọn", subtitle: "Mở thêm quyền lợi bằng JOY bạn đã tích", pack } : null;
  }
}

/** Rail ứng dụng — bỏ qua cái đang nằm trên spotlight cho khỏi trùng. */
export class AppShelfSection extends StoreSection {
  constructor(ctx) {
    super("apps", 30, ctx);
  }

  isVisible() {
    return !this.ctx.query;
  }

  build() {
    const spotlight = SpotlightSection.pick(STORE_APPS);
    return {
      kind: "appRail",
      title: "Tất cả đều miễn phí",
      subtitle: "Ứng dụng trong hệ sinh thái Hugo",
      apps: STORE_APPS.filter(a => a.id !== spotlight?.id),
    };
  }
}

/** Một kệ cho mỗi loại sản phẩm; kệ rỗng thì tự biến mất. */
export class PackGroupSection extends StoreSection {
  constructor(ctx, group, order) {
    super(`group:${group.type}`, 40 + order, ctx);
    this.group = group;
  }

  get list() {
    const featured = new FeaturedPackSection(this.ctx).isVisible()
      ? [...this.ctx.products].sort((a, b) => a.priceJoy - b.priceJoy)[0]
      : null;
    return this.ctx.products.filter(
      p => (p.productType || "general") === this.group.type && p._id !== featured?._id
    );
  }

  isVisible() {
    return !this.ctx.query && this.list.length > 0;
  }

  build() {
    return {
      kind: "packList",
      title: this.group.title,
      subtitle: this.group.subtitle,
      packs: this.list,
    };
  }
}

/** Ví mã giảm giá: chỉ mở rộng khi đã lưu mã, còn không thì một dòng gọn. */
export class PromoWalletSection extends StoreSection {
  constructor(ctx) {
    super("promos", 60, ctx);
  }

  isVisible() {
    return !this.ctx.query;
  }

  build() {
    return {
      kind: "promoWallet",
      title: "Mã khuyến mãi",
      subtitle: this.ctx.promos.length
        ? "Chọn ở bước thanh toán để trừ tiền"
        : "Có mã? Lưu lại để dùng khi thanh toán",
      promos: this.ctx.promos,
    };
  }
}

/** Lịch sử mua — chưa mua gì thì không bày ra một ô trống vô nghĩa. */
export class PurchasesSection extends StoreSection {
  constructor(ctx) {
    super("orders", 70, ctx);
  }

  isVisible() {
    return !this.ctx.query && this.ctx.orders.length > 0;
  }

  build() {
    return {
      kind: "orders",
      title: "Đã mua",
      subtitle: `${this.ctx.orders.length} đơn gần đây`,
      orders: this.ctx.orders.slice(0, 8),
      hasMore: this.ctx.orders.length > 8,
    };
  }
}

/** Số dư đóng trang. */
export class BalanceSection extends StoreSection {
  constructor(ctx) {
    super("balance", 90, ctx);
  }

  isVisible() {
    return !this.ctx.query;
  }

  build() {
    return { kind: "balance", balance: this.ctx.balance };
  }
}

export class StoreFeed {
  /**
   * @param {object} ctx
   * @param {Array}  ctx.products  sản phẩm đang bán
   * @param {Array}  ctx.orders    đơn đã mua
   * @param {Array}  ctx.promos    mã đã lưu
   * @param {string} ctx.query     từ khoá tìm kiếm (đã trim + lowercase)
   * @param {number} ctx.balance   số dư JOY
   */
  constructor(ctx) {
    this.ctx = {
      products: [],
      orders: [],
      promos: [],
      query: "",
      balance: 0,
      ...ctx,
    };
    this.sections = StoreFeed.assemble(this.ctx);
  }

  static assemble(ctx) {
    return [
      new SearchResultsSection(ctx),
      new SpotlightSection(ctx),
      new FeaturedPackSection(ctx),
      new AppShelfSection(ctx),
      ...PRODUCT_GROUPS.map((group, i) => new PackGroupSection(ctx, group, i)),
      new PromoWalletSection(ctx),
      new PurchasesSection(ctx),
      new BalanceSection(ctx),
    ];
  }

  /** @returns {Array<object>} mô tả đã lọc và xếp thứ tự, sẵn sàng để vẽ. */
  compose() {
    return this.sections
      .filter(section => section.isVisible())
      .sort((a, b) => a.priority - b.priority)
      .map(section => {
        const view = section.build();
        return view ? { id: section.id, ...view } : null;
      })
      .filter(Boolean);
  }
}
