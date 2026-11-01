// Step 25 — Giao dịch và ACID.
const STOCK = "CREATE TABLE stock (item_id INTEGER PRIMARY KEY REFERENCES menu_items(id), left_qty INTEGER NOT NULL CHECK (left_qty >= 0));\nINSERT INTO stock VALUES (1, 10), (2, 1), (3, 5), (4, 3), (5, 0), (6, 4);";

export default {
  id: "sql25",
  lang: "sql",
  file: "hat/transaction.sql",
  duration: "90 phút",
  summary: "Gom nhiều câu ghi thành một giao dịch BEGIN … COMMIT/ROLLBACK, hiểu bốn tính chất ACID, SAVEPOINT và mức cô lập.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: "Đặt món = **ba** việc: tạo đơn, thêm dòng đơn, trừ tồn kho. Mất điện sau việc thứ hai → có đơn mà kho không trừ. Giao dịch bảo đảm: **cả ba hoặc không gì**.",
    },
    {
      section: "visual",
      title: "Bốn tính chất ACID",
      visual: "acid",
      body: "Atomicity (nguyên tử), Consistency (nhất quán), Isolation (cô lập), Durability (bền vững).",
    },
    {
      section: "research",
      title: "Nguồn gốc ACID",
      body: `Jim Gray (1981) đặt nền khái niệm giao dịch; Härder và Reuter (1983) đặt tên viết tắt ACID. Gray nhận giải Turing 1998 cho công trình về giao dịch.

> Gray, J. (1981) 'The transaction concept: virtues and limitations', *Proceedings of VLDB 1981*, pp. 144–154.
>
> Härder, T. and Reuter, A. (1983) 'Principles of transaction-oriented database recovery', *ACM Computing Surveys*, 15(4), pp. 287–317.`,
    },
    {
      section: "ideate",
      title: "Đặt món an toàn",
      body: "BEGIN → thêm đơn → thêm dòng → trừ kho. Nếu kho âm (CHECK chặn) → ROLLBACK cả đơn. Nếu ổn → COMMIT. Không bao giờ có trạng thái nửa vời.",
    },
    {
      section: "core",
      title: "BEGIN … COMMIT",
      body: "Ba câu ghi thành một đơn vị.",
      sql: { setup: STOCK, query: "BEGIN;\nINSERT INTO orders (id, customer_id, ordered_at) VALUES (9, 1, '2026-10-03 10:00');\nINSERT INTO order_items VALUES (9, 1, 2);\nUPDATE stock SET left_qty = left_qty - 2 WHERE item_id = 1;\nCOMMIT;\nSELECT * FROM stock WHERE item_id = 1;" },
    },
    {
      section: "core",
      title: "ROLLBACK huỷ tất cả",
      body: "Sau ROLLBACK, đơn 10 không tồn tại — như chưa từng chạy.",
      sql: { setup: STOCK, query: "BEGIN;\nINSERT INTO orders (id, customer_id, ordered_at) VALUES (10, 2, '2026-10-03 10:05');\nINSERT INTO order_items VALUES (10, 3, 1);\nROLLBACK;\nSELECT COUNT(*) AS co_don_10 FROM orders WHERE id = 10;" },
    },
    {
      section: "core",
      title: "Ràng buộc + giao dịch",
      body: "Trà đào chỉ còn 1 ly. Câu UPDATE thứ hai **cố ý sai** — vi phạm CHECK → ứng dụng phải ROLLBACK. Chạy rồi xem bảng stock: dòng item 2 vẫn là 1? Ô này dừng ở lỗi, giao dịch còn mở — trong ứng dụng thật, mã bắt lỗi sẽ gọi ROLLBACK.",
      sql: { setup: STOCK, query: "BEGIN;\nUPDATE stock SET left_qty = left_qty - 1 WHERE item_id = 1;\nUPDATE stock SET left_qty = left_qty - 2 WHERE item_id = 2;\nCOMMIT;" },
    },
    {
      section: "core",
      title: "SAVEPOINT",
      body: "Điểm lưu bên trong giao dịch: quay lại một phần mà không huỷ hết.",
      sql: { setup: STOCK, query: "BEGIN;\nUPDATE stock SET left_qty = left_qty - 1 WHERE item_id = 3;\nSAVEPOINT them_banh;\nUPDATE stock SET left_qty = left_qty - 1 WHERE item_id = 4;\nROLLBACK TO them_banh;\nCOMMIT;\nSELECT * FROM stock WHERE item_id IN (3, 4);" },
    },
    {
      section: "core",
      title: "Mức cô lập",
      body: `Chuẩn SQL có bốn mức: READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE. Mức thấp nhanh hơn nhưng cho phép "đọc bẩn", "đọc không lặp lại", "bóng ma".

- **SQLite**: mặc định SERIALIZABLE (một người ghi tại một thời điểm).
- **PostgreSQL**: mặc định READ COMMITTED.

> Berenson, H. et al. (1995) 'A critique of ANSI SQL isolation levels', *Proceedings of ACM SIGMOD 1995*, pp. 1–10.`,
    },
    {
      section: "apply",
      title: "Bài tập: đặt món trọn gói",
      body: "Trong **một giao dịch**: tạo đơn `id 11` của khách 3 lúc `'2026-10-03 11:00'`, thêm 1 Matcha (item 5)… nhưng kho Matcha = 0! Hãy ROLLBACK, rồi chứng minh đơn 11 **không** tồn tại: `SELECT COUNT(*) FROM orders WHERE id = 11;`",
      sql: { setup: STOCK, query: "", solution: "BEGIN; INSERT INTO orders (id, customer_id, ordered_at) VALUES (11, 3, '2026-10-03 11:00'); ROLLBACK; SELECT COUNT(*) FROM orders WHERE id = 11;", hints: ["BEGIN … ROLLBACK huỷ mọi thứ ở giữa.", "Kết quả cuối phải là 0."] },
    },
  ],
  quiz: [
    { kind: "match", q: "Nối chữ cái với tính chất.", pairs: [["A", "tất cả hoặc không gì"], ["C", "luôn thoả ràng buộc"], ["I", "không thấy việc dở của người khác"], ["D", "đã COMMIT là còn"]], why: "ACID." },
    { q: "ROLLBACK làm gì?", o: ["Lưu thay đổi", "Huỷ mọi thay đổi từ BEGIN", "Xoá bảng", "Khởi động lại"], a: 1, why: "Atomicity." },
    { kind: "blank", q: "Quay lại một điểm giữa giao dịch.", code: "ROLLBACK TO ___ them_banh;", a: "SAVEPOINT", why: "Cú pháp đầy đủ: ROLLBACK TO SAVEPOINT tên (SAVEPOINT tuỳ chọn)." },
    { q: "Mức cô lập mặc định của PostgreSQL?", o: ["READ UNCOMMITTED", "READ COMMITTED", "REPEATABLE READ", "SERIALIZABLE"], a: 1, why: "SQLite mặc định SERIALIZABLE." },
    { q: "Ai đặt tên ACID (1983)?", o: ["Codd", "Härder và Reuter", "Gray", "Chen"], a: 1, why: "Gray đặt nền khái niệm giao dịch (1981)." },
  ],
};
