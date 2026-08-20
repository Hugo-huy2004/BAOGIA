import mongoose from 'mongoose';

/**
 * Một điểm tỷ giá JOY — mỗi GIỜ một bản ghi, giữ luôn dữ liệu thô đã dùng để
 * tính.
 *
 * Giữ đầu vào cạnh kết quả là cố ý: khi ai đó hỏi "sao Mira tụt 2%" thì trả lời
 * được bằng chính bản ghi đó, không phải dựng lại phép tính từ trí nhớ. Bản ghi
 * cũng là bộ nhớ đệm: trong một giờ chỉ tính một lần từ dòng JOY nội bộ.
 */
const JoyRateSchema = new mongoose.Schema({
  // YYYY-MM-DDTHH theo giờ UTC — khoá tự nhiên, chống tính trùng trong một giờ.
  //
  // Nhịp GIỜ chứ không phải ngày: biểu đồ tỷ giá cần đường đi, mà một điểm mỗi
  // ngày thì phải chờ một tuần mới thành hình. Dòng JOY nội bộ được chốt theo
  // phiên giờ để tạo chuyển động thật, không phải nhiễu bịa ra.
  key: { type: String, required: true, unique: true, index: true },
  // Chỉ khai index TTL ở cuối schema. `index: true` tại đây tạo thêm một index
  // thường trùng khoá và Mongoose cảnh báo mỗi lần tiến trình khởi động.
  at: { type: Date, required: true },

  // Hệ số đang có hiệu lực: { vi: 24.6, en: 1.02, ... }
  factors: { type: Map, of: Number, required: true },

  // Đầu vào 1 — thu nhập JOY trung bình một ngày của một người, tính chung và
  // tính riêng theo từng đơn vị.
  income: {
    overall: { type: Number, default: 0 },
    byDenom: { type: Map, of: Number, default: () => ({}) },
    members: { type: Number, default: 0 },
  },

  // Tín hiệu và dòng tiền dùng để giải thích vì sao một tỷ giá đổi. Trước đây
  // service có ghi hai khối này nhưng schema không khai báo nên Mongoose âm
  // thầm loại bỏ, khiến bản ghi không còn dữ liệu để đối soát.
  signals: {
    type: Map,
    of: new mongoose.Schema({
      income: { type: Number, default: 0 },
      feeShare: { type: Number, default: 0 },
      netFlow: { type: Number, default: 0 },
      movement: { type: Number, default: 0 },
    }, { _id: false }),
    default: () => ({}),
  },
  flows: {
    inflow: { type: Number, default: 0 },
    outflow: { type: Number, default: 0 },
    feeFlow: { type: Number, default: 0 },
    feeShare: { type: Number, default: 0 },
    netFlow: { type: Number, default: 0 },
  },

  createdAt: { type: Date, default: Date.now },
});

// Điểm tỷ giá chỉ để vẽ đường; giữ 90 ngày là quá đủ cho mọi khung thời gian
// trên màn hình, và tự dọn để collection không phình mãi.
JoyRateSchema.index({ at: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model('JoyRate', JoyRateSchema);
