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
  // Chuỗi lửa (packages/shared/eduStreak.js): ngày học, ngày đóng băng/phá băng,
  // mốc đã thưởng. `streakRev` tăng mỗi lần ghi — ghi có điều kiện để hai máy
  // cùng nộp bài không cộng đôi chuỗi hay thưởng đôi.
  streak: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  streakRev: { type: Number, default: 0 },
  lastCallDay: { type: String, default: '' },
  frozenNoticeDay: { type: String, default: '' },
  // Ngày ôn lại gần nhất của từng step đã qua — ôn lại chỉ giữ lửa mỗi 7 ngày/step.
  reviewedOn: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  // Bài nhỏ đã học của từng step: { step3: [0, 1] } (packages/courses/coding/lessons.js).
  lessonsDone: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  // Bạn bè + thi đua tuần (services/eduSocial.js): mã bạn 6 ký tự, danh sách mã đang
  // theo dõi, XP của tuần ISO `xpWeek` (giờ VN) — chỉ máy chủ cộng sau khi chấm bài.
  friendCode: { type: String },
  // Biệt danh bắt buộc để có tên trên bảng thi đua (packages/persona/nickname.js) — không dùng tên thật.
  nickname: { type: String, default: '' },
  following: { type: [String], default: [] },
  xpWeek: { type: String, default: '' },
  xpWeekly: { type: Number, default: 0 },
}, { timestamps: true, minimize: false });

schema.index({ 'prefs.reminder': 1, 'prefs.reminderHour': 1 });
schema.index({ friendCode: 1 }, { unique: true, partialFilterExpression: { friendCode: { $type: 'string' } } });
schema.index({ xpWeek: 1, xpWeekly: -1 });

export default mongoose.model('EduLearner', schema);
