import Bio from '../models/Bio.js';
import JoyLedger from '../models/JoyLedger.js';
import InAppNotification from '../models/InAppNotification.js';
import ChessRating from '../models/ChessRating.js';
import { sendPushNotification } from './pushNotifier.js';

const TITLES = {
  referral_referrer: 'Quà giới thiệu',
  referral_referee: 'Quà giới thiệu',
  chess_win: 'Thắng trận cờ vua',
  chess_match: 'Trận đấu cờ vua',
  companion: 'Trị liệu tâm lý',
  checkin: 'Điểm danh nhận JOY',
  gift_code: 'Đổi mã quà tặng',
  store_purchase: 'Mua hàng',
  admin_adjustment: 'Điều chỉnh JOY',
  companion_unlock: 'Mở khoá tính năng trị liệu',
  daily_challenge: 'Thử thách hàng ngày',
  arcade_score: 'Kỷ lục HugoArcade mới',
  focus_session: 'Tập trung sâu HugoAura',
  aura_theme_rent: 'Thuê giao diện Aura',
  joy_gift_sent: 'Gửi JOY cho bạn bè',
  joy_gift_received: 'Nhận JOY từ bạn bè',
  ide_learning: 'Hoàn thành bài học HugoCoder',
  info_bonus: 'Khám phá Info & Version',
  feature_subscription: 'Trao đổi JOY mở khóa tính năng',
  bio_theme_rental: 'Trao đổi JOY diện giao diện Bio',
  file_compression: 'Trao đổi JOY nén file HugoTractare',
  admin_direct_add: 'Nhận JOY từ Admin',
  deco_buy: 'Mua sắm nội thất KTX',
  deco_tip_sent: 'Tip KTX cho bạn bè',
  deco_tip_received: 'Nhận Tip KTX'
};

/**
 * Single choke point for every JOY-affecting event (earn or spend).
 * Updates Bio.joyBalance, writes a JoyLedger audit row, and (by default)
 * creates an in-app notification — so balance/ledger/notification never drift.
 */
export async function awardJoy(email, amount, source, description, opts = {}) {
  if (!email) throw new Error('MISSING_EMAIL');
  const numAmount = Math.round(Number(amount));
  if (!numAmount) throw new Error('INVALID_AMOUNT');

  let bio = opts.bioDoc || (await Bio.findOne({ email }));
  if (!bio) bio = await Bio.findOne({ contactEmail: email });
  if (!bio) throw new Error('BIO_NOT_FOUND');

  if (numAmount < 0 && bio.joyBalance + numAmount < 0) {
    throw new Error('INSUFFICIENT_JOY');
  }

  const newBalance = Math.max(0, Math.round((bio.joyBalance || 0) + numAmount));

  // Write the ledger row FIRST, before mutating the real wallet — its schema
  // validation (e.g. the `source` enum) is the cheapest thing to fail on, and
  // doing it first guarantees balance/ledger/notification can never drift out
  // of sync from a partial failure (a bad `source` used to silently credit the
  // wallet while leaving no audit row at all).
  await JoyLedger.create({
    email: bio.email,
    amount: numAmount,
    balanceAfter: newBalance,
    source,
    description: description || '',
    refId: opts.refId || ''
  });

  bio.joyBalance = newBalance;
  if (!opts.skipSave) await bio.save();

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
      title: opts.notificationTitle || TITLES[source] || 'Cập nhật JOY',
      message: opts.notificationMessage || description || '',
      actionUrl: opts.actionUrl || '/member/joy'
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

export async function getJoyHistory(email, limit = 20) {
  return JoyLedger.find({ email }).sort({ createdAt: -1 }).limit(Number(limit) || 20);
}
