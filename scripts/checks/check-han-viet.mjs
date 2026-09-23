// Soát kính ngữ Hán Việt của TOÀN BỘ chữ tiếng Việt. Không cần DB, không cần mạng.
//
// ── VÌ SAO CÓ TỆP NÀY ────────────────────────────────────────────────────────
// Tiếng Việt của hệ thống dùng kính ngữ Hán Việt, giọng văn thư triều chính.
// Đó không phải sở thích trang trí: mục tiêu là để mỗi người dùng gặp lại lối
// xưng hô và lối đếm của người Việt xưa ngay trong một ứng dụng thường ngày.
//
// Một quy ước văn phong không có gì canh sẽ mục ruỗng trong vài tuần — chỉ cần
// một người thêm vài chuỗi mới theo thói quen là đủ. Tệp này canh những gì đếm
// được, và cố ý CHỈ canh những gì đếm được.
//
// Chạy: npm run check:han-viet
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const vi = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/locales/vi/translation.json'), 'utf8'));

/**
 * ── HAI VÙNG MIỄN TRỪ, MỖI VÙNG MỘT LÝ DO THẬT ──────────────────────────────
 *
 * BUỒNG TRỊ LIỆU (hugoPsy, companion): lối xưng hô gần gũi ở đây là một lựa
 * chọn trị liệu, không phải sơ suất văn phong. Người đang khủng hoảng cần một
 * giọng nói thân mật; "Quý thành viên" dựng ngay một bức tường giữa họ với chỗ
 * dựa vừa tìm tới. Kính ngữ ở đây sẽ phá đúng thứ mà tính năng này tồn tại vì.
 *
 * CHỮ CỦA TÁC GIẢ (intro, servicesPage, servicePkg, studentPricing): trang
 * portfolio và bảng giá do chính tác giả viết. CLAUDE.md ghi rõ không sửa khi
 * chưa hỏi — đó là giọng văn cá nhân, không phải chuỗi giao diện.
 */
const EXEMPT = new Set([
  'hugoPsy', 'companion', 'therapy', 'crisis', 'banhocduong',
  'intro', 'servicesPage', 'servicePkg', 'studentPricing', 'projectsPage',
]);

const RULES = [
  // `ấy|ta|đó|này` chừa NGÔI THỨ BA: "bạn ấy" là người khác, không phải người
  // đang đọc. Bản đầu của luật này đòi đổi "phần bạn ấy làm" thành kính ngữ.
  [/(?<![\wÀ-ỹ])[Bb]ạn(?![\wÀ-ỹ])(?! ?(bè|học|đồng|thân|tri|ấy|ta|đó|này))/, 'xưng "bạn" — dùng kính ngữ (Quý thành viên / Quý khách / Quý học viên)'],
  [/(?<![\wÀ-ỹ])[Cc]ậu(?![\wÀ-ỹ])/, 'xưng "cậu"'],
  [/(?<![\wÀ-ỹ])(nhé|nha)(?![\wÀ-ỹ])/, 'từ đệm suồng sã'],
  [/!/, 'dấu chấm than — lời tuyên cáo không cần lớn tiếng'],
  [/(?<![\wÀ-ỹ])xem xét(?![\wÀ-ỹ])/, 'xem xét → "thẩm định"'],
  [/(?<![\wÀ-ỹ])xét lại(?![\wÀ-ỹ])/, 'xét lại → "tái thẩm định"'],
  [/(?<![\wÀ-ỹ])[Ll]ý do(?![\wÀ-ỹ])/, 'lý do → "duyên do"'],
  [/(?<![\wÀ-ỹ])[Mm]ón quà(?![\wÀ-ỹ])/, 'món quà → "tặng phẩm"'],
  [/(?<![\wÀ-ỹ])khoá tài khoản(?![\wÀ-ỹ])/, 'khoá tài khoản → "phong toả tài khoản"'],
  [/(?<![\wÀ-ỹ])đóng băng(?![\wÀ-ỹ])/, 'đóng băng → "đình chỉ"'],
  // `(?! ?dụ)` chừa "ví dụ" — hai chữ đó không liên quan gì tới cái ví.
  [/(?<![\wÀ-ỹ])[Vv]í(?! ?dụ)(?![\wÀ-ỹ])/, 'ví → "ngân khố"'],
];

/** Nhắc kính ngữ ba lần trong một câu là văn thư hành chính, không phải văn chương. */
const HONORIFIC = /Quý (thành viên|khách|học viên|quản trị|vị)/g;
const MAX_HONORIFIC = 2;

let failed = 0;
let scanned = 0;
const problems = [];

const walk = (node, trail = []) => {
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) walk(value, [...trail, key]);
    return;
  }
  if (typeof node !== 'string') return;
  const keyPath = trail.join('.');
  if (EXEMPT.has(trail[0])) return;
  scanned += 1;

  for (const [pattern, why] of RULES) {
    if (pattern.test(node)) problems.push({ keyPath, text: node, why });
  }
  const repeats = node.match(HONORIFIC)?.length || 0;
  if (repeats > MAX_HONORIFIC) {
    problems.push({ keyPath, text: node, why: `nhắc kính ngữ ${repeats} lần trong một chuỗi — lược bớt theo lối văn cổ` });
  }
};
walk(vi);

for (const { keyPath, text, why } of problems.slice(0, 40)) {
  console.log(`❌ ${keyPath}\n     "${text.slice(0, 110)}"\n     → ${why}`);
  failed += 1;
}
if (problems.length > 40) {
  console.log(`   … và ${problems.length - 40} chỗ nữa.`);
  failed = problems.length;
}

console.log(`\n   Đã soát ${scanned} chuỗi tiếng Việt (bỏ qua ${EXEMPT.size} nhóm miễn trừ).`);
console.log(failed
  ? `\n❌ Kính ngữ Hán Việt: ${failed} chỗ lệch chuẩn`
  : '\n✅ Kính ngữ Hán Việt đạt — xưng hô, từ ngữ và giọng văn đồng nhất toàn hệ thống');
process.exit(failed ? 1 : 0);
