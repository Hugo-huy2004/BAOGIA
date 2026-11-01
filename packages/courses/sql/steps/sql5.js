// Step 5 — Kiểu dữ liệu và NULL. Kết chặng 1.
export default {
  id: "sql5",
  lang: "sql",
  file: "hat/types.sql",
  duration: "75 phút",
  summary: "Hiểu năm lớp lưu trữ của SQLite, cách lưu tiền và ngày giờ đúng chuẩn, ép kiểu với CAST và bản chất của NULL.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: `Chọn sai kiểu là lỗi "âm thầm": dữ liệu vẫn lưu được, nhưng phép tính, phép so sánh và sắp xếp ra kết quả sai.

- Năm lớp lưu trữ của SQLite.
- Lưu **tiền** và **ngày giờ** đúng cách.
- \`typeof()\` và \`CAST\`.
- **NULL** là gì và vì sao nó "lây".

Xong step này là xong **chặng 1**.`,
    },
    {
      section: "visual",
      title: "Sơ đồ tư duy: kiểu dữ liệu",
      visual: "types-mindmap",
      body: "SQLite chỉ có năm lớp lưu trữ. PostgreSQL và MySQL có nhiều kiểu hơn (DATE, DECIMAL, BOOLEAN…), nhưng đều quy về năm ý này.",
    },
    {
      section: "research",
      title: "Kiểu động của SQLite",
      body: `Khác phần lớn DBMS, SQLite gắn kiểu vào **giá trị**, không phải vào cột: cột khai \`INTEGER\` vẫn có thể chứa chữ. Khai báo kiểu của cột chỉ là **ái lực kiểu** (type affinity) — SQLite cố chuyển giá trị về kiểu đó nếu được.

Từ bản 3.37 (2021), bảng khai \`STRICT\` bắt kiểu chặt như các DBMS khác. Khoá học dùng kiểu khai báo rõ ràng và ràng buộc CHECK để có hành vi giống PostgreSQL.

> SQLite (2025) *Datatypes In SQLite*. Available at: https://sqlite.org/datatype3.html (public domain).`,
    },
    {
      section: "research",
      title: "Tiền không bao giờ dùng số thực",
      body: `Số thực (dấu phẩy động theo chuẩn IEEE 754) không biểu diễn chính xác được 0.1. Cộng 0.1 + 0.2 ra 0.30000000000000004. Với tiền, sai một đồng là sai sổ sách.

Hai cách chuẩn: lưu **số nguyên theo đơn vị nhỏ nhất** (đồng, xu) — cách khoá học dùng — hoặc kiểu **DECIMAL/NUMERIC** chính xác ở PostgreSQL.

> Goldberg, D. (1991) 'What every computer scientist should know about floating-point arithmetic', *ACM Computing Surveys*, 23(1), pp. 5–48.`,
    },
    {
      section: "research",
      title: "Ngày giờ theo ISO 8601",
      body: `Chuẩn quốc tế ISO 8601 viết ngày giờ từ **lớn đến nhỏ**: \`2026-10-01 07:50\`. Nhờ vậy, so sánh chuỗi cũng là so sánh thời gian, và sắp xếp chữ cũng là sắp xếp theo thời gian.

Viết kiểu Việt Nam \`01/10/2026\` trong cơ sở dữ liệu thì "02/01/2026" < "15/12/2025" — sai hoàn toàn.

> ISO (2019) *ISO 8601-1:2019 Date and time — Representations for information interchange*. Geneva: ISO.`,
    },
    {
      section: "ideate",
      title: "Mỗi cột của Hạt nên là kiểu gì",
      body: `| Cột | Kiểu | Vì sao |
|---|---|---|
| price | INTEGER | tiền theo đồng |
| qty | INTEGER | số ly |
| name, category | TEXT | chữ |
| ordered_at | TEXT (ISO 8601) | so sánh, sắp xếp đúng |
| phone | TEXT | có số 0 đầu, không làm phép tính |

Số điện thoại lưu INTEGER sẽ mất số 0 đầu — lỗi kinh điển.`,
    },
    {
      section: "core",
      title: "typeof(): giá trị này kiểu gì",
      body: "Chạy để thấy kiểu thật của từng giá trị. Chú ý `phone` của An là **null** — không phải text rỗng.",
      sql: { query: "SELECT name, typeof(name), phone, typeof(phone), typeof(joined_at)\nFROM customers;" },
    },
    {
      section: "core",
      title: "Số nguyên và số thực",
      body: "Một số có dấu chấm thập phân là REAL. Phép chia của hai số nguyên là chia nguyên. Thử nhìn kết quả `0.1 + 0.2` — đó là lý do tiền phải là INTEGER.",
      sql: { query: "SELECT 7 / 2 AS chia_nguyen,\n       7 / 2.0 AS chia_thuc,\n       0.1 + 0.2 AS cong_so_thuc,\n       typeof(7 / 2.0) AS kieu;" },
    },
    {
      section: "core",
      title: "CAST: ép kiểu",
      body: "`CAST(giá_trị AS kiểu)` đổi kiểu một cách tường minh. Chuỗi không phải số khi ép sang INTEGER thành 0 trong SQLite (PostgreSQL thì báo lỗi).",
      sql: { query: "SELECT CAST('29000' AS INTEGER) + 1000 AS cong,\n       CAST(29000 AS TEXT) || ' đồng' AS chu,\n       CAST('abc' AS INTEGER) AS ep_sai;" },
    },
    {
      section: "core",
      title: "Ngày giờ là TEXT có quy tắc",
      body: "SQLite không có kiểu DATE riêng, nhưng có hàm `date()`, `time()`, `datetime()`, `strftime()` làm việc trên chuỗi ISO 8601. Chặng 2 dùng chúng để lọc đơn theo ngày, theo giờ.",
      sql: { query: "SELECT ordered_at,\n       date(ordered_at) AS ngay,\n       strftime('%H', ordered_at) AS gio\nFROM orders;" },
    },
    {
      section: "core",
      title: "NULL là \"chưa biết\"",
      body: `NULL không phải 0, không phải chuỗi rỗng — nó là **không biết**. Hệ quả:

- Mọi phép tính có NULL ra **NULL**: \`NULL + 1\` là NULL.
- So sánh với NULL ra **NULL**, kể cả \`NULL = NULL\`.
- Muốn kiểm tra phải dùng \`IS NULL\` / \`IS NOT NULL\` (step 9 đi sâu).`,
      sql: { query: "SELECT NULL + 1 AS cong,\n       NULL = NULL AS bang_nhau,\n       NULL IS NULL AS la_null,\n       'Hạt' || NULL AS ghep;" },
    },
    {
      section: "core",
      title: "coalesce(): thay NULL bằng giá trị mặc định",
      body: "`coalesce(a, b, …)` trả giá trị **đầu tiên không NULL**. Dùng khi hiển thị: khách chưa có số điện thoại thì hiện chữ thay thế.",
      sql: { query: "SELECT name, coalesce(phone, '(chưa có)') AS sdt\nFROM customers;" },
    },
    {
      section: "apply",
      title: "Bài tập 1: kiểu của giá",
      body: "Hiện tên món và **kiểu dữ liệu** của cột price (dùng typeof), đặt bí danh `kieu`.",
      sql: { query: "", solution: "SELECT name, typeof(price) AS kieu FROM menu_items;", hints: ["Hàm typeof(cột) trả tên kiểu.", "SELECT name, typeof(price) AS kieu FROM menu_items;"] },
    },
    {
      section: "apply",
      title: "Bài tập 2: ngày của từng đơn",
      body: "Hiện `id` và **chỉ phần ngày** của `ordered_at` cho mọi đơn hàng.",
      sql: { query: "", solution: "SELECT id, date(ordered_at) FROM orders;", hints: ["Hàm date() cắt lấy phần ngày.", "SELECT id, date(ordered_at) FROM orders;"] },
    },
    {
      section: "apply",
      title: "Bài tập 3: danh bạ không lỗ hổng",
      body: "Hiện tên khách và số điện thoại; khách chưa có số thì hiện `0000000000`.",
      sql: { query: "", solution: "SELECT name, coalesce(phone, '0000000000') FROM customers;", hints: ["Dùng coalesce để thay NULL.", "coalesce(phone, '0000000000')"] },
    },
    {
      section: "apply",
      title: "Tổng kết chặng 1",
      body: `Bạn đã:

1. Phân biệt dữ liệu, thông tin; hiểu DBMS và mô hình quan hệ của Codd.
2. Đọc được lược đồ với khoá chính, khoá ngoại.
3. Chạy SQL thật, đọc kết quả và lỗi.
4. Viết SELECT có cột, bí danh, biểu thức, DISTINCT.
5. Chọn kiểu đúng, xử lý NULL.

Chặng 2: **WHERE** — hỏi đúng câu hỏi để lấy đúng những dòng cần.`,
    },
  ],
  quiz: [
    { q: "Nên lưu giá 35.000 đồng bằng kiểu nào?", o: ["REAL 35.0", "INTEGER 35000", "TEXT '35k'", "BLOB"], a: 1, why: "Số nguyên theo đơn vị nhỏ nhất: không sai do làm tròn." },
    { kind: "output", q: "Kết quả là gì?", code: "SELECT NULL + 5;", o: ["5", "0", "NULL", "Lỗi"], a: 2, why: "Mọi phép tính có NULL đều ra NULL." },
    { kind: "output", q: "Kết quả là gì?", code: "SELECT 7 / 2;", o: ["3", "3.5", "4", "Lỗi"], a: 0, why: "Hai số nguyên chia nguyên." },
    { kind: "truefalse", q: "NULL = NULL cho kết quả đúng (1).", a: false, why: "So sánh với NULL ra NULL; phải dùng IS NULL." },
    { q: "Vì sao số điện thoại lưu TEXT?", o: ["Tiết kiệm bộ nhớ", "Giữ số 0 đầu và không làm phép tính với nó", "SQLite bắt buộc", "Để sắp xếp nhanh"], a: 1, why: "Lưu INTEGER sẽ mất số 0 đầu." },
    { kind: "blank", q: "Điền hàm trả giá trị đầu tiên không NULL.", code: "SELECT ___(phone, '(chưa có)') FROM customers;", a: "coalesce", why: "coalesce(a, b, …) trả giá trị đầu tiên khác NULL." },
    { q: "Cách viết ngày nào so sánh/sắp xếp đúng khi lưu dạng chữ?", o: ["01/10/2026", "2026-10-01", "1 tháng 10, 2026", "10-01-26"], a: 1, why: "ISO 8601 viết từ lớn tới nhỏ nên thứ tự chữ trùng thứ tự thời gian." },
    { kind: "match", q: "Nối giá trị với kiểu SQLite.", pairs: [["29000", "integer"], ["0.5", "real"], ["'Lan'", "text"], ["NULL", "null"]], why: "Năm lớp lưu trữ: integer, real, text, blob, null." },
    { kind: "multi", q: "Những phát biểu đúng về NULL?", o: ["Khác 0", "Khác chuỗi rỗng", "NULL || 'a' ra 'a'", "Kiểm tra bằng IS NULL"], a: [0, 1, 3], why: "Ghép chuỗi với NULL cũng ra NULL." },
    { kind: "output", q: "Kết quả là gì?", code: "SELECT CAST('abc' AS INTEGER);", o: ["abc", "NULL", "0", "Lỗi"], a: 2, why: "SQLite ép chuỗi không phải số thành 0 (PostgreSQL sẽ báo lỗi)." },
  ],
};
