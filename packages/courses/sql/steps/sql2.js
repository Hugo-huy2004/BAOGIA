// Step 2 — Mô hình quan hệ. Khối mã trong `body` dùng rào ~~~.
export default {
  id: "sql2",
  lang: "sql",
  file: "hat/schema-draft.sql",
  duration: "75 phút",
  summary: "Nắm từ vựng của mô hình quan hệ — quan hệ, bộ, thuộc tính, miền, khoá — và đọc được lược đồ đầu tiên của quán Hạt.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: `Step 1 cho bạn thấy **vì sao** cần cơ sở dữ liệu. Step này cho bạn **từ vựng** để nói về nó cho chính xác:

- **Quan hệ** (bảng), **bộ** (hàng), **thuộc tính** (cột), **miền** (tập giá trị hợp lệ).
- **Khoá chính** và **khoá ngoại** — sợi dây nối các bảng.
- **Lược đồ** — bản thiết kế của cả cơ sở dữ liệu.

Cuối step, bạn đọc được lược đồ bốn bảng của quán Hạt.`,
    },
    {
      section: "visual",
      title: "Giải phẫu một bảng",
      visual: "relational-anatomy",
      body: "Bảng `menu_items` có ba **thuộc tính** (id, name, price) và ba **bộ**. Khung đậm là một bộ — một món. Khung đứt là một thuộc tính — mọi giá trị trong đó cùng **miền** (số nguyên dương). Cột `id` là **khoá chính**: không hai món nào trùng id.",
    },
    {
      section: "core",
      title: "Từ vựng hai thế giới",
      body: `| Lý thuyết (Codd) | Thực tế (SQL) | Bảng tính |
|---|---|---|
| Quan hệ | Bảng (table) | Trang tính |
| Bộ (tuple) | Hàng (row) | Dòng |
| Thuộc tính | Cột (column) | Cột |
| Miền (domain) | Kiểu + ràng buộc | Định dạng ô |
| Lược đồ | CREATE TABLE | — |

Sách học thuật dùng cột trái, lập trình viên dùng cột giữa. Bạn cần đọc được cả hai.`,
    },
    {
      section: "visual",
      title: "Sơ đồ tư duy: mô hình quan hệ",
      visual: "relational-mindmap",
      body: "Năm khái niệm, hai tầng: **cấu trúc** (bảng, cột, hàng) và **ràng buộc** (khoá, miền). Phần lớn lỗi dữ liệu trong đời thực đến từ việc bỏ quên tầng thứ hai.",
    },
    {
      section: "visual",
      title: "Khoá ngoại nối các bảng",
      visual: "fk-link",
      body: "Mỗi dòng của `order_items` ghi `item_id` = 2. Con số này **trỏ tới** dòng có `id = 2` trong `menu_items` — món Trà đào. Đó là **khoá ngoại**. Nhờ nó, giá và tên món chỉ được lưu một chỗ.",
    },
    {
      section: "research",
      title: "Quan hệ là một tập hợp",
      body: `Trong toán học, **quan hệ** là tập con của tích Descartes các miền:

R ⊆ D₁ × D₂ × … × Dₙ

Vì quan hệ là **tập hợp**, Codd suy ra hai tính chất:

1. **Không có hai bộ trùng nhau** — cần khoá để phân biệt.
2. **Các bộ không có thứ tự** — muốn có thứ tự phải nói rõ bằng ORDER BY (step 10).

Hai tính chất này giải thích nhiều "bất ngờ" mà người mới gặp khi dùng SQL.

> Codd, E.F. (1970) 'A relational model of data for large shared data banks', *Communications of the ACM*, 13(6), pp. 377–387.`,
    },
    {
      section: "research",
      title: "SQL không hoàn toàn \"quan hệ\"",
      body: `C.J. Date — người viết giáo trình cơ sở dữ liệu được dùng rộng rãi nhất — chỉ ra SQL lệch khỏi lý thuyết ở vài chỗ:

- Bảng SQL **cho phép dòng trùng** nếu không khai khoá.
- SQL có **NULL**, khiến logic thành ba giá trị (đúng / sai / không biết) — step 9.
- Thứ tự cột trong SQL có ý nghĩa (SELECT *), trong lý thuyết thì không.

Biết những chỗ lệch này giúp bạn tránh lỗi mà trình biên dịch không báo.

> Date, C.J. (2015) *SQL and Relational Theory*. 3rd edn. Sebastopol: O'Reilly.`,
    },
    {
      section: "research",
      title: "Mười hai quy tắc của Codd",
      body: `Năm 1985, Codd công bố 12 quy tắc để xét một DBMS có thật sự "quan hệ" không. Ba quy tắc bạn gặp ngay trong khoá này:

- **Quy tắc thông tin**: mọi dữ liệu đều biểu diễn bằng giá trị trong bảng.
- **Quy tắc truy cập bảo đảm**: mọi giá trị đều tới được bằng *tên bảng + khoá chính + tên cột*.
- **Xử lý NULL có hệ thống**: NULL khác 0 và khác chuỗi rỗng.

Chưa DBMS nào đạt trọn 12 quy tắc — kể cả SQLite, PostgreSQL.

> Codd, E.F. (1985) 'Is your DBMS really relational?', *Computerworld*, 14 October.`,
    },
    {
      section: "ideate",
      title: "Chọn khoá cho món",
      body: `Muốn phân biệt các món, dùng cột nào làm khoá?

- **Tên món**? Quán có thể đổi tên "Bạc xỉu" thành "Bạc xỉu đá" — mọi đơn cũ trỏ theo tên sẽ gãy.
- **Giá**? Hai món cùng giá là chuyện thường.
- **Một số id tự tăng**: không mang ý nghĩa, không bao giờ đổi.

Khoá không mang ý nghĩa gọi là **khoá thay thế** (surrogate key). Khoá lấy từ dữ liệu thật (số CCCD, mã sản phẩm) gọi là **khoá tự nhiên**. Hạt dùng khoá thay thế cho mọi bảng.`,
    },
    {
      section: "ideate",
      title: "Vẽ quan hệ giữa bốn bảng",
      body: `Trả lời bằng lời trước khi vẽ:

- Một **khách** có thể có **nhiều đơn**; một đơn thuộc **tối đa một** khách (hoặc khách vãng lai).
- Một **đơn** có **nhiều dòng đơn**; mỗi dòng thuộc **đúng một** đơn.
- Một **món** xuất hiện trong **nhiều dòng đơn**; mỗi dòng chỉ một món.

"Một – nhiều" xuất hiện ba lần. Mỗi lần như vậy, phía "nhiều" giữ khoá ngoại trỏ về phía "một".`,
    },
    {
      section: "core",
      title: "Khoá chính",
      body: `**Khoá chính** (primary key) là một hoặc vài cột có giá trị:

- **Duy nhất** — không hai hàng trùng.
- **Không NULL** — hàng nào cũng có.
- **Ổn định** — không đổi theo thời gian.

~~~sql
CREATE TABLE menu_items (
  id    INTEGER PRIMARY KEY,
  name  TEXT NOT NULL,
  price INTEGER NOT NULL
);
~~~

Trong SQLite, \`INTEGER PRIMARY KEY\` tự tăng khi bạn không ghi id.`,
    },
    {
      section: "core",
      title: "Khoá ngoại",
      body: `**Khoá ngoại** (foreign key) là cột mà giá trị phải **có thật** ở khoá chính của bảng khác.

~~~sql
CREATE TABLE order_items (
  order_id INTEGER NOT NULL REFERENCES orders(id),
  item_id  INTEGER NOT NULL REFERENCES menu_items(id),
  qty      INTEGER NOT NULL
);
~~~

Ghi \`item_id = 99\` khi không có món 99 → DBMS từ chối. Đây gọi là **toàn vẹn tham chiếu**.

Lưu ý: SQLite chỉ kiểm khoá ngoại khi bật \`PRAGMA foreign_keys = ON;\` — khoá học luôn bật sẵn.`,
    },
    {
      section: "core",
      title: "Khoá ứng viên và khoá tổ hợp",
      body: `- **Khoá ứng viên**: mọi tập cột đủ để phân biệt các hàng. Bảng khách có thể có hai: \`id\` và \`phone\`. Chọn một làm khoá chính, cột còn lại khai \`UNIQUE\`.
- **Khoá tổ hợp**: khoá gồm nhiều cột. Trong \`order_items\`, cặp \`(order_id, item_id)\` là duy nhất — cùng một đơn không ghi một món hai dòng.

~~~sql
PRIMARY KEY (order_id, item_id)
~~~`,
    },
    {
      section: "core",
      title: "Miền và kiểu dữ liệu",
      body: `**Miền** là tập giá trị hợp lệ của một cột. SQL biểu diễn miền bằng **kiểu** + **ràng buộc**:

~~~sql
price INTEGER NOT NULL CHECK (price > 0)
~~~

- Kiểu \`INTEGER\`: chỉ số nguyên.
- \`NOT NULL\`: bắt buộc có.
- \`CHECK (price > 0)\`: không có món giá âm hay bằng 0.

Lưu tiền bằng **số nguyên đồng** (29000), không dùng số thực — số thực làm tròn sai (step 5).`,
    },
    {
      section: "core",
      title: "Lược đồ quán Hạt (bản nháp)",
      visual: "hat-schema",
      body: "Bốn bảng, ba khoá ngoại. Đây là bản nháp — chặng 4 sẽ bổ sung chi nhánh, danh mục món và chuẩn hoá cho đủ 3NF. Mũi tên đi từ khoá ngoại tới khoá chính mà nó trỏ tới.",
    },
    {
      section: "apply",
      title: "Áp dụng: đọc lược đồ",
      body: `Nhìn lược đồ ở slide trước và trả lời (ghi vào \`hat/schema-draft.sql\` dưới dạng chú thích \`-- \`):

1. Bảng nào có khoá tổ hợp?
2. Muốn biết đơn số 7 của khách nào, đi qua những cột nào?
3. Muốn biết đơn số 7 gồm món gì, giá bao nhiêu, đi qua những bảng nào?
4. Vì sao \`orders.customer_id\` được phép NULL còn \`order_items.item_id\` thì không?`,
    },
    {
      section: "apply",
      title: "Đáp án gợi ý",
      body: `1. \`order_items\` — khoá \`(order_id, item_id)\`.
2. \`orders.id = 7\` → đọc \`orders.customer_id\` → \`customers.id\`.
3. \`order_items\` (lọc \`order_id = 7\`) → \`item_id\` → \`menu_items\` lấy tên và giá. Bạn sẽ viết đúng đường đi này bằng **JOIN** ở step 14.
4. Khách vãng lai không có tài khoản, nhưng một dòng đơn **luôn** phải là một món có thật.`,
    },
  ],
  quiz: [
    { kind: "match", q: "Nối thuật ngữ lý thuyết với thuật ngữ SQL.", pairs: [["Quan hệ", "Bảng"], ["Bộ", "Hàng"], ["Thuộc tính", "Cột"]], why: "Codd dùng từ toán học; SQL dùng từ đời thường." },
    { q: "Khoá chính KHÔNG cần tính chất nào?", o: ["Duy nhất", "Không NULL", "Ổn định", "Mang ý nghĩa với người dùng"], a: 3, why: "Khoá thay thế (id tự tăng) không mang ý nghĩa mà vẫn là khoá chính tốt nhất." },
    { kind: "truefalse", q: "Vì quan hệ là tập hợp, các bộ trong bảng có thứ tự cố định.", a: false, why: "Tập hợp không có thứ tự; muốn thứ tự phải dùng ORDER BY." },
    { q: "Ghi order_items.item_id = 99 khi không có món 99 và foreign_keys bật. Kết quả?", o: ["Ghi được, món 99 tự tạo", "DBMS từ chối vì vi phạm toàn vẹn tham chiếu", "Ghi được nhưng item_id thành NULL", "Xoá cả đơn"], a: 1, why: "Khoá ngoại bắt giá trị phải có thật ở bảng được tham chiếu." },
    { kind: "blank", q: "Điền từ khoá để khai khoá ngoại.", code: "item_id INTEGER NOT NULL ___ menu_items(id)", a: "REFERENCES", why: "REFERENCES bảng(cột) khai khoá ngoại ngay trên cột." },
    { q: "Vì sao không dùng tên món làm khoá chính?", o: ["Tên quá dài", "Tên có thể đổi, mọi đơn cũ trỏ theo tên sẽ gãy", "SQL cấm khoá kiểu chữ", "Tên luôn trùng"], a: 1, why: "Khoá phải ổn định; tên là dữ liệu nghiệp vụ, có thể đổi." },
    { kind: "multi", q: "Những cột nào là khoá ngoại trong lược đồ Hạt?", o: ["orders.customer_id", "menu_items.price", "order_items.order_id", "order_items.item_id"], a: [0, 2, 3], why: "Ba khoá ngoại: đơn → khách, dòng → đơn, dòng → món." },
    { kind: "output", q: "Bảng menu_items có id 1, 2, 3. Câu sau thêm được bao nhiêu dòng?", code: "INSERT INTO menu_items (id, name, price) VALUES (2, 'Sữa chua', 30000);", o: ["1", "0 — lỗi trùng khoá chính", "2", "0 — lỗi giá"], a: 1, why: "id = 2 đã tồn tại; khoá chính phải duy nhất." },
    { q: "Nên lưu giá 29.000 đồng bằng kiểu nào?", o: ["REAL 29.0", "INTEGER 29000", "TEXT '29k'", "BLOB"], a: 1, why: "Tiền lưu bằng số nguyên đơn vị nhỏ nhất để không sai do làm tròn số thực." },
    { kind: "bug", q: "Dòng nào cho phép món giá âm?", lines: ["CREATE TABLE menu_items (", "  id INTEGER PRIMARY KEY,", "  name TEXT NOT NULL,", "  price INTEGER NOT NULL", ");"], a: 3, why: "Thiếu CHECK (price > 0) — NOT NULL chỉ chặn ô trống, không chặn số âm." },
  ],
};
