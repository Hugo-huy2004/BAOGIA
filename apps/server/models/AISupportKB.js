import mongoose from 'mongoose';

/**
 * Kho Tri Thức Tự Học của AI Support Butler Agent (AISupportKB).
 * Lưu lại các bài học được đúc kết tự động mỗi khi Super Admin (Boss)
 * tự tay trả lời các ticket phức tạp, giúp AI tự áp dụng cho các lượt sau.
 */
const AISupportKBSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true, index: true },
    keywords: { type: [String], default: [], index: true },
    pattern: { type: String, required: true },
    solution: { type: String, required: true },
    sourceTicketId: { type: String, default: '' },
    learnedFromAdmin: { type: String, default: 'admin' },
    usageCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.AISupportKB || mongoose.model('AISupportKB', AISupportKBSchema);
