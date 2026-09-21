// Dựng bộ dữ liệu cho ứng dụng DẠY CHỮ NÔM.
//
// ── NGUỒN HỌC LIỆU LÀ CHÍNH ỨNG DỤNG NÀY ────────────────────────────────────
// Không bịa ra một danh sách chữ để học thuộc. Chữ đem dạy là ĐÚNG những chữ
// đang hiện trên giao diện mà người học dùng hằng ngày: học xong một bài là
// đọc được thêm một phần ứng dụng của chính mình. Đó là lối học mà người xưa
// gọi là "học đi đôi với hành", và nó cũng là lý do bộ chữ này hữu hạn và có
// thứ tự tự nhiên — theo tần suất xuất hiện thật.
//
// Mỗi chữ mang theo: âm đọc đã được chứng thực, những TỪ chứa nó, và câu thật
// trong ứng dụng để người học thấy chữ ấy sống ở đâu.
//
// Chạy: npm run build:nom-lessons
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const glossary = read('data/nom-glossary.json');
const readings = read('data/nom-readings.json');   // chữ → các âm đã chứng thực
const vi = read('src/i18n/locales/vi/translation.json');
const nom = read('src/i18n/locales/nom/translation.json');

/** Câu thật trong ứng dụng, ghép cặp quốc ngữ ↔ Nôm. */
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

const HAN = /\p{Script=Han}/u;
const chars = new Map();

// Đếm tần suất THẬT trên câu của ứng dụng: chữ hay gặp dạy trước.
for (const [, nomText] of sentences) {
  for (const ch of nomText) {
    if (!HAN.test(ch)) continue;
    if (!chars.has(ch)) chars.set(ch, { char: ch, count: 0, words: new Set(), examples: [] });
    chars.get(ch).count += 1;
  }
}

// Gắn TỪ chứa chữ đó, kèm nghĩa quốc ngữ — chữ rời không có nghĩa, từ mới có.
for (const [viWord, nomWord] of Object.entries(glossary)) {
  for (const ch of String(nomWord)) {
    const entry = chars.get(ch);
    if (entry) entry.words.add(`${nomWord}|${viWord}`);
  }
}

// Một câu ví dụ cho mỗi chữ: ngắn nhất, để người học đọc được ngay.
for (const [viText, nomText] of sentences) {
  if (viText.length > 60) continue;
  for (const ch of new Set(nomText)) {
    const entry = chars.get(ch);
    if (entry && entry.examples.length < 2) entry.examples.push([nomText, viText]);
  }
}

const list = [...chars.values()]
  .sort((a, b) => b.count - a.count)
  .map((e, index) => ({
    char: e.char,
    order: index + 1,
    count: e.count,
    readings: readings[e.char] || [],
    words: [...e.words].slice(0, 6).map((w) => {
      const [nomWord, viWord] = w.split('|');
      return { nom: nomWord, vi: viWord };
    }),
    examples: e.examples,
  }))
  // Chữ không tra được âm thì KHÔNG đem dạy: dạy một chữ mà không nói nó đọc
  // thế nào là dạy một hình vẽ, không phải dạy chữ.
  .filter((e) => e.readings.length);

// Chia bài: 12 chữ một bài, theo thứ tự tần suất.
const PER_LESSON = 12;
const lessons = [];
for (let i = 0; i < list.length; i += PER_LESSON) {
  lessons.push({
    id: lessons.length + 1,
    chars: list.slice(i, i + PER_LESSON).map((c) => c.char),
  });
}

const out = { generatedFrom: 'locales/nom + data/nom-glossary', chars: list, lessons };
fs.writeFileSync(path.join(ROOT, 'data/nom-lessons.json'), `${JSON.stringify(out)}\n`);
console.log(`${list.length} chữ dạy được · ${lessons.length} bài · ${sentences.length} câu song ngữ.`);
