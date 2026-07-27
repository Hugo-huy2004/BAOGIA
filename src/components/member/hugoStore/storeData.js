/**
 * Dữ liệu tĩnh + helper dùng chung cho Hugo Store.
 *
 * Tách khỏi component để mấy chỗ (cửa hàng, sheet thanh toán, kho) khỏi phải
 * chép lại cùng một bảng gradient / cách đọc nhãn quyền lợi.
 */

export const TAX_RATE = 0.09;

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
 * Ứng dụng miễn phí trong hệ sinh thái. `id` khớp với `selectedUtility` của
 * MemberUtilitiesTab nên bấm là mở thẳng app.
 */
export const STORE_APPS = [
  { id: "bio", color: "purple", label: "HugoBio", tagline: "Trang cá nhân chia sẻ bằng một liên kết", group: "essentials" },
  { id: "ide", color: "blue", label: "HugoCoder", tagline: "Học lập trình theo lộ trình 100 bài", group: "learn" },
  { id: "team", color: "teal", label: "HugoTeam", tagline: "Không gian làm việc nhóm", group: "learn" },
  { id: "psychology", color: "cyan", label: "HugoPSY", tagline: "Đồng hành sức khoẻ tinh thần", group: "wellness" },
  { id: "hugoskin", color: "slate", label: "HugoSkin", tagline: "Phân tích làn da bằng camera", group: "wellness" },
  { id: "radio", color: "teal", label: "HugoRadio", tagline: "Sóng nhạc lofi để tập trung", group: "wellness" },
  { id: "aura", color: "purple", label: "HugoAura", tagline: "Phiên tập trung sâu có nhịp thở", group: "wellness" },
  { id: "arcade", color: "orange", label: "HugoArcade", tagline: "Bộ sưu tập game đổi JOY", group: "play" },
  { id: "deco", color: "pink", label: "Deco Studio", tagline: "Bày biện căn phòng của riêng bạn", group: "play" },
  { id: "map", color: "teal", label: "Discover", tagline: "Tìm quán xá quanh bạn", group: "essentials" },
  { id: "helpdesk", color: "indigo", label: "HugoHelp", tagline: "Gửi yêu cầu hỗ trợ, quét mã QR", group: "essentials" },
  { id: "handle", color: "rose", label: "HugoHandle", tagline: "Hộp tiện ích xử lý nhanh", group: "essentials" },
  { id: "joy_wallet", color: "orange", label: "Ví JOY", tagline: "Số dư, giao dịch và mã nhận JOY", group: "essentials" },
];

/** Nhãn quyền lợi ngắn của một sản phẩm token/gói, hoặc null nếu không có. */
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

/** Nhóm sản phẩm theo productType để dựng kệ hàng. */
export const PRODUCT_GROUPS = [
  { type: "radio_time", title: "Gói nghe nhạc", subtitle: "Thêm thời lượng cho HugoRadio", icon: "radio", color: "teal" },
  { type: "psy_study_tokens", title: "Lượt trò chuyện", subtitle: "Mở thêm phiên với HugoPSY", icon: "forum", color: "cyan" },
  { type: "system_validity", title: "Gia hạn hệ thống", subtitle: "Kéo dài ngày sử dụng tài khoản", icon: "verified", color: "indigo" },
  { type: "general", title: "Vật phẩm khác", subtitle: "Những thứ hay ho còn lại", icon: "redeem", color: "purple" },
];

export const money = (n) => Number(n || 0).toLocaleString("vi-VN");

/**
 * Tổng tiền hiển thị cho giỏ hàng.
 *
 * Công thức phải khớp từng chữ với server (`POST /api/store/cart/checkout`):
 * làm tròn xuống phí 9%, trừ giảm giá, sàn ở 1 JOY. Lệch một đồng ở đây là
 * người dùng bấm "Thanh toán X" rồi bị trừ Y — nên nó nằm một chỗ và có test.
 */
export function orderTotals(items = [], discount = 0) {
  const subtotal = items.reduce((sum, i) => sum + i.priceJoy * i.quantity, 0);
  const tax = Math.floor(subtotal * TAX_RATE);
  const capped = Math.min(discount || 0, subtotal);
  return {
    subtotal,
    tax,
    discount: capped,
    total: items.length ? Math.max(1, subtotal + tax - capped) : 0,
  };
}
