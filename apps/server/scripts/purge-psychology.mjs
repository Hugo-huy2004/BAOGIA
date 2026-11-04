/**
 * Xoá toàn bộ dữ liệu HugoPSY / Bạn Học Đường (gỡ 04/11/2026).
 *
 *   node apps/server/scripts/purge-psychology.mjs           # chạy thử: chỉ đếm, không xoá
 *   node apps/server/scripts/purge-psychology.mjs --apply   # xoá thật (không hoàn tác được)
 *
 * Xoá: lịch sử trò chuyện/nhật ký/cờ khủng hoảng (companionhistories), nhật ký giấc ngủ
 * (sleeplogs), thiết bị IoT (iotdevices), lịch push đồng hành, thông báo trỏ vào app,
 * sự kiện bảo mật của chat đồng hành, sản phẩm token Psy-Study, và các trường trên Bio.
 * Sổ cái JOY giữ nguyên: dòng tiền cũ vẫn phải đối soát được.
 */
import 'dotenv/config';
import mongoose from 'mongoose';

const apply = process.argv.includes('--apply');
const { MONGODB_URI } = process.env;
if (!MONGODB_URI) {
  console.error('Thiếu MONGODB_URI (apps/server/.env).');
  process.exit(1);
}

const APP_URL = /^\/member\/utilities\/psychology/;
const JOBS = [
  ['companionhistories', 'drop', {}],
  ['sleeplogs', 'drop', {}],
  ['iotdevices', 'drop', {}],
  ['scheduledpushes', 'delete', { $or: [{ feature: { $exists: true, $ne: null } }, { 'payload.url': APP_URL }] }],
  ['inappnotifications', 'delete', { actionUrl: APP_URL }],
  ['securityevents', 'delete', { category: 'companion_abuse' }],
  ['utilityproducts', 'delete', { productType: 'psy_study_tokens' }],
];
const BIO_UNSET = { bonusChatTokens: '', bonusCallTokens: '', unlockedCompanionFeatures: '' };
const BIO_PULL = { installedUtilities: 'psychology', homeScreenUtilities: 'psychology' };

await mongoose.connect(MONGODB_URI);
const db = mongoose.connection.db;
const existing = new Set((await db.listCollections().toArray()).map((c) => c.name));
console.log(apply ? 'XOÁ THẬT' : 'CHẠY THỬ (thêm --apply để xoá)');

for (const [name, mode, filter] of JOBS) {
  if (!existing.has(name)) { console.log(`- ${name}: không có`); continue; }
  const col = db.collection(name);
  const n = await col.countDocuments(filter);
  if (apply && mode === 'drop') await col.drop();
  else if (apply && n) await col.deleteMany(filter);
  console.log(`- ${name}: ${n} bản ghi${apply ? (mode === 'drop' ? ' → đã xoá cả collection' : ' → đã xoá') : ''}`);
}

const bios = db.collection('bios');
const bioFilter = { $or: [
  ...Object.keys(BIO_UNSET).map((k) => ({ [k]: { $exists: true } })),
  ...Object.entries(BIO_PULL).map(([k, v]) => ({ [k]: v })),
] };
const nBio = await bios.countDocuments(bioFilter);
if (apply && nBio) await bios.updateMany(bioFilter, { $unset: BIO_UNSET, $pull: BIO_PULL });
console.log(`- bios: ${nBio} hồ sơ có trường HugoPSY${apply ? ' → đã gỡ' : ''}`);

await mongoose.disconnect();
