import JoyLedger from '../models/JoyLedger.js';
import Bio from '../models/Bio.js';
import JoyPolicy from '../models/JoyPolicy.js';
import { report as surveyReport } from './surveyService.js';
import {
  JOY_INVESTMENT_SOURCES,
  JOY_SOURCES,
  JOY_TRANSFER_SOURCES,
  reconcileJoyTransfers,
} from '../utils/joySources.js';
import { sendTelegramAlert, editTelegramMessage } from './telegramService.js';

/**
 * Bình ổn JOY — đo, đề xuất, và áp quyết định của admin.
 *
 * Nguyên tắc: dịch vụ này CHỈ ĐỀ XUẤT, không bao giờ tự đổi hệ số. Người bấm
 * nút là admin. Lý do không để nó tự chạy: số liệu một tuần có thể lệch vì một
 * sự kiện đơn lẻ (một đợt tặng quà, một người chơi cày cả tuần), và một vòng
 * lặp tự siết dựa trên nhiễu sẽ bóp phần thưởng của mọi người vì hành vi của một
 * người.
 *
 * ── VÌ SAO ĐO "THU / PHÁT" CHỨ KHÔNG ĐO TỔNG LƯU HÀNH ───────────────────────
 * Tổng lưu hành tăng là chuyện bình thường khi có thêm người dùng mới. Thứ cho
 * biết nền kinh tế có cân hay không là TỶ LỆ giữa lượng JOY tiêu đi và lượng
 * phát ra trong cùng kỳ. Dưới 100% nghĩa là mỗi tuần JOY nở thêm; kéo dài thì
 * phần thưởng mất dần ý nghĩa vì ai cũng thừa JOY.
 */

/** Nguồn KHÔNG tính là phát hành: chuyển tay và điều chỉnh của admin. */
export const NON_ISSUANCE_SOURCES = new Set([
  ...JOY_TRANSFER_SOURCES,
  ...JOY_INVESTMENT_SOURCES,
  'admin_adjustment', 'admin_direct_add', 'admin_telegram_button',
  'joy_recall', 'joylater_open',
]);

const WEEK_MS = 7 * 24 * 3600 * 1000;

/** Khoá tuần ISO, dùng để không gửi trùng báo cáo trong cùng một tuần. */
export function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/**
 * Số liệu một tuần. `weeksBack = 0` là tuần đang chạy, `1` là tuần trước.
 */
export async function weeklyMetrics(weeksBack = 0) {
  const end = new Date(Date.now() - weeksBack * WEEK_MS);
  const start = new Date(end.getTime() - WEEK_MS);

  const [rows, transferPairs] = await Promise.all([
    JoyLedger.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end } } },
      { $group: {
        _id: '$source',
        inflow: { $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] } },
        outflow: { $sum: { $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0] } },
        count: { $sum: 1 },
        people: { $addToSet: '$email' },
      } },
      { $project: { inflow: 1, outflow: 1, count: 1, people: { $size: '$people' } } },
    ]),
    JoyLedger.aggregate([
      { $match: { source: { $in: [...JOY_TRANSFER_SOURCES] }, createdAt: { $gte: start, $lt: end } } },
      { $group: {
        _id: { $cond: [{ $and: [{ $ne: ['$refId', ''] }, { $ne: ['$refId', null] }] }, '$refId', { $concat: ['legacy:', { $toString: '$_id' }] }] },
        sentGross: { $sum: { $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0] } },
        received: { $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] } },
      } },
    ]),
  ]);

  let issued = 0;      // JOY hệ thống phát ra
  let spent = 0;       // JOY tiêu trở lại vào hệ thống
  let investmentIn = 0;
  let investmentOut = 0;
  const bySource = [];

  for (const r of rows) {
    if (JOY_INVESTMENT_SOURCES.has(r._id)) {
      investmentIn += r.inflow;
      investmentOut += r.outflow;
    } else if (!NON_ISSUANCE_SOURCES.has(r._id)) {
      issued += r.inflow;
      spent += r.outflow;
      bySource.push({ source: r._id, label: JOY_SOURCES[r._id] || r._id, ...r });
    }
  }
  bySource.sort((a, b) => b.inflow - a.inflow);

  const transfer = reconcileJoyTransfers(transferPairs);

  const [activeUsers, totalMembers, circulatingRow] = await Promise.all([
    JoyLedger.distinct('email', { createdAt: { $gte: start, $lt: end } }).then((x) => x.length),
    Bio.estimatedDocumentCount(),
    Bio.aggregate([{ $group: { _id: null, total: { $sum: '$joyBalance' } } }]),
  ]);

  const circulating = circulatingRow[0]?.total || 0;

  return {
    weekKey: weekKey(end),
    start, end,
    issued, spent, moved: transfer.moved,
    transferFees: transfer.fees,
    transferMismatch: transfer.mismatch,
    investmentIn,
    investmentOut,
    net: issued - spent,
    // Tỷ lệ thu hồi: bao nhiêu phần trăm JOY phát ra đã quay lại hệ thống.
    recoveryRate: issued ? spent / issued : null,
    activeUsers, totalMembers, circulating,
    // JOY phát ra trên mỗi người CÓ HOẠT ĐỘNG — con số này mới so sánh được
    // giữa các tuần, vì tổng phát hành tự tăng khi có thêm người dùng.
    issuedPerActive: activeUsers ? Math.round(issued / activeUsers) : 0,
    bySource: bySource.slice(0, 10),
  };
}

