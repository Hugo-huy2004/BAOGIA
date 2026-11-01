// Step 32 — Tổng luỹ kế, trung bình trượt và khung cửa sổ. Kết chặng 6.
import { HAT_MONTH as M } from "../seed.js";

const DAILY = `WITH daily AS (
  SELECT date(o.ordered_at) AS ngay, SUM(oi.qty * m.price) AS tien
  FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN menu_items m ON m.id = oi.item_id
  GROUP BY ngay
)
`;

export default {
  id: "sql32",
  lang: "sql",
  file: "hat/running.sql",
  duration: "90 phút",
  summary: "Điều khiển khung cửa sổ với ROWS/RANGE BETWEEN: tổng luỹ kế, trung bình trượt 7 ngày, và dựng bảng điều khiển doanh thu hoàn chỉnh.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: "Doanh thu ngày lên xuống thất thường. Chủ quán cần **xu hướng**: tổng từ đầu tháng (luỹ kế) và trung bình 7 ngày gần nhất (trượt). Cả hai là window function với **khung** tuỳ chỉnh.",
    },
    {
      section: "visual",
      title: "Khung cửa sổ",
      visual: "window-frame",
      body: "`ROWS BETWEEN 2 PRECEDING AND CURRENT ROW`: dòng hiện tại và 2 dòng trước. Đổi số là đổi độ rộng khung.",
    },
    {
      section: "research",
      title: "Trung bình trượt",
      body: `Trung bình trượt làm mượt nhiễu ngắn hạn để thấy xu hướng — kỹ thuật cơ bản của phân tích chuỗi thời gian. Chọn 7 ngày vì bán lẻ có **chu kỳ tuần** rõ rệt: so trung bình 7 ngày loại được ảnh hưởng cuối tuần.

> Hyndman, R.J. and Athanasopoulos, G. (2021) *Forecasting: Principles and Practice*. 3rd edn. OTexts, ch. 3. Available at: https://otexts.com/fpp3/ (CC BY-NC-ND — chỉ trích dẫn).`,
    },
    {
      section: "ideate",
      title: "Bảng điều khiển doanh thu",
      body: "Mỗi ngày một dòng: doanh thu, luỹ kế tháng, trung bình 7 ngày, hạng trong tháng, % so hôm qua. Một câu SQL — không Excel.",
    },
    {
      section: "core",
      title: "Tổng luỹ kế",
      body: "`SUM … OVER (ORDER BY ngay)` mặc định khung là **từ đầu tới dòng hiện tại**.",
      sql: { setup: M, query: DAILY + "SELECT ngay, tien,\n  SUM(tien) OVER (ORDER BY ngay) AS luy_ke\nFROM daily\nLIMIT 10;" },
    },
    {
      section: "core",
      title: "Trung bình trượt 7 ngày",
      body: "Khung tường minh: 6 dòng trước + dòng hiện tại.",
      sql: { setup: M, query: DAILY + "SELECT ngay, tien,\n  ROUND(AVG(tien) OVER (ORDER BY ngay ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)) AS tb7\nFROM daily;" },
    },
    {
      section: "core",
      title: "ROWS hay RANGE",
      body: `- **ROWS**: đếm theo **số dòng** vật lý.
- **RANGE**: theo **giá trị** của ORDER BY — các dòng hoà nhau tính cùng lúc.

Mặc định khi có ORDER BY là \`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\`: hai ngày trùng giá trị sẽ có cùng luỹ kế. Muốn đếm từng dòng, ghi rõ \`ROWS\`.`,
      sql: { query: "WITH t(x) AS (VALUES (1), (2), (2), (3))\nSELECT x,\n  SUM(x) OVER (ORDER BY x) AS range_mac_dinh,\n  SUM(x) OVER (ORDER BY x ROWS UNBOUNDED PRECEDING) AS rows\nFROM t;" },
    },
    {
      section: "core",
      title: "Bảng điều khiển hoàn chỉnh",
      body: "Ghép mọi thứ của chặng 6 thành một câu.",
      sql: { setup: M, query: DAILY + "SELECT ngay, tien,\n  SUM(tien) OVER w_all AS luy_ke,\n  ROUND(AVG(tien) OVER (ORDER BY ngay ROWS 6 PRECEDING)) AS tb7,\n  RANK() OVER (ORDER BY tien DESC) AS hang,\n  ROUND(100.0 * (tien - LAG(tien) OVER w_all) / nullif(LAG(tien) OVER w_all, 0), 1) AS so_hom_qua\nFROM daily\nWINDOW w_all AS (ORDER BY ngay)\nORDER BY ngay;" },
    },
    {
      section: "apply",
      title: "Bài tập 1: luỹ kế số đơn",
      body: "CTE `d(ngay, so_don)`; hiện `ngay, so_don` và **luỹ kế số đơn** `luy_ke`.",
      sql: { setup: M, query: "", solution: "WITH d AS (SELECT date(ordered_at) AS ngay, COUNT(*) AS so_don FROM orders GROUP BY ngay) SELECT ngay, so_don, SUM(so_don) OVER (ORDER BY ngay) AS luy_ke FROM d;", hints: ["SUM(so_don) OVER (ORDER BY ngay)", "Ngày là duy nhất nên RANGE và ROWS cho cùng kết quả."] },
    },
    {
      section: "apply",
      title: "Bài tập 2: trung bình 3 ngày",
      body: "Với cùng CTE `d`, hiện `ngay` và trung bình số đơn **3 ngày** (2 ngày trước + hôm nay), làm tròn 1 chữ số, tên `tb3`.",
      sql: { setup: M, query: "", solution: "WITH d AS (SELECT date(ordered_at) AS ngay, COUNT(*) AS so_don FROM orders GROUP BY ngay) SELECT ngay, ROUND(AVG(so_don) OVER (ORDER BY ngay ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 1) AS tb3 FROM d;", hints: ["ROWS BETWEEN 2 PRECEDING AND CURRENT ROW", "ROUND(…, 1)"] },
    },
    {
      section: "apply",
      title: "Tổng kết chặng 6",
      body: "CTE, CTE đệ quy, ROW_NUMBER/RANK/DENSE_RANK, LAG/LEAD, NTILE, luỹ kế, trung bình trượt, ROWS/RANGE — bộ công cụ phân tích của mọi Data Analyst. Chặng 7: làm cho chúng **nhanh** trên hàng triệu dòng.",
    },
  ],
  quiz: [
    { q: "Khung mặc định khi có ORDER BY trong OVER?", o: ["Cả nhóm", "Từ đầu tới dòng hiện tại (RANGE)", "Một dòng", "Không có khung"], a: 1, why: "RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW." },
    { kind: "blank", q: "Trung bình 7 ngày.", code: "AVG(tien) OVER (ORDER BY ngay ROWS BETWEEN ___ PRECEDING AND CURRENT ROW)", a: "6", why: "6 ngày trước + hôm nay = 7." },
    { kind: "output", q: "x = 1, 2, 2, 3. SUM(x) OVER (ORDER BY x) ở dòng 2 đầu tiên là?", code: "-- khung RANGE mặc định", o: ["3", "5", "1", "8"], a: 1, why: "RANGE gộp hai số 2 cùng lúc: 1 + 2 + 2." },
    { kind: "truefalse", q: "ROWS đếm theo số dòng, RANGE theo giá trị ORDER BY.", a: true, why: "Khác nhau khi có giá trị hoà." },
    { q: "Vì sao trung bình trượt 7 ngày hợp với quán cà phê?", o: ["Ngẫu nhiên", "Loại chu kỳ tuần (cuối tuần đông)", "SQL bắt buộc", "Dễ tính"], a: 1, why: "Hyndman & Athanasopoulos (2021)." },
  ],
};
