// Dựng học liệu cho ứng dụng DẠY CHỮ NÔM — theo lối GHÉP CHỮ, không học vẹt.
//
// ── VÌ SAO DẠY BỘ THỦ CHỨ KHÔNG DẠY TỪNG CHỮ ────────────────────────────────
// Học thuộc mặt từng chữ thì học bao nhiêu đọc được bấy nhiêu, gặp chữ lạ là
// chịu. Nhưng phần lớn chữ Nôm là chữ HÌNH-THANH: một nửa báo NGHĨA (bộ thủ),
// một nửa báo ÂM. Biết luật ấy thì gặp 𢷮 (⿰扌對) là đoán được ngay: bộ 扌 nói
// đây là việc làm bằng tay, 對 (đối) nói âm gần "đối" — ra "đổi".
//
// Vì vậy mỗi bài dạy MỘT BỘ THỦ, và bài kiểm cho chữ CHƯA HỌC mang bộ đó. Đo
// đúng thứ cần đo: hiểu quy luật, hay chỉ thuộc lòng.
//
// Học liệu vẫn lấy từ chính giao diện người học đang dùng — chữ dạy trước là
// chữ họ gặp nhiều nhất.
//
// Chạy: npm run build:nom-lessons
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const IDS_URL = 'https://raw.githubusercontent.com/cjkvi/cjkvi-ids/master/ids.txt';

const radicals = read('data/nom-radicals.json');
const readings = read('data/nom-readings.json');
const glossary = read('data/nom-glossary.json');
const vi = read('src/i18n/locales/vi/translation.json');
const nom = read('src/i18n/locales/nom/translation.json');

// ── Bảng tách chữ (CHISE IDS, giấy phép mở) ─────────────────────────────────
const idsPath = path.join(os.tmpdir(), 'cjkvi-ids.txt');
if (!fs.existsSync(idsPath)) {
  console.log('Tải bảng tách chữ IDS…');
  execFileSync('curl', ['-sL', '-o', idsPath, IDS_URL], { stdio: 'inherit' });
}
const IDS = new Map();
for (const line of fs.readFileSync(idsPath, 'utf8').split('\n')) {
  if (!line || line.startsWith('#')) continue;
  const [, ch, ids] = line.split('\t');
  if (ch && ids) IDS.set(ch, ids);
}

// Ký tự mô tả cấu trúc (⿰ trái-phải, ⿱ trên-dưới…) — bỏ đi, chỉ giữ thành phần.
const IDC = new Set('⿰⿱⿲⿳⿴⿵⿶⿷⿸⿹⿺⿻');
const HAN = /\p{Script=Han}/u;

/** Tách một chữ thành các thành phần. `null` nếu không tách được. */
function decompose(ch) {
  const ids = IDS.get(ch);
  if (!ids || ids === ch) return null;
  const parts = [...ids].filter((c) => !IDC.has(c) && HAN.test(c));
  return parts.length >= 2 ? parts : null;
}

// ── Câu song ngữ thật trong ứng dụng ────────────────────────────────────────
const sentences = [];
const pair = (a, b) => {
  if (typeof a === 'string' && typeof b === 'string') return sentences.push([a, b]);
  if (Array.isArray(a) && Array.isArray(b)) return a.forEach((x, i) => pair(x, b[i]));
  if (a && b && typeof a === 'object') {
    for (const [k, v] of Object.entries(b)) if (!k.startsWith('__') && k in a) pair(a[k], v);
  }
  return undefined;
};
pair(vi, nom);

// ── Tần suất thật của từng chữ trên giao diện ───────────────────────────────
const freq = new Map();
for (const [, text] of sentences) {
  for (const ch of text) if (HAN.test(ch)) freq.set(ch, (freq.get(ch) || 0) + 1);
}

// ── Từ chứa chữ, để chữ rời có chỗ bám nghĩa ────────────────────────────────
const wordsOf = new Map();
for (const [viWord, nomWord] of Object.entries(glossary)) {
  for (const ch of String(nomWord)) {
    if (!wordsOf.has(ch)) wordsOf.set(ch, []);
    const list = wordsOf.get(ch);
    if (list.length < 4 && !list.some((w) => w.nom === nomWord)) list.push({ nom: nomWord, vi: viWord });
  }
}

const exampleOf = new Map();
for (const [viText, nomText] of sentences) {
  if (viText.length > 56) continue;
  for (const ch of new Set(nomText)) {
    if (!exampleOf.has(ch)) exampleOf.set(ch, [nomText, viText]);
  }
}

/** Hồ sơ một chữ: bộ thủ, phần âm, âm đọc, từ chứa nó, câu ví dụ. */
function profile(ch) {
  const parts = decompose(ch);
  const reads = readings[ch] || [];
  if (!reads.length) return null;              // không biết đọc thì không dạy
  return {
    char: ch,
    count: freq.get(ch) || 0,
    readings: reads.slice(0, 3),
    radical: parts?.[0] || null,
    phonetic: parts?.[1] || null,
    // Âm của phần biểu âm — đây chính là chỗ người học thấy quy luật.
    phoneticReadings: parts?.[1] ? (readings[parts[1]] || []).slice(0, 2) : [],
    words: wordsOf.get(ch) || [],
    example: exampleOf.get(ch) || null,
  };
}

// ── Gom chữ theo bộ thủ ─────────────────────────────────────────────────────
const byRadical = new Map();
for (const ch of freq.keys()) {
  const p = profile(ch);
  if (!p?.radical || !radicals[p.radical]) continue;
  if (!byRadical.has(p.radical)) byRadical.set(p.radical, []);
  byRadical.get(p.radical).push(p);
}

const TEACH = 6;     // số chữ dạy trong một bài
const MIN_POOL = 9;  // cần dư ít nhất 3 chữ để ra đề chữ LẠ

const lessons = [...byRadical.entries()]
  .map(([radical, list]) => ({
    radical,
    ...radicals[radical],
    chars: list.sort((a, b) => b.count - a.count),
  }))
  .filter((l) => l.chars.length >= MIN_POOL)
  .sort((a, b) => b.chars.reduce((s, c) => s + c.count, 0) - a.chars.reduce((s, c) => s + c.count, 0))
  .map((l, index) => ({
    id: index + 1,
    radical: l.radical,
    name: l.name,
    meaning: l.meaning,
    hint: l.hint,
    teach: l.chars.slice(0, TEACH),
    // Đề kiểm tra: chữ CÙNG BỘ nhưng KHÔNG nằm trong phần dạy. Người học chưa
    // từng thấy chúng, nên trả lời đúng chỉ có thể nhờ hiểu quy luật ghép.
    quiz: l.chars.slice(TEACH, TEACH + 8),
  }));

const out = {
  generatedFrom: 'locales/nom + data/nom-glossary + CHISE IDS',
  passMark: 0.8,
  lessons,
};
fs.writeFileSync(path.join(ROOT, 'data/nom-lessons.json'), `${JSON.stringify(out)}\n`);

const teachCount = lessons.reduce((s, l) => s + l.teach.length, 0);
const quizCount = lessons.reduce((s, l) => s + l.quiz.length, 0);
console.log(`${lessons.length} bài (mỗi bài một bộ thủ) · dạy ${teachCount} chữ · đề kiểm tra ${quizCount} chữ LẠ.`);
console.log(`${sentences.length} câu song ngữ làm ví dụ.`);
