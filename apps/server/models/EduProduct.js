import mongoose from 'mongoose';

/**
 * Sản phẩm Cửa hàng Education Hugo (mua bằng JOY). Admin quản lý ở tab "Cửa hàng Edu".
 * Hiện chỉ có vật phẩm sưu tầm (kind 'collectible'): mua một lần, hiện trong Túi đồ.
 * stock null = không giới hạn.
 */
const text = { vi: { type: String, required: true }, en: String, zh: String };

const eduProductSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, trim: true, maxlength: 40 },
  kind: { type: String, enum: ['collectible'], default: 'collectible' },
  name: text,
  description: { vi: String, en: String, zh: String },
  image: { type: String, default: '/edu/cast-1.svg', maxlength: 200 },
  priceJoy: { type: Number, required: true, min: 1, max: 1_000_000 },
  stock: { type: Number, default: null, min: 0 },
  sold: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  sort: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.EduProduct || mongoose.model('EduProduct', eduProductSchema);
