/**
 * Nạp font chữ viết tay theo ngôn ngữ — chỉ khi ngôn ngữ đó đang được dùng.
 *
 * index.css áp font riêng cho 4 ngôn ngữ qua `html[lang="th"|"zh"|"ja"|"ko"]`.
 * Trước đây cả 4 họ font đó nằm chung một thẻ <link> trong index.html, nên MỌI
 * khách đều tải khai báo của cả 4 — mà font CJK có hàng trăm khối unicode-range:
 *
 *     cả 6 họ (bản cũ)    412 KB thô / 104 KB gzip
 *     chỉ Plus Jakarta      8 KB thô / 0,6 KB gzip
 *
 * Tức khách Việt tải 104 KB để dùng 0,6 KB. Nặng hơn cả CSS toàn cục của app
 * (49 KB gzip) lẫn chunk JS đầu vào. Trình duyệt không tải TỆP font của ngôn
 * ngữ khác — nhưng vẫn phải tải và phân tích toàn bộ khai báo @font-face.
 *
 * Quicksand bị bỏ hẳn: nó nằm trong URL nhưng không quy tắc CSS nào dùng tới.
 */
const LANGUAGE_FONTS = {
  th: "https://fonts.googleapis.com/css2?family=Mali:wght@400;500;600;700&display=swap",
  zh: "https://fonts.googleapis.com/css2?family=Zhi+Mang+Xing&display=swap",
  ja: "https://fonts.googleapis.com/css2?family=Klee+One:wght@400;600&display=swap",
  ko: "https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap",
};

const loaded = new Set();

/** Chèn thẻ <link> cho `language` đúng một lần. Ngôn ngữ khác thì không làm gì. */
export function ensureLanguageFont(language) {
  if (typeof document === "undefined") return;
  const href = LANGUAGE_FONTS[language];
  if (!href || loaded.has(language)) return;
  loaded.add(language);

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  // Không chặn sơn lần đầu: chữ hiện ngay bằng font hệ thống rồi đổi khi font
  // về — cùng thủ thuật index.html dùng cho Plus Jakarta.
  link.media = "print";
  link.onload = () => { link.media = "all"; };
  document.head.appendChild(link);
}
