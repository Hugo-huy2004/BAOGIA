// Step 33 — Chỉ mục B-tree. Mở chặng 7 (hiệu năng).
import { HAT_BIG as B } from "../seed.js";

export default {
  id: "sql33",
  lang: "sql",
  file: "hat/index.sql",
  duration: "75 phút",
  summary: "Hiểu chỉ mục B-tree hoạt động thế nào, tạo chỉ mục, đo khác biệt giữa quét toàn bảng và tìm theo chỉ mục, và cái giá phải trả khi ghi.",
  slides: [
    {
      section: "intro",
      title: "Chặng 7: nhanh trên hàng triệu dòng",
      body: `Quán Hạt giờ có 50.000 đơn (bảng \`big_orders\` trong ô SQL). Câu truy vấn đúng nhưng **chậm** là câu truy vấn sai trong mắt người dùng.

Chặng 7: B-tree → EXPLAIN QUERY PLAN → chỉ mục phủ/một phần/biểu thức → JSON → tìm kiếm toàn văn.`,
    },
    {
      section: "visual",
      title: "Sơ đồ tư duy: chặng 7",
      visual: "perf-mindmap",
      body: "Bốn nhánh về **chỉ mục và kế hoạch truy vấn**, hai nhánh về **kiểu dữ liệu đặc biệt** (JSON, văn bản) cần chỉ mục riêng.",
    },
    {
      section: "visual",
      title: "Cây B-tree",
      visual: "btree",
      body: "Chỉ mục là một cây **đã sắp xếp**. Tìm một giá đi từ gốc xuống lá: mỗi bước loại một nửa (hoặc hơn) — log n bước thay vì đọc n dòng. Tủ phiếu thư viện ở step 1 chính là chỉ mục bằng gỗ.",
    },
    {
      section: "research",
      title: "Bayer và McCreight (1972)",
      body: `B-tree được phát minh tại Boeing cho việc lưu trữ trên đĩa: mỗi nút vừa một trang đĩa, cây thấp nên ít lần đọc. Gần như mọi DBMS quan hệ — SQLite, PostgreSQL, MySQL — dùng B-tree (hoặc biến thể B+tree) làm chỉ mục mặc định.

> Bayer, R. and McCreight, E. (1972) 'Organization and maintenance of large ordered indexes', *Acta Informatica*, 1(3), pp. 173–189.`,
    },
    {
      section: "ideate",
      title: "Câu hỏi thường gặp nhất",
      body: "App hiện **lịch sử đơn của một khách** mỗi lần khách mở app: `WHERE customer_id = ?`. Câu này chạy hàng nghìn lần mỗi ngày → đáng có chỉ mục.",
    },
    {
      section: "core",
      title: "Quét toàn bảng",
      body: "Không có chỉ mục: `SCAN big_orders` — đọc đủ 50.000 dòng.",
      sql: { setup: B, query: "EXPLAIN QUERY PLAN\nSELECT * FROM big_orders WHERE customer_id = 42;" },
    },
    {
      section: "core",
      title: "CREATE INDEX",
      body: "Sau khi có chỉ mục: `SEARCH … USING INDEX` — nhảy thẳng tới khoảng 10 dòng cần.",
      sql: { setup: B, query: "CREATE INDEX idx_big_customer ON big_orders(customer_id);\nEXPLAIN QUERY PLAN\nSELECT * FROM big_orders WHERE customer_id = 42;" },
    },
    {
      section: "core",
      title: "Chỉ mục nhiều cột",
      body: "Thứ tự cột quan trọng như danh bạ (họ, tên): tìm theo **cột đầu** hoặc **cột đầu + cột sau** thì dùng được; chỉ theo cột sau thì không.",
      sql: { setup: B, query: "CREATE INDEX idx_big_branch_time ON big_orders(branch_id, ordered_at);\nEXPLAIN QUERY PLAN\nSELECT COUNT(*) FROM big_orders WHERE branch_id = 2 AND ordered_at >= '2026-06-01';" },
    },
    {
      section: "core",
      title: "Cái giá của chỉ mục",
      body: "Mỗi chỉ mục là một cây phải **cập nhật khi ghi**, và tốn chỗ. Đừng đánh chỉ mục mọi cột — chỉ cho truy vấn thật sự hay chạy. Xem các chỉ mục đang có:",
      sql: { setup: B, query: "CREATE INDEX idx_big_customer ON big_orders(customer_id);\nSELECT name, tbl_name FROM sqlite_schema WHERE type = 'index';" },
    },
    {
      section: "apply",
      title: "Bài tập: chỉ mục cho tổng tiền",
      body: "Tạo chỉ mục `idx_big_total` trên `big_orders(total)`, rồi hiện `name` các chỉ mục của bảng `big_orders`.",
      sql: { setup: B, query: "", solution: "CREATE INDEX idx_big_total ON big_orders(total); SELECT name FROM sqlite_schema WHERE type = 'index' AND tbl_name = 'big_orders';", hints: ["CREATE INDEX tên ON bảng(cột);", "sqlite_schema WHERE type = 'index'"] },
    },
  ],
  quiz: [
    { q: "Tìm trong chỉ mục B-tree tốn khoảng bao nhiêu bước với n dòng?", o: ["n", "log n", "1", "n²"], a: 1, why: "Cây cân bằng, mỗi bước loại phần lớn." },
    { kind: "truefalse", q: "Thêm chỉ mục làm INSERT/UPDATE chậm hơn một chút.", a: true, why: "Mỗi chỉ mục phải cập nhật khi ghi." },
    { q: "Chỉ mục (branch_id, ordered_at) dùng được cho WHERE nào?", o: ["Chỉ ordered_at", "branch_id, hoặc branch_id + ordered_at", "Mọi cột", "Không cột nào"], a: 1, why: "Phải dùng cột đầu (tiền tố trái)." },
    { kind: "blank", q: "Tạo chỉ mục.", code: "___ INDEX idx_c ON orders(customer_id);", a: "CREATE", why: "CREATE INDEX." },
    { q: "Ai phát minh B-tree?", o: ["Codd", "Bayer và McCreight", "Gray", "Chen"], a: 1, why: "Boeing, 1972." },
  ],
};
