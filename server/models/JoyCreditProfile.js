import mongoose from 'mongoose';

/**
 * Hồ sơ tín dụng JOYlater — một người một dòng.
 *
 * ── VÌ SAO KHÔNG NHÉT VÀO BIO ───────────────────────────────────────────────
 * Bio đã là một tệp gần một nghìn dòng chứa mọi thứ về một người. Hồ sơ tín
 * dụng có vòng đời riêng (nộp → duyệt → xét lại mỗi tuần), có lịch sử riêng, và
 * bị đọc bởi cron hằng tuần trên toàn bộ người dùng. Để riêng thì truy vấn tuần
 * chỉ đọc đúng bảng này thay vì kéo cả Bio.
 *
 * `joyLoan` VẪN ở Bio — đó là khoản đang chạy, luôn đọc cùng số dư ví.
 */
const EvaluationSchema = new mongoose.Schema({
  at: { type: Date, default: Date.now },
  score: { type: Number, default: 0 },
  limit: { type: Number, default: 0 },
  netDaily: { type: Number, default: 0 },
  reasons: { type: [String], default: [] },
}, { _id: false });

const JoyCreditProfileSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },

  // pending  — đã nộp, chờ xét (chỉ khi phải đưa admin)
  // approved — có hạn mức
  // rejected — chưa đạt; xét lại hằng tuần, KHÔNG phải nộp lại
  // barred   — đã quỵt nợ, không cấp nữa
  status: { type: String, enum: ['none', 'pending', 'approved', 'rejected', 'barred'], default: 'none', index: true },

  appliedAt: { type: Date, default: null },
  // Thành viên nộp MỘT lần. Trường này để phân biệt "chưa từng nộp" với "đã nộp
  // và đang bị từ chối" — hai trạng thái phải hiện hai màn hình khác nhau.
  decidedAt: { type: Date, default: null },

  score: { type: Number, default: 0 },
  limit: { type: Number, default: 0, min: 0 },
  netDaily: { type: Number, default: 0 },
  reasons: { type: [String], default: [] },

  loansRepaid: { type: Number, default: 0, min: 0 },
  loansDefaulted: { type: Number, default: 0, min: 0 },

  // Khoá kỳ xét gần nhất ("2026-W38"). Chặn xét hai lần trong một tuần khi có
  // nhiều process cùng chạy cron — cùng cách `lastReportKey` chặn báo cáo trùng.
  lastEvaluatedKey: { type: String, default: '' },
  lastEvaluatedAt: { type: Date, default: null },

  // Mười hai kỳ gần nhất, để người dùng thấy hạn mức của mình đi lên hay xuống.
  history: { type: [EvaluationSchema], default: [] },
}, { timestamps: true });

export default mongoose.model('JoyCreditProfile', JoyCreditProfileSchema);
