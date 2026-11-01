// Step 40 — Dự án tốt nghiệp: 10 truy vấn báo cáo cho quán Hạt. Mọi bài tự chấm trên dữ liệu tháng 10.
import { HAT_MONTH as M } from "../seed.js";

const REV = "SUM(oi.qty * m.price)";
const J = "FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN menu_items m ON m.id = oi.item_id";

const task = (title, body, solution, hints, ordered = false) => ({
  section: "apply",
  title,
  body,
  sql: { setup: M, query: "", solution, hints, ordered },
});

export default {
  id: "sql40",
  lang: "sql",
  file: "hat/capstone.sql",
  duration: "180 phút",
  summary: "Dự án tốt nghiệp: viết 10 truy vấn báo cáo thật cho quán Hạt trên dữ liệu tháng 10 — doanh thu, món, khách, giờ cao điểm, xu hướng — mỗi bài tự chấm.",
  slides: [
    {
      section: "intro",
      title: "Dự án tốt nghiệp",
      body: `Chủ quán Hạt giao cho bạn **10 câu hỏi**. Mỗi câu là một ô SQL tự chấm trên dữ liệu tháng 10 (12 khách, 120 đơn). Không có ví dụ mẫu — chỉ có gợi ý khi bạn sai.

Quy ước chung: **doanh thu** = \`SUM(qty * price)\`; đơn vãng lai có \`customer_id\` NULL.`,
    },
    {
      section: "visual",
      title: "Sáu mảng báo cáo",
      visual: "capstone-sql",
      body: "Mười câu hỏi phủ sáu mảng: doanh thu, món, khách, cohort, giờ cao điểm, xu hướng.",
    },
    {
      section: "research",
      title: "Báo cáo phải truy ngược được",
      body: `Nguyên tắc của kiểm toán dữ liệu: mỗi con số trong báo cáo phải **truy ngược** được về dữ liệu gốc bằng một truy vấn rõ ràng. Vì vậy hãy viết CTE có tên dễ hiểu và chú thích \`--\` cho từng bước.

> Kimball, R. and Ross, M. (2013) *The Data Warehouse Toolkit*. 3rd edn. Indianapolis: Wiley, ch. 1.`,
    },
    task("1. Doanh thu tháng", "Tổng doanh thu cả tháng 10 (một con số).", `SELECT ${REV} ${J};`, ["JOIN order_items với menu_items.", "SUM(oi.qty * m.price)"]),
    task("2. Doanh thu theo ngày", "`ngay` và doanh thu mỗi ngày, sắp theo ngày tăng dần.", `SELECT date(o.ordered_at) AS ngay, ${REV} ${J} GROUP BY ngay ORDER BY ngay;`, ["GROUP BY date(o.ordered_at).", "ORDER BY ngay"], true),
    task("3. Top 3 món theo doanh thu", "Tên món và doanh thu của **3 món** cao nhất, cao nhất trước.", `SELECT m.name, ${REV} AS dt ${J} GROUP BY m.id ORDER BY dt DESC LIMIT 3;`, ["GROUP BY m.id, ORDER BY doanh thu DESC.", "LIMIT 3"], true),
    task("4. Giá trị đơn trung bình", "Giá trị trung bình **mỗi đơn**, làm tròn tới đồng.", `SELECT ROUND(AVG(t)) FROM (SELECT ${REV} AS t ${J} GROUP BY o.id);`, ["Tính tiền mỗi đơn trước (truy vấn con/CTE).", "Rồi AVG và ROUND."]),
    task("5. Giờ cao điểm", "Giờ (`strftime('%H', …)`) có **nhiều đơn nhất** và số đơn của giờ đó.", "SELECT strftime('%H', ordered_at) AS gio, COUNT(*) AS n FROM orders GROUP BY gio ORDER BY n DESC LIMIT 1;", ["Gom theo giờ, đếm.", "ORDER BY n DESC LIMIT 1"]),
    task("6. Khách chi nhiều nhất", "Tên khách và tổng chi của **2 khách** chi nhiều nhất.", `SELECT c.name, ${REV} AS chi ${J} JOIN customers c ON c.id = o.customer_id GROUP BY c.id ORDER BY chi DESC LIMIT 2;`, ["JOIN thêm customers.", "ORDER BY chi DESC LIMIT 2"], true),
    task("7. Tỉ trọng loại món", "Mỗi `category` và **% doanh thu** của nó trên tổng, làm tròn 1 chữ số.", `SELECT m.category, ROUND(100.0 * ${REV} / SUM(${REV}) OVER (), 1) ${J} GROUP BY m.category;`, ["Window function trên kết quả gộp: SUM(SUM(…)) OVER ().", "100.0 * … / SUM(…) OVER ()"]),
    task("8. Món bán chạy nhất mỗi loại", "Mỗi `category` một dòng: tên món có **nhiều ly** nhất trong loại.", "WITH s AS (SELECT m.category, m.name, SUM(oi.qty) AS ly, ROW_NUMBER() OVER (PARTITION BY m.category ORDER BY SUM(oi.qty) DESC, m.id) AS rn FROM order_items oi JOIN menu_items m ON m.id = oi.item_id GROUP BY m.id) SELECT category, name FROM s WHERE rn = 1;", ["ROW_NUMBER() OVER (PARTITION BY category ORDER BY SUM(qty) DESC)", "Bọc CTE rồi lọc rn = 1."]),
    task("9. Tăng trưởng tuần", "Mỗi tuần (`strftime('%W', …)`) và doanh thu, kèm **chênh lệch so với tuần trước** (tên `chenh`).", `WITH w AS (SELECT strftime('%W', o.ordered_at) AS tuan, ${REV} AS dt ${J} GROUP BY tuan) SELECT tuan, dt, dt - LAG(dt) OVER (ORDER BY tuan) AS chenh FROM w;`, ["CTE doanh thu theo tuần.", "dt - LAG(dt) OVER (ORDER BY tuan)"]),
    task("10. Trung bình trượt 7 ngày", "`ngay` và trung bình doanh thu **7 ngày** gần nhất (tính cả hôm đó), làm tròn tới đồng.", `WITH d AS (SELECT date(o.ordered_at) AS ngay, ${REV} AS dt ${J} GROUP BY ngay) SELECT ngay, ROUND(AVG(dt) OVER (ORDER BY ngay ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)) FROM d;`, ["CTE doanh thu ngày.", "ROWS BETWEEN 6 PRECEDING AND CURRENT ROW"]),
    {
      section: "apply",
      title: "Chúc mừng tốt nghiệp",
      body: `Bạn đã đi từ một cuốn sổ ghi tay tới báo cáo dùng CTE, window function, chỉ mục và tìm kiếm toàn văn — đúng lộ trình mà một Data Analyst hay Backend Developer cần.

**Tiếp theo:**
- Luyện trên PostgreSQL miễn phí (Supabase, Neon).
- Đọc *Use The Index, Luke* (Winand) để đi sâu hiệu năng.
- Mở khoá **Lập trình Web** để nối SQL vào một ứng dụng thật.

Education Hugo luôn đồng hành cùng bạn trong mọi bài tiếp theo.`,
    },
  ],
  quiz: [
    { q: "Doanh thu một đơn tính bằng?", o: ["COUNT(*)", "SUM(qty * price) theo đơn", "AVG(price)", "MAX(qty)"], a: 1, why: "Quy ước của dự án." },
    { q: "Top món mỗi loại dùng?", o: ["GROUP BY + LIMIT", "ROW_NUMBER() OVER (PARTITION BY category …) rồi lọc rn = 1", "DISTINCT", "UNION"], a: 1, why: "Top-N mỗi nhóm (step 30)." },
    { q: "So với tuần trước dùng?", o: ["LEAD", "LAG", "NTILE", "RANK"], a: 1, why: "Dòng trước." },
    { kind: "truefalse", q: "SUM(SUM(x)) OVER () tính tổng của mọi nhóm sau GROUP BY.", a: true, why: "Window function chạy sau GROUP BY." },
    { kind: "multi", q: "Kỹ thuật nào giúp báo cáo truy ngược được?", o: ["CTE đặt tên rõ", "Chú thích --", "Một câu dài không xuống dòng", "Tách bước kiểm thử được"], a: [0, 1, 3], why: "Kimball & Ross (2013)." },
  ],
};
