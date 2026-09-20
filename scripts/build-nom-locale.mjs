// Dựng bản dịch chữ Nôm từ hai nguồn, rồi ghi ra locales/nom/translation.json.
//
// ── HAI NGUỒN, HAI ĐỘ TIN CẬY KHÁC NHAU ─────────────────────────────────────
//   1. BẢNG SOẠN TAY (data/nom-glossary.json) — người soạn, đã tra. Ưu tiên
//      tuyệt đối. Đây là nơi chứa từ vựng HIỆN ĐẠI mà chữ Nôm chưa từng có:
//      "đăng nhập", "tài khoản", "giao diện"… Chữ Nôm thôi được viết từ đầu
//      thế kỷ XX, trước khi những khái niệm này ra đời, nên KHÔNG kho ngữ liệu
//      cổ nào chứa chúng — buộc phải soạn theo từ nguyên Hán Việt.
//   2. KHO NGỮ LIỆU SONG SONG (data/nom-corpus-table.json) — rút từ 54.777 cặp
//      Nôm ↔ quốc ngữ căn khớp từng chữ. Chỉ nhận cụm TỪ HAI ÂM TRỞ LÊN: cụm
//      một âm là nơi đồng âm nhiều nhất, tra rời ra thì "thành công" thành
//      城公 (thành trì + công bằng), sai cả hai chữ.
//
// ── CHƯA DỊCH ĐƯỢC THÌ BỎ TRỐNG ─────────────────────────────────────────────
// Khoá nào không phủ được 100% thì KHÔNG ghi vào tệp, để i18next rơi về quốc
// ngữ. Dịch nửa vời (nửa Nôm nửa quốc ngữ trong một câu) vừa khó đọc vừa dạy
// sai — mà ngôn ngữ này sinh ra là để học.
//
// Chạy: npm run build:nom
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const glossary = read('data/nom-glossary.json');
const corpus = fs.existsSync(path.join(ROOT, 'data/nom-corpus-table.json'))
  ? read('data/nom-corpus-table.json') : {};

// Bảng tra gộp: soạn tay đè lên kho ngữ liệu.
const TABLE = new Map();
for (const [k, v] of Object.entries(corpus)) if (k.includes(' ')) TABLE.set(k, v);
for (const [k, v] of Object.entries(glossary)) if (v) TABLE.set(k, v);

const MAXN = 6;
const KEEP = /(\{\{[^}]*\}\}|<[^>]+>|\$\{[^}]*\}|https?:\/\/\S+)/g;
const SYL = /[0-9\p{L}]+/gu;

/** Dịch một chuỗi. Trả `null` nếu không phủ hết — nơi gọi sẽ bỏ khoá đó. */
function translate(raw) {
  const text = raw.normalize('NFC');
  const out = [];
  let pos = 0;
  let covered = true;
  for (const m of text.matchAll(KEEP)) {
    const seg = segment(text.slice(pos, m.index));
    if (!seg) covered = false; else out.push(seg);
    out.push(m[0]);
    pos = m.index + m[0].length;
  }
  const tail = segment(text.slice(pos));
  if (tail === null) covered = false; else out.push(tail);
  return covered ? out.join('') : null;
}

function segment(seg) {
  if (!seg) return '';
  const tokens = [...seg.matchAll(SYL)].map((m) => ({ i: m.index, end: m.index + m[0].length, t: m[0].toLowerCase() }));
  if (!tokens.length) return seg;

  // Quy hoạch động: chọn cách cắt phủ được NHIỀU ÂM NHẤT, ưu tiên cụm dài.
  // Khớp tham lam từ trái đọc "phiên tập trung" thành "phiên tập" + "trung",
  // nuốt mất "tập trung" vốn là cụm đúng.
  const n = tokens.length;
  const best = new Array(n + 1).fill(-Infinity);
  const take = new Array(n + 1).fill(0);
  best[n] = 0;
  for (let i = n - 1; i >= 0; i -= 1) {
    best[i] = best[i + 1] - 1000;      // bỏ sót một âm: phạt rất nặng
    take[i] = 0;
    for (let size = Math.min(MAXN, n - i); size >= 1; size -= 1) {
      const key = tokens.slice(i, i + size).map((x) => x.t).join(' ');
      if (!TABLE.has(key)) continue;
      const score = size * size + best[i + size];
      if (score > best[i]) { best[i] = score; take[i] = size; }
    }
  }

  const parts = [];
  let idx = 0;
  for (let i = 0; i < n;) {
    const size = take[i];
    if (!size) return null;            // còn âm không tra được → bỏ cả chuỗi
    const key = tokens.slice(i, i + size).map((x) => x.t).join(' ');
    parts.push(seg.slice(idx, tokens[i].i), TABLE.get(key));
    idx = tokens[i + size - 1].end;
    i += size;
  }
  parts.push(seg.slice(idx));
  return parts.join('');
}

const vi = read('src/i18n/locales/vi/translation.json');
let total = 0;
let done = 0;

const walk = (node) => {
  if (Array.isArray(node)) {
    const out = node.map(walk);
    return out.some((x) => x !== undefined) ? out.map((x, i) => x ?? node[i]) : undefined;
  }
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      const t = walk(v);
      if (t !== undefined) out[k] = t;
    }
    return Object.keys(out).length ? out : undefined;
  }
  if (typeof node !== 'string') return undefined;
  total += 1;
  const nom = translate(node);
  if (nom === null || nom === node) return undefined;
  done += 1;
  return nom;
};

const tree = walk(vi) || {};
tree.__locale = 'nom';
tree.__note = 'Sinh bằng scripts/build-nom-locale.mjs. Khoá thiếu là CÓ CHỦ Ý — rơi về quốc ngữ.';

const OUT = path.join(ROOT, 'src/i18n/locales/nom/translation.json');
fs.writeFileSync(OUT, `${JSON.stringify(tree, null, 2)}\n`);
console.log(`Bảng tra: ${TABLE.size.toLocaleString()} cụm (soạn tay ${Object.keys(glossary).length.toLocaleString()}).`);
console.log(`Đã dịch ${done.toLocaleString()}/${total.toLocaleString()} chuỗi (${(done / total * 100).toFixed(1)}%).`);
console.log(`→ ${path.relative(ROOT, OUT)}`);
