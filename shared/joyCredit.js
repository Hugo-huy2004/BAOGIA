/**
 * JOYlater — HỒ SƠ TÍN DỤNG VÀ HẠN MỨC.
 * ============================================================================
 *
 * Bản cũ cấp hạn mức bằng một phép nhân: "5 ngày thu nhập". Gọn, nhưng nó bỏ
 * qua đúng thứ quyết định người ta có trả được hay không — người kiếm 100 JOY
 * mỗi ngày mà tiêu hết 95 thì khả năng trả nợ là 5, không phải 100.
 *
 * Bản này chấm điểm trên bốn cột, đúng ba căn cứ đã đặt ra cộng một cột mà mọi
 * hệ tín dụng đều phải có:
 *
 *   THU NHẬP RÒNG (40)  JOY vào trừ JOY ra. Cột nặng nhất, vì nó là nguồn trả.
 *   SỐ DƯ (20)          JOY đang có. Không phải tài sản thế chấp, nhưng người
 *                       có sẵn số dư thì một tuần mất mùa không thành vỡ nợ.
 *   GẮN BÓ (25)         "Giao tiếp giữa thành viên và hệ thống": tuổi tài
 *                       khoản, số ngày thật sự dùng, số ứng dụng đã dùng, có
 *                       trả lời khảo sát không. Đây là thứ thay cho lịch sử tín
 *                       dụng ở một hệ chưa có ai vay lần nào.
 *   LỊCH SỬ TRẢ (15)    Đã vay và trả xong mấy lần, đã quỵt mấy lần.
 *
 * ── MỘT LẦN ĐĂNG KÝ, XÉT LẠI HẰNG TUẦN ──────────────────────────────────────
 * Thành viên nộp hồ sơ MỘT lần. Sau đó hạn mức tự xét lại mỗi 17:00 thứ Bảy —
 * dùng đều thì hạn mức lên, ngưng dùng thì hạn mức xuống, không phải nộp lại
 * gì. Xét vào cuối tuần để một tuần tròn đã khép lại mới đem ra chấm.
 *
 * ── ĐIỂM KHÔNG PHẢI THỨ ĐỂ KHOE ─────────────────────────────────────────────
 * Điểm hiện cho chính chủ xem kèm lý do từng cột, nhưng không có bảng xếp hạng
 * và không so với người khác. Biến điểm tín dụng thành thứ đua nhau là mời
 * người ta vay để lấy điểm.
 */

/** Trọng số các cột, cộng lại đúng 100. Có bài kiểm canh tổng này. */
export const WEIGHTS = Object.freeze({ income: 40, balance: 20, engagement: 25, history: 15 });

export const CREDIT = Object.freeze({
  /** Điểm tối thiểu để được duyệt. Dưới mức này là từ chối, kèm lý do. */
  approveAt: 45,
  /** Số ngày tài khoản tối thiểu mới được nộp hồ sơ. */
  minAccountDays: 14,
  /** Phải từng kiếm đủ ngần này JOY — chứng tỏ đường kiếm JOY dùng được. */
  minLifetimeEarned: 1000,
  /** Chỉ dành cho thành viên đủ 18 tuổi. */
  adultOnly: true,
  /** Hạn mức = bao nhiêu ngày thu nhập RÒNG, theo điểm (thấp nhất → cao nhất). */
  limitDaysFloor: 3,
  limitDaysCeil: 12,
  /** Số dư góp thêm được tối đa bằng ngần này phần số dư. */
  balanceBoost: 0.25,
  /** Trần cứng, kể cả người cày rất nhiều. */
  hardCap: 20000,
  /** Sàn: dưới mức này thì cấp 0 chứ không cấp một hạn mức vô dụng. */
  minUsefulLimit: 200,
  /** Làm tròn hạn mức xuống mốc này cho dễ đọc. */
  roundTo: 50,
});

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const points = (ratio, weight) => Math.round(clamp01(ratio) * weight);

/**
 * Chấm điểm một hồ sơ. Thuần, không chạm database.
 *
 * Trả về cả ĐIỂM TỪNG CỘT kèm lời giải thích, vì màn hình phải nói được "vì sao
 * hạn mức của tôi chỉ có ngần này". Một con số trần trụi không giúp ai cải
 * thiện được gì, và người không hiểu vì sao bị từ chối thì chỉ thấy bị xử ép.
 */
