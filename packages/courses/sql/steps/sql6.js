// Step 6 — WHERE và toán tử so sánh. Mở chặng 2.
export default {
  id: "sql6",
  lang: "sql",
  file: "hat/where.sql",
  duration: "60 phút",
  summary: "Lọc đúng những dòng cần bằng WHERE và sáu toán tử so sánh, so sánh số, chữ và ngày giờ.",
  slides: [
    {
      section: "intro",
      title: "Chặng 2: hỏi đúng câu hỏi",
      body: `Chặng 1 bạn lấy **mọi dòng**. Thực tế, chủ quán luôn hỏi có điều kiện: món *trên 30 nghìn*, đơn *sáng nay*, khách *chưa có số điện thoại*.

Chặng 2 gồm 6 step: WHERE → AND/OR/IN/BETWEEN → LIKE → NULL → ORDER BY và phân trang → CASE và hàm. Kết chặng: trang thực đơn lọc theo giá, loại, từ khoá.`,
    },
    {
      section: "visual",
      title: "Sơ đồ tư duy: chặng 2",
      visual: "filter-mindmap",
      body: "Bảy nhánh là bảy công cụ bạn sẽ có sau chặng này. Step này lo nhánh đầu tiên: **so sánh**.",
    },
    {
      section: "visual",
      title: "WHERE hoạt động thế nào",
      visual: "where-filter",
      body: "DBMS đi qua **từng dòng**, tính điều kiện. Kết quả TRUE thì giữ, FALSE hoặc NULL thì bỏ. Bảng kết quả chỉ còn những dòng vượt qua.",
    },
    {
      section: "research",
      title: "Phép chọn trong đại số quan hệ",
      body: `Lọc dòng là phép **chọn** (selection, ký hiệu σ) của Codd:

σ\\_{price > 30000}(menu\\_items)

Lưu ý: "SELECT" của SQL là phép **chiếu** (chọn cột), còn phép **chọn** dòng lại là WHERE. Tên gọi lệch nhau này làm nhiều người học nhầm — giờ bạn biết rồi.

> Elmasri, R. and Navathe, S.B. (2016) *Fundamentals of Database Systems*. 7th edn. Boston: Pearson, ch. 8.`,
    },
    {
      section: "ideate",
      title: "Dịch câu hỏi sang điều kiện",
      body: `| Câu hỏi của chủ quán | Điều kiện |
|---|---|
| Món trên 30 nghìn | \`price > 30000\` |
| Món loại trà | \`category = 'tea'\` |
| Mọi món trừ đồ ăn | \`category <> 'food'\` |
| Đơn từ ngày 2/10 | \`ordered_at >= '2026-10-02'\` |

Mỗi điều kiện là một **mệnh đề** có giá trị đúng/sai cho từng dòng.`,
    },
    {
      section: "core",
      title: "Sáu toán tử so sánh",
      body: `| Toán tử | Nghĩa |
|---|---|
| \`=\` | bằng |
| \`<>\` hoặc \`!=\` | khác |
| \`<\` \`<=\` | nhỏ hơn (hoặc bằng) |
| \`>\` \`>=\` | lớn hơn (hoặc bằng) |

SQL dùng **một** dấu \`=\` để so sánh (khác JavaScript). \`<>\` là chuẩn SQL, \`!=\` là phương ngữ được hầu hết DBMS chấp nhận.`,
      sql: { query: "SELECT name, price\nFROM menu_items\nWHERE price > 30000;" },
    },
    {
      section: "core",
      title: "So sánh chữ",
      body: "Chuỗi so sánh theo thứ tự ký tự. Mặc định SQLite **phân biệt hoa thường** khi dùng `=`: `'Tea'` khác `'tea'`. Thêm `COLLATE NOCASE` nếu muốn bỏ qua hoa thường (với chữ không dấu).",
      sql: { query: "SELECT name FROM menu_items WHERE category = 'tea';\n-- thử: WHERE category = 'Tea' COLLATE NOCASE" },
    },
    {
      section: "core",
      title: "So sánh ngày giờ",
      body: "Vì ngày giờ lưu theo ISO 8601 (step 5), so sánh chuỗi chính là so sánh thời gian. `'2026-10-02'` nhỏ hơn `'2026-10-02 09:00'` vì chuỗi ngắn hơn đứng trước.",
      sql: { query: "SELECT id, ordered_at\nFROM orders\nWHERE ordered_at >= '2026-10-02';" },
    },
    {
      section: "core",
      title: "WHERE với biểu thức",
      body: "Hai vế của so sánh có thể là biểu thức. Ví dụ: món mà giảm 10% vẫn trên 30 nghìn. Đừng bọc cột trong hàm nếu tránh được — chặng 7 giải thích vì sao nó làm mất chỉ mục.",
      sql: { query: "SELECT name, price, price * 0.9 AS sau_giam\nFROM menu_items\nWHERE price * 0.9 > 30000;" },
    },
    {
      section: "core",
      title: "Bí danh không dùng được trong WHERE",
      body: "Câu dưới **cố ý sai**: WHERE chạy **trước** SELECT (nhớ sơ đồ step 4), nên lúc lọc, bí danh `gia_k` chưa tồn tại. PostgreSQL báo lỗi; SQLite đôi khi chấp nhận như một phần mở rộng — đừng dựa vào nó. Hãy lặp lại biểu thức.",
      sql: { query: "SELECT name, price / 1000 AS gia_k\nFROM menu_items\nWHERE price / 1000 > 30;" },
    },
    {
      section: "apply",
      title: "Bài tập 1: món rẻ",
      body: "Hiện tên và giá các món **từ 25 nghìn trở xuống**.",
      sql: { query: "", solution: "SELECT name, price FROM menu_items WHERE price <= 25000;", hints: ["Dùng <= cho \"trở xuống\".", "WHERE price <= 25000"] },
    },
    {
      section: "apply",
      title: "Bài tập 2: không phải cà phê",
      body: "Hiện tên các món có loại **khác** `coffee`.",
      sql: { query: "", solution: "SELECT name FROM menu_items WHERE category <> 'coffee';", hints: ["Toán tử khác là <> hoặc !=.", "Chuỗi đặt trong nháy đơn: 'coffee'"] },
    },
    {
      section: "apply",
      title: "Bài tập 3: đơn ngày 1/10",
      body: "Hiện `id` các đơn đặt **trước** ngày 2/10/2026.",
      sql: { query: "", solution: "SELECT id FROM orders WHERE ordered_at < '2026-10-02';", hints: ["So sánh ordered_at với chuỗi ngày ISO.", "WHERE ordered_at < '2026-10-02'"] },
    },
  ],
  quiz: [
    { q: "Trong SQL, phép lọc DÒNG nằm ở mệnh đề nào?", o: ["SELECT", "FROM", "WHERE", "AS"], a: 2, why: "WHERE là phép chọn σ; SELECT là phép chiếu (cột)." },
    { kind: "output", q: "Có mấy dòng? (giá: 29k, 35k, 25k, 20k, 45k, 39k)", code: "SELECT name FROM menu_items WHERE price >= 35000;", o: ["2", "3", "4", "6"], a: 1, why: "35k, 45k, 39k." },
    { kind: "blank", q: "Điền toán tử \"khác\" theo chuẩn SQL.", code: "WHERE category ___ 'food'", a: "<>", why: "<> là chuẩn; != là phương ngữ phổ biến." },
    { kind: "truefalse", q: "WHERE category = 'Tea' tìm được món có category 'tea' trong SQLite (mặc định).", a: false, why: "So sánh = mặc định phân biệt hoa thường." },
    { q: "Vì sao không dùng bí danh SELECT trong WHERE?", o: ["Bí danh quá dài", "WHERE chạy trước SELECT nên bí danh chưa tồn tại", "SQL cấm bí danh", "WHERE chỉ nhận số"], a: 1, why: "Thứ tự xử lý: FROM → WHERE → SELECT." },
    { kind: "output", q: "Kết quả là gì?", code: "SELECT '2026-10-02' < '2026-10-02 09:00';", o: ["1", "0", "NULL", "Lỗi"], a: 0, why: "Chuỗi ngắn hơn là tiền tố nên đứng trước → TRUE (1)." },
    { kind: "match", q: "Nối câu hỏi với điều kiện.", pairs: [["Món loại trà", "category = 'tea'"], ["Trên 30 nghìn", "price > 30000"], ["Từ ngày 2/10", "ordered_at >= '2026-10-02'"]], why: "Mỗi câu hỏi thành một mệnh đề đúng/sai." },
    { kind: "multi", q: "WHERE bỏ những dòng có điều kiện bằng gì?", o: ["TRUE", "FALSE", "NULL", "1"], a: [1, 2], why: "Chỉ dòng TRUE được giữ." },
  ],
};
