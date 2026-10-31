/**
 * ĐẶC QUYỀN TÀI CHÍNH THEO HẠNG — NGUỒN SỰ THẬT DUY NHẤT.
 * ============================================================================
 *
 * ── VÌ SAO TỆP NÀY TỒN TẠI ──────────────────────────────────────────────────
 * Trước 20/09/2026, đặc quyền tài chính của từng hạng sống trong CHỮ: một mảng
 * chuỗi HTML ở `TierPrivilegesSection.jsx` và một bảng ở `memberDocs.js`. Không
 * dòng nào trong hai nơi đó được mã nguồn đọc — `memberTier()` chỉ được dùng để
 * phát quà sinh nhật. Kết quả là mười lời hứa sai cùng một lúc:
 *
 *   · "Star-VIP miễn phí 0% mọi phí chuyển JOY"  → thực tế vẫn thu 5%
 *   · "Star-14 chuyển tối đa 500 JOY/ngày"       → thực tế 1.000 như mọi người
 *   · "Quy chế ví: tối đa 5.000 JOY/ngày"        → thực tế 1.000
 *   · "Hạn mức vay 1.000 / 5.000 / 500 JOY"      → hạng không hề được đọc
 *   · "Eco cần chuỗi điểm danh 30 ngày"          → chưa từng được cài
 *
 * Không có gì sai ở người viết chữ và cũng không có gì sai ở người viết mã: cái
 * sai là CÓ HAI NGUỒN mà không có gì so chúng với nhau. Giờ chỉ còn một: mọi
 * con số nằm ở đây, chữ trên màn hình SINH RA từ đây, và `check:tier-finance`
 * chặn mọi con số viết tay quay lại.
 *
 * ── HẠNG LÀ HỆ SỐ NHÂN, KHÔNG PHẢI TRẦN ─────────────────────────────────────
 * Hạn mức gốc do điểm hồ sơ quyết định (khả năng hoàn trả thật), hạng nhân lên
 * (đặc quyền). Chọn hệ số thay vì trần để hệ xét lại hằng tuần vẫn còn ý nghĩa:
 * với một cái trần 1.000, gần như mọi thành viên Star-18 chạm trần ngay và
 * không còn lý do gì để dùng đều hay trả đúng hạn.
 */

export const TIER_FINANCE = Object.freeze({
  star14: Object.freeze({
    /** Vị thành niên KHÔNG được vay. Đây là luật, không phải mức đặc quyền. */
    creditMultiplier: 0,
    creditLocked: true,
    transferFeeRate: 0.05,
    /** Hạn mức chuyển thấp hơn — đúng tinh thần "bảo vệ vị thành niên". */
    dailyTransferCap: 500,
  }),
  eco: Object.freeze({
    creditMultiplier: 1,
    creditLocked: false,
    transferFeeRate: 0.05,
    dailyTransferCap: 1000,
  }),
  star18: Object.freeze({
    creditMultiplier: 1.5,
    creditLocked: false,
    transferFeeRate: 0.05,
    dailyTransferCap: 1000,
  }),
  starVip: Object.freeze({
    creditMultiplier: 3,
    creditLocked: false,
    /** Danh dự: miễn toàn bộ phí chuyển. */
    transferFeeRate: 0,
    dailyTransferCap: 1000,
  }),
});

/** Hạng lạ hoặc thiếu → về Eco. KHÔNG bao giờ về hạng có đặc quyền cao hơn. */
export const financeOf = (tier) => TIER_FINANCE[tier] || TIER_FINANCE.eco;

export const creditMultiplierOf = (tier) => financeOf(tier).creditMultiplier;
export const transferFeeRateOf = (tier) => financeOf(tier).transferFeeRate;
export const dailyTransferCapOf = (tier) => financeOf(tier).dailyTransferCap;
export const isCreditLocked = (tier) => financeOf(tier).creditLocked;

/**
 * Câu mô tả đặc quyền tài chính của một hạng — SINH RA từ các số ở trên.
 *
 * Trả về các mảnh rời chứ không một chuỗi hoàn chỉnh: bản dịch của mỗi ngôn ngữ
 * ghép chúng theo ngữ pháp của mình. Ghép sẵn ở đây là ép mọi ngôn ngữ dùng trật
 * tự câu tiếng Việt.
 */
export function financeFacts(tier) {
  const f = financeOf(tier);
  return {
    creditLocked: f.creditLocked,
    creditMultiplier: f.creditMultiplier,
    feePercent: Math.round(f.transferFeeRate * 100),
    feeFree: f.transferFeeRate === 0,
    dailyCap: f.dailyTransferCap,
  };
}

export default { TIER_FINANCE, financeOf, financeFacts };
