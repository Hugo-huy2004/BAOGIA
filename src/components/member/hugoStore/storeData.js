import i18n from "../../../i18n/config";
import { joyNumber, joyText } from "../../../lib/joyDisplay";

/**
 * Dữ liệu tĩnh của Hugo Store.
 *
 * Ở đây KHÔNG còn công thức tính tiền nào. Mọi giá, phí và tổng đều do server
 * trả về (`/api/joy/exchange-quote` cho hoá đơn, `/api/store/plans` cho bảng
 * bậc) — client nhân chia lại là kiểu bug hiện một số rồi trừ một số khác.
 *
 * Và không còn chữ tiếng Việt nào: mọi nhãn đọc qua `i18n.t` bằng GETTER, để
 * người dùng đổi ngôn ngữ giữa chừng thì lần đọc sau đã ra tiếng mới.
 */

/** Bảng gradient icon app — trùng khoá màu với MemberUtilitiesDashboard. */
export const GRADIENTS = {
  indigo: "from-indigo-500 to-indigo-600",
  rose: "from-rose-400 to-rose-600",
  cyan: "from-cyan-400 to-teal-500",
  blue: "from-blue-500 to-indigo-600",
  teal: "from-teal-400 to-emerald-500",
  orange: "from-amber-400 to-orange-500",
  purple: "from-violet-500 to-purple-600",
  slate: "from-slate-500 to-slate-700",
  pink: "from-pink-400 to-fuchsia-600",
};

/**
 * Hàng bày trong Chợ. `id` khớp `selectedUtility` của MemberUtilitiesTab (với
 * game thì khớp `arcade_<gameId>` của Thư viện) nên bấm là mở đúng thứ.
 *
 * `planId` = khoá bảng giá ở `server/utils/appPlanService.js`. App thì trùng
 * chính `id`; game thì trỏ tới gói mở khoá nó — Cờ Vua có gói riêng, còn ba
 * game kia mở bằng gói Trò Chơi, và 2048 miễn phí (khớp đúng điều kiện khoá
 * trong HugoArcadeTab). Không có `planId` = miễn phí và PHẢI giữ miễn phí:
 * biến đồ đang cho không thành đồ thu phí là quyết định sản phẩm, không phải
 * việc của lớp hiển thị.
 *
 * ponytail: danh sách id ở đây trùng ý với `APP_CATALOG` trong
 * MemberUtilitiesDashboard. Gộp lại khi nào có app thứ ba cần cùng danh mục —
 * lúc này gộp thì phải kéo theo cả icon/badge/hạng mục của Thư viện.
 *
 * `study` và `hugoso` cố tình KHÔNG có mặt: cả ba cùng tên "Học Tập" trong
 * danh mục dịch, và `ide` là cái duy nhất có thứ để bán.
 */
const RAW_APPS = [
  { id: "profile", color: "indigo" },
  { id: "bio", color: "purple" },
  { id: "ide", color: "blue" },
  { id: "psychology", color: "cyan" },
  { id: "radio", color: "teal" },
  { id: "handle", color: "indigo" },
  { id: "team", color: "teal" },
  { id: "arcade", color: "orange" },
  { id: "aura", color: "purple" },
  { id: "cinema", color: "purple" },
  { id: "invest", color: "teal" },
];

const RAW_GAMES = [
  { id: "arcade_chess", color: "slate", planId: "chess" },
  { id: "arcade_survivor", color: "indigo", planId: "arcade" },
  { id: "arcade_snake", color: "teal", planId: "arcade" },
  { id: "arcade_caro", color: "blue", planId: "arcade" },
  { id: "arcade_2048", color: "orange", planId: null },
];

/**
 * Tên và mô tả lấy từ danh mục dịch dùng chung (`utilities.catalog.*`, nguồn là
 * memberAppTranslations): mỗi ngôn ngữ gọi app theo tiếng của mình, và cửa hàng
 * không được gọi khác Trang chủ hay Thư viện.
 */
const decorate = ({ id, color, planId = null }, game) => ({
  id,
  color,
  game,
  planId: game ? planId : id,
  get label() { return i18n.t(`utilities.catalog.${id}.title`); },
  get tagline() { return i18n.t(`utilities.catalog.${id}.description`); },
});

