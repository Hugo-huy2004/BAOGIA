// JOYlater — mở khoá trước, trả bằng thu nhập ngày.
//
// Toàn bộ phép tính nằm ở đây, thuần và có test. Server chỉ lo đọc/ghi cơ sở dữ
// liệu, client chỉ lo hiển thị — cả hai đọc CÙNG bộ tham số này nên con số hiện
// trên màn xác nhận luôn đúng bằng con số server tính.
//
// ── VÌ SAO THIẾT KẾ NHƯ VẬY ────────────────────────────────────────
// Hạn mức không phải một con số cố định mà là "5 ngày thu nhập CỦA CHÍNH BẠN".
// Nhờ vậy thời gian trả nợ luôn ~12 ngày với mọi mức thu nhập: người cày nhiều
// vay được nhiều hơn nhưng cũng trả nhanh hơn, người chơi ít không bao giờ mắc
// một khoản nợ dài hơn hai tuần.
//
// KHÔNG có lãi kép. Phần cộng thêm chốt ngay lúc mở và không đổi theo thời
// gian; thứ duy nhất có thể phát sinh sau đó là khoản trễ hạn dưới đây, và nó
// cũng chỉ tính MỘT LẦN cho mỗi đợt.
//
// ── CHIA ĐỢT ───────────────────────────────────────────────────────
// Chia càng nhiều đợt thì cộng thêm càng nhiều: 1 đợt 10%, mỗi đợt thêm cộng 4
// điểm phần trăm (2 đợt 14%, 3 đợt 18%, 4 đợt 22%). Cố định theo số đợt đã
// chọn, người dùng thấy trọn con số trước khi bấm đồng ý.
//
// ── NGÀY TỚI HẠN VÀ KHOẢN TRỄ ──────────────────────────────────────
// Mỗi đợt có một ngày tới hạn, chia đều số ngày dự kiến hoàn xong (tính theo
// JOY người đó kiếm mỗi ngày) cho số đợt. Ngày được chốt LÚC MỞ và lưu lại:
// thu nhập sau này lên xuống cũng không được dời hạn của một lượt đang chạy.
//
// Quá hạn một đợt → cộng 25% của CHÍNH ĐỢT ĐÓ, đúng một lần, dù trễ bao lâu.
// Cố ý không cộng theo chu kỳ và không cộng trên phần còn lại: cộng lặp lại là
// lãi chồng lãi, và đó chính là thứ tạo ra vòng xoáy nợ.
//
// Phần tự giữ lại từ JOY kiếm được vẫn chạy và ĐƯỢC TÍNH vào đợt đang tới, nên
// người chơi đều tay gần như không bao giờ chạm tới khoản trễ.
import { EXCHANGE_TAX_RATE } from "./joyPrices.js";

export const JOYLATER = {
  /** Hạn mức = mấy ngày thu nhập. */
  limitDays: 5,
  /** Trần cứng, kể cả người cày rất nhiều. */
  hardCap: 6000,
  /** Phí dịch vụ khi trả một lần, tính MỘT LẦN trên số gốc. */
  feeRate: EXCHANGE_TAX_RATE,
  /** Số đợt tối đa được chia. */
  maxInstallments: 4,
  /** Mỗi đợt chia thêm cộng ngần này vào tỉ lệ phí. */
  installmentFeeStep: 0.04,
  /** Quá hạn một đợt: cộng ngần này của chính đợt đó, MỘT lần duy nhất. */
  latePenaltyRate: 0.25,
  /** Mỗi lần nhận JOY thì trừ bao nhiêu phần cho nợ. */
  garnishRate: 0.4,
  /** Số ngày ví phải có trước khi được vay. */
  minAccountDays: 14,
  /** Phải từng kiếm đủ ngần này JOY — chứng tỏ đường kiếm JOY dùng được. */
  minLifetimeEarned: 1000,
  /** Số ngày lịch sử dùng để tính thu nhập ngày. */
  incomeWindowDays: 14,
  /** Chỉ dành cho thành viên đủ 18 tuổi. */
  adultOnly: true,
};

/** Trung vị — chọn trung vị chứ không phải trung bình để một ngày trúng quà lớn
 *  không đẩy hạn mức lên cao giả tạo. */
