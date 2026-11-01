// Step 28 — CTE. Mở chặng 6 (truy vấn nâng cao).
import { HAT_MONTH as M } from "../seed.js";

export default {
  id: "sql28",
  lang: "sql",
  file: "hat/cte.sql",
  duration: "75 phút",
  summary: "Đặt tên cho từng bước của truy vấn phức tạp bằng WITH (CTE), dùng lại một bước nhiều lần và đọc truy vấn từ trên xuống.",
  slides: [
    {
      section: "intro",
      title: "Chặng 6: truy vấn nâng cao",
      body: `Bài tập 3 của step 16 bắt bạn viết **cùng một truy vấn con hai lần**. CTE (Common Table Expression) đặt tên cho nó một lần, dùng bao nhiêu lần cũng được.

Chặng 6: CTE → CTE đệ quy → ROW_NUMBER/RANK → LAG/LEAD → luỹ kế và khung cửa sổ. Đây là phần **phỏng vấn SQL** hỏi nhiều nhất.`,
    },
    {
      section: "visual",
      title: "Sơ đồ tư duy: chặng 6",
      visual: "window-mindmap",
      body: "Hai nhánh đầu là **CTE** (tổ chức truy vấn), năm nhánh sau là **window function** (tính toán qua các dòng mà không gộp mất dòng).",
    },
    {
      section: "research",
      title: "CTE trong chuẩn SQL:1999",
      body: `Mệnh đề WITH vào chuẩn SQL:1999, cùng lúc với truy vấn đệ quy. Ngoài tính dễ đọc, CTE cho phép **kiểm thử từng bước**: chạy riêng từng CTE để xem kết quả trung gian.

> Melton, J. and Simon, A.R. (2002) *SQL:1999 Understanding Relational Language Components*. Morgan Kaufmann, ch. 12.`,
    },
    {
      section: "ideate",
      title: "Viết truy vấn như viết công thức",
      body: "1. `order_totals`: tiền mỗi đơn.\n2. `avg_total`: trung bình của bước 1.\n3. Kết quả: đơn trên trung bình.\n\nMỗi bước một tên, đọc từ trên xuống như công thức nấu ăn.",
    },
    {
      section: "core",
      title: "WITH cơ bản",
      body: "CTE sống trong **một** câu lệnh.",
      sql: { setup: M, query: "WITH order_totals AS (\n  SELECT oi.order_id, SUM(oi.qty * m.price) AS tien\n  FROM order_items oi JOIN menu_items m ON m.id = oi.item_id\n  GROUP BY oi.order_id\n)\nSELECT COUNT(*) AS so_don, ROUND(AVG(tien)) AS tb FROM order_totals;" },
    },
    {
      section: "core",
      title: "Nhiều CTE nối tiếp",
      body: "CTE sau dùng được CTE trước. Bài tập khó của step 16 giờ gọn gàng.",
      sql: { setup: M, query: "WITH order_totals AS (\n  SELECT oi.order_id, SUM(oi.qty * m.price) AS tien\n  FROM order_items oi JOIN menu_items m ON m.id = oi.item_id\n  GROUP BY oi.order_id\n), avg_total AS (\n  SELECT AVG(tien) AS tb FROM order_totals\n)\nSELECT order_id, tien\nFROM order_totals, avg_total\nWHERE tien > tb\nORDER BY tien DESC\nLIMIT 5;" },
    },
    {
      section: "core",
      title: "Dùng một CTE hai lần",
      body: "So doanh thu ngày với ngày tốt nhất — cùng `daily` dùng hai lần.",
      sql: { setup: M, query: "WITH daily AS (\n  SELECT date(o.ordered_at) AS ngay, SUM(oi.qty * m.price) AS tien\n  FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN menu_items m ON m.id = oi.item_id\n  GROUP BY ngay\n)\nSELECT ngay, tien, ROUND(100.0 * tien / (SELECT MAX(tien) FROM daily), 1) AS phan_tram_dinh\nFROM daily\nORDER BY ngay\nLIMIT 7;" },
    },
    {
      section: "core",
      title: "CTE và hiệu năng",
      body: "SQLite và PostgreSQL 12+ có thể \"gộp\" CTE vào truy vấn chính để tối ưu. Muốn buộc tính một lần rồi dùng lại: `WITH x AS MATERIALIZED (…)`.",
    },
    {
      section: "apply",
      title: "Bài tập 1: ngày trên trung bình",
      body: "Dùng CTE `daily(ngay, so_don)` đếm đơn mỗi ngày, rồi hiện **những ngày có số đơn lớn hơn trung bình**.",
      sql: { setup: M, query: "", solution: "WITH daily AS (SELECT date(ordered_at) AS ngay, COUNT(*) AS so_don FROM orders GROUP BY ngay) SELECT ngay, so_don FROM daily WHERE so_don > (SELECT AVG(so_don) FROM daily);", hints: ["CTE daily gom theo date(ordered_at).", "So với (SELECT AVG(so_don) FROM daily)."] },
    },
    {
      section: "apply",
      title: "Bài tập 2: khách chi nhiều nhất",
      body: "CTE `spend(customer_id, tien)` = tổng tiền mỗi khách (bỏ vãng lai). Hiện **khách có tổng tiền cao nhất** (customer_id, tien).",
      sql: { setup: M, query: "", solution: "WITH spend AS (SELECT o.customer_id, SUM(oi.qty * m.price) AS tien FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN menu_items m ON m.id = oi.item_id WHERE o.customer_id IS NOT NULL GROUP BY o.customer_id) SELECT customer_id, tien FROM spend WHERE tien = (SELECT MAX(tien) FROM spend);", hints: ["JOIN 3 bảng trong CTE.", "WHERE tien = (SELECT MAX(tien) FROM spend)"] },
    },
  ],
  quiz: [
    { q: "CTE được khai bằng từ khoá nào?", o: ["DEFINE", "WITH", "LET", "TEMP"], a: 1, why: "WITH tên AS (…)." },
    { kind: "truefalse", q: "CTE sau có thể dùng CTE khai trước nó trong cùng WITH.", a: true, why: "Nối tiếp như các bước." },
    { q: "Phạm vi sống của CTE?", o: ["Cả phiên", "Một câu lệnh", "Đến khi DROP", "Vĩnh viễn"], a: 1, why: "Khác bảng tạm hay view." },
    { q: "Lợi ích chính của CTE?", o: ["Luôn nhanh hơn", "Dễ đọc, dùng lại, kiểm thử từng bước", "Bảo mật", "Thay chỉ mục"], a: 1, why: "Tổ chức truy vấn." },
    { kind: "blank", q: "Buộc CTE tính một lần.", code: "WITH x AS ___ (SELECT …)", a: "MATERIALIZED", why: "SQLite 3.35+, PostgreSQL 12+." },
  ],
};
