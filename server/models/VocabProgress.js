import mongoose from 'mongoose';

// Trạng thái ôn tập RIÊNG của mỗi người cho mỗi thẻ (SM-2 rút gọn — xem
// services/vocabSrs.js). Một dòng cho mỗi (người, thẻ).
const VocabProgressSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'VocabCard', required: true, index: true },
  deck: { type: String, default: '' },
  reps: { type: Number, default: 0 },
  lapses: { type: Number, default: 0 },
  ease: { type: Number, default: 2.5 },
  intervalDays: { type: Number, default: 0 },
  status: { type: String, enum: ['new', 'learning', 'review', 'mastered'], default: 'new', index: true },
  dueAt: { type: Date, default: Date.now, index: true },
  lastReviewedAt: { type: Date, default: null },
}, { timestamps: true });

VocabProgressSchema.index({ email: 1, cardId: 1 }, { unique: true });
VocabProgressSchema.index({ email: 1, dueAt: 1 });

export default mongoose.model('VocabProgress', VocabProgressSchema);
