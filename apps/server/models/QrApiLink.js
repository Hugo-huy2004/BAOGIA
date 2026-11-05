import mongoose from 'mongoose';

// API-m: liên kết giữa một tài khoản Hugo Studio và các dịch vụ API của Hugo
// (QR Hugo qr.hugowishpax.studio, Link Hugo link.hugowishpax.studio).
// Mỗi tài khoản đúng MỘT key dùng chung cho mọi dịch vụ (email unique). Key = HS-<mã thành viên>-<bí mật>;
// chỉ lưu sha256 của phần bí mật, key đầy đủ chỉ hiện một lần lúc tạo.
// Tên model giữ "QrApiLink" để không phải đổi tên collection đang có dữ liệu.
export const API_SERVICES = Object.freeze(['qr', 'link']);

const QrApiLinkSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true }, // Bio.referralCode
  secretHash: { type: String, required: true },
  disabled: { type: Boolean, default: false },  // admin khoá key (mọi dịch vụ từ chối)
  connectedAt: { type: Date, default: null },  // lần đầu một dịch vụ xác nhận key
  periodStart: { type: Date, default: null },
  periodEnd: { type: Date, default: null },
  used: { type: Number, default: 0 },          // lượt trong chu kỳ 30 ngày hiện tại (mọi dịch vụ cộng lại)
  totalUsed: { type: Number, default: 0 },
  usage: { qr: { type: Number, default: 0 }, link: { type: Number, default: 0 } }, // tổng theo dịch vụ
  lastUsedAt: { type: Date, default: null },
  logs: [{ _id: false, at: Date, level: { type: String, enum: ['info', 'error'] }, msg: String, service: String }],
  // Thứ người dùng đã tạo qua API (chỉ Link Hugo: mã ngắn + link gốc — QR không lưu nội dung).
  items: [{ _id: false, at: Date, service: String, ref: String, target: String }],
}, { timestamps: true });

export default mongoose.models.QrApiLink || mongoose.model('QrApiLink', QrApiLinkSchema);
