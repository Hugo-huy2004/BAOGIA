// Step 14 — INNER JOIN.
import { HAT_MONTH as M } from "../seed.js";

export default {
  id: "sql14",
  lang: "sql",
  file: "hat/join.sql",
  duration: "90 phút",
  summary: "Nối các bảng qua khoá ngoại với INNER JOIN, đặt bí danh bảng, nối nhiều bảng và tính doanh thu thật.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: "Đến giờ bạn chỉ thấy `item_id = 2` — chưa thấy tên món, chưa tính được tiền. Dữ liệu nằm ở **nhiều bảng** (step 2). JOIN ghép chúng lại theo khoá ngoại: dòng đơn + món = tên và giá; nhân số ly là ra **doanh thu**.",
    },
    {
      section: "visual",
      title: "Các kiểu JOIN",
      visual: "join-types",
      body: "INNER JOIN chỉ giữ những cặp **khớp ở cả hai bên**. LEFT JOIN giữ thêm phần bên trái không khớp (step 15). FULL JOIN giữ cả hai (SQLite hỗ trợ từ bản 3.39).",
    },
    {
      section: "visual",
      title: "Khoá ngoại là đường nối",
      visual: "fk-link",
      body: "`order_items.item_id = menu_items.id` — đúng mũi tên khoá ngoại bạn vẽ ở step 2 trở thành điều kiện ON.",
    },
    {
      section: "research",
      title: "JOIN là tích Descartes + chọn",
      body: `Trong đại số quan hệ, R ⋈ S = σ\\_điều kiện(R × S): ghép **mọi** cặp dòng, rồi giữ cặp thoả điều kiện. DBMS không thực sự làm thế (quá tốn) mà dùng thuật toán vòng lặp lồng có chỉ mục, hash join hoặc merge join.

> Graefe, G. (1993) 'Query evaluation techniques for large databases', *ACM Computing Surveys*, 25(2), pp. 73–169.`,
    },
    {
      section: "ideate",
      title: "Doanh thu = qty × price",
      body: `- \`order_items\`: đơn nào, món nào, mấy ly.
- \`menu_items\`: giá món.

Ghép theo \`item_id = id\` → mỗi dòng có cả qty và price → \`SUM(qty * price)\`.`,
    },
    {
      section: "core",
      title: "JOIN hai bảng",
      body: "`ON` nêu điều kiện ghép. Bí danh bảng (`oi`, `m`) giúp câu ngắn và rõ cột thuộc bảng nào.",
      sql: { query: "SELECT oi.order_id, m.name, oi.qty, m.price\nFROM order_items AS oi\nJOIN menu_items AS m ON m.id = oi.item_id\nORDER BY oi.order_id;" },
    },
    {
      section: "core",
      title: "Tính tiền từng dòng",
      body: "Biểu thức dùng cột của cả hai bảng.",
      sql: { query: "SELECT oi.order_id, m.name, oi.qty * m.price AS tien\nFROM order_items oi\nJOIN menu_items m ON m.id = oi.item_id;" },
    },
    {
      section: "core",
      title: "JOIN + GROUP BY: doanh thu từng món",
      body: "Câu hỏi đầu chặng: **món nào bán chạy nhất tháng**.",
      sql: { setup: M, query: "SELECT m.name, SUM(oi.qty) AS ly, SUM(oi.qty * m.price) AS doanh_thu\nFROM order_items oi\nJOIN menu_items m ON m.id = oi.item_id\nGROUP BY m.id\nORDER BY doanh_thu DESC;" },
    },
    {
      section: "core",
      title: "Nối ba bảng",
      body: "Khách → đơn → dòng đơn. Mỗi JOIN thêm một bảng.",
      sql: { setup: M, query: "SELECT c.name, COUNT(DISTINCT o.id) AS so_don, SUM(oi.qty) AS so_ly\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nJOIN order_items oi ON oi.order_id = o.id\nGROUP BY c.id\nORDER BY so_ly DESC;" },
    },
    {
      section: "core",
      title: "Cột trùng tên phải ghi rõ bảng",
      body: "Câu dưới **cố ý sai**: cả `orders` và `customers` đều có cột `id` — DBMS không biết bạn muốn cột nào (`ambiguous column name`). Sửa thành `o.id`.",
      sql: { query: "SELECT id, name\nFROM orders o\nJOIN customers c ON c.id = o.customer_id;" },
    },
    {
      section: "apply",
      title: "Bài tập 1: tên món trong đơn 3",
      body: "Hiện **tên món** và **số ly** của đơn số 3.",
      sql: { query: "", solution: "SELECT m.name, oi.qty FROM order_items oi JOIN menu_items m ON m.id = oi.item_id WHERE oi.order_id = 3;", hints: ["JOIN order_items với menu_items.", "Thêm WHERE oi.order_id = 3"] },
    },
    {
      section: "apply",
      title: "Bài tập 2: tổng tiền từng đơn",
      body: "Hiện `order_id` và **tổng tiền** của mỗi đơn (dữ liệu mẫu ban đầu).",
      sql: { query: "", solution: "SELECT oi.order_id, SUM(oi.qty * m.price) FROM order_items oi JOIN menu_items m ON m.id = oi.item_id GROUP BY oi.order_id;", hints: ["JOIN rồi GROUP BY order_id.", "SUM(oi.qty * m.price)"] },
    },
    {
      section: "apply",
      title: "Bài tập 3: doanh thu theo loại",
      body: "Hiện `category` và **doanh thu tháng** của mỗi loại món.",
      sql: { setup: M, query: "", solution: "SELECT m.category, SUM(oi.qty * m.price) FROM order_items oi JOIN menu_items m ON m.id = oi.item_id GROUP BY m.category;", hints: ["Gom theo m.category.", "SUM(oi.qty * m.price)"] },
    },
  ],
  quiz: [
    { q: "INNER JOIN giữ những dòng nào?", o: ["Mọi dòng bảng trái", "Chỉ các cặp khớp điều kiện ON", "Mọi dòng hai bảng", "Dòng không khớp"], a: 1, why: "Không khớp ở một bên thì bị loại." },
    { kind: "blank", q: "Điền từ khoá nêu điều kiện nối.", code: "JOIN menu_items m ___ m.id = oi.item_id", a: "ON", why: "ON <điều kiện>." },
    { kind: "truefalse", q: "SELECT id FROM orders o JOIN customers c ON … báo lỗi mơ hồ vì cả hai bảng có cột id.", a: true, why: "Ghi rõ o.id hoặc c.id." },
    { q: "Doanh thu một dòng đơn tính thế nào?", o: ["qty + price", "qty * price", "SUM(qty)", "COUNT(*)"], a: 1, why: "Số ly × giá." },
    { kind: "output", q: "Đơn 3 có 1 cà phê (25000) và 1 bánh mì (20000). Tổng là?", code: "SELECT SUM(oi.qty * m.price) FROM order_items oi\nJOIN menu_items m ON m.id = oi.item_id WHERE oi.order_id = 3;", o: ["25000", "45000", "20000", "2"], a: 1, why: "25000 + 20000." },
    { kind: "multi", q: "Thuật toán JOIN thực tế của DBMS?", o: ["Nested loop", "Hash join", "Merge join", "Bubble sort"], a: [0, 1, 2], why: "Graefe (1993)." },
  ],
};
