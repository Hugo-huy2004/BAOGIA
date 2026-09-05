// Xóa TOÀN BỘ tiến trình học từ vựng của mọi người để bắt đầu lại (khi đổi cấu
// trúc khoá/cấp). KHÔNG đụng tới kho thẻ (VocabCard) — chỉ xóa hồ sơ + tiến độ
// cá nhân. Chạy: node server/scripts/reset-vocab-learners.mjs  (từ thư mục server)
import 'dotenv/config';
import mongoose from 'mongoose';
import VocabProfile from '../models/VocabProfile.js';
import VocabProgress from '../models/VocabProgress.js';

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
const a = await VocabProgress.deleteMany({});
const b = await VocabProfile.deleteMany({});
console.log(`✅ Đã xoá ${a.deletedCount} tiến độ + ${b.deletedCount} hồ sơ. Mọi người bắt đầu lại (chọn khoá → test xếp lớp).`);
await mongoose.disconnect();
