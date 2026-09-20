import crypto from 'node:crypto';
import Bio from '../models/Bio.js';
import JoyDefaultRecord from '../models/JoyDefaultRecord.js';
import { notifyMember } from '../utils/notifyMember.js';
import { securityHash, applyActorBlock } from './securityEnforcement.js';
import { sendTelegramAlert } from './telegramService.js';
import {
  stageFor, nextStage, stageRank, stageById, RESTRICTIONS, IGNORE_BELOW,
} from '../../shared/joyLaterPolicy.js';

/**
 * Thi hành chế tài nợ JOYlater.
 *
 * Bậc thang nằm ở `shared/joyLaterPolicy.js` (thuần, có bộ kiểm). Ở đây chỉ là
 * phần chạm vào thế giới thật: đọc nợ, gửi thông báo, khoá, dựng hồ sơ.
 *
 * ── MỘT NGUYÊN TẮC XUYÊN SUỐT ───────────────────────────────────────────────
 * KHÔNG BAO GIỜ tụt bậc âm thầm rồi lên lại. Bậc đã thông báo được ghi vào
 * `joyLoan.enforcedStage`, và mỗi ngày chỉ đi LÊN. Không có cái này thì một
 * khoản nợ nằm đúng ranh giới sẽ nhảy qua nhảy lại và người dùng nhận thông
 * báo "tài khoản bị hạn chế" rồi "đã gỡ" mỗi ngày một lần.
 */

const DAY = 86400000;

const caseId = () => `JL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${
  crypto.randomBytes(2).toString('hex').toUpperCase()}`;

/**
 * Số ngày quá hạn của đợt TRỄ NHẤT — tức đợt đã tới hạn từ lâu nhất mà tiền
 * hoàn được vẫn chưa phủ tới nó.
 *
 * Tính theo TỔNG ĐÃ HOÀN phủ được mấy đợt, chứ không theo từng đợt riêng: người
 * trả dư ở đợt một thì phần dư đó phải được tính cho đợt hai, nếu không hệ
 * thống sẽ báo họ trễ một đợt mà họ đã trả rồi.
 */
export function daysOverdueOf(loan, now = Date.now()) {
  const due = Array.isArray(loan?.dueAt) ? loan.dueAt : [];
  if (!due.length) return 0;

  const total = Number(loan.principal || 0) + Number(loan.fee || 0) + Number(loan.penalty || 0);
  const perStep = total / due.length;
  const paid = Number(loan.paid || 0);
  // Số đợt đã được phủ hoàn toàn bởi tiền đã hoàn.
  const covered = perStep > 0 ? Math.floor(paid / perStep) : 0;

  for (let i = covered; i < due.length; i += 1) {
    const at = new Date(due[i]).getTime();
    if (Number.isFinite(at) && at < now) {
      return Math.floor((now - at) / DAY);
    }
  }
  return 0;
}

/** Chân dung nợ của một người — dùng cho cả chế tài lẫn màn hình ví. */
export async function assessDebt(bio, now = Date.now()) {
  const loan = bio?.joyLoan || {};
  const outstanding = Number(loan.outstanding || 0);
  if (!(outstanding > 0)) {
    return { outstanding: 0, daysOverdue: 0, stage: stageById('ontime'), next: null, priorDefaults: 0 };
  }

  const priorDefaults = await JoyDefaultRecord.countDocuments({
    emailHash: securityHash('email', bio.email), confirmedAt: { $ne: null }, clearedAt: null,
  });
  const daysOverdue = daysOverdueOf(loan, now);
  return {
    outstanding,
    daysOverdue,
    priorDefaults,
    stage: stageFor({ daysOverdue, outstanding, priorDefaults }),
    next: nextStage({ daysOverdue, priorDefaults }),
  };
}

/**
 * Quyền này có bị chế tài nợ chặn không? Trả về `null` khi được phép, hoặc một
 * chuỗi lý do đã sẵn sàng hiện cho người dùng.
 *
 * Đọc bậc ĐÃ THI HÀNH (`enforcedStage`) chứ không tính lại tại chỗ: người dùng
 * chỉ được bị chặn bởi thứ họ đã được báo trước.
 */
