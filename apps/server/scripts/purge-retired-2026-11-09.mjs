/**
 * Dọn dữ liệu của các tính năng gỡ ngày 09/11/2026: app phim, giỏ hàng + mã
 * khuyến mãi, telemetry ClientMetric, và các trường Bio không còn trong schema (Study/HugoCoder, HugoSO,
 * thuê giao diện Bio, thưởng xem thông tin, danh bạ sao lưu…).
 *
 *   node apps/server/scripts/purge-retired-2026-11-09.mjs           # chạy thử: chỉ đếm
 *   node apps/server/scripts/purge-retired-2026-11-09.mjs --apply   # xoá thật (không hoàn tác được)
 */
import 'dotenv/config';
import mongoose from 'mongoose';

const apply = process.argv.includes('--apply');
const { MONGODB_URI } = process.env;
if (!MONGODB_URI) {
  console.error('Thiếu MONGODB_URI (apps/server/.env).');
  process.exit(1);
}

const DROP = ['cinemamovies', 'storecarts', 'promocodes', 'clientmetrics'];
const BIO_FIELDS = [
  'capstoneTrack', 'capstoneTrackChosenAt',
  'completedLessons', 'hugoSOCourses', 'infoBonusClaimed', 'infoReadBonusClaimed',
  'bioThemeRental', 'backedUpContacts', 'courseCompletionAwardClaimed',
  'lastUserAgentHash', 'sessionsValidFrom', 'birthdayVoucherYear', 'radioTokens',
  'hugoCoderAdvancedLifetime', 'hugoCoderAll7Lifetime', 'hugoCoderBasicLifetime',
  'hugoCoderCertificateUrl', 'hugoCoderDevopsLifetime', 'hugoCoderExamAttempts',
  'hugoCoderExamLifetime', 'hugoCoderExamScores', 'hugoCoderIntermediateLifetime',
  'hugoCoderOptimizeLifetime', 'hugoCoderProjectAdminNote', 'hugoCoderProjectNote',
  'hugoCoderProjectStatus', 'hugoCoderProjectSubmittedAt', 'hugoCoderProjectUrl',
  'hugoCoderRewardClaimed3', 'hugoCoderRewardClaimed4', 'hugoCoderRewardClaimed5',
  'hugoCoderRewardClaimed6', 'hugoCoderRewardClaimed7', 'hugoCoderSecurityLifetime',
  'hugoCoderUltimateLifetime',
];

await mongoose.connect(MONGODB_URI);
const db = mongoose.connection.db;
const existing = new Set((await db.listCollections().toArray()).map((c) => c.name));
console.log(apply ? 'XOÁ THẬT' : 'CHẠY THỬ (thêm --apply để xoá)');

for (const name of DROP) {
  if (!existing.has(name)) { console.log(`- ${name}: không có`); continue; }
  const n = await db.collection(name).countDocuments();
  if (apply) await db.collection(name).drop();
  console.log(`- ${name}: ${n} bản ghi${apply ? ' → đã xoá cả collection' : ''}`);
}

const bioFilter = { $or: BIO_FIELDS.map((f) => ({ [f]: { $exists: true } })) };
const nBio = await db.collection('bios').countDocuments(bioFilter);
if (apply && nBio) {
  await db.collection('bios').updateMany(bioFilter, { $unset: Object.fromEntries(BIO_FIELDS.map((f) => [f, ''])) });
}
console.log(`- bios: ${nBio} hồ sơ có trường cũ${apply ? ' → đã gỡ' : ''}`);

await mongoose.disconnect();
