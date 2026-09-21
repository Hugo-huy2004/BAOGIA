// Dựng bảng dịch cho chữ NẰM CỨNG trong mã giao diện.
//
// ── VÌ SAO CẦN BẢNG RIÊNG ───────────────────────────────────────────────────
// Bản dịch chữ Nôm cho tới nay chỉ phủ `locales/vi/translation.json`. Nhưng
// khoảng 13.400 chuỗi tiếng Việt khác nằm THẲNG trong JSX, không đi qua i18n,
// nên không bản dịch nào chạm tới — màn Ngân Khố và màn Tài khoản gần như
// nguyên tiếng Việt dù con số phủ báo 94%.
//
// Đưa từng chuỗi ấy vào i18n là việc đúng nhưng rất lớn (250 tệp). Ở đây làm
// phần khả thi ngay: rút chuỗi của những màn người dùng nhìn thấy nhiều nhất,
// dịch bằng ĐÚNG bộ máy đã dùng cho phần i18n, rồi tra ngược theo chính câu
// tiếng Việt. Không phải bịa ra 158 khoá mới nhân bốn ngôn ngữ.
//
// Chạy: npm run build:nom-ui
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

// Những tệp có chữ cứng đáng dịch. Cố ý KHÔNG gom cả kho bài giảng
// (hugoCoder/hugoSO): đó là giáo trình lập trình dài hàng nghìn dòng, dịch sang
// chữ Nôm thì không ai học được lập trình bằng nó.
const FILES = [
  'src/components/member/wallet/MetalCard3D.jsx',
  'src/components/member/wallet/JoyWalletApp.jsx',
  'src/components/member/wallet/TierPrivilegesSection.jsx',
  'src/components/member/wallet/TransactionReceiptModal.jsx',
  'src/components/member/MemberSettingsTab.jsx',
];

const VIET = /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;

/** Rút mọi chuỗi tiếng Việt: chuỗi nháy và chữ nằm giữa hai thẻ. */
function extract(source) {
  const body = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const found = new Set();
  for (const m of body.matchAll(/(['"])((?:\\.|(?!\1)[^\\\n])*)\1/g)) {
    const text = m[2];
    if (VIET.test(text) && text.trim().length > 2) found.add(text);
  }
  for (const m of body.matchAll(/>\s*([^<>{}\n]{3,})\s*</g)) {
    const text = m[1].trim();
    if (VIET.test(text)) found.add(text);
  }
  // Chuỗi nhiều dòng (bảng đặc quyền viết tràn dòng) — regex một dòng ở trên
  // bỏ sót chúng, mà đó lại đúng là khối chữ dài người dùng đọc nhiều nhất.
  for (const m of body.matchAll(/"((?:\\.|[^"\\])*)"/gs)) {
    const text = m[1];
    if (VIET.test(text) && text.trim().length > 2) found.add(text);
  }
  return found;
}

// ── Bộ dịch: dùng lại nguyên bảng tra của bản dịch i18n ─────────────────────
const glossary = read('data/nom-glossary.json');
const corpus = read('data/nom-corpus-table.json');
const VIET_SYLLABLES = new Set(read('data/nom-syllables.json'));

const TABLE = new Map();
const FROM_GLOSSARY = new Set();
for (const [k, v] of Object.entries(corpus)) if (k.includes(' ')) TABLE.set(k, v);
for (const [k, v] of Object.entries(glossary)) { if (v) { TABLE.set(k, v); FROM_GLOSSARY.add(k); } }

const MAXN = 6;
const KEEP = /(\{\{[^}]*\}\}|<[^>]+>|\$\{[^}]*\}|https?:\/\/\S+)/g;
const SYL = /[0-9\p{L}]+/gu;
const HAN = /\p{Script=Han}/u;
const isVietnamese = (t) => VIET_SYLLABLES.has(t) || VIET.test(t);

const tidy = (text) => text.replace(/(?<=\p{Script=Han})[^\S\r\n]+(?=\p{Script=Han})/gu, '');

function segment(seg) {
  if (!seg) return '';
  const tokens = [...seg.matchAll(SYL)].map((m) => ({ i: m.index, end: m.index + m[0].length, t: m[0].toLowerCase() }));
  if (!tokens.length) return seg;
  const n = tokens.length;
  const best = new Array(n + 1).fill(-Infinity);
  const take = new Array(n + 1).fill(0);
  best[n] = 0;
  for (let i = n - 1; i >= 0; i -= 1) {
    best[i] = best[i + 1] - (isVietnamese(tokens[i].t) ? 1000 : 0);
    take[i] = 0;
    for (let size = Math.min(MAXN, n - i); size >= 1; size -= 1) {
      const key = tokens.slice(i, i + size).map((x) => x.t).join(' ');
      if (!TABLE.has(key)) continue;
      const score = size * size * (FROM_GLOSSARY.has(key) ? 2 : 1) + best[i + size];
      if (score > best[i]) { best[i] = score; take[i] = size; }
    }
  }
  const parts = [];
  let idx = 0;
  for (let i = 0; i < n;) {
    const size = take[i];
    if (!size) {
      if (isVietnamese(tokens[i].t)) return null;
      i += 1;
      continue;
    }
    const key = tokens.slice(i, i + size).map((x) => x.t).join(' ');
    parts.push(seg.slice(idx, tokens[i].i), TABLE.get(key));
    idx = tokens[i + size - 1].end;
    i += size;
  }
  parts.push(seg.slice(idx));
  return parts.join('');
}

function translate(raw) {
  const text = raw.normalize('NFC');
  const out = [];
  let pos = 0;
  let ok = true;
  for (const m of text.matchAll(KEEP)) {
    const seg = segment(text.slice(pos, m.index));
    if (seg === null) ok = false; else out.push(seg);
    out.push(m[0]);
    pos = m.index + m[0].length;
  }
  const tail = segment(text.slice(pos));
  if (tail === null) ok = false; else out.push(tail);
  return ok ? tidy(out.join('')) : null;
}

const strings = new Set();
for (const file of FILES) {
  for (const s of extract(fs.readFileSync(path.join(ROOT, file), 'utf8'))) strings.add(s);
}

const out = {};
let done = 0;
for (const s of [...strings].sort()) {
  const nom = translate(s);
  if (nom && nom !== s && HAN.test(nom)) { out[s] = nom; done += 1; }
}

fs.writeFileSync(path.join(ROOT, 'data/nom-ui.json'), `${JSON.stringify(out, null, 0)}\n`);
console.log(`${done}/${strings.size} chuỗi cứng dịch được → data/nom-ui.json`);
