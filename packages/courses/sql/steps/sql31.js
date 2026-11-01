// Step 31 — LAG, LEAD và so sánh theo thời gian.
import { HAT_MONTH as M } from "../seed.js";

const DAILY = `WITH daily AS (
  SELECT date(o.ordered_at) AS ngay, SUM(oi.qty * m.price) AS tien
  FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN menu_items m ON m.id = oi.item_id
  GROUP BY ngay
)
`;

export default {
  id: "sql31",
  lang: "sql",
  file: "hat/lag-lead.sql",
  duration: "75 phút",
  summary: "Nhìn sang dòng trước/sau bằng LAG và LEAD: tăng trưởng so với hôm qua, khoảng cách giữa hai lần mua, FIRST_VALUE và NTILE.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: "Câu hỏi số 5 của chủ quán ở step 1: **\"tháng này so với tháng trước tăng hay giảm\"**. Muốn so một dòng với dòng **trước** nó cần LAG; với dòng **sau** cần LEAD.",
    },
    {
      section: "visual",
      title: "LAG nhìn về trước",
      visual: "window-frame",
      body: "Khung cửa sổ của LAG(x, 1) là đúng **một** dòng ngay trước dòng hiện tại (theo ORDER BY trong OVER).",
    },
    {
      section: "research",
      title: "Phân tích chuỗi thời gian bằng SQL",
      body: `Tăng trưởng ngày-qua-ngày, khoảng cách giữa hai sự kiện, phát hiện bất thường — trước đây phải kéo dữ liệu ra Excel/Python. LAG/LEAD (SQL:2003) cho phép làm ngay trong cơ sở dữ liệu, dữ liệu không rời máy chủ.

> Winand, M. (2025) *Modern SQL: LAG and LEAD*. Available at: https://modern-sql.com/`,
    },
    {
      section: "ideate",
      title: "Ba câu hỏi theo thời gian",
      body: "1. Doanh thu hôm nay so với hôm qua: +/− bao nhiêu %?\n2. Mỗi khách quay lại sau mấy ngày?\n3. Khách thuộc nhóm chi tiêu 25% cao nhất?",
    },
    {
      section: "core",
      title: "LAG: so với hôm qua",
      body: "Ngày đầu không có hôm qua → NULL. `nullif` tránh chia cho 0.",
      sql: { setup: M, query: DAILY + "SELECT ngay, tien,\n  LAG(tien) OVER (ORDER BY ngay) AS hom_qua,\n  ROUND(100.0 * (tien - LAG(tien) OVER (ORDER BY ngay)) / nullif(LAG(tien) OVER (ORDER BY ngay), 0), 1) AS tang_pt\nFROM daily\nLIMIT 10;" },
    },
    {
      section: "core",
      title: "WINDOW: đặt tên cửa sổ",
      body: "Viết `OVER (ORDER BY ngay)` ba lần thì dài. Mệnh đề `WINDOW w AS (…)` đặt tên một lần.",
      sql: { setup: M, query: DAILY + "SELECT ngay, tien, LAG(tien) OVER w AS hom_qua, LEAD(tien) OVER w AS ngay_mai\nFROM daily\nWINDOW w AS (ORDER BY ngay)\nLIMIT 10;" },
    },
    {
      section: "core",
      title: "Khoảng cách giữa hai lần mua",
      body: "LAG theo từng khách (PARTITION) rồi trừ hai mốc bằng julianday.",
      sql: { setup: M, query: "SELECT customer_id, ordered_at,\n  ROUND(julianday(ordered_at) - julianday(LAG(ordered_at) OVER (PARTITION BY customer_id ORDER BY ordered_at)), 1) AS cach_ngay\nFROM orders\nWHERE customer_id = 1;" },
    },
    {
      section: "core",
      title: "FIRST_VALUE và NTILE",
      body: "`FIRST_VALUE` lấy giá trị đầu khung (đơn đầu tiên của khách). `NTILE(4)` chia thành 4 nhóm đều — nhóm 1 là 25% chi tiêu cao nhất.",
      sql: { setup: M, query: "WITH spend AS (\n  SELECT o.customer_id, SUM(oi.qty * m.price) AS tien\n  FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN menu_items m ON m.id = oi.item_id\n  WHERE o.customer_id IS NOT NULL GROUP BY o.customer_id\n)\nSELECT customer_id, tien, NTILE(4) OVER (ORDER BY tien DESC) AS nhom\nFROM spend;" },
    },
    {
      section: "apply",
      title: "Bài tập 1: chênh lệch số đơn",
      body: "CTE `d(ngay, so_don)` đếm đơn mỗi ngày (tháng 10). Hiện `ngay, so_don` và `so_don - LAG(so_don)` đặt tên `chenh`.",
      sql: { setup: M, query: "", solution: "WITH d AS (SELECT date(ordered_at) AS ngay, COUNT(*) AS so_don FROM orders GROUP BY ngay) SELECT ngay, so_don, so_don - LAG(so_don) OVER (ORDER BY ngay) AS chenh FROM d;", hints: ["LAG(so_don) OVER (ORDER BY ngay)", "Ngày đầu chenh là NULL — đúng."] },
    },
    {
      section: "apply",
      title: "Bài tập 2: đơn kế tiếp",
      body: "Với khách 2: hiện `id`, `ordered_at` và **thời điểm đơn kế tiếp** (`LEAD`) đặt tên `don_sau`.",
      sql: { setup: M, query: "", solution: "SELECT id, ordered_at, LEAD(ordered_at) OVER (ORDER BY ordered_at) AS don_sau FROM orders WHERE customer_id = 2;", hints: ["Lọc customer_id = 2 rồi LEAD.", "LEAD(ordered_at) OVER (ORDER BY ordered_at)"] },
    },
  ],
  quiz: [
    { q: "LAG(x) trả gì?", o: ["Giá trị dòng sau", "Giá trị dòng trước", "Giá trị lớn nhất", "Tổng"], a: 1, why: "LEAD là dòng sau." },
    { kind: "truefalse", q: "LAG của dòng đầu tiên là NULL (nếu không cho giá trị mặc định).", a: true, why: "LAG(x, 1, mặc_định) để thay NULL." },
    { kind: "blank", q: "Đặt tên cửa sổ dùng lại.", code: "SELECT LAG(t) OVER w FROM d ___ w AS (ORDER BY ngay);", a: "WINDOW", why: "Mệnh đề WINDOW." },
    { q: "NTILE(4) dùng để?", o: ["Lấy 4 dòng", "Chia thành 4 nhóm đều nhau", "Làm tròn 4 số", "Xếp hạng 4"], a: 1, why: "Phân vị." },
    { q: "Tính khoảng cách ngày giữa hai lần mua của mỗi khách cần?", o: ["GROUP BY", "LAG với PARTITION BY customer_id", "UNION", "DISTINCT"], a: 1, why: "LAG trong từng khách." },
  ],
};
