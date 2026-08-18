import mongoose from 'mongoose';

/**
 * Số cổ phiếu một thành viên đang nắm của một mã.
 *
 * `avgCost` là GIÁ VỐN BÌNH QUÂN — mua thêm ở giá khác thì giá vốn được tính
 * lại theo bình quân gia quyền, đúng cách sàn thật tính. Lãi/lỗ luôn đo từ con
 * số này chứ không phải từ giá lần mua gần nhất.
 */
const StockPositionSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },
    symbol: { type: String, required: true, index: true },
    quantity: { type: Number, default: 0 },
    avgCost: { type: Number, default: 0 },
    // Lãi/lỗ ĐÃ CHỐT (chỉ ghi nhận khi bán) và cổ tức đã nhận.
    realizedPL: { type: Number, default: 0 },
    dividendReceived: { type: Number, default: 0 },
  },
  { timestamps: true }
);

StockPositionSchema.index({ email: 1, symbol: 1 }, { unique: true });

export default mongoose.models.StockPosition || mongoose.model('StockPosition', StockPositionSchema);
