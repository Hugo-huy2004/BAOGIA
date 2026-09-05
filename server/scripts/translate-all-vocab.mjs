// Dịch TOÀN CỤC nghĩa (Anh → Việt) cho mọi thẻ nguồn mở, GIÃN NHỊP để không dính
// 429 (Gemini free giới hạn theo phút). Dịch theo NGHĨA DUY NHẤT rồi updateMany
// cho mọi thẻ trùng nghĩa (phủ cả hsk & tocfl). Chạy lại được: chỉ dịch cái còn
// tiếng Anh, nên gọi nhiều lần cũng an toàn.
//   node server/scripts/translate-all-vocab.mjs   (từ thư mục server)
import 'dotenv/config';
import mongoose from 'mongoose';
import VocabCard from '../models/VocabCard.js';

const BATCH = 30;
const DELAY_MS = 6000;               // ~10 req/phút, dưới ngưỡng free 15 RPM
// Tiếng Anh THẬT (từ điển): có ; ( hoặc từ khoá điển hình. Tránh dịch lại từ
// Việt không dấu (em trai, ba, xe…).
const enSig = /[;(]|\b(to|the|a|of|and|or|sth|surname|variant|used|classifier|Kangxi|radical|old|one|two)\b/i;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
const { generateRaw } = await import('../services/aiGateway.js');

const all = await VocabCard.find({ source: 'hsk-open' }, 'meaning').lean();
const uniq = [...new Set(all.map((c) => c.meaning).filter((m) => m && enSig.test(m)))];
console.log(`Còn ${uniq.length} nghĩa (duy nhất) cần dịch. ~${Math.ceil(uniq.length / BATCH)} lượt, mỗi lượt cách ${DELAY_MS / 1000}s.`);

let done = 0, fail = 0;
for (let i = 0; i < uniq.length; i += BATCH) {
  const chunk = uniq.slice(i, i + BATCH);
  let vi = null;
  for (let attempt = 0; attempt < 3 && !vi; attempt++) {
    if (attempt) await sleep(DELAY_MS * (attempt + 1));
    const raw = await generateRaw({
      model: 'gemini-2.5-flash',
      systemInstruction: { parts: [{ text: 'Dịch các nghĩa từ điển (tiếng Anh) sang TIẾNG VIỆT ngắn gọn, tự nhiên. Trả về DUY NHẤT một mảng JSON các chuỗi tiếng Việt, ĐÚNG THỨ TỰ và ĐÚNG SỐ LƯỢNG với đầu vào.' }] },
      contents: [{ role: 'user', parts: [{ text: JSON.stringify(chunk) }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    });
    try {
      const arr = JSON.parse(String(raw || '[]').replace(/^```(?:json)?|```$/g, '').trim());
      if (Array.isArray(arr) && arr.length === chunk.length) vi = arr;
    } catch { /* thử lại */ }
  }
  if (!vi) { fail += chunk.length; process.stdout.write('x'); await sleep(DELAY_MS); continue; }
  const ops = chunk.map((en, k) => ({ updateMany: { filter: { meaning: en, source: 'hsk-open' }, update: { $set: { meaning: String(vi[k]).slice(0, 120) } } } }));
  const r = await VocabCard.bulkWrite(ops, { ordered: false }).catch(() => ({ modifiedCount: 0 }));
  done += r.modifiedCount || 0;
  process.stdout.write('.');
  await sleep(DELAY_MS);
}
console.log(`\n✅ Xong. Cập nhật ${done} thẻ. Bỏ (lỗi) ${fail} nghĩa — chạy lại script để dịch nốt.`);
await mongoose.disconnect();
