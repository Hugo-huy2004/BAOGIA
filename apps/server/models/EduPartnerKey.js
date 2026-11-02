import mongoose from 'mongoose';

// Key đối tác Education Hugo (thư viện React). Chỉ lưu BĂM SHA-256 của key — key gốc
// chỉ xuất hiện một lần trong thư gửi đối tác. Hết hạn hoặc bị thu hồi là hết dùng.
const eduPartnerKeySchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  keyHash: { type: String, required: true, unique: true },
  last4: { type: String, required: true },
  // Tên miền được phép gọi (Origin). Rỗng = mọi nơi (chỉ nên dùng khi thử nghiệm).
  origins: { type: [String], default: [] },
  note: { type: String, default: '', maxlength: 200 },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null },
  createdBy: String,
  lastUsedAt: Date,
  uses: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.EduPartnerKey || mongoose.model('EduPartnerKey', eduPartnerKeySchema);
