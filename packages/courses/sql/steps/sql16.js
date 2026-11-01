// Step 16 — Truy vấn con, IN, EXISTS.
import { HAT_MONTH as M } from "../seed.js";

export default {
  id: "sql16",
  lang: "sql",
  file: "hat/subquery.sql",
  duration: "75 phút",
  summary: "Lồng truy vấn trong truy vấn: truy vấn con vô hướng, IN, EXISTS, truy vấn con tương quan và truy vấn con ở FROM.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: "Kết quả SELECT là một bảng (step 3) — nên đặt được nó **bên trong** câu khác. \"Món đắt hơn giá trung bình\" cần biết trung bình trước: đó là truy vấn con.",
    },
    {
      section: "core",
      title: "Ba chỗ đặt truy vấn con",
      body: `| Vị trí | Trả về | Ví dụ |
|---|---|---|
| WHERE x > (…) | **một giá trị** | giá > giá TB |
| WHERE x IN (…) | **một cột** | khách từng mua trà |
| FROM (…) AS t | **một bảng** | gộp trước rồi JOIN |`,
    },
    {
      section: "research",
      title: "EXISTS và bán kết nối",
      body: `\`EXISTS (truy vấn con)\` là phép **bán kết nối** (semi-join): chỉ hỏi "có ít nhất một dòng không", dừng ngay khi tìm thấy. \`NOT EXISTS\` an toàn với NULL — khác \`NOT IN\` (step 9).

> Date, C.J. (2015) *SQL and Relational Theory*. 3rd edn. O'Reilly, ch. 10.`,
    },
    {
      section: "ideate",
      title: "Tách bài toán thành hai bước",
      body: `"Món đắt hơn trung bình":

1. Giá trung bình là bao nhiêu? → \`SELECT AVG(price) FROM menu_items\`
2. Món nào giá > con số đó?

Viết bước 1 riêng, chạy thử, rồi bọc ngoặc đặt vào bước 2.`,
    },
    {
      section: "core",
      title: "Truy vấn con vô hướng",
      body: "Trả đúng **một** giá trị — dùng như một con số.",
      sql: { query: "SELECT name, price\nFROM menu_items\nWHERE price > (SELECT AVG(price) FROM menu_items);" },
    },
    {
      section: "core",
      title: "IN với truy vấn con",
      body: "Khách từng gọi **trà**: lấy danh sách đơn có món trà → danh sách khách.",
      sql: { query: "SELECT name FROM customers\nWHERE id IN (\n  SELECT o.customer_id FROM orders o\n  JOIN order_items oi ON oi.order_id = o.id\n  JOIN menu_items m ON m.id = oi.item_id\n  WHERE m.category = 'tea'\n);" },
    },
    {
      section: "core",
      title: "EXISTS tương quan",
      body: "Truy vấn con **nhắc tới bảng ngoài** (`c.id`) — chạy lại cho mỗi khách. Ở đây: khách có ít nhất một đơn.",
      sql: { setup: M, query: "SELECT c.name FROM customers c\nWHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);" },
    },
    {
      section: "core",
      title: "Truy vấn con ở FROM",
      body: "Gộp trước, nối sau — cách sửa bẫy nhân dòng ở step 15. Bảng tạm `t` có một dòng mỗi đơn.",
      sql: { setup: M, query: "SELECT date(o.ordered_at) AS ngay, ROUND(AVG(t.tien)) AS tb_don\nFROM orders o\nJOIN (\n  SELECT oi.order_id, SUM(oi.qty * m.price) AS tien\n  FROM order_items oi JOIN menu_items m ON m.id = oi.item_id\n  GROUP BY oi.order_id\n) t ON t.order_id = o.id\nGROUP BY ngay\nORDER BY ngay\nLIMIT 7;" },
    },
    {
      section: "core",
      title: "Truy vấn con trong SELECT",
      body: "Mỗi món kèm số lần được gọi — truy vấn con tương quan trả một giá trị cho mỗi dòng.",
      sql: { query: "SELECT m.name,\n  (SELECT COUNT(*) FROM order_items oi WHERE oi.item_id = m.id) AS lan_goi\nFROM menu_items m;" },
    },
    {
      section: "apply",
      title: "Bài tập 1: món rẻ nhất",
      body: "Hiện tên món có giá **bằng giá thấp nhất**.",
      sql: { query: "", solution: "SELECT name FROM menu_items WHERE price = (SELECT MIN(price) FROM menu_items);", hints: ["Truy vấn con MIN(price).", "WHERE price = (SELECT MIN(price) …)"] },
    },
    {
      section: "apply",
      title: "Bài tập 2: khách chưa mua (NOT EXISTS)",
      body: "Dùng **NOT EXISTS** hiện tên khách không có đơn nào (dữ liệu mẫu ban đầu đã thêm 1 khách mới).",
      sql: { setup: "INSERT INTO customers VALUES (5, 'Bảo', NULL, '2026-10-05');", query: "", solution: "SELECT c.name FROM customers c WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);", hints: ["Tương quan qua c.id.", "WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)"] },
    },
    {
      section: "apply",
      title: "Bài tập 3: đơn lớn hơn trung bình",
      body: "Hiện `order_id` các đơn có **tổng tiền lớn hơn trung bình của mọi đơn** (dữ liệu tháng).",
      sql: { setup: M, query: "", solution: "SELECT order_id FROM (SELECT oi.order_id, SUM(oi.qty * m.price) AS tien FROM order_items oi JOIN menu_items m ON m.id = oi.item_id GROUP BY oi.order_id) t WHERE tien > (SELECT AVG(tien) FROM (SELECT SUM(oi.qty * m.price) AS tien FROM order_items oi JOIN menu_items m ON m.id = oi.item_id GROUP BY oi.order_id));", hints: ["Bước 1: bảng tạm tổng tiền mỗi đơn.", "Bước 2: so với AVG của chính bảng tạm đó (step 28 dạy CTE để khỏi viết lặp)."] },
    },
  ],
  quiz: [
    { q: "Truy vấn con đặt sau WHERE price > (…) phải trả?", o: ["Một bảng", "Một cột nhiều dòng", "Đúng một giá trị", "Không trả gì"], a: 2, why: "Truy vấn con vô hướng." },
    { kind: "truefalse", q: "NOT EXISTS an toàn với NULL hơn NOT IN.", a: true, why: "NOT IN gặp NULL trong danh sách thì không trả dòng nào." },
    { q: "Truy vấn con tương quan là?", o: ["Chạy một lần", "Nhắc tới cột của truy vấn ngoài, chạy lại theo từng dòng", "Luôn ở FROM", "Không dùng được với EXISTS"], a: 1, why: "Ví dụ WHERE o.customer_id = c.id." },
    { kind: "blank", q: "Hoàn thành bán kết nối.", code: "WHERE ___ (SELECT 1 FROM orders o WHERE o.customer_id = c.id)", a: "EXISTS", why: "EXISTS chỉ hỏi có hay không." },
    { q: "Cách sửa bẫy nhân dòng?", o: ["Thêm DISTINCT mọi chỗ", "Gộp từng bảng con trong truy vấn con ở FROM rồi mới JOIN", "Bỏ GROUP BY", "Dùng LIMIT"], a: 1, why: "Mỗi bảng con còn một dòng mỗi khoá trước khi nối." },
  ],
};
