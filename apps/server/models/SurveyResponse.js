import mongoose from 'mongoose';

/**
 * Một câu trả lời khảo sát. Mỗi dòng là một câu, không phải một đợt — gom cả
 * đợt vào một dòng thì không tổng hợp được theo ứng dụng hay theo khía cạnh mà
 * không bóc lại JSON.
 *
 * `appId`, `facet`, `negative` chép lại từ bộ câu hỏi lúc trả lời chứ không tra
 * ngược khi đọc báo cáo: bộ câu hỏi có thể đổi, nhưng câu trả lời của năm ngoái
 * phải giữ nguyên ý nghĩa nó có lúc được hỏi.
 */
const SurveyResponseSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  month: { type: String, required: true },          // "2026-09"
  questionId: { type: String, required: true },     // "fit.need:vocab"
  templateId: { type: String, required: true },
  appId: { type: String, default: '', index: true },// rỗng = câu về cả hệ thống
  facet: { type: String, required: true, index: true },
  negative: { type: Boolean, default: false },
  answer: { type: String, enum: ['yes', 'no', 'unsure'], required: true },
  askedAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

// Một người một câu một lần — chính là luật "không lặp trong năm", chốt ở tầng
// database để không nhánh nào lách được.
SurveyResponseSchema.index({ email: 1, questionId: 1 }, { unique: true });
SurveyResponseSchema.index({ email: 1, month: 1 });

export default mongoose.model('SurveyResponse', SurveyResponseSchema);
