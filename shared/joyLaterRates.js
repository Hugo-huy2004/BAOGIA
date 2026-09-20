/**
 * JOYlater — BỘ MÁY LÃI BA TẦNG.
 * ============================================================================
 *
 * Bản cũ thu một khoản phí phẳng lúc mở (10–22% tuỳ số đợt) rồi thôi, cộng thêm
 * 25% một lần nếu trễ. Cách đó có hai chỗ hỏng: trả sớm cũng không rẻ hơn, và
 * trễ một ngày với trễ nửa năm mất đúng như nhau — tức là trễ càng lâu càng lợi.
 *
 * Bản này thu lãi THEO NGÀY trên số dư thật, dựng theo đúng cấu trúc ba tầng
 * của pháp luật cho vay dân sự Việt Nam (Bộ luật Dân sự 2015 điều 357 & 466,
 * Thông tư 39/2016/TT-NHNN):
 *
 *   1. LÃI TRONG HẠN      — trên dư nợ GỐC còn trong hạn.
 *   2. LÃI CHẬM TRẢ LÃI   — trên số LÃI đến hạn mà chưa trả.
 *                           TRẦN LUẬT: không quá 10%/năm.
 *   3. LÃI QUÁ HẠN        — trên dư nợ GỐC đã quá hạn.
 *                           TRẦN LUẬT: không quá 150% lãi trong hạn.
 *
 * Hai cái trần trên là TRẦN, không phải mục tiêu. Chúng được khai thành hằng số
 * riêng và có bài kiểm canh, vì đây chính là loại con số mà vài tháng sau ai đó
 * sẽ "chỉnh lên một chút" mà không nhớ vì sao nó ở đó.
 *
 * ── LÃI TRONG HẠN KHÔNG CỐ ĐỊNH ─────────────────────────────────────────────
 * Nó chạy theo sức khoẻ của chính đồng JOY: khi JOY phát ra nhiều hơn thu về
 * (tỷ lệ thu hồi thấp, JOY đang nở) thì lãi vay tăng, vừa hãm nhu cầu vay vừa
 * kéo JOY về kho. Khi JOY co lại thì lãi giảm. Cùng một con số `recoveryRate`
 * mà bot quản gia dùng để đề xuất hệ số phát hành hằng tuần.
 *
 * ── VÌ SAO CỘNG DỒN THEO BƯỚC, KHÔNG TÍNH LẠI TỪ ĐẦU ────────────────────────
 * Tính lại toàn bộ lãi từ ngày mở đòi hỏi biết CHÍNH XÁC ngày nào trả bao nhiêu.
 * Thay vào đó lãi được cộng dồn mỗi ngày một bước và lưu vào khoản vay, đúng
 * cách một sổ cái tín dụng thật vận hành.
 * ponytail: mỗi bước cộng một lần; cron chạy hằng ngày. Bỏ lỡ vài ngày thì
 * `daysSince` tự bù đủ, nhưng lãi trong quãng bỏ lỡ tính theo số dư HÔM NAY chứ
 * không theo số dư từng ngày trong quãng đó. Sai số chỉ xuất hiện khi có trả nợ
 * giữa quãng bỏ lỡ; muốn chính xác tuyệt đối thì phải ghi sổ từng lần trả kèm
 * ngày và tính lại theo đoạn.
 */

/** Số ngày một chu kỳ. Chu kỳ TUẦN — người dùng sống theo tuần, không theo tháng. */
export const CYCLE_DAYS = 7;

/** Các trần và biên. Sửa ở đây là sửa hợp đồng với người vay. */
export const RATES = Object.freeze({
  /** Lãi trong hạn, mỗi TUẦN. Ba mốc: sàn, mốc chuẩn, trần. */
  weeklyFloor: 0.01,
  weeklyBase: 0.02,
  weeklyCeil: 0.04,

  /**
   * TRẦN LUẬT — lãi quá hạn không quá 150% lãi trong hạn.
   * (Bộ luật Dân sự 2015 điều 466 khoản 5 điểm b.)
   */
  overdueMultiplier: 1.5,

  /**
   * TRẦN LUẬT — lãi chậm trả lãi không quá 10%/năm trên số lãi chậm trả.
   * (Bộ luật Dân sự 2015 điều 466 khoản 5 điểm a.)
   */
  lateInterestAnnual: 0.10,

  /** Số chu kỳ được chọn khi vay. */
  cycleOptions: Object.freeze([1, 2, 4, 8]),

  /** Phần trăm mỗi lần nhận JOY bị giữ lại để trả nợ. */
  garnishRate: 0.4,

  /** Dưới mức này thì không tính lãi — vài JOY lẻ không đáng để ghi sổ. */
  dustFloor: 1,
});

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

