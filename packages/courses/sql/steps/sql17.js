// Step 17 — UNION, INTERSECT, EXCEPT. Kết chặng 3.
import { HAT_MONTH as M } from "../seed.js";

export default {
  id: "sql17",
  lang: "sql",
  file: "hat/sets.sql",
  duration: "60 phút",
  summary: "Ghép, giao và trừ kết quả của hai truy vấn bằng các phép tập hợp; phân biệt UNION và UNION ALL.",
  slides: [
    {
      section: "intro",
      title: "Step này dạy gì",
      body: "JOIN ghép **ngang** (thêm cột). Phép tập hợp ghép **dọc** (thêm dòng): danh sách khách mua sáng **và** chiều, khách mua sáng **nhưng không** chiều.",
    },
    {
      section: "visual",
      title: "Sơ đồ Venn",
      visual: "join-types",
      body: "Hình tròn giờ là hai **kết quả truy vấn**. UNION = phần tô của FULL, INTERSECT = phần giữa, EXCEPT = phần trái trừ phần giữa.",
    },
    {
      section: "research",
      title: "Lý thuyết tập hợp",
      body: `Hợp, giao, hiệu là ba phép của lý thuyết tập hợp Cantor, được Codd đưa thẳng vào đại số quan hệ. Điều kiện: hai quan hệ phải **tương thích** — cùng số cột, kiểu tương ứng.

> Codd, E.F. (1970) 'A relational model of data for large shared data banks', *Communications of the ACM*, 13(6), pp. 377–387.`,
    },
    {
      section: "ideate",
      title: "Khách sáng và khách chiều",
      body: "Hai truy vấn: khách có đơn trước 12h, khách có đơn từ 12h. Câu hỏi \"khách đến cả hai buổi\" = **giao**; \"chỉ đến buổi sáng\" = **hiệu**.",
    },
    {
      section: "core",
      title: "UNION bỏ trùng",
      body: "Gộp hai danh sách, mỗi giá trị một lần.",
      sql: { setup: M, query: "SELECT customer_id FROM orders WHERE strftime('%H', ordered_at) < '12' AND customer_id IS NOT NULL\nUNION\nSELECT customer_id FROM orders WHERE strftime('%H', ordered_at) >= '12' AND customer_id IS NOT NULL;" },
    },
    {
      section: "core",
      title: "UNION ALL giữ trùng — nhanh hơn",
      body: "Không bỏ trùng nên không phải sắp xếp/băm. Dùng UNION ALL khi biết chắc không trùng hoặc cần đếm.",
      sql: { query: "SELECT name, 'món' AS loai FROM menu_items\nUNION ALL\nSELECT name, 'khách' FROM customers;" },
    },
    {
      section: "core",
      title: "INTERSECT",
      body: "Khách đến **cả** sáng lẫn chiều.",
      sql: { setup: M, query: "SELECT customer_id FROM orders WHERE strftime('%H', ordered_at) < '12'\nINTERSECT\nSELECT customer_id FROM orders WHERE strftime('%H', ordered_at) >= '12';" },
    },
    {
      section: "core",
      title: "EXCEPT",
      body: "Món có trong thực đơn **trừ** món đã bán.",
      sql: { query: "INSERT INTO menu_items VALUES (7, 'Sữa chua', 'food', 30000);\nSELECT id FROM menu_items\nEXCEPT\nSELECT item_id FROM order_items;" },
    },
    {
      section: "core",
      title: "ORDER BY đặt cuối cùng",
      body: "Một câu tập hợp chỉ có **một** ORDER BY ở cuối, áp cho cả kết quả.",
      sql: { query: "SELECT name FROM menu_items\nUNION\nSELECT name FROM customers\nORDER BY name;" },
    },
    {
      section: "apply",
      title: "Bài tập 1: danh bạ chung",
      body: "Một cột gồm **tên món và tên khách**, không trùng.",
      sql: { query: "", solution: "SELECT name FROM menu_items UNION SELECT name FROM customers;", hints: ["UNION bỏ trùng.", "Hai SELECT cùng 1 cột name."] },
    },
    {
      section: "apply",
      title: "Bài tập 2: chỉ đến buổi chiều",
      body: "Với dữ liệu mẫu ban đầu: `customer_id` của khách **chỉ** có đơn từ 12h trở đi, không có đơn buổi sáng.",
      sql: { query: "", solution: "SELECT customer_id FROM orders WHERE strftime('%H', ordered_at) >= '12' EXCEPT SELECT customer_id FROM orders WHERE strftime('%H', ordered_at) < '12';", hints: ["Chiều EXCEPT sáng.", "Hai vế cùng chọn customer_id."] },
    },
    {
      section: "apply",
      title: "Tổng kết chặng 3",
      body: "Bạn đã trả lời được \"món nào bán chạy\", \"khách nào trung thành\", \"giờ nào đông\" bằng GROUP BY, JOIN, truy vấn con và phép tập hợp. Chặng 4: tự **thiết kế** cơ sở dữ liệu — vì truy vấn đẹp đến đâu cũng không cứu được lược đồ sai.",
    },
  ],
  quiz: [
    { q: "UNION và UNION ALL khác nhau?", o: ["Như nhau", "UNION bỏ trùng, UNION ALL giữ", "UNION ALL bỏ trùng", "UNION chỉ cho số"], a: 1, why: "UNION ALL nhanh hơn vì không bỏ trùng." },
    { kind: "truefalse", q: "Hai vế của UNION phải cùng số cột.", a: true, why: "Quan hệ tương thích." },
    { kind: "match", q: "Nối phép với ý nghĩa.", pairs: [["UNION", "hợp"], ["INTERSECT", "giao"], ["EXCEPT", "hiệu"]], why: "Ba phép tập hợp." },
    { q: "ORDER BY trong câu UNION đặt ở đâu?", o: ["Mỗi vế một cái", "Một lần ở cuối", "Không dùng được", "Đầu câu"], a: 1, why: "Áp cho cả kết quả." },
    { kind: "blank", q: "Món có trong thực đơn nhưng chưa bán.", code: "SELECT id FROM menu_items ___ SELECT item_id FROM order_items;", a: "EXCEPT", why: "Hiệu tập hợp." },
  ],
};
