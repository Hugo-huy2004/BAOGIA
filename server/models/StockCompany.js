import mongoose from 'mongoose';

/**
 * Một công ty niêm yết trên sàn ảo Hugo.
 *
 * Giá KHÔNG phải số ngẫu nhiên: mỗi phiên, giá đổi theo hoạt động thật của
 * chính mảng đó trong portal (xem services/stockMarket.js). Đó là bài học đầu
 * tiên của sàn này — cổ phiếu lên xuống vì công ty làm ăn ra sao, không vì máy
 * tung xúc xắc.
 */
const StockCompanySchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    sector: { type: String, default: '' },
    description: { type: String, default: '' },

    sharesOutstanding: { type: Number, required: true },
    basePrice: { type: Number, required: true },
    price: { type: Number, required: true },
    prevPrice: { type: Number, default: 0 },

    // Mức dao động riêng của từng mã (beta). Cao = lời nhanh, lỗ cũng nhanh.
    volatility: { type: Number, default: 0.05 },
    // Cổ tức mỗi phiên, tính theo % giá. 0 = không chia.
    dividendRate: { type: Number, default: 0 },

    // Ảnh chụp phiên gần nhất: vì sao giá đổi — để màn hình giải thích được.
    lastSignal: {
      activity: { type: Number, default: 0 },
      average: { type: Number, default: 0 },
      surprise: { type: Number, default: 0 },
      market: { type: Number, default: 0 },
      move: { type: Number, default: 0 },
      sessionKey: { type: String, default: '' },
    },

    history: [
      {
        _id: false,
        at: { type: Date, required: true },
        price: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.StockCompany || mongoose.model('StockCompany', StockCompanySchema);