/**
 * Đề xuất hành động dựa trên tỷ lệ thu hồi.
 *
 * Ngưỡng chọn có chủ ý rộng: dưới 60% là JOY nở nhanh, trên 110% là đang co lại.
 * Khoảng giữa để yên — nền kinh tế nhỏ dao động mạnh, siết/nới liên tục theo
 * nhiễu còn hại hơn là đứng im.
 */
export function suggest(metrics, policy) {
  const { recoveryRate, issued, activeUsers } = metrics;

  if (metrics.transferMismatch > 0) {
    return { action: 'hold', why: `Đang lệch ${metrics.transferMismatch.toLocaleString('vi-VN')} JOY giữa hai vế chuyển thành viên — khóa kích cầu cho tới khi đối soát xong.` };
  }

  if (!issued || activeUsers < 3) {
    return { action: 'hold', why: 'Chưa đủ hoạt động trong tuần để kết luận gì.' };
  }
  if (recoveryRate === null) {
    return { action: 'hold', why: 'Tuần này không phát hành JOY nào.' };
  }
  if (recoveryRate < 0.6) {
    if (policy.issuanceMultiplier <= policy.step + 0.5) {
      return { action: 'hold', why: `JOY vẫn nở (thu hồi ${Math.round(recoveryRate * 100)}%) nhưng hệ số đã chạm sàn ${policy.issuanceMultiplier.toFixed(1)}. Cần tăng phí tính năng thay vì siết thưởng tiếp.` };
    }
    return { action: 'decrease', why: `Chỉ ${Math.round(recoveryRate * 100)}% JOY phát ra quay lại hệ thống — phát nhiều hơn thu, JOY đang nở.` };
  }
  if (recoveryRate > 1.1) {
    if (policy.issuanceMultiplier >= 1.5 - policy.step) {
      return { action: 'hold', why: `JOY đang co lại nhưng hệ số đã chạm trần ${policy.issuanceMultiplier.toFixed(1)}.` };
    }
    return { action: 'increase', why: `Người dùng tiêu ${Math.round(recoveryRate * 100)}% lượng phát ra — JOY đang co lại, thưởng có thể nới.` };
  }
  return { action: 'hold', why: `Thu hồi ${Math.round(recoveryRate * 100)}% — nằm trong vùng cân bằng (60–110%).` };
}

/** Áp quyết định của admin. Trả về hệ số mới. */
export async function applyDecision({ action, decidedBy = 'telegram_admin', snapshot = null, suggested = '' }) {
  const policy = await JoyPolicy.current();
  const from = policy.issuanceMultiplier;
  let to = from;

  if (action === 'increase') to = Math.min(1.5, Number((from + policy.step).toFixed(2)));
  if (action === 'decrease') to = Math.max(0.5, Number((from - policy.step).toFixed(2)));

  policy.issuanceMultiplier = to;
  policy.history.push({ action, from, to, decidedBy, snapshot, suggested });
  // Giữ 52 quyết định gần nhất — đúng một năm báo cáo tuần.
  if (policy.history.length > 52) policy.history = policy.history.slice(-52);
  await policy.save();

  return { from, to, changed: from !== to };
}

/** Hệ số đang áp dụng. Lỗi đọc thì trả 1 — hỏng DB không được biến thành mất thưởng. */
export async function currentMultiplier() {
  try {
    const policy = await JoyPolicy.current();
    return policy.issuanceMultiplier || 1;
  } catch {
    return 1;
  }
}

