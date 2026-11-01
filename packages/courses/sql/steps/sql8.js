// Step 8 — LIKE, GLOB và tìm kiếm chuỗi.
export default {
  id: "sql8",
  lang: "sql",
  file: "hat/search.sql",
  duration: "60 phút",
  summary: "Tìm theo mẫu chuỗi với LIKE và GLOB, dùng hàm chuỗi lower, instr, length, và hiểu giới hạn của LIKE với tiếng Việt.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: `Khách gõ "cà" vào ô tìm kiếm — app phải hiện *Cà phê đen*. Step này dạy:

- LIKE với \`%\` và \`_\`.
- GLOB (phân biệt hoa thường, kiểu Unix).
- Hàm chuỗi: \`lower\`, \`instr\`, \`length\`, \`substr\`.
- Giới hạn của LIKE — lý do chặng 7 cần FTS5.`,
    },
    {
      section: "core",
      title: "Ký tự đại diện",
      body: `| Mẫu | Khớp | Không khớp |
|---|---|---|
| \`'Cà%'\` | Cà phê đen | Bạc xỉu |
| \`'%trà%'\` | Trà đào? (tuỳ hoa thường) | Bánh mì |
| \`'B_nh mì'\` | Bánh mì | Bạc xỉu |

\`%\` = **0 hoặc nhiều** ký tự. \`_\` = **đúng 1** ký tự.`,
    },
    {
      section: "research",
      title: "LIKE trong chuẩn SQL",
      body: `LIKE có từ chuẩn SQL-86. SQLite làm LIKE **không phân biệt hoa thường chỉ với chữ ASCII** (A–Z): \`'TRÀ'\` và \`'trà'\` không khớp nhau vì "À" và "à" nằm ngoài ASCII.

Cách phổ biến: lưu thêm một cột "đã chuẩn hoá" (chữ thường, bỏ dấu) để tìm — chặng 4 làm bằng cột sinh tự động.

> SQLite (2025) *SQL Language Expressions — The LIKE, GLOB, REGEXP, MATCH operators*. Available at: https://sqlite.org/lang_expr.html#like (public domain).`,
    },
    {
      section: "ideate",
      title: "Ô tìm kiếm thực đơn",
      body: `Người dùng gõ \`x\` → câu SQL: \`WHERE name LIKE '%' || x || '%'\`.

Ba vấn đề cần nghĩ:

1. Gõ chữ hoa/thường khác nhau.
2. Gõ không dấu ("ca phe").
3. Bảng 1 triệu dòng: \`%x%\` không dùng được chỉ mục → chậm.

Step này giải (1) với chữ không dấu; (2) và (3) để dành chặng 4 và 7.`,
    },
    {
      section: "core",
      title: "LIKE với %",
      body: "Tìm món **bắt đầu** bằng \"C\". Thử đổi thành `'%a%'` (chứa chữ a) và `'%h'` (kết thúc bằng h).",
      sql: { query: "SELECT name FROM menu_items WHERE name LIKE 'C%';" },
    },
    {
      section: "core",
      title: "LIKE với _",
      body: "`_` khớp đúng một ký tự. Mẫu `'_______'` (7 dấu gạch) tìm tên dài đúng 7 ký tự — Bạc xỉu, Trà đào, Bánh mì.",
      sql: { query: "SELECT name FROM menu_items WHERE name LIKE '_______';" },
    },
    {
      section: "core",
      title: "Không phân biệt hoa thường",
      body: "Với chữ ASCII, LIKE của SQLite đã bỏ qua hoa thường. Để chắc chắn cho mọi DBMS, chuẩn hoá cả hai vế bằng `lower()`.",
      sql: { query: "SELECT name FROM menu_items WHERE lower(name) LIKE '%brew%';" },
    },
    {
      section: "core",
      title: "GLOB",
      body: "GLOB dùng `*` và `?` (như dòng lệnh Unix) và **luôn phân biệt hoa thường**. Có cả lớp ký tự: `[A-C]*` = bắt đầu bằng A, B hoặc C.",
      sql: { query: "SELECT name FROM menu_items WHERE name GLOB '[A-C]*';" },
    },
    {
      section: "core",
      title: "Hàm chuỗi hay dùng",
      body: "`length` đếm ký tự, `instr(s, x)` trả vị trí x trong s (0 nếu không có), `substr(s, từ, dài)` cắt chuỗi, `replace` thay thế, `trim` bỏ khoảng trắng hai đầu.",
      sql: { query: "SELECT name,\n       length(name) AS dai,\n       instr(name, ' ') AS vi_tri_cach,\n       substr(name, 1, 3) AS dau,\n       upper(category) AS loai\nFROM menu_items;" },
    },
    {
      section: "core",
      title: "Tìm chính ký tự % hoặc _",
      body: "Muốn tìm chữ có dấu % thật (\"giảm 10%\"), khai ký tự thoát bằng `ESCAPE`: `LIKE '%10\\%%' ESCAPE '\\'`.",
    },
    {
      section: "apply",
      title: "Bài tập 1: món có chữ \"latte\"",
      body: "Hiện tên các món có chứa `latte` (không phân biệt hoa thường).",
      sql: { query: "", solution: "SELECT name FROM menu_items WHERE name LIKE '%latte%';", hints: ["Bọc từ khoá bằng % hai bên.", "WHERE name LIKE '%latte%'"] },
    },
    {
      section: "apply",
      title: "Bài tập 2: tên nhiều chữ",
      body: "Hiện tên các món **có dấu cách** (tên gồm từ hai chữ trở lên).",
      sql: { query: "", solution: "SELECT name FROM menu_items WHERE name LIKE '% %';", hints: ["Mẫu chứa một dấu cách ở giữa.", "LIKE '% %'"] },
    },
    {
      section: "apply",
      title: "Bài tập 3: số điện thoại đuôi 4",
      body: "Hiện tên khách có số điện thoại **kết thúc bằng 4**.",
      sql: { query: "", solution: "SELECT name FROM customers WHERE phone LIKE '%4';", hints: ["% đứng trước, ký tự cần tìm đứng cuối.", "WHERE phone LIKE '%4'"] },
    },
  ],
  quiz: [
    { q: "% trong LIKE khớp với?", o: ["Đúng 1 ký tự", "0 hoặc nhiều ký tự", "Chỉ chữ số", "Dấu phần trăm"], a: 1, why: "_ là đúng 1 ký tự; % là chuỗi bất kỳ kể cả rỗng." },
    { kind: "output", q: "Có mấy món khớp? (Bạc xỉu, Trà đào, Cà phê đen, Bánh mì, Matcha latte, Cold brew)", code: "SELECT name FROM menu_items WHERE name LIKE 'B%';", o: ["1", "2", "3", "0"], a: 1, why: "Bạc xỉu, Bánh mì." },
    { kind: "truefalse", q: "GLOB trong SQLite phân biệt hoa thường.", a: true, why: "GLOB luôn phân biệt; LIKE thì không (với ASCII)." },
    { kind: "blank", q: "Điền mẫu tìm tên kết thúc bằng 'brew'.", code: "WHERE name LIKE '___'", a: "%brew", why: "% đứng trước, brew đứng cuối." },
    { q: "Vì sao LIKE '%trà%' trên bảng rất lớn thường chậm?", o: ["LIKE bị lỗi", "Mẫu bắt đầu bằng % không dùng được chỉ mục thông thường", "Chữ có dấu", "Thiếu ORDER BY"], a: 1, why: "Phải quét mọi dòng — chặng 7 dùng FTS5." },
    { kind: "output", q: "Kết quả là gì?", code: "SELECT instr('Cold brew', 'brew');", o: ["0", "5", "6", "1"], a: 2, why: "Vị trí đếm từ 1: C-o-l-d-␠ là 5 ký tự, brew bắt đầu ở 6." },
    { kind: "match", q: "Nối mẫu với ý nghĩa.", pairs: [["'C%'", "bắt đầu bằng C"], ["'%h'", "kết thúc bằng h"], ["'%a%'", "có chứa a"], ["'___'", "dài đúng 3 ký tự"]], why: "% bất kỳ, _ một ký tự." },
  ],
};
