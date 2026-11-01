import mongoose from 'mongoose';

// Một người mua một vật phẩm đúng một lần (chỉ mục duy nhất chặn hai máy bấm cùng lúc).
const eduPurchaseSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'EduProduct', required: true },
  priceJoy: { type: Number, required: true },
}, { timestamps: true });
eduPurchaseSchema.index({ email: 1, productId: 1 }, { unique: true });

export default mongoose.models.EduPurchase || mongoose.model('EduPurchase', eduPurchaseSchema);
