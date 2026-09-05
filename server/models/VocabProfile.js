import mongoose from 'mongoose';

// Hồ sơ học từ vựng của mỗi người: cổng test đầu vào (chưa test thì chưa mở
// khoá học) và test đầu ra (đạt là hoàn tất khoá).
const VocabProfileSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  // Khoá học: 'simplified' (Giản thể · HSK) hoặc 'traditional' (Phồn thể · TOCFL).
  track: { type: String, enum: ['simplified', 'traditional'], default: null },
  placed: { type: Boolean, default: false },
  level: { type: String, default: '' }, // bậc đã xếp (theo hệ deck của track)
  placementScore: { type: Number, default: 0 },
  // Bậc cao nhất đã VƯỢT ở test xếp lớp (đạt ≥80%): các bậc ≤ đây tính 100%,
  // không bắt học lại; bắt đầu học từ bậc kế tiếp. '' = chưa vượt bậc nào.
  testedOutThrough: { type: String, default: '' },
  placementAt: { type: Date, default: null },
  startedAt: { type: Date, default: null },   // lúc test đầu vào xong = bắt đầu học
  completed: { type: Boolean, default: false },
  exitScore: { type: Number, default: 0 },
  completedAt: { type: Date, default: null },
  // Chuỗi ngày + mục tiêu ngày — động lực giữ thói quen.
  streak: { type: Number, default: 0 },
  lastStudyDay: { type: String, default: '' },
  reviewsToday: { type: Number, default: 0 },
  dailyGoal: { type: Number, default: 20 },
  goalDays: { type: Number, default: 30 },   // mục tiêu "1 tháng có kết quả"
  essayAttempts: { type: Number, default: 0 }, // lượt thi viết (lần 2+ tốn JOY)
  // Theo dõi tốc độ học → phát hiện người học nhanh để mời vượt cấp.
  reviews: { type: Number, default: 0 },
  easyReviews: { type: Number, default: 0 },   // chấm "Dễ"
  againReviews: { type: Number, default: 0 },  // chấm "Quên"
}, { timestamps: true });

export default mongoose.model('VocabProfile', VocabProfileSchema);
