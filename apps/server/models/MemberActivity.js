import mongoose from 'mongoose';

/**
 * Nhịp dùng app của một thành viên (apps/server/services/memberActivity.js ghi).
 * Tách khỏi Bio: ghi rất thường xuyên, không cần qua hook mã hoá của Bio.
 */
const schema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  lastActiveAt: { type: Date, index: true },
  // Số lần hoạt động theo giờ VN: { "7": 12, "21": 30 } — để biết giờ quen.
  hours: { type: mongoose.Schema.Types.Mixed, default: {} },
  // 30 ngày (YYYY-MM-DD, giờ VN) gần nhất có mở app, cũ trước.
  days: { type: [String], default: [] },
  // Số lần dùng theo khu API ("vocab", "today", "joy"…).
  apps: { type: mongoose.Schema.Types.Mixed, default: {} },
  push: {
    sent: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    // Push liên tiếp không được đáp lại — càng cao càng gửi thưa.
    ignored: { type: Number, default: 0 },
    lastSentAt: Date,
  },
}, { timestamps: true, minimize: false });

export default mongoose.model('MemberActivity', schema);
