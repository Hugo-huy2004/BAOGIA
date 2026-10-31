import mongoose from 'mongoose';

const ScheduledPushSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true
  },
  feature: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  scheduledFor: {
    type: Date,
    required: true,
    index: true
  },
  // Push đã soạn xong, chỉ chờ khung giờ vàng (pushGuard). Có payload thì gửi
  // nguyên văn, không gọi AI soạn lại.
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  sent: {
    type: Boolean,
    default: false,
    index: true
  }
}, { timestamps: true });

ScheduledPushSchema.index({ sent: 1, scheduledFor: 1 });

export default mongoose.model('ScheduledPush', ScheduledPushSchema);
