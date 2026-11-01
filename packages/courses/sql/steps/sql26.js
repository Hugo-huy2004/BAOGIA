// Step 26 — View, trigger, cột sinh tự động.
export default {
  id: "sql26",
  lang: "sql",
  file: "hat/view-trigger.sql",
  duration: "75 phút",
  summary: "Đặt tên cho truy vấn hay dùng bằng VIEW, tự động hoá việc ghi bằng TRIGGER, và biết khi nào không nên dùng trigger.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: "Câu JOIN tính tiền đơn bạn viết đi viết lại từ chặng 3. **View** lưu nó thành một \"bảng ảo\". **Trigger** cho DBMS tự làm việc khi có ghi — ví dụ ghi nhật ký mỗi lần đổi giá.",
    },
    {
      section: "visual",
      title: "View và trigger trong sơ đồ",
      visual: "write-mindmap",
      body: "VIEW là tầng **đọc** gọn; TRIGGER là tầng **ghi** tự động. Cả hai sống trong cơ sở dữ liệu nên mọi ứng dụng cùng hưởng.",
    },
    {
      section: "research",
      title: "View và độc lập dữ liệu",
      body: `View hiện thực hoá **độc lập dữ liệu logic** của Codd: đổi cấu trúc bảng bên dưới, giữ view y nguyên, ứng dụng không phải sửa. Trigger thì nên dùng tiết chế — logic ẩn trong DBMS khó gỡ lỗi; Karwin khuyên chỉ dùng cho nhật ký và toàn vẹn.

> ANSI/X3/SPARC (1975) *Interim Report: Study Group on Data Base Management Systems*. FDT Bulletin 7(2).`,
    },
    {
      section: "ideate",
      title: "Hai nhu cầu của chủ quán",
      body: "1. Một \"bảng\" `order_totals(order_id, tien)` luôn đúng, dùng cho mọi báo cáo.\n2. Mỗi lần đổi giá món, lưu lại giá cũ, giá mới, lúc nào — để đối chiếu.",
    },
    {
      section: "core",
      title: "CREATE VIEW",
      body: "Truy vấn view như truy vấn bảng.",
      sql: { query: "CREATE VIEW order_totals AS\nSELECT oi.order_id, SUM(oi.qty * m.price) AS tien\nFROM order_items oi JOIN menu_items m ON m.id = oi.item_id\nGROUP BY oi.order_id;\nSELECT * FROM order_totals WHERE tien > 40000;" },
    },
    {
      section: "core",
      title: "View luôn mới",
      body: "View không lưu dữ liệu — mỗi lần đọc là chạy lại truy vấn. Đổi giá xong, đọc lại view là thấy số mới.",
      sql: { query: "CREATE VIEW order_totals AS\nSELECT oi.order_id, SUM(oi.qty * m.price) AS tien\nFROM order_items oi JOIN menu_items m ON m.id = oi.item_id GROUP BY oi.order_id;\nUPDATE menu_items SET price = 30000 WHERE id = 1;\nSELECT * FROM order_totals WHERE order_id = 1;" },
    },
    {
      section: "core",
      title: "TRIGGER ghi nhật ký giá",
      body: "`AFTER UPDATE OF price`: chạy sau mỗi lần sửa cột price. `OLD` và `NEW` là dòng trước/sau.",
      sql: { query: "CREATE TABLE price_log (item_id INT, old_price INT, new_price INT, at TEXT DEFAULT (datetime('now')));\nCREATE TRIGGER log_price AFTER UPDATE OF price ON menu_items\nWHEN OLD.price <> NEW.price\nBEGIN\n  INSERT INTO price_log (item_id, old_price, new_price) VALUES (NEW.id, OLD.price, NEW.price);\nEND;\nUPDATE menu_items SET price = price + 2000 WHERE category = 'tea';\nSELECT item_id, old_price, new_price FROM price_log;" },
    },
    {
      section: "core",
      title: "TRIGGER chặn nghiệp vụ",
      body: "`RAISE(ABORT, …)` huỷ câu lệnh. Câu UPDATE cuối **cố ý sai**: tăng giá quá 50% bị chặn.",
      sql: { query: "CREATE TRIGGER no_spike BEFORE UPDATE OF price ON menu_items\nWHEN NEW.price > OLD.price * 1.5\nBEGIN SELECT RAISE(ABORT, 'Tăng giá quá 50%'); END;\nUPDATE menu_items SET price = 90000 WHERE id = 1;" },
    },
    {
      section: "apply",
      title: "Bài tập 1: view khách quen",
      body: "Tạo view `regulars` gồm `customer_id` và `so_don` của khách có **từ 2 đơn**, rồi `SELECT * FROM regulars;`",
      sql: { query: "", solution: "CREATE VIEW regulars AS SELECT customer_id, COUNT(*) AS so_don FROM orders WHERE customer_id IS NOT NULL GROUP BY customer_id HAVING COUNT(*) >= 2; SELECT * FROM regulars;", hints: ["CREATE VIEW regulars AS SELECT … GROUP BY … HAVING …", "Bỏ customer_id NULL."] },
    },
    {
      section: "apply",
      title: "Bài tập 2: đếm qua view",
      body: "Dùng view `order_totals` (đã tạo sẵn) đếm số đơn có tiền **từ 50.000** trở lên.",
      sql: { setup: "CREATE VIEW order_totals AS SELECT oi.order_id, SUM(oi.qty * m.price) AS tien FROM order_items oi JOIN menu_items m ON m.id = oi.item_id GROUP BY oi.order_id;", query: "", solution: "SELECT COUNT(*) FROM order_totals WHERE tien >= 50000;", hints: ["View dùng như bảng.", "WHERE tien >= 50000"] },
    },
  ],
  quiz: [
    { kind: "truefalse", q: "View lưu một bản sao dữ liệu tại lúc tạo.", a: false, why: "View chạy lại truy vấn mỗi lần đọc (view vật chất hoá thì khác)." },
    { q: "Trong trigger, dòng trước khi sửa gọi là?", o: ["NEW", "OLD", "PREV", "THIS"], a: 1, why: "OLD và NEW." },
    { kind: "blank", q: "Huỷ câu lệnh trong trigger.", code: "SELECT ___(ABORT, 'Tăng giá quá 50%');", a: "RAISE", why: "RAISE(ABORT, thông điệp)." },
    { q: "Khi nào nên dùng trigger?", o: ["Mọi logic nghiệp vụ", "Nhật ký và toàn vẹn dữ liệu", "Gửi email", "Không bao giờ"], a: 1, why: "Logic ẩn khó gỡ lỗi — dùng tiết chế." },
    { q: "View giúp gì cho độc lập dữ liệu?", o: ["Nhanh hơn", "Đổi bảng dưới mà ứng dụng vẫn đọc view như cũ", "Tiết kiệm đĩa", "Bảo mật tuyệt đối"], a: 1, why: "Độc lập dữ liệu logic." },
  ],
};
