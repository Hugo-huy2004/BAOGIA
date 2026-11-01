// Step 29 — CTE đệ quy.
const TREE = "CREATE TABLE cats (id INTEGER PRIMARY KEY, name TEXT NOT NULL, parent_id INTEGER REFERENCES cats(id));\nINSERT INTO cats VALUES (1,'Đồ uống',NULL),(2,'Cà phê',1),(3,'Trà',1),(4,'Cà phê pha máy',2),(5,'Cà phê phin',2),(6,'Đồ ăn',NULL),(7,'Bánh',6);";

export default {
  id: "sql29",
  lang: "sql",
  file: "hat/recursive.sql",
  duration: "90 phút",
  summary: "Viết CTE đệ quy để sinh dãy số, chuỗi ngày liên tục và duyệt cây danh mục nhiều cấp.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: "Báo cáo doanh thu theo ngày **thiếu** ngày không có đơn — biểu đồ bị hở. Danh mục món có nhiều cấp (Đồ uống → Cà phê → Cà phê phin). Cả hai cần truy vấn **gọi lại chính nó**: CTE đệ quy.",
    },
    {
      section: "visual",
      title: "Đệ quy trong sơ đồ",
      visual: "window-mindmap",
      body: "Nhánh **Đệ quy**: một phần mỏ neo (điểm bắt đầu) + một phần đệ quy (từ dòng vừa có, sinh dòng tiếp) cho tới khi không sinh thêm.",
    },
    {
      section: "research",
      title: "Điểm bất động",
      body: `CTE đệ quy tính **điểm bất động**: lặp phần đệ quy trên các dòng mới cho tới khi một vòng không sinh dòng nào. Ý tưởng bắt nguồn từ Datalog trong nghiên cứu cơ sở dữ liệu suy diễn những năm 1980.

> Abiteboul, S., Hull, R. and Vianu, V. (1995) *Foundations of Databases*. Addison-Wesley, ch. 12.`,
    },
    {
      section: "ideate",
      title: "Hai mẫu hay gặp",
      body: "1. **Sinh dãy**: số 1→n, ngày đầu tháng → cuối tháng.\n2. **Duyệt cây**: từ gốc đi xuống con (danh mục, sơ đồ tổ chức, bình luận lồng nhau).",
    },
    {
      section: "core",
      title: "Dãy số 1 → 10",
      body: "Mỏ neo `SELECT 1`; đệ quy `n + 1` khi `n < 10`. **Luôn** có điều kiện dừng.",
      sql: { query: "WITH RECURSIVE nums(n) AS (\n  SELECT 1\n  UNION ALL\n  SELECT n + 1 FROM nums WHERE n < 10\n)\nSELECT n FROM nums;" },
    },
    {
      section: "core",
      title: "Lịch đủ ngày",
      body: "Mọi ngày tháng 10, kể cả ngày không có đơn.",
      sql: { query: "WITH RECURSIVE days(d) AS (\n  SELECT '2026-10-01'\n  UNION ALL\n  SELECT date(d, '+1 day') FROM days WHERE d < '2026-10-31'\n)\nSELECT COUNT(*) AS so_ngay, MIN(d), MAX(d) FROM days;" },
    },
    {
      section: "core",
      title: "Doanh thu không hở ngày",
      body: "LEFT JOIN lịch với số đơn; ngày trống ghi 0. (Dữ liệu mẫu ban đầu chỉ có 3 ngày đầu.)",
      sql: { query: "WITH RECURSIVE days(d) AS (\n  SELECT '2026-10-01' UNION ALL SELECT date(d, '+1 day') FROM days WHERE d < '2026-10-07'\n)\nSELECT d, COUNT(o.id) AS so_don\nFROM days LEFT JOIN orders o ON date(o.ordered_at) = d\nGROUP BY d;" },
    },
    {
      section: "core",
      title: "Duyệt cây danh mục",
      body: "Từ gốc (`parent_id IS NULL`), mỗi vòng đi xuống một cấp; `depth` đếm cấp, `path` ghép đường đi.",
      sql: { setup: TREE, query: "WITH RECURSIVE tree(id, name, depth, path) AS (\n  SELECT id, name, 0, name FROM cats WHERE parent_id IS NULL\n  UNION ALL\n  SELECT c.id, c.name, t.depth + 1, t.path || ' › ' || c.name\n  FROM cats c JOIN tree t ON c.parent_id = t.id\n)\nSELECT depth, path FROM tree ORDER BY path;" },
    },
    {
      section: "core",
      title: "Mọi danh mục con của Đồ uống",
      body: "Đổi mỏ neo thành nút bắt đầu.",
      sql: { setup: TREE, query: "WITH RECURSIVE sub(id) AS (\n  SELECT 1\n  UNION ALL\n  SELECT c.id FROM cats c JOIN sub ON c.parent_id = sub.id\n)\nSELECT name FROM cats WHERE id IN (SELECT id FROM sub);" },
    },
    {
      section: "apply",
      title: "Bài tập 1: bảng cửu chương 7",
      body: "Sinh 10 dòng `n, 7 * n` với n từ 1 đến 10.",
      sql: { query: "", solution: "WITH RECURSIVE nums(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM nums WHERE n < 10) SELECT n, 7 * n FROM nums;", hints: ["Dãy 1 → 10 như ví dụ.", "SELECT n, 7 * n FROM nums"] },
    },
    {
      section: "apply",
      title: "Bài tập 2: ngày không có đơn",
      body: "Với dữ liệu mẫu ban đầu, liệt kê các ngày **từ 01/10 tới 07/10** mà quán **không có đơn nào**.",
      sql: { query: "", solution: "WITH RECURSIVE days(d) AS (SELECT '2026-10-01' UNION ALL SELECT date(d, '+1 day') FROM days WHERE d < '2026-10-07') SELECT d FROM days WHERE d NOT IN (SELECT date(ordered_at) FROM orders);", hints: ["Lịch đủ ngày bằng CTE đệ quy.", "Lọc ngày NOT IN danh sách ngày có đơn."] },
    },
    {
      section: "apply",
      title: "Bài tập 3: độ sâu cây",
      body: "Hiện `name` và `depth` (gốc = 0) của mọi danh mục.",
      sql: { setup: TREE, query: "", solution: "WITH RECURSIVE tree(id, name, depth) AS (SELECT id, name, 0 FROM cats WHERE parent_id IS NULL UNION ALL SELECT c.id, c.name, t.depth + 1 FROM cats c JOIN tree t ON c.parent_id = t.id) SELECT name, depth FROM tree;", hints: ["Mỏ neo: parent_id IS NULL, depth 0.", "Đệ quy: JOIN cats với tree theo parent_id."] },
    },
  ],
  quiz: [
    { q: "Hai phần của CTE đệ quy?", o: ["SELECT và WHERE", "Mỏ neo và phần đệ quy nối bằng UNION ALL", "BEGIN và END", "Hai bảng"], a: 1, why: "Mỏ neo chạy một lần, phần đệ quy lặp." },
    { kind: "truefalse", q: "CTE đệ quy không có điều kiện dừng có thể chạy mãi.", a: true, why: "Luôn có WHERE dừng hoặc LIMIT." },
    { kind: "output", q: "Có mấy dòng?", code: "WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 5)\nSELECT i FROM n;", o: ["4", "5", "6", "Vô hạn"], a: 1, why: "1, 2, 3, 4, 5." },
    { q: "Vì sao cần lịch đủ ngày cho báo cáo?", o: ["Đẹp", "Ngày không có đơn vẫn hiện với giá trị 0", "Nhanh hơn", "Bắt buộc"], a: 1, why: "Không hở trục thời gian." },
    { kind: "blank", q: "Từ khoá bắt buộc.", code: "WITH ___ tree(id) AS (…)", a: "RECURSIVE", why: "WITH RECURSIVE." },
  ],
};
