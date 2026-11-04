import mongoose from 'mongoose';

// Liên kết giữa một tài khoản Hugo Studio và QR Hugo (qr.hugowishpax.studio).
// Mỗi tài khoản đúng MỘT liên kết (email unique). Key = HS-<mã thành viên>-<bí mật>;
// chỉ lưu sha256 của phần bí mật, key đầy đủ chỉ hiện một lần lúc tạo.
const QrApiLinkSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true }, // Bio.referralCode
  secretHash: { type: String, required: true },
  connectedAt: { type: Date, default: null },  // lần đầu QR Hugo xác nhận key
  periodStart: { type: Date, default: null },
  periodEnd: { type: Date, default: null },
  used: { type: Number, default: 0 },          // lượt trong chu kỳ 30 ngày hiện tại
  totalUsed: { type: Number, default: 0 },
  lastUsedAt: { type: Date, default: null },
  logs: [{ _id: false, at: Date, level: { type: String, enum: ['info', 'error'] }, msg: String }],
}, { timestamps: true });

export default mongoose.models.QrApiLink || mongoose.model('QrApiLink', QrApiLinkSchema);
