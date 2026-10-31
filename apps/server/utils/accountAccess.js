import { extendFrom } from '../../../packages/shared/partnerCampaigns.js';

/**
 * Hạn truy cập THẬT của một tài khoản: chưa xác minh giáo dục thì đi theo hạn
 * dùng thử (trialExpiresAt) — cổng thành viên (requireMember) và lịch dọn tài
 * khoản (memberAccountLifecycle.js) đều đọc hạn đó.
 */
export const accessDeadline = (bio) => (bio.isEduVerified || !bio.trialExpiresAt ? bio.expiresAt : bio.trialExpiresAt);

/**
 * Cộng ngày duy trì: nối vào hạn cũ (hết hạn rồi thì tính từ hôm nay), dời CẢ
 * HAI mốc. Chỉ dời expiresAt là lỗi đã có ở Store: người dùng thử mua 10 ngày
 * vẫn bị xoá khi hết 7 ngày thử. Không tự lưu — người gọi save.
 */
export function extendAccess(bio, days) {
  const next = extendFrom(accessDeadline(bio), days);
  bio.expiresAt = next;
  if (!bio.isEduVerified) bio.trialExpiresAt = next;
  return next;
}
