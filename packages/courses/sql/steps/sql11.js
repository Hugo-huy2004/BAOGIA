// Step 11 — Biểu thức, CASE, hàm chuỗi và ngày giờ. Kết chặng 2.
export default {
  id: "sql11",
  lang: "sql",
  file: "hat/menu-page.sql",
  duration: "90 phút",
  summary: "Phân loại dữ liệu bằng CASE, tính ngày giờ với date/strftime, làm tròn và định dạng số — rồi ghép tất cả thành truy vấn trang thực đơn hoàn chỉnh.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: `Bước cuối chặng 2: biến dữ liệu thô thành thứ người dùng đọc được.

- **CASE**: phân loại "rẻ / vừa / cao".
- **Ngày giờ**: thứ trong tuần, giờ, cộng trừ ngày.
- **Số**: round, abs, printf định dạng tiền.
- Dự án chặng: truy vấn trang thực đơn có lọc + sắp + phân trang.`,
    },
    {
      section: "visual",
      title: "CASE đi theo nhánh",
      visual: "case-flow",
      body: "CASE xét các WHEN **từ trên xuống**, dừng ở điều kiện đúng đầu tiên. Không WHEN nào đúng thì lấy ELSE; không có ELSE thì ra NULL.",
    },
    {
      section: "research",
      title: "CASE — câu điều kiện của SQL",
      body: `CASE có từ SQL-92 và là cách **chuẩn** để viết điều kiện trong biểu thức (thay cho IF/IIF riêng của từng DBMS). Vì là biểu thức, CASE đặt được ở SELECT, WHERE, ORDER BY, và cả bên trong hàm gộp (step 12 dùng để đếm có điều kiện).

> ISO/IEC (1992) *ISO/IEC 9075:1992 Database Language SQL*, §6.9 <case expression>.`,
    },
    {
      section: "ideate",
      title: "Nhãn giá trên thực đơn",
      body: `Chủ quán muốn mỗi món có nhãn:

- dưới 30 nghìn → **rẻ**
- dưới 40 nghìn → **vừa**
- còn lại → **cao**

Thứ tự WHEN quan trọng: kiểm "dưới 30" trước "dưới 40", nếu không món 25k sẽ thành "vừa".`,
    },
    {
      section: "core",
      title: "CASE tìm kiếm",
      body: "Dạng phổ biến nhất: mỗi WHEN là một điều kiện.",
      sql: { query: "SELECT name, price,\n  CASE\n    WHEN price < 30000 THEN 'rẻ'\n    WHEN price < 40000 THEN 'vừa'\n    ELSE 'cao'\n  END AS nhan\nFROM menu_items;" },
    },
    {
      section: "core",
      title: "CASE đơn giản",
      body: "Khi so một cột với nhiều giá trị cố định, viết gọn `CASE cột WHEN giá_trị THEN …`. Dùng để dịch mã sang chữ hiển thị.",
      sql: { query: "SELECT name,\n  CASE category\n    WHEN 'coffee' THEN 'Cà phê'\n    WHEN 'tea' THEN 'Trà'\n    ELSE 'Đồ ăn'\n  END AS loai\nFROM menu_items;" },
    },
    {
      section: "core",
      title: "CASE trong ORDER BY",
      body: "Sắp theo thứ tự **tự định nghĩa**: cà phê trước, rồi trà, rồi đồ ăn — không theo bảng chữ cái.",
      sql: { query: "SELECT name, category\nFROM menu_items\nORDER BY CASE category WHEN 'coffee' THEN 1 WHEN 'tea' THEN 2 ELSE 3 END, name;" },
    },
    {
      section: "core",
      title: "Hàm ngày giờ",
      body: "`strftime('%w', …)` ra thứ trong tuần (0 = Chủ nhật), `%H` ra giờ. `date(x, '+7 days')` cộng ngày. `julianday` trừ hai mốc ra số ngày.",
      sql: { query: "SELECT id, ordered_at,\n  strftime('%w', ordered_at) AS thu,\n  strftime('%H', ordered_at) AS gio,\n  date(ordered_at, '+7 days') AS hen_tuan_sau,\n  julianday('2026-10-31') - julianday(ordered_at) AS so_ngay\nFROM orders;" },
    },
    {
      section: "core",
      title: "Số: làm tròn và định dạng",
      body: "`round(x, n)` làm tròn n chữ số; `printf` định dạng như C: `%,d` có dấu phân cách nghìn (SQLite 3.38+).",
      sql: { query: "SELECT name,\n  round(price / 1000.0, 1) AS nghin,\n  printf('%,d đ', price) AS hien_thi\nFROM menu_items;" },
    },
    {
      section: "core",
      title: "Dự án chặng 2: trang thực đơn",
      body: `Ghép mọi thứ đã học: lọc theo từ khoá **và** khoảng giá, nhãn bằng CASE, sắp theo loại tự định nghĩa rồi giá, phân trang.

Đổi \`'%a%'\` và các con số để thấy truy vấn phản ứng thế nào — đây chính là câu SQL đứng sau ô tìm kiếm của một app gọi món.`,
      sql: { query: "SELECT name,\n  printf('%,d đ', price) AS gia,\n  CASE WHEN price < 30000 THEN 'rẻ' WHEN price < 40000 THEN 'vừa' ELSE 'cao' END AS nhan\nFROM menu_items\nWHERE lower(name) LIKE '%a%'\n  AND price BETWEEN 20000 AND 40000\nORDER BY CASE category WHEN 'coffee' THEN 1 WHEN 'tea' THEN 2 ELSE 3 END, price, id\nLIMIT 10 OFFSET 0;" },
    },
    {
      section: "apply",
      title: "Bài tập 1: nhãn đồ uống",
      body: "Hiện `name` và cột thứ hai: `'đồ uống'` nếu loại là coffee hoặc tea, ngược lại `'đồ ăn'`.",
      sql: { query: "", solution: "SELECT name, CASE WHEN category IN ('coffee', 'tea') THEN 'đồ uống' ELSE 'đồ ăn' END FROM menu_items;", hints: ["CASE WHEN category IN (...) THEN ... ELSE ... END", "Hai giá trị chữ: 'đồ uống' và 'đồ ăn'."] },
    },
    {
      section: "apply",
      title: "Bài tập 2: đơn buổi sáng",
      body: "Hiện `id` các đơn đặt **trước 9 giờ** (giờ < 9, mọi ngày).",
      sql: { query: "", solution: "SELECT id FROM orders WHERE CAST(strftime('%H', ordered_at) AS INTEGER) < 9;", hints: ["strftime('%H', ...) ra chữ '07', '08'…", "Ép sang số: CAST(strftime('%H', ordered_at) AS INTEGER) < 9"] },
    },
    {
      section: "apply",
      title: "Bài tập 3: sắp theo nhãn",
      body: "Hiện `name`, `price` sắp theo thứ tự: món **cao** trước, rồi **vừa**, rồi **rẻ**; cùng nhãn thì giá giảm dần.",
      sql: { query: "", solution: "SELECT name, price FROM menu_items ORDER BY CASE WHEN price >= 40000 THEN 1 WHEN price >= 30000 THEN 2 ELSE 3 END, price DESC;", ordered: true, hints: ["Dùng CASE trong ORDER BY trả 1, 2, 3.", "Thêm price DESC làm khoá phụ."] },
    },
    {
      section: "apply",
      title: "Tổng kết chặng 2",
      body: `Bạn đã viết được truy vấn đọc dữ liệu đầy đủ trên **một bảng**: lọc (WHERE, AND/OR, IN, BETWEEN, LIKE, IS NULL), sắp xếp, phân trang, biến đổi (CASE, hàm chuỗi, ngày giờ, số).

Chặng 3: **nhiều dòng thành một con số** (COUNT, SUM, GROUP BY) và **nhiều bảng thành một kết quả** (JOIN) — trả lời được câu "món nào bán chạy nhất".`,
    },
  ],
  quiz: [
    { kind: "output", q: "Nhãn của món 25000?", code: "CASE WHEN price < 40000 THEN 'vừa'\n     WHEN price < 30000 THEN 'rẻ'\n     ELSE 'cao' END", o: ["rẻ", "vừa", "cao", "NULL"], a: 1, why: "WHEN đầu tiên đúng thắng — thứ tự WHEN quan trọng." },
    { kind: "truefalse", q: "CASE không có ELSE và không WHEN nào đúng thì trả NULL.", a: true, why: "ELSE mặc định là NULL." },
    { q: "CASE dùng được ở đâu?", o: ["Chỉ SELECT", "Chỉ WHERE", "Mọi chỗ đặt được biểu thức: SELECT, WHERE, ORDER BY…", "Chỉ trong hàm"], a: 2, why: "CASE là biểu thức." },
    { kind: "output", q: "Kết quả là gì?", code: "SELECT strftime('%H', '2026-10-01 07:50');", o: ["7", "07", "50", "07:50"], a: 1, why: "strftime trả chuỗi có số 0 đầu." },
    { kind: "blank", q: "Cộng 7 ngày.", code: "SELECT date('2026-10-01', '___');", a: "+7 days", why: "Bộ điều chỉnh '+N days'." },
    { kind: "output", q: "Kết quả là gì?", code: "SELECT round(29540 / 1000.0, 1);", o: ["29", "29.5", "29.54", "30"], a: 1, why: "29.54 làm tròn 1 chữ số thập phân là 29.5." },
    { kind: "match", q: "Nối hàm với công dụng.", pairs: [["strftime('%w', d)", "thứ trong tuần"], ["julianday(a) - julianday(b)", "số ngày chênh"], ["printf('%,d', n)", "định dạng có phân cách nghìn"]], why: "Ba hàm hay dùng cho báo cáo." },
  ],
};
