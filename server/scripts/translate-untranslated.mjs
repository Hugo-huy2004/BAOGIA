// Dịch nốt các nghĩa CÒN TIẾNG ANH (meaning === meaningEn = chưa dịch) sang tiếng
// Việt bằng Google Translate free (gtx) + MyMemory dự phòng. updateMany theo giá
// trị nghĩa để phủ cả hsk lẫn tocfl trùng nghĩa. Idempotent: chạy lại chỉ dọn nốt.
//   node server/scripts/translate-untranslated.mjs   (chạy từ thư mục server)
import 'dotenv/config';
import mongoose from 'mongoose';
import VocabCard from '../models/VocabCard.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || '').trim().toLowerCase();

async function gtx(text) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = await r.json();
  return (d[0] || []).map((s) => s[0]).join('').trim();
}
async function mymemory(text) {
  const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|vi`);
  const d = await r.json();
  return d?.responseData?.translatedText?.trim() || '';
}

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
const cards = await VocabCard.find({ status: 'approved', meaningEn: { $ne: '' } }, 'meaning meaningEn').lean();
const uniq = [...new Set(cards.filter((c) => norm(c.meaning) === norm(c.meaningEn) && /[a-z]/i.test(c.meaning)).map((c) => c.meaning))];
console.log(`Cần dịch ${uniq.length} nghĩa Anh→Việt.`);

let done = 0, fail = 0;
for (let i = 0; i < uniq.length; i++) {
  const en = uniq[i];
  let vi = '';
  for (let a = 0; a < 3 && !vi; a++) {
    try { vi = await gtx(en); }
    catch { await sleep(1500 * (a + 1)); try { vi = await mymemory(en); } catch { /* thử tiếp */ } }
  }
  if (!vi || norm(vi) === norm(en)) { fail++; await sleep(200); continue; }
  await VocabCard.updateMany({ meaning: en }, { $set: { meaning: vi.slice(0, 120) } }).catch(() => {});
  done++;
  if (i % 50 === 0) process.stdout.write(`[${i}/${uniq.length}] `);
  await sleep(160);
}
console.log(`\n✅ Xong. Dịch ${done} nghĩa, lỗi ${fail}. Chạy lại nếu còn.`);
await mongoose.disconnect();