/**
 * Lãi trong hạn của tuần này, suy từ sức khoẻ đồng JOY.
 *
 * @param {number|null} recoveryRate  JOY tiêu lại / JOY phát ra trong tuần.
 *        `null` (chưa đủ dữ liệu) → dùng mốc chuẩn, KHÔNG đoán.
 *
 * Vùng cân bằng 60–110% giống hệt ngưỡng bot quản gia đang dùng để đề xuất hệ
 * số phát hành; ở trong vùng đó thì giữ mốc chuẩn. Ra ngoài mới nhích, và nhích
 * tuyến tính chứ không nhảy bậc — lãi nhảy bậc thì người vay hôm trước hôm sau
 * thấy hai con số rất khác nhau mà không hiểu vì sao.
 */
export function weeklyRate(recoveryRate) {
  if (!Number.isFinite(recoveryRate)) return RATES.weeklyBase;
  if (recoveryRate >= 0.6 && recoveryRate <= 1.1) return RATES.weeklyBase;

  if (recoveryRate < 0.6) {
    // JOY đang nở: lãi tăng dần tới trần khi tỷ lệ thu hồi về 0.
    const severity = clamp((0.6 - recoveryRate) / 0.6, 0, 1);
    return round4(RATES.weeklyBase + (RATES.weeklyCeil - RATES.weeklyBase) * severity);
  }
  // JOY đang co: lãi giảm dần về sàn khi tỷ lệ thu hồi đạt 2.0.
  const ease = clamp((recoveryRate - 1.1) / 0.9, 0, 1);
  return round4(RATES.weeklyBase - (RATES.weeklyBase - RATES.weeklyFloor) * ease);
}

const round4 = (n) => Math.round(n * 10000) / 10000;

/** Lãi trong hạn quy về MỖI NGÀY. */
export const dailyRate = (weekly) => weekly / CYCLE_DAYS;

/** Lãi quá hạn mỗi ngày — đã áp trần 150%. */
export const overdueDailyRate = (weekly) => dailyRate(weekly) * RATES.overdueMultiplier;

/** Lãi chậm trả lãi mỗi ngày — đã áp trần 10%/năm. */
export const lateInterestDailyRate = () => RATES.lateInterestAnnual / 365;

/**
 * Cộng lãi cho một quãng `days` ngày.
 *
 * Ba tầng tính TÁCH RỜI nhau và trên ba cơ sở khác nhau. Gộp chúng lại thành
 * một phép nhân là sai bản chất: lãi quá hạn tính trên GỐC quá hạn, còn lãi
 * chậm trả tính trên LÃI chưa trả — cộng hai cơ sở đó lại rồi nhân một lần là
 * tính lãi chồng lãi, đúng thứ mà trần luật sinh ra để chặn.
 *
 * @param {number} principalInTerm  Dư nợ gốc CÒN TRONG HẠN.
 * @param {number} principalOverdue Dư nợ gốc ĐÃ QUÁ HẠN.
 * @param {number} interestUnpaid   Lãi đã đến hạn mà chưa trả.
 * @param {number} days             Số ngày của quãng này.
 * @param {number} weekly           Lãi trong hạn mỗi tuần (xem weeklyRate).
 */
