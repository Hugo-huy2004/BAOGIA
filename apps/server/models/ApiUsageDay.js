import mongoose from 'mongoose';

// Lượt gọi API-m theo ngày (giờ Việt Nam) cho từng key, để vẽ biểu đồ 30 ngày.
// Tự xoá sau 120 ngày.
const ApiUsageDaySchema = new mongoose.Schema({
  code: { type: String, required: true },
  day: { type: String, required: true }, // YYYY-MM-DD
  qr: { type: Number, default: 0 },
  link: { type: Number, default: 0 },
  at: { type: Date, default: Date.now, expires: 120 * 86_400 },
}, { versionKey: false });
ApiUsageDaySchema.index({ code: 1, day: 1 }, { unique: true });
ApiUsageDaySchema.index({ day: 1 });

export default mongoose.models.ApiUsageDay || mongoose.model('ApiUsageDay', ApiUsageDaySchema);
