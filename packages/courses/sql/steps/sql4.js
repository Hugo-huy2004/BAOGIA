// Step 4 — SELECT và FROM. Slide có `sql.solution` là bài tập tự chấm (SqlPlayground).
export default {
  id: "sql4",
  lang: "sql",
  file: "hat/select.sql",
  duration: "75 phút",
  summary: "Chọn đúng cột cần, đặt bí danh, tính cột mới bằng biểu thức và bỏ dòng trùng với DISTINCT.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: `\`SELECT *\` tiện khi khám phá, nhưng trong ứng dụng thật bạn hầu như **không bao giờ** dùng nó. Step này dạy:

- Chọn **đúng cột** cần.
- Đặt **bí danh** (AS) cho cột dễ đọc.
- Tính **cột mới** bằng biểu thức: giá sau giảm, tiền theo nghìn đồng.
- **DISTINCT**: bỏ các dòng trùng.`,
    },
    {
      section: "visual",
      title: "Sơ đồ tư duy: SELECT",
      visual: "select-mindmap",
      body: "Sáu nhánh là sáu thứ bạn đặt được sau từ SELECT hoặc quanh nó. Cuối step, bạn dùng được cả sáu.",
    },
    {
      section: "visual",
      title: "DBMS đọc câu SELECT theo thứ tự nào",
      visual: "select-pipeline",
      body: "Bạn **viết** SELECT trước, nhưng DBMS **chạy** FROM trước: lấy bảng, rồi mới chọn và tính cột, rồi mới bỏ trùng. Nhớ thứ tự này giúp bạn hiểu vì sao có những lỗi \"cột không tồn tại\" ở step 6 và 13.",
    },
    {
      section: "research",
      title: "Vì sao tránh SELECT *",
      body: `Hướng dẫn hiệu năng của các DBMS lớn đều khuyên liệt kê cột cụ thể:

1. **Ít dữ liệu hơn**: chỉ đọc và gửi cột cần.
2. **Chỉ mục phủ**: DBMS có thể trả lời chỉ từ chỉ mục, không đọc bảng (step 35).
3. **Bền vững**: thêm cột vào bảng không làm hỏng mã đang đọc theo vị trí cột.

> Winand, M. (2012) *SQL Performance Explained*. Vienna: Markus Winand. Available at: https://use-the-index-luke.com/`,
    },
    {
      section: "research",
      title: "Phép chiếu trong đại số quan hệ",
      body: `Trong lý thuyết của Codd, chọn cột là phép **chiếu** (projection, ký hiệu π):

π\\_{name, price}(menu\\_items)

Vì quan hệ là **tập hợp**, phép chiếu tự loại bỏ dòng trùng. SQL thì **không** — muốn bỏ trùng phải viết DISTINCT. Đây là một trong những chỗ SQL lệch khỏi lý thuyết mà step 2 nhắc tới.

> Elmasri, R. and Navathe, S.B. (2016) *Fundamentals of Database Systems*. 7th edn. Boston: Pearson, ch. 8.`,
    },
    {
      section: "ideate",
      title: "Màn hình thực đơn cần gì",
      body: `App gọi món của Hạt chỉ hiện **tên** và **giá** (theo nghìn đồng, ví dụ "29k"). Không cần id, không cần loại.

Hai câu hỏi trước khi viết SQL:

1. Cần **cột nào**? → name, price.
2. Có cần **biến đổi** không? → price / 1000.`,
    },
    {
      section: "core",
      title: "Chọn cột cụ thể",
      body: "Liệt kê tên cột, cách nhau bằng dấu phẩy. Thứ tự cột trong kết quả **đúng thứ tự bạn viết**.",
      sql: { query: "SELECT name, price\nFROM menu_items;" },
    },
    {
      section: "core",
      title: "Bí danh với AS",
      body: "`AS` đặt tên mới cho cột trong kết quả — không đổi tên cột trong bảng. Tên có dấu cách hoặc dấu tiếng Việt thì bọc nháy kép.",
      sql: { query: "SELECT name AS mon, price AS \"giá (đồng)\"\nFROM menu_items;" },
    },
    {
      section: "core",
      title: "Cột tính toán",
      body: `Sau SELECT được đặt **biểu thức**: phép tính, hàm, ghép chuỗi.

- \`+ - * /\` cho số. Chú ý: \`29000 / 1000\` ra **29** vì hai số nguyên chia nhau bỏ phần lẻ; muốn số thực dùng \`29000 / 1000.0\`.
- \`||\` ghép chuỗi trong SQLite và chuẩn SQL.`,
      sql: { query: "SELECT name,\n       price / 1000 || 'k' AS gia,\n       price * 0.9 AS gia_giam_10\nFROM menu_items;" },
    },
    {
      section: "core",
      title: "DISTINCT: bỏ dòng trùng",
      body: "Bảng thực đơn có 6 món nhưng chỉ 3 **loại**. `DISTINCT` áp lên **cả dòng kết quả** — viết `DISTINCT category, price` là bỏ trùng theo cặp, không phải theo riêng category.",
      sql: { query: "SELECT DISTINCT category\nFROM menu_items;" },
    },
    {
      section: "core",
      title: "SELECT không cần FROM",
      body: "SQLite cho phép SELECT biểu thức mà không cần bảng — tiện làm máy tính hoặc thử hàm trước khi dùng thật.",
      sql: { query: "SELECT 29000 * 3 AS tong, upper('hat') AS ten, date('now') AS hom_nay;" },
    },
    {
      section: "core",
      title: "Định dạng câu SQL dễ đọc",
      body: `Câu SQL dài nên xuống dòng theo mệnh đề, mỗi cột một dòng khi có nhiều cột:

~~~sql
SELECT
  name,
  price / 1000 || 'k' AS gia
FROM menu_items;
~~~

DBMS không quan tâm khoảng trắng — người đọc thì có.`,
    },
    {
      section: "apply",
      title: "Bài tập 1: tên và loại",
      body: "Hiện **tên món** và **loại** của mọi món (đúng 2 cột).",
      sql: { query: "", solution: "SELECT name, category FROM menu_items;", hints: ["Hai cột là name và category.", "SELECT name, category FROM ...;"] },
    },
    {
      section: "apply",
      title: "Bài tập 2: giá theo nghìn",
      body: "Hiện tên món và giá **theo nghìn đồng dạng số** (29000 → 29). Đặt bí danh `gia_k` cho cột thứ hai.",
      sql: { query: "", solution: "SELECT name, price / 1000 AS gia_k FROM menu_items;", hints: ["Chia price cho 1000.", "Bí danh dùng AS: price / 1000 AS gia_k"] },
    },
    {
      section: "apply",
      title: "Bài tập 3: khách nào từng mua",
      body: "Từ bảng `orders`, liệt kê các `customer_id` **không trùng** (kể cả NULL của khách vãng lai).",
      sql: { query: "", solution: "SELECT DISTINCT customer_id FROM orders;", hints: ["Cột cần lấy là customer_id.", "Thêm DISTINCT ngay sau SELECT."] },
    },
    {
      section: "apply",
      title: "Bài tập 4: tiền từng dòng đơn",
      body: "Từ `order_items`, hiện `order_id`, `item_id` và cột `qty * 2` đặt tên `ly_neu_gap_doi`. (Chặng 3 sẽ nhân với giá thật bằng JOIN.)",
      sql: { query: "", solution: "SELECT order_id, item_id, qty * 2 AS ly_neu_gap_doi FROM order_items;", hints: ["Ba cột: order_id, item_id và một biểu thức.", "qty * 2 AS ly_neu_gap_doi"] },
    },
  ],
  quiz: [
    { q: "Vì sao nên tránh SELECT * trong ứng dụng?", o: ["SQL cấm dùng", "Đọc thừa dữ liệu và dễ gãy khi bảng thêm cột", "Chạy sai kết quả", "Không hiện tên cột"], a: 1, why: "Liệt kê cột: ít dữ liệu hơn, dùng được chỉ mục phủ, bền vững khi lược đồ đổi." },
    { kind: "output", q: "Kết quả là gì?", code: "SELECT 29000 / 1000;", o: ["29", "29.0", "29k", "Lỗi"], a: 0, why: "Hai số nguyên chia nhau cho số nguyên, bỏ phần lẻ." },
    { kind: "output", q: "Có mấy dòng?", code: "SELECT DISTINCT category FROM menu_items;\n-- 6 món: 3 coffee, 2 tea, 1 food", o: ["6", "3", "1", "2"], a: 1, why: "Ba giá trị khác nhau: coffee, tea, food." },
    { kind: "blank", q: "Điền từ khoá đặt bí danh.", code: "SELECT price ___ gia FROM menu_items;", a: "AS", why: "AS đặt tên cột trong kết quả." },
    { kind: "truefalse", q: "SELECT name AS mon đổi tên cột name trong bảng thành mon.", a: false, why: "Bí danh chỉ có trong kết quả; bảng giữ nguyên." },
    { kind: "order", q: "DBMS xử lý các phần theo thứ tự nào?", items: ["FROM", "SELECT", "DISTINCT"], a: [0, 1, 2], why: "Lấy bảng → chọn/tính cột → bỏ trùng." },
    { q: "Ghép chuỗi trong SQLite dùng toán tử nào?", o: ["+", "&", "||", "."], a: 2, why: "|| là toán tử ghép chuỗi chuẩn SQL." },
    { kind: "bug", q: "Dòng nào làm kết quả sai ý (chỉ ra 1 cột tên price)?", lines: ["SELECT", "  name", "  price", "FROM menu_items;"], a: 1, why: "Thiếu dấu phẩy sau name: SQLite hiểu price là bí danh của name — không lỗi nhưng sai ý! Luôn kiểm dấu phẩy giữa các cột." },
    { kind: "multi", q: "Những gì đặt được sau SELECT?", o: ["Tên cột", "Biểu thức price * 2", "Hàm upper(name)", "Tên bảng mới cần tạo"], a: [0, 1, 2], why: "Sau SELECT là danh sách biểu thức; tạo bảng dùng CREATE TABLE." },
  ],
};
