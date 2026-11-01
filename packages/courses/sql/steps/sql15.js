// Step 15 — LEFT JOIN, tự nối bảng và bẫy nhân dòng.
import { HAT_MONTH as M } from "../seed.js";

export default {
  id: "sql15",
  lang: "sql",
  file: "hat/left-join.sql",
  duration: "75 phút",
  summary: "Giữ dòng không khớp với LEFT JOIN, tìm \"cái chưa có\", tự nối bảng, và nhận ra bẫy nhân dòng làm doanh thu sai.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: "INNER JOIN làm **mất** dòng không khớp: món chưa ai gọi, đơn vãng lai. Báo cáo \"mọi món kể cả món ế\" cần LEFT JOIN. Và JOIN sai cách là doanh thu **nhân đôi** mà không ai báo lỗi.",
    },
    {
      section: "visual",
      title: "LEFT JOIN",
      visual: "join-types",
      body: "LEFT JOIN giữ **mọi dòng bên trái**; bên phải không khớp thì cột bên phải là NULL.",
    },
    {
      section: "research",
      title: "Anti-join",
      body: `Mẫu "LEFT JOIN … WHERE phải.id IS NULL" gọi là **anti-join**: tìm dòng bên trái **không có** cặp. Bộ tối ưu của PostgreSQL và SQLite nhận ra mẫu này và chạy hiệu quả như NOT EXISTS (step 16).

> PostgreSQL Global Development Group (2025) *PostgreSQL Documentation: Table Expressions — Joined Tables*. Available at: https://www.postgresql.org/docs/current/queries-table-expressions.html`,
    },
    {
      section: "ideate",
      title: "Câu hỏi \"chưa có\"",
      body: `- Khách nào **chưa mua** đơn nào?
- Món nào **chưa ai gọi** tuần này?
- Đơn nào **không có** khách?

Tất cả cùng mẫu: LEFT JOIN rồi lọc phía phải IS NULL.`,
    },
    {
      section: "core",
      title: "LEFT JOIN giữ đơn vãng lai",
      body: "Đơn 2 và 5 vẫn còn, tên khách là NULL.",
      sql: { query: "SELECT o.id, c.name\nFROM orders o\nLEFT JOIN customers c ON c.id = o.customer_id;" },
    },
    {
      section: "core",
      title: "Đếm đơn của mọi khách, kể cả 0",
      body: "Đếm `o.id`, không đếm `*` — `COUNT(*)` sẽ đếm cả dòng NULL thành 1.",
      sql: { query: "SELECT c.name, COUNT(o.id) AS so_don\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nGROUP BY c.id;" },
    },
    {
      section: "core",
      title: "Anti-join: món chưa ai gọi",
      body: "Thêm một món mới chưa bán, rồi tìm nó.",
      sql: { query: "INSERT INTO menu_items VALUES (7, 'Sữa chua', 'food', 30000);\nSELECT m.name\nFROM menu_items m\nLEFT JOIN order_items oi ON oi.item_id = m.id\nWHERE oi.item_id IS NULL;" },
    },
    {
      section: "core",
      title: "Bẫy: điều kiện bảng phải đặt ở WHERE",
      body: "Muốn đếm đơn ngày 1/10 của **mọi** khách. Đặt điều kiện ngày ở WHERE thì khách 0 đơn bị loại (vì o.ordered_at NULL) — LEFT JOIN thành INNER. Đúng: đặt ở **ON**.",
      sql: { query: "SELECT c.name, COUNT(o.id) AS don_1_10\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\n  AND date(o.ordered_at) = '2026-10-01'\nGROUP BY c.id;" },
    },
    {
      section: "core",
      title: "Bẫy nhân dòng",
      body: "Nối **hai bảng con** của cùng một bảng cha: số dòng nhân lên. Ở đây đơn 3 có 2 dòng đơn; JOIN thêm bảng thanh toán 2 lần trả → 4 dòng, tổng tiền **gấp đôi**. Cách sửa: gộp từng bảng con trong truy vấn con trước rồi mới JOIN (step 16).",
      sql: { setup: "CREATE TABLE payments (order_id INT, amount INT); INSERT INTO payments VALUES (3, 20000), (3, 25000);", query: "SELECT o.id, SUM(oi.qty * m.price) AS tien_hang, SUM(p.amount) AS da_tra\nFROM orders o\nJOIN order_items oi ON oi.order_id = o.id\nJOIN menu_items m ON m.id = oi.item_id\nJOIN payments p ON p.order_id = o.id\nGROUP BY o.id;" },
    },
    {
      section: "core",
      title: "Tự nối bảng",
      body: "Một bảng nối với **chính nó** qua hai bí danh. Ví dụ: cặp món cùng loại.",
      sql: { query: "SELECT a.name, b.name, a.category\nFROM menu_items a\nJOIN menu_items b ON a.category = b.category AND a.id < b.id;" },
    },
    {
      section: "apply",
      title: "Bài tập 1: khách chưa mua",
      body: "Quán vừa có thêm khách Bảo đăng ký hôm nay. Hiện tên những khách **chưa có đơn** nào.",
      sql: { setup: M + "INSERT INTO customers VALUES (13, 'Bảo', NULL, '2026-10-31');", query: "", solution: "SELECT c.name FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL;", hints: ["LEFT JOIN orders, lọc o.id IS NULL.", "Mẫu anti-join."] },
    },
    {
      section: "apply",
      title: "Bài tập 2: số lần gọi mỗi món",
      body: "Hiện **mọi** món và số dòng đơn của nó (món chưa bán ghi 0) — dữ liệu mẫu ban đầu.",
      sql: { query: "", solution: "SELECT m.name, COUNT(oi.item_id) FROM menu_items m LEFT JOIN order_items oi ON oi.item_id = m.id GROUP BY m.id;", hints: ["Bảng trái là menu_items.", "COUNT(oi.item_id), không COUNT(*)."] },
    },
    {
      section: "apply",
      title: "Bài tập 3: cặp khách cùng ngày đăng ký",
      body: "Tự nối `customers`: hiện cặp tên khách **đăng ký cùng tháng** (`strftime('%m', joined_at)`), mỗi cặp một lần.",
      sql: { setup: M, query: "", solution: "SELECT a.name, b.name FROM customers a JOIN customers b ON strftime('%m', a.joined_at) = strftime('%m', b.joined_at) AND a.id < b.id;", hints: ["Hai bí danh a, b của customers.", "a.id < b.id để không lặp cặp."] },
    },
  ],
  quiz: [
    { q: "LEFT JOIN giữ dòng nào khi không khớp?", o: ["Bảng phải", "Bảng trái, cột phải là NULL", "Không giữ", "Cả hai"], a: 1, why: "Mọi dòng bên trái được giữ." },
    { q: "Đếm đơn của mọi khách (kể cả 0) nên dùng?", o: ["COUNT(*)", "COUNT(o.id)", "SUM(1)", "COUNT(c.id)"], a: 1, why: "COUNT(*) đếm dòng NULL thành 1." },
    { kind: "truefalse", q: "Đặt điều kiện trên cột bảng phải vào WHERE có thể biến LEFT JOIN thành INNER JOIN.", a: true, why: "Dòng NULL bị WHERE loại." },
    { kind: "blank", q: "Hoàn thành anti-join.", code: "LEFT JOIN orders o ON o.customer_id = c.id\nWHERE o.id ___", a: "IS NULL", why: "Không có cặp thì o.id là NULL." },
    { q: "JOIN cùng lúc hai bảng con (dòng đơn, thanh toán) rồi SUM gây ra?", o: ["Lỗi cú pháp", "Tổng bị nhân lên", "Kết quả rỗng", "Không sao"], a: 1, why: "Bẫy nhân dòng — gộp từng bảng con trước." },
    { q: "Tự nối bảng cần gì?", o: ["Hai bí danh cho cùng một bảng", "Hai cơ sở dữ liệu", "UNION", "Chỉ mục"], a: 0, why: "a và b là hai \"bản\" của cùng bảng." },
  ],
};
