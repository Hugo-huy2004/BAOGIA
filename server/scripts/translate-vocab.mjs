// AI dịch NGHĨA (tiếng Anh từ từ điển mở → tiếng Việt) cho một cấp. AI KHÔNG bịa
// từ — chỉ dịch nghĩa đã có. Dịch theo NGHĨA DUY NHẤT rồi áp cho mọi thẻ trùng
// nghĩa ở CẢ hai khoá (hsk + tocfl) để đỡ tốn lượt gọi.
//   node server/scripts/translate-vocab.mjs hsk1   (chạy từ thư mục server)
import 'dotenv/config';
import mongoose from 'mongoose';
import VocabCard from '../models/VocabCard.js';

const deck = process.argv[2];
if (!deck) { console.error('Thiếu deck.'); process.exit(1); }
const BATCH = 40;
await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
const { generateRaw } = await import('../services/aiGateway.js');

// Chỉ dịch thẻ nghĩa còn tiếng Anh (chứa a-z, chưa có dấu tiếng Việt rõ ràng).
const cards = await VocabCard.find({ deck, source: 'hsk-open' }, 'meaning').lean();
const uniq = [...new Set(cards.map((c) => c.meaning).filter((m) => /[a-z]/i.test(m)))];
console.log(`${deck}: ${uniq.length} nghĩa cần dịch (${cards.length} thẻ).`);

let doneN = 0;
for (let i = 0; i < uniq.length; i += BATCH) {
  const chunk = uniq.slice(i, i + BATCH);
  const raw = await generateRaw({
    systemInstruction: { parts: [{ text: 'Dịch nghĩa từ điển Trung→Anh sang TIẾNG VIỆT ngắn gọn. Trả về DUY NHẤT một mảng JSON các chuỗi tiếng Việt, ĐÚNG THỨ TỰ và ĐÚNG SỐ LƯỢNG với đầu vào.' }] },
    contents: [{ role: 'user', parts: [{ text: JSON.stringify(chunk) }] }],
    generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
  });
  let vi = [];
  try { vi = JSON.parse(String(raw || '[]').replace(/^```(?:json)?|```$/g, '').trim()); } catch { /* rỗng */ }
  if (!Array.isArray(vi) || vi.length !== chunk.length) { console.log(`  batch ${i}: bỏ (AI trả ${vi.length}/${chunk.length})`); continue; }
  const ops = chunk.map((en, k) => ({ updateMany: { filter: { meaning: en, source: 'hsk-open' }, update: { $set: { meaning: String(vi[k]).slice(0, 120) } } } }));
  const r = await VocabCard.bulkWrite(ops, { ordered: false }).catch(() => ({ modifiedCount: 0 }));
  doneN += r.modifiedCount || 0;
  process.stdout.write(`.`);
}
console.log(`\n✅ ${deck}: đã dịch, cập nhật ${doneN} thẻ (cả hsk & tocfl trùng nghĩa).`);
await mongoose.disconnect();
