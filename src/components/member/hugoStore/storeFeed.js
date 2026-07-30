import { STORE_APPS, PRODUCT_GROUPS, appById, perkLabel } from "./storeData";

/**
 * Thuật toán bày hàng của Hugo Store.
 *
 * Cửa hàng không chia tab. Mỗi mảng nội dung là một `StoreSection` tự trả lời
 * "lúc này tôi có đáng hiện không?" (`isVisible`) và "hiện thì trông thế nào?"
 * (`build`). `StoreFeed` gom lại, lọc, xếp theo `priority` rồi trả về danh sách
 * mô tả thuần dữ liệu cho lớp view vẽ.
 *
 * ── Thứ tự là một quyết định marketing, không phải ngẫu nhiên ──────────────
 *   0  Tìm kiếm      — có ý định rõ ràng thì nhường hết trang cho nó
 *  10  Tâm điểm      — thẻ video ngắn, gây chú ý
 *  20  Việc dở dang  — dùng thử sắp hết / thuê sắp hết: nhắc đúng lúc người ta
 *                      còn đang dùng, đây là chỗ đổi sang trả tiền tốt nhất
 *  30  Thang bậc     — neo giá: sở hữu đặt cạnh giá thuê 12 tháng
 *  40  Rail app      — mở rộng nhu cầu sang app khác
 *  50  Vật phẩm      — mua thêm nhỏ lẻ cho thứ đang dùng
 *  60  Tặng bạn bè   — vòng lan truyền, đồng thời là lý do tiêu JOY lớn nhất
 *  70  Đã mua        — bằng chứng sở hữu, giảm hối tiếc sau mua
 *  80  Số dư         — đóng trang bằng thông tin, không thúc thêm
 *
 * Mọi con số dùng để thuyết phục đều là số THẬT (giá server tính, ngày còn lại
 * thật, số dư thật). Không có khan hiếm giả, không có "N người đang xem",
 * không bịa đánh giá — thứ đó chỉ mua được một lần rồi mất niềm tin.
 */

const norm = (value) => String(value || "").toLowerCase();
const matches = (query, ...fields) => !query || fields.some(f => norm(f).includes(query));
const daysUntil = (value) => Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);

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

  /** Tra bậc giá + trạng thái của một app, null nếu app đó miễn phí. */
  planFor(appId) {
    return this.ctx.planIndex.get(appId) || null;
  }

  /** Gộp app tĩnh với bậc giá động thành một đơn vị để view dùng. */
  decorate(app) {
    const entry = this.planFor(app.id);
    return { app, ladder: entry || null, state: entry?.state || null };
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
    const apps = STORE_APPS
      .filter(a => matches(query, a.label, a.tagline))
      .map(a => this.decorate(a));
    const packs = products.filter(p => matches(query, p.name, p.description, perkLabel(p)));
    const found = apps.length + packs.length;

    return {
      kind: "search",
      title: found > 0 ? "Kết quả tìm kiếm" : "Không tìm thấy gì",
      subtitle: found > 0
        ? `${apps.length} ứng dụng · ${packs.length} vật phẩm`
        : "Thử một từ khoá khác xem sao.",
      apps,
      packs,
    };
  }
}

/**
 * Thẻ tâm điểm.
 *
 * Ưu tiên app CHƯA mở khoá — thẻ đẹp nhất trang nên dành cho thứ còn cửa để
 * thuyết phục. Không còn app nào khoá thì mới xoay vòng theo ngày.
 */
export class SpotlightSection extends StoreSection {
  constructor(ctx) {
    super("spotlight", 10, ctx);
  }

  isVisible() {
    return !this.ctx.query;
  }

  /** Xoay theo ngày để cùng một ngày ai cũng thấy cùng một app. */
  static rotate(list, today = new Date()) {
    if (!list.length) return null;
    const days = Math.floor(
      (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(2026, 0, 1)) / 86400000
    );
    return list[((days % list.length) + list.length) % list.length];
  }

  pick() {
    // Người dùng bấm "Xem gói" của app nào thì cả trang xoay về app đó — nếu
    // không, chỉ app tâm điểm của ngày mới có bảng bậc và những app còn lại
    // không có đường nào để mua.
    const focused = this.ctx.focus && appById(this.ctx.focus);
    if (focused) return focused;

    // Chỉ xét app ĐÃ CÓ bảng bậc. App trả phí mà bảng giá chưa tải về thì
    // không được lên tâm điểm: thẻ sẽ không có giá để hiện và hoá ra quảng cáo
    // một thứ trả phí như thể nó miễn phí.
    const priced = STORE_APPS.filter(a => this.planFor(a.id));
    const locked = priced.filter(a => !this.planFor(a.id).state?.unlocked);
    const pool = locked.length ? locked
      : priced.length ? priced
        : STORE_APPS.filter(a => !a.paid);
    return SpotlightSection.rotate(pool);
  }

  build() {
    const app = this.pick();
    if (!app) return null;
    return { kind: "spotlight", ...this.decorate(app) };
  }
}

/**
 * Việc dở dang: dùng thử hoặc thuê sắp hết hạn.
 *
 * Đây là section quan trọng nhất về mặt bán hàng — người đang dùng dở và sắp
 * mất quyền là người dễ quyết định nhất. Nhưng chỉ hiện khi hạn THẬT sắp hết,
 * không thúc người còn cả tháng.
 */
