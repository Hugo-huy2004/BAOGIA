// Step 13 — GROUP BY và HAVING.
import { HAT_MONTH as M } from "../seed.js";

export default {
  id: "sql13",
  lang: "sql",
  file: "hat/group.sql",
  duration: "75 phút",
  summary: "Gom dòng thành nhóm với GROUP BY, lọc nhóm bằng HAVING, và nắm thứ tự xử lý đầy đủ của một câu SELECT.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: "Step 12 cho **một** con số cho cả bảng. Chủ quán hỏi tiếp: số đơn **mỗi ngày**, số ly **mỗi món**. Đó là GROUP BY — một con số cho **mỗi nhóm**. Và HAVING để lọc nhóm: \"chỉ những ngày trên 5 đơn\".",
    },
    {
      section: "visual",
      title: "GROUP BY gộp dòng",
      visual: "group-by",
      body: "Sáu món chia ba nhóm theo loại. Mỗi nhóm thành **một dòng** kết quả; cột trong SELECT chỉ được là cột nhóm hoặc hàm gộp.",
    },
    {
      section: "research",
      title: "Thứ tự xử lý đầy đủ",
      body: `Thứ tự logic của một câu SELECT theo chuẩn SQL:

1. FROM (và JOIN)
2. WHERE — lọc **dòng**
3. GROUP BY — gom
4. HAVING — lọc **nhóm**
5. SELECT — tính cột
6. ORDER BY
7. LIMIT

> Melton, J. and Simon, A.R. (2002) *SQL:1999 Understanding Relational Language Components*. San Francisco: Morgan Kaufmann, ch. 9.`,
    },
    {
      section: "ideate",
      title: "WHERE hay HAVING?",
      body: `- "Đơn buổi sáng, đếm theo ngày" → lọc **dòng** trước khi gom → WHERE.
- "Ngày nào có trên 5 đơn" → lọc trên **kết quả gộp** → HAVING.

Quy tắc: điều kiện có hàm gộp → HAVING; còn lại → WHERE (nhanh hơn vì bớt dòng sớm).`,
    },
    {
      section: "core",
      title: "Đếm món theo loại",
      body: "Mỗi loại một dòng.",
      sql: { query: "SELECT category, COUNT(*) AS so_mon, MIN(price) AS re_nhat\nFROM menu_items\nGROUP BY category;" },
    },
    {
      section: "core",
      title: "Số đơn mỗi ngày",
      body: "Gom theo **biểu thức** `date(ordered_at)`.",
      sql: { setup: M, query: "SELECT date(ordered_at) AS ngay, COUNT(*) AS so_don\nFROM orders\nGROUP BY date(ordered_at)\nORDER BY ngay;" },
    },
    {
      section: "core",
      title: "Gom theo nhiều cột",
      body: "Mỗi **cặp** (món, số ly) một dòng.",
      sql: { setup: M, query: "SELECT item_id, qty, COUNT(*) AS lan\nFROM order_items\nGROUP BY item_id, qty\nORDER BY item_id, qty;" },
    },
    {
      section: "core",
      title: "HAVING lọc nhóm",
      body: "Chỉ giữ ngày có **từ 5 đơn**.",
      sql: { setup: M, query: "SELECT date(ordered_at) AS ngay, COUNT(*) AS so_don\nFROM orders\nGROUP BY ngay\nHAVING COUNT(*) >= 5;" },
    },
    {
      section: "core",
      title: "WHERE + GROUP BY + HAVING",
      body: "Đơn **có khách**, gom theo khách, giữ khách **mua từ 10 đơn**, sắp nhiều nhất trước.",
      sql: { setup: M, query: "SELECT customer_id, COUNT(*) AS so_don\nFROM orders\nWHERE customer_id IS NOT NULL\nGROUP BY customer_id\nHAVING COUNT(*) >= 10\nORDER BY so_don DESC;" },
    },
    {
      section: "apply",
      title: "Bài tập 1: ly theo món",
      body: "Hiện `item_id` và **tổng số ly** đã bán của từng món.",
      sql: { setup: M, query: "", solution: "SELECT item_id, SUM(qty) FROM order_items GROUP BY item_id;", hints: ["GROUP BY item_id.", "SELECT item_id, SUM(qty) … GROUP BY item_id"] },
    },
    {
      section: "apply",
      title: "Bài tập 2: giờ cao điểm",
      body: "Hiện giờ (`strftime('%H', ordered_at)`) và số đơn mỗi giờ, **chỉ giờ có từ 12 đơn**.",
      sql: { setup: M, query: "", solution: "SELECT strftime('%H', ordered_at), COUNT(*) FROM orders GROUP BY strftime('%H', ordered_at) HAVING COUNT(*) >= 12;", hints: ["Gom theo biểu thức giờ.", "HAVING COUNT(*) >= 12"] },
    },
    {
      section: "apply",
      title: "Bài tập 3: đơn vãng lai theo ngày",
      body: "Hiện ngày và số đơn **vãng lai** (customer_id NULL) mỗi ngày.",
      sql: { setup: M, query: "", solution: "SELECT date(ordered_at), COUNT(*) FROM orders WHERE customer_id IS NULL GROUP BY date(ordered_at);", hints: ["Lọc dòng bằng WHERE trước khi gom.", "WHERE customer_id IS NULL GROUP BY date(ordered_at)"] },
    },
  ],
  quiz: [
    { kind: "order", q: "Thứ tự xử lý logic?", items: ["FROM", "WHERE", "GROUP BY", "HAVING", "SELECT", "ORDER BY"], a: [0, 1, 2, 3, 4, 5], why: "Lọc dòng → gom → lọc nhóm → tính cột → sắp." },
    { q: "Điều kiện COUNT(*) > 5 đặt ở đâu?", o: ["WHERE", "HAVING", "SELECT", "ORDER BY"], a: 1, why: "Điều kiện trên hàm gộp thuộc HAVING." },
    { kind: "output", q: "Có mấy dòng? (3 loại món)", code: "SELECT category, COUNT(*) FROM menu_items GROUP BY category;", o: ["1", "3", "6", "0"], a: 1, why: "Một dòng mỗi nhóm." },
    { kind: "truefalse", q: "Lọc bằng WHERE trước GROUP BY thường nhanh hơn lọc tương tự bằng HAVING.", a: true, why: "Bớt dòng trước khi gom." },
    { kind: "bug", q: "Dòng nào sai?", lines: ["SELECT category, COUNT(*)", "FROM menu_items", "WHERE COUNT(*) > 1", "GROUP BY category;"], a: 2, why: "Hàm gộp không được dùng trong WHERE — chuyển sang HAVING." },
    { kind: "blank", q: "Giữ nhóm có tổng trên 10 ly.", code: "GROUP BY item_id ___ SUM(qty) > 10", a: "HAVING", why: "HAVING lọc nhóm." },
  ],
};
