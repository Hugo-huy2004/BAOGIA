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

import { creditMultiplierOf, isCreditLocked } from "./tierFinance.js";

/** Trọng số các cột, cộng lại đúng 100. Có bài kiểm canh tổng này. */
export const WEIGHTS = Object.freeze({ tenure: 35, income: 25, engagement: 15, balance: 15, history: 10 });

export const CREDIT = Object.freeze({
  /**
   * Điểm tối thiểu để được duyệt.
   *
   * Cố ý ĐỂ THẤP. Cổng `canApply` bên dưới (đủ 18 tuổi, tài khoản ≥14 ngày, đã
   * từng kiếm ≥1.000 JOY) mới là thứ chặn người mới vào đòi vay ngay. Đã qua
   * được cổng đó rồi thì việc duyệt nên dễ — một thành viên gắn bó lâu không
   * phải chứng minh gì thêm.
   */
  approveAt: 25,
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
 * Điểm theo đường cong LÊN NHANH RỒI CHẬM DẦN, dùng cho thâm niên.
 *
 * Tuyến tính thì ngày thứ 30 chỉ đáng 8% của một năm — nghĩa là một người đã
 * dùng hệ thống trọn một tháng vẫn bị chấm gần như người vừa đăng ký. Chênh
 * lệch đáng kể nằm ở khoảng đầu (14 ngày với 90 ngày là hai loại người khác
 * hẳn nhau), còn từ 300 lên 365 ngày thì gần như không nói thêm điều gì.
 */
const curve = (ratio, weight) => Math.round(Math.sqrt(clamp01(ratio)) * weight);

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
  lifetimeEarned = 0,
  activeDays = 0,
  appsUsed = 0,
  surveysAnswered = 0,
  loansRepaid = 0,
  loansDefaulted = 0,
} = {}) {
  const netDaily = Math.max(0, medianDailyIncome - medianDailySpend);

  // THÂM NIÊN — cột nặng nhất, và đó là chủ ý.
  //
  // Bản đầu đặt THU NHẬP nặng nhất (40 điểm) và gần như không chấm thâm niên.
  // Kết quả: một thành viên dùng hệ thống 220 ngày với 190.000 JOY trong ví bị
  // từ chối, vì hai tín hiệu "gắn bó" mà bản đó dựa vào (nhật ký mở app và câu
  // trả lời khảo sát) chỉ vừa ra đời — nên MỌI thành viên cũ đều bằng 0 ở đó.
  //
  // Thứ thật sự phân biệt "người dùng lâu năm" với "người mới vào đòi vay
  // ngay" là thời gian và tổng JOY đã từng kiếm được. Cả hai đều có sẵn trong
  // lịch sử và không thể giả mạo trong một ngày.
  const tenure = Math.round(
    curve(accountDays / 365, WEIGHTS.tenure / 2)
    + curve(lifetimeEarned / 50000, WEIGHTS.tenure / 2),
  );

  // THU NHẬP RÒNG — JOY vào trừ JOY ra. Vẫn quan trọng vì đó là nguồn trả, chỉ
  // không còn là thứ duy nhất: người đã tích được số dư lớn thì một tháng tiêu
  // nhiều hơn kiếm không làm họ mất khả năng hoàn trả.
  const income = points(netDaily / 300, WEIGHTS.income);

  // GẮN BÓ — ba tín hiệu nhỏ. `activeDays` nay đếm từ SỔ CÁI JOY (số ngày có
  // giao dịch), không từ nhật ký mở app: sổ cái có lịch sử từ đầu, nhật ký mở
  // app thì chỉ có từ ngày nó được thêm vào.
  const engagement = Math.round(
    points(activeDays / 60, WEIGHTS.engagement / 3)
    + points(appsUsed / 6, WEIGHTS.engagement / 3)
    + points(surveysAnswered / 6, WEIGHTS.engagement / 3),
  );

  // SỐ DƯ — mốc kịch trần đặt ở 20.000 chứ không phải 5.000: trong nền kinh tế
  // này số dư năm chữ số là bình thường, và một mốc quá thấp khiến cột này chỉ
  // là điểm cộng cố định cho mọi người, tức là không phân biệt được ai với ai.
  const balancePts = points(balance / 20000, WEIGHTS.balance);

  // LỊCH SỬ TRẢ — MỘT lần quỵt xoá sạch cột này và trừ thêm.
  const repaid = points(loansRepaid / 3, WEIGHTS.history);
  const history = loansDefaulted > 0 ? -Math.min(40, 20 * loansDefaulted) : repaid;

  const total = Math.max(0, Math.min(100, tenure + income + engagement + balancePts + history));

  return {
    total,
    netDaily,
    parts: {
      tenure: { points: tenure, of: WEIGHTS.tenure, accountDays, lifetimeEarned },
      income: { points: income, of: WEIGHTS.income, netDaily },
      engagement: { points: engagement, of: WEIGHTS.engagement, activeDays, appsUsed, surveysAnswered },
      balance: { points: balancePts, of: WEIGHTS.balance, balance },
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
export function limitFor(score, netDailyIncome, balance = 0, tier = 'eco') {
  if (!(score >= CREDIT.approveAt)) return 0;
  // Vị thành niên không vay — đây là luật, kiểm trước mọi phép tính.
  if (isCreditLocked(tier)) return 0;

  const span = (score - CREDIT.approveAt) / (100 - CREDIT.approveAt);
  const days = CREDIT.limitDaysFloor + (CREDIT.limitDaysCeil - CREDIT.limitDaysFloor) * clamp01(span);

  const fromIncome = Math.max(0, netDailyIncome) * days;
  const fromBalance = Math.max(0, balance) * CREDIT.balanceBoost;

  // HẠNG LÀ HỆ SỐ NHÂN, không phải trần: điểm hồ sơ quyết định con số gốc (khả
  // năng hoàn trả thật), hạng nhân lên (đặc quyền). Trần cứng áp SAU cùng, nếu
  // không thì hệ số ×3 của Star-VIP sẽ vượt qua cả giới hạn của hệ thống.
  const boosted = (fromIncome + fromBalance) * creditMultiplierOf(tier);
  const raw = Math.min(CREDIT.hardCap, boosted);
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
  const limit = defaulted ? 0 : limitFor(score.total, score.netDaily, input.balance || 0, input.tier);
  const approved = limit > 0;

  const reasons = [];
  if (isCreditLocked(input?.tier)) reasons.push('tierLocked');
  if (score.parts.history.loansDefaulted > 0) reasons.push('defaulted');
  if (score.netDaily <= 0) reasons.push('noNetIncome');
  if (score.parts.tenure.points < WEIGHTS.tenure / 3) reasons.push('tooNew');
  if (!approved && score.total < CREDIT.approveAt) reasons.push('lowScore');

  return { ...score, limit, approved, reasons };
}

export default { WEIGHTS, CREDIT, scoreOf, limitFor, canApply, assess };
