// Step 30 — Window function: ROW_NUMBER, RANK, DENSE_RANK.
import { HAT_MONTH as M } from "../seed.js";

const SALES = `WITH sales AS (
  SELECT m.name, m.category, SUM(oi.qty) AS ly
  FROM order_items oi JOIN menu_items m ON m.id = oi.item_id
  GROUP BY m.id
)
`;

export default {
  id: "sql30",
  lang: "sql",
  file: "hat/ranking.sql",
  duration: "90 phút",
  summary: "Tính toán trên một \"cửa sổ\" các dòng mà không gộp mất dòng: ROW_NUMBER, RANK, DENSE_RANK, PARTITION BY và bài toán top-N mỗi nhóm.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: "GROUP BY gộp dòng **mất** chi tiết. Window function tính trên một nhóm dòng nhưng **giữ nguyên** từng dòng: xếp hạng món trong từng loại, số thứ tự đơn của mỗi khách. Bài toán \"top 2 mỗi loại\" — câu phỏng vấn kinh điển — chỉ cần vài dòng.",
    },
    {
      section: "visual",
      title: "Cửa sổ trượt",
      visual: "window-frame",
      body: "Mỗi dòng nhìn thấy một **khung** các dòng liên quan. Step này dùng khung là cả nhóm (PARTITION); step 32 thu hẹp khung thành vài dòng xung quanh.",
    },
    {
      section: "research",
      title: "Window function trong chuẩn",
      body: `Window function vào chuẩn SQL:2003 (gốc từ đề xuất OLAP của Oracle và IBM năm 1999). SQLite hỗ trợ từ 3.25 (2018). Bộ tối ưu chỉ cần **một lần sắp xếp** theo PARTITION + ORDER BY để tính cả cột — nhanh hơn nhiều so với truy vấn con tương quan.

> Leis, V. et al. (2015) 'Efficient processing of window functions in analytical SQL queries', *Proceedings of the VLDB Endowment*, 8(10), pp. 1058–1069.`,
    },
    {
      section: "ideate",
      title: "Ba cách đánh số khi hoà",
      body: `Ba món cùng bán 20 ly:

| Hàm | Kết quả |
|---|---|
| ROW_NUMBER | 1, 2, 3, 4 (luôn khác nhau) |
| RANK | 1, 1, 1, 4 (nhảy cóc) |
| DENSE_RANK | 1, 1, 1, 2 (liền mạch) |`,
    },
    {
      section: "core",
      title: "OVER (ORDER BY …)",
      body: "Xếp hạng món theo số ly bán ra tháng 10.",
      sql: { setup: M, query: SALES + "SELECT name, ly,\n  ROW_NUMBER() OVER (ORDER BY ly DESC) AS stt,\n  RANK() OVER (ORDER BY ly DESC) AS hang\nFROM sales;" },
    },
    {
      section: "core",
      title: "PARTITION BY: xếp hạng trong nhóm",
      body: "Mỗi loại món đánh số lại từ 1.",
      sql: { setup: M, query: SALES + "SELECT category, name, ly,\n  RANK() OVER (PARTITION BY category ORDER BY ly DESC) AS hang_trong_loai\nFROM sales\nORDER BY category, hang_trong_loai;" },
    },
    {
      section: "core",
      title: "Top-N mỗi nhóm",
      body: "Không lọc window function trực tiếp trong WHERE (nó tính **sau** WHERE) → bọc trong CTE rồi lọc.",
      sql: { setup: M, query: SALES + ", ranked AS (\n  SELECT category, name, ly,\n    ROW_NUMBER() OVER (PARTITION BY category ORDER BY ly DESC) AS rn\n  FROM sales\n)\nSELECT category, name, ly FROM ranked WHERE rn = 1;" },
    },
    {
      section: "core",
      title: "Đơn thứ mấy của khách",
      body: "Đánh số đơn theo thời gian cho từng khách — nền móng của phân tích cohort (step 38).",
      sql: { setup: M, query: "SELECT customer_id, id, ordered_at,\n  ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY ordered_at) AS lan_thu\nFROM orders\nWHERE customer_id IN (1, 2)\nORDER BY customer_id, lan_thu\nLIMIT 12;" },
    },
    {
      section: "core",
      title: "Hàm gộp làm window function",
      body: "`SUM(…) OVER (PARTITION BY …)` đặt tổng của nhóm cạnh từng dòng — tính **tỉ trọng**.",
      sql: { setup: M, query: SALES + "SELECT category, name, ly,\n  ROUND(100.0 * ly / SUM(ly) OVER (PARTITION BY category), 1) AS phan_tram_trong_loai\nFROM sales;" },
    },
    {
      section: "apply",
      title: "Bài tập 1: đơn đầu tiên của mỗi khách",
      body: "Hiện `customer_id` và `id` đơn **đầu tiên** của mỗi khách (bỏ vãng lai).",
      sql: { setup: M, query: "", solution: "WITH r AS (SELECT customer_id, id, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY ordered_at) AS rn FROM orders WHERE customer_id IS NOT NULL) SELECT customer_id, id FROM r WHERE rn = 1;", hints: ["ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY ordered_at)", "Bọc CTE rồi lọc rn = 1."] },
    },
    {
      section: "apply",
      title: "Bài tập 2: hạng dày",
      body: "Hiện `name, price` và `DENSE_RANK` theo giá **giảm dần** (đặt tên `hang`).",
      sql: { query: "", solution: "SELECT name, price, DENSE_RANK() OVER (ORDER BY price DESC) AS hang FROM menu_items;", hints: ["DENSE_RANK() OVER (ORDER BY price DESC)", "Không cần PARTITION."] },
    },
  ],
  quiz: [
    { q: "Window function khác GROUP BY ở chỗ?", o: ["Nhanh hơn", "Giữ nguyên từng dòng", "Không cần ORDER BY", "Chỉ cho số"], a: 1, why: "Tính trên nhóm mà không gộp dòng." },
    { kind: "output", q: "Điểm 20, 20, 15: RANK cho dòng 15 là?", code: "RANK() OVER (ORDER BY diem DESC)", o: ["2", "3", "1", "4"], a: 1, why: "RANK nhảy cóc: 1, 1, 3." },
    { kind: "output", q: "Cùng dữ liệu, DENSE_RANK cho dòng 15?", code: "DENSE_RANK() OVER (ORDER BY diem DESC)", o: ["2", "3", "1", "4"], a: 0, why: "Liền mạch: 1, 1, 2." },
    { kind: "blank", q: "Đánh số lại từ 1 trong mỗi loại.", code: "ROW_NUMBER() OVER (___ BY category ORDER BY ly DESC)", a: "PARTITION", why: "PARTITION BY chia nhóm." },
    { kind: "truefalse", q: "Có thể viết WHERE ROW_NUMBER() OVER (…) = 1 trực tiếp.", a: false, why: "Window function tính sau WHERE — bọc CTE rồi lọc." },
  ],
};
