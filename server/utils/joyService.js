import Bio from '../models/Bio.js';
import JoyLedger from '../models/JoyLedger.js';
import InAppNotification from '../models/InAppNotification.js';
import ChessRating from '../models/ChessRating.js';
import { sendPushNotification } from './pushNotifier.js';

import { JOY_SOURCES, JOY_SOURCE_GROUPS } from './joySources.js';

// Giữ tên cũ cho các nơi đã import; nguồn thật nằm ở joySources.js.
export const JOY_TITLES = JOY_SOURCES;

/**
 * Tiêu đề thông báo cho một biến động JOY.
 *
 * Khi `source` chưa có tiêu đề riêng, KHÔNG rơi về một chữ chung chung cho cả
 * thu lẫn chi — ít nhất phải nói được tiền vào hay tiền ra, vì đó là thứ người
 * dùng cần biết đầu tiên khi mở thông báo.
 */
export function joyTitleFor(source, amount) {
  return JOY_TITLES[source] || (Number(amount) >= 0 ? 'Nhận JOY' : 'Dùng JOY');
}

/**
 * Single choke point for every JOY-affecting event (earn or spend).
 * Updates Bio.joyBalance, writes a JoyLedger audit row, and (by default)
 * creates an in-app notification — so balance/ledger/notification never drift.
 */
export async function awardJoy(email, amount, source, description, opts = {}) {
  if (!email) throw new Error('MISSING_EMAIL');
  const numAmount = Math.round(Number(amount));
  if (!numAmount) throw new Error('INVALID_AMOUNT');
  const allowedSources = JoyLedger.schema.path('source')?.enumValues || [];
  if (!allowedSources.includes(source)) {
    // Validate ledger metadata before touching the wallet. Previously an
    // unknown source could increment joyBalance and only then fail while
    // creating JoyLedger, leaving a partial, repeatable reward.
    throw new Error('INVALID_JOY_SOURCE');
  }

  let bio = opts.bioDoc;
  if (!bio) {
    bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
  }
  if (!bio) throw new Error('BIO_NOT_FOUND');

  // Thực hiện cập nhật số dư nguyên tử (atomic update) ở MongoDB để tránh race condition/double spend
  const query = {
    _id: bio._id,
    ...(numAmount < 0 ? { joyBalance: { $gte: -numAmount } } : {})
  };
  const update = {
    $inc: { joyBalance: numAmount }
  };
  const updatedBio = await Bio.findOneAndUpdate(query, update, { new: true });
  if (!updatedBio) {
    if (numAmount < 0) {
      throw new Error('INSUFFICIENT_JOY');
    }
    throw new Error('BIO_NOT_FOUND');
  }

  const newBalance = updatedBio.joyBalance;

  // Keep the loaded document in sync as well. Several callers use the return
  // value immediately without passing bioDoc; leaving this stale made a
  // successful reward appear to return the previous balance.
  bio.joyBalance = newBalance;
  if (opts.bioDoc && opts.bioDoc !== bio) opts.bioDoc.joyBalance = newBalance;

  // Ghi nhận lịch sử giao dịch (JoyLedger)
  await JoyLedger.create({
    email: updatedBio.email,
    amount: numAmount,
    balanceAfter: newBalance,
    source,
    description: description || '',
    refId: opts.refId || ''
  });

  // Nếu người gọi truyền bioDoc và không skipSave, ta cần lưu các thuộc tính khác (VD: joySentDate) mà caller đã thay đổi trên bioDoc
  if (opts.bioDoc && !opts.skipSave) {
    await opts.bioDoc.save();
  }

  // Keep the chess-displayed "JOY" number perfectly in sync with the real wallet.
  // updateOne (no upsert) is intentional: only players who've already opened the
  // chess feature have a ChessRating doc — this never silently creates one.
  await ChessRating.updateOne({ email: bio.email }, { $set: { rating: bio.joyBalance, updatedAt: new Date() } });

  let notification = null;
  if (opts.notify !== false) {
    notification = await InAppNotification.create({
      email: bio.email,
      type: numAmount >= 0 ? 'success' : 'info',
      category: 'joy',
      title: opts.notificationTitle || joyTitleFor(source, numAmount),
      message: opts.notificationMessage || description || '',
      actionUrl: opts.actionUrl || '/member/joy',
      // Số liệu đi thành field, không nhét vào câu để client phải regex bóc ra.
      amount: numAmount,
      balanceAfter: newBalance,
      refCode: opts.refId || '',
      counterparty: opts.counterparty || ''
    });
  }

  // Update every open device immediately. Web Push below covers devices where
  // the PWA is in the background or has been closed.
  const realtimeEvent = JSON.stringify({
    type: 'joy_update',
    balance: bio.joyBalance,
    amount: numAmount,
    source,
    notification,
    createdAt: new Date().toISOString()
  });
  for (const client of global.wsClients?.[bio.email] || []) {
    if (client.readyState === 1) client.send(realtimeEvent);
  }

  if (opts.pushNotify === true && notification) {
    await sendPushNotification(
      bio.email,
      opts.pushTitle || notification.title,
      opts.pushBody || notification.message,
      notification.actionUrl || '/member/joy'
    );
  }

  return { balance: bio.joyBalance, bio, notification };
}

