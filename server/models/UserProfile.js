import mongoose from 'mongoose';

// Per-user "chân dung số" (User Understanding Layer). Built incrementally from
// behaviour signals (posts / likes / comments / searches / survey answers) — no
// model training, just weighted interest counters + an activity-hour histogram,
// plus an optional interest embedding for personalised ranking.
const UserProfileSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  // topic -> weight (decayed over time so recent interest counts more)
  interests: { type: Map, of: Number, default: {} },
  // Embedding of the user's top interests (for cosine ranking of the feed).
  interestEmbedding: { type: [Number], default: [], select: false },
  interestEmbeddingAt: { type: Date },
  // Histogram of activity by hour-of-day (0..23) → best time to notify.
  activeHours: { type: [Number], default: () => new Array(24).fill(0) },
  // Nhật ký dùng ứng dụng — đếm theo NGÀY, không theo lượt mở (xem
  // services/surveyService.js). Sống ở đây chứ không thành collection riêng:
  // nó là một tín hiệu hành vi nữa của chính chân dung này, và chỉ có một dòng
  // cho mỗi người. Khảo sát định kỳ dựa vào nó để không bao giờ hỏi ai về ứng
  // dụng họ chưa từng mở.
  appUse: { type: Map, of: Number, default: {} },     // appId → số ngày đã dùng
  appUseAt: { type: Map, of: Date, default: {} },     // appId → ngày dùng gần nhất
  engagementCount: { type: Number, default: 0 },
  lastSignalAt: { type: Date },
  // Thư giới thiệu/gợi ý dịch vụ là marketing, không phải thư hệ thống. Mặc
  // định tắt và chỉ cron gửi sau khi thành viên tự bật ở cài đặt.
  marketing: {
    optedInAt: { type: Date, default: null },
    optedOutAt: { type: Date, default: null },
    lastCampaignAt: { type: Date, default: null },
    lastCampaignKey: { type: String, default: '' },
  },
}, { timestamps: true });

export default mongoose.model('UserProfile', UserProfileSchema);