export function median(numbers) {
  const sorted = [...numbers].filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Hạn mức vay, làm tròn xuống mốc 50 cho dễ đọc. */
export function creditLimit(medianDailyIncome) {
  const raw = Math.max(0, medianDailyIncome) * JOYLATER.limitDays;
  return Math.min(JOYLATER.hardCap, Math.floor(raw / 50) * 50);
}

/** Số đợt hợp lệ — mọi thứ khác quy về 1..maxInstallments. */
export function clampInstallments(count) {
  const value = Math.round(Number(count) || 1);
  return Math.min(JOYLATER.maxInstallments, Math.max(1, value));
}

/** Tỉ lệ phí theo số đợt: chia càng nhiều, phí càng cao. */
export function feeRateFor(installments = 1) {
  return JOYLATER.feeRate + (clampInstallments(installments) - 1) * JOYLATER.installmentFeeStep;
}

/**
 * Chia tổng thành từng đợt. Đợt CUỐI gánh phần lẻ, không phải đợt đầu: cộng cả
 * mảng lại phải đúng bằng tổng, và người dùng không bị đợt đầu tiên đắt hơn dự
 * kiến vì mấy đồng làm tròn.
 */
export function installmentSchedule(total, installments = 1) {
  const count = clampInstallments(installments);
  const amount = Math.max(0, Math.round(total));
  const each = Math.floor(amount / count);
  return Array.from({ length: count }, (_, i) => (
    i === count - 1 ? amount - each * (count - 1) : each
  ));
}

/** Gốc + phí một lần = tổng phải trả, kèm lịch chia đợt. */
export function loanTotal(principal, installments = 1) {
  const base = Math.max(0, Math.round(principal));
  const count = clampInstallments(installments);
  const feeRate = feeRateFor(count);
  const fee = Math.floor(base * feeRate);
  const total = base + fee;
  return {
    principal: base,
    fee,
    feeRate,
    total,
    installments: count,
    schedule: installmentSchedule(total, count),
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Ngày tới hạn của từng đợt: chia đều `totalDays` cho số đợt.
 *
 * Tính MỘT LẦN lúc mở rồi lưu lại. Tính lại về sau là dời hạn của một lượt
 * đang chạy mỗi khi thu nhập người dùng thay đổi — đúng kiểu luật đổi giữa
 * trận, và tệ hơn là nó có thể đẩy một đợt từ "chưa tới hạn" thành "đã trễ".
 */
export function dueSchedule(openedAt, totalDays, installments) {
  const count = clampInstallments(installments);
  const days = Math.max(count, Math.round(totalDays) || count);
  const start = new Date(openedAt).getTime();
  return Array.from({ length: count }, (_, i) => (
    new Date(start + Math.round((days * (i + 1)) / count) * DAY_MS)
  ));
}

/**
 * Đợt kế tiếp phải hoàn, suy từ số ĐÃ HOÀN chứ không lưu riêng một bộ đếm đợt.
 *
 * Phần tự giữ lại từ JOY kiếm được cũng cộng vào `paid`, nên một bộ đếm "đã
 * xong mấy đợt" sẽ lệch ngay lần giữ lại đầu tiên. Suy từ `paid` thì hai con số
 * không bao giờ mâu thuẫn.
 *
 * `due` = phần còn thiếu của đợt đang tới, đã trừ những gì tự giữ lại trả hộ.
 */
export function nextInstallment(schedule, paid) {
  const done = Math.max(0, Math.round(paid));
  let cumulative = 0;
  for (let i = 0; i < schedule.length; i += 1) {
    cumulative += schedule[i];
    if (cumulative > done) {
      return { index: i + 1, of: schedule.length, due: cumulative - done };
    }
  }
  return { index: schedule.length, of: schedule.length, due: 0 };
}

/**
 * Các đợt đã quá hạn mà chưa được phủ và chưa bị tính khoản trễ.
 *
 * Dừng ngay ở đợt đầu tiên CHƯA tới hạn: các đợt sau nó chắc chắn cũng chưa,
 * và duyệt tiếp chỉ tạo cơ hội tính nhầm.
 *
 * @param {number[]} penalized  chỉ số (0-based) các đợt đã tính khoản trễ rồi
 */
export function overdueSteps({ schedule, dueAt, paid, penalized = [], now = Date.now() }) {
  const done = Math.max(0, Math.round(paid));
  const late = [];
  let cumulative = 0;
  for (let i = 0; i < schedule.length; i += 1) {
    cumulative += schedule[i];
    if (done >= cumulative) continue;                       // đợt này đã đủ
    if (!dueAt[i] || new Date(dueAt[i]).getTime() > now) break;  // chưa tới hạn
    if (penalized.includes(i)) continue;                    // đã tính rồi
    late.push({
      index: i,
      amount: schedule[i],
      penalty: Math.floor(schedule[i] * JOYLATER.latePenaltyRate),
    });
  }
  return late;
}

/** Đợt thứ `index` (0-based) đã tới ngày hoàn chưa. */
export function stepDue(dueAt, index, now = Date.now()) {
  const at = dueAt?.[index];
  return Boolean(at) && new Date(at).getTime() <= now;
}

/** Số ngày dự kiến trả xong, để hiện TRƯỚC khi người dùng đồng ý. */
export function expectedDays(total, medianDailyIncome) {
  const perDay = Math.max(1, medianDailyIncome * JOYLATER.garnishRate);
  return Math.max(1, Math.ceil(total / perDay));
}

/**
 * Trừ bao nhiêu từ một lần nhận JOY. Không bao giờ trừ quá số còn nợ, và luôn
 * để lại phần lớn cho người chơi tiếp — trả nợ không được biến thành "chơi mà
 * không nhận được gì".
 */
export function repaymentFor(incomeAmount, outstanding) {
  if (!(outstanding > 0) || !(incomeAmount > 0)) return 0;
  const share = Math.floor(incomeAmount * JOYLATER.garnishRate);
  return Math.max(0, Math.min(share, outstanding));
}

/** Đủ điều kiện vay chưa — trả về lý do cụ thể để UI nói thẳng, không nói chung chung. */
export function eligibility({ isAdult, accountDays, lifetimeEarned, hasOpenLoan, medianDailyIncome }) {
  const reasons = [];
  if (JOYLATER.adultOnly && !isAdult) reasons.push("adult");
  if (!(accountDays >= JOYLATER.minAccountDays)) reasons.push("accountAge");
  if (!(lifetimeEarned >= JOYLATER.minLifetimeEarned)) reasons.push("earned");
  if (hasOpenLoan) reasons.push("openLoan");
  const limit = creditLimit(medianDailyIncome);
  if (limit <= 0) reasons.push("noIncome");
  return { eligible: reasons.length === 0, reasons, limit };
}
