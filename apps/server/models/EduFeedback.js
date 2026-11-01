import mongoose from 'mongoose';

/**
 * Bài đánh giá Education Hugo (5 câu chấm sao + 1 câu góp ý). Lưu VĨNH VIỄN: admin xem ở tab
 * "Đánh giá", người học xem lại ở Hồ sơ > Lịch sử phản hồi. Chỉ xoá khi tài khoản bị xoá.
 * Khoá câu hỏi nằm ở packages/shared/eduFeedback.js — đổi câu thì thêm khoá mới, đừng đổi nghĩa khoá cũ.
 */
const schema = new mongoose.Schema({
  email: { type: String, required: true, index: true, lowercase: true, trim: true },
  ratings: { type: Map, of: Number, required: true },
  comment: { type: String, default: '', maxlength: 2000 },
  lang: { type: String, default: 'vi' },
  source: { type: String, enum: ['mail', 'app'], default: 'app' },
}, { timestamps: true });

export default mongoose.models.EduFeedback || mongoose.model('EduFeedback', schema);
