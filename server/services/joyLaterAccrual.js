import Bio from '../models/Bio.js';
import { accrueStep, RATES, CYCLE_DAYS } from '../../shared/joyLaterRates.js';

/**
 * Cộng lãi hằng ngày cho các khoản JOYlater đang chạy.
 *
 * ── LÃI SUẤT CHỐT LÚC MỞ ────────────────────────────────────────────────────
 * `joyLoan.weeklyRate` được ghi vào khoản vay lúc ký và KHÔNG đổi sau đó, dù
 * lãi của hệ thống tuần sau có lên hay xuống. Lãi thả nổi trên một khoản đang
 * chạy nghĩa là người vay không bao giờ biết mình sẽ phải trả bao nhiêu — và
 * chính cái "lãi trong hạn tại thời điểm chuyển quá hạn" mà luật nhắc tới cũng
 * chỉ có nghĩa khi nó là một con số cố định.
 *
 * ── THỨ TỰ CẤN TRỪ: LÃI TRƯỚC, GỐC SAU ──────────────────────────────────────
 * Mọi khoản hoàn đều cấn vào LÃI trước rồi mới tới GỐC. Đây là thông lệ, nhưng
 * quan trọng hơn: nó khiến lãi chậm trả (tầng 2) hầu như không bao giờ phát
 * sinh với người có trả đều — họ chỉ chạm tầng 2 khi khoản hoàn không đủ cả
 * phần lãi.
 */

const DAY = 86400000;
const dayOf = (ms) => Math.floor(ms / DAY);

/** Gốc còn lại và phần đã quá hạn, tại thời điểm `now`. */
export function splitPrincipal(loan, now = Date.now()) {
  const principal = Number(loan?.principal || 0);
  const paid = Number(loan?.principalPaid || 0);
  const remaining = Math.max(0, principal - paid);
  if (!remaining) return { inTerm: 0, overdue: 0, remaining: 0 };

  const due = Array.isArray(loan?.dueAt) ? loan.dueAt : [];
  if (!due.length) return { inTerm: remaining, overdue: 0, remaining };

  // Gốc của mỗi kỳ. Kỳ cuối gánh phần lẻ, giống lúc báo giá.
  const perCycle = Math.floor(principal / due.length);
  let covered = paid;
  let overdue = 0;

  for (let i = 0; i < due.length; i += 1) {
    const cyclePrincipal = i === due.length - 1
      ? principal - perCycle * (due.length - 1)
      : perCycle;
    const unpaid = Math.max(0, cyclePrincipal - Math.min(covered, cyclePrincipal));
    covered = Math.max(0, covered - cyclePrincipal);
    if (!unpaid) continue;
    const at = new Date(due[i]).getTime();
    // Chỉ kỳ ĐÃ tới hạn mà chưa trả mới là quá hạn. Các kỳ sau nó vẫn trong hạn
    // và phải chịu lãi trong hạn, không phải lãi phạt — chuyển cả dư nợ sang
    // lãi quá hạn chỉ vì một kỳ trễ là phạt cả phần chưa đến lượt.
    if (Number.isFinite(at) && at < now) overdue += unpaid;
  }

  return { inTerm: Math.max(0, remaining - overdue), overdue, remaining };
}

/**
 * Cộng lãi cho một khoản. Idempotent theo NGÀY: gọi mười lần trong một ngày
 * cũng chỉ cộng một lần, vì mốc `lastAccruedAt` đã nhảy sang ngày mới.
 */
export async function accrueOne(bio, now = Date.now()) {
  const loan = bio?.joyLoan;
  if (!loan || !(Number(loan.outstanding) > 0)) return null;

  const openedAt = loan.openedAt ? new Date(loan.openedAt).getTime() : now;
  const last = loan.lastAccruedAt ? new Date(loan.lastAccruedAt).getTime() : openedAt;
  const days = dayOf(now) - dayOf(last);
  if (days <= 0) return null;

  const { inTerm, overdue } = splitPrincipal(loan, now);
  const interestUnpaid = Math.max(0, Number(loan.interestAccrued || 0) - Number(loan.interestPaid || 0));

  const step = accrueStep({
    principalInTerm: inTerm,
    principalOverdue: overdue,
    interestUnpaid,
    days,
    weekly: Number(loan.weeklyRate) || RATES.weeklyBase,
  });

  // Luôn dời mốc, kể cả khi lãi bằng 0. Không dời thì một khoản nợ nhỏ hơn
  // `dustFloor` sẽ được tính đi tính lại mãi mãi mỗi lần cron chạy.
  const update = {
    $set: { 'joyLoan.lastAccruedAt': new Date(now) },
    ...(step.total > 0 ? {
      $inc: {
        'joyLoan.interestAccrued': step.total,
        'joyLoan.outstanding': step.total,
        'joyLoan.interestOverdue': step.overdue,
        'joyLoan.interestOnInterest': step.onInterest,
      },
    } : {}),
  };

  await Bio.updateOne({ _id: bio._id, 'joyLoan.outstanding': { $gt: 0 } }, update);
  return step.total > 0 ? { email: bio.email, ...step } : null;
}

/** Quét toàn bộ — chạy mỗi ngày một lần. */
export async function accrueAll(now = Date.now()) {
  const bios = await Bio.find({ 'joyLoan.outstanding': { $gt: 0 } }, 'email joyLoan').lean();
  const charged = [];
  for (const bio of bios) {
    try {
      const result = await accrueOne(bio, now);
      if (result) charged.push(result);
    } catch (err) {
      console.error(`[joylater/accrual] ${bio.email}:`, err.message);
    }
  }
  return { scanned: bios.length, charged, total: charged.reduce((s, c) => s + c.total, 0) };
}

/**
 * Cấn một khoản hoàn: LÃI trước, GỐC sau.
 * Thuần — trả về phần chia, việc ghi sổ để nơi gọi lo.
 */
export function allocate(amount, loan) {
  const pay = Math.max(0, Math.floor(amount));
  const interestDue = Math.max(0, Number(loan.interestAccrued || 0) - Number(loan.interestPaid || 0));
  const toInterest = Math.min(pay, interestDue);
  const toPrincipal = Math.min(pay - toInterest,
    Math.max(0, Number(loan.principal || 0) - Number(loan.principalPaid || 0)));
  return { toInterest, toPrincipal, applied: toInterest + toPrincipal };
}

export { CYCLE_DAYS };
export default { accrueOne, accrueAll, splitPrincipal, allocate };