export async function getJoyBalance(email) {
  let bio = await Bio.findOne({ email });
  if (!bio) bio = await Bio.findOne({ contactEmail: email });
  if (!bio) throw new Error('BIO_NOT_FOUND');
  return bio.joyBalance;
}

/**
 * Lịch sử ví. Trả kèm `title` + `group` để client không phải biết gì về danh
 * mục nguồn — thêm nguồn mới ở joySources.js là ví hiện đúng ngay, không cần
 * đụng frontend.
 *
 * `limit` chặn trần ở 200: đây là tham số do client truyền, để mở là một người
 * dùng gõ ?limit=999999 kéo cả ledger về.
 */
export async function getJoyHistory(email, limit = 50) {
  const n = Math.min(200, Math.max(1, Math.floor(Number(limit)) || 50));
  const rows = await JoyLedger.find({ email }).sort({ createdAt: -1 }).limit(n).lean();
  return rows.map((r) => ({
    id: String(r._id),
    amount: r.amount,
    balanceAfter: r.balanceAfter,
    source: r.source,
    title: joyTitleFor(r.source, r.amount),
    group: JOY_SOURCE_GROUPS[r.source] || 'khac',
    description: r.description || '',
    createdAt: r.createdAt
  }));
}

/**
 * Tổng thu / chi / theo nhóm trong N ngày gần nhất. Gộp ở tầng DB thay vì kéo
 * cả ledger về client rồi cộng — ví của người chơi lâu năm có hàng nghìn dòng.
 */
export async function getJoySummary(email, days = 30) {
  const span = Math.min(365, Math.max(1, Math.floor(Number(days)) || 30));
  const since = new Date(Date.now() - span * 24 * 60 * 60 * 1000);
  const rows = await JoyLedger.aggregate([
    { $match: { email, createdAt: { $gte: since } } },
    { $group: { _id: '$source', total: { $sum: '$amount' }, count: { $sum: 1 } } }
  ]);

  let earned = 0;
  let spent = 0;
  const byGroup = {};
  for (const r of rows) {
    if (r.total >= 0) earned += r.total;
    else spent += -r.total;
    const g = JOY_SOURCE_GROUPS[r._id] || 'khac';
    byGroup[g] = (byGroup[g] || 0) + r.total;
  }

  return {
    days: span,
    earned,
    spent,
    net: earned - spent,
    txCount: rows.reduce((s, r) => s + r.count, 0),
    // Nhóm kiếm được nhiều nhất trước, nhóm tiêu nhiều nhất sau.
    groups: Object.entries(byGroup)
      .map(([group, total]) => ({ group, total }))
      .sort((a, b) => b.total - a.total)
  };
}