export class ExpiringSection extends StoreSection {
  constructor(ctx) {
    super("expiring", 20, ctx);
  }

  get soon() {
    return this.ctx.plans
      .filter(p => (p.state.tier === "trial" || p.state.tier === "rent") && p.state.expiresAt)
      .map(p => ({ plan: p, daysLeft: daysUntil(p.state.expiresAt) }))
      .filter(x => x.daysLeft <= (x.plan.state.tier === "trial" ? 7 : 5) && x.daysLeft >= 0)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }

  isVisible() {
    return !this.ctx.query && this.soon.length > 0;
  }

  build() {
    return { kind: "expiring", items: this.soon };
  }
}

/**
 * Thang bậc của app trọng tâm.
 *
 * Chỉ bày bảng bậc cho app đang ở tâm điểm — dội cả 5 bảng giá vào mặt người
 * đọc thì không ai đọc bảng nào.
 */
export class PlanLadderSection extends StoreSection {
  constructor(ctx) {
    super("ladder", 30, ctx);
  }

  get target() {
    const app = new SpotlightSection(this.ctx).pick();
    return app ? this.planFor(app.id) : null;
  }

  isVisible() {
    if (this.ctx.query || !this.target) return false;
    // Đã sở hữu thì bình thường không dội bảng giá nữa, trừ khi người dùng
    // chủ động bấm xem gói của chính app đó.
    return this.target.state.tier !== "own" || this.ctx.focus === this.target.appId;
  }

  build() {
    const entry = this.target;
    return {
      kind: "ladder",
      title: entry.state.tier === "own" ? `Gói ${entry.label}` : `Mở ${entry.label}`,
      subtitle: "Thử trước, thuê tháng, hoặc trả một lần rồi thôi",
      plan: entry,
      state: entry.state,
    };
  }
}

/** Rail app còn lại — bỏ cái đang ở tâm điểm cho khỏi trùng. */
export class AppRailSection extends StoreSection {
  constructor(ctx) {
    super("apps", 40, ctx);
  }

  isVisible() {
    return !this.ctx.query;
  }

  build() {
    const spotlight = new SpotlightSection(this.ctx).pick();
    return {
      kind: "appRail",
      title: "Ứng dụng trong hệ sinh thái",
      subtitle: "Phần lớn miễn phí, mở là dùng",
      apps: STORE_APPS.filter(a => a.id !== spotlight?.id).map(a => this.decorate(a)),
    };
  }
}

/** Một kệ cho mỗi loại vật phẩm; kệ rỗng thì tự biến mất. */
export class PackGroupSection extends StoreSection {
  constructor(ctx, group, order) {
    super(`group:${group.type}`, 50 + order, ctx);
    this.group = group;
  }

  get list() {
    return this.ctx.products.filter(p => (p.productType || "general") === this.group.type);
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

/** Tặng bạn bè — chỉ mời tặng những app người dùng KHÔNG cần mua thêm nữa. */
export class GiftSection extends StoreSection {
  constructor(ctx) {
    super("gift", 60, ctx);
  }

  get options() {
    return this.ctx.plans
      .filter(p => p.state.unlocked)
      .slice(0, 3)
      .map(p => ({ appId: p.appId, label: p.label, total: p.rent.total }));
  }

  isVisible() {
    return !this.ctx.query && this.options.length > 0;
  }

  build() {
    return {
      kind: "gift",
      title: "Rủ bạn dùng cùng",
      subtitle: "Tặng quyền dùng bằng JOY của bạn",
      options: this.options,
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
    };
  }
}

/** Số dư đóng trang. */
export class BalanceSection extends StoreSection {
  constructor(ctx) {
    super("balance", 80, ctx);
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
   * @param {Array}  ctx.products  vật phẩm đang bán
   * @param {Array}  ctx.plans     bảng bậc từ /api/store/plans (kèm .state)
   * @param {Array}  ctx.orders    đơn đã mua
   * @param {string} ctx.query     từ khoá tìm kiếm (đã trim + lowercase)
   * @param {number} ctx.balance   số dư JOY
   * @param {string} [ctx.focus]   appId người dùng đang muốn xem gói
   */
  constructor(ctx) {
    const base = { products: [], plans: [], orders: [], query: "", balance: 0, focus: null, ...ctx };
    this.ctx = {
      ...base,
      planIndex: new Map((base.plans || []).map(p => [p.appId, p])),
    };
    this.sections = StoreFeed.assemble(this.ctx);
  }

  static assemble(ctx) {
    return [
      new SearchResultsSection(ctx),
      new SpotlightSection(ctx),
      new ExpiringSection(ctx),
      new PlanLadderSection(ctx),
      new AppRailSection(ctx),
      ...PRODUCT_GROUPS.map((group, i) => new PackGroupSection(ctx, group, i)),
      new GiftSection(ctx),
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

  /** Bảng bậc của một app — shell dùng khi mở sheet tặng quà. */
  planOf(appId) {
    return this.ctx.planIndex.get(appId) || null;
  }
}

export { appById };
