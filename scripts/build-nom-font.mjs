// Dựng lại phông chữ Nôm đã cắt gọn, theo đúng những chữ bản dịch đang dùng.
//
// ── VÌ SAO PHẢI CẮT ─────────────────────────────────────────────────────────
// Nom Na Tong (MIT, github.com/nomfoundation/font) có 32.963 glyph và nặng
// 15,2 MB. Đó là kho chữ Nôm đầy đủ nhất đang có, nhưng bắt mỗi khách tải 15 MB
// để đọc vài chục chữ trên giao diện thì không thể chấp nhận. Bản cắt chỉ giữ
// đúng chữ đang dùng, còn 54 KB.
//
// ── KHI NÀO PHẢI CHẠY LẠI ───────────────────────────────────────────────────
// Mỗi lần thêm chữ Nôm mới vào `locales/nom/translation.json` hoặc vào nhánh
// `nom` của `memberAppTranslations.js`. Quên chạy thì chữ mới hiện thành ô
// vuông rỗng — lỗi im lặng, vì không gì báo cả.
//
// Chạy: npm run build:nom-font
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_URL = 'https://github.com/nomfoundation/font/releases/download/v5.18/NomNaTong-Regular.ttf';
const OUT = path.join(ROOT, 'public/fonts/NomNaTong-subset.woff');

const collect = () => {
  const chars = new Set();
  const eat = (text) => { for (const ch of text) chars.add(ch); };

  const walk = (node) => {
    if (node && typeof node === 'object') Object.values(node).forEach(walk);
    else if (typeof node === 'string') eat(node);
  };
  walk(JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/locales/nom/translation.json'), 'utf8')));

  // Nhánh `nom` của danh mục ứng dụng nằm trong một tệp JS, đọc thô là đủ:
  // ta chỉ cần TẬP KÝ TỰ, không cần hiểu cấu trúc.
  const catalog = fs.readFileSync(path.join(ROOT, 'src/i18n/locales/memberAppTranslations.js'), 'utf8');
  const start = catalog.indexOf('  nom: {');
  const end = catalog.indexOf('  en: {', start);
  if (start >= 0 && end > start) eat(catalog.slice(start, end));

  // Giữ luôn chữ số và dấu câu cơ bản để phông tự đứng được một mình.
  eat('0123456789 .,·—()%:');
  return [...chars].filter((c) => c.codePointAt(0) > 0x2e80 || /[0-9 .,·—()%:]/.test(c)).sort().join('');
};

const text = collect();
console.log(`Cần giữ ${[...text].length} ký tự.`);

const tmp = path.join(os.tmpdir(), 'NomNaTong-Regular.ttf');
if (!fs.existsSync(tmp)) {
  console.log('Tải phông gốc (15,2 MB)…');
  execFileSync('curl', ['-sL', '-o', tmp, SOURCE_URL], { stdio: 'inherit' });
}

const charFile = path.join(os.tmpdir(), 'nom-chars.txt');
fs.writeFileSync(charFile, text);
fs.mkdirSync(path.dirname(OUT), { recursive: true });

// `--flavor=woff` chứ không phải woff2: woff2 cần brotli, vốn không có sẵn
// trong mọi máy. Chênh lệch trên một tệp 54 KB là không đáng để đổi lấy một
// lệnh dựng chỉ chạy được trên một số máy.
execFileSync('pyftsubset', [
  tmp, `--text-file=${charFile}`, `--output-file=${OUT}`,
  '--flavor=woff', '--layout-features=', '--no-hinting', '--desubroutinize',
], { stdio: 'inherit' });

const size = fs.statSync(OUT).size;
console.log(`✅ ${path.relative(ROOT, OUT)} — ${(size / 1024).toFixed(0)} KB`);
if (size > 400 * 1024) {
  console.error('❌ Phông cắt vượt 400 KB. Xem lại tập ký tự trước khi ghi vào kho mã.');
  process.exit(1);
}
