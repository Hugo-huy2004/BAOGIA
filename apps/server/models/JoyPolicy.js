import mongoose from 'mongoose';

/**
 * Chính sách phát hành JOY — MỘT bản ghi duy nhất cho cả hệ thống.
 *
 * Vì sao cần: trước đây mọi mức thưởng là hằng số viết cứng trong mã. Muốn siết
 * hay nới lượng JOY phát ra thì phải sửa hàng chục con số rồi deploy — chậm, và
 * không có chỗ nào ghi lại "vì sao lúc đó quyết như vậy".
 *
 * Ở đây chỉ có MỘT núm vặn: `issuanceMultiplier`. Mọi khoản THƯỞNG từ hệ thống
 * nhân với nó trước khi vào ví. Tiêu JOY, chuyển giữa người dùng và điều chỉnh
 * của admin KHÔNG bị nhân — đó không phải phát hành.
 *
 * Mỗi lần đổi đều để lại một dòng trong `history` kèm số liệu lúc quyết, nên sau
 * này nhìn lại biết được quyết định dựa trên cái gì, không phải đoán.
 */
const decisionSchema = new mongoose.Schema({
  at: { type: Date, default: Date.now },
  /** 'increase' | 'decrease' | 'hold' */
  action: { type: String, required: true },
  from: { type: Number, required: true },
  to: { type: Number, required: true },
  /** Ai bấm: 'telegram_admin' | 'auto' | id admin. */
  decidedBy: { type: String, default: 'telegram_admin' },
  /** Ảnh chụp số liệu tại thời điểm quyết — để đối chiếu về sau. */
  snapshot: { type: mongoose.Schema.Types.Mixed, default: null },
  /** Đề xuất mà bot đưa ra lúc đó (có thể khác thứ admin bấm). */
  suggested: { type: String, default: '' },
}, { _id: false });

const schema = new mongoose.Schema({
  /** Khoá cố định — bảo đảm chỉ có đúng một bản ghi chính sách. */
  key: { type: String, default: 'global', unique: true, index: true },

  /**
   * Hệ số phát hành. 1.0 = như thiết kế gốc; 0.8 = phát ra ít hơn 20%.
   *
   * Chặn trong [0.5, 1.5]: ngoài khoảng đó thì phần thưởng lệch quá xa con số
   * ghi trong mô tả nhiệm vụ mà người dùng nhìn thấy, và họ sẽ thấy hệ thống
   * "nuốt lời" chứ không phải đang bình ổn.
   */
  issuanceMultiplier: { type: Number, default: 1, min: 0.5, max: 1.5 },

  /**
   * Công tắc cho vay TOÀN HỆ THỐNG. Tắt là không ai mở được lượt vay mới; các
   * khoản đang chạy vẫn phải trả như thường (khoá cửa vào, không xoá nợ của
   * người đã vào).
   *
   * Cần một nút như thế này cho những lúc phát hiện lỗ hổng hoặc quỹ JOY biến
   * động bất thường: chặn ngay trong một giây, thay vì đi sửa mã rồi deploy.
   */
  lending: {
    enabled: { type: Boolean, default: true },
    pausedReason: { type: String, default: '' },
    pausedBy: { type: String, default: '' },
    pausedAt: { type: Date, default: null },
  },

  /** Bước điều chỉnh mỗi lần bấm nút. */
  step: { type: Number, default: 0.1 },

  /** Lần gửi báo cáo tuần gần nhất — chống gửi trùng khi có nhiều process. */
  lastReportAt: { type: Date, default: null },
  lastReportKey: { type: String, default: '' },

  history: { type: [decisionSchema], default: [] },
}, { timestamps: true });

/** Bản ghi chính sách duy nhất, tự tạo lần đầu. */
schema.statics.current = async function current() {
  return this.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { key: 'global' } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
};

const JoyPolicy = mongoose.model('JoyPolicy', schema);
export default JoyPolicy;
