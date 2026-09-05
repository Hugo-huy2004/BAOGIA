import mongoose from 'mongoose';

// Thẻ từ vựng — kho DÙNG CHUNG cho mọi người học (không phải trạng thái riêng
// của một người; cái đó ở VocabProgress). Nội dung do Hugo Studio soạn/duyệt:
// chỉ thẻ `approved` mới được phát cho người học, thẻ AI sinh nằm `pending` chờ
// duyệt để không bao giờ dạy một từ chưa ai soát.
const VocabCardSchema = new mongoose.Schema({
  deck: { type: String, required: true, index: true }, // hsk1 | hsk2 | hsk3 | tocfl_a1 | tocfl_a2
  hanzi: { type: String, required: true },
  pinyin: { type: String, required: true },
  meaning: { type: String, required: true },
  hanViet: { type: String, default: '' }, // âm Hán-Việt (国家 → "quốc gia")           // nghĩa tiếng Việt
  example: { type: String, default: '' },
  examplePinyin: { type: String, default: '' },
  exampleMeaning: { type: String, default: '' },
  tags: { type: [String], default: [] },               // idiom, phrase, term…
  order: { type: Number, default: 0 },                 // thứ tự học trong bộ
  status: { type: String, enum: ['approved', 'pending', 'rejected'], default: 'approved', index: true },
  source: { type: String, default: 'seed' },           // seed | ai | admin
}, { timestamps: true });

// Không cho trùng cùng một chữ trong cùng một bộ.
VocabCardSchema.index({ deck: 1, hanzi: 1 }, { unique: true });

export default mongoose.model('VocabCard', VocabCardSchema);
