import mongoose from 'mongoose';

// Kháng nghị mở khoá tự nguyện: ảnh + vị trí người dùng TỰ gửi để chứng minh
// chính chủ. Dữ liệu nhạy cảm → TTL 7 ngày tự xoá bản ghi; ảnh trên Cloudinary
// được gỡ ngay khi Boss quyết (xem cb_appeal_* trong telegramWebhookRoutes).
const SecurityAppealSchema = new mongoose.Schema({
  caseId: { type: String, default: '', index: true },
  email: { type: String, required: true, index: true },
  imageUrl: { type: String, default: '' },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  accuracy: { type: Number, default: null },
  ip: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  decidedBy: { type: String, default: '' },
  decidedAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

export default mongoose.model('SecurityAppeal', SecurityAppealSchema);
