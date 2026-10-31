import mongoose from 'mongoose';

/**
 * Góp ý của học viên về một bước cụ thể trong bài học.
 *
 * Lưu lại chứ không chỉ bắn sang Telegram: tin nhắn Telegram trôi đi, còn muốn
 * biết "bước nào bị góp ý nhiều nhất" thì phải có bảng để đếm. Đây là tín hiệu
 * chất lượng giáo trình đáng giá nhất — người học nói đúng lúc họ vấp.
 */
const LessonFeedbackSchema = new mongoose.Schema(
  {
    memberEmail: { type: String, required: true, index: true, lowercase: true, trim: true },
    lessonId: { type: String, required: true, index: true, maxlength: 40 },
    // Bước thứ mấy trong bài, và bước đó thuộc loại gì (read/code/do/warn/quiz).
    stepIndex: { type: Number, required: true, min: 0, max: 200 },
    stepKind: { type: String, default: '', maxlength: 20 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: ['open', 'handled'], default: 'open', index: true },
  },
  { timestamps: true },
);

LessonFeedbackSchema.index({ lessonId: 1, stepIndex: 1, createdAt: -1 });

export default mongoose.models.LessonFeedback
  || mongoose.model('LessonFeedback', LessonFeedbackSchema);
