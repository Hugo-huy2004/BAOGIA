// Nạp nghĩa TIẾNG ANH (meaningEn) từ dataset mở, cho khoá "Anh/Trung".
//   node server/scripts/backfill-meaning-en.mjs <thư-mục-new_1..6.json>
import 'dotenv/config';
import fs from 'node:fs';
import mongoose from 'mongoose';
import VocabCard from '../models/VocabCard.js';

const DIR = process.argv[2];
const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 120);
await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });

// Bản đồ: hanzi (giản thể + phồn thể) → nghĩa tiếng Anh.
const en = new Map();
for (let n = 1; n <= 6; n++) {
  for (const r of JSON.parse(fs.readFileSync(`${DIR}/new_${n}.json`, 'utf8'))) {
    const f = (r.forms || [])[0] || {};
    const m = clean((f.meanings || [])[0] || '');
    if (!m) continue;
    if (r.simplified) en.set(r.simplified, m);
    if (f.traditional) en.set(f.traditional, m);
  }
}
const cards = await VocabCard.find({ source: 'hsk-open' }, 'hanzi').lean();
let ops = [], set = 0;
for (const c of cards) {
  const m = en.get(c.hanzi);
  if (!m) continue;
  ops.push({ updateOne: { filter: { _id: c._id }, update: { $set: { meaningEn: m } } } });
  set++;
  if (ops.length >= 1000) { await VocabCard.bulkWrite(ops, { ordered: false }); ops = []; }
}
if (ops.length) await VocabCard.bulkWrite(ops, { ordered: false });
console.log(`✅ Ghi meaningEn cho ${set} thẻ.`);
await mongoose.disconnect();
