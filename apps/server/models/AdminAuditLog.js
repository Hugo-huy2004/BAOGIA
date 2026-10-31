import mongoose from 'mongoose';

/**
 * Nhật ký kiểm toán thao tác Quản trị (Admin Audit Log).
 * Ghi vết toàn bộ hành động nhạy cảm của Admin (đăng nhập, sửa số dư JOY,
 * khóa/mở khóa thành viên, sửa dữ liệu dự án) để chống lạm quyền và kiểm tra an ninh.
 */
const AdminAuditLogSchema = new mongoose.Schema(
  {
    adminId: { type: String, required: true, index: true },
    adminUsername: { type: String, default: 'admin' },
    action: { type: String, required: true, index: true }, // 'login' | 'adjust_joy' | 'block_user' | 'unblock_user' | 'update_movie' | 'delete_movie'
    targetEmail: { type: String, default: '', index: true },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

AdminAuditLogSchema.index({ createdAt: -1 });

export default mongoose.models.AdminAuditLog || mongoose.model('AdminAuditLog', AdminAuditLogSchema);
