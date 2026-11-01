// Step 39 — Từ SQLite sang PostgreSQL và MySQL.
export default {
  id: "sql39",
  lang: "sql",
  file: "hat/dialects.md",
  duration: "60 phút",
  summary: "Mang kiến thức sang PostgreSQL và MySQL: bảng đối chiếu kiểu dữ liệu, tự tăng, ngày giờ, chuỗi, UPSERT, JSON, tìm kiếm — và cách chọn DBMS.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: "Khoảng 90% những gì bạn học **giống hệt** ở mọi DBMS: SELECT, JOIN, GROUP BY, CTE, window function. 10% còn lại là \"phương ngữ\". Step này là bảng tra để bạn sang PostgreSQL (Supabase, Neon) hay MySQL không bỡ ngỡ.",
    },
    {
      section: "visual",
      title: "Sơ đồ toàn khoá",
      visual: "sql-mindmap",
      body: "Tám nhánh bạn đã đi qua đều là **chuẩn SQL**. Phần khác biệt chủ yếu nằm ở nhánh Thiết kế (kiểu dữ liệu) và Hiệu năng (chỉ mục đặc thù).",
    },
    {
      section: "research",
      title: "Mức tuân thủ chuẩn",
      body: `Không DBMS nào tuân thủ trọn chuẩn SQL. PostgreSQL thường được coi là gần chuẩn nhất trong nhóm mã nguồn mở; MySQL có nhiều mở rộng riêng; SQLite cố ý tối giản nhưng ngày càng đủ (window function 2018, RETURNING 2021, STRICT 2021).

> Winand, M. (2025) *Modern SQL — feature comparison*. Available at: https://modern-sql.com/`,
    },
    {
      section: "core",
      title: "Kiểu dữ liệu",
      body: `| Ý | SQLite | PostgreSQL | MySQL |
|---|---|---|---|
| Số nguyên | INTEGER | integer / bigint | INT / BIGINT |
| Tiền chính xác | INTEGER (đồng) | numeric(12,0) | DECIMAL(12,0) |
| Chữ | TEXT | text / varchar | VARCHAR(n) / TEXT |
| Ngày giờ | TEXT ISO 8601 | timestamptz | DATETIME |
| Đúng/sai | 0/1 | boolean | TINYINT(1) |
| JSON | TEXT + json_* | jsonb | JSON |`,
    },
    {
      section: "core",
      title: "Tự tăng và ngày giờ",
      body: `| Việc | SQLite | PostgreSQL | MySQL |
|---|---|---|---|
| id tự tăng | INTEGER PRIMARY KEY | GENERATED ALWAYS AS IDENTITY | AUTO_INCREMENT |
| Bây giờ | datetime('now') | now() | NOW() |
| Lấy ngày | date(t) | t::date | DATE(t) |
| Cộng 7 ngày | date(t, '+7 days') | t + interval '7 days' | t + INTERVAL 7 DAY |
| Giờ | strftime('%H', t) | extract(hour from t) | HOUR(t) |`,
    },
    {
      section: "core",
      title: "Chuỗi, UPSERT, tìm kiếm",
      body: `| Việc | SQLite | PostgreSQL | MySQL |
|---|---|---|---|
| Ghép chuỗi | a \\|\\| b | a \\|\\| b | CONCAT(a, b) |
| Gộp thành chuỗi | group_concat | string_agg | GROUP_CONCAT |
| UPSERT | ON CONFLICT | ON CONFLICT | ON DUPLICATE KEY UPDATE |
| Lấy dòng vừa ghi | RETURNING | RETURNING | (không có — LAST_INSERT_ID()) |
| Không phân biệt hoa thường | LIKE (ASCII) | ILIKE | mặc định theo collation |
| Toàn văn | FTS5 | tsvector + GIN | FULLTEXT |
| Tham số | ? | $1, $2 | ? |`,
    },
    {
      section: "core",
      title: "Chọn DBMS nào",
      body: "- **SQLite**: app di động, công cụ một người dùng, nguyên mẫu, dữ liệu đi kèm ứng dụng.\n- **PostgreSQL**: lựa chọn mặc định cho web nhiều người dùng; JSON, toàn văn, mở rộng mạnh.\n- **MySQL/MariaDB**: hosting phổ thông, hệ sinh thái PHP/WordPress (khoá Coding dùng MySQL).\n\nGói miễn phí để luyện: Supabase, Neon (PostgreSQL).",
    },
    {
      section: "apply",
      title: "Áp dụng: dịch một truy vấn",
      body: `Dịch câu SQLite này sang PostgreSQL (viết ra giấy hoặc tệp \`hat/dialects.md\`):

~~~sql
SELECT strftime('%H', ordered_at) AS gio, group_concat(id, ',') AS don
FROM orders
WHERE ordered_at >= date('now', '-7 days')
GROUP BY gio;
~~~

Đáp án gợi ý: \`extract(hour from ordered_at)\`, \`string_agg(id::text, ',')\`, \`now() - interval '7 days'\`.`,
    },
  ],
  quiz: [
    { kind: "match", q: "Nối việc với cú pháp PostgreSQL.", pairs: [["Gộp thành chuỗi", "string_agg"], ["Không phân biệt hoa thường", "ILIKE"], ["Tham số", "$1"]], why: "Phương ngữ PostgreSQL." },
    { q: "UPSERT trong MySQL viết thế nào?", o: ["ON CONFLICT", "ON DUPLICATE KEY UPDATE", "MERGE ONLY", "UPSERT INTO"], a: 1, why: "MySQL không có ON CONFLICT." },
    { kind: "truefalse", q: "CTE và window function học ở SQLite dùng gần như nguyên vẹn trên PostgreSQL.", a: true, why: "Đều là chuẩn SQL." },
    { q: "Kiểu ngày giờ có múi giờ khuyên dùng ở PostgreSQL?", o: ["text", "timestamptz", "date", "integer"], a: 1, why: "Lưu theo UTC, hiển thị theo múi giờ phiên." },
  ],
};
