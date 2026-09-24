// JOYlater phía server — đọc/ghi cơ sở dữ liệu. Mọi phép tính nằm ở
// `shared/joyLater.js` (thuần, có test); file này không tự tính con số nào.
import Bio from '../models/Bio.js';
import JoyLedger from '../models/JoyLedger.js';
import { awardJoy } from './joyService.js';
import { bioAge, isAdultAge } from './memberAge.js';
import {
  JOYLATER, median, expectedDays,
  clampInstallments, nextInstallment, installmentSchedule, dueSchedule, overdueSteps, stepDue, payoffDue,
} from '../../shared/joyLater.js';
import {
  RATES, weeklyRate, quote as quoteRates, cycleSchedule, clampCycles, garnish,
} from '../../shared/joyLaterRates.js';
import { allocate } from '../services/joyLaterAccrual.js';
import { profileOf } from '../services/joyCreditService.js';
import { canApply } from '../../shared/joyCredit.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Đang nợ hay không — dùng ở nhiều route để chặn chuyển JOY / thẻ quà. */
export const hasOpenLoan = (bio) => Number(bio?.joyLoan?.outstanding) > 0;

/**
 * Thu nhập mỗi ngày trong `incomeWindowDays` ngày gần nhất, tính TRUNG VỊ.
 * Chỉ đếm JOY ĐI VÀO (amount > 0) và bỏ hai nguồn của chính JOYlater ra, nếu
 * không thì khoản vay tự nó lại làm hạn mức lần sau phình lên.
 */
