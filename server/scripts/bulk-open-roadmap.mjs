// Nạp AI + duyệt để MỞ toàn bộ lộ trình (mỗi cấp có nội dung → hết "sắp ra mắt").
// Nội dung AI-sinh (source:'ai') — Boss nên soát/tinh chỉnh sau. Chạy từ server/.
import 'dotenv/config';
import mongoose from 'mongoose';
import VocabCard from '../models/VocabCard.js';

const DECKS = (process.argv[3] ? process.argv[3].split(',') : ['hsk2', 'hsk3', 'hsk4', 'hsk5', 'hsk6', 'tocfl1', 'tocfl2', 'tocfl3', 'tocfl4', 'tocfl5', 'tocfl6']);
const N = Number(process.argv[2]) || 24;

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
const { generateRaw } = await import('../services/aiGateway.js');

for (const deck of DECKS) {
  const isTocfl = deck.startsWith('tocfl');
  const script = isTocfl ? 'PHỒN THỂ (繁體字, Đài Loan)' : 'GIẢN THỂ (简体字)';
  const standard = isTocfl ? 'TOCFL' : 'NEW HSK 3.0';
  const label = deck.toUpperCase().replace('TOCFL', 'TOCFL ').replace('HSK', 'HSK ');
  const have = await VocabCard.find({ deck }).distinct('hanzi');
  process.stdout.write(`${label}: sinh ${N}… `);
  const raw = await generateRaw({
    systemInstruction: { parts: [{ text: 'Chuyên gia tiếng Trung. Trả về DUY NHẤT một mảng JSON.' }] },
    contents: [{ role: 'user', parts: [{ text:
      `Cho ${N} từ vựng chuẩn ${standard} cấp ${label}, chữ ${script}, KHÔNG trùng: ${have.join(' ') || '(chưa có)'}. `
      + 'Mỗi phần tử: {"hanzi","pinyin"(có dấu thanh),"meaning"(nghĩa tiếng Việt ngắn),"example","examplePinyin","exampleMeaning"}.' }] }],
    generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
  });
  let items = [];
  try { items = JSON.parse(String(raw || '[]').replace(/^```(?:json)?|```$/g, '').trim()); } catch { /* rỗng */ }
  let ins = 0;
  for (const [i, it] of (Array.isArray(items) ? items : []).entries()) {
    if (!it?.hanzi || !it?.pinyin || !it?.meaning) continue;
    try {
      await VocabCard.create({
        deck, hanzi: String(it.hanzi).trim(), pinyin: String(it.pinyin).trim(), meaning: String(it.meaning).trim(),
        example: String(it.example || ''), examplePinyin: String(it.examplePinyin || ''), exampleMeaning: String(it.exampleMeaning || ''),
        order: i, status: 'approved', source: 'ai',
      });
      ins += 1;
    } catch { /* trùng */ }
  }
  console.log(`+${ins} (duyệt luôn)`);
}
console.log('\n✅ Đã mở lộ trình. Tổng thẻ approved mỗi cấp:');
for (const d of ['hsk1', ...DECKS]) console.log(`  ${d}: ${await VocabCard.countDocuments({ deck: d, status: 'approved' })}`);
await mongoose.disconnect();
