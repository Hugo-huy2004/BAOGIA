// Tám chặng của khoá SQL. Mã chặng mang tiền tố `sql-` để không đụng mã chặng
// khoá Coding (giá, cờ sở hữu, thưởng mốc đều tra theo mã).
//
// Cả khoá xoay quanh MỘT cơ sở dữ liệu: "Hạt", quán cà phê có thực đơn, khách,
// đơn hàng và chi nhánh — từ một bảng thực đơn tới hệ thống báo cáo dùng truy
// vấn nâng cao (window function, CTE đệ quy, kế hoạch truy vấn, JSON, FTS5).
//
// Bản quyền: lời giảng, ví dụ, sơ đồ do Hugo Studio tự viết; SQLite và tài liệu
// của nó thuộc phạm vi công cộng; ảnh thật lấy từ Wikimedia Commons có giấy
// phép CC ghi rõ ở từng slide. Chi tiết: ./LICENSE.md.
const SQLITE = { title: "SQLite Documentation", author: "SQLite (public domain)", url: "https://sqlite.org/docs.html" };

const STAGE_DEFS = [
  {
    id: "sql-basic", tone: "blue", phaseNumber: 1, code: "SQL 101",
    title: "SQL 101 · Dữ liệu, bảng và câu SELECT đầu tiên",
    intro: {
      tagline: "Từ sổ ghi chép của quán tới bảng dữ liệu đầu tiên.",
      learn: ["Dữ liệu, cơ sở dữ liệu và hệ quản trị", "Mô hình quan hệ của Codd: bảng, hàng, cột", "SQLite chạy ngay trong trình duyệt", "SELECT, FROM và đọc kết quả"],
      challenge: "Chưa có máy chủ nào: mọi câu SQL chạy bằng SQLite ngay trên máy bạn.",
      promise: "Kết chặng: bảng thực đơn của quán Hạt và câu truy vấn đầu tiên.",
      reading: [SQLITE, { title: "A Relational Model of Data for Large Shared Data Banks", author: "Codd, E.F. (1970)", url: "https://doi.org/10.1145/362384.362685" }],
    },
  },
  {
    id: "sql-filter", tone: "green", phaseNumber: 2, code: "SQL 102",
    title: "SQL 102 · Lọc, sắp xếp và biểu thức",
    intro: {
      tagline: "Hỏi đúng câu hỏi: món nào, giá bao nhiêu, bán khi nào.",
      learn: ["WHERE, AND/OR/NOT, IN, BETWEEN, LIKE", "NULL và logic ba giá trị", "ORDER BY, LIMIT, OFFSET", "Biểu thức, CASE, hàm chuỗi và ngày giờ"],
      challenge: "NULL không bằng cả chính nó — mọi điều kiện phải tính tới ô trống.",
      promise: "Kết chặng: trang thực đơn lọc theo giá, loại và từ khoá.",
      reading: [{ title: "SQL As Understood By SQLite: SELECT", author: "SQLite (public domain)", url: "https://sqlite.org/lang_select.html" }],
    },
  },
  {
    id: "sql-group", tone: "purple", phaseNumber: 3, code: "SQL 201",
    title: "SQL 201 · Gom nhóm và nhiều bảng",
    intro: {
      tagline: "Từ từng đơn hàng tới doanh thu từng ngày, từng món.",
      learn: ["COUNT, SUM, AVG, MIN, MAX", "GROUP BY và HAVING", "INNER, LEFT JOIN, tự nối bảng", "Truy vấn con, EXISTS, UNION"],
      challenge: "JOIN sai một điều kiện là doanh thu nhân đôi mà không ai báo lỗi.",
      promise: "Kết chặng: báo cáo doanh thu theo món và theo ngày.",
      reading: [{ title: "Use The Index, Luke — The Join Operation", author: "Winand, M.", url: "https://use-the-index-luke.com/sql/join" }],
    },
  },
  {
    id: "sql-design", tone: "pink", phaseNumber: 4, code: "SQL 202",
    title: "SQL 202 · Thiết kế cơ sở dữ liệu",
    intro: {
      tagline: "Vẽ lược đồ cho cả quán trước khi viết dòng CREATE đầu tiên.",
      learn: ["Sơ đồ thực thể – quan hệ (ERD)", "Khoá chính, khoá ngoại, ràng buộc", "Chuẩn hoá 1NF, 2NF, 3NF", "Kiểu dữ liệu và quy ước đặt tên"],
      challenge: "Một sự thật chỉ được lưu ở MỘT chỗ.",
      promise: "Kết chặng: lược đồ đầy đủ của quán Hạt, đạt 3NF.",
      reading: [{ title: "Further Normalization of the Data Base Relational Model", author: "Codd, E.F. (1971)", url: "https://en.wikipedia.org/wiki/Third_normal_form" }, { title: "CREATE TABLE", author: "SQLite (public domain)", url: "https://sqlite.org/lang_createtable.html" }],
    },
  },
  {
    id: "sql-write", tone: "orange", phaseNumber: 5, code: "SQL 301",
    title: "SQL 301 · Ghi dữ liệu an toàn",
    intro: {
      tagline: "Thêm, sửa, xoá mà không bao giờ mất một đơn hàng.",
      learn: ["INSERT, UPDATE, DELETE, UPSERT", "Giao dịch và tính chất ACID", "View, trigger và cột sinh tự động", "SQL Injection và câu lệnh tham số hoá"],
      challenge: "Hai thu ngân bấm cùng lúc — tồn kho vẫn phải đúng.",
      promise: "Kết chặng: quy trình đặt món trọn vẹn trong một giao dịch.",
      reading: [{ title: "Transaction", author: "SQLite (public domain)", url: "https://sqlite.org/lang_transaction.html" }, { title: "SQL Injection Prevention Cheat Sheet", author: "OWASP (CC BY-SA 4.0)", url: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html" }],
    },
  },
  {
    id: "sql-window", tone: "teal", phaseNumber: 6, code: "SQL 302",
    title: "SQL 302 · Truy vấn nâng cao: CTE và window function",
    intro: {
      tagline: "Xếp hạng, cộng dồn, so với hôm qua — trong một câu SQL.",
      learn: ["CTE với WITH, CTE đệ quy", "ROW_NUMBER, RANK, DENSE_RANK", "LAG, LEAD, tổng luỹ kế, trung bình trượt", "Khung cửa sổ ROWS / RANGE"],
      challenge: "Không vòng lặp, không mã ứng dụng: mọi phép tính nằm trong truy vấn.",
      promise: "Kết chặng: bảng điều khiển doanh thu có xếp hạng và xu hướng.",
      reading: [{ title: "Window Functions", author: "SQLite (public domain)", url: "https://sqlite.org/windowfunctions.html" }, { title: "The WITH Clause", author: "SQLite (public domain)", url: "https://sqlite.org/lang_with.html" }],
    },
  },
  {
    id: "sql-perf", tone: "yellow", phaseNumber: 7, code: "SQL 401",
    title: "SQL 401 · Hiệu năng và tính năng chuyên sâu",
    intro: {
      tagline: "Đọc kế hoạch truy vấn như đọc bản đồ.",
      learn: ["Chỉ mục B-tree, chỉ mục phủ, chỉ mục một phần", "EXPLAIN QUERY PLAN và tối ưu", "JSON trong SQL", "Tìm kiếm toàn văn FTS5"],
      challenge: "Câu truy vấn chạy 2 giây trên 1 triệu dòng phải xuống dưới 20 ms.",
      promise: "Kết chặng: tìm món bằng từ khoá tiếng Việt, tức thì.",
      reading: [{ title: "Query Planning", author: "SQLite (public domain)", url: "https://sqlite.org/queryplanner.html" }, { title: "FTS5", author: "SQLite (public domain)", url: "https://sqlite.org/fts5.html" }],
    },
  },
  {
    id: "sql-capstone", tone: "red", phaseNumber: 8, code: "SQL 402",
    title: "SQL 402 · Dự án tốt nghiệp",
    intro: {
      tagline: "Một hệ thống báo cáo thật, viết bằng SQL thuần.",
      learn: ["Phân tích cohort và giữ chân khách", "Báo cáo nhiều chiều", "Chuyển SQL sang PostgreSQL/MySQL", "Tổng kết và lộ trình tiếp theo"],
      challenge: "Mỗi con số trong báo cáo phải truy ngược được về dữ liệu gốc.",
      promise: "Kết chặng: 10 câu truy vấn báo cáo cho quán Hạt, chấm tự động.",
      reading: [SQLITE, { title: "PostgreSQL Documentation", author: "PostgreSQL Global Development Group", url: "https://www.postgresql.org/docs/current/" }],
    },
    elite: true,
  },
];

/** Đề cương 40 step. Step đã soạn có tệp trong ./steps/ cùng id. */
export const OUTLINE = [
  // Chặng 1 — Dữ liệu, bảng và SELECT
  ["sql-basic", "Dữ liệu ở quanh ta: từ sổ ghi chép tới cơ sở dữ liệu"],
  ["sql-basic", "Mô hình quan hệ: bảng, hàng, cột và khoá"],
  ["sql-basic", "SQLite trong trình duyệt: chạy câu SQL đầu tiên"],
  ["sql-basic", "SELECT và FROM: chọn cột, đặt bí danh, bỏ trùng"],
  ["sql-basic", "Kiểu dữ liệu: số, chữ, ngày giờ và NULL"],
  // Chặng 2 — Lọc, sắp xếp, biểu thức
  ["sql-filter", "WHERE và toán tử so sánh"],
  ["sql-filter", "AND, OR, NOT, IN, BETWEEN"],
  ["sql-filter", "LIKE, GLOB và tìm kiếm chuỗi"],
  ["sql-filter", "NULL và logic ba giá trị"],
  ["sql-filter", "ORDER BY, LIMIT, OFFSET và phân trang"],
  ["sql-filter", "Biểu thức, CASE, hàm chuỗi và ngày giờ"],
  // Chặng 3 — Gom nhóm và nhiều bảng
  ["sql-group", "Hàm gộp: COUNT, SUM, AVG, MIN, MAX"],
  ["sql-group", "GROUP BY và HAVING"],
  ["sql-group", "INNER JOIN: nối đơn hàng với thực đơn"],
  ["sql-group", "LEFT JOIN, tự nối bảng và bẫy nhân dòng"],
  ["sql-group", "Truy vấn con, IN, EXISTS"],
  ["sql-group", "UNION, INTERSECT, EXCEPT"],
  // Chặng 4 — Thiết kế
  ["sql-design", "Sơ đồ thực thể – quan hệ (ERD)"],
  ["sql-design", "CREATE TABLE, khoá chính và khoá ngoại"],
  ["sql-design", "Ràng buộc: NOT NULL, UNIQUE, CHECK, DEFAULT"],
  ["sql-design", "Chuẩn hoá: 1NF, 2NF, 3NF"],
  ["sql-design", "Quan hệ nhiều – nhiều và bảng nối"],
  // Chặng 5 — Ghi dữ liệu
  ["sql-write", "INSERT, UPDATE, DELETE"],
  ["sql-write", "UPSERT và RETURNING"],
  ["sql-write", "Giao dịch và ACID"],
  ["sql-write", "View, trigger và cột sinh tự động"],
  ["sql-write", "SQL Injection và truy vấn tham số hoá"],
  // Chặng 6 — CTE và window function
  ["sql-window", "CTE: đặt tên cho từng bước truy vấn"],
  ["sql-window", "CTE đệ quy: cây danh mục và chuỗi ngày"],
  ["sql-window", "Window function: ROW_NUMBER, RANK, DENSE_RANK"],
  ["sql-window", "LAG, LEAD và so sánh theo thời gian"],
  ["sql-window", "Tổng luỹ kế, trung bình trượt và khung cửa sổ"],
  // Chặng 7 — Hiệu năng và tính năng chuyên sâu
  ["sql-perf", "Chỉ mục B-tree: vì sao tìm nhanh"],
  ["sql-perf", "EXPLAIN QUERY PLAN và tối ưu truy vấn"],
  ["sql-perf", "Chỉ mục phủ, chỉ mục một phần, chỉ mục biểu thức"],
  ["sql-perf", "JSON trong SQL"],
  ["sql-perf", "Tìm kiếm toàn văn (FTS4/FTS5)"],
  // Chặng 8 — Tốt nghiệp
  ["sql-capstone", "Phân tích cohort: khách quay lại sau bao lâu"],
  ["sql-capstone", "Từ SQLite sang PostgreSQL và MySQL"],
  ["sql-capstone", "Dự án tốt nghiệp: 10 truy vấn báo cáo cho quán Hạt"],
];

export const STEP_PASS_PERCENT = 60;

export const MAX_SLIDES = 35;

export const STEP_IDS = OUTLINE.map((_, index) => `sql${index + 1}`);

export const STAGES = STAGE_DEFS.map((stage) => {
  const from = OUTLINE.findIndex(([stageId]) => stageId === stage.id);
  const to = from + OUTLINE.filter(([stageId]) => stageId === stage.id).length;
  return { ...stage, from, to, rangeText: `step ${from + 1}–${to}` };
});
