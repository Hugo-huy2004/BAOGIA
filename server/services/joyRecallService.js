import Bio from '../models/Bio.js';
import JoyLedger from '../models/JoyLedger.js';
import { awardJoy } from '../utils/joyService.js';
import { NON_ISSUANCE_SOURCES } from './joyStabilityService.js';

/**
 * Thu hồi JOY theo chính sách bình ổn.
 *
 * Người dùng đã đồng ý chính sách bình ổn và quyền thu hồi của admin, nên việc
 * này hợp lệ. Nhưng nó vẫn là thao tác KHÔNG HOÀN TÁC ĐƯỢC trên tiền của người
 * khác, nên hạ tầng ở đây dựng quanh ba nguyên tắc:
 *
 *   1. MÔ PHỎNG TRƯỚC. `plan()` không ghi gì, chỉ trả về bảng "ai mất bao nhiêu".
 *      Không có đường nào chạy thật mà bỏ qua bước xem bảng đó.
 *   2. TRUY RA ĐƯỢC. Mỗi khoản trừ là một dòng JoyLedger nguồn `joy_recall` kèm
 *      mã đợt, nên một năm sau vẫn tra được "đợt nào, vì sao, ai bị trừ".
 *   3. KHÔNG ĐỤNG PHẦN TỰ KIẾM. Mặc định chỉ thu hồi phần JOY đến từ một nguồn
 *      CỤ THỂ đã hỏng (ví dụ sàn ảo đã gỡ) — không phải cào đều số dư của mọi
 *      người. Cào đều là phạt người không liên quan.
 */

/** Mã đợt thu hồi: RCL-YYYYMMDD-XXX. Cùng một đợt thì mọi dòng sổ dùng chung mã. */
export function batchCode(now = new Date()) {
  const d = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `RCL-${d}-${rand}`;
}

/**
 * Tính đợt thu hồi — KHÔNG ghi gì.
 *
 * @param {string[]} sources  Nguồn JOY cần thu hồi (vd: ['stock_sell','stock_dividend']).
 *                            Rỗng = chế độ CÀO ĐỀU theo tỷ lệ, cần `ratio`.
 * @param {number}   ratio    Tỷ lệ thu hồi 0–1. Với chế độ theo nguồn, đây là
 *                            phần trăm của khoản đã nhận từ nguồn đó.
 * @param {number}   keepFloor Số JOY tối thiểu để lại trong ví, dù tính ra bao nhiêu.
 * @param {string[]} offsets  Nguồn ĐỐI ỨNG — phần người dùng đã BỎ RA cho chính
 *                            hoạt động đó, sẽ trừ khỏi cơ sở tính.
 *
 * VÌ SAO CẦN `offsets`: thu theo TỔNG THU là phạt cả phần vốn người ta đã chi.
 * Ví dụ sàn ảo: một người nhận 855.087 JOY từ `stock_sell` nhưng đã bỏ ra
 * 572.937 JOY mua vào — lãi ròng chỉ 282.150. Thu hồi 855.087 là lấy luôn cả
 * tiền họ đã trả. Với `offsets: ['stock_buy']` thì cơ sở tính là phần LÃI RÒNG,
 * đúng thứ mà hệ thống đã phát ra thừa.
 */
