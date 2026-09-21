import Bio from '../models/Bio.js';
import JoyLedger from '../models/JoyLedger.js';
import UserProfile from '../models/UserProfile.js';
import SurveyResponse from '../models/SurveyResponse.js';
import JoyCreditProfile from '../models/JoyCreditProfile.js';
import { notifyMember } from '../utils/notifyMember.js';
import { weekKey } from './joyStabilityService.js';
import { assess, canApply, CREDIT } from '../../shared/joyCredit.js';
import { bioAge, isAdultAge } from '../utils/memberAge.js';
import { memberTier } from '../utils/memberTier.js';

/**
 * Xét hạn mức JOYlater.
 *
 * Phép chấm nằm ở `shared/joyCredit.js` (thuần, có bộ kiểm). Ở đây chỉ là phần
 * đi gom số liệu thật rồi ghi kết quả.
 *
 * ── MỘT LẦN NỘP, XÉT LẠI MỖI TUẦN ───────────────────────────────────────────
 * Thành viên bấm "đăng ký" đúng một lần. Từ đó hạn mức tự lên xuống theo hành
 * vi, xét vào 17:00 thứ Bảy hằng tuần. Bị từ chối KHÔNG phải nộp lại — tuần sau
 * hệ thống tự chấm lại; nếu không thì người mới sẽ bị kẹt vĩnh viễn ở màn
 * "chưa đủ điều kiện" mà không biết phải bấm gì.
 */

const DAY = 86400000;
const WINDOW_DAYS = 28;

/**
 * Gom mọi số liệu của một người. Một hàm chứ không rải khắp nơi: cả lúc nộp hồ
 * sơ, lúc xét lại hằng tuần và lúc hiện màn hình đều phải nhìn thấy CÙNG một
 * bộ số, nếu không thì hạn mức hiện trên màn khác hạn mức đã ghi.
 */
export async function gatherSignals(email) {
  const bio = await Bio.findOne({ $or: [{ email }, { contactEmail: email }] })
    .select('email joyBalance createdAt birthYear birthMonth birthDay starVip')
    .lean();
  if (!bio) throw new Error('BIO_NOT_FOUND');

  const since = new Date(Date.now() - WINDOW_DAYS * DAY);
  // Cửa sổ dài hơn cho "số ngày hoạt động": thu nhập nhìn 28 ngày gần nhất mới
  // phản ánh hiện tại, nhưng mức độ gắn bó thì phải nhìn xa hơn thế.
  const activeSince = new Date(Date.now() - 90 * DAY);

  const [flows, ledgerDays, profile, surveys, credit] = await Promise.all([
    JoyLedger.aggregate([
      { $match: { email: bio.email, createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          inflow: { $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] } },
          outflow: { $sum: { $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0] } },
        },
      },
    ]),
    JoyLedger.distinct('createdAt', { email: bio.email, createdAt: { $gte: activeSince } })
      .then((dates) => [...new Set(dates.map((d) => new Date(d).toISOString().slice(0, 10)))]),
    UserProfile.findOne({ email: bio.email }, 'appUse appUseAt').lean(),
    SurveyResponse.countDocuments({ email: bio.email }),
    JoyCreditProfile.findOne({ email: bio.email }).lean(),
  ]);

  // Trung vị chứ không trung bình: một ngày trúng quà lớn không được đẩy hạn
  // mức lên cao giả tạo, và một ngày nghỉ không được kéo nó xuống đáy.
  const median = (list) => {
    const sorted = list.filter(Number.isFinite).sort((a, b) => a - b);
    if (!sorted.length) return 0;
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  // Ngày KHÔNG có giao dịch vẫn là ngày thu nhập bằng 0 và phải được tính: chỉ
  // lấy trung vị của những ngày có hoạt động là chấm người chơi hai ngày một
  // tuần ngang với người chơi mỗi ngày.
  const byDay = new Map(flows.map((f) => [f._id, f]));
  const days = [];
  for (let i = 0; i < WINDOW_DAYS; i += 1) {
    const key = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
    days.push(byDay.get(key) || { inflow: 0, outflow: 0 });
  }

  const appUse = profile?.appUse instanceof Map
    ? Object.fromEntries(profile.appUse)
    : (profile?.appUse || {});

  // `activeDays` đếm từ SỔ CÁI JOY, không từ nhật ký mở app.
  //
  // Nhật ký mở app (`UserProfile.appUse`) chỉ mới tồn tại từ 20/09/2026, nên
  // nếu chấm theo nó thì MỌI thành viên cũ đều có 0 ngày hoạt động — một thành
  // viên dùng hệ thống 220 ngày bị chấm y như người vừa đăng ký. Sổ cái thì có
  // lịch sử từ đầu. Nhật ký mở app vẫn dùng cho `appsUsed` (số ứng dụng), và sẽ
  // tự đúng dần khi nó tích đủ dữ liệu.
  const activeDays = ledgerDays.length;

  return {
    email: bio.email,
    // Hạng quyết định HỆ SỐ nhân hạn mức (shared/tierFinance.js). Gom ở đây
    // cùng mọi tín hiệu khác để màn hình, kỳ xét thứ Bảy và lúc nộp hồ sơ đều
    // nhìn thấy đúng một bộ số.
    tier: memberTier(bio),
    isAdult: isAdultAge(bioAge(bio)),
    accountDays: bio.createdAt ? Math.floor((Date.now() - new Date(bio.createdAt)) / DAY) : 0,
    balance: Number(bio.joyBalance || 0),
    medianDailyIncome: median(days.map((d) => d.inflow)),
    medianDailySpend: median(days.map((d) => d.outflow)),
    activeDays,
    appsUsed: Object.keys(appUse).length,
    surveysAnswered: surveys,
    loansRepaid: credit?.loansRepaid || 0,
    loansDefaulted: credit?.loansDefaulted || 0,
    lifetimeEarned: await lifetimeEarned(bio.email),
  };
}

