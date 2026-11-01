// Step 24 — UPSERT và RETURNING.
export default {
  id: "sql24",
  lang: "sql",
  file: "hat/upsert.sql",
  duration: "60 phút",
  summary: "Thêm-hoặc-sửa trong một câu với INSERT … ON CONFLICT, và lấy lại dữ liệu vừa ghi bằng RETURNING.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: "Khách gọi thêm một ly Bạc xỉu vào đơn đã có Bạc xỉu: không được thêm dòng thứ hai (khoá chính trùng) — phải **cộng số ly**. \"Có thì sửa, chưa có thì thêm\" gọi là **UPSERT**.",
    },
    {
      section: "visual",
      title: "UPSERT trong sơ đồ",
      visual: "write-mindmap",
      body: "Nhánh UPSERT nằm giữa INSERT và UPDATE: một câu, một lượt, không có khoảng hở cho hai thu ngân chen ngang.",
    },
    {
      section: "research",
      title: "Vì sao không \"SELECT rồi INSERT\"",
      body: `Hai bước SELECT-rồi-INSERT có **điều kiện tranh chấp**: hai yêu cầu cùng thấy "chưa có", cùng INSERT, một bên lỗi trùng khoá. UPSERT nguyên tử giải quyết trong một câu. PostgreSQL có ON CONFLICT từ 9.5, SQLite từ 3.24, chuẩn SQL dùng MERGE.

> PostgreSQL Global Development Group (2025) *INSERT — ON CONFLICT Clause*. Available at: https://www.postgresql.org/docs/current/sql-insert.html`,
    },
    {
      section: "ideate",
      title: "Thêm món vào đơn",
      body: "Đơn 1 đã có 2 Bạc xỉu. Khách gọi thêm 1 → mong đợi 3, vẫn **một** dòng.",
    },
    {
      section: "core",
      title: "Lỗi trùng khoá",
      body: "Câu dưới **cố ý sai**: (1, 1) đã tồn tại.",
      sql: { query: "INSERT INTO order_items (order_id, item_id, qty) VALUES (1, 1, 1);" },
    },
    {
      section: "core",
      title: "ON CONFLICT DO UPDATE",
      body: "`excluded` là dòng **định thêm** bị chặn. Cộng số ly của nó vào dòng có sẵn.",
      sql: { query: "INSERT INTO order_items (order_id, item_id, qty) VALUES (1, 1, 1)\nON CONFLICT (order_id, item_id) DO UPDATE SET qty = qty + excluded.qty;\nSELECT * FROM order_items WHERE order_id = 1;" },
    },
    {
      section: "core",
      title: "ON CONFLICT DO NOTHING",
      body: "Bỏ qua nếu đã có — tiện khi nhập dữ liệu lặp lại nhiều lần mà không muốn lỗi.",
      sql: { query: "INSERT INTO customers (id, name, phone, joined_at) VALUES (1, 'Lan', '0901000001', '2026-09-01')\nON CONFLICT DO NOTHING;\nSELECT COUNT(*) FROM customers;" },
    },
    {
      section: "core",
      title: "RETURNING",
      body: "Lấy lại dòng vừa ghi trong **cùng** câu — không cần SELECT thêm (và không bị ai chen giữa). Hữu ích để biết id vừa cấp.",
      sql: { query: "INSERT INTO orders (customer_id, ordered_at) VALUES (2, '2026-10-03 10:00')\nRETURNING id, ordered_at;" },
    },
    {
      section: "core",
      title: "UPDATE … RETURNING",
      body: "Biết ngay giá mới sau khi sửa.",
      sql: { query: "UPDATE menu_items SET price = price + 1000 WHERE category = 'coffee'\nRETURNING name, price;" },
    },
    {
      section: "apply",
      title: "Bài tập 1: cộng thêm ly",
      body: "Khách đơn 3 gọi thêm **2 ly cà phê đen** (item 3) — dùng UPSERT, rồi hiện dòng `(3, 3)`.",
      sql: { query: "", solution: "INSERT INTO order_items (order_id, item_id, qty) VALUES (3, 3, 2) ON CONFLICT (order_id, item_id) DO UPDATE SET qty = qty + excluded.qty; SELECT * FROM order_items WHERE order_id = 3 AND item_id = 3;", hints: ["ON CONFLICT (order_id, item_id) DO UPDATE …", "qty = qty + excluded.qty"] },
    },
    {
      section: "apply",
      title: "Bài tập 2: món mới và id",
      body: "Thêm món `Trà vải`, loại `tea`, giá `38000` và trả về **id, name** bằng RETURNING.",
      sql: { query: "", solution: "INSERT INTO menu_items (name, category, price) VALUES ('Trà vải', 'tea', 38000) RETURNING id, name;", hints: ["RETURNING ở cuối câu INSERT.", "RETURNING id, name"] },
    },
  ],
  quiz: [
    { q: "UPSERT nghĩa là?", o: ["Xoá rồi thêm", "Có thì sửa, chưa có thì thêm — trong một câu", "Thêm hai lần", "Sửa mọi dòng"], a: 1, why: "INSERT … ON CONFLICT." },
    { kind: "blank", q: "Dòng định thêm bị chặn gọi là?", code: "DO UPDATE SET qty = qty + ___.qty", a: "excluded", why: "Bảng ảo excluded." },
    { kind: "truefalse", q: "SELECT kiểm tra rồi INSERT có thể lỗi khi hai yêu cầu chạy cùng lúc.", a: true, why: "Điều kiện tranh chấp." },
    { q: "RETURNING dùng để?", o: ["Hoàn tác", "Trả về dữ liệu của dòng vừa ghi", "Lặp lại câu", "Sắp xếp"], a: 1, why: "Ví dụ id vừa cấp." },
    { q: "Chuẩn SQL gọi UPSERT là?", o: ["REPLACE", "MERGE", "UPSERT", "COMBINE"], a: 1, why: "MERGE; PostgreSQL/SQLite có ON CONFLICT." },
  ],
};