/** Báo cáo tuần dạng chữ, dùng cho Telegram (HTML). */
export function formatReport(metrics, suggestion, policy, survey = null) {
  const n = (v) => Number(v || 0).toLocaleString('vi-VN');
  const rate = metrics.recoveryRate === null ? '—' : `${Math.round(metrics.recoveryRate * 100)}%`;
  const ACTION_LABEL = { increase: '📈 Nên TĂNG', decrease: '📉 Nên GIẢM', hold: '⏸ Nên GIỮ NGUYÊN' };

  const lines = [
    `<b>Báo cáo bình ổn JOY · ${metrics.weekKey}</b>`,
    '',
    `Phát hành:   <b>${n(metrics.issued)}</b> JOY`,
    `Tiêu trở lại: <b>${n(metrics.spent)}</b> JOY`,
    `Ròng:        <b>${metrics.net >= 0 ? '+' : ''}${n(metrics.net)}</b> JOY`,
    `Thu hồi:     <b>${rate}</b>  (vùng cân bằng 60–110%)`,
    '',
    `Chuyển tay giữa người dùng: ${n(metrics.moved)} JOY`,
    `Phí chuyển đã thu: ${n(metrics.transferFees)} JOY · chênh sổ: ${n(metrics.transferMismatch)} JOY`,
    `Đầu tư ảo (tách riêng): vào ${n(metrics.investmentIn)} · ra ${n(metrics.investmentOut)} JOY`,
    `Người có hoạt động: ${n(metrics.activeUsers)}/${n(metrics.totalMembers)}`,
    `Phát ra mỗi người hoạt động: ${n(metrics.issuedPerActive)} JOY`,
    `Tổng đang lưu hành: ${n(metrics.circulating)} JOY`,
    '',
    `Hệ số phát hành hiện tại: <b>${policy.issuanceMultiplier.toFixed(1)}×</b>`,
    '',
    `<b>${ACTION_LABEL[suggestion.action]}</b>`,
    suggestion.why,
  ];

  if (metrics.bySource.length) {
    lines.push('', '<b>Nguồn phát nhiều nhất</b>');
    for (const s of metrics.bySource.slice(0, 5)) {
      if (!s.inflow) continue;
      lines.push(`· ${s.label}: ${n(s.inflow)} (${n(s.people)} người)`);
    }
  }

  // Tiếng nói của người dùng, ngay cạnh số liệu của hệ thống. Tách ra một báo
  // cáo riêng thì hai thứ này không bao giờ được đọc cùng nhau — mà quyết định
  // tăng hay giảm phát hành chỉ đúng khi biết người ta đang thấy JOY thế nào.
  if (survey?.responses) {
    lines.push('', `<b>Khảo sát người dùng</b> · ${n(survey.responses)} câu trả lời / ${survey.months} tháng`);

    const pct = (row) => (row.score === null ? '—' : `${row.score}%`);
    const rated = survey.byApp.filter((r) => r.enough);
    if (rated.length) {
      lines.push('Theo ứng dụng:');
      for (const row of rated.slice(0, 5)) {
        lines.push(`· ${row.key}: <b>${pct(row)}</b> (${row.counted} phiếu${row.unsure ? `, ${row.unsure} chưa rõ` : ''})`);
      }
    }
    const facets = survey.byFacet.filter((r) => r.enough);
    if (facets.length) {
      lines.push('Theo khía cạnh: ' + facets.map((r) => `${r.key} ${pct(r)}`).join(' · '));
    }
    if (survey.pain.length) {
      // Điểm THẤP ở đây là chỗ đau nhất — câu hỏi âm bị trả lời "Có" nhiều.
      lines.push(`Đáng lo nhất: ${survey.pain.map((r) => `${r.key} ${pct(r)}`).join(' · ')}`);
    }
    if (!rated.length && !facets.length) {
      lines.push(`Chưa đủ mẫu (cần ≥${survey.minSample} phiếu mỗi mục) để kết luận.`);
    }
  }

  return lines.join('\n');
}


/**
 * Gửi báo cáo tuần cho admin kèm ba nút quyết định.
 *
 * `lastReportKey` chặn gửi trùng: nhiều process cùng chạy cron thì chỉ process
 * nào ghi được khoá tuần mới gửi — chống việc admin nhận ba bản báo cáo giống
 * nhau rồi bấm nhầm ba lần.
 *
 * `callback_data` của Telegram tối đa 64 byte, nên chỉ nhét hành động + khoá
 * tuần, không nhét số liệu.
 */
