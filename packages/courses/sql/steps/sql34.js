// Step 34 — EXPLAIN QUERY PLAN và tối ưu truy vấn.
import { HAT_BIG as B } from "../seed.js";

export default {
  id: "sql34",
  lang: "sql",
  file: "hat/explain.sql",
  duration: "90 phút",
  summary: "Đọc kế hoạch truy vấn, nhận ra các mẫu làm mất chỉ mục (hàm trên cột, LIKE '%…', OR, ép kiểu) và viết lại cho \"sargable\".",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: "Có chỉ mục chưa chắc **được dùng**. Viết `WHERE date(ordered_at) = …` là chỉ mục trên `ordered_at` vô dụng. Step này dạy đọc `EXPLAIN QUERY PLAN` và sửa các mẫu \"giết chỉ mục\".",
    },
    {
      section: "visual",
      title: "EXPLAIN trong sơ đồ",
      visual: "perf-mindmap",
      body: "Nhánh **EXPLAIN**: hỏi DBMS \"bạn định chạy câu này thế nào\" trước khi chạy thật.",
    },
    {
      section: "research",
      title: "Bộ tối ưu dựa trên chi phí",
      body: `Selinger và cộng sự (1979) xây bộ tối ưu dựa trên chi phí cho System R: liệt kê các cách chạy, ước lượng chi phí từng cách bằng thống kê, chọn cách rẻ nhất. Mọi DBMS hiện đại vẫn theo khung này. \`ANALYZE\` thu thập thống kê cho bộ tối ưu.

> Selinger, P.G. et al. (1979) 'Access path selection in a relational database management system', *Proceedings of ACM SIGMOD 1979*, pp. 23–34.`,
    },
    {
      section: "ideate",
      title: "Sargable",
      body: "Một điều kiện là **sargable** (Search ARGument ABLE) khi cột đứng **trần** một vế: `cột <toán tử> hằng`. Bọc cột trong hàm, phép tính, hay ép kiểu là mất khả năng dùng chỉ mục.",
    },
    {
      section: "core",
      title: "Hàm trên cột làm mất chỉ mục",
      body: "Có chỉ mục `ordered_at`, nhưng `date(ordered_at)` → vẫn **SCAN**: SQLite đọc hết 50.000 mục của chỉ mục (rẻ hơn đọc bảng một chút, nhưng không \"nhảy\" thẳng tới ngày cần được). So với slide sau: **SEARCH**.",
      sql: { setup: B, query: "CREATE INDEX idx_t ON big_orders(ordered_at);\nEXPLAIN QUERY PLAN\nSELECT COUNT(*) FROM big_orders WHERE date(ordered_at) = '2026-06-01';" },
    },
    {
      section: "core",
      title: "Viết lại thành khoảng",
      body: "Cùng ý nghĩa, cột trần → SEARCH USING INDEX.",
      sql: { setup: B, query: "CREATE INDEX idx_t ON big_orders(ordered_at);\nEXPLAIN QUERY PLAN\nSELECT COUNT(*) FROM big_orders\nWHERE ordered_at >= '2026-06-01' AND ordered_at < '2026-06-02';" },
    },
    {
      section: "core",
      title: "Phép tính trên cột",
      body: "`total / 1000 > 150` → SCAN. Chuyển phép tính sang vế hằng: `total > 150000`.",
      sql: { setup: B, query: "CREATE INDEX idx_total ON big_orders(total);\nEXPLAIN QUERY PLAN SELECT COUNT(*) FROM big_orders WHERE total / 1000 > 150;\n-- so sánh: EXPLAIN QUERY PLAN SELECT COUNT(*) FROM big_orders WHERE total > 150000;" },
    },
    {
      section: "core",
      title: "LIKE '%…' và LIKE '…%'",
      body: "Mẫu bắt đầu bằng `%` không dùng B-tree. Mẫu tiền tố `'giao%'` thì có thể (SQLite cần chỉ mục `COLLATE NOCASE` hoặc bật `case_sensitive_like`).",
      sql: { setup: B, query: "PRAGMA case_sensitive_like = ON;\nCREATE INDEX idx_note ON big_orders(note);\nEXPLAIN QUERY PLAN SELECT COUNT(*) FROM big_orders WHERE note LIKE 'giao%';" },
    },
    {
      section: "core",
      title: "ANALYZE và đọc kế hoạch JOIN",
      body: "`ANALYZE` cập nhật thống kê; kế hoạch JOIN cho biết bảng nào quét ngoài, bảng nào tra chỉ mục bên trong.",
      sql: { setup: B, query: "CREATE INDEX idx_c ON big_orders(customer_id);\nANALYZE;\nEXPLAIN QUERY PLAN\nSELECT c.name, COUNT(*) FROM customers c JOIN big_orders b ON b.customer_id = c.id GROUP BY c.id;" },
    },
    {
      section: "apply",
      title: "Bài tập: viết lại cho sargable",
      body: "Đếm đơn có `total` **từ 100.000 trở lên** sao cho dùng được chỉ mục (đã tạo sẵn `idx_total`). Kết quả là một con số.",
      sql: { setup: B + "CREATE INDEX idx_total ON big_orders(total);", query: "SELECT COUNT(*) FROM big_orders WHERE total / 1000 >= 100;", solution: "SELECT COUNT(*) FROM big_orders WHERE total >= 100000;", hints: ["Bỏ phép chia trên cột.", "total >= 100000"] },
    },
  ],
  quiz: [
    { q: "Điều kiện nào sargable?", o: ["date(t) = '2026-06-01'", "t >= '2026-06-01' AND t < '2026-06-02'", "t || '' = 'x'", "abs(total) > 5"], a: 1, why: "Cột trần một vế." },
    { kind: "truefalse", q: "LIKE '%gấp' dùng được chỉ mục B-tree.", a: false, why: "Mẫu bắt đầu bằng % phải quét." },
    { kind: "blank", q: "Xem kế hoạch chạy.", code: "___ QUERY PLAN SELECT …", a: "EXPLAIN", why: "EXPLAIN QUERY PLAN (SQLite), EXPLAIN (PostgreSQL)." },
    { q: "ANALYZE dùng để?", o: ["Xoá chỉ mục", "Thu thập thống kê cho bộ tối ưu", "Kiểm lỗi cú pháp", "Sao lưu"], a: 1, why: "Selinger (1979): tối ưu dựa trên chi phí." },
    { kind: "match", q: "Nối kế hoạch với ý nghĩa.", pairs: [["SCAN", "đọc toàn bảng"], ["SEARCH USING INDEX", "tra chỉ mục"], ["USE TEMP B-TREE", "sắp xếp tạm"]], why: "Đọc EXPLAIN QUERY PLAN." },
  ],
};
