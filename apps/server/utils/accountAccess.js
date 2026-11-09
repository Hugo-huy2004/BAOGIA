const DAY_MS = 24 * 60 * 60 * 1000;

/** Hạn mới sau khi cộng `days` ngày: nối vào hạn cũ nếu còn, tính từ bây giờ nếu đã qua. */
const extendFrom = (current, days, now = Date.now()) => {
  const base = Math.max(now, current ? new Date(current).getTime() || 0 : 0);
  return new Date(base + days * DAY_MS);
};

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
