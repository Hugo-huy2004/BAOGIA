// Nạp từ vựng theo CHUẨN NEW HSK 3.0 bằng AI, vào HÀNG CHỜ DUYỆT (không phát
// thẳng cho người học). Đây là cách "tích hợp giáo trình NEW HSK" chạy dần mà
// không sao chép nội dung có bản quyền của bất kỳ NXB nào — từ theo chuẩn nhà
// nước, câu ví dụ do AI soạn gốc, Boss duyệt trước khi phát.
//
//   node server/scripts/generate-vocab.mjs hsk2 40        # sinh 40 thẻ HSK2 → pending
//   node server/scripts/generate-vocab.mjs hsk2 --list    # xem thẻ đang chờ duyệt
//   node server/scripts/generate-vocab.mjs hsk2 --approve # DUYỆT hết pending của HSK2
//   node server/scripts/generate-vocab.mjs hsk2 --reject  # bỏ hết pending của HSK2
import 'dotenv/config';
import mongoose from 'mongoose';
import VocabCard from '../models/VocabCard.js';

const [deck, arg = '20'] = process.argv.slice(2);
const VALID = ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5', 'hsk6', 'hsk7_9', 'tocfl_a1', 'tocfl_a2'];
if (!VALID.includes(deck)) { console.error(`deck phải là một trong: ${VALID.join(', ')}`); process.exit(1); }

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });

if (arg === '--list') {
  const rows = await VocabCard.find({ deck, status: 'pending' }).sort({ order: 1 }).lean();
  console.log(`${rows.length} thẻ CHỜ DUYỆT ở ${deck}:`);
  rows.forEach((c) => console.log(`  ${c.hanzi}  ${c.pinyin}  — ${c.meaning}`));
  await mongoose.disconnect(); process.exit(0);
}
if (arg === '--approve' || arg === '--reject') {
  const status = arg === '--approve' ? 'approved' : 'rejected';
  const r = await VocabCard.updateMany({ deck, status: 'pending' }, { $set: { status } });
  console.log(`Đã ${status === 'approved' ? 'DUYỆT' : 'BỎ'} ${r.modifiedCount} thẻ ở ${deck}.`);
  await mongoose.disconnect(); process.exit(0);
}

const count = Math.min(50, Math.max(1, Number(arg) || 20));
const { generateRaw } = await import('../services/aiGateway.js');
const have = await VocabCard.find({ deck }).distinct('hanzi');
const isTocfl = deck.startsWith('tocfl');
const script = isTocfl ? 'PHỒN THỂ (繁體字, Đài Loan)' : 'GIẢN THỂ (简体字)';
const standard = isTocfl ? 'TOCFL' : 'NEW HSK 3.0';
const label = deck.toUpperCase().replace('TOCFL', 'TOCFL ').replace('HSK', 'HSK ');
console.log(`Đang sinh ${count} từ ${label} (chuẩn NEW HSK 3.0)…`);

const raw = await generateRaw({
  systemInstruction: { parts: [{ text: 'Bạn là chuyên gia dạy tiếng Trung. Trả về DUY NHẤT một mảng JSON, không giải thích.' }] },
  contents: [{ role: 'user', parts: [{ text:
    `Cho ${count} từ vựng thuộc chuẩn ${standard} cấp ${label}, viết bằng chữ ${script}, KHÔNG trùng: ${have.join(' ') || '(chưa có)'}. `
    + 'Mỗi phần tử JSON: {"hanzi","pinyin" (có dấu thanh),"meaning" (nghĩa tiếng Việt ngắn),"example" (câu ví dụ chữ Hán),"examplePinyin","exampleMeaning" (nghĩa tiếng Việt của câu)}.' }] }],
  generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
});
if (!raw) { console.error('AI không phản hồi (kiểm tra GEMINI keys / hạn mức).'); await mongoose.disconnect(); process.exit(1); }

let items = [];
try { items = JSON.parse(String(raw).replace(/^```(?:json)?|```$/g, '').trim()); } catch { /* rỗng */ }
let inserted = 0;
for (const [i, it] of (Array.isArray(items) ? items : []).entries()) {
  if (!it?.hanzi || !it?.pinyin || !it?.meaning) continue;
  try {
    await VocabCard.create({
      deck, hanzi: String(it.hanzi).trim(), pinyin: String(it.pinyin).trim(), meaning: String(it.meaning).trim(),
      example: String(it.example || ''), examplePinyin: String(it.examplePinyin || ''), exampleMeaning: String(it.exampleMeaning || ''),
      order: 1000 + i, status: 'pending', source: 'ai',
    });
    inserted += 1;
  } catch { /* trùng hanzi → bỏ qua */ }
}
console.log(`✅ Đã tạo ${inserted} thẻ CHỜ DUYỆT ở ${deck}. Xem: --list · Duyệt: --approve`);
await mongoose.disconnect();
