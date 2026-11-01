// Step 20 — Ràng buộc: NOT NULL, UNIQUE, CHECK, DEFAULT.
export default {
  id: "sql20",
  lang: "sql",
  file: "hat/constraints.sql",
  duration: "60 phút",
  summary: "Để cơ sở dữ liệu tự chặn dữ liệu sai bằng NOT NULL, UNIQUE, CHECK, DEFAULT và cột sinh tự động.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: "Mã ứng dụng có thể quên kiểm tra; cơ sở dữ liệu thì **không bao giờ quên**. Ràng buộc là hàng rào cuối cùng: giá âm, số điện thoại trùng, đơn không có giờ — đều bị chặn tại chỗ.",
    },
    {
      section: "visual",
      title: "Ràng buộc trong sơ đồ tư duy",
      visual: "design-mindmap",
      body: "Nhánh **Ràng buộc** của chặng 4: NOT NULL (bắt buộc), UNIQUE (không trùng), CHECK (điều kiện), DEFAULT (giá trị mặc định).",
    },
    {
      section: "research",
      title: "Toàn vẹn ở tầng dữ liệu",
      body: `Nguyên tắc "đặt luật gần dữ liệu nhất" được các tài liệu thiết kế cơ sở dữ liệu nhấn mạnh: luật trong DBMS áp cho **mọi** ứng dụng, script, người dùng — luật trong mã chỉ áp cho mã đó.

> Elmasri, R. and Navathe, S.B. (2016) *Fundamentals of Database Systems*. 7th edn. Pearson, ch. 5.`,
    },
    {
      section: "ideate",
      title: "Luật nghiệp vụ của Hạt",
      body: `- Món phải có tên; giá > 0 và ≤ 500.000.
- Số điện thoại khách không trùng (nhưng được bỏ trống).
- Số ly từ 1 đến 50.
- Đơn mặc định thời điểm là lúc tạo.

Mỗi dòng là một ràng buộc.`,
    },
    {
      section: "core",
      title: "CHECK",
      body: "Câu INSERT thứ hai **cố ý sai** (vi phạm ràng buộc) — đọc lỗi `CHECK constraint failed`.",
      sql: { query: "CREATE TABLE items (\n  name TEXT NOT NULL,\n  price INTEGER NOT NULL CHECK (price > 0 AND price <= 500000)\n);\nINSERT INTO items VALUES ('Trà', 35000);\nINSERT INTO items VALUES ('Lỗi', -1);" },
    },
    {
      section: "core",
      title: "UNIQUE và NULL",
      body: "UNIQUE cho phép **nhiều NULL** (NULL không bằng NULL — step 9). Đúng ý: nhiều khách chưa có số vẫn được.",
      sql: { query: "CREATE TABLE k (phone TEXT UNIQUE);\nINSERT INTO k VALUES (NULL), (NULL), ('0901');\nSELECT COUNT(*) FROM k;" },
    },
    {
      section: "core",
      title: "DEFAULT",
      body: "Không ghi cột thì lấy giá trị mặc định — kể cả biểu thức như thời điểm hiện tại.",
      sql: { query: "CREATE TABLE logs (\n  id INTEGER PRIMARY KEY,\n  msg TEXT NOT NULL,\n  at TEXT NOT NULL DEFAULT (datetime('now'))\n);\nINSERT INTO logs (msg) VALUES ('mở quán');\nSELECT msg, at IS NOT NULL AS co_gio FROM logs;" },
    },
    {
      section: "core",
      title: "Cột sinh tự động",
      body: "`GENERATED ALWAYS AS` tính từ cột khác — luôn đúng, không ai sửa tay được. Ví dụ: tên chữ thường để tìm kiếm (step 8).",
      sql: { query: "CREATE TABLE m (\n  name TEXT NOT NULL,\n  name_lower TEXT GENERATED ALWAYS AS (lower(name)) VIRTUAL\n);\nINSERT INTO m (name) VALUES ('Cold BREW');\nSELECT * FROM m;" },
    },
    {
      section: "core",
      title: "Ràng buộc nhiều cột",
      body: "Viết sau danh sách cột: UNIQUE trên cặp, CHECK so hai cột.",
      sql: { query: "CREATE TABLE promos (\n  code TEXT NOT NULL,\n  branch_id INTEGER NOT NULL,\n  starts TEXT NOT NULL,\n  ends TEXT NOT NULL,\n  UNIQUE (code, branch_id),\n  CHECK (ends > starts)\n);\nINSERT INTO promos VALUES ('T10', 1, '2026-10-01', '2026-10-31');\nSELECT * FROM promos;" },
    },
    {
      section: "apply",
      title: "Bài tập: bảng dòng đơn an toàn",
      body: "Tạo bảng `lines(order_id INTEGER NOT NULL, qty INTEGER NOT NULL CHECK (qty BETWEEN 1 AND 50))`, chèn `(1, 2)`, rồi `SELECT * FROM lines;`",
      sql: { query: "", solution: "CREATE TABLE lines (order_id INTEGER NOT NULL, qty INTEGER NOT NULL CHECK (qty BETWEEN 1 AND 50)); INSERT INTO lines VALUES (1, 2); SELECT * FROM lines;", hints: ["CHECK (qty BETWEEN 1 AND 50).", "Kết thúc bằng SELECT * FROM lines;"] },
    },
  ],
  quiz: [
    { kind: "truefalse", q: "Cột UNIQUE trong SQLite cho phép nhiều dòng NULL.", a: true, why: "NULL không bằng NULL." },
    { q: "Chặn giá âm dùng?", o: ["NOT NULL", "UNIQUE", "CHECK (price > 0)", "DEFAULT 0"], a: 2, why: "CHECK kiểm điều kiện." },
    { kind: "blank", q: "Mặc định thời điểm tạo.", code: "at TEXT ___ (datetime('now'))", a: "DEFAULT", why: "DEFAULT (biểu thức)." },
    { q: "Ưu điểm cột GENERATED?", o: ["Nhanh hơn", "Luôn khớp với cột nguồn, không sửa tay được", "Tiết kiệm bộ nhớ", "Bắt buộc theo chuẩn"], a: 1, why: "Một nguồn sự thật." },
    { q: "Vì sao đặt luật trong DBMS thay vì chỉ trong mã?", o: ["Đẹp hơn", "Áp cho mọi ứng dụng, script, người dùng", "Chạy nhanh hơn", "Bắt buộc"], a: 1, why: "Hàng rào cuối cùng." },
  ],
};
