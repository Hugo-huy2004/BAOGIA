// Step 12 — Hàm gộp. Mở chặng 3; dùng dữ liệu cả tháng 10 (HAT_MONTH).
import { HAT_MONTH } from "../seed.js";

const M = HAT_MONTH;

export default {
  id: "sql12",
  lang: "sql",
  file: "hat/aggregate.sql",
  duration: "60 phút",
  summary: "Biến nhiều dòng thành một con số với COUNT, SUM, AVG, MIN, MAX; phân biệt COUNT(*) và COUNT(cột); đếm có điều kiện.",
  slides: [
    {
      section: "intro",
      title: "Chặng 3: từ dòng thành con số",
      body: `Chủ quán không muốn đọc 120 đơn — họ muốn **một con số**: tổng doanh thu, số đơn, ly trung bình mỗi đơn.

Chặng 3 gồm 6 step: hàm gộp → GROUP BY/HAVING → INNER JOIN → LEFT JOIN và bẫy nhân dòng → truy vấn con → UNION. Từ step này, ô SQL dùng **dữ liệu cả tháng 10**: 12 khách, 120 đơn.`,
    },
    {
      section: "visual",
      title: "Sơ đồ tư duy: chặng 3",
      visual: "group-mindmap",
      body: "Nửa trái là **gom** (hàm gộp, GROUP BY, HAVING), nửa phải là **nối** (JOIN, truy vấn con, UNION). Cuối chặng bạn trả lời được \"món nào bán chạy nhất tháng\".",
    },
    {
      section: "research",
      title: "Hàm gộp trong lý thuyết",
      body: `Codd gốc không có phép gộp; Klug (1982) mở rộng đại số quan hệ thêm phép **gom nhóm và gộp** (γ). SQL có từ bản đầu tiên năm chuẩn hoá 1986.

Một tính chất quan trọng: hàm gộp **bỏ qua NULL** (trừ COUNT(*)). AVG của (10, NULL, 20) là 15, không phải 10.

> Klug, A. (1982) 'Equivalence of relational algebra and relational calculus query languages having aggregate functions', *Journal of the ACM*, 29(3), pp. 699–717.`,
    },
    {
      section: "ideate",
      title: "Năm con số chủ quán cần",
      body: `1. Tháng này có bao nhiêu đơn? → COUNT
2. Bán được bao nhiêu ly? → SUM(qty)
3. Trung bình mỗi dòng đơn mấy ly? → AVG(qty)
4. Đơn đầu tiên và cuối cùng lúc nào? → MIN, MAX
5. Có bao nhiêu khách **khác nhau** đã mua? → COUNT(DISTINCT)`,
    },
    {
      section: "core",
      title: "COUNT(*)",
      body: "Đếm mọi dòng, kể cả dòng có NULL.",
      sql: { setup: M, query: "SELECT COUNT(*) AS so_don FROM orders;" },
    },
    {
      section: "core",
      title: "COUNT(cột) bỏ qua NULL",
      body: "`COUNT(customer_id)` chỉ đếm đơn **có** khách. `COUNT(DISTINCT customer_id)` đếm số khách khác nhau.",
      sql: { setup: M, query: "SELECT COUNT(*) AS tat_ca,\n       COUNT(customer_id) AS co_khach,\n       COUNT(DISTINCT customer_id) AS so_khach\nFROM orders;" },
    },
    {
      section: "core",
      title: "SUM, AVG, MIN, MAX",
      body: "Trên bảng dòng đơn: tổng ly, trung bình, ít nhất, nhiều nhất. `round` cho AVG dễ đọc.",
      sql: { setup: M, query: "SELECT SUM(qty) AS tong_ly,\n       round(AVG(qty), 2) AS tb_ly,\n       MIN(qty) AS it_nhat,\n       MAX(qty) AS nhieu_nhat\nFROM order_items;" },
    },
    {
      section: "core",
      title: "MIN/MAX với chữ và ngày",
      body: "MIN, MAX dùng được cho chữ và ngày giờ ISO — nhờ thứ tự chuỗi trùng thứ tự thời gian (step 5).",
      sql: { setup: M, query: "SELECT MIN(ordered_at) AS don_dau, MAX(ordered_at) AS don_cuoi FROM orders;" },
    },
    {
      section: "core",
      title: "Đếm có điều kiện",
      body: "Gộp + CASE: đếm nhiều điều kiện trong **một** lần quét. SQLite và PostgreSQL còn có cú pháp chuẩn `COUNT(*) FILTER (WHERE …)`.",
      sql: { setup: M, query: "SELECT\n  SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) AS vang_lai,\n  COUNT(*) FILTER (WHERE strftime('%H', ordered_at) < '10') AS buoi_sang\nFROM orders;" },
    },
    {
      section: "core",
      title: "Không trộn cột thường với hàm gộp",
      body: "Câu dưới **cố ý sai** về ý nghĩa: `name` đứng cạnh `MAX(price)` mà không GROUP BY. PostgreSQL báo lỗi; SQLite có ngoại lệ riêng (lấy dòng có MAX) nhưng đừng dựa vào nó — step 13 dạy cách đúng.",
      sql: { query: "SELECT name, MAX(price) FROM menu_items;" },
    },
    {
      section: "apply",
      title: "Bài tập 1: tổng số ly",
      body: "Tính **tổng số ly** đã bán trong tháng (một con số).",
      sql: { setup: M, query: "", solution: "SELECT SUM(qty) FROM order_items;", hints: ["Cột qty trong order_items.", "SELECT SUM(qty) FROM order_items;"] },
    },
    {
      section: "apply",
      title: "Bài tập 2: giá trung bình",
      body: "Tính **giá trung bình** của các món loại `coffee`, làm tròn tới đồng (0 chữ số thập phân).",
      sql: { setup: M, query: "", solution: "SELECT round(AVG(price)) FROM menu_items WHERE category = 'coffee';", hints: ["Lọc WHERE trước, gộp sau.", "round(AVG(price))"] },
    },
    {
      section: "apply",
      title: "Bài tập 3: khách đã mua",
      body: "Đếm số **khách khác nhau** đã có ít nhất một đơn.",
      sql: { setup: M, query: "", solution: "SELECT COUNT(DISTINCT customer_id) FROM orders;", hints: ["COUNT(DISTINCT …) bỏ trùng và bỏ NULL.", "COUNT(DISTINCT customer_id)"] },
    },
  ],
  quiz: [
    { q: "COUNT(*) và COUNT(phone) khác nhau thế nào?", o: ["Như nhau", "COUNT(phone) bỏ qua dòng phone NULL", "COUNT(*) bỏ NULL", "COUNT(phone) đếm ký tự"], a: 1, why: "Hàm gộp trên cột bỏ qua NULL; COUNT(*) đếm mọi dòng." },
    { kind: "output", q: "Kết quả là gì?", code: "-- bảng t(x): 10, NULL, 20\nSELECT AVG(x) FROM t;", o: ["10", "15", "NULL", "30"], a: 1, why: "NULL bị bỏ qua: (10 + 20) / 2." },
    { kind: "blank", q: "Đếm số khách khác nhau.", code: "SELECT COUNT(___ customer_id) FROM orders;", a: "DISTINCT", why: "COUNT(DISTINCT x)." },
    { kind: "truefalse", q: "MIN/MAX dùng được với cột ngày giờ dạng ISO 8601.", a: true, why: "Thứ tự chữ trùng thứ tự thời gian." },
    { kind: "match", q: "Nối câu hỏi với hàm.", pairs: [["Tổng tiền", "SUM"], ["Số đơn", "COUNT"], ["Đơn sớm nhất", "MIN"], ["Ly trung bình", "AVG"]], why: "Năm hàm gộp cơ bản." },
    { q: "Đếm hai điều kiện khác nhau trong một lần quét bảng?", o: ["Hai câu SELECT riêng", "SUM(CASE WHEN … THEN 1 ELSE 0 END) hoặc FILTER", "Không làm được", "Dùng ORDER BY"], a: 1, why: "Gộp có điều kiện." },
  ],
};