export async function sendWeeklyReport({ force = false } = {}) {
  const policy = await JoyPolicy.current();
  const metrics = await weeklyMetrics(1);   // tuần TRƯỚC — tuần đang chạy chưa đủ dữ liệu
  const key = metrics.weekKey;

  if (!force) {
    const claimed = await JoyPolicy.findOneAndUpdate(
      { key: 'global', lastReportKey: { $ne: key } },
      { $set: { lastReportKey: key, lastReportAt: new Date() } },
    );
    if (!claimed) return { skipped: true, reason: 'đã gửi báo cáo tuần này rồi', weekKey: key };
  }

  const suggestion = suggest(metrics, policy);
  // Khảo sát hỏng KHÔNG được chặn báo cáo bình ổn — đó mới là thứ admin phải
  // bấm nút. Thiếu phần khảo sát thì báo cáo vẫn gửi, chỉ là ngắn hơn.
  const survey = await surveyReport({ months: 3 }).catch((err) => {
    console.error('[joy] báo cáo tuần thiếu phần khảo sát:', err.message);
    return null;
  });
  const text = formatReport(metrics, suggestion, policy, survey);

  const mark = (action) => (suggestion.action === action ? '✅ ' : '');
  await sendTelegramAlert(text, 'HTML', {
    inline_keyboard: [
      [
        { text: `${mark('increase')}📈 Tăng`, callback_data: `js:inc:${key}` },
        { text: `${mark('hold')}⏸ Giữ`, callback_data: `js:hold:${key}` },
        { text: `${mark('decrease')}📉 Giảm`, callback_data: `js:dec:${key}` },
      ],
      // Ép xét lại hạn mức JOYlater ngay, không chờ 17:00 thứ Bảy. Đặt cùng thẻ
      // báo cáo vì đây đúng lúc admin đang nhìn số liệu và quyết định.
      [{ text: '🔄 Xét lại hạn mức ngay', callback_data: 'js:review' }],
    ],
  });

  return { sent: true, weekKey: key, suggested: suggestion.action, metrics };
}

const ACTION_OF = { inc: 'increase', dec: 'decrease', hold: 'hold' };

/**
 * Admin vừa bấm một trong ba nút. Trả `false` nếu không phải nút của màn này.
 */
export async function handleStabilityCallback({ chatId, messageId, data }) {
  if (!data.startsWith('js:')) return false;
  const [, code, key] = data.split(':');

  if (code === 'review') {
    const { forceReview } = await import('./joyCreditService.js');
    const result = await forceReview({ by: String(chatId) });
    const lines = result.changed.slice(0, 8)
      .map((c) => `· ${c.email}: ${c.from.toLocaleString('vi-VN')} → ${c.to.toLocaleString('vi-VN')}`);
    await editTelegramMessage(chatId, messageId,
      `<b>Đã xét lại hạn mức JOYlater</b>\n\nSoát ${result.scanned} hồ sơ · ${result.changed.length} hồ sơ đổi hạn mức.`
      + (lines.length ? `\n\n${lines.join('\n')}` : ''), 'HTML');
    return true;
  }
  const action = ACTION_OF[code];
  if (!action) return false;

  const policy = await JoyPolicy.current();
  const metrics = await weeklyMetrics(1);
  const suggestion = suggest(metrics, policy);

  if (action === 'increase' && metrics.transferMismatch > 0) {
    await editTelegramMessage(chatId, messageId,
      `<b>Chưa thể kích cầu</b>\n\nSổ chuyển thành viên đang lệch ${metrics.transferMismatch.toLocaleString('vi-VN')} JOY. Hãy đối soát đủ hai vế trước khi tăng hệ số phát hành.`,
      'HTML');
    return true;
  }

  const result = await applyDecision({
    action,
    decidedBy: 'telegram_admin',
    suggested: suggestion.action,
    snapshot: {
      weekKey: key,
      issued: metrics.issued,
      spent: metrics.spent,
      recoveryRate: metrics.recoveryRate,
      transferMismatch: metrics.transferMismatch,
      activeUsers: metrics.activeUsers,
      circulating: metrics.circulating,
    },
  });

  const LABEL = { increase: 'TĂNG', decrease: 'GIẢM', hold: 'GIỮ NGUYÊN' };
  const lines = [
    `<b>Đã ghi quyết định · ${key}</b>`,
    '',
    `Hành động: <b>${LABEL[action]}</b>`,
    result.changed
      ? `Hệ số phát hành: ${result.from.toFixed(1)}× → <b>${result.to.toFixed(1)}×</b>`
      : `Hệ số giữ nguyên ở <b>${result.to.toFixed(1)}×</b>`,
    '',
    action === suggestion.action
      ? 'Khớp với đề xuất của báo cáo.'
      : `Khác đề xuất (bot đề xuất: ${LABEL[suggestion.action]}) — đã ghi lại cả hai.`,
    '',
    '<i>Áp dụng ngay cho mọi phần thưởng phát sinh từ lúc này. Tiêu JOY, chuyển tay và điều chỉnh của admin không bị ảnh hưởng.</i>',
  ];

  await editTelegramMessage(chatId, messageId, lines.join('\n'), null);
  return true;
}

export default { weeklyMetrics, sendWeeklyReport, handleStabilityCallback, suggest, applyDecision, currentMultiplier, formatReport, weekKey };
