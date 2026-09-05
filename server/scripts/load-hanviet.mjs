// Tính ÂM HÁN-VIỆT cho mọi từ từ Unihan (trường kVietnamese của Unicode — nguồn
// chuẩn, không cần AI). "国家" → "quốc gia": người Việt nhận ra ngay, học cực nhanh.
// Chỉ ghi khi MỌI chữ trong từ có âm Hán-Việt (đọc trọn vẹn mới có giá trị dạy).
//   node server/scripts/load-hanviet.mjs <đường-dẫn-Unihan_Readings.txt>
import 'dotenv/config';
import fs from 'node:fs';
import mongoose from 'mongoose';
import VocabCard from '../models/VocabCard.js';

const file = process.argv[2];
const lines = fs.readFileSync(file, 'utf8').split('\n');
const map = new Map(); // char → âm Hán-Việt (lấy âm đầu)
for (const ln of lines) {
  if (!ln.startsWith('U+')) continue;
  const [cp, field, val] = ln.split('\t');
  if (field !== 'kVietnamese') continue;
  const ch = String.fromCodePoint(parseInt(cp.slice(2), 16));
  map.set(ch, (val || '').trim().split(/\s+/)[0]);
}
console.log(`Nạp ${map.size} âm Hán-Việt từ Unihan.`);

const hv = (hanzi) => {
  const parts = [...String(hanzi)].map((c) => map.get(c));
  return parts.every(Boolean) ? parts.join(' ') : ''; // đủ mọi chữ mới ghi
};

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
const cards = await VocabCard.find({}, 'hanzi').lean();
let ops = [], set = 0;
for (const c of cards) {
  const v = hv(c.hanzi);
  if (!v) continue;
  ops.push({ updateOne: { filter: { _id: c._id }, update: { $set: { hanViet: v } } } });
  set++;
  if (ops.length >= 1000) { await VocabCard.bulkWrite(ops, { ordered: false }); ops = []; }
}
if (ops.length) await VocabCard.bulkWrite(ops, { ordered: false });
console.log(`✅ Ghi âm Hán-Việt cho ${set}/${cards.length} thẻ.`);
await mongoose.disconnect();
