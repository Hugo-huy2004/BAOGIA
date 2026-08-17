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

// ── BA LUẬT, ÁP CHO MỌI MÓN ────────────────────────────────────────
// R1. Thuê 1 tháng = quy ra "mấy ngày chơi thường".
// R2. Mua vĩnh viễn = thuê × 12 tháng × (1 − giảm giá). Đã có sẵn trong
//     `appPlanService.ownPriceJoy`; giờ CHẶNG HỌC cũng dùng đúng công thức này
//     thay vì bảng số viết tay.
// R3. Gói trọn bộ = tổng các phần × (1 − giảm giá) — cùng một hệ số với R2, để
//     "combo" và "mua vĩnh viễn" không phải hai mức ưu đãi khác nhau.
export const OWN_EQUIV_MONTHS = 12;
export const OWN_DISCOUNT = 0.3;
export const BUNDLE_DISCOUNT = OWN_DISCOUNT;

const roundTo = (value, step) => Math.round(value / step) * step;

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

// ── THUÊ 1 THÁNG (R1) ──────────────────────────────────────────────
// LỖI CŨ: thuê 1 tháng chặng 2/3 đúng bằng giá mua VĨNH VIỄN (2.600), còn chặng
// 5/6 thuê một tháng (5.000) còn ĐẮT HƠN mua vĩnh viễn (3.500/1.500) — thuê là
// lựa chọn không bao giờ hợp lý. Giờ thuê luôn = 1/8,4 giá mua (R2 đảo lại).
export const FEATURE_PRICES = {
  // Tiện ích, ~1 ngày chơi cho 1 tháng
  hugoProfile: 400,   // trước 120
  hugoAura:    400,   // trước 150
  hugoRadio:   400,   // trước 150

  // Giải trí
  hugoChess:   450,   // trước 299
  hugoArcade:  550,   // trước 199 — 5 game + xếp hạng. 600 thì giá mua vĩnh
                      // viễn vượt trần 12 ngày chơi (test canh), nên xuống 550.

  // Khoá Study — thang tăng dần, suy từ giá mua vĩnh viễn của từng chặng
  hugoCoderBasic:        200,  // MỚI: client vẫn gọi khoá này nhưng server chưa
                               // có nên chặng 1 luôn báo "Tính năng không hợp lệ"
  hugoCoder:             200,  // id cũ của chặng nền — giữ để gói đã mua không hỏng
  hugoCoderExam:         150,  // trước 100 — một bài kiểm tra, không phải cả chặng
  hugoCoderIntermediate: 250,  // trước 2600
  hugoCoderAdvanced:     300,  // trước 2600
  hugoCoderSecurity:     350,  // trước 1000
  hugoCoderOptimize:     400,  // trước 1500
  hugoCoderUltimate:     450,  // trước 5000
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
  gemini:   400,
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
