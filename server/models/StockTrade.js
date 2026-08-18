import mongoose from 'mongoose';

/** Sổ lệnh: mỗi lần mua/bán một dòng, để người học xem lại mình đã làm gì. */
const StockTradeSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },
    symbol: { type: String, required: true },
    side: { type: String, enum: ['buy', 'sell'], required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    fee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    realizedPL: { type: Number, default: 0 },
    at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

StockTradeSchema.index({ email: 1, at: -1 });

export default mongoose.models.StockTrade || mongoose.model('StockTrade', StockTradeSchema);
