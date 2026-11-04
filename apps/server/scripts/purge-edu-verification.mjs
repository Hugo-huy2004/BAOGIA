/**
 * Gỡ xác minh HSSV (04/11/2026): ai cũng tạo được tài khoản, hạn dùng chỉ còn `expiresAt`.
 *
 *   node apps/server/scripts/purge-edu-verification.mjs           # chạy thử: chỉ đếm
 *   node apps/server/scripts/purge-edu-verification.mjs --apply   # ghi thật (không hoàn tác được)
 *
 * 1. Tài khoản chưa xác minh đang theo hạn dùng thử: chép trialExpiresAt sang expiresAt
 *    (giữ đúng hạn hiện tại, không ai tự dưng được thêm ngày).
 * 2. status 'pending' / 'rejected' (trạng thái của xét duyệt) → 'active'.
 * 3. Xoá isEduVerified, trialExpiresAt, verificationRequest (tên thật, trường, mã HS, SĐT Zalo).
 * 4. Xoá collection verificationevidences (ảnh thẻ HSSV).
 */
import 'dotenv/config';
import mongoose from 'mongoose';

const apply = process.argv.includes('--apply');
const { MONGODB_URI } = process.env;
if (!MONGODB_URI) {
  console.error('Thiếu MONGODB_URI (apps/server/.env).');
  process.exit(1);
}

await mongoose.connect(MONGODB_URI);
const db = mongoose.connection.db;
const bios = db.collection('bios');
console.log(apply ? 'GHI THẬT' : 'CHẠY THỬ (thêm --apply để ghi)');

const onTrial = { isEduVerified: { $ne: true }, trialExpiresAt: { $type: 'date' } };
const nTrial = await bios.countDocuments(onTrial);
if (apply && nTrial) await bios.updateMany(onTrial, [{ $set: { expiresAt: '$trialExpiresAt' } }]);
console.log(`- ${nTrial} tài khoản dùng thử: expiresAt ← trialExpiresAt`);

const reviewStatus = { status: { $in: ['pending', 'rejected'] } };
const nStatus = await bios.countDocuments(reviewStatus);
if (apply && nStatus) await bios.updateMany(reviewStatus, { $set: { status: 'active' } });
console.log(`- ${nStatus} tài khoản pending/rejected → active`);

const legacy = { $or: ['isEduVerified', 'trialExpiresAt', 'verificationRequest'].map((k) => ({ [k]: { $exists: true } })) };
const nLegacy = await bios.countDocuments(legacy);
if (apply && nLegacy) await bios.updateMany(legacy, { $unset: { isEduVerified: '', trialExpiresAt: '', verificationRequest: '' } });
console.log(`- ${nLegacy} hồ sơ có trường xác minh cũ${apply ? ' → đã xoá' : ''}`);

if ((await db.listCollections({ name: 'verificationevidences' }).toArray()).length) {
  const n = await db.collection('verificationevidences').countDocuments();
  if (apply) await db.collection('verificationevidences').drop();
  console.log(`- verificationevidences: ${n} ảnh${apply ? ' → đã xoá cả collection' : ''}`);
} else {
  console.log('- verificationevidences: không có');
}

await mongoose.disconnect();