export async function dailyIncomeProfile(email) {
  const since = new Date(Date.now() - JOYLATER.incomeWindowDays * DAY_MS);
  const rows = await JoyLedger.aggregate([
    { $match: { email, amount: { $gt: 0 }, createdAt: { $gte: since }, source: { $nin: ['joylater_open'] } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+07:00' } }, total: { $sum: '$amount' } } },
  ]);
  const perDay = rows.map((row) => row.total);
  // Ngày không hoạt động cũng là ngày thu nhập 0 — không được bỏ qua, nếu không
  // người chỉ chơi 2 ngày trong 14 ngày lại được hạn mức như người chơi đều.
  while (perDay.length < JOYLATER.incomeWindowDays) perDay.push(0);
  return { perDay, medianDaily: Math.round(median(perDay)) };
}

async function lifetimeEarned(email) {
  const [row] = await JoyLedger.aggregate([
    { $match: { email, amount: { $gt: 0 }, source: { $ne: 'joylater_open' } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return row?.total || 0;
}

/**
 * Gom một lượt đang chạy thành các con số dùng chung.
 *
 * `paid` là nguồn sự thật cho lịch đợt, KHÔNG suy từ `total - outstanding`:
 * khoản trễ hạn làm outstanding tăng lên, phép trừ kia sẽ ra số đã hoàn nhỏ đi
 * và đẩy người dùng lùi lại một đợt mà họ đã hoàn xong.
 *
 * Lượt cũ mở trước khi có `paid`/`dueAt` thì suy tạm: chưa có khoản trễ nào nên
 * `total - outstanding` vẫn đúng, và không có ngày tới hạn thì coi như mở khoá.
 */
function readLoan(loan = {}) {
  const base = Number(loan.principal || 0) + Number(loan.fee || 0);
  const outstanding = Number(loan.outstanding) || 0;
  const installments = clampInstallments(loan.installments);
  const schedule = installmentSchedule(base, installments);
  const paid = loan.paid != null ? Number(loan.paid) : Math.max(0, base - outstanding);
  return {
    base,
    outstanding,
    installments,
    schedule,
    paid,
    penalty: Number(loan.penalty || 0),
    dueAt: (loan.dueAt || []).map((d) => new Date(d)),
    penalized: loan.penalized || [],
  };
}

/**
 * Cộng khoản trễ cho những đợt đã quá hạn. Chạy LƯỜI — mỗi lần đọc trạng thái
 * hoặc hoàn một đợt, không cần cron.
 *
 * Idempotent nhờ `penalized`: điều kiện lọc `$nin` khiến hai yêu cầu song song
 * chỉ có một cái ghi được, cái kia không khớp và không cộng gì.
 */
async function applyOverduePenalties(bioId, loan) {
  const state = readLoan(loan);
  if (state.outstanding <= 0 || state.installments < 2) return null;

  const late = overdueSteps(state);
  if (!late.length) return null;

  let updated = null;
  for (const step of late) {
    if (step.penalty <= 0) continue;
    updated = await Bio.findOneAndUpdate(
      { _id: bioId, 'joyLoan.penalized': { $nin: [step.index] }, 'joyLoan.outstanding': { $gt: 0 } },
      {
        $inc: { 'joyLoan.outstanding': step.penalty, 'joyLoan.penalty': step.penalty },
        $addToSet: { 'joyLoan.penalized': step.index },
      },
      { new: true },
    ) || updated;
  }
  return updated;
}

/** Trạng thái JOYlater của một thành viên: đủ điều kiện chưa, mức tối đa, lượt hiện tại. */
export async function joyLaterStatus(email) {
  let bio = await Bio.findOne({ $or: [{ email }, { contactEmail: email }] })
    .select('email joyLoan createdAt birthYear birthMonth birthDay joyBalance')
    .lean();
  if (!bio) throw new Error('BIO_NOT_FOUND');

  // Cộng khoản trễ ngay lúc đọc: không có cron nào chạy nền, nên đây là lúc
  // sớm nhất phát hiện được. Idempotent nên đọc bao nhiêu lần cũng chỉ cộng một.
  const penalised = await applyOverduePenalties(bio._id, bio.joyLoan);
  if (penalised) bio = { ...bio, joyLoan: penalised.joyLoan };

  const { medianDaily } = await dailyIncomeProfile(bio.email);
  const earned = await lifetimeEarned(bio.email);
  const accountDays = bio.createdAt ? Math.floor((Date.now() - new Date(bio.createdAt)) / DAY_MS) : 0;
  const loan = bio.joyLoan || {};
  const outstanding = Number(loan.outstanding) || 0;

  // Bậc chế tài đọc sổ đen nên phải await ở đây — describeLoan bên dưới giữ
  // nguyên tính thuần và chỉ nhận kết quả.
  const { assessDebt } = await import('../services/joyLaterEnforcement.js');
  const enforcement = outstanding > 0 ? await assessDebt(bio) : null;

  // Hạn mức KHÔNG còn tính tại chỗ bằng "5 ngày thu nhập". Nó là con số đã được
  // xét và ghi vào hồ sơ tín dụng (services/joyCreditService.js), xét lại 17:00
  // thứ Bảy hằng tuần. Tính tại chỗ nghĩa là hạn mức nhảy theo từng ngày kiếm
  // được nhiều hay ít — không ai dựa vào một con số như vậy mà lên kế hoạch.
  const credit = await profileOf(bio.email);
  const gate = canApply({ isAdult: isAdultAge(bioAge(bio)), accountDays, lifetimeEarned: earned });

  // Hạn mức THẬT = quyết định tay của admin (nếu có) đứng trên số máy chấm;
  // tạm dừng riêng người này hoặc sổ đen thì về 0. Đọc thẳng `credit.limit` ở
  // đây là bỏ qua toàn bộ quyền can thiệp của admin.
  const { effectiveLimit, lendingOpen } = await import('../services/joyCreditService.js');
  const effective = effectiveLimit(credit);
  const lending = await lendingOpen();

  const reasons = [];
  if (credit.status === 'none') reasons.push('notApplied');
  if (credit.status === 'pending') reasons.push('pending');
  if (credit.status === 'rejected') reasons.push(...(credit.reasons || ['lowScore']));
  if (credit.status === 'barred') reasons.push('barred');
  if (effective.source === 'suspended') reasons.push('suspended');
  if (!lending.open) reasons.push('lendingPaused');
  if (outstanding > 0) reasons.push('openLoan');

  return {
    eligible: credit.status === 'approved' && outstanding === 0
      && effective.limit > 0 && lending.open,
    reasons,
    limit: lending.open && credit.status === 'approved' ? effective.limit : 0,
    // Vì sao ra con số đó — để màn hình của khách nói được lý do, và để admin
    // soi lại quyết định của chính mình.
    limitSource: effective.source,
    limitNote: !lending.open ? lending.reason : effective.reason,

    // Hồ sơ tín dụng, hiện nguyên cho chính chủ xem: điểm bao nhiêu, vì sao,
    // lần xét kế tiếp khi nào. Một hạn mức không kèm lý do thì người bị từ chối
    // chỉ thấy mình bị xử ép, và không biết phải làm gì để khác đi.
    credit: {
      status: credit.status,
      score: credit.score || 0,
      limit: credit.limit || 0,
      netDaily: credit.netDaily || 0,
      reasons: credit.reasons || [],
      history: credit.history || [],
      loansRepaid: credit.loansRepaid || 0,
      loansDefaulted: credit.loansDefaulted || 0,
      canApply: gate.ok && credit.status === 'none',
      applyBlockedBy: gate.ok ? [] : gate.reasons,
      nextReviewAt: nextSaturdayReview(),
    },

    medianDaily,
    accountDays,
    lifetimeEarned: earned,
    garnishRate: RATES.garnishRate,
    weeklyRate: await currentWeeklyRate(),
    cycleOptions: RATES.cycleOptions,
    overdueMultiplier: RATES.overdueMultiplier,
    lateInterestAnnual: RATES.lateInterestAnnual,
    loan: outstanding > 0 ? describeLoan(bio.joyLoan, medianDaily, enforcement) : null,
  };
}

/**
 * 17:00 thứ Bảy gần nhất còn ở phía trước.
 *
 * Hiện mốc này trên màn hình là cách rẻ nhất để biến một quy tắc thành một lời
 * hứa kiểm chứng được: người bị từ chối biết CHÍNH XÁC khi nào được xét lại,
 * thay vì phải đoán hoặc bấm lại mỗi ngày.
 */
function nextSaturdayReview(now = new Date()) {
  const at = new Date(now);
  at.setHours(17, 0, 0, 0);
  const daysUntilSaturday = (6 - at.getDay() + 7) % 7;
  at.setDate(at.getDate() + daysUntilSaturday);
  if (at <= now) at.setDate(at.getDate() + 7);
  return at;
}

/**
 * Một lượt đang chạy, nhìn từ phía giao diện.
 *
 * `enforcement` truyền VÀO chứ không tự tra: hàm này thuần và đồng bộ, còn bậc
 * chế tài phải đọc sổ đen trong database. Kéo một lệnh await vào đây là biến
 * một hàm kiểm được bằng dữ liệu giả thành một hàm cần cả database.
 */
function describeLoan(loan, medianDaily, enforcement = null) {
  const state = readLoan(loan);
  const step = nextInstallment(state.schedule, state.paid);
  const dueAt = state.dueAt[step.index - 1] || null;
  // Chia đợt thì chỉ mở khoá đúng ngày. Hoàn một lần thì không khoá gì —
  // chặn người muốn xong sớm là điều không ai hiểu được.
  const locked = state.installments > 1 && !stepDue(state.dueAt, step.index - 1);
  // Thanh khoản (trả HẾT) mở sớm hơn — người muốn dứt nợ không phải chờ đúng
  // ngày đợt kế tiếp mới được đóng sổ.
  const payoffLocked = state.installments > 1 && !payoffDue(state.dueAt, step.index - 1);

  // Cả LỊCH đợt, không chỉ đợt kế tiếp: chọn chia 4 đợt mà màn hình chỉ hiện
  // một đợt thì người dùng không thấy được thứ mình vừa chọn. Số tiền từng đợt
  // do server chia (client không được tự chia tổng cho số đợt).
  let covered = 0;
  const steps = state.schedule.map((amount, i) => {
    const paidHere = Math.max(0, Math.min(amount, state.paid - covered));
    covered += amount;
    return {
      index: i + 1,
      amount,
      paid: paidHere,
      due: amount - paidHere,
      dueAt: state.dueAt[i] || null,
      late: state.penalized.includes(i),
    };
  });

  return {
    principal: loan.principal,
    fee: loan.fee,
    penalty: state.penalty,
    outstanding: state.outstanding,
    paid: state.paid,
    openedAt: loan.openedAt,
    itemLabel: loan.itemLabel,
    installments: state.installments,
    dueAt: state.dueAt,
    steps,
    lateCount: state.penalized.length,
    // Bậc chế tài đang ở và bậc kế tiếp. Trả kèm ở đây chứ không để client gọi
    // thêm một lần nữa: màn ví phải NÓI TRƯỚC "còn N ngày nữa mất quyền gì",
    // và một cảnh báo đến sau khi đã mất quyền thì không còn là cảnh báo.
    enforcement: enforcement && {
      stage: loan.enforcedStage || 'ontime',
      daysOverdue: enforcement.daysOverdue,
      restrict: enforcement.stage.restrict,
      next: enforcement.next
        ? { stage: enforcement.next.stage.id, inDays: enforcement.next.inDays }
        : null,
    },
    next: {
      ...step,
      // Đợt cuối gánh cả khoản trễ đang treo, nếu không thì hoàn hết các đợt
      // rồi mà vẫn còn dư nợ không thuộc đợt nào.
      due: Math.min(step.index === step.of ? state.outstanding : step.due, state.outstanding),
      dueAt,
      locked,
      payoffLocked,
    },
    remainingDays: expectedDays(state.outstanding, medianDaily),
  };
}

/**
 * Báo giá TRƯỚC khi người dùng đồng ý — số hiện trên màn xác nhận.
 *
 * Trả về bảng giá của TẤT CẢ các mức chia đợt trong một lần gọi, không phải chỉ
 * mức đang chọn: người dùng cần so "chia 4 đợt đắt hơn bao nhiêu" ngay trên màn,
 * và bắt client gọi bốn lần thì bốn con số về không cùng một thời điểm.
 */
/**
 * Lãi trong hạn của TUẦN NÀY, suy từ sức khoẻ đồng JOY.
 *
 * Đọc cùng `recoveryRate` mà bot quản gia dùng để đề xuất hệ số phát hành: JOY
 * phát ra nhiều hơn thu về thì lãi vay tăng, vừa hãm nhu cầu vay vừa kéo JOY về
 * kho. Hỏng thì về mốc chuẩn chứ KHÔNG chặn người ta vay — một lỗi thống kê
 * không đáng để đóng cả sản phẩm.
 */
export async function currentWeeklyRate() {
  try {
    const { weeklyMetrics } = await import('../services/joyStabilityService.js');
    const metrics = await weeklyMetrics(1);
    return weeklyRate(metrics.recoveryRate);
  } catch {
    return RATES.weeklyBase;
  }
}

/**
 * Báo giá TRƯỚC khi ký — trả về bảng của MỌI lựa chọn chu kỳ trong một lần gọi.
 *
 * Người vay cần so "trả trong 2 tuần đắt hơn 8 tuần bao nhiêu" ngay trên màn.
 * Bắt client gọi bốn lần thì bốn con số về không cùng một thời điểm, mà lãi thì
 * đổi theo tuần.
 */
export async function quoteLoan(email, principal, cycles = 1) {
  const status = await joyLaterStatus(email);
  const weekly = await currentWeeklyRate();
  const chosen = quoteRates(principal, cycles, weekly);

  const options = RATES.cycleOptions.map((count) => {
    const plan = quoteRates(principal, count, weekly);
    return {
      cycles: plan.cycles,
      weeks: plan.cycles,
      interest: plan.interest,
      total: plan.total,
      perCycle: plan.perCycle,
      weeklyPayment: plan.weeklyPayment,
    };
  });

  return {
    ...status,
    ...chosen,
    weeklyRate: weekly,
    options,
    withinLimit: chosen.principal > 0 && chosen.principal <= status.limit,
  };
}

/**
 * Mở khoản vay: cộng ĐÚNG số gốc vào ví (để người dùng trả tiền món kia như
 * bình thường) và ghi nợ gốc + phí. Không tự mua món hộ — như vậy mọi đường mua
 * hiện có (thuê tháng, mua vĩnh viễn, HugoSO…) dùng lại được không cần sửa.
 */
export async function openJoyLaterLoan(email, principal, { itemLabel = '', itemKey = '', cycles = 1, installments } = {}) {
  // Sổ đen tra TRƯỚC mọi thứ khác. Tra theo băm số điện thoại nên một tài khoản
  // mới lập bằng email khác vẫn bị bắt — đó là điểm của việc giữ hồ sơ ngoài Bio.
  const { blacklistCheck } = await import('../services/joyLaterEnforcement.js');
  const owner = await Bio.findOne({ $or: [{ email }, { contactEmail: email }] }, 'email phone').lean();
  const banned = await blacklistCheck({ email, phone: owner?.phone || '' });
  if (banned) {
    const error = new Error('JOYLATER_BLACKLISTED');
    error.reason = banned.reason;
    error.cases = banned.cases;
    throw error;
  }

  const chosenCycles = clampCycles(cycles ?? installments ?? 1);
  const quote = await quoteLoan(email, principal, chosenCycles);
  if (!quote.eligible) {
    const error = new Error('JOYLATER_NOT_ELIGIBLE');
    error.reasons = quote.reasons;
    throw error;
  }
  if (!quote.withinLimit) throw new Error('JOYLATER_OVER_LIMIT');

  const bio = await Bio.findOne({ $or: [{ email }, { contactEmail: email }] });
  if (!bio) throw new Error('BIO_NOT_FOUND');
  const openedAt = new Date();
  // Kiểm lại ngay trước khi ghi: hai yêu cầu song song không được mở hai khoản.
  const claimed = await Bio.findOneAndUpdate(
    { _id: bio._id, $or: [{ 'joyLoan.outstanding': 0 }, { 'joyLoan.outstanding': { $exists: false } }] },
    {
      $set: {
        'joyLoan.principal': quote.principal,
        // Dư nợ lúc mở là ĐÚNG SỐ GỐC. Lãi chưa tồn tại — nó sinh ra từng ngày
        // (services/joyLaterAccrual.js). Cộng sẵn cả lãi dự kiến vào đây là thu
        // trước của người trả sớm khoản lãi họ sẽ không bao giờ nợ.
        'joyLoan.outstanding': quote.principal,
        'joyLoan.fee': 0,
        'joyLoan.weeklyRate': quote.weeklyRate,
        'joyLoan.cycles': quote.cycles,
        'joyLoan.installments': quote.cycles,
        'joyLoan.principalPaid': 0,
        'joyLoan.interestAccrued': 0,
        'joyLoan.interestPaid': 0,
        'joyLoan.interestOverdue': 0,
        'joyLoan.interestOnInterest': 0,
        'joyLoan.lastAccruedAt': openedAt,
        'joyLoan.paid': 0,
        'joyLoan.penalty': 0,
        'joyLoan.penalized': [],
        'joyLoan.enforcedStage': 'ontime',
        // Chốt LÚC MỞ và không tính lại: mỗi kỳ cách nhau đúng một tuần.
        'joyLoan.dueAt': cycleSchedule(openedAt, quote.cycles),
        'joyLoan.openedAt': openedAt,
        'joyLoan.repaidAt': null,
        'joyLoan.itemLabel': itemLabel,
        'joyLoan.itemKey': itemKey,
      },
    },
    { new: true },
  );
  if (!claimed) throw new Error('JOYLATER_ALREADY_OPEN');

  try {
    await awardJoy(
      bio.email, quote.principal, 'joylater_open',
      `JOYlater: mở trước ${itemLabel || 'tính năng'} — gốc ${quote.principal} JOY, `
      + `${quote.cycles} kỳ tuần, lãi ${(quote.weeklyRate * 100).toFixed(2)}%/tuần `
      + `(dự kiến tổng ${quote.total} JOY nếu trả đúng hạn)`,
      { refId: itemKey, skipLoanGarnish: true },
    );
    // Ghi vào sổ tay SAU khi cộng ví thành công — nếu ghi trước rồi cộng ví
    // hỏng thì lịch sử có một lượt chưa từng xảy ra.
    await Bio.updateOne({ _id: bio._id }, {
      $push: {
        joyLoanHistory: {
          $each: [{
            principal: quote.principal,
            fee: quote.interest,
            total: quote.total,
            installments: quote.cycles,
            itemLabel,
            itemKey,
            openedAt: claimed.joyLoan.openedAt,
          }],
          $slice: -20,
        },
      },
    });
  } catch (error) {
    // Cộng ví thất bại thì phải xoá khoản nợ vừa ghi, không để nợ mà không nhận JOY.
    await Bio.updateOne({ _id: bio._id }, {
      $set: {
        'joyLoan.principal': 0,
        'joyLoan.fee': 0,
        'joyLoan.outstanding': 0,
        'joyLoan.installments': 1,
        'joyLoan.openedAt': null,
      },
    });
    throw error;
  }

  return joyLaterStatus(bio.email);
}

/**
 * Trừ nợ từ một lần NHẬN JOY. Gọi từ `awardJoy` — cửa duy nhất mọi biến động
 * JOY đi qua, nên không có đường nào nhận JOY mà lách được việc trả nợ.
 */
// Ba chỗ dưới đây đều đưa `outstanding` về 0, và cả ba đều phải gỡ
// `enforcedStage` trong CÙNG lệnh ghi đó. Tách ra một hàm gọi sau thì chỉ cần
// quên một nhánh là người đã trả xong vẫn bị chặn chuyển JOY cho tới lần quét
// cron hôm sau — một lỗi không ai báo, chỉ âm thầm làm mất lòng tin.
export async function repayFromIncome(bio, incomeAmount) {
  const outstanding = Number(bio?.joyLoan?.outstanding) || 0;
  const cut = garnish(incomeAmount, outstanding);
  if (cut <= 0) return null;
  const split = allocate(cut, bio.joyLoan || {});

  // Trừ nguyên tử theo đúng số còn nợ đang thấy: hai lần nhận JOY song song
  // không được cùng trừ một phần nợ hai lần.
  const updated = await Bio.findOneAndUpdate(
    { _id: bio._id, 'joyLoan.outstanding': outstanding },
    {
      // `paid` cộng song song với outstanding: lịch đợt soi `paid`, nên phần tự
      // giữ lại này chính là thứ làm người chơi đều tay không bao giờ bị trễ.
      // Cấn LÃI trước, GỐC sau. Tách hai con số ra là cách duy nhất để lãi
      // chậm-trả-lãi (tầng 2) không sinh ra với người trả đều: phần hoàn của họ
      // luôn phủ hết lãi đến hạn trước khi chạm vào gốc.
      $inc: {
        'joyLoan.outstanding': -cut,
        'joyLoan.paid': cut,
        'joyLoan.interestPaid': split.toInterest,
        'joyLoan.principalPaid': split.toPrincipal,
      },
      ...(outstanding - cut === 0 ? { $set: { 'joyLoan.repaidAt': new Date(), 'joyLoan.enforcedStage': 'ontime' } } : {}),
    },
    { new: true },
  );
  if (!updated) return null;   // có giao dịch khác vừa trừ — lần nhận sau sẽ trừ tiếp

  // Trả xong một lượt là tín hiệu MẠNH NHẤT của hồ sơ tín dụng — mạnh hơn mọi
  // thứ khác cộng lại. Ghi ngay tại đây chứ không đợi kỳ xét thứ Bảy: người vừa
  // hoàn xong mà tuần sau mới được cộng điểm thì không thấy việc mình làm có
  // tác dụng gì.
  if (Number(updated.joyLoan?.outstanding) === 0) {
    const { recordRepaid } = await import('../services/joyCreditService.js');
    await recordRepaid(updated.email).catch(() => { /* điểm hỏng không chặn việc hoàn nợ */ });
  }

  await awardJoy(
    updated.email, -cut, 'joylater_repay',
    `Hoàn JOYlater — còn ${updated.joyLoan.outstanding} JOY`,
    { refId: updated.joyLoan.itemKey || '', skipLoanGarnish: true, notify: false },
  );
  return { repaid: cut, outstanding: updated.joyLoan.outstanding };
}

/**
 * Lịch sử đầy đủ: mỗi lượt mở trước kèm phiếu chi tiết từng lần hoàn.
 *
 * Ghép hai nguồn thay vì lưu một bản thứ ba:
 *   • `Bio.joyLoanHistory` — phần KHÔNG suy được từ sổ cái: tách gốc/cộng thêm
 *     và số đợt đã chọn.
 *   • `JoyLedger` — từng dòng tiền thật, số chính xác, giờ chính xác.
 *
 * Không có trường "đã hoàn xong chưa" ở đâu cả: cộng các dòng hoàn của một lượt
 * lại là biết. Một cờ lưu riêng sẽ có ngày lệch với các dòng tiền, mà lúc đó
 * không ai biết bên nào đúng.
 *
 * Lượt mở trước TỪ TRƯỚC khi có sổ tay vẫn hiện, chỉ thiếu phần tách gốc/phí —
 * thà thiếu vài dòng còn hơn giấu cả lượt đi.
 */
export async function joyLaterHistory(email) {
  const bio = await Bio.findOne({ $or: [{ email }, { contactEmail: email }] })
    .select('email joyLoan joyLoanHistory')
    .lean();
  if (!bio) throw new Error('BIO_NOT_FOUND');

  const rows = await JoyLedger.find({
    email: bio.email,
    source: { $in: ['joylater_open', 'joylater_repay'] },
  }).sort({ createdAt: 1 }).lean();

  const notes = [...(bio.joyLoanHistory || [])];
  const takeNote = (openedAt) => {
    // Ghép theo thời điểm mở: sổ tay ghi ngay sau dòng sổ cái nên lệch dưới một
    // phút. Ghép theo thứ tự thôi thì một lượt cũ thiếu ghi chú sẽ đẩy lệch tất
    // cả những lượt sau.
    const index = notes.findIndex((n) => Math.abs(new Date(n.openedAt) - openedAt) < 60000);
    return index < 0 ? null : notes.splice(index, 1)[0];
  };

  const rounds = [];
  for (const row of rows) {
    if (row.source === 'joylater_open') {
      const note = takeNote(new Date(row.createdAt));
      rounds.push({
        openedAt: row.createdAt,
        principal: note?.principal ?? row.amount,
        fee: note?.fee ?? null,
        total: note?.total ?? null,
        installments: note?.installments ?? null,
        itemLabel: note?.itemLabel || '',
        payments: [],
      });
    } else if (rounds.length) {
      // Dòng hoàn luôn thuộc về lượt mở gần nhất trước nó.
      const round = rounds[rounds.length - 1];
      round.payments.push({
        at: row.createdAt,
        amount: Math.abs(row.amount),
        // ponytail: phân biệt "tự giữ lại" với "người dùng bấm hoàn" bằng chữ
        // trong mô tả — cả cách viết cũ ("Trả hết nợ") lẫn mới ("Hoàn hết")
        // đều bắt đúng. Chỉ dùng cho một cái NHÃN, không dùng để bóc số ra.
        // Muốn chắc chắn thì tách `joylater_repay` thành hai khoá nguồn riêng
        // trong utils/joySources.js — lúc nào nhãn này sai mới đáng làm.
        auto: !/đợt|hết|part|全部|전부|回目/i.test(row.description || ''),
        note: row.description || '',
      });
    }
  }

  const live = Number(bio.joyLoan?.outstanding) || 0;

  return rounds.reverse().map((round, index) => {
    const returned = round.payments.reduce((sum, p) => sum + p.amount, 0);
    // CHỈ lượt mới nhất mới có thể còn dở: mở lượt mới đòi hỏi không còn lượt
    // nào đang chạy (JOYLATER_ALREADY_OPEN chặn), nên mọi lượt cũ chắc chắn đã
    // xong. Suy từ đây thay vì từ `total` để lượt cũ thiếu sổ tay không bị hiện
    // nhầm thành "đang hoàn" mãi mãi.
    const remaining = index === 0 ? live : 0;
    const done = remaining === 0;
    return {
      ...round,
      // Lượt đã xong mà thiếu sổ tay thì tổng chính là những gì đã hoàn.
      total: round.total ?? (done ? returned : null),
      returned,
      remaining,
      done,
      closedAt: done ? round.payments[round.payments.length - 1]?.at || null : null,
    };
  });
}

/**
 * Trả ĐÚNG một đợt bằng JOY trong ví.
 *
 * Số tiền của đợt do server tính lại từ số còn nợ ngay lúc bấm, không nhận số
 * client gửi lên: giữa lúc mở màn và lúc bấm, thu nhập ngày có thể đã trả hộ
 * một phần đợt đó, và trừ theo con số cũ là trừ thừa.
 *
 * Trả thêm không bao giờ bị phạt — phí đã chốt lúc mở, trả sớm chỉ có lợi.
 */
export async function payInstallment(email) {
  const found = await Bio.findOne({ $or: [{ email }, { contactEmail: email }] });
  if (!found) throw new Error('BIO_NOT_FOUND');

  // Cộng khoản trễ TRƯỚC khi tính đợt: trễ rồi thì đợt này phải gồm cả phần đó,
  // không thể để người dùng hoàn đúng số cũ rồi phần trễ treo lại lửng lơ.
  const penalised = await applyOverduePenalties(found._id, found.joyLoan);
  const bio = penalised || found;

  const state = readLoan(bio.joyLoan);
  if (state.outstanding <= 0) throw new Error('JOYLATER_NO_LOAN');

  const step = nextInstallment(state.schedule, state.paid);
  // Chia đợt thì đúng ngày mới hoàn được. Hoàn một lần không bị khoá.
  if (state.installments > 1 && !stepDue(state.dueAt, step.index - 1)) {
    const error = new Error('JOYLATER_NOT_DUE');
    error.dueAt = state.dueAt[step.index - 1] || null;
    throw error;
  }

  const outstanding = state.outstanding;
  // Đợt cuối gánh cả khoản trễ đang treo, nếu không thì hoàn hết các đợt rồi mà
  // vẫn còn dư không thuộc đợt nào.
  const due = Math.min(step.index === step.of ? outstanding : step.due, outstanding);
  if (due <= 0) throw new Error('JOYLATER_NO_LOAN');
  if (bio.joyBalance < due) throw new Error('INSUFFICIENT_JOY');
  const dueSplit = allocate(due, bio.joyLoan || {});

  // Điều kiện `outstanding` trong bộ lọc là chốt chặn đua: hai lần bấm song song
  // thì chỉ một lần khớp, lần kia không trừ gì cả.
  const updated = await Bio.findOneAndUpdate(
    { _id: bio._id, 'joyLoan.outstanding': outstanding },
    {
      $inc: {
        'joyLoan.outstanding': -due, 'joyLoan.paid': due,
        'joyLoan.interestPaid': dueSplit.toInterest,
        'joyLoan.principalPaid': dueSplit.toPrincipal,
      },
      ...(outstanding - due === 0 ? { $set: { 'joyLoan.repaidAt': new Date(), 'joyLoan.enforcedStage': 'ontime' } } : {}),
    },
    { new: true },
  );
  if (!updated) throw new Error('JOYLATER_RACE');

  await awardJoy(
    bio.email, -due, 'joylater_repay',
    `Hoàn đợt ${step.index}/${step.of} JOYlater — còn ${updated.joyLoan.outstanding} JOY`,
    { refId: bio.joyLoan?.itemKey || '', skipLoanGarnish: true },
  );
  return joyLaterStatus(bio.email);
}

/** Trả hết ngay, không phí thêm. */
export async function payOffJoyLater(email) {
  const found = await Bio.findOne({ $or: [{ email }, { contactEmail: email }] });
  if (!found) throw new Error('BIO_NOT_FOUND');

  const penalised = await applyOverduePenalties(found._id, found.joyLoan);
  const bio = penalised || found;

  const state = readLoan(bio.joyLoan);
  const outstanding = state.outstanding;
  if (outstanding <= 0) throw new Error('JOYLATER_NO_LOAN');

  // Thanh khoản (trả HẾT nợ) mở SỚM HƠN từng đợt riêng — người muốn dứt điểm
  // khoản nợ không phải chờ đúng ngày đợt kế tiếp mới được đóng sổ. Đây là
  // CỬA THẬT: `payoffLocked` ở describeLoan() chỉ là hiển thị, việc chặn thi
  // hành nằm ở đây.
  const step = nextInstallment(state.schedule, state.paid);
  if (state.installments > 1 && !payoffDue(state.dueAt, step.index - 1)) {
    const error = new Error('JOYLATER_NOT_DUE');
    error.dueAt = state.dueAt[step.index - 1] || null;
    throw error;
  }
  if (bio.joyBalance < outstanding) throw new Error('INSUFFICIENT_JOY');

  const cleared = await Bio.findOneAndUpdate(
    { _id: bio._id, 'joyLoan.outstanding': outstanding },
    {
      // Trả hết: mọi thứ còn lại đóng về 0 cùng một lúc, không cần chia tầng —
      // chia tầng chỉ có nghĩa khi còn dư nợ để lãi bám vào.
      $set: {
        'joyLoan.outstanding': 0, 'joyLoan.repaidAt': new Date(), 'joyLoan.enforcedStage': 'ontime',
        'joyLoan.interestPaid': Number(bio.joyLoan?.interestAccrued || 0),
        'joyLoan.principalPaid': Number(bio.joyLoan?.principal || 0),
      },
      $inc: { 'joyLoan.paid': outstanding },
    },
    { new: true },
  );
  if (!cleared) throw new Error('JOYLATER_RACE');

  await awardJoy(
    bio.email, -outstanding, 'joylater_repay', 'Hoàn hết JOYlater',
    { refId: bio.joyLoan?.itemKey || '', skipLoanGarnish: true },
  );
  return joyLaterStatus(bio.email);
}

export { expectedDays, JOYLATER, RATES };
