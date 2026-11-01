// Step 35 — Chỉ mục phủ, một phần, biểu thức.
import { HAT_BIG as B } from "../seed.js";

export default {
  id: "sql35",
  lang: "sql",
  file: "hat/advanced-index.sql",
  duration: "75 phút",
  summary: "Ba loại chỉ mục chuyên sâu: chỉ mục phủ (không cần đọc bảng), chỉ mục một phần (chỉ dòng cần), chỉ mục biểu thức (cho cột bọc hàm).",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: "Chỉ mục thường tìm ra **vị trí** dòng rồi còn phải đọc bảng. Ba kỹ thuật dưới đây cắt bớt việc đó, hoặc làm chỉ mục nhỏ hơn nhiều.",
    },
    {
      section: "visual",
      title: "Ba nhánh chỉ mục",
      visual: "perf-mindmap",
      body: "Nhánh **Phủ** và **Một phần** của sơ đồ chặng 7 — cộng thêm chỉ mục **biểu thức** để cứu các điều kiện có hàm ở step 34.",
    },
    {
      section: "research",
      title: "Chỉ mục phủ",
      body: `Winand gọi chỉ mục chứa đủ mọi cột câu truy vấn cần là **index-only scan**: DBMS trả lời ngay từ cây chỉ mục, không đụng tới bảng — thường nhanh hơn hàng chục lần với bảng rộng.

> Winand, M. (2012) *SQL Performance Explained*, ch. 5 'Clustering Data'. Available at: https://use-the-index-luke.com/sql/clustering/index-only-scan-covering-index`,
    },
    {
      section: "ideate",
      title: "Ba truy vấn cần tối ưu",
      body: "1. Tổng tiền theo chi nhánh trong khoảng ngày → **phủ**.\n2. Chỉ tìm đơn \"giao gấp\" (1% bảng) → **một phần**.\n3. Tìm theo `date(ordered_at)` mà không muốn sửa mã ứng dụng → **biểu thức**.",
    },
    {
      section: "core",
      title: "Chỉ mục phủ",
      body: "Chỉ mục chứa `branch_id, ordered_at, total` → kế hoạch ghi `USING COVERING INDEX`.",
      sql: { setup: B, query: "CREATE INDEX idx_cover ON big_orders(branch_id, ordered_at, total);\nEXPLAIN QUERY PLAN\nSELECT SUM(total) FROM big_orders WHERE branch_id = 1 AND ordered_at >= '2026-06-01';" },
    },
    {
      section: "core",
      title: "Chỉ mục một phần",
      body: "`WHERE` trong CREATE INDEX: chỉ đánh chỉ mục ~500 dòng \"giao gấp\" thay vì 50.000.",
      sql: { setup: B, query: "CREATE INDEX idx_urgent ON big_orders(ordered_at) WHERE note = 'giao gấp';\nEXPLAIN QUERY PLAN\nSELECT id FROM big_orders WHERE note = 'giao gấp' AND ordered_at >= '2026-09-01';" },
    },
    {
      section: "core",
      title: "Chỉ mục biểu thức",
      body: "Đánh chỉ mục **chính biểu thức** `date(ordered_at)` — câu truy vấn \"không sargable\" ở step 34 giờ dùng được chỉ mục.",
      sql: { setup: B, query: "CREATE INDEX idx_day ON big_orders(date(ordered_at));\nEXPLAIN QUERY PLAN\nSELECT COUNT(*) FROM big_orders WHERE date(ordered_at) = '2026-06-01';" },
    },
    {
      section: "core",
      title: "Chỉ mục UNIQUE",
      body: "Chỉ mục cũng là **ràng buộc**: UNIQUE INDEX chặn trùng. Ví dụ: mỗi khách chỉ một đơn \"đang mở\" — chỉ mục duy nhất **một phần**.",
      sql: { query: "ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'done';\nCREATE UNIQUE INDEX one_open ON orders(customer_id) WHERE status = 'open';\nUPDATE orders SET status = 'open' WHERE id = 1;\nSELECT id, customer_id, status FROM orders WHERE status = 'open';" },
    },
    {
      section: "apply",
      title: "Bài tập: chỉ mục cho đơn lớn",
      body: "Tạo chỉ mục **một phần** `idx_big` trên `big_orders(ordered_at)` chỉ cho đơn `total >= 190000`, rồi đếm số đơn như vậy.",
      sql: { setup: B, query: "", solution: "CREATE INDEX idx_big ON big_orders(ordered_at) WHERE total >= 190000; SELECT COUNT(*) FROM big_orders WHERE total >= 190000;", hints: ["CREATE INDEX … ON … (…) WHERE total >= 190000;", "Kết thúc bằng SELECT COUNT(*)."] },
    },
  ],
  quiz: [
    { q: "Chỉ mục phủ là?", o: ["Chỉ mục trên mọi cột bảng", "Chỉ mục chứa đủ cột câu truy vấn cần", "Chỉ mục duy nhất", "Chỉ mục khoá chính"], a: 1, why: "Không cần đọc bảng." },
    { kind: "truefalse", q: "Chỉ mục một phần nhỏ hơn chỉ mục toàn bảng.", a: true, why: "Chỉ chứa dòng thoả WHERE." },
    { q: "Cứu WHERE date(ordered_at) = … mà không sửa câu truy vấn?", o: ["Chỉ mục trên ordered_at", "Chỉ mục biểu thức trên date(ordered_at)", "ANALYZE", "VACUUM"], a: 1, why: "Biểu thức khớp đúng chỉ mục." },
    { kind: "blank", q: "Chặn trùng bằng chỉ mục.", code: "CREATE ___ INDEX one_open ON orders(customer_id) WHERE status = 'open';", a: "UNIQUE", why: "Chỉ mục duy nhất một phần." },
    { q: "Kế hoạch ghi USING COVERING INDEX nghĩa là?", o: ["Lỗi", "Trả lời chỉ từ chỉ mục, không đọc bảng", "Quét toàn bảng", "Dùng bảng tạm"], a: 1, why: "Index-only scan." },
  ],
};