export function debtRestriction(bio, restriction) {
  const loan = bio?.joyLoan;
  if (!loan || !(Number(loan.outstanding) > IGNORE_BELOW)) return null;
  const stage = stageById(loan.enforcedStage || 'ontime');
  if (!stage?.restrict.includes(restriction)) return null;

  const REASON = {
    [RESTRICTIONS.TRANSFER]: 'Tài khoản đang có khoản JOYlater quá hạn nên tạm thời không chuyển JOY được. Vui lòng hoàn tất khoản nợ để khôi phục.',
    [RESTRICTIONS.NEW_LOAN]: 'Tài khoản đang có khoản JOYlater quá hạn nên chưa thể mở khoản mới.',
    [RESTRICTIONS.SPEND]: 'Tài khoản đang bị đóng băng chi tiêu do khoản JOYlater quá hạn. JOY nhận được sẽ dùng để hoàn khoản nợ.',
  };
  return REASON[restriction] || 'Tài khoản đang bị hạn chế do khoản JOYlater quá hạn.';
}

/**
 * Người này có đang bị cấm vay vì hồ sơ cũ không? Tra theo SỐ ĐIỆN THOẠI trước,
 * nên tài khoản mới lập bằng email khác vẫn bị bắt.
 */
export async function blacklistCheck({ email, phone }) {
  const records = await JoyDefaultRecord.activeFor({
    phoneHash: phone ? securityHash('phone', phone) : '',
    emailHash: email ? securityHash('email', email) : '',
  });
  if (!records.length) return null;
  return {
    blocked: true,
    cases: records.map((r) => r.caseId),
    reason: 'Tài khoản thuộc diện đã vi phạm chính sách JOYlater. Vui lòng liên hệ quản trị để được xem xét.',
  };
}

/** Một người, một bước leo thang. Trả về bậc mới nếu có thay đổi. */
async function enforceOne(bio, now = Date.now()) {
  const loan = bio.joyLoan || {};
  const current = loan.enforcedStage || 'ontime';
  const assessed = await assessDebt(bio, now);
  const target = assessed.stage.id;

  // Chỉ đi LÊN. Tụt bậc chỉ xảy ra khi nợ đã trả xong, và lúc đó chính lệnh
  // ghi trong joyLaterService đưa `enforcedStage` về "ontime" luôn.
  if (stageRank(target) <= stageRank(current)) return null;

  await Bio.updateOne({ _id: bio._id }, {
    $set: { 'joyLoan.enforcedStage': target, 'joyLoan.enforcedAt': new Date(now) },
  });

  const stage = assessed.stage;
  await notifyMember(bio.email, {
    key: `event.joyLaterStage.${target}`,
    params: { days: assessed.daysOverdue, amount: assessed.outstanding },
    actionUrl: '/member/account',
    push: true,
    appId: 'joy_wallet',
  }).catch(() => { /* thông báo hỏng không được chặn chế tài */ });

  if (stage.lockDays > 0) {
    await applyActorBlock({
      email: bio.email,
      phone: bio.phone || '',
      caseId: caseId(),
      reasonCode: 'joylater_default',
      durationMs: stage.lockDays * DAY,
      // `escalate: false` — khoá vì nợ KHÔNG được cộng vào bộ đếm dẫn tới cấm
      // vĩnh viễn tự động của hệ an ninh. Nợ và xâm nhập là hai chuyện khác
      // nhau; gộp bộ đếm thì ba lần trễ hạn thành một lệnh cấm vĩnh viễn mà
      // không ai quyết định điều đó.
      escalate: false,
    }).catch((err) => console.error('[joylater] khoá tài khoản lỗi:', err.message));
  }

  if (stage.needsAdmin) await openReviewCase(bio, assessed);
  return target;
}

/** Dựng hồ sơ cấm vĩnh viễn và đẩy sang admin. KHÔNG tự thi hành. */
async function openReviewCase(bio, assessed) {
  const emailHash = securityHash('email', bio.email);
  const existing = await JoyDefaultRecord.findOne({ emailHash, clearedAt: null, confirmedAt: null });
  if (existing) return existing;

  const id = caseId();
  const record = await JoyDefaultRecord.create({
    caseId: id,
    emailHash,
    phoneHash: bio.phone ? securityHash('phone', bio.phone) : '',
    outstanding: assessed.outstanding,
    principal: Number(bio.joyLoan?.principal || 0),
    daysOverdue: assessed.daysOverdue,
    stage: 'review',
    note: bio.displayName || '',
  });

  const n = (v) => Number(v || 0).toLocaleString('vi-VN');
  await sendTelegramAlert([
    '<b>JOYlater · hồ sơ chờ duyệt</b>',
    '',
    `Người vay: ${bio.displayName || bio.email}`,
    `Còn nợ:    <b>${n(assessed.outstanding)}</b> JOY`,
    `Quá hạn:   <b>${assessed.daysOverdue}</b> ngày`,
    `Đã từng bị ghi sổ: ${assessed.priorDefaults} lần`,
    '',
    `Mã hồ sơ: <code>${id}</code>`,
    '',
    'Duyệt = CẤM VĨNH VIỄN theo email và số điện thoại, ghi sổ đen. Không gỡ lại được bằng thao tác thường.',
  ].join('\n'), 'HTML', {
    inline_keyboard: [[
      { text: '⛔ Duyệt cấm vĩnh viễn', callback_data: `jl:ban:${id}` },
      { text: '🕊 Bỏ qua', callback_data: `jl:skip:${id}` },
    ]],
  }).catch((err) => console.error('[joylater] không gửi được hồ sơ:', err.message));

  return record;
}

