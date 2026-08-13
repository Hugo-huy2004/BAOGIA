import i18n from "../../../i18n/config";

/**
 * Dữ liệu tĩnh của Hugo Store.
 *
 * Ở đây KHÔNG còn công thức tính tiền nào. Mọi giá, phí và tổng đều do server
 * trả về (`/api/joy/exchange-quote` cho hoá đơn, `/api/store/plans` cho bảng
 * bậc) — client nhân chia lại là kiểu bug hiện một số rồi trừ một số khác.
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
 * Ứng dụng trong hệ sinh thái. `id` khớp `selectedUtility` của
 * MemberUtilitiesTab nên bấm là mở thẳng app.
 *
 * `paid: true` = có thang bậc Dùng thử/Thuê/Sở hữu (khớp APP_PLANS ở
 * server/utils/appPlanService.js). Những app còn lại đang miễn phí và PHẢI giữ
 * miễn phí — biến đồ đang cho không thành đồ thu phí là quyết định sản phẩm,
 * không phải việc của lớp hiển thị.
 */
const RAW_APPS = [
  { id: "hugoso", color: "purple", label: "Năng suất số & AI", tagline: "Bộ Calendar, Docs, Sheets và Gemini" },
  { id: "radio", color: "teal", label: "HugoRadio", tagline: "Sóng nhạc lofi để tập trung", paid: true },
  { id: "arcade", color: "orange", label: "HugoArcade", tagline: "Bộ sưu tập game đổi JOY", paid: true },
  { id: "aura", color: "purple", label: "HugoAura", tagline: "Phiên tập trung sâu có nhịp thở", paid: true },
  { id: "ide", color: "blue", label: "Phát triển Web", tagline: "Bộ 6 phần, 100 bài từ nền tảng đến DevOps", paid: true },
  { id: "bio", color: "purple", label: "HugoBio", tagline: "Trang cá nhân chia sẻ bằng một liên kết" },
  { id: "psychology", color: "cyan", label: "HugoPSY", tagline: "Đồng hành sức khoẻ tinh thần" },
  { id: "team", color: "teal", label: "HugoTeam", tagline: "Không gian làm việc nhóm" },
  { id: "handle", color: "indigo", label: "HugoKit", tagline: "QR, chữ ký email, link bảo mật và nén tệp" },
];

// Tên hiển thị lấy từ danh mục dịch dùng chung (memberAppTranslations): mỗi
// ngôn ngữ gọi app theo tiếng của mình, và cửa hàng không được gọi khác Home
// hay Thư viện. Nhãn trong RAW_APPS chỉ còn là phương án dự phòng khi thiếu
// bản dịch. Getter chứ không phải giá trị tính sẵn: người dùng đổi ngôn ngữ
// giữa chừng thì lần đọc sau đã ra tên mới.
export const STORE_APPS = RAW_APPS.map(app => ({
  ...app,
  get label() { return i18n.t(`utilities.catalog.${app.id}.title`, { defaultValue: app.label }); },
}));

const APP_INDEX = new Map(STORE_APPS.map(app => [app.id, app]));

export const appById = (id) => APP_INDEX.get(id) || null;

/** Nhãn quyền lợi ngắn của một vật phẩm, hoặc null nếu không có. */
export function perkLabel(p) {
  if (!p) return null;
  if (p.productType === "radio_time" && p.radioMinutes > 0) {
    const hours = Math.floor(p.radioMinutes / 60);
    const days = Math.floor(hours / 24);
    return days > 0 ? `+${days} ngày nghe` : `+${hours} giờ nghe`;
  }
  if (p.productType === "system_validity" && p.extendDays > 0) return `+${p.extendDays} ngày sử dụng`;
  if (p.productType === "psy_study_tokens" && p.tokenAmount > 0) {
    return `+${p.tokenAmount} lượt ${p.tokenType === "call" ? "gọi" : "trò chuyện"}`;
  }
  return null;
}

/** Nhóm vật phẩm theo productType để dựng kệ hàng. */
export const PRODUCT_GROUPS = [
  { type: "radio_time", title: "Thêm thời lượng nghe", subtitle: "Cộng phút cho HugoRadio", icon: "radio" },
  { type: "psy_study_tokens", title: "Thêm lượt trò chuyện", subtitle: "Mở thêm phiên với HugoPSY", icon: "forum" },
  { type: "system_validity", title: "Gia hạn hệ thống", subtitle: "Kéo dài ngày sử dụng tài khoản", icon: "verified" },
  { type: "general", title: "Vật phẩm khác", subtitle: "Những thứ hay ho còn lại", icon: "redeem" },
];

export const money = (n) => Number(n || 0).toLocaleString("vi-VN");

/** Khoá hoá đơn `item` cho từng thứ mua được — khớp EXCHANGE_ITEMS ở server. */
export const exchangeItemKey = {
  rent: (featureKey) => featureKey,
  own: (appId) => `own_${appId}`,
  pack: (productId) => `product_${productId}`,
};
