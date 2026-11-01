// Step 21 — Chuẩn hoá 1NF, 2NF, 3NF.
const FLAT = "CREATE TABLE flat_orders (order_id INT, ordered_at TEXT, customer_name TEXT, customer_phone TEXT, item_name TEXT, item_price INT, qty INT);\nINSERT INTO flat_orders VALUES (1,'2026-10-01 07:50','Lan','0901000001','Bạc xỉu',29000,2),(3,'2026-10-01 08:10','Minh','0901000002','Cà phê đen',25000,1),(3,'2026-10-01 08:10','Minh','0901000002','Bánh mì',20000,1),(4,'2026-10-01 08:15','Lan','0901000001','Trà đào',35000,1),(7,'2026-10-02 09:20','Minh','0901000002','Trà đào',35000,1);";

export default {
  id: "sql21",
  lang: "sql",
  file: "hat/normalize.sql",
  duration: "90 phút",
  summary: "Nhận ra dữ liệu trùng lặp và dị thường cập nhật, rồi chuẩn hoá một bảng phẳng thành 3NF.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: "Một bảng Excel \"tất cả trong một\" trông tiện — cho tới khi Lan đổi số điện thoại và bạn phải sửa 30 dòng, sót 1 dòng là dữ liệu mâu thuẫn. **Chuẩn hoá** là quy trình tách bảng để mỗi sự thật chỉ nằm một chỗ.",
    },
    {
      section: "visual",
      title: "Ba dạng chuẩn",
      visual: "normal-forms",
      body: "Mỗi dạng chuẩn sau bao gồm dạng trước. Trong thực tế, **3NF** là đích của hầu hết thiết kế.",
    },
    {
      section: "research",
      title: "Codd 1971 và câu nhớ của Kent",
      body: `Codd (1971) định nghĩa 2NF và 3NF dựa trên **phụ thuộc hàm**: A → B nghĩa là biết A thì biết duy nhất B. William Kent (1983) tóm lại bằng câu nhớ: *mọi cột phụ thuộc vào khoá, cả khoá, và không gì khác ngoài khoá*.

> Codd, E.F. (1971) 'Further normalization of the data base relational model', IBM Research Report RJ909.
>
> Kent, W. (1983) 'A simple guide to five normal forms in relational database theory', *Communications of the ACM*, 26(2), pp. 120–125.`,
    },
    {
      section: "ideate",
      title: "Ba dị thường",
      body: `Với bảng phẳng \`flat_orders\`:

- **Dị thường cập nhật**: đổi số của Lan phải sửa nhiều dòng.
- **Dị thường thêm**: không thể thêm món mới khi chưa có ai gọi.
- **Dị thường xoá**: xoá đơn duy nhất có Matcha là mất luôn giá Matcha.`,
    },
    {
      section: "core",
      title: "Bảng phẳng",
      body: "Thấy tên và số của Minh lặp 3 lần, giá Trà đào lặp 2 lần.",
      sql: { setup: FLAT, query: "SELECT * FROM flat_orders;" },
    },
    {
      section: "core",
      title: "1NF: mỗi ô một giá trị",
      body: "Bảng đã 1NF: không ô nào chứa danh sách. (Bản vi phạm: cột `items = 'cà phê, bánh mì'`.) Khoá của bảng phẳng là **(order_id, item_name)**.",
    },
    {
      section: "core",
      title: "2NF: phụ thuộc đủ khoá",
      body: "`customer_name` chỉ phụ thuộc `order_id` — **một phần** của khoá → vi phạm 2NF. Tách thông tin đơn ra bảng riêng.",
      sql: { setup: FLAT, query: "SELECT DISTINCT order_id, ordered_at, customer_name, customer_phone\nFROM flat_orders;" },
    },
    {
      section: "core",
      title: "3NF: không phụ thuộc bắc cầu",
      body: "Trong bảng đơn: `order_id → customer_phone → customer_name`. Tên phụ thuộc khoá **qua** số điện thoại → vi phạm 3NF. Tách khách ra bảng riêng.",
      sql: { setup: FLAT, query: "SELECT DISTINCT customer_phone, customer_name FROM flat_orders;" },
    },
    {
      section: "core",
      title: "Kết quả: bốn bảng quen thuộc",
      body: "Tách xong, bạn có đúng lược đồ customers – orders – order_items – menu_items từ step 2. Lược đồ của Hạt vốn đã 3NF — giờ bạn biết **vì sao**.",
      sql: { setup: FLAT, query: "CREATE TABLE k AS SELECT DISTINCT customer_phone AS phone, customer_name AS name FROM flat_orders;\nCREATE TABLE mon AS SELECT DISTINCT item_name AS name, item_price AS price FROM flat_orders;\nSELECT 'khách' AS bang, COUNT(*) FROM k UNION ALL SELECT 'món', COUNT(*) FROM mon;" },
    },
    {
      section: "core",
      title: "Khi nào phi chuẩn hoá",
      body: "Báo cáo đọc nhiều, ghi ít đôi khi **cố ý** lưu trùng (ví dụ giá tại thời điểm bán trong dòng đơn — để đổi giá thực đơn không làm sai hoá đơn cũ). Đó là quyết định có chủ đích, không phải lỗi thiết kế.",
    },
    {
      section: "apply",
      title: "Bài tập: tách bảng món",
      body: "Từ `flat_orders`, lấy danh sách **món không trùng** với hai cột tên và giá.",
      sql: { setup: FLAT, query: "", solution: "SELECT DISTINCT item_name, item_price FROM flat_orders;", hints: ["Món phụ thuộc item_name.", "SELECT DISTINCT item_name, item_price …"] },
    },
  ],
  quiz: [
    { q: "Dị thường cập nhật là?", o: ["Không thêm được dữ liệu", "Phải sửa cùng một sự thật ở nhiều dòng", "Mất dữ liệu khi xoá", "Lỗi cú pháp"], a: 1, why: "Sót một dòng là mâu thuẫn." },
    { kind: "order", q: "Thứ tự dạng chuẩn?", items: ["1NF", "2NF", "3NF"], a: [0, 1, 2], why: "Mỗi dạng bao gồm dạng trước." },
    { q: "customer_name chỉ phụ thuộc order_id trong khoá (order_id, item_name) vi phạm?", o: ["1NF", "2NF", "3NF", "Không vi phạm"], a: 1, why: "Phụ thuộc một phần khoá." },
    { kind: "truefalse", q: "Lưu giá tại thời điểm bán trong dòng đơn là phi chuẩn hoá có chủ đích.", a: true, why: "Đổi giá thực đơn không làm sai hoá đơn cũ." },
    { kind: "blank", q: "Câu nhớ của Kent: phụ thuộc vào khoá, cả khoá, và không gì khác ngoài ___", code: "the key, the whole key, and nothing but the ___", a: "key", why: "Kent (1983)." },
  ],
};
