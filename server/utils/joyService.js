import Bio from '../models/Bio.js';
import JoyLedger from '../models/JoyLedger.js';
import InAppNotification from '../models/InAppNotification.js';
import ChessRating from '../models/ChessRating.js';
import { sendPushNotification } from './pushNotifier.js';

export const JOY_TITLES = {
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
  hugoso_course: 'Mở khóa khóa học HugoSO',
  info_bonus: 'Khám phá Info & Version',
  feature_subscription: 'Trao đổi JOY mở khóa tính năng',
  bio_theme_rental: 'Trao đổi JOY diện giao diện Bio',
  file_compression: 'Trao đổi JOY nén file HugoTractare',
  admin_direct_add: 'Nhận JOY từ Admin',
  deco_buy: 'Mua sắm nội thất KTX',
  deco_tip_sent: 'Tip KTX cho bạn bè',
  deco_tip_received: 'Nhận Tip KTX',
  community_post: 'Đăng bài cộng đồng',
  community_comment: 'Bình luận bài viết',
  community_like_received: 'Bài viết được thả tim',
  community_anon_post: 'Đăng bài ẩn danh',
  // Bốn source dưới đây trước đây không có tiêu đề nên rơi hết về một chữ
  // "Cập nhật JOY" — người dùng không biết chuyện gì vừa xảy ra.
  deco_visit_sent: 'Mua vé tham quan KTX',
  deco_visit_received: 'Khách mua vé tham quan KTX',
  app_plan: 'Mở gói ứng dụng',
  app_plan_gift: 'Tặng gói ứng dụng',
  ide_course_completion: 'Tốt nghiệp HugoCoder',
  deco_rent: 'Thuê Ký Túc Xá HugoHome',
  deco_clean: 'Dọn dẹp Ký Túc Xá',
  deco_story: 'Hoàn thành chương HugoRoom',
  deco_daily: 'Duy trì căn phòng 27',
  chat_tokens_exchange: 'Đổi thêm lượt trò chuyện',
  coder_exam_retake: 'Mua lượt thi lại HugoCoder',
  lifetime_unlock: 'Mở khoá vĩnh viễn một chặng',
  lifetime_unlock_all: 'Mở khoá vĩnh viễn toàn bộ chặng',
  info_read_bonus: 'Đọc tin Info & Version'
};

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

export async function getJoyHistory(email, limit = 20) {
  return JoyLedger.find({ email }).sort({ createdAt: -1 }).limit(Number(limit) || 20);
}
