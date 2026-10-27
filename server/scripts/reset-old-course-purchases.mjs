// Gỡ quyền mua các khoá đã xoá ngày 27/10/2026 — theo quyết định của chủ dự án:
// xoá luôn, KHÔNG hoàn JOY.
//
//   node server/scripts/reset-old-course-purchases.mjs            → chỉ ĐẾM, không sửa
//   node server/scripts/reset-old-course-purchases.mjs --yes      → gỡ
//   node server/scripts/reset-old-course-purchases.mjs --yes --bundle
//                                                                 → gỡ cả gói trọn bộ cũ
//
// Gỡ gì:
//   - `hugoSOCourses`: bốn học phần văn phòng (CAL/DOC/SHE/AIA). Code đã không còn
//     đọc trường này; gỡ để dữ liệu nói đúng sự thật.
//   - Cờ sở hữu từng CHẶNG khoá Web cũ (hugoCoder*Lifetime). Khoá Coding giữ đúng
//     mã chặng (basic…devops) để giữ giá và đường tiền, nên KHÔNG gỡ thì người
//     mua chặng cũ tự có luôn chặng mới cùng mã.
//   - `--bundle`: thêm `hugoCoderAll7Lifetime` (trọn bộ 6 chặng cũ). Cờ này cũng
//     là cờ "sở hữu app" của Coding, nên tách riêng để chủ dự án tự quyết.
//
// KHÔNG đụng: completedLessons (giấy chứng nhận khoá cũ tra trên đó), thuê tháng,
// dùng thử, điểm thi, sổ JOY. Không in email ai cả — chỉ in số lượng.
import 'dotenv/config';
import mongoose from 'mongoose';
import Bio from '../models/Bio.js';

const args = process.argv.slice(2);
const apply = args.includes('--yes');
const bundle = args.includes('--bundle');

const STAGE_FLAGS = [
  'hugoCoderBasicLifetime',
  'hugoCoderIntermediateLifetime',
  'hugoCoderAdvancedLifetime',
  'hugoCoderSecurityLifetime',
  'hugoCoderExamLifetime',
  'hugoCoderOptimizeLifetime',
  'hugoCoderUltimateLifetime',
  'hugoCoderDevopsLifetime',
];
const flags = bundle ? [...STAGE_FLAGS, 'hugoCoderAll7Lifetime'] : STAGE_FLAGS;

const { MONGODB_URI } = process.env;
if (!MONGODB_URI) {
  console.error('Thiếu MONGODB_URI (server/.env).');
  process.exit(1);
}

await mongoose.connect(MONGODB_URI);
console.log(`Cơ sở dữ liệu: ${mongoose.connection.name}\n`);

const office = { 'hugoSOCourses.0': { $exists: true } };
console.log(`Học phần văn phòng: ${await Bio.countDocuments(office)} hồ sơ`);
for (const flag of flags) {
  console.log(`${flag}: ${await Bio.countDocuments({ [flag]: true })} hồ sơ`);
}

if (!apply) {
  console.log('\nChỉ đếm, chưa sửa gì. Thêm --yes để gỡ (thêm --bundle để gỡ cả trọn bộ cũ).');
} else {
  const officeResult = await Bio.updateMany(office, { $set: { hugoSOCourses: [] } });
  const stageResult = await Bio.updateMany(
    { $or: flags.map((flag) => ({ [flag]: true })) },
    { $set: Object.fromEntries(flags.map((flag) => [flag, false])) },
  );
  console.log(`\nĐã gỡ: ${officeResult.modifiedCount} hồ sơ văn phòng, ${stageResult.modifiedCount} hồ sơ cờ chặng.`);
}

await mongoose.disconnect();
