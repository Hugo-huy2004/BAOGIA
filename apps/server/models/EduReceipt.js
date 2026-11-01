import mongoose from 'mongoose';

// Biên lai Cửa hàng Edu — lưu vĩnh viễn để đối soát (mã cũng nằm trong refId của JoyLedger).
const eduReceiptSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  email: { type: String, required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'EduProduct' },
  slug: String,
  name: { vi: String, en: String, zh: String },
  kind: String,
  value: Number,
  priceJoy: { type: Number, required: true },
  balanceBefore: Number,
  balanceAfter: Number,
}, { timestamps: true });

export default mongoose.models.EduReceipt || mongoose.model('EduReceipt', eduReceiptSchema);
