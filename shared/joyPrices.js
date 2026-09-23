// Bảng giá JOY — MỘT nguồn duy nhất cho cả client và server.
//
// ── NEO GIÁ: THU NHẬP MỘT NGÀY ─────────────────────────────────────
// Người chơi kiếm được bao nhiêu JOY mỗi ngày (số lấy từ chính code, không đoán):
//   · Điểm danh:                150–450  (REWARD_TABLE — checkinService)
//   · HugoArcade:               ≤ 150    (ARCADE_DAILY_JOY_CAP)
//   · HugoAura tập trung 3 giờ: ≤ 150    (FOCUS_DAILY_JOY_CAP)
//   · Caro tiết kiệm 5 ván:     ≤ 50     (ECO_CARO_JOY × ECO_CARO_DAILY_GAMES)
//   · HugoPSY trị liệu 60 phút: ≤ 180    (COMPANION_JOY_CAP_SECONDS)
//   · 5 thử thách ngày:         ≤ 205    (DAILY_CHALLENGES)
// → Cày hết ~4 giờ: 1.185/ngày. Chơi thường ~20 phút: ~415/ngày.
//
// Hai nguồn cuối nằm trong HugoPSY — app chỉ mở cho người dùng tiếng Việt (xem
// `psychologyGate`). Người dùng ngôn ngữ khác chỉ kiếm tối đa 800/ngày, nên giá
// phải vừa với ngưỡng thấp hơn đó.
export const DAILY_CASUAL_JOY = 415;

// Gói sở hữu và combo vẫn suy từ giá tháng; ba bồn tiêu thường xuyên bên dưới
// dùng đúng ba mốc 200 / 500 / 1.000 để người dùng không phải học bảng giá.
export const OWN_EQUIV_MONTHS = 12;
export const OWN_DISCOUNT = 0.3;
export const BUNDLE_DISCOUNT = OWN_DISCOUNT;

const roundTo = (value, step) => Math.round(value / step) * step;

// Ba mốc giá duy nhất của vòng kinh tế tiện ích:
// hoạt động có ích → nhận JOY → đổi lấy quyền lợi nhìn thấy được.
export const JOY_SINK_PRICES = Object.freeze({
  feature: 200,
  utility: 500,
  timedUpgrade: 1000,
});

/** Giá Utility Store do loại quyền lợi quyết định, không do client/admin tự đặt. */
export const utilityProductPrice = (productType) => (
  productType === "system_validity"
    ? JOY_SINK_PRICES.timedUpgrade
    : JOY_SINK_PRICES.utility
);

/** Giá mua vĩnh viễn suy ra từ giá thuê tháng (R2). */
export const ownFromMonthly = (monthly) => Math.max(
  monthly,
  roundTo(monthly * OWN_EQUIV_MONTHS * (1 - OWN_DISCOUNT), 100),
);

/** Giá gói trọn bộ suy ra từ các phần (R3). */
export const bundleFromParts = (parts) => roundTo(
  parts.reduce((sum, part) => sum + part, 0) * (1 - BUNDLE_DISCOUNT), 50,
);

/** Bao nhiêu ngày chơi thường mới đủ mua — dùng cho test và trang giá. */
export const daysToAfford = (joy) => joy / DAILY_CASUAL_JOY;

// ── MỞ APP / TÍNH NĂNG: 200 JOY ────────────────────────────────────
// Một mốc duy nhất cho quyền truy cập tháng, không còn 13 mức giá lẻ.
export const FEATURE_PRICES = {
  hugoProfile: JOY_SINK_PRICES.feature,
  hugoAura: JOY_SINK_PRICES.feature,
  hugoRadio: JOY_SINK_PRICES.feature,
  hugoChess: JOY_SINK_PRICES.feature,
  hugoArcade: JOY_SINK_PRICES.feature,
  hugoCoderBasic: JOY_SINK_PRICES.feature,
  hugoCoder: JOY_SINK_PRICES.feature,
  hugoCoderExam: JOY_SINK_PRICES.feature,
  hugoCoderIntermediate: JOY_SINK_PRICES.feature,
  hugoCoderAdvanced: JOY_SINK_PRICES.feature,
  hugoCoderSecurity: JOY_SINK_PRICES.feature,
  hugoCoderOptimize: JOY_SINK_PRICES.feature,
  hugoCoderUltimate: JOY_SINK_PRICES.feature,
};

