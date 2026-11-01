// Step 27 — SQL Injection và truy vấn tham số hoá. Kết chặng 5.
export default {
  id: "sql27",
  lang: "sql",
  file: "hat/injection.sql",
  duration: "75 phút",
  summary: "Hiểu SQL Injection hoạt động thế nào, tự thử trên bản sao, và chặn tận gốc bằng câu lệnh tham số hoá cùng quyền tối thiểu.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: "Ô tìm kiếm của app ghép chữ người dùng gõ thẳng vào câu SQL. Gõ đúng một dấu nháy là **thay đổi ý nghĩa câu lệnh** — đó là SQL Injection, lỗ hổng nằm trong OWASP Top 10 suốt hai thập kỷ.",
    },
    {
      section: "visual",
      title: "Tham số hoá trong sơ đồ",
      visual: "write-mindmap",
      body: "Nhánh **?** — dấu giữ chỗ tham số. Dữ liệu đi đường riêng, không bao giờ trở thành mã SQL.",
    },
    {
      section: "research",
      title: "OWASP",
      body: `OWASP xếp Injection vào nhóm A03 (2021). Biện pháp số một trong bảng tra cứu của OWASP: **câu lệnh chuẩn bị sẵn với truy vấn tham số hoá** — không phải lọc ký tự, không phải escape thủ công.

> OWASP Foundation (2021) *OWASP Top 10: A03 Injection*. Available at: https://owasp.org/Top10/A03_2021-Injection/ (CC BY-SA 4.0).`,
    },
    {
      section: "ideate",
      title: "Câu SQL ghép chuỗi",
      body: `Mã ứng dụng (giả):

~~~js
db.exec("SELECT name FROM customers WHERE phone = '" + input + "'");
~~~

Nếu \`input\` là \`' OR '1'='1\` thì câu thành \`… WHERE phone = '' OR '1'='1'\` — **mọi** khách hiện ra.`,
    },
    {
      section: "core",
      title: "Tự thử tấn công",
      body: "Đây là câu SQL **sau khi** ứng dụng ghép chuỗi độc. Chạy: lộ cả danh bạ. (Bản sao trong trình duyệt — không ảnh hưởng ai.)",
      sql: { query: "SELECT name, phone FROM customers WHERE phone = '' OR '1'='1';" },
    },
    {
      section: "core",
      title: "Injection kiểu UNION",
      body: "Kẻ tấn công ghép thêm UNION để đọc bảng **khác** — ở đây là đọc toàn bộ lược đồ.",
      sql: { query: "SELECT name, phone FROM customers WHERE phone = 'x'\nUNION SELECT name, sql FROM sqlite_schema;" },
    },
    {
      section: "core",
      title: "Câu lệnh tham số hoá",
      body: `Dữ liệu đi **riêng**, DBMS biên dịch câu SQL trước rồi mới gắn giá trị:

~~~js
// Node + better-sqlite3 / pg
db.prepare("SELECT name FROM customers WHERE phone = ?").get(input);
await pool.query("SELECT name FROM customers WHERE phone = $1", [input]);
~~~

\`' OR '1'='1\` giờ chỉ là một chuỗi số điện thoại lạ — không khớp ai.`,
    },
    {
      section: "core",
      title: "Không tham số hoá được tên bảng/cột",
      body: "`?` chỉ thay **giá trị**. Tên cột để sắp xếp (`ORDER BY ?`) phải đi qua **danh sách trắng** trong mã: chỉ chấp nhận `'price'`, `'name'`.",
    },
    {
      section: "core",
      title: "Phòng thủ nhiều lớp",
      body: "- Tham số hoá **mọi** truy vấn.\n- Tài khoản DB của app chỉ có quyền tối thiểu (không DROP, không đọc bảng hệ thống).\n- Không trả thông báo lỗi SQL thô cho người dùng.\n- Ghi nhật ký truy vấn bất thường.",
    },
    {
      section: "apply",
      title: "Bài tập: dấu hiệu bị tấn công",
      body: "Bảng `access_log(q TEXT)` lưu chuỗi người dùng gõ. Tìm các dòng **chứa dấu nháy đơn** (dấu hiệu thử injection).",
      sql: { setup: "CREATE TABLE access_log (q TEXT); INSERT INTO access_log VALUES ('0901000001'), ('x'' OR ''1''=''1'), ('trà'), ('1''; DROP TABLE orders; --');", query: "", solution: "SELECT q FROM access_log WHERE q LIKE '%''%';", hints: ["Trong chuỗi SQL, một dấu nháy đơn viết thành hai: ''", "LIKE '%''%'"] },
    },
    {
      section: "apply",
      title: "Tổng kết chặng 5",
      body: "Bạn ghi được dữ liệu đúng (INSERT/UPDATE/DELETE, UPSERT), trọn vẹn (giao dịch ACID), tự động (view, trigger) và an toàn (tham số hoá). Chặng 6: **truy vấn nâng cao** — CTE và window function, phần mà nhà tuyển dụng hay kiểm tra nhất.",
    },
  ],
  quiz: [
    { q: "Cách chặn SQL Injection tận gốc?", o: ["Lọc dấu nháy", "Câu lệnh tham số hoá", "Giới hạn độ dài", "Mã hoá input"], a: 1, why: "OWASP: biện pháp số một." },
    { kind: "output", q: "Câu sau trả mấy khách? (4 khách)", code: "SELECT name FROM customers WHERE phone = '' OR '1'='1';", o: ["0", "1", "4", "Lỗi"], a: 2, why: "'1'='1' luôn đúng." },
    { kind: "truefalse", q: "Có thể dùng ? để tham số hoá tên cột trong ORDER BY.", a: false, why: "Chỉ thay giá trị; tên cột dùng danh sách trắng." },
    { q: "Quyền tối thiểu cho tài khoản DB của app nghĩa là?", o: ["Quyền admin", "Chỉ quyền cần cho việc của app", "Không mật khẩu", "Mỗi người một tài khoản"], a: 1, why: "Giảm thiệt hại nếu bị tấn công." },
    { kind: "multi", q: "Lớp phòng thủ nào đúng?", o: ["Tham số hoá", "Ẩn lỗi SQL thô", "Ghi nhật ký bất thường", "Ghép chuỗi cẩn thận"], a: [0, 1, 2], why: "Ghép chuỗi là nguyên nhân, không phải phòng thủ." },
  ],
};
