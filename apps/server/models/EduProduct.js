import mongoose from 'mongoose';

/**
 * Sản phẩm Cửa hàng Education Hugo (mua bằng JOY). Admin quản lý ở tab "Cửa hàng Edu".
 * Mỗi loại có tác dụng thật, áp dụng ngay khi mua (services/eduStore.js).
 * stock null = không giới hạn.
 */
const text = { vi: { type: String, required: true }, en: String, zh: String };

const eduProductSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, trim: true, maxlength: 40 },
  // badge: mua một lần, tự đeo lên thẻ · xp_boost: nhân đôi XP `value` giờ · streak_shield: +`value` khiên lửa.
  // 'collectible' là tên cũ của badge (bản đầu).
  kind: { type: String, enum: ['badge', 'collectible', 'xp_boost', 'streak_shield'], default: 'badge' },
  value: { type: Number, default: 1, min: 1, max: 720 },
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
