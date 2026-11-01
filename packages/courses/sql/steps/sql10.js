// Step 10 — ORDER BY, LIMIT, OFFSET và phân trang.
export default {
  id: "sql10",
  lang: "sql",
  file: "hat/order.sql",
  duration: "75 phút",
  summary: "Sắp xếp theo một hoặc nhiều cột, đặt NULL đầu/cuối, lấy top N và phân trang bằng OFFSET lẫn keyset.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: `Nhớ step 2: bảng **không có thứ tự**. Muốn "món đắt nhất", "đơn mới nhất", "trang 2 của thực đơn" — bạn phải nói rõ bằng:

- ORDER BY (tăng/giảm, nhiều cột, NULLS FIRST/LAST).
- LIMIT và OFFSET.
- Phân trang **keyset** — cách các app lớn làm.`,
    },
    {
      section: "visual",
      title: "Vị trí của ORDER BY và LIMIT",
      visual: "order-limit",
      body: "ORDER BY và LIMIT chạy **cuối cùng**, sau SELECT. Vì vậy ORDER BY dùng được bí danh cột, còn WHERE thì không.",
    },
    {
      section: "research",
      title: "OFFSET chậm dần",
      body: `\`OFFSET 100000\` buộc DBMS **đọc rồi bỏ** 100.000 dòng trước khi trả 20 dòng cần. Trang càng sâu càng chậm, và nếu có dòng mới chèn vào giữa lúc lật trang, người dùng thấy trùng hoặc sót.

Phân trang **keyset** ("seek method") nhớ giá trị cuối của trang trước và lọc \`WHERE id < giá_trị_cuối\` — nhanh như nhau ở mọi trang.

> Winand, M. (2013) *We need tool support for keyset pagination*. Available at: https://use-the-index-luke.com/no-offset`,
    },
    {
      section: "ideate",
      title: "Trang thực đơn của app",
      body: `- Mặc định: món **rẻ nhất trước**; cùng giá thì theo **tên**.
- Mỗi trang 2 món (dữ liệu mẫu nhỏ — thật thì 20).
- Nút "Xem thêm" ở cuối.

Câu hỏi: cùng giá mà không sắp theo tên thì sao? → Thứ tự giữa các món cùng giá **không xác định**, lật trang có thể lặp món. Luôn có một cột "phân xử" duy nhất ở cuối ORDER BY.`,
    },
    {
      section: "core",
      title: "ORDER BY tăng và giảm",
      body: "`ASC` (mặc định) tăng dần, `DESC` giảm dần. Thử đổi sang `DESC`.",
      sql: { query: "SELECT name, price\nFROM menu_items\nORDER BY price;" },
    },
    {
      section: "core",
      title: "Sắp nhiều cột",
      body: "Sắp theo cột đầu; trùng thì xét cột sau. Mỗi cột có hướng riêng.",
      sql: { query: "SELECT name, category, price\nFROM menu_items\nORDER BY category ASC, price DESC;" },
    },
    {
      section: "core",
      title: "NULL đứng đâu",
      body: "SQLite (và MySQL) coi NULL **nhỏ nhất**: đứng đầu khi ASC. PostgreSQL thì ngược lại. Viết rõ `NULLS FIRST` / `NULLS LAST` để mọi DBMS cho cùng kết quả.",
      sql: { query: "SELECT name, phone\nFROM customers\nORDER BY phone NULLS LAST;" },
    },
    {
      section: "core",
      title: "LIMIT: top N",
      body: "3 món đắt nhất. LIMIT **không có ORDER BY** là lấy 3 dòng tuỳ ý — gần như luôn là lỗi.",
      sql: { query: "SELECT name, price\nFROM menu_items\nORDER BY price DESC\nLIMIT 3;" },
    },
    {
      section: "core",
      title: "OFFSET: trang thứ n",
      body: "Trang n (đếm từ 1), mỗi trang k dòng: `LIMIT k OFFSET (n - 1) * k`. Đây là trang 2, mỗi trang 2 món.",
      sql: { query: "SELECT id, name, price\nFROM menu_items\nORDER BY price, id\nLIMIT 2 OFFSET 2;" },
    },
    {
      section: "core",
      title: "Phân trang keyset",
      body: "Trang trước kết thúc ở món giá 29000, id 1. Trang sau lấy món **sau cặp (29000, 1)**. So sánh bộ giá trị `(a, b) > (x, y)` có từ SQLite 3.15.",
      sql: { query: "SELECT id, name, price\nFROM menu_items\nWHERE (price, id) > (29000, 1)\nORDER BY price, id\nLIMIT 2;" },
    },
    {
      section: "apply",
      title: "Bài tập 1: đơn mới nhất",
      body: "Hiện `id` và `ordered_at` của **3 đơn mới nhất**, mới nhất trước.",
      sql: { query: "", solution: "SELECT id, ordered_at FROM orders ORDER BY ordered_at DESC LIMIT 3;", ordered: true, hints: ["Sắp ordered_at giảm dần.", "ORDER BY ordered_at DESC LIMIT 3"] },
    },
    {
      section: "apply",
      title: "Bài tập 2: thực đơn theo loại",
      body: "Hiện `category`, `name`: sắp theo loại A→Z, trong cùng loại thì tên A→Z.",
      sql: { query: "", solution: "SELECT category, name FROM menu_items ORDER BY category, name;", ordered: true, hints: ["Hai cột trong ORDER BY.", "ORDER BY category, name"] },
    },
    {
      section: "apply",
      title: "Bài tập 3: món rẻ thứ 2 và 3",
      body: "Hiện `name`, `price` của món rẻ **thứ 2 và thứ 3**.",
      sql: { query: "", solution: "SELECT name, price FROM menu_items ORDER BY price LIMIT 2 OFFSET 1;", ordered: true, hints: ["Bỏ qua 1 món đầu.", "ORDER BY price LIMIT 2 OFFSET 1"] },
    },
  ],
  quiz: [
    { q: "Hướng sắp xếp mặc định của ORDER BY?", o: ["DESC", "ASC", "Ngẫu nhiên", "Theo id"], a: 1, why: "Không ghi gì là ASC." },
    { kind: "truefalse", q: "SELECT * FROM t LIMIT 3 (không ORDER BY) luôn trả cùng 3 dòng.", a: false, why: "Không có ORDER BY thì thứ tự không được bảo đảm." },
    { kind: "blank", q: "Trang 3, mỗi trang 10 dòng.", code: "LIMIT 10 OFFSET ___", a: "20", why: "(3 − 1) × 10 = 20." },
    { q: "Vì sao OFFSET lớn chậm?", o: ["OFFSET bị lỗi", "DBMS phải đọc rồi bỏ mọi dòng trước đó", "Do ORDER BY", "Do chỉ mục"], a: 1, why: "Keyset lọc thẳng tới vị trí nên nhanh đều." },
    { kind: "order", q: "Thứ tự xử lý?", items: ["FROM", "WHERE", "SELECT", "ORDER BY", "LIMIT"], a: [0, 1, 2, 3, 4], why: "LIMIT cắt cuối cùng." },
    { q: "Trong SQLite, ORDER BY phone ASC đặt NULL ở đâu?", o: ["Đầu", "Cuối", "Bỏ đi", "Ngẫu nhiên"], a: 0, why: "SQLite coi NULL nhỏ nhất; dùng NULLS LAST để đổi." },
    { kind: "multi", q: "Vì sao nên thêm id vào cuối ORDER BY khi phân trang?", o: ["Thứ tự xác định khi các dòng trùng giá", "Không lặp/sót dòng khi lật trang", "Bắt buộc theo chuẩn", "Chạy được keyset"], a: [0, 1, 3], why: "Cột duy nhất cuối cùng làm thứ tự toàn phần." },
  ],
};
