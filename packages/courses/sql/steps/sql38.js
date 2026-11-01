// Step 38 — Phân tích cohort. Mở chặng 8 (tốt nghiệp).
import { HAT_MONTH as M } from "../seed.js";

export default {
  id: "sql38",
  lang: "sql",
  file: "hat/cohort.sql",
  duration: "90 phút",
  summary: "Ghép mọi kỹ thuật của khoá vào một bài phân tích thật: nhóm khách theo tuần mua đầu tiên, đo tỉ lệ quay lại theo tuần, và phân khúc RFM.",
  slides: [
    {
      section: "intro",
      title: "Chặng 8: tốt nghiệp",
      body: "Ba step cuối không dạy cú pháp mới — chúng **ghép** mọi thứ: CTE, window function, JOIN, CASE, ngày giờ. Step này: câu hỏi quan trọng nhất của mọi cửa hàng — **khách có quay lại không?**",
    },
    {
      section: "visual",
      title: "Sơ đồ tư duy: báo cáo quán Hạt",
      visual: "capstone-sql",
      body: "Sáu báo cáo của dự án tốt nghiệp. Step này làm **Cohort** và **Khách (RFM)**; step 40 làm đủ cả sáu.",
    },
    {
      section: "research",
      title: "Phân tích cohort và RFM",
      body: `**Cohort** gom khách theo thời điểm bắt đầu (tuần mua đầu) rồi theo dõi hành vi từng nhóm theo thời gian — tránh nhầm lẫn khi khách mới và khách cũ trộn lẫn.

**RFM** (Recency – Frequency – Monetary) phân khúc khách theo: mua gần đây không, mua thường không, chi bao nhiêu.

> Fader, P.S., Hardie, B.G.S. and Lee, K.L. (2005) 'RFM and CLV: using iso-value curves for customer base analysis', *Journal of Marketing Research*, 42(4), pp. 415–430.`,
    },
    {
      section: "ideate",
      title: "Các bước cohort",
      body: "1. `first`: tuần mua đầu tiên của mỗi khách (MIN).\n2. `activity`: mỗi đơn cách tuần đầu bao nhiêu tuần.\n3. Đếm khách khác nhau theo (cohort, tuần thứ k).\n4. Chia cho cỡ cohort → tỉ lệ quay lại.",
    },
    {
      section: "core",
      title: "Bước 1–2: tuần đầu và tuần thứ k",
      body: "Lần mua đầu của mỗi khách, rồi mỗi đơn cách lần đầu bao nhiêu **tuần** (chia số ngày cho 7, lấy phần nguyên).",
      sql: { setup: M, query: "WITH first AS (\n  SELECT customer_id, MIN(ordered_at) AS f FROM orders WHERE customer_id IS NOT NULL GROUP BY customer_id\n)\nSELECT o.customer_id, date(f.f) AS ngay_dau,\n  CAST((julianday(o.ordered_at) - julianday(f.f)) / 7 AS INTEGER) AS tuan_k\nFROM orders o JOIN first f USING (customer_id)\nLIMIT 12;" },
    },
    {
      section: "core",
      title: "Bảng cohort",
      body: "Cohort = tuần trong tháng của lần mua đầu (`%W` = số tuần trong năm). Mỗi ô: số khách của cohort đó còn mua ở tuần thứ k.",
      sql: { setup: M, query: "WITH first AS (\n  SELECT customer_id, MIN(ordered_at) AS f FROM orders WHERE customer_id IS NOT NULL GROUP BY customer_id\n), act AS (\n  SELECT strftime('%W', f.f) AS cohort, o.customer_id,\n    CAST((julianday(o.ordered_at) - julianday(f.f)) / 7 AS INTEGER) AS k\n  FROM orders o JOIN first f USING (customer_id)\n)\nSELECT cohort,\n  COUNT(DISTINCT CASE WHEN k = 0 THEN customer_id END) AS tuan_0,\n  COUNT(DISTINCT CASE WHEN k = 1 THEN customer_id END) AS tuan_1,\n  COUNT(DISTINCT CASE WHEN k = 2 THEN customer_id END) AS tuan_2,\n  COUNT(DISTINCT CASE WHEN k = 3 THEN customer_id END) AS tuan_3\nFROM act GROUP BY cohort ORDER BY cohort;" },
    },
    {
      section: "core",
      title: "RFM",
      body: "Mỗi khách ba con số, rồi NTILE(3) chia thành nhóm 1 (tốt nhất) → 3.",
      sql: { setup: M, query: "WITH base AS (\n  SELECT o.customer_id,\n    julianday('2026-11-01') - julianday(MAX(o.ordered_at)) AS r,\n    COUNT(DISTINCT o.id) AS f,\n    SUM(oi.qty * m.price) AS mon\n  FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN menu_items m ON m.id = oi.item_id\n  WHERE o.customer_id IS NOT NULL GROUP BY o.customer_id\n)\nSELECT customer_id, ROUND(r, 1) AS r, f, mon,\n  NTILE(3) OVER (ORDER BY r) AS R,\n  NTILE(3) OVER (ORDER BY f DESC) AS F,\n  NTILE(3) OVER (ORDER BY mon DESC) AS M\nFROM base ORDER BY R + F + M;" },
    },
    {
      section: "apply",
      title: "Bài tập: tỉ lệ quay lại",
      body: "Tính **phần trăm khách** (bỏ vãng lai) có **từ 2 đơn trở lên** trong tháng, làm tròn 1 chữ số.",
      sql: { setup: M, query: "", solution: "WITH c AS (SELECT customer_id, COUNT(*) AS n FROM orders WHERE customer_id IS NOT NULL GROUP BY customer_id) SELECT ROUND(100.0 * SUM(n >= 2) / COUNT(*), 1) FROM c;", hints: ["CTE đếm đơn mỗi khách.", "SUM(n >= 2) đếm số khách thoả (TRUE = 1)."] },
    },
  ],
  quiz: [
    { q: "Cohort trong phân tích khách hàng là?", o: ["Một bảng", "Nhóm khách cùng thời điểm bắt đầu", "Một chỉ mục", "Khách vãng lai"], a: 1, why: "Theo dõi từng nhóm theo thời gian." },
    { kind: "match", q: "Nối chữ cái RFM.", pairs: [["R", "mua gần đây"], ["F", "mua thường xuyên"], ["M", "chi bao nhiêu"]], why: "Fader et al. (2005)." },
    { kind: "blank", q: "Nối bằng cột trùng tên.", code: "FROM orders o JOIN first f ___ (customer_id)", a: "USING", why: "USING (cột) thay cho ON a.c = b.c." },
    { kind: "truefalse", q: "SUM(n >= 2) đếm số dòng có n từ 2 trở lên trong SQLite.", a: true, why: "So sánh trả 1 hoặc 0." },
  ],
};
