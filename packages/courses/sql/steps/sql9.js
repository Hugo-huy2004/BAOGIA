// Step 9 — NULL và logic ba giá trị.
export default {
  id: "sql9",
  lang: "sql",
  file: "hat/null.sql",
  duration: "60 phút",
  summary: "Nắm logic ba giá trị của SQL, lọc bằng IS NULL, tránh bẫy NOT IN có NULL và dùng IS DISTINCT FROM.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: `NULL là nguồn lỗi số một của người mới học SQL — truy vấn chạy êm nhưng **thiếu dòng**. Step này dạy:

- Logic ba giá trị: TRUE, FALSE, **UNKNOWN**.
- \`IS NULL\`, \`IS NOT NULL\`.
- Bẫy \`NOT IN\` với NULL.
- \`IS\` / \`IS NOT\` để so sánh "an toàn với NULL".`,
    },
    {
      section: "visual",
      title: "Bảng chân trị ba giá trị",
      visual: "three-valued",
      body: "Đọc ô giữa: TRUE AND NULL = NULL (không biết), FALSE AND NULL = FALSE (chắc chắn sai). Với OR thì ngược lại: TRUE OR NULL = TRUE.",
    },
    {
      section: "research",
      title: "Tranh luận về NULL",
      body: `Codd (1979) đưa NULL vào mô hình để biểu diễn "thiếu thông tin". C.J. Date phản đối kịch liệt: logic ba giá trị làm nhiều định luật quen thuộc không còn đúng — ví dụ \`x = x\` không phải lúc nào cũng TRUE.

Bài học thực tế: **khai NOT NULL cho mọi cột có thể** (chặng 4), và luôn nghĩ "nếu cột này NULL thì sao" khi viết WHERE.

> Codd, E.F. (1979) 'Extending the database relational model to capture more meaning', *ACM TODS*, 4(4), pp. 397–434.
>
> Date, C.J. (2015) *SQL and Relational Theory*. 3rd edn. O'Reilly, ch. 4.`,
    },
    {
      section: "ideate",
      title: "Câu hỏi của chủ quán",
      body: `"Có bao nhiêu đơn **không phải** của Lan (id 1)?"

Viết nhanh: \`WHERE customer_id <> 1\`. Kết quả **thiếu** hai đơn khách vãng lai — vì \`NULL <> 1\` là UNKNOWN, không phải TRUE.

Câu đúng phải nói rõ: khác 1 **hoặc** không có khách.`,
    },
    {
      section: "core",
      title: "So sánh với NULL luôn ra NULL",
      body: "Đếm số dòng của câu dưới: chỉ 4, không phải 6. Hai đơn vãng lai biến mất.",
      sql: { query: "SELECT id, customer_id\nFROM orders\nWHERE customer_id <> 1;" },
    },
    {
      section: "core",
      title: "IS NULL và IS NOT NULL",
      body: "Kiểm tra NULL **chỉ** bằng `IS NULL` / `IS NOT NULL`. `= NULL` luôn ra NULL nên không bao giờ khớp dòng nào.",
      sql: { query: "SELECT id, ordered_at\nFROM orders\nWHERE customer_id IS NULL;" },
    },
    {
      section: "core",
      title: "IS: so sánh an toàn với NULL",
      body: "SQLite có `IS` / `IS NOT` dùng như `=` / `<>` nhưng coi hai NULL là bằng nhau. Chuẩn SQL viết `IS NOT DISTINCT FROM` / `IS DISTINCT FROM` (PostgreSQL hỗ trợ).",
      sql: { query: "SELECT id, customer_id\nFROM orders\nWHERE customer_id IS NOT 1;" },
    },
    {
      section: "core",
      title: "Bẫy NOT IN",
      body: "`x NOT IN (1, NULL)` nghĩa là `x <> 1 AND x <> NULL` — vế sau luôn UNKNOWN, nên **không dòng nào** được chọn. Lỗi này hay gặp khi danh sách đến từ truy vấn con (step 16). Câu dưới trả về 0 dòng.",
      sql: { query: "SELECT name FROM menu_items\nWHERE id NOT IN (1, NULL);" },
    },
    {
      section: "core",
      title: "NULL trong biểu thức hiển thị",
      body: "`coalesce` (step 5) và `ifnull(a, b)` thay NULL khi hiển thị. `nullif(a, b)` làm ngược lại: trả NULL nếu a = b — hữu ích để tránh chia cho 0.",
      sql: { query: "SELECT id,\n       ifnull(customer_id, 0) AS khach,\n       10 / nullif(0, 0) AS chia_an_toan\nFROM orders;" },
    },
    {
      section: "apply",
      title: "Bài tập 1: khách chưa có số",
      body: "Hiện tên các khách **chưa có** số điện thoại.",
      sql: { query: "", solution: "SELECT name FROM customers WHERE phone IS NULL;", hints: ["Không dùng = NULL.", "WHERE phone IS NULL"] },
    },
    {
      section: "apply",
      title: "Bài tập 2: đơn không phải của Lan",
      body: "Hiện `id` **mọi** đơn không phải của khách id 1 — kể cả đơn vãng lai.",
      sql: { query: "", solution: "SELECT id FROM orders WHERE customer_id IS NOT 1;", hints: ["<> 1 sẽ bỏ sót NULL.", "Dùng IS NOT 1, hoặc customer_id <> 1 OR customer_id IS NULL"] },
    },
    {
      section: "apply",
      title: "Bài tập 3: đơn có khách",
      body: "Hiện `id` và `customer_id` các đơn **có** khách đăng ký.",
      sql: { query: "", solution: "SELECT id, customer_id FROM orders WHERE customer_id IS NOT NULL;", hints: ["Ngược lại của IS NULL.", "WHERE customer_id IS NOT NULL"] },
    },
  ],
  quiz: [
    { kind: "output", q: "Kết quả là gì?", code: "SELECT NULL = NULL;", o: ["1", "0", "NULL", "Lỗi"], a: 2, why: "So sánh với NULL ra UNKNOWN (NULL)." },
    { kind: "output", q: "Kết quả là gì?", code: "SELECT 1 = 1 OR NULL;", o: ["1", "0", "NULL", "Lỗi"], a: 0, why: "TRUE OR bất cứ gì = TRUE." },
    { kind: "output", q: "Kết quả là gì?", code: "SELECT 1 = 0 AND NULL;", o: ["1", "0", "NULL", "Lỗi"], a: 1, why: "FALSE AND bất cứ gì = FALSE." },
    { q: "8 đơn, 2 đơn có customer_id NULL, 2 đơn của khách 1. WHERE customer_id <> 1 trả mấy dòng?", o: ["6", "4", "8", "2"], a: 1, why: "NULL <> 1 là UNKNOWN nên 2 đơn vãng lai bị bỏ." },
    { kind: "blank", q: "Điền để lọc khách chưa có số.", code: "WHERE phone ___ NULL", a: "IS", why: "Chỉ IS NULL kiểm tra được NULL." },
    { kind: "truefalse", q: "WHERE id NOT IN (1, NULL) trả về mọi món trừ món 1.", a: false, why: "Không trả dòng nào: so với NULL luôn UNKNOWN." },
    { kind: "match", q: "Nối hàm với công dụng.", pairs: [["coalesce(a, b)", "giá trị đầu không NULL"], ["nullif(a, b)", "NULL nếu a = b"], ["ifnull(a, b)", "b nếu a là NULL"]], why: "Ba hàm xử lý NULL hay dùng." },
  ],
};
