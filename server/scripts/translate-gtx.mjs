// Dịch nghĩa Anh→Việt bằng Google Translate endpoint MIỄN PHÍ (không cần key,
// không dính quota Gemini). Dịch theo nghĩa DUY NHẤT rồi updateMany cho mọi thẻ
// trùng nghĩa (phủ cả hsk & tocfl). Idempotent: chỉ dịch cái còn tiếng Anh.
//   node server/scripts/translate-gtx.mjs   (chạy từ thư mục server)
import 'dotenv/config';
import mongoose from 'mongoose';
import VocabCard from '../models/VocabCard.js';

const enSig = /[;(]|\b(to|the|a|of|and|or|sth|surname|variant|used|classifier|Kangxi|radical|old|one|two)\b/i;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gtx(text) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  return (data[0] || []).map((seg) => seg[0]).join('').trim();
}
async function mymemory(text) { // dự phòng
  const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|vi`);
  const d = await r.json();
  return d?.responseData?.translatedText?.trim() || '';
}

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
const all = await VocabCard.find({ source: 'hsk-open' }, 'meaning').lean();
const uniq = [...new Set(all.map((c) => c.meaning).filter((m) => m && enSig.test(m)))];
console.log(`Cần dịch ${uniq.length} nghĩa (Google Translate free).`);

let done = 0, fail = 0;
for (let i = 0; i < uniq.length; i++) {
  const en = uniq[i];
  let vi = '';
  for (let a = 0; a < 3 && !vi; a++) {
    try { vi = await gtx(en); }
    catch { await sleep(1500 * (a + 1)); try { vi = await mymemory(en); } catch { /* thử tiếp */ } }
  }
  if (!vi || vi.toLowerCase() === en.toLowerCase()) { fail++; if (i % 50 === 0) process.stdout.write('x'); await sleep(200); continue; }
  await VocabCard.updateMany({ meaning: en, source: 'hsk-open' }, { $set: { meaning: vi.slice(0, 120) } }).catch(() => {});
  done++;
  if (i % 50 === 0) process.stdout.write(`[${i}/${uniq.length}]`);
  await sleep(180); // nhẹ nhàng, tránh bị chặn
}
console.log(`\n✅ Xong. Dịch ${done} nghĩa, lỗi ${fail}. Chạy lại để dọn nốt nếu còn.`);
await mongoose.disconnect();
