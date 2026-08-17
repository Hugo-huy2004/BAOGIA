import mongoose from 'mongoose';

/**
 * Ghi vết các công việc tự động của Trợ lý AI Support Admin (AI_Support_Agent).
 * Đánh dấu `reportedToAdmin: false` để tự động gom lại và chủ động báo cáo
 * cho Super Admin ngay khi đăng nhập vào hệ thống.
 */
const AISupportLogSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      enum: ['ticket_reply', 'location_unlock', 'joy_refund', 'flag_spam', 'escalate'],
      required: true,
      index: true,
    },
    targetEmail: { type: String, required: true, index: true },
    ticketId: { type: String, default: '' },
    summary: { type: String, required: true },
    joyAmount: { type: Number, default: 0 },
    reportedToAdmin: { type: Boolean, default: false, index: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

AISupportLogSchema.index({ reportedToAdmin: 1, createdAt: -1 });

export default mongoose.models.AISupportLog || mongoose.model('AISupportLog', AISupportLogSchema);
