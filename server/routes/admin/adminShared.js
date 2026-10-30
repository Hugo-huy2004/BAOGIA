/**
 * Phần dùng chung của các route admin (hàm phụ, limiter, hằng số). Tách từ
 * adminRoutes.js cũ — mỗi thứ chỉ có MỘT bản ở đây nên các router con dùng chung
 * trạng thái (bộ đếm limiter, cache) như khi còn chung một tệp.
 */
import fs from 'fs/promises';
import path from 'path';
import AdminAuditLog from '../../models/AdminAuditLog.js';
import { CODER_STAGE_SEQUENCE } from '../../../shared/coderProgression.js';
import { fileURLToPath } from 'url';


// Thư mục của adminRoutes.js gốc: đường dẫn tương đối cũ ('../../public') giữ nguyên nghĩa.
export const __dirname = path.dirname(fileURLToPath(new URL('../adminRoutes.js', import.meta.url)));

export async function getDirSize(dirPath) {
  let size = 0;
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        size += await getDirSize(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        size += stats.size;
      }
    }
  } catch {
    // Ignore errors for missing directories
  }
  return size;
}

export const CODER_STEP_COUNT = CODER_STAGE_SEQUENCE.at(-1).to;

/**
 * Ghi một dòng nhật ký kiểm toán quản trị.
 *
 * LỖI ĐÃ SỬA 2026-09-23: hàm này từng ghi `adminEmail`, `targetUserId`,
 * `targetUserEmail` và `metadata` — KHÔNG trường nào trong số đó có trong
 * `AdminAuditLog` schema. Mongoose ở chế độ strict vứt lặng lẽ trường lạ, nên
 * mọi dòng nhật ký do 15 chỗ gọi sinh ra đều có `targetEmail` RỖNG: sổ kiểm
 * toán ghi được "ai làm gì" nhưng mất sạch "làm lên ai". Nay ánh xạ đúng tên
 * trường, và phần dư (targetUserId, metadata) gộp vào `details` thay vì rơi
 * xuống đất.
 *
 * Đổi chữ ký thì phải đổi cả `AdminAuditLog.js`, đừng thêm trường mới ở đây rồi
 * tưởng nó được lưu.
 */
export async function logAdminAuditAction(req, action, targetUserId, targetUserEmail, details, metadata = {}) {
  try {
    const AdminAuditLog = (await import('../../models/AdminAuditLog.js')).default;
    await AdminAuditLog.create({
      adminId: String(req.admin?.id || 'admin'),
      adminUsername: req.admin?.id || 'admin',
      action,
      targetEmail: targetUserEmail || '',
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      details: { note: details, targetUserId: targetUserId ? String(targetUserId) : undefined, ...metadata },
    });
  } catch (err) {
    console.error('Failed to log admin audit action:', err);
  }
}