export function scoreOf({
  medianDailyIncome = 0,
  medianDailySpend = 0,
  balance = 0,
  accountDays = 0,
  activeDays = 0,
  appsUsed = 0,
  surveysAnswered = 0,
  loansRepaid = 0,
  loansDefaulted = 0,
} = {}) {
  const netDaily = Math.max(0, medianDailyIncome - medianDailySpend);

  // THU NHẬP RÒNG — 300 JOY/ngày ròng là kịch trần cột này.
  const income = points(netDaily / 300, WEIGHTS.income);

  // SỐ DƯ — 5.000 JOY là kịch trần.
  const balancePts = points(balance / 5000, WEIGHTS.balance);

  // GẮN BÓ — bốn tín hiệu nhỏ, mỗi cái một phần tư cột. Chia nhỏ như vậy để
  // không ai kịch trần cột này chỉ bằng một hành vi duy nhất lặp lại.
  const engagement = Math.round(
    points(accountDays / 180, WEIGHTS.engagement / 4)
    + points(activeDays / 60, WEIGHTS.engagement / 4)
    + points(appsUsed / 6, WEIGHTS.engagement / 4)
    + points(surveysAnswered / 6, WEIGHTS.engagement / 4),
  );

  // LỊCH SỬ TRẢ — trả xong 3 lượt là kịch trần. MỘT lần quỵt xoá sạch cột này
  // và trừ thêm: đó là tín hiệu mạnh nhất trong cả hồ sơ, mạnh hơn mọi thứ khác
  // cộng lại, nên nó phải kéo được điểm xuống dưới ngưỡng duyệt một mình.
  const repaid = points(loansRepaid / 3, WEIGHTS.history);
  const history = loansDefaulted > 0 ? -Math.min(40, 20 * loansDefaulted) : repaid;

  const total = Math.max(0, Math.min(100, income + balancePts + engagement + history));

  return {
    total,
    netDaily,
    parts: {
      income: { points: income, of: WEIGHTS.income, netDaily },
      balance: { points: balancePts, of: WEIGHTS.balance, balance },
      engagement: { points: engagement, of: WEIGHTS.engagement, accountDays, activeDays, appsUsed, surveysAnswered },
      history: { points: history, of: WEIGHTS.history, loansRepaid, loansDefaulted },
    },
  };
}

/**
 * Hạn mức từ điểm và thu nhập ròng.
 *
 * Neo vào THU NHẬP chứ không vào điểm: điểm quyết định được vay bao nhiêu NGÀY
 * thu nhập, còn con số tuyệt đối vẫn phải là thứ người đó trả nổi. Người điểm
 * cao mà không có thu nhập thì hạn mức vẫn thấp — và đó là đúng.
 */
export function limitFor(score, netDailyIncome, balance = 0) {
  if (!(score >= CREDIT.approveAt)) return 0;

  const span = (score - CREDIT.approveAt) / (100 - CREDIT.approveAt);
  const days = CREDIT.limitDaysFloor + (CREDIT.limitDaysCeil - CREDIT.limitDaysFloor) * clamp01(span);

  const fromIncome = Math.max(0, netDailyIncome) * days;
  const fromBalance = Math.max(0, balance) * CREDIT.balanceBoost;
  const raw = Math.min(CREDIT.hardCap, fromIncome + fromBalance);
  const rounded = Math.floor(raw / CREDIT.roundTo) * CREDIT.roundTo;

  return rounded >= CREDIT.minUsefulLimit ? rounded : 0;
}

/** Đủ điều kiện NỘP HỒ SƠ chưa — tách khỏi việc được duyệt hay không. */
export function canApply({ isAdult, accountDays, lifetimeEarned } = {}) {
  const reasons = [];
  if (CREDIT.adultOnly && !isAdult) reasons.push('adult');
  if (!(accountDays >= CREDIT.minAccountDays)) reasons.push('accountAge');
  if (!(lifetimeEarned >= CREDIT.minLifetimeEarned)) reasons.push('earned');
  return { ok: reasons.length === 0, reasons };
}

/**
 * Đánh giá đầy đủ: điểm, hạn mức, và lý do đọc được.
 *
 * `reasons` là thứ hiện lên màn hình. Mỗi mục nói đúng một việc người dùng có
 * thể LÀM, không phải một lời phán về họ.
 */
export function assess(input) {
  const score = scoreOf(input);

  // Đã từng quỵt là CHẶN CỨNG, không phải điểm trừ.
  //
  // Bản đầu chỉ trừ 20 điểm, và một người thu nhập tốt cộng số dư lớn vẫn rơi
  // đúng vào ngưỡng duyệt rồi được cấp hạn mức — tức là kiếm đủ nhiều thì mua
  // được quyền quỵt một lần. Một điểm trừ đủ lớn để luôn chặn thì cũng chính là
  // một cái chặn, chỉ khó đọc hơn; nên viết thẳng ra.
  const defaulted = Number(input?.loansDefaulted || 0) > 0;
  const limit = defaulted ? 0 : limitFor(score.total, score.netDaily, input.balance || 0);
  const approved = limit > 0;

  const reasons = [];
  if (score.parts.history.loansDefaulted > 0) reasons.push('defaulted');
  if (score.netDaily <= 0) reasons.push('noNetIncome');
  if (score.parts.engagement.points < WEIGHTS.engagement / 3) reasons.push('lowEngagement');
  if (!approved && score.total < CREDIT.approveAt) reasons.push('lowScore');

  return { ...score, limit, approved, reasons };
}

export default { WEIGHTS, CREDIT, scoreOf, limitFor, canApply, assess };