export function accrueStep({
  principalInTerm = 0, principalOverdue = 0, interestUnpaid = 0, days = 0, weekly = RATES.weeklyBase,
} = {}) {
  const span = Math.max(0, Math.floor(days));
  if (!span) return { inTerm: 0, overdue: 0, onInterest: 0, total: 0, days: 0 };

  const base = Math.max(0, principalInTerm);
  const late = Math.max(0, principalOverdue);
  const owed = Math.max(0, interestUnpaid);

  const inTerm = base >= RATES.dustFloor ? base * dailyRate(weekly) * span : 0;
  const overdue = late >= RATES.dustFloor ? late * overdueDailyRate(weekly) * span : 0;
  const onInterest = owed >= RATES.dustFloor ? owed * lateInterestDailyRate() * span : 0;

  // Làm tròn XUỐNG từng tầng rồi mới cộng: làm tròn tổng lên là thu của người
  // vay vài JOY họ không nợ, mỗi ngày một lần.
  const a = Math.floor(inTerm);
  const b = Math.floor(overdue);
  const c = Math.floor(onInterest);
  return { inTerm: a, overdue: b, onInterest: c, total: a + b + c, days: span };
}

/**
 * Lịch trả theo CHU KỲ TUẦN. Trả về mốc ngày của từng kỳ.
 *
 * Chốt lúc mở và không tính lại: xem chú thích ở dueSchedule bản cũ — tính lại
 * về sau có thể đẩy một kỳ từ "chưa tới hạn" thành "đã trễ".
 */
export function cycleSchedule(openedAt, cycles) {
  const count = clampCycles(cycles);
  const start = new Date(openedAt).getTime();
  return Array.from({ length: count }, (_, i) => (
    new Date(start + (i + 1) * CYCLE_DAYS * 86400000)
  ));
}

/** Số chu kỳ hợp lệ — mọi thứ khác quy về lựa chọn gần nhất. */
export function clampCycles(cycles) {
  const want = Math.round(Number(cycles) || 1);
  if (RATES.cycleOptions.includes(want)) return want;
  return RATES.cycleOptions.reduce((best, option) => (
    Math.abs(option - want) < Math.abs(best - want) ? option : best
  ), RATES.cycleOptions[0]);
}

/**
 * Báo giá TRƯỚC khi ký: trả xong đúng hạn thì tốn bao nhiêu.
 *
 * Đây là con số duy nhất người vay thật sự cần để quyết định, nên nó phải là
 * con số ĐÚNG NHẤT có thể chứ không phải con số đẹp nhất: tính đủ lãi của từng
 * tuần trên phần gốc còn lại sau mỗi kỳ trả.
 */
export function quote(principal, cycles, weekly = RATES.weeklyBase) {
  const base = Math.max(0, Math.round(principal));
  const count = clampCycles(cycles);
  if (!base) return { principal: 0, cycles: count, weekly, interest: 0, total: 0, perCycle: [], weeklyPayment: 0 };

  const principalPerCycle = Math.floor(base / count);
  const perCycle = [];
  let remaining = base;
  let interest = 0;

  for (let i = 0; i < count; i += 1) {
    const due = i === count - 1 ? remaining : principalPerCycle;
    // Lãi của kỳ này tính trên phần gốc CÒN LẠI ở đầu kỳ, không phải trên tổng
    // vay ban đầu — trả dần thì lãi phải giảm dần, nếu không thì chia nhiều kỳ
    // chỉ là một cách nói khác của "đắt hơn".
    const cycleInterest = Math.floor(remaining * weekly);
    interest += cycleInterest;
    perCycle.push({ cycle: i + 1, principal: due, interest: cycleInterest, total: due + cycleInterest });
    remaining -= due;
  }

  return {
    principal: base,
    cycles: count,
    weekly,
    interest,
    total: base + interest,
    perCycle,
    // Kỳ đầu là kỳ nặng nhất (gốc còn nguyên) — hiện đúng con số đó, đừng hiện
    // trung bình cho dễ nhìn.
    weeklyPayment: perCycle[0]?.total || 0,
  };
}

/** Trừ bao nhiêu từ một lần nhận JOY. Không bao giờ quá số còn nợ. */
export function garnish(incomeAmount, outstanding) {
  if (!(outstanding > 0) || !(incomeAmount > 0)) return 0;
  return Math.max(0, Math.min(Math.floor(incomeAmount * RATES.garnishRate), outstanding));
}

export default { RATES, CYCLE_DAYS, weeklyRate, accrueStep, quote, cycleSchedule, clampCycles, garnish };