async function lifetimeEarned(email) {
  const [row] = await JoyLedger.aggregate([
    { $match: { email, amount: { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return row?.total || 0;
}

/** Hồ sơ hiện tại, tạo dòng trống nếu chưa có. Luôn trả về một đối tượng. */
export async function profileOf(email) {
  return (await JoyCreditProfile.findOne({ email }).lean())
    || { email, status: 'none', limit: 0, score: 0, reasons: [], history: [] };
}

/**
 * Thành viên nộp hồ sơ. Chỉ nộp được MỘT lần.
 *
 * Chấm ngay tại chỗ: bắt người ta chờ tới thứ Bảy mới biết kết quả lần đầu là
 * biến một thao tác một giây thành một tuần im lặng. Từ lần thứ hai trở đi mới
 * là lịch tuần.
 */
export async function apply(email) {
  const existing = await JoyCreditProfile.findOne({ email });
  if (existing && existing.status !== 'none') {
    const error = new Error('ALREADY_APPLIED');
    error.status = existing.status;
    throw error;
  }

  const signals = await gatherSignals(email);
  const gate = canApply(signals);
  if (!gate.ok) {
    const error = new Error('NOT_ELIGIBLE_TO_APPLY');
    error.reasons = gate.reasons;
    throw error;
  }

  return evaluate(email, { signals, force: true, notify: true });
}

/**
 * Chấm lại một người và ghi kết quả.
 *
 * @param {boolean} force  Bỏ qua khoá tuần (dùng cho lần nộp đầu).
 */
export async function evaluate(email, { signals = null, force = false, notify = false } = {}) {
  const key = weekKey(new Date());
  const data = signals || await gatherSignals(email);
  const result = assess(data);

  const current = await JoyCreditProfile.findOne({ email });
  if (!force && current?.lastEvaluatedKey === key) return current.toObject();

  // Đã quỵt nợ thì trạng thái là `barred`, không phải `rejected`: hai cái hiện
  // hai màn hình khác nhau, và `rejected` ngụ ý "tuần sau xét lại" — một lời
  // hứa sai với người đã bị chặn cứng.
  const status = data.loansDefaulted > 0 ? 'barred' : (result.approved ? 'approved' : 'rejected');

  const entry = {
    at: new Date(), score: result.total, limit: result.limit,
    netDaily: result.netDaily, reasons: result.reasons,
  };

  const saved = await JoyCreditProfile.findOneAndUpdate(
    { email },
    {
      $set: {
        status,
        score: result.total,
        limit: result.limit,
        netDaily: result.netDaily,
        reasons: result.reasons,
        decidedAt: new Date(),
        lastEvaluatedKey: key,
        lastEvaluatedAt: new Date(),
        ...(current?.appliedAt ? {} : { appliedAt: new Date() }),
      },
      // Giữ 12 kỳ gần nhất — đủ để thấy xu hướng một quý, không phình vô hạn.
      $push: { history: { $each: [entry], $slice: -12 } },
    },
    { new: true, upsert: true },
  );

  // Chỉ báo khi hạn mức THỰC SỰ đổi. Gửi một thông báo mỗi thứ Bảy để nói
  // "không có gì thay đổi" là cách nhanh nhất khiến người ta tắt thông báo.
  const changed = (current?.limit || 0) !== result.limit;
  if (notify || changed) {
    await notifyMember(email, {
      key: result.limit > 0 ? 'event.joyCreditLimit' : 'event.joyCreditDenied',
      params: { limit: result.limit, score: result.total },
      actionUrl: '/member/utilities/joy_wallet',
      push: changed,
      appId: 'joy_wallet',
    }).catch(() => { /* thông báo hỏng không được chặn việc xét */ });
  }

  return saved.toObject();
}

/**
 * Xét lại toàn bộ — 17:00 thứ Bảy hằng tuần.
 *
 * Chỉ xét người ĐÃ TỪNG NỘP. Chấm cả những người chưa quan tâm là tốn công cho
 * một con số không ai đọc, và còn gửi thông báo cho người chưa từng hỏi vay.
 */
export async function evaluateAll() {
  const profiles = await JoyCreditProfile.find(
    { status: { $in: ['approved', 'rejected'] } }, 'email',
  ).lean();

  const changed = [];
  for (const { email } of profiles) {
    try {
      const before = await JoyCreditProfile.findOne({ email }, 'limit').lean();
      const after = await evaluate(email);
      if (before?.limit !== after.limit) changed.push({ email, from: before?.limit || 0, to: after.limit });
    } catch (err) {
      // Một người lỗi không được làm hỏng cả kỳ xét.
      console.error(`[joycredit] ${email}:`, err.message);
    }
  }
  return { scanned: profiles.length, changed };
}

/**
 * ADMIN ÉP XÉT LẠI NGAY, không chờ 17:00 thứ Bảy.
 *
 * ── VÌ SAO CẦN NÚT NÀY ──────────────────────────────────────────────────────
 * Kỳ xét hằng tuần là nhịp bình thường, nhưng có những lúc chờ tới thứ Bảy là
 * vô lý: vừa sửa xong một lỗi làm chấm điểm sai, vừa đổi tham số bình ổn, hay
 * một thành viên khiếu nại đúng. Không có nút này thì cách duy nhất để xét lại
 * là sửa tay `lastEvaluatedKey` trong database — thao tác không ai dám làm lúc
 * nửa đêm và cũng không để lại dấu vết gì.
 *
 * Ép xét KHÔNG phải cấp hạn mức: nó chỉ chạy lại đúng phép chấm với số liệu
 * hiện tại. Hạn mức có thể lên, có thể xuống, có thể giữ nguyên — admin không
 * chọn kết quả, chỉ chọn thời điểm.
 */
export async function forceReview({ email = null, by = 'admin' } = {}) {
  const at = new Date();
  if (email) {
    const before = await JoyCreditProfile.findOne({ email }, 'limit').lean();
    const after = await evaluate(email, { force: true, notify: true });
    return {
      at, by, scanned: 1,
      changed: before?.limit === after.limit ? [] : [{ email, from: before?.limit || 0, to: after.limit }],
    };
  }

  // Xét lại TOÀN BỘ: gỡ khoá kỳ của mọi hồ sơ rồi chạy đúng đường của cron,
  // để hai đường không bao giờ lệch nhau về cách tính.
  await JoyCreditProfile.updateMany(
    { status: { $in: ['approved', 'rejected'] } },
    { $set: { lastEvaluatedKey: '' } },
  );
  const result = await evaluateAll();
  return { at, by, ...result };
}

/** Trả xong một lượt — cộng vào lịch sử trả. */
export const recordRepaid = (email) =>
  JoyCreditProfile.updateOne({ email }, { $inc: { loansRepaid: 1 } }, { upsert: true });

/** Bị ghi sổ đen — chặn cứng và xoá hạn mức ngay, không chờ thứ Bảy. */
export const recordDefault = (email) =>
  JoyCreditProfile.updateOne(
    { email },
    { $inc: { loansDefaulted: 1 }, $set: { status: 'barred', limit: 0 } },
    { upsert: true },
  );

export { CREDIT };
export default { apply, evaluate, evaluateAll, forceReview, profileOf, gatherSignals, recordRepaid, recordDefault };
