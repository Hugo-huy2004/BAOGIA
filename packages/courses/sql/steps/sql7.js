// Step 7 — AND, OR, NOT, IN, BETWEEN.
export default {
  id: "sql7",
  lang: "sql",
  file: "hat/logic.sql",
  duration: "75 phút",
  summary: "Ghép nhiều điều kiện bằng AND, OR, NOT; viết gọn bằng IN và BETWEEN; tránh bẫy thứ tự ưu tiên.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: `Câu hỏi thật hiếm khi chỉ có một điều kiện: "trà **hoặc** cà phê, **và** dưới 40 nghìn". Step này dạy:

- AND, OR, NOT và **thứ tự ưu tiên**.
- IN — viết gọn nhiều OR.
- BETWEEN — khoảng giá trị.`,
    },
    {
      section: "visual",
      title: "Bảng chân trị AND",
      visual: "three-valued",
      body: "AND chỉ TRUE khi **cả hai** vế TRUE. Ô NULL sẽ được giải thích kỹ ở step 9 — tạm nhớ: FALSE AND bất cứ gì là FALSE.",
    },
    {
      section: "research",
      title: "Đại số Boole",
      body: `AND, OR, NOT là ba phép toán của **đại số Boole** (George Boole, 1854). Hai định luật De Morgan giúp đơn giản hoá điều kiện:

- NOT (A AND B) = (NOT A) OR (NOT B)
- NOT (A OR B) = (NOT A) AND (NOT B)

> Boole, G. (1854) *An Investigation of the Laws of Thought*. London: Walton and Maberly.`,
    },
    {
      section: "ideate",
      title: "Viết điều kiện bằng lời trước",
      body: `"Món loại trà hoặc cà phê, giá dưới 40 nghìn."

Câu tiếng Việt mơ hồ: "dưới 40 nghìn" áp cho cả hai loại hay chỉ cà phê? Ý chủ quán là **cả hai**. Viết ra có ngoặc:

(loại = trà OR loại = cà phê) AND giá < 40000

SQL cũng cần đúng cái ngoặc đó.`,
    },
    {
      section: "core",
      title: "AND và OR",
      body: "AND thu hẹp kết quả (phải thoả mọi điều kiện), OR mở rộng (thoả một là đủ).",
      sql: { query: "SELECT name, category, price\nFROM menu_items\nWHERE category = 'coffee' AND price < 30000;" },
    },
    {
      section: "core",
      title: "Bẫy thứ tự ưu tiên",
      body: "**AND ưu tiên hơn OR**. Câu dưới không có ngoặc nên được hiểu là `tea OR (coffee AND price < 30000)` — Matcha 45k lọt vào! Thêm ngoặc quanh hai vế OR rồi chạy lại.",
      sql: { query: "SELECT name, category, price\nFROM menu_items\nWHERE category = 'tea' OR category = 'coffee' AND price < 30000;" },
    },
    {
      section: "core",
      title: "NOT",
      body: "NOT đảo điều kiện. Thường viết `<>` hoặc `NOT IN` sẽ dễ đọc hơn NOT đặt trước cả biểu thức.",
      sql: { query: "SELECT name FROM menu_items WHERE NOT (category = 'coffee');" },
    },
    {
      section: "core",
      title: "IN: gọn hơn nhiều OR",
      body: "`cột IN (a, b, c)` tương đương `cột = a OR cột = b OR cột = c`. `NOT IN` là phủ định — cẩn thận khi danh sách có NULL (step 9).",
      sql: { query: "SELECT name, category\nFROM menu_items\nWHERE category IN ('tea', 'food');" },
    },
    {
      section: "core",
      title: "BETWEEN: khoảng giá trị",
      body: "`BETWEEN a AND b` **bao gồm cả hai đầu**: tương đương `>= a AND <= b`. Với ngày giờ, cẩn thận: `BETWEEN '2026-10-01' AND '2026-10-02'` **bỏ sót** đơn 09:00 ngày 2/10 — dùng `>= ngày đầu AND < ngày sau` cho chắc.",
      sql: { query: "SELECT name, price\nFROM menu_items\nWHERE price BETWEEN 25000 AND 35000;" },
    },
    {
      section: "apply",
      title: "Bài tập 1: trà hoặc cà phê dưới 40k",
      body: "Hiện tên các món loại `tea` **hoặc** `coffee` có giá **dưới 40000**.",
      sql: { query: "", solution: "SELECT name FROM menu_items WHERE category IN ('tea', 'coffee') AND price < 40000;", hints: ["Nhớ ngoặc quanh hai vế OR, hoặc dùng IN.", "WHERE category IN ('tea', 'coffee') AND price < 40000"] },
    },
    {
      section: "apply",
      title: "Bài tập 2: đơn của Lan và Vy",
      body: "Khách Lan có id 1, Vy có id 4. Hiện `id` và `ordered_at` các đơn của hai người.",
      sql: { query: "", solution: "SELECT id, ordered_at FROM orders WHERE customer_id IN (1, 4);", hints: ["Dùng IN với danh sách id.", "WHERE customer_id IN (1, 4)"] },
    },
    {
      section: "apply",
      title: "Bài tập 3: đơn ngày 2/10",
      body: "Hiện `id` mọi đơn **trong ngày 2/10/2026** (từ 00:00 tới trước 00:00 ngày 3/10).",
      sql: { query: "", solution: "SELECT id FROM orders WHERE ordered_at >= '2026-10-02' AND ordered_at < '2026-10-03';", hints: ["Khoảng nửa mở: >= ngày đầu AND < ngày sau.", "ordered_at >= '2026-10-02' AND ordered_at < '2026-10-03'"] },
    },
  ],
  quiz: [
    { q: "Trong SQL, toán tử nào ưu tiên cao hơn?", o: ["OR", "AND", "Bằng nhau", "Tuỳ DBMS"], a: 1, why: "AND trước OR — luôn thêm ngoặc khi trộn hai loại." },
    { kind: "output", q: "Có mấy dòng?", code: "SELECT name FROM menu_items\nWHERE price BETWEEN 25000 AND 35000;\n-- giá: 29k, 35k, 25k, 20k, 45k, 39k", o: ["1", "2", "3", "4"], a: 2, why: "25k, 29k, 35k — BETWEEN bao gồm hai đầu." },
    { kind: "blank", q: "Viết gọn: category = 'tea' OR category = 'food'", code: "WHERE category ___ ('tea', 'food')", a: "IN", why: "IN thay cho chuỗi OR cùng một cột." },
    { kind: "truefalse", q: "NOT (A AND B) bằng (NOT A) OR (NOT B).", a: true, why: "Định luật De Morgan." },
    { q: "Lọc đơn trong ngày 2/10 an toàn nhất là?", o: ["BETWEEN '2026-10-02' AND '2026-10-02'", "ordered_at = '2026-10-02'", ">= '2026-10-02' AND < '2026-10-03'", "LIKE '2026-10-02'"], a: 2, why: "Khoảng nửa mở không bỏ sót giờ phút." },
    { kind: "bug", q: "Dòng nào khiến Matcha 45k lọt vào kết quả \"trà hoặc cà phê dưới 30k\"?", lines: ["SELECT name FROM menu_items", "WHERE category = 'tea'", "   OR category = 'coffee' AND price < 30000;"], a: 2, why: "Thiếu ngoặc: AND gắn với vế coffee trước." },
    { kind: "multi", q: "Câu nào tương đương price >= 25000 AND price <= 35000?", o: ["price BETWEEN 25000 AND 35000", "price IN (25000, 35000)", "NOT (price < 25000 OR price > 35000)", "price > 25000 AND price < 35000"], a: [0, 2], why: "BETWEEN bao gồm hai đầu; vế 3 là De Morgan." },
  ],
};
