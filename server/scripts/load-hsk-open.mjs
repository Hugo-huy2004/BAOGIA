// Nạp từ vựng THẬT từ bộ dữ liệu MỞ complete-hsk-vocabulary (giản thể + phồn thể
// + pinyin + nghĩa). Không cào web bừa: đây là nguồn mở, có giấy phép. AI KHÔNG
// còn bịa từ — chỉ dịch nghĩa/ví dụ + dựng giáo trình.
//   - hsk1..hsk6  : chữ GIẢN THỂ  (khoá HSK)
//   - tocfl1..6   : chữ PHỒN THỂ  (khoá TOCFL) — cùng vốn từ, khác hệ chữ
// File JSON đã tải sẵn ở thư mục scratchpad (new_1..6.json).
import 'dotenv/config';
import fs from 'node:fs';
import mongoose from 'mongoose';
import VocabCard from '../models/VocabCard.js';

const DIR = process.argv[2]; // thư mục chứa new_1..6.json
if (!DIR) { console.error('Thiếu đường dẫn thư mục dữ liệu.'); process.exit(1); }
const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 120);

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });

// Xoá dữ liệu AI bịa trước (thay bằng dữ liệu thật).
const del = await VocabCard.deleteMany({ source: 'ai' });
console.log(`Đã xoá ${del.deletedCount} thẻ AI bịa.`);

for (let n = 1; n <= 6; n++) {
  const rows = JSON.parse(fs.readFileSync(`${DIR}/new_${n}.json`, 'utf8'));
  const simpOps = [];
  const tradOps = [];
  for (const r of rows) {
    const form = (r.forms || [])[0] || {};
    const pinyin = form.transcriptions?.pinyin || '';
    const meaning = clean((form.meanings || [])[0] || '');
    if (!r.simplified || !pinyin || !meaning) continue;
    const order = Number(r.frequency) || 9999; // tần suất thấp = hay gặp → học trước
    const base = { pinyin, meaning, order, status: 'approved', source: 'hsk-open' };
    // GIẢN THỂ → HSK. $setOnInsert: KHÔNG đè 93 từ seed tiếng Việt đã có.
    simpOps.push({ updateOne: { filter: { deck: `hsk${n}`, hanzi: r.simplified }, update: { $setOnInsert: { deck: `hsk${n}`, hanzi: r.simplified, ...base } }, upsert: true } });
    // PHỒN THỂ → TOCFL.
    const trad = form.traditional || r.simplified;
    tradOps.push({ updateOne: { filter: { deck: `tocfl${n}`, hanzi: trad }, update: { $setOnInsert: { deck: `tocfl${n}`, hanzi: trad, ...base } }, upsert: true } });
  }
  const r1 = await VocabCard.bulkWrite(simpOps, { ordered: false }).catch((e) => ({ upsertedCount: 0, err: e.message }));
  const r2 = await VocabCard.bulkWrite(tradOps, { ordered: false }).catch((e) => ({ upsertedCount: 0, err: e.message }));
  console.log(`Cấp ${n}: HSK +${r1.upsertedCount || 0} · TOCFL +${r2.upsertedCount || 0}${r1.err ? ' (lỗi: ' + r1.err + ')' : ''}`);
}

console.log('\n✅ Tổng thẻ approved mỗi cấp:');
for (const d of ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5', 'hsk6', 'tocfl1', 'tocfl2', 'tocfl3', 'tocfl4', 'tocfl5', 'tocfl6'])
  console.log(`  ${d.padEnd(7)} ${await VocabCard.countDocuments({ deck: d, status: 'approved' })}`);
await mongoose.disconnect();
