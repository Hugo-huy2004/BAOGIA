import mongoose from 'mongoose';

/**
 * Sổ lệnh: mỗi lần mua/bán một dòng — và dòng đó phải in lại được thành HOÁ
 * ĐƠN, nên lưu đủ TỪNG khoản phí chứ không chỉ tổng `fee`. Trước đây chỉ có
 * tổng, nên màn nhật ký không thể nói cho người học biết họ mất bao nhiêu vào
 * môi giới, bao nhiêu vào phí đổi đơn vị.
 */
const StockTradeSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },
    symbol: { type: String, required: true },
    side: { type: String, enum: ['buy', 'sell'], required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    fee: { type: Number, default: 0 },
    brokerage: { type: Number, default: 0 },
    creativeFee: { type: Number, default: 0 },
    conversionFee: { type: Number, default: 0 },
    // Đơn vị ví của người đặt lệnh LÚC ĐÓ: hoá đơn cũ phải đọc lại được đúng
    // như lúc in, kể cả sau này họ đổi đơn vị.
    walletCode: { type: String, default: '' },
    // `total` quy về đơn vị ví THEO TỶ GIÁ LÚC KHỚP. Không có nó, hoá đơn cũ
    // phải quy đổi lại bằng tỷ giá hôm nay và ra một con số ví chưa từng thấy.
    // 0 = lệnh cũ chưa lưu — client rơi về quy đổi sống.
    walletAmount: { type: Number, default: 0 },
    session: { type: String, default: '' },
    total: { type: Number, required: true },
    balanceAfter: { type: Number, default: 0 },
    realizedPL: { type: Number, default: 0 },
    at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

StockTradeSchema.index({ email: 1, at: -1 });

export default mongoose.models.StockTrade || mongoose.model('StockTrade', StockTradeSchema);
