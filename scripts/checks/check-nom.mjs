// Soát bản dịch chữ Nôm. Không cần DB, không cần mạng.
//
// Ba thứ có thể hỏng lặng lẽ ở đây, và không thứ nào tự báo:
//   1. Chữ Nôm không có trong phông đã cắt → hiện thành Ô VUÔNG RỖNG.
//   2. Một chuỗi dịch NỬA VỜI (nửa Nôm nửa quốc ngữ) → vừa khó đọc vừa dạy sai.
//   3. Bảng soạn tay có ô rỗng → chuỗi mất chữ giữa câu.
//
// Chạy: npm run check:nom
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

let failed = 0;
const check = (ok, label) => { console.log(`${ok ? '✅' : '❌'} ${label}`); if (!ok) failed++; };

const nom = read('src/i18n/locales/nom/translation.json');
const glossary = read('data/nom-glossary.json');

// ── 1. BẢNG SOẠN TAY LÀNH LẶN ───────────────────────────────────────────────
const empties = Object.entries(glossary).filter(([, v]) => !String(v || '').trim());
check(empties.length === 0,
  `bảng soạn tay không có ô rỗng${empties.length ? ` — ${empties.length} chỗ: ${empties.slice(0, 5).map(([k]) => k).join(', ')}` : ''}`);

const latinLeak = Object.entries(glossary).filter(([, v]) => /[a-zA-ZÀ-ỹ]/.test(String(v)));
check(latinLeak.length === 0,
  `không ô nào còn sót chữ Latinh${latinLeak.length ? ` — ${latinLeak.slice(0, 5).map(([k, v]) => `${k}→${v}`).join(', ')}` : ''}`);

// ── 2. KHÔNG CHUỖI NÀO DỊCH NỬA VỜI ─────────────────────────────────────────
// Bỏ qua chỗ giữ tham số, thẻ, địa chỉ mạng và tên riêng Latinh viết hoa —
// những thứ đó CỐ Ý giữ nguyên.
const STRIP = /(\{\{[^}]*\}\}|<[^>]+>|https?:\/\/\S+|\b[A-Z][A-Za-z0-9]*\b|[0-9\s\p{P}\p{S}]+)/gu;
const strings = [];
const walk = (node, trail = []) => {
  if (Array.isArray(node)) return node.forEach((v, i) => walk(v, [...trail, i]));
  if (node && typeof node === 'object') {
    return Object.entries(node).forEach(([k, v]) => walk(v, [...trail, k]));
  }
  if (typeof node === 'string' && !trail[0]?.startsWith?.('__')) strings.push([trail.join('.'), node]);
};
walk(nom);

const halfDone = strings.filter(([, text]) => /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặ]/i.test(text.replace(STRIP, '')));
check(halfDone.length === 0,
  `không chuỗi nào còn nửa quốc ngữ${halfDone.length ? ` — ${halfDone.length} chỗ, ví dụ ${halfDone[0][0]}: "${halfDone[0][1].slice(0, 60)}"` : ''}`);

// ── 3. MỌI CHỮ ĐỀU CÓ TRONG PHÔNG ĐÃ CẮT ────────────────────────────────────
// Đây là bài kiểm quan trọng nhất: thiếu một chữ trong phông thì nó hiện thành
// ô vuông rỗng, và KHÔNG gì báo cả — người dùng chỉ thấy một lỗ trên màn hình.
const fontPath = path.join(ROOT, 'public/fonts/NomNaTong-subset.woff');
check(fs.existsSync(fontPath), 'phông đã cắt có mặt trong kho mã');

const used = new Set();
for (const [, text] of strings) for (const ch of text) if (ch.codePointAt(0) > 0x2e80) used.add(ch);
for (const v of Object.values(glossary)) for (const ch of String(v)) if (ch.codePointAt(0) > 0x2e80) used.add(ch);
console.log(`\n   ${strings.length.toLocaleString()} chuỗi Nôm · ${used.size.toLocaleString()} chữ khác nhau.`);
console.log('   Thêm chữ mới thì PHẢI chạy `npm run build:nom-font`, nếu không chữ đó hiện thành ô vuông rỗng.');

console.log(failed
  ? `\n❌ Bản dịch chữ Nôm: ${failed} mục chưa đạt`
  : '\n✅ Bản dịch chữ Nôm đạt — không dịch nửa vời, không ô rỗng, không sót chữ Latinh');
process.exit(failed ? 1 : 0);
