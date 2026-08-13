import InAppNotification from '../models/InAppNotification.js';
import { renderNotification } from '../../shared/notificationText.js';
import { sendLocalizedPush } from './pushNotifier.js';

/**
 * Một cửa duy nhất để gửi thông báo cho thành viên.
 *
 * Trước đây mỗi route tự gọi `InAppNotification.create()` với câu tiếng Việt
 * viết thẳng trong code, nên (1) mỗi nơi một giọng, (2) người dùng đặt ngôn ngữ
 * khác vẫn nhận tiếng Việt và không sửa được vì câu đã nằm trong DB.
 *
 * Ở đây chỉ truyền KHOÁ + THAM SỐ (shared/notificationText.js). Bản ghi vẫn kèm
 * câu tiếng Việt dựng sẵn để client cũ và trang admin có cái đọc, nhưng client
 * mới luôn dựng lại theo ngôn ngữ của người đọc.
 *
 * `push: true` gửi kèm thông báo đẩy — dựng riêng theo ngôn ngữ TỪNG THIẾT BỊ,
 * vì hệ điều hành vẽ nó khi app đã đóng.
 */
export async function notifyMember({
  email,
  key,
  params = {},
  type = 'info',
  category = 'system',
  actionUrl = '',
  message,
  push = false,
  amount = null,
  balanceAfter = null,
  refCode = '',
  counterparty = '',
}) {
  if (!email) return null;

  const fallback = renderNotification(key, params, 'vi');
  if (!fallback) throw new Error(`UNKNOWN_NOTIFICATION_KEY: ${key}`);

  const notification = await InAppNotification.create({
    email,
    type,
    category,
    i18nKey: key,
    i18nParams: params,
    title: fallback.title,
    message: message ?? fallback.message,
    actionUrl,
    amount,
    balanceAfter,
    refCode,
    counterparty,
  });

  if (push) await sendLocalizedPush(email, key, params, actionUrl);

  return notification;
}

export default notifyMember;
