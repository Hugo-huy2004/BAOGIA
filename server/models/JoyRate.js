import mongoose from 'mongoose';

/**
 * Một điểm tỷ giá JOY — mỗi GIỜ một bản ghi, giữ luôn dữ liệu thô đã dùng để
 * tính.
 *
 * Giữ đầu vào cạnh kết quả là cố ý: khi ai đó hỏi "sao Mira tụt 2%" thì trả lời
 * được bằng chính bản ghi đó, không phải dựng lại phép tính từ trí nhớ. Bản ghi
 * cũng là bộ nhớ đệm: trong một giờ chỉ tính một lần, và giá vàng chỉ gọi ra
 * ngoài một lần mỗi giờ.
 */
const JoyRateSchema = new mongoose.Schema({
  // YYYY-MM-DDTHH theo giờ UTC — khoá tự nhiên, chống tính trùng trong một giờ.
  //
  // Nhịp GIỜ chứ không phải ngày: biểu đồ tỷ giá cần đường đi, mà một điểm mỗi
  // ngày thì phải chờ một tuần mới thành hình. Giá vàng nhúc nhích liên tục nên
  // nhịp giờ có chuyển động thật, không phải nhiễu bịa ra.
  key: { type: String, required: true, unique: true, index: true },
  at: { type: Date, required: true, index: true },

  // Hệ số đang có hiệu lực: { vi: 24.6, en: 1.02, ... }
  factors: { type: Map, of: Number, required: true },

  // Đầu vào 1 — thu nhập JOY trung bình một ngày của một người, tính chung và
  // tính riêng theo từng đơn vị.
  income: {
    overall: { type: Number, default: 0 },
    byDenom: { type: Map, of: Number, default: () => ({}) },
    members: { type: Number, default: 0 },
  },

  // Đầu vào 2 — giá vàng quốc tế (USD/oz) và mức trung bình 30 ngày gần nhất.
  gold: {
    price: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
    drift: { type: Number, default: 0 },
    stale: { type: Boolean, default: false },
  },

  createdAt: { type: Date, default: Date.now },
});

// Điểm tỷ giá chỉ để vẽ đường; giữ 90 ngày là quá đủ cho mọi khung thời gian
// trên màn hình, và tự dọn để collection không phình mãi.
JoyRateSchema.index({ at: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model('JoyRate', JoyRateSchema);