export const STORE_APPS = RAW_APPS.map(app => decorate(app, false));
export const STORE_GAMES = RAW_GAMES.map(game => decorate(game, true));
export const STORE_ITEMS = [...STORE_APPS, ...STORE_GAMES];

const APP_INDEX = new Map(STORE_ITEMS.map(app => [app.id, app]));

export const appById = (id) => APP_INDEX.get(id) || null;

/**
 * Nút của một ô hàng làm gì khi bấm. Lưới và trang chi tiết cùng gọi hàm này
 * để hai chỗ không bao giờ nói khác nhau về cùng một app.
 *
 * Thứ tự xét là bắt buộc: chưa mở khoá thì mọi chuyện khác không có nghĩa —
 * tải một app mình không có quyền dùng chỉ tạo ra một icon chết.
 *
 * @returns {"installing"|"locked"|"install"|"open"}
 */
export function tileAction({ ladder, state, installed, installable, progress }) {
  if (progress !== undefined) return "installing";
  if (ladder && !state?.unlocked) return "locked";
  if (installable && !installed) return "install";
  return "open";
}

/** Tên cửa hàng — cùng một khoá với Trang chủ và Thư viện. */
export const storeName = () => i18n.t("utilities.catalog.store.title");

/** Số và ngày theo ngôn ngữ đang chọn, không đóng đinh vi-VN. */
// Giá trong chợ viết theo ĐƠN VỊ CỦA TÀI KHOẢN, giống hệt ví và mọi màn khác —
// `money` là số trần, `moneyUnit` là số kèm mã đơn vị.
export const money = (n) => joyNumber(n);
export const moneyUnit = (n) => joyText(n);

export const formatDate = (value) =>
  new Date(value).toLocaleDateString(i18n.language, {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

/**
 * Thời gian còn lại của một quyền dùng. Mốc 1 ngày đọc bằng chữ ("còn một
 * ngày") chứ không phải "còn 1 ngày" — và nhờ đó chuỗi số nhiều chỉ phải đúng
 * từ 2 trở lên, khỏi phải nuôi một dạng số ít cho cả chín ngôn ngữ.
 */
export const remainingLabel = (days) => (
  days <= 0 ? i18n.t("utilities.store.expiring.today")
    : days === 1 ? i18n.t("utilities.store.expiring.tomorrow")
      : i18n.t("utilities.store.expiring.days", { count: days })
);

/** Nhãn quyền lợi ngắn của một vật phẩm, hoặc null nếu không có. */
export function perkLabel(p) {
  if (!p) return null;
  if (p.productType === "radio_time" && p.radioMinutes > 0) {
    const hours = Math.floor(p.radioMinutes / 60);
    const days = Math.floor(hours / 24);
    return days > 0
      ? i18n.t("utilities.store.packs.perkListenDays", { count: days })
      : i18n.t("utilities.store.packs.perkListenHours", { count: hours });
  }
  if (p.productType === "system_validity" && p.extendDays > 0) {
    return i18n.t("utilities.store.packs.perkValidity", { count: p.extendDays });
  }
  if (p.productType === "psy_study_tokens" && p.tokenAmount > 0) {
    return i18n.t(
      p.tokenType === "call" ? "utilities.store.packs.perkCalls" : "utilities.store.packs.perkChats",
      { count: p.tokenAmount }
    );
  }
  return null;
}

/** Nhóm vật phẩm theo productType để dựng kệ hàng, mỗi nhóm một màu. */
const GROUP_TYPES = [
  ["radio_time", GRADIENTS.teal],
  ["psy_study_tokens", GRADIENTS.cyan],
  ["system_validity", GRADIENTS.orange],
  ["general", GRADIENTS.pink],
];

export const PRODUCT_GROUPS = GROUP_TYPES.map(([type, color]) => ({
  type,
  color,
  get title() { return i18n.t(`utilities.store.packs.${type}.title`); },
  get subtitle() { return i18n.t(`utilities.store.packs.${type}.subtitle`); },
}));

/** Khoá hoá đơn `item` cho từng thứ mua được — khớp EXCHANGE_ITEMS ở server. */
export const exchangeItemKey = {
  rent: (featureKey) => featureKey,
  own: (appId) => `own_${appId}`,
  pack: (productId) => `product_${productId}`,
};
