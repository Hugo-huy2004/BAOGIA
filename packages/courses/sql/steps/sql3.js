// Step 3 — SQLite trong trình duyệt. Slide có `sql` hiện ô chạy SQL thật
// (SqlPlayground: sql.js + dữ liệu mẫu ../seed.js).
export default {
  id: "sql3",
  lang: "sql",
  file: "hat/first.sql",
  duration: "60 phút",
  summary: "Chạy câu SQL đầu tiên trên cơ sở dữ liệu thật của quán Hạt, đọc bảng kết quả và đọc thông báo lỗi.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: `Từ step này, mỗi bài đều có **ô SQL chạy thật**: một cơ sở dữ liệu SQLite nằm ngay trong trình duyệt của bạn, nạp sẵn dữ liệu quán Hạt.

- Gõ câu lệnh → bấm **Chạy** (hoặc Ctrl/⌘ + Enter).
- Sửa, xoá thoải mái: mở lại slide là dữ liệu về nguyên trạng.
- Không gửi gì lên máy chủ — chạy hoàn toàn trên máy bạn.`,
    },
    {
      section: "visual",
      title: "Bốn bảng đang chờ bạn",
      visual: "hat-schema",
      body: "Dữ liệu mẫu có 4 khách, 6 món, 8 đơn hàng trong ba ngày đầu tháng 10. Lược đồ đúng như bản nháp ở step 2.",
    },
    {
      section: "visual",
      title: "SQLite chạy ở đâu",
      visual: "dbms-layers",
      body: "Thường DBMS chạy trên máy chủ. Ở đây, SQLite được biên dịch sang **WebAssembly** và chạy ngay trong tab trình duyệt — cùng mã nguồn với SQLite trong điện thoại bạn.",
    },
    {
      section: "research",
      title: "Vì sao học bằng cách chạy thật",
      body: `Nghiên cứu về học lập trình cho thấy người học tiến bộ nhanh hơn khi được **thử – nhận phản hồi ngay – sửa** thay vì chỉ đọc. Phản hồi tức thì (kết quả hoặc thông báo lỗi) là thứ biến lỗi sai thành bài học.

> Hattie, J. and Timperley, H. (2007) 'The power of feedback', *Review of Educational Research*, 77(1), pp. 81–112.`,
    },
    {
      section: "research",
      title: "WebAssembly",
      body: `WebAssembly (Wasm) là định dạng mã máy cho trình duyệt, được W3C công nhận là chuẩn năm 2019. Nó cho phép chạy phần mềm viết bằng C — như SQLite — với tốc độ gần bản gốc, trong môi trường cách ly an toàn của trình duyệt.

> W3C (2019) *WebAssembly Core Specification*. Available at: https://www.w3.org/TR/wasm-core-1/`,
    },
    {
      section: "ideate",
      title: "Câu hỏi đầu tiên của chủ quán",
      body: `"Quán đang bán những món gì?"

Dịch sang SQL: **chọn mọi cột từ bảng thực đơn**. Câu này có hai phần — *chọn gì* (SELECT) và *từ đâu* (FROM). Mọi câu truy vấn bạn viết trong khoá đều bắt đầu từ hai phần này.`,
    },
    {
      section: "core",
      title: "Câu SQL đầu tiên",
      body: "Bấm **Chạy**. Dấu `*` nghĩa là \"mọi cột\". Dấu `;` kết thúc câu lệnh.",
      sql: { query: "SELECT * FROM menu_items;" },
    },
    {
      section: "core",
      title: "Đọc bảng kết quả",
      body: `Kết quả của SELECT **cũng là một bảng**: có tên cột và các dòng. Điều này rất quan trọng — vì kết quả là bảng, bạn có thể truy vấn tiếp trên nó (chặng 3 và 6).

Thử đổi \`menu_items\` thành \`customers\`. Khách **An** có số điện thoại hiện **NULL** — chưa biết, không phải chuỗi rỗng.`,
      sql: { query: "SELECT * FROM customers;" },
    },
    {
      section: "core",
      title: "Nhiều câu lệnh một lúc",
      body: "Ô SQL chạy được nhiều câu, cách nhau bằng `;`. Bảng hiện ra là kết quả của **câu cuối cùng**. Thử thêm `SELECT * FROM orders;` vào cuối.",
      sql: { query: "SELECT COUNT(*) FROM customers;\nSELECT COUNT(*) FROM menu_items;" },
    },
    {
      section: "core",
      title: "Chữ hoa hay chữ thường",
      body: `SQL **không phân biệt hoa thường ở từ khoá**: \`select\`, \`SELECT\`, \`Select\` như nhau. Quy ước phổ biến:

- Từ khoá viết **HOA**: SELECT, FROM, WHERE.
- Tên bảng, tên cột viết **thường**, nối bằng gạch dưới: \`menu_items\`, \`ordered_at\`.

Dữ liệu chữ đặt trong **nháy đơn**: \`'Trà đào'\`. Nháy kép dành cho tên cột/bảng có ký tự đặc biệt.`,
    },
    {
      section: "core",
      title: "Đọc thông báo lỗi",
      body: `Câu dưới đây **cố ý sai**. Bấm Chạy và đọc lỗi:

- \`no such table\` — sai tên bảng.
- \`no such column\` — sai tên cột.
- \`syntax error\` — sai ngữ pháp, thường do thiếu dấu phẩy hoặc gõ nhầm từ khoá.

Lỗi luôn chỉ ra **từ nào** gây vấn đề. Sửa thành \`menu_items\` rồi chạy lại.`,
      sql: { query: "SELECT * FROM menu;" },
    },
    {
      section: "core",
      title: "Chú thích trong SQL",
      body: `Hai kiểu chú thích:

~~~sql
-- chú thích một dòng
/* chú thích
   nhiều dòng */
SELECT * FROM orders; -- cũng đặt được cuối dòng
~~~

Dùng chú thích để ghi **vì sao** viết câu truy vấn như vậy — người đọc sau (kể cả bạn sau 3 tháng) sẽ cảm ơn.`,
    },
    {
      section: "apply",
      title: "Áp dụng: khám phá dữ liệu Hạt",
      body: `Lần lượt chạy \`SELECT *\` trên cả bốn bảng và trả lời:

1. Quán có mấy món loại \`tea\`?
2. Đơn số 3 có mấy dòng trong \`order_items\`?
3. Có mấy đơn không có khách (customer_id là NULL)?

Ghi đáp án vào \`hat/first.sql\` dưới dạng chú thích.`,
      sql: { query: "SELECT * FROM order_items;" },
    },
    {
      section: "apply",
      title: "Đáp án",
      body: `1. **2 món**: Trà đào, Matcha latte.
2. **2 dòng**: cà phê đen và bánh mì.
3. **2 đơn**: số 2 và số 5 — khách vãng lai.

Bạn vừa đếm bằng mắt. Từ step 12, \`COUNT\` và \`GROUP BY\` đếm hộ bạn trên hàng triệu dòng.`,
    },
    {
      section: "apply",
      title: "Bài tập: xem mọi đơn hàng",
      body: "Viết câu SQL hiện **toàn bộ bảng đơn hàng**. Bấm **Chạy & chấm** — ô tự so kết quả của bạn với yêu cầu.",
      sql: { query: "-- viết câu SQL của bạn ở dưới\n", solution: "SELECT * FROM orders;", hints: ["Bảng đơn hàng tên là orders.", "Mẫu câu: SELECT * FROM tên_bảng;"] },
    },
  ],
  quiz: [
    { q: "Dấu * trong SELECT * nghĩa là gì?", o: ["Nhân", "Mọi cột", "Mọi bảng", "Dòng đầu tiên"], a: 1, why: "SELECT * lấy mọi cột của bảng sau FROM." },
    { kind: "output", q: "Chạy hai câu sau, bảng hiện ra là của câu nào?", code: "SELECT * FROM customers;\nSELECT * FROM menu_items;", o: ["customers", "menu_items", "Cả hai gộp lại", "Lỗi"], a: 1, why: "Ô SQL hiện kết quả của câu cuối cùng." },
    { kind: "truefalse", q: "select * from menu_items; và SELECT * FROM menu_items; cho cùng kết quả.", a: true, why: "Từ khoá SQL không phân biệt hoa thường." },
    { q: "Lỗi \"no such column: prise\" nghĩa là gì?", o: ["Bảng không tồn tại", "Sai tên cột", "Thiếu dấu chấm phẩy", "Hết bộ nhớ"], a: 1, why: "Cột tên là price, không phải prise." },
    { kind: "blank", q: "Điền từ khoá còn thiếu.", code: "SELECT * ___ orders;", a: "FROM", why: "FROM chỉ bảng nguồn." },
    { q: "Viết giá trị chữ Trà đào trong SQL thế nào?", o: ["\"Trà đào\"", "'Trà đào'", "`Trà đào`", "Trà đào"], a: 1, why: "Chuỗi dùng nháy đơn; nháy kép dành cho tên định danh." },
    { kind: "multi", q: "Những cách chú thích hợp lệ trong SQL?", o: ["-- ghi chú", "/* ghi chú */", "# ghi chú", "// ghi chú"], a: [0, 1], why: "Chuẩn SQL có -- và /* */." },
    { kind: "truefalse", q: "Kết quả của câu SELECT cũng là một bảng.", a: true, why: "Vì vậy có thể truy vấn tiếp trên kết quả (truy vấn con, CTE)." },
  ],
};
