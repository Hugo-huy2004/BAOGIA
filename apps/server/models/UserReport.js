import mongoose from 'mongoose';

// Báo cáo người dùng từ hồ sơ công khai Education Hugo (/u/:code). Lưu kèm ẢNH CHỤP persona lúc
// báo cáo (biệt danh, giới thiệu) để admin xem đúng thứ bị báo, kể cả khi người kia sửa sau đó.
// Admin xử lý ở mục Dữ liệu (status) — không tự động khoá ai.
const schema = new mongoose.Schema({
  reporterEmail: { type: String, required: true, index: true },
  targetEmail: { type: String, required: true, index: true },
  targetCode: { type: String, default: '' },
  reason: { type: String, enum: ['nickname', 'avatar', 'intro', 'harassment', 'cheating', 'other'], required: true },
  note: { type: String, default: '' },
  snapshot: { nickname: String, intro: String },
  status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending', index: true },
}, { timestamps: true });

schema.index({ reporterEmail: 1, targetEmail: 1, status: 1 });

export default mongoose.models.UserReport || mongoose.model('UserReport', schema);