/**
 * Quét toàn bộ khoản nợ đang mở. Gọi mỗi ngày một lần.
 *
 * Chạy TUẦN TỰ chứ không Promise.all: mỗi bước có thể gửi Telegram và ghi khoá,
 * và một đợt quét dồn hàng chục lệnh cùng lúc sẽ bị Telegram chặn tần suất rồi
 * mất đúng những hồ sơ cần người đọc nhất.
 */
export async function enforceAll(now = Date.now()) {
  const bios = await Bio.find(
    { 'joyLoan.outstanding': { $gt: IGNORE_BELOW } },
    'email displayName phone joyLoan',
  ).lean();

  const changed = [];
  for (const bio of bios) {
    try {
      const stage = await enforceOne(bio, now);
      if (stage) changed.push({ email: bio.email, stage });
    } catch (err) {
      // Một người lỗi không được làm hỏng cả đợt quét.
      console.error(`[joylater] ${bio.email}:`, err.message);
    }
  }
  return { scanned: bios.length, changed };
}

/** Admin bấm nút trên Telegram. Trả `false` nếu không phải nút của màn này. */
export async function handleJoyLaterCallback({ data, by = 'admin' }) {
  if (!data.startsWith('jl:')) return false;
  const [, action, id] = data.split(':');
  const record = await JoyDefaultRecord.findOne({ caseId: id });
  if (!record) return { text: 'Không tìm thấy hồ sơ này.' };
  if (record.confirmedAt || record.clearedAt) return { text: 'Hồ sơ này đã được xử lý.' };

  if (action === 'skip') {
    record.clearedAt = new Date();
    record.clearedBy = by;
    record.clearedReason = 'admin bỏ qua';
    await record.save();
    return { text: `Đã bỏ qua hồ sơ ${id}. Không có lệnh cấm nào được ghi.` };
  }

  if (action !== 'ban') return false;

  record.confirmedAt = new Date();
  record.confirmedBy = by;
  await record.save();

  // Băm là một chiều (đó là chủ ý), nên không tra ngược ra email được. Thay vào
  // đó băm lại từng ứng viên rồi so — danh sách này chỉ gồm người đang ở bậc
  // `review`, tức vài người cùng lắm.
  //
  // `findOne` ở đây từng là một lỗi thật: nó lấy ĐẠI một hồ sơ đang chờ duyệt,
  // nên khi có hai người cùng bậc thì nút "duyệt cấm" có thể cấm nhầm người kia.
  const candidates = await Bio.find({ 'joyLoan.enforcedStage': 'review' }, 'email phone').lean();
  const match = candidates.find((b) => securityHash('email', b.email) === record.emailHash) || null;
  if (match) {
    // Ghi vào hồ sơ tín dụng ngay: `barred` khác `rejected` ở chỗ nó KHÔNG hứa
    // "thứ Bảy xét lại". Để nguyên `rejected` là nói dối người đã bị chặn cứng.
    const { recordDefault } = await import('./joyCreditService.js');
    await recordDefault(match.email).catch((err) => console.error('[joylater] ghi hồ sơ tín dụng:', err.message));

    await applyActorBlock({
      email: match.email,
      phone: match.phone || '',
      caseId: record.caseId,
      reasonCode: 'joylater_default_permanent',
      durationMs: 365 * 10 * DAY,
      escalate: true,
    });
  }

  return {
    text: `Đã ghi sổ đen vĩnh viễn hồ sơ ${id}.`
      + (match ? '' : ' Không khớp được tài khoản đang mở — lệnh cấm vẫn có hiệu lực khi người này quay lại.'),
  };
}

export default { assessDebt, debtRestriction, blacklistCheck, enforceAll, handleJoyLaterCallback };