export async function plan({ sources = [], ratio = 1, keepFloor = 0, offsets = [] } = {}) {
  if (!(ratio > 0 && ratio <= 1)) throw new Error('RATIO_OUT_OF_RANGE');

  const bios = await Bio.find({ joyBalance: { $gt: 0 } }, 'email displayName joyBalance').lean();
  const balanceOf = new Map(bios.map((b) => [b.email, b.joyBalance || 0]));
  const nameOf = new Map(bios.map((b) => [b.email, b.displayName || b.email.split('@')[0]]));

  let basis = new Map();

  if (sources.length) {
    // Theo NGUỒN: cộng lượng JOY mỗi người đã nhận từ đúng những nguồn đó.
    const rows = await JoyLedger.aggregate([
      { $match: { source: { $in: sources }, amount: { $gt: 0 } } },
      { $group: { _id: '$email', received: { $sum: '$amount' } } },
    ]);
    basis = new Map(rows.map((r) => [r._id, r.received]));

    if (offsets.length) {
      const spentRows = await JoyLedger.aggregate([
        { $match: { source: { $in: offsets }, amount: { $lt: 0 } } },
        { $group: { _id: '$email', spent: { $sum: { $abs: '$amount' } } } },
      ]);
      for (const r of spentRows) {
        const gross = basis.get(r._id) || 0;
        // Không âm: người lỗ ở hoạt động đó thì cơ sở bằng 0, không "được" cộng.
        basis.set(r._id, Math.max(0, gross - r.spent));
      }
    }
  } else {
    // CÀO ĐỀU: cơ sở là chính số dư. Chế độ này phạt cả người không liên quan,
    // nên chỉ dùng khi thật sự cần và phải nói rõ trong lý do.
    basis = new Map(balanceOf);
  }

  const items = [];
  for (const [email, base] of basis) {
    const balance = balanceOf.get(email);
    if (!balance) continue;                       // đã hết JOY, không còn gì để thu
    const wanted = Math.floor(base * ratio);
    if (wanted <= 0) continue;
    // Không bao giờ trừ quá số dư, và luôn chừa lại `keepFloor`.
    const room = Math.max(0, balance - keepFloor);
    const amount = Math.min(wanted, room);
    if (amount <= 0) continue;
    items.push({
      email,
      displayName: nameOf.get(email),
      balanceBefore: balance,
      basis: base,
      amount,
      balanceAfter: balance - amount,
    });
  }

  items.sort((a, b) => b.amount - a.amount);
  return {
    mode: sources.length ? (offsets.length ? 'by-source-net' : 'by-source-gross') : 'flat',
    sources, offsets, ratio, keepFloor,
    affected: items.length,
    totalRecall: items.reduce((s, i) => s + i.amount, 0),
    items,
  };
}

/**
 * Chạy thật một đợt đã mô phỏng.
 *
 * Bắt buộc truyền lại chính đối tượng `plan()` đã trả về, kèm `confirm: true` và
 * một `reason` có nội dung. Không có đường tắt nào nhận tham số rời rồi tự tính
 * lại trong lúc chạy — người bấm nút phải là người đã nhìn thấy đúng bảng đó.
 */
export async function execute(planned, { confirm = false, reason = '', by = 'admin' } = {}) {
  if (!confirm) throw new Error('CONFIRM_REQUIRED');
  if (!reason.trim()) throw new Error('REASON_REQUIRED');
  if (!planned?.items?.length) throw new Error('NOTHING_TO_RECALL');

  const code = batchCode();
  const done = [];
  const failed = [];

  for (const item of planned.items) {
    try {
      // `rawAmount` để hệ số phát hành KHÔNG đụng vào: thu hồi phải trừ đúng con
      // số trong bảng người bấm đã duyệt.
      await awardJoy(item.email, -item.amount, 'joy_recall', reason, {
        refId: code,
        rawAmount: true,
        pushNotify: true,
      });
      done.push({ email: item.email, amount: item.amount });
    } catch (err) {
      // Một ví lỗi (đóng băng, số dư đã đổi) KHÔNG được làm hỏng cả đợt — ghi lại
      // và đi tiếp, rồi báo cáo đầy đủ ở cuối.
      failed.push({ email: item.email, amount: item.amount, error: err.message });
    }
  }

  return {
    code, reason, by,
    at: new Date(),
    recalled: done.reduce((s, d) => s + d.amount, 0),
    done: done.length,
    failed,
  };
}

/** Tra lại một đợt đã chạy bằng mã. */
export async function lookup(code) {
  const rows = await JoyLedger.find({ source: 'joy_recall', refId: code })
    .sort({ createdAt: 1 }).lean();
  return {
    code,
    rows: rows.length,
    total: rows.reduce((s, r) => s + Math.abs(r.amount), 0),
    at: rows[0]?.createdAt || null,
    reason: rows[0]?.description || '',
  };
}

/** `joy_recall` phải nằm ngoài thống kê phát hành — khẳng định lại ở đây. */
export const RECALL_IS_NOT_ISSUANCE = NON_ISSUANCE_SOURCES.has('joy_recall');

export default { plan, execute, lookup, batchCode };
