// Soát GIỌNG VĂN của thông báo — KHÔNG cần DB, KHÔNG cần mạng.
//
// Thông báo của Hugo Studio là lời tuyên cáo, không phải tin nhắn tán gẫu: Apple
// gặp Hoàng Gia — câu ngắn và rõ, phẩm cách và kính ngữ.
//
// Vì sao cần máy canh: giọng văn là thứ trôi nhanh nhất. Người thêm một khoá mới
// lúc nửa đêm sẽ viết "Bạn vừa nhận JOY nhé!" vì đó là phản xạ tự nhiên, và
// không ai review lại một chuỗi ba từ. Bộ này bắt những luật ĐẾM ĐƯỢC.
//
// Chạy: npm run check:notification-tone
import { NOTIFICATION_TEXT } from '../../shared/notificationText.js';

let failed = 0;
const fail = (lang, key, text, why) => {
  console.log(`❌ [${lang}] ${key}`);
  console.log(`     "${text}"`);
  console.log(`     → ${why}`);
  failed++;
};

// Từ suồng sã: chỉ bắt khi đứng một mình, tránh bắt nhầm "bạn bè", "lời mời".
const CASUAL_VI = [
  [/\bnhé\b/i, 'từ đệm "nhé" — lời tuyên cáo không cần làm mềm'],
  [/\bnha\b/i, 'từ đệm "nha"'],
  [/\bcậu\b/i, 'xưng "cậu" — dùng "Quý thành viên"'],
  // `(?! bè| Bè)` chừa tên ứng dụng "Bạn Bè" — đó là DANH TỪ RIÊNG, không phải
  // đại từ. Bản đầu của luật này báo nhầm chính câu đã viết đúng giọng.
  [/(^|[\s"“(])bạn(?! ?bè)([\s,.!?:;”)]|$)/i, 'xưng "bạn" — dùng "Quý thành viên"'],
  [/\bngay và luôn\b/i, 'khẩu ngữ "ngay và luôn"'],
];
const CASUAL_EN = [
  [/\bhey\b/i, '"hey"'],
  [/\bawesome\b/i, '"awesome"'],
  [/\bgonna\b/i, '"gonna"'],
];

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/u;

for (const [lang, table] of Object.entries(NOTIFICATION_TEXT)) {
  for (const [key, text] of Object.entries(table)) {
    if (typeof text !== 'string') continue;

    if (text.includes('!')) fail(lang, key, text, 'có dấu chấm than — sự trang trọng không cần lớn tiếng');
    if (EMOJI.test(text)) fail(lang, key, text, 'có emoji — biểu tượng thuộc về giao diện, không thuộc lời tuyên cáo');

    const rules = lang === 'vi' ? CASUAL_VI : lang === 'en' ? CASUAL_EN : [];
    for (const [re, why] of rules) {
      if (re.test(text)) fail(lang, key, text, why);
    }
  }
}

const counts = Object.fromEntries(
  Object.entries(NOTIFICATION_TEXT).map(([l, t]) => [l, Object.keys(t).length]),
);
console.log(`\n   Đã soát: ${Object.entries(counts).map(([l, c]) => `${l} ${c}`).join(' · ')} chuỗi.`);

console.log(failed
  ? `\n❌ Giọng văn thông báo: ${failed} chuỗi lệch chuẩn`
  : '\n✅ Giọng văn thông báo đạt — long trọng tuyên bố, ba ngôn ngữ cùng phẩm cách');
process.exit(failed ? 1 : 0);
