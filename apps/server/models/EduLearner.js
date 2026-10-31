import mongoose from 'mongoose';
import { EDU_DEFAULT_PREFS } from '../../../packages/shared/eduPrefs.js';

/**
 * Người học Education Hugo: cài đặt cá nhân + nhịp học trong ngày.
 * Tách khỏi Bio vì ghi thường xuyên (mỗi lần mở app, mỗi step qua).
 */
const schema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  prefs: { type: mongoose.Schema.Types.Mixed, default: () => ({ ...EDU_DEFAULT_PREFS }) },
  lastActiveAt: { type: Date, index: true },
  // Mục tiêu ngày: số step qua lần đầu trong ngày `day` (giờ VN).
  day: { type: String, default: '' },
  dayDone: { type: Number, default: 0 },
  // Chống gửi trùng: ngày đã nhắc học, ngày đã báo hạn tài khoản.
  remindedDay: { type: String, default: '' },
  expiryWarnedDay: { type: String, default: '' },
}, { timestamps: true, minimize: false });

schema.index({ 'prefs.reminder': 1, 'prefs.reminderHour': 1 });

export default mongoose.model('EduLearner', schema);