// ── MUA VĨNH VIỄN TỪNG CHẶNG HỌC (R2) ──────────────────────────────
// Giữ đúng khoảng giá tác giả đã đặt (1.500–4.000 ≈ 3,6–9,6 ngày chơi) nhưng
// TĂNG DẦN theo chặng. Bản cũ không tăng dần: chặng 1 và chặng 6 cùng 1.500,
// còn chặng 2/3/4 đều 2.600 — người học không thấy được mình đang lên bậc nào.
export const STUDY_STAGES = [
  { tier: "basic",        monthlyKey: "hugoCoderBasic",        lifetime: 1500 },
  { tier: "intermediate", monthlyKey: "hugoCoderIntermediate", lifetime: 2000 },
  { tier: "advanced",     monthlyKey: "hugoCoderAdvanced",     lifetime: 2500 },
  { tier: "security",     monthlyKey: "hugoCoderSecurity",     lifetime: 3000 },
  { tier: "project",      monthlyKey: "hugoCoderUltimate",     lifetime: 3500 },
  { tier: "devops",       monthlyKey: "hugoCoderUltimate",     lifetime: 4000 },
];

export const STUDY_LIFETIME = Object.fromEntries(
  STUDY_STAGES.map(({ tier, lifetime }) => [tier, lifetime]),
);

/** Trọn khoá 6 chặng (R3) — rẻ hơn mua lẻ đúng bằng BUNDLE_DISCOUNT. */
export const STUDY_ALL_STAGES_PRICE = bundleFromParts(STUDY_STAGES.map((s) => s.lifetime));

// ── HUGOSO: 4 công cụ + gói trọn bộ (R1 + R3) ──────────────────────
// Trước đây 320/450/520/390 — bốn con số lẻ không theo quy tắc nào, và gói trọn
// bộ 1.290 giảm 23% trong khi "mua vĩnh viễn" giảm 30%: hai mức ưu đãi khác nhau
// cho cùng một ý "mua nhiều rẻ hơn". Giờ mỗi công cụ = 1 ngày chơi.
export const HUGOSO_PRICES = {
  calendar: 400,
  docs:     400,
  sheets:   400,
  ai:       400,
};
export const HUGOSO_BUNDLE_PRICE = bundleFromParts(Object.values(HUGOSO_PRICES));

// ── Giao diện Bio (thuê) ───────────────────────────────────────────
// Món trang trí — nửa ngày chơi.
export const BIO_THEME_RENTAL_PRICE = 200;

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

/**
 * Ba dòng phí hiện trên màn xác nhận. Dòng cuối là PHẦN CÒN LẠI, nên ba dòng
 * luôn cộng đúng bằng thuế thật — bản cũ ghi cứng 2%+5%+2% = 9% trong khi server
 * thu 10%, người dùng cộng tay ba dòng ra số khác tổng.
 */
export const exchangeFeeBreakdown = (priceJoy) => {
  const { tax, total } = exchangeTotal(priceJoy);
  const fulfillment = Math.floor(priceJoy * 0.02);
  const support = Math.floor(priceJoy * 0.05);
  return { fulfillment, support, maintenance: tax - fulfillment - support, tax, total };
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

// ── Nguồn thu JOY mỗi ngày ─────────────────────────────────────────
// Dùng để dựng bảng biểu trong tài khoản. Con số phải khớp code chạy thật —
// có test đọc thẳng file server để đối chiếu, không cho phép lệch.
export const JOY_INCOME_SOURCES = [
  { id: "checkin",   min: 150, max: 450, vietnameseOnly: false, source: "checkinService.REWARD_TABLE" },
  { id: "arcade",    min: 0,   max: 150, vietnameseOnly: false, source: "arcadeRoutes.ARCADE_DAILY_JOY_CAP" },
  { id: "focus",     min: 0,   max: 150, vietnameseOnly: false, source: "joyRoutes.FOCUS_DAILY_JOY_CAP" },
  { id: "ecoCaro",   min: 0,   max: 50,  vietnameseOnly: false, source: "arcadeRoutes.ECO_CARO_JOY×5" },
  { id: "therapy",   min: 0,   max: 180, vietnameseOnly: true,  source: "companionRoutes.COMPANION_JOY_CAP_SECONDS" },
  { id: "challenge", min: 0,   max: 205, vietnameseOnly: true,  source: "companionRoutes.DAILY_CHALLENGES" },
];

export const dailyCeiling = (vietnamese = true) => JOY_INCOME_SOURCES
  .filter((s) => vietnamese || !s.vietnameseOnly)
  .reduce((sum, s) => sum + s.max, 0);

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
