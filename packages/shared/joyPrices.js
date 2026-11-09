// Ba mốc giá duy nhất của vòng kinh tế tiện ích:
// hoạt động có ích → nhận JOY → đổi lấy quyền lợi nhìn thấy được.
export const JOY_SINK_PRICES = Object.freeze({
  feature: 200,
  utility: 500,
  timedUpgrade: 1000,
});

// ── Phí và trần giao dịch ──────────────────────────────────────────
// LỖI CŨ: server thu 10% (`EXCHANGE_TAX_RATE`) nhưng trang Store tính và hiện
// 9% (2%+5%+2%), nên người có đúng số dư bằng tổng hiện trên màn hình vẫn bị
// server từ chối "số dư không đủ". Giờ cả hai phía đọc cùng hằng số này.
export const EXCHANGE_TAX_RATE = 0.10;

/** Thuế giao dịch + tổng phải trả cho một mức giá. */
export const exchangeTotal = (priceJoy) => {
  const tax = Math.floor(priceJoy * EXCHANGE_TAX_RATE);
  return { priceJoy, tax, total: priceJoy + tax };
};

/** Trần chuyển JOY cho người khác mỗi ngày. */
export const TRANSFER_DAILY_CAP = 1000;

/**
 * Trần chuyển JOY mỗi THÁNG.
 *
 * Vì sao cần thêm dù đã có trần ngày: trần ngày một mình cho phép 1.000 × 30 =
 * 30.000 JOY/tháng từ MỘT tài khoản. Với vài tài khoản nuôi, đó là đường bơm JOY
 * dồn về một ví mà không vi phạm luật nào.
 *
 * Đặt 8.000 — khoảng 8 ngày chạm trần ngày, đủ rộng cho người tặng bạn bè thật
 * (số liệu 8 tuần đầu: tổng CHUYỂN TAY của toàn hệ thống chỉ 1.800 JOY), nhưng
 * chặn được kiểu gom tháng. Sửa con số này thì cả server lẫn màn xác nhận đổi
 * theo vì cùng đọc một chỗ.
 */
export const TRANSFER_MONTHLY_CAP = 8000;

/**
 * Phí sáng tạo khi gửi JOY cho người khác — CỘNG THÊM vào phần người gửi trả,
 * người nhận nhận đủ. Trước đây con số này viết tay ở cả joyRoutes.js và
 * ParticleConnectModal.jsx; lệch một chỗ là màn xác nhận nói một giá, ví trừ giá
 * khác.
 */
export const TRANSFER_FEE_RATE = 0.05;

// ── Cây nhiệm vụ mỗi ngày ──────────────────────────────────────────
// Làm xong TẤT CẢ nhiệm vụ trong ngày thì cây lớn hết và được thưởng thêm.
// Con số này nằm ở đây để tài liệu JOY, test và server đọc cùng một chỗ.
export const TREE_BONUS_JOY = 100;

/** Cây có mấy giai đoạn — dùng cho cả hình vẽ và tính tiến độ. */
export const TREE_STAGES = ["seed", "sprout", "sapling", "young", "mature", "ancient"];

/** Giai đoạn cây theo số nhiệm vụ đã nhận / tổng số nhiệm vụ. */
export function treeStage(claimed, total) {
  if (!total || claimed <= 0) return 0;
  const ratio = Math.min(1, claimed / total);
  return Math.min(TREE_STAGES.length - 1, Math.round(ratio * (TREE_STAGES.length - 1)));
}
