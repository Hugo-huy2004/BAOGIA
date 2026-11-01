// Step 19 — CREATE TABLE, khoá chính, khoá ngoại.
export default {
  id: "sql19",
  lang: "sql",
  file: "hat/schema.sql",
  duration: "75 phút",
  summary: "Tạo bảng bằng CREATE TABLE, khai khoá chính, khoá ngoại với ON DELETE, sửa lược đồ bằng ALTER TABLE và xoá bằng DROP.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: "Biến ERD thành bảng thật: `CREATE TABLE`, khoá chính, khoá ngoại, hành vi khi xoá cha (`ON DELETE`), rồi `ALTER TABLE` để thêm cột cho bảng đã có dữ liệu.",
    },
    {
      section: "visual",
      title: "Lược đồ cần dựng",
      visual: "erd-hat",
      body: "Step này dựng `branches` và nối `orders` với nó. `categories`, `tags`, `item_tags` để dành step 21–22.",
    },
    {
      section: "research",
      title: "Toàn vẹn tham chiếu",
      body: `Chuẩn SQL-92 định nghĩa năm hành vi khi dòng cha bị xoá/sửa: \`NO ACTION\`, \`RESTRICT\`, \`CASCADE\`, \`SET NULL\`, \`SET DEFAULT\`. Chọn sai là mất dữ liệu (CASCADE xoá nhầm cả lịch sử đơn) hoặc kẹt dữ liệu (RESTRICT không cho đóng chi nhánh).

> ISO/IEC (1992) *ISO/IEC 9075:1992*, §11.8 <referential constraint definition>.`,
    },
    {
      section: "ideate",
      title: "Đóng một chi nhánh thì sao?",
      body: `- Xoá luôn mọi đơn của chi nhánh? → **Không**: mất doanh thu lịch sử.
- Chặn xoá khi còn đơn? → \`RESTRICT\` — an toàn.
- Hay giữ đơn, để chi nhánh NULL? → \`SET NULL\` — mất thông tin đơn ở đâu.

Với tiền: **RESTRICT** và "đánh dấu đã đóng" thay vì xoá.`,
    },
    {
      section: "core",
      title: "CREATE TABLE",
      body: "Tên bảng, rồi danh sách cột (tên, kiểu, ràng buộc). `STRICT` bắt kiểu chặt như PostgreSQL.",
      sql: { query: "CREATE TABLE branches (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL,\n  address TEXT NOT NULL\n) STRICT;\nINSERT INTO branches VALUES (1, 'Hạt Quận 1', '12 Lê Lợi'), (2, 'Hạt Thủ Đức', '5 Võ Văn Ngân');\nSELECT * FROM branches;" },
    },
    {
      section: "core",
      title: "STRICT chặn sai kiểu",
      body: "Câu dưới **cố ý sai**: bảng STRICT không nhận chữ vào cột INTEGER.",
      sql: { query: "CREATE TABLE t (n INTEGER) STRICT;\nINSERT INTO t VALUES ('mười');" },
    },
    {
      section: "core",
      title: "Khoá ngoại với ON DELETE",
      body: "`order_items` đi theo đơn (CASCADE); đơn không cho xoá chi nhánh còn dữ liệu (RESTRICT). Thử `DELETE FROM branches WHERE id = 1;` sau khi chạy.",
      sql: { query: "CREATE TABLE branches (id INTEGER PRIMARY KEY, name TEXT NOT NULL);\nINSERT INTO branches VALUES (1, 'Hạt Quận 1');\nCREATE TABLE shifts (\n  id INTEGER PRIMARY KEY,\n  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,\n  starts_at TEXT NOT NULL\n);\nINSERT INTO shifts VALUES (1, 1, '2026-10-01 07:00');\nSELECT s.id, b.name FROM shifts s JOIN branches b ON b.id = s.branch_id;" },
    },
    {
      section: "core",
      title: "ALTER TABLE thêm cột",
      body: "Thêm `branch_id` vào `orders` đã có dữ liệu. SQLite không cho thêm cột khoá ngoại có DEFAULT khác NULL, nên làm hai bước: thêm cột cho phép NULL, rồi UPDATE gán chi nhánh cho đơn cũ.",
      sql: { query: "CREATE TABLE branches (id INTEGER PRIMARY KEY, name TEXT NOT NULL);\nINSERT INTO branches VALUES (1, 'Hạt Quận 1');\nALTER TABLE orders ADD COLUMN branch_id INTEGER REFERENCES branches(id);\nUPDATE orders SET branch_id = 1;\nSELECT id, branch_id FROM orders;" },
    },
    {
      section: "core",
      title: "DROP TABLE",
      body: "Xoá cả bảng lẫn dữ liệu — không hoàn tác được. `IF EXISTS` tránh lỗi khi bảng không có.",
      sql: { query: "CREATE TABLE tam (x);\nDROP TABLE IF EXISTS tam;\nSELECT name FROM sqlite_schema WHERE type = 'table';" },
    },
    {
      section: "apply",
      title: "Bài tập 1: bảng danh mục",
      body: "Tạo bảng `categories(id INTEGER PRIMARY KEY, name TEXT NOT NULL)`, thêm 3 dòng `(1,'coffee'), (2,'tea'), (3,'food')`, rồi `SELECT * FROM categories;`",
      sql: { query: "", solution: "CREATE TABLE categories (id INTEGER PRIMARY KEY, name TEXT NOT NULL); INSERT INTO categories VALUES (1,'coffee'),(2,'tea'),(3,'food'); SELECT * FROM categories;", hints: ["Ba câu: CREATE, INSERT, SELECT.", "Ô chấm kết quả của câu SELECT cuối."] },
    },
    {
      section: "apply",
      title: "Bài tập 2: thêm cột ghi chú",
      body: "Thêm cột `note TEXT` vào `customers`, rồi hiện `name, note` của mọi khách.",
      sql: { query: "", solution: "ALTER TABLE customers ADD COLUMN note TEXT; SELECT name, note FROM customers;", hints: ["ALTER TABLE … ADD COLUMN.", "Cột mới mặc định NULL."] },
    },
  ],
  quiz: [
    { q: "Xoá đơn thì dòng đơn cũng xoá theo — dùng?", o: ["ON DELETE RESTRICT", "ON DELETE CASCADE", "ON DELETE SET NULL", "DROP TABLE"], a: 1, why: "Thực thể yếu đi theo cha." },
    { q: "Vì sao đơn hàng không nên CASCADE theo chi nhánh?", o: ["Chậm", "Mất lịch sử doanh thu", "Lỗi cú pháp", "SQLite không hỗ trợ"], a: 1, why: "Tiền và lịch sử phải giữ — dùng RESTRICT." },
    { kind: "truefalse", q: "Bảng STRICT nhận chuỗi 'mười' vào cột INTEGER.", a: false, why: "STRICT báo lỗi kiểu." },
    { kind: "blank", q: "Thêm cột vào bảng có sẵn.", code: "ALTER TABLE orders ___ COLUMN branch_id INTEGER;", a: "ADD", why: "ALTER TABLE … ADD COLUMN." },
    { kind: "multi", q: "Hành vi ON DELETE hợp lệ theo chuẩn?", o: ["CASCADE", "RESTRICT", "SET NULL", "IGNORE"], a: [0, 1, 2], why: "Năm hành vi: NO ACTION, RESTRICT, CASCADE, SET NULL, SET DEFAULT." },
  ],
};
