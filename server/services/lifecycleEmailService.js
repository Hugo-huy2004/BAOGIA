import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../utils/secrets.js';
import Bio from '../models/Bio.js';
import { brandEmail, sendCustomEmail } from './emailService.js';

const APP_URL = (process.env.APP_URL || 'https://www.hugowishpax.studio').replace(/\/$/, '');

// Thư quảng cáo hằng ngày (100 biến thể "ý tưởng website") đã GỠ HẲN ngày
// 30/10/2026: tốn phí gửi và Hugo Studio là dự án phi lợi nhuận. Chỉ còn thư
// chào mừng tài khoản — thư hệ thống, gửi đúng một lần.

/** Thư chào mừng (welcomeService gọi khi thành viên bật thông báo lần đầu). */
export async function sendWelcomeEmail(email) {
  const bio = await Bio.findOne({ email }, 'displayName').lean();
  const name = bio?.displayName || 'bạn';
  return sendCustomEmail(email, 'Chào mừng bạn đến với Hugo Studio', brandEmail({
    eyebrow: 'Tài khoản đã sẵn sàng',
    title: `Chào mừng ${name} đến với Hugo Studio`,
    body: '<p style="margin:0;">Thông báo của bạn đã bật. Từ giờ, mọi tin quan trọng — bảo mật, biến động ví JOY, kết quả hồ sơ — sẽ đến ngay trên máy của bạn. Bio, công cụ học tập và các ứng dụng thành viên luôn sẵn sàng để bạn quay lại đúng lúc cần.</p>',
    cta: { label: 'Mở Hugo Studio', href: `${APP_URL}/member` },
    reason: 'Thư tài khoản gửi một lần khi bạn kích hoạt thông báo Hugo Studio.',
  }));
}

// Link "Hủy đăng ký" trong các thư quảng cáo ĐÃ gửi trước 30/10/2026 vẫn phải
// bấm được — giữ lại bộ kiểm token cho /api/email/unsubscribe.
export function verifyUnsubscribeToken(token) {
  const payload = jwt.verify(token, JWT_SECRET);
  return payload?.purpose === 'marketing-unsubscribe' && payload.email ? payload.email : null;
}
