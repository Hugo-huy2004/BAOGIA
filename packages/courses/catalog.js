// Danh mục khoá công khai — trang giới thiệu (/courses/:id), sơ đồ trang và SEO (scripts/generate-seo.mjs)
// đọc chung. Chỉ import stages.js (nhẹ), không kéo nội dung bài.
import * as coding from "./coding/stages.js";
import * as sql from "./sql/stages.js";

// cast: nhân vật clay của từng chặng (apps/web/public/edu/cast-N.svg) — khớp CourseMap.jsx.
export const CATALOG = [
  {
    id: "coding", cast: 1, hours: 26, stages: coding.STAGES, outline: coding.OUTLINE,
    stageCast: { basic: 1, intermediate: 4, advanced: 6, security: 2, project: 3, devops: 8 },
    title: { vi: "Lập trình Web", en: "Web Programming", zh: "网页编程" },
    tagline: {
      vi: "Tự tay xây mạng xã hội Nhịp: HTML, CSS, JavaScript, PHP, MySQL, bảo mật và triển khai thật.",
      en: "Build the Nhịp social network yourself: HTML, CSS, JavaScript, PHP, MySQL, security and a real deployment.",
      zh: "亲手打造 Nhịp 社交网络：HTML、CSS、JavaScript、PHP、MySQL、安全与真实部署。",
    },
    keywords: "học lập trình web miễn phí, học HTML CSS JavaScript, học PHP MySQL, khoá học lập trình cho người mới",
  },
  {
    id: "sql", cast: 6, hours: 50, stages: sql.STAGES, outline: sql.OUTLINE,
    stageCast: { "sql-basic": 6, "sql-filter": 7, "sql-group": 5, "sql-design": 3, "sql-write": 2, "sql-window": 4, "sql-perf": 8, "sql-capstone": 1 },
    title: { vi: "SQL & Cơ sở dữ liệu", en: "SQL & Databases", zh: "SQL 与数据库" },
    tagline: {
      vi: "Từ câu SELECT đầu tiên tới CTE, window function, chỉ mục và tìm kiếm toàn văn — chạy SQL thật ngay trong trình duyệt.",
      en: "From your first SELECT to CTEs, window functions, indexes and full-text search — real SQL right in your browser.",
      zh: "从第一条 SELECT 到 CTE、窗口函数、索引和全文搜索——直接在浏览器中运行真实 SQL。",
    },
    keywords: "học SQL miễn phí, học SQL cho người mới, khoá học SQL, học cơ sở dữ liệu, SQLite, window function, CTE, JOIN, GROUP BY, chỉ mục SQL",
  },
];

export const courseById = (id) => CATALOG.find((c) => c.id === id) || null;
