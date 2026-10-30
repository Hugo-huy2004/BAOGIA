/**
 * Bản tin quản trị — MỘT màn thay cho chục bảng số mà không ai đọc nổi.
 *
 * Mỗi dòng là một câu tiếng Việt thường + mức độ (ok / warn / bad) + màn cần mở.
 * Chỉ nói thứ cần người làm; thứ máy đã tự lo thì gom vào `auto` để admin biết
 * hệ thống đang chạy, khỏi phải tự đi soát. Thêm tín hiệu mới: thêm một dòng ở
 * `signals`, đừng dựng thêm tab báo cáo.
 */
import { buildWorkQueue } from './adminWorkQueue.js';
import { getQuotaStatus } from './aiGateway.js';

const HOUR = 60 * 60 * 1000;
const load = async (name) => (await import(`../models/${name}.js`)).default;
const ago = (date) => {
  const h = Math.floor((Date.now() - new Date(date).getTime()) / HOUR);
  return h < 1 ? 'chưa tới 1 giờ' : h < 48 ? `${h} giờ` : `${Math.floor(h / 24)} ngày`;
};
const oldest = (items) => items.reduce((min, i) => (i.createdAt && (!min || i.createdAt < min) ? i.createdAt : min), null);

export async function buildAdminBrief() {
  const since = new Date(Date.now() - 24 * HOUR);
  const [Bio, ErrorLog, SecurityModeration, SecurityBlock, SecurityEvent, TodayPost, MemberActivity] = await Promise.all(
    ['Bio', 'ErrorLog', 'SecurityModeration', 'SecurityBlock', 'SecurityEvent', 'TodayPost', 'MemberActivity'].map(load),
  );
  const [{ queue }, members, newMembers, errors, topError, moderation, autoBlocks, rejected, hiddenPosts, activeToday, [push], quieted] = await Promise.all([
    buildWorkQueue({ limit: 200 }),
    Bio.estimatedDocumentCount(),
    Bio.countDocuments({ createdAt: { $gte: since } }),
    ErrorLog.countDocuments({ level: 'error', createdAt: { $gte: since } }),
    ErrorLog.aggregate([{ $match: { level: 'error', createdAt: { $gte: since } } }, { $group: { _id: '$source', n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 1 }]),
    SecurityModeration.countDocuments({ status: 'pending' }),
    SecurityBlock.countDocuments({ lastLockedAt: { $gte: since } }),
    SecurityEvent.countDocuments({ createdAt: { $gte: since } }),
    TodayPost.countDocuments({ 'removed.at': { $gte: since } }),
    MemberActivity.countDocuments({ lastActiveAt: { $gte: since } }),
    MemberActivity.aggregate([{ $group: { _id: null, sent: { $sum: '$push.sent' }, opened: { $sum: '$push.opened' } } }]),
    MemberActivity.countDocuments({ 'push.ignored': { $gte: 3 } }),
  ]);
  const quota = getQuotaStatus();
  const rssMb = Math.round(process.memoryUsage().rss / 1024 / 1024);

  // [điều kiện, mức, icon, câu, màn]. Chờ quá 24 giờ thì từ "chú ý" lên "gấp".
  const late = (items) => items.length && Date.now() - new Date(oldest(items)).getTime() > 24 * HOUR;
  const waiting = (items, what, tab, icon) => [items.length > 0, late(items) ? 'bad' : 'warn', icon,
    `${items.length} ${what} đang chờ — cũ nhất đã ${ago(oldest(items))}.`, tab];
  const signals = [
    waiting(queue.heldTransfers, 'giao dịch JOY bị giữ lại (tiền người dùng đang treo)', 'queue', 'account_balance_wallet'),
    waiting(queue.appeals, 'kháng nghị mở khoá tài khoản', 'queue', 'gavel'),
    waiting(queue.tickets, 'yêu cầu hỗ trợ chưa trả lời', 'support', 'support_agent'),
    waiting(queue.joylater, 'hồ sơ nợ JOY chờ quyết định cấm', 'queue', 'block'),
    [moderation > 0, 'warn', 'shield', `${moderation} nội dung bị máy nghi ngờ, cần người xem lại.`, 'sentinel'],
    [quota.saturated, 'bad', 'smart_toy', 'AI đã dùng hết lượt miễn phí hôm nay. Các tính năng AI tự tạm dừng và tự chạy lại khi sang ngày mới — không cần làm gì.', 'monitor'],
    [!quota.saturated && !quota.healthy, 'warn', 'smart_toy', 'AI đang gần hết lượt miễn phí hoặc trả lỗi liên tục. Hệ thống đã tự giảm tải.', 'monitor'],
    [errors >= 100, 'bad', 'error', `Máy chủ báo ${errors} lỗi trong 24 giờ${topError[0] ? `, nhiều nhất ở "${topError[0]._id}"` : ''}. Nên báo kỹ thuật.`, 'monitor'],
    [errors >= 20 && errors < 100, 'warn', 'error', `Máy chủ báo ${errors} lỗi trong 24 giờ${topError[0] ? `, nhiều nhất ở "${topError[0]._id}"` : ''}.`, 'monitor'],
    [rssMb > 450, 'warn', 'memory', `Máy chủ đang dùng ${rssMb} MB bộ nhớ (gói miễn phí có 512 MB).`, 'monitor'],
  ];
  const items = signals.filter(([on]) => on).map(([, level, icon, text, tab]) => ({ level, icon, text, tab }));

  const auto = [
    [rejected, 'security', `Chặn ${rejected} yêu cầu tấn công hoặc lạm dụng.`],
    [autoBlocks, 'block', `Tự khoá ${autoBlocks} địa chỉ / tài khoản vi phạm.`],
    [hiddenPosts, 'visibility_off', `Ẩn ${hiddenPosts} bài Today vi phạm (khôi phục được).`],
    [quieted, 'notifications_paused', `Gửi thông báo thưa lại cho ${quieted} người hay bỏ qua, để họ không tắt hẳn.`],
  ].filter(([n]) => n > 0).map(([, icon, text]) => ({ icon, text }));

  const bad = items.filter((i) => i.level === 'bad').length;
  return {
    status: bad ? 'bad' : items.length ? 'warn' : 'ok',
    headline: bad ? `Có ${bad} việc gấp cần bạn ngay.` : items.length ? `Có ${items.length} việc cần bạn hôm nay.` : 'Mọi thứ đang ổn. Không có việc gì cần bạn.',
    items,
    auto,
    numbers: {
      members, newMembers, activeToday,
      // Tỷ lệ push được mở app trong 2 giờ sau khi gửi — thước đo push có kéo người quay lại không.
      pushOpenRate: push?.sent >= 20 ? Math.round((push.opened / push.sent) * 100) : null,
    },
    at: new Date().toISOString(),
  };
}
