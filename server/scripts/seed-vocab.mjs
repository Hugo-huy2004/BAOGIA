// Nạp seed HSK1 vào kho thẻ dùng chung (idempotent: chạy lại chỉ cập nhật,
// không nhân đôi — khoá duy nhất là deck+hanzi).
import 'dotenv/config';
import mongoose from 'mongoose';
import VocabCard from '../models/VocabCard.js';
import { HSK1_SEED } from '../data/vocabSeed.js';

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
let up = 0;
for (const c of HSK1_SEED) {
  await VocabCard.updateOne({ deck: c.deck, hanzi: c.hanzi }, { $set: c }, { upsert: true });
  up += 1;
}
const total = await VocabCard.countDocuments({ deck: 'hsk1', status: 'approved' });
console.log(`✅ Nạp/cập nhật ${up} thẻ HSK1. Kho hiện có ${total} thẻ HSK1 đã duyệt.`);
await mongoose.disconnect();
