import { extendFrom } from '../../../packages/shared/partnerCampaigns.js';

/**
 * Từ 04/11/2026 không còn xác minh HSSV: ai cũng tạo được tài khoản, cùng một
 * thời hạn. Hết hạn thì tài khoản bị khoá (không xoá); gia hạn do admin quyết.
 */
export const NEW_ACCOUNT_DAYS = 365;
export const NEW_ACCOUNT_MS = NEW_ACCOUNT_DAYS * 24 * 60 * 60 * 1000;

/** Hạn truy cập của một tài khoản — cổng thành viên (requireMember) đọc hạn này. */
export const accessDeadline = (bio) => bio.expiresAt;

/** Cộng ngày duy trì: nối vào hạn cũ (hết hạn rồi thì tính từ hôm nay). Không tự lưu — người gọi save. */
export function extendAccess(bio, days) {
  const next = extendFrom(accessDeadline(bio), days);
  bio.expiresAt = next;
  return next;
}
