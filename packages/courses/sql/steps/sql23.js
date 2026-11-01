// Step 23 — INSERT, UPDATE, DELETE. Mở chặng 5.
export default {
  id: "sql23",
  lang: "sql",
  file: "hat/dml.sql",
  duration: "75 phút",
  summary: "Thêm, sửa, xoá dữ liệu đúng cách: INSERT nhiều dòng và INSERT … SELECT, UPDATE có điều kiện và tính từ bảng khác, DELETE an toàn.",
  slides: [
    {
      section: "intro",
      title: "Chặng 5: ghi dữ liệu an toàn",
      body: `Đọc sai chỉ làm báo cáo sai; **ghi sai là mất dữ liệu thật**. Chặng 5: INSERT/UPDATE/DELETE → UPSERT, RETURNING → giao dịch ACID → view, trigger → SQL Injection.

Mọi ô SQL vẫn chạy trên bản sao riêng — cứ xoá thoải mái, bấm **Đặt lại** là về nguyên trạng.`,
    },
    {
      section: "visual",
      title: "Sơ đồ tư duy: chặng 5",
      visual: "write-mindmap",
      body: "Ba nhánh trên là ba lệnh ghi cơ bản; các nhánh còn lại là cách ghi **an toàn**: gộp, giao dịch, tự động hoá, tham số hoá.",
    },
    {
      section: "research",
      title: "Quy tắc \"SELECT trước, ghi sau\"",
      body: `Sự cố dữ liệu kinh điển nhất là \`UPDATE\`/\`DELETE\` **quên WHERE**. Thực hành an toàn được các đội vận hành khuyên dùng: viết câu SELECT với đúng WHERE đó, kiểm số dòng, rồi mới đổi SELECT thành UPDATE/DELETE — và luôn trong giao dịch (step 25).

> Kleppmann, M. (2017) *Designing Data-Intensive Applications*. Sebastopol: O'Reilly, ch. 7.`,
    },
    {
      section: "ideate",
      title: "Ba việc của quầy thu ngân",
      body: "1. Khách gọi món → **INSERT** đơn và dòng đơn.\n2. Tăng giá Trà đào 2.000đ → **UPDATE**.\n3. Huỷ đơn nhập nhầm → **DELETE** (hoặc tốt hơn: đánh dấu huỷ).",
    },
    {
      section: "core",
      title: "INSERT ghi rõ cột",
      body: "Luôn liệt kê cột: thêm cột vào bảng sau này không làm câu INSERT gãy. Bỏ `id` thì `INTEGER PRIMARY KEY` tự cấp.",
      sql: { query: "INSERT INTO menu_items (name, category, price)\nVALUES ('Sữa chua', 'food', 30000), ('Cacao', 'tea', 32000);\nSELECT * FROM menu_items;" },
    },
    {
      section: "core",
      title: "INSERT … SELECT",
      body: "Chép kết quả truy vấn vào bảng — ví dụ lưu bản tổng kết ngày.",
      sql: { query: "CREATE TABLE daily (day TEXT PRIMARY KEY, orders INT);\nINSERT INTO daily (day, orders)\nSELECT date(ordered_at), COUNT(*) FROM orders GROUP BY 1;\nSELECT * FROM daily;" },
    },
    {
      section: "core",
      title: "UPDATE có điều kiện",
      body: "Tăng giá trà 2.000đ. Chạy SELECT với cùng WHERE trước để chắc chắn đúng dòng.",
      sql: { query: "UPDATE menu_items SET price = price + 2000 WHERE category = 'tea';\nSELECT name, price FROM menu_items WHERE category = 'tea';" },
    },
    {
      section: "core",
      title: "UPDATE từ bảng khác",
      body: "`UPDATE … FROM` (SQLite 3.33+, PostgreSQL): ghi tổng ly đã bán vào cột mới.",
      sql: { query: "ALTER TABLE menu_items ADD COLUMN sold INT DEFAULT 0;\nUPDATE menu_items SET sold = s.n\nFROM (SELECT item_id, SUM(qty) AS n FROM order_items GROUP BY item_id) s\nWHERE s.item_id = menu_items.id;\nSELECT name, sold FROM menu_items;" },
    },
    {
      section: "core",
      title: "DELETE và xoá mềm",
      body: "Xoá cứng mất dấu vết. Hệ thống tiền bạc thường **xoá mềm**: thêm cột `cancelled_at`, lọc `WHERE cancelled_at IS NULL` khi đọc.",
      sql: { query: "ALTER TABLE orders ADD COLUMN cancelled_at TEXT;\nUPDATE orders SET cancelled_at = '2026-10-01 08:31' WHERE id = 5;\nSELECT id, cancelled_at FROM orders WHERE cancelled_at IS NULL;" },
    },
    {
      section: "apply",
      title: "Bài tập 1: món mới",
      body: "Thêm món `Bạc xỉu muối`, loại `coffee`, giá `35000`; rồi hiện tên và giá các món `coffee`.",
      sql: { query: "", solution: "INSERT INTO menu_items (name, category, price) VALUES ('Bạc xỉu muối', 'coffee', 35000); SELECT name, price FROM menu_items WHERE category = 'coffee';", hints: ["INSERT INTO menu_items (name, category, price) VALUES (…);", "Kết thúc bằng SELECT để ô chấm được."] },
    },
    {
      section: "apply",
      title: "Bài tập 2: giảm giá đồ ăn",
      body: "Giảm **10%** giá mọi món `food` (làm tròn về số nguyên), rồi hiện `name, price` của món food.",
      sql: { query: "", solution: "UPDATE menu_items SET price = CAST(round(price * 0.9) AS INTEGER) WHERE category = 'food'; SELECT name, price FROM menu_items WHERE category = 'food';", hints: ["price * 0.9 rồi làm tròn.", "CAST(round(price * 0.9) AS INTEGER)"] },
    },
    {
      section: "apply",
      title: "Bài tập 3: xoá dòng đơn",
      body: "Xoá **bánh mì** (item 4) khỏi đơn 3, rồi hiện mọi dòng của đơn 3.",
      sql: { query: "", solution: "DELETE FROM order_items WHERE order_id = 3 AND item_id = 4; SELECT * FROM order_items WHERE order_id = 3;", hints: ["WHERE đủ cả order_id và item_id.", "Thiếu WHERE là xoá sạch bảng!"] },
    },
  ],
  quiz: [
    { q: "UPDATE menu_items SET price = 0; (không WHERE) làm gì?", o: ["Báo lỗi", "Sửa mọi dòng", "Sửa dòng đầu", "Không làm gì"], a: 1, why: "Thiếu WHERE là áp cho cả bảng." },
    { kind: "truefalse", q: "Liệt kê cột trong INSERT giúp câu lệnh bền khi bảng thêm cột.", a: true, why: "Không phụ thuộc vị trí cột." },
    { q: "Xoá mềm là?", o: ["DELETE chậm", "Đánh dấu cột cancelled_at thay vì xoá dòng", "DROP TABLE", "TRUNCATE"], a: 1, why: "Giữ dấu vết cho kế toán, khôi phục được." },
    { kind: "blank", q: "Chép kết quả truy vấn vào bảng.", code: "INSERT INTO daily (day, orders) ___ date(ordered_at), COUNT(*) FROM orders GROUP BY 1;", a: "SELECT", why: "INSERT … SELECT." },
    { kind: "order", q: "Quy trình sửa dữ liệu an toàn?", items: ["Viết SELECT với WHERE", "Kiểm số dòng", "Đổi thành UPDATE trong giao dịch", "COMMIT"], a: [0, 1, 2, 3], why: "SELECT trước, ghi sau." },
  ],
};
