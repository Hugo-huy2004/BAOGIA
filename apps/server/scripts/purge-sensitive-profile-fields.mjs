// Xoá hẳn dữ liệu hồ sơ không còn thu (8/11/2026): tôn giáo, dân tộc, chiều cao,
// cân nặng, số đo. Không tính năng nào cần chúng; tôn giáo/dân tộc còn là dữ liệu
// nhạy cảm theo NĐ 13/2023. Chính sách bảo mật đã ghi "không thu" — phải xoá thật.
//
//   node apps/server/scripts/purge-sensitive-profile-fields.mjs        → chỉ ĐẾM
//   node apps/server/scripts/purge-sensitive-profile-fields.mjs --yes  → xoá
//
// Đi thẳng qua collection (không qua model Bio): các trường đã bỏ khỏi schema nên
// Mongoose không còn thấy chúng. Lịch sử chỉnh sửa từng ghi giá trị cũ vào
// `history.detail` ("[Số đo]: ..."), nên xoá luôn các dòng đó.
import 'dotenv/config';
import mongoose from 'mongoose';

const apply = process.argv.includes('--yes');
const FIELDS = ['religion', 'ethnicity', 'height', 'weight', 'measurements'];
const LABEL_LINE = /^.*\[(Chiều cao|Cân nặng|Số đo)\].*$\n?/gm;

const { MONGODB_URI } = process.env;
if (!MONGODB_URI) {
  console.error('Thiếu MONGODB_URI (apps/server/.env).');
  process.exit(1);
}

await mongoose.connect(MONGODB_URI);
const bios = mongoose.connection.collection('bios');

const hasField = { $or: FIELDS.map((f) => ({ [f]: { $exists: true } })) };
const fieldCount = await bios.countDocuments(hasField);
const historyDocs = await bios.find({ 'history.detail': { $regex: '\\[(Chiều cao|Cân nặng|Số đo)\\]' } }, { projection: { history: 1 } }).toArray();
console.log(`${fieldCount} hồ sơ còn trường cần xoá; ${historyDocs.length} hồ sơ có dòng lịch sử chứa giá trị cũ.`);

if (!apply) {
  console.log('Chưa xoá gì. Chạy lại với --yes để xoá.');
} else {
  const unset = Object.fromEntries(FIELDS.map((f) => [f, '']));
  const { modifiedCount } = await bios.updateMany(hasField, { $unset: unset });
  let historyFixed = 0;
  for (const doc of historyDocs) {
    const history = doc.history.map((h) => (typeof h.detail === 'string' ? { ...h, detail: h.detail.replace(LABEL_LINE, '') } : h));
    await bios.updateOne({ _id: doc._id }, { $set: { history } });
    historyFixed++;
  }
  console.log(`Đã xoá trường ở ${modifiedCount} hồ sơ, làm sạch lịch sử ${historyFixed} hồ sơ.`);
}

await mongoose.disconnect();
