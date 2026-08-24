import { HUGOSO_COURSES } from "../hugoSO/hugoSOCourses";

// ── STUDY ROUTE ────────────────────────────────────────────────────────────
// <base>                     → trang chủ Study (thư viện khoá học)
// <base>/<khoá>              → bản đồ của khoá đó
// <base>/<khoá>/<bài>        → đang học một bài CỦA khoá đó
//
//   /study/web/lesson7          · Chương trình Kỹ sư Phát triển Web
//   /study/calendar/calendar-01 · học phần CAL 101
//
// Khoá luôn nằm trong địa chỉ nên không phải suy bài thuộc khoá nào, và bài
// không khớp khoá thì bị bỏ qua chứ không mở nhầm khoá khác.
//
// Địa chỉ MỘT đoạn kiểu cũ (/study/lesson7, /study/ai-01) vẫn chạy để liên kết
// và dấu trang cũ không chết — khoá suy ra từ chính id bài.
//
// `<base>` là /member/utilities/study trong portal, /study (hoặc /hugoso) khi mở
// riêng. Mọi màn đều có địa chỉ nên tải lại trang ở đâu thì ở nguyên đó.
export const COURSE_MAP_ROUTE = "web";
export const LESSON_PATTERN = /^lesson(?:[1-9]|[1-9]\d|100)$/;
/** Office lesson IDs: calendar-01, docs-01b, sheets-02, slides-03, etc. */
const OFFICE_LESSON_PATTERN = /^(?:calendar|docs|sheets|ai)-\d+[a-z]?$/;

const text = (vi, en) => Object.freeze({ vi, en });

const part = ({ id, icon, tone, from, to, duration, title, summary, knowledge, guidance, outcomes, deliverable }) => Object.freeze({
  id, icon, tone, from, to, duration, title, summary, knowledge, guidance, outcomes, deliverable,
  lessonCount: to - from + 1,
});

export const STUDY_COLLECTIONS = Object.freeze([
  Object.freeze({
    id: "web-development",
    kind: "coder",
    icon: "code_blocks",
    tone: "blue",
    title: text("Chương trình Kỹ sư Phát triển Web", "Web Development Engineering Programme"),
    summary: text(
      "Một lộ trình liền mạch từ nền tảng web đến kiến trúc, bảo mật, AI, đồ án và phát hành sản phẩm thật.",
      "A continuous path from web foundations to architecture, security, AI, a production project, and real-world release.",
    ),
    duration: text("Khoảng 150 giờ tự học", "About 150 hours of self-study"),
    parts: Object.freeze([
      part({
        id: "basic", icon: "terminal", tone: "blue", from: 1, to: 10, duration: text("12 giờ", "12 hours"),
        title: text("WEB 101 · Nền tảng và Phản xạ Lập trình", "WEB 101 · Programming Foundations and Fluency"),
        summary: text("Nắm cú pháp cốt lõi và tự dựng một trang web có dữ liệu mà không phụ thuộc vào mã mẫu.", "Build core syntax fluency and create a data-backed web page without relying on copied code."),
        knowledge: text(["HTML ngữ nghĩa và cấu trúc tài liệu", "CSS Box Model, responsive và BEM", "JavaScript DOM, SQL CRUD và PHP/PDO"], ["Semantic HTML and document structure", "CSS Box Model, responsive design, and BEM", "JavaScript DOM, SQL CRUD, and PHP/PDO"]),
        guidance: text(["Học theo thứ tự bài 1–10", "Gõ lại ví dụ tối thiểu hai lần", "Hoàn thành bài tập và tự giải thích từng dòng"], ["Follow lessons 1–10 in order", "Retype each example at least twice", "Complete the exercise and explain every important line"]),
        outcomes: text(["Tự viết giao diện responsive cơ bản", "Đọc và sửa lỗi HTML/CSS/JavaScript", "Kết nối biểu mẫu với dữ liệu an toàn ở mức nền tảng"], ["Create a basic responsive interface", "Read and debug HTML/CSS/JavaScript", "Connect forms to data with foundational safety practices"]),
        deliverable: text("Website hồ sơ có biểu mẫu, kiểm tra dữ liệu và lưu trữ cơ bản.", "A profile website with a form, validation, and basic persistence."),
      }),
      part({
        id: "intermediate", icon: "account_tree", tone: "green", from: 11, to: 25, duration: text("18 giờ", "18 hours"),
        title: text("WEB 102 · Tư duy Kiến trúc Hệ thống", "WEB 102 · Systems Architecture Thinking"),
        summary: text("Chuyển từ viết từng màn hình sang thiết kế hệ thống có dữ liệu, API và giao diện nhất quán.", "Move from isolated screens to systems with coherent data, APIs, and interfaces."),
        knowledge: text(["Schema, JOIN và transaction", "MVC, REST API và JSON", "WCAG, CORS, CSP, DRY và SEO kỹ thuật"], ["Schemas, JOINs, and transactions", "MVC, REST APIs, and JSON", "WCAG, CORS, CSP, DRY, and technical SEO"]),
        guidance: text(["Vẽ luồng dữ liệu trước khi code", "Viết hợp đồng API cho từng chức năng", "Đánh giá accessibility và bảo mật sau mỗi phần"], ["Diagram data flow before coding", "Define an API contract for each feature", "Review accessibility and security after every section"]),
        outcomes: text(["Thiết kế schema đúng quan hệ", "Tổ chức dự án theo tầng rõ ràng", "Xây API có mã lỗi và phản hồi nhất quán"], ["Design relational schemas correctly", "Organize a project into clear layers", "Build APIs with consistent responses and error codes"]),
        deliverable: text("Ứng dụng CRUD theo MVC với REST API và giao diện đạt kiểm tra accessibility cơ bản.", "An MVC CRUD application with a REST API and a UI that passes a foundational accessibility review."),
      }),
      part({
        id: "advanced", icon: "data_object", tone: "purple", from: 26, to: 50, duration: text("32 giờ", "32 hours"),
        title: text("WEB 201 · Giải thuật, Dữ liệu và Mật mã", "WEB 201 · Algorithms, Data, and Cryptography"),
        summary: text("Hiểu phần lõi khoa học máy tính để chọn cấu trúc dữ liệu, đo hiệu năng và bảo vệ thông tin đúng cách.", "Learn the computer-science core needed to choose data structures, measure performance, and protect information correctly."),
        knowledge: text(["Array, linked list, stack, queue và hash table", "Tìm kiếm, sắp xếp và Big O", "AES/RSA, hash, salt, Web Crypto, PWA và unit test"], ["Arrays, linked lists, stacks, queues, and hash tables", "Search, sorting, and Big O", "AES/RSA, hashing, salting, Web Crypto, PWAs, and unit tests"]),
        guidance: text(["Tự cài đặt trước khi dùng thư viện", "Đo thời gian và bộ nhớ bằng dữ liệu thật", "Ghi rõ mô hình đe dọa trước bài mật mã"], ["Implement concepts before using libraries", "Measure time and memory with real data", "Write a threat model before cryptography exercises"]),
        outcomes: text(["Phân tích độ phức tạp của giải pháp", "Chọn thuật toán phù hợp với dữ liệu", "Dùng API mật mã an toàn thay vì tự tạo thuật toán"], ["Analyze solution complexity", "Choose algorithms appropriate to the data", "Use safe cryptographic APIs instead of inventing algorithms"]),
        deliverable: text("Bộ công cụ xử lý dữ liệu có benchmark, kiểm thử và mô-đun mã hóa được giải thích rõ.", "A data-processing toolkit with benchmarks, tests, and a clearly documented encryption module."),
      }),
      part({
        id: "security", icon: "shield_lock", tone: "pink", from: 51, to: 70, duration: text("28 giờ", "28 hours"),
        title: text("WEB 202 · Bảo mật Ứng dụng và AI", "WEB 202 · Application Security and AI"),
        summary: text("Bảo vệ ứng dụng web trước các lỗi phổ biến và tích hợp AI theo quy trình có kiểm soát.", "Protect web applications against common weaknesses and integrate AI through a controlled workflow."),
        knowledge: text(["TLS, XSS, CSRF, JWT và OAuth2", "OWASP Top 10 và kiểm thử bảo mật", "Gemini API, dữ liệu đa phương thức và structured output"], ["TLS, XSS, CSRF, JWT, and OAuth2", "OWASP Top 10 and security testing", "Gemini API, multimodal data, and structured output"]),
        guidance: text(["Lập threat model cho từng chức năng", "Kiểm tra cả luồng thành công và thất bại", "Không gửi bí mật hoặc dữ liệu vượt phạm vi cho AI"], ["Create a threat model for each feature", "Test both success and failure paths", "Never send secrets or out-of-scope data to AI"]),
        outcomes: text(["Nhận diện và sửa lỗi OWASP phổ biến", "Thiết kế xác thực và phân quyền đúng", "Tạo chức năng AI có schema, giới hạn và fallback"], ["Identify and fix common OWASP issues", "Design correct authentication and authorization", "Build AI features with schemas, limits, and fallbacks"]),
        deliverable: text("API có xác thực, phân quyền, kiểm thử tấn công và một chức năng AI được kiểm soát.", "An API with authentication, authorization, attack tests, and one controlled AI capability."),
      }),
      part({
        id: "project", icon: "rocket_launch", tone: "indigo", from: 71, to: 90, duration: text("40 giờ", "40 hours"),
        title: text("WEB 301 · Đồ án Full-stack và AI", "WEB 301 · Full-stack and AI Capstone"),
        summary: text("Ghép toàn bộ kiến thức thành một sản phẩm có người dùng, dữ liệu, realtime, AI và quy trình phát hành.", "Combine everything into a product with users, data, realtime features, AI, and a release workflow."),
        knowledge: text(["Backend OOP, CRUD và JWT", "Frontend router, state, i18n và responsive", "WebSocket, upload, moderation AI và kiểm thử"], ["OOP backend, CRUD, and JWT", "Frontend routing, state, i18n, and responsive design", "WebSockets, uploads, AI moderation, and testing"]),
        guidance: text(["Mỗi bài hoàn thành một mốc sản phẩm", "Commit có nội dung và bằng chứng kiểm thử", "Review theo yêu cầu, rủi ro và tiêu chí chấp nhận"], ["Each lesson completes one product milestone", "Use meaningful commits with test evidence", "Review requirements, risks, and acceptance criteria"]),
        outcomes: text(["Tự xây sản phẩm full-stack hoàn chỉnh", "Quản lý lỗi và trạng thái bất đồng bộ", "Trình bày quyết định kỹ thuật bằng tài liệu"], ["Build a complete full-stack product", "Manage errors and asynchronous state", "Explain technical decisions through documentation"]),
        deliverable: text("Repository v1.0.0 có tài liệu, kiểm thử và bản demo sẵn sàng đưa vào portfolio.", "A documented, tested v1.0.0 repository with a portfolio-ready demo."),
      }),
      part({
        id: "devops", icon: "cloud_upload", tone: "orange", from: 91, to: 100, duration: text("20 giờ", "20 hours"),
        title: text("WEB 302 · DevOps và Phát hành Sản phẩm", "WEB 302 · DevOps and Product Release"),
        summary: text("Đưa sản phẩm lên môi trường thật, quan sát hệ thống và phục hồi an toàn khi phát hành lỗi.", "Take a product to production, observe the system, and recover safely from failed releases."),
        knowledge: text(["Linux, Nginx, DNS và TLS", "Firewall, Fail2ban, PM2 và log", "Load test, CI/CD, backup và rollback"], ["Linux, Nginx, DNS, and TLS", "Firewalls, Fail2ban, PM2, and logs", "Load testing, CI/CD, backups, and rollback"]),
        guidance: text(["Thử trên staging trước production", "Lưu lệnh, cấu hình và bằng chứng vận hành", "Luôn chuẩn bị backup và kịch bản rollback"], ["Test on staging before production", "Record commands, configuration, and operating evidence", "Always prepare backups and a rollback procedure"]),
        outcomes: text(["Triển khai ứng dụng qua HTTPS", "Theo dõi log và xử lý sự cố cơ bản", "Phát hành có kiểm tra sức khỏe và rollback"], ["Deploy an application over HTTPS", "Monitor logs and handle foundational incidents", "Release with health checks and rollback"]),
        deliverable: text("Sản phẩm hoạt động trên Internet kèm runbook triển khai, giám sát, backup và rollback.", "A live Internet product with a deployment, monitoring, backup, and rollback runbook."),
      }),
    ]),
  }),
  Object.freeze({
    id: "digital-productivity-ai",
    kind: "office",
    // Bốn học phần này ĐỘC LẬP: mua riêng, học riêng, không có thứ tự bắt buộc.
    // Mỗi học phần mở ra là một CourseMap visual path riêng, giống Web Dev.
    splitCourses: true,
    icon: "auto_awesome",
    tone: "purple",
    title: text("Chương trình Năng suất số và AI ứng dụng", "Digital Productivity and Applied AI Programme"),
    summary: text("Làm chủ lịch, tài liệu, dữ liệu và AI bằng quy trình thực hành có kiểm chứng trên công cụ thật.", "Master schedules, documents, data, and AI through verified practice in real tools."),
    duration: text("17 giờ 42 phút hướng dẫn", "17 hours 42 minutes of guided learning"),
    parts: Object.freeze([
      part({
        id: "calendar", icon: "calendar_month", tone: "blue", from: 1, to: 9, duration: text("4 giờ 11 phút", "4 hours 11 minutes"),
        title: text("CAL 101 · Quản trị Thời gian và Lịch làm việc", "CAL 101 · Time and Calendar Management"),
        summary: text("Tổ chức thời gian cá nhân, lịch nhóm và quy trình đặt hẹn không trùng.", "Organize personal time, team calendars, and conflict-free appointment workflows."),
        knowledge: text(["Event, Task, múi giờ và nhắc việc", "Lịch nhóm, quyền chia sẻ và Focus time", "Appointment schedule và booking page"], ["Events, Tasks, time zones, and reminders", "Team calendars, sharing permissions, and Focus time", "Appointment schedules and booking pages"]),
        guidance: text(["Làm trực tiếp trên Calendar", "Kiểm thử với múi giờ và tài khoản khác", "Nộp mô tả cấu hình kèm kết quả kiểm tra"], ["Work directly in Calendar", "Test with another time zone and account", "Submit the configuration and test results"]),
        outcomes: text(["Vận hành một tuần làm việc rõ ràng", "Tổ chức họp có quyền truy cập đúng", "Tạo trang đặt lịch chống double-booking"], ["Run a clearly structured work week", "Organize meetings with correct access", "Create a booking page that prevents double-booking"]),
        deliverable: text("Bộ lịch làm việc và trang đặt hẹn đã kiểm thử đầy đủ.", "A tested work-calendar system and appointment booking page."),
      }),
      part({
        id: "docs", icon: "description", tone: "blue", from: 1, to: 9, duration: text("4 giờ 13 phút", "4 hours 13 minutes"),
        title: text("DOC 102 · Soạn thảo Học thuật và Bố cục Báo cáo", "DOC 102 · Academic Writing and Report Design"),
        summary: text("Xây tài liệu có cấu trúc, cộng tác an toàn, trích dẫn kiểm chứng được và xuất bản đúng chuẩn.", "Create structured documents with safe collaboration, verifiable citations, and standards-based publishing."),
        knowledge: text(["Pages, Pageless, heading và mục lục", "Comment, suggestion, version history và quyền chia sẻ", "Trích dẫn Harvard, accessibility và PDF"], ["Pages, Pageless, headings, and tables of contents", "Comments, suggestions, version history, and sharing", "Harvard citations, accessibility, and PDF output"]),
        guidance: text(["Bắt đầu bằng dàn ý và tiêu chí đầu ra", "Dùng style thay vì định dạng thủ công", "Kiểm tra nguồn, quyền truy cập và bản PDF cuối"], ["Start with an outline and output criteria", "Use styles instead of manual formatting", "Verify sources, access permissions, and the final PDF"]),
        outcomes: text(["Soạn báo cáo dễ đọc và nhất quán", "Cộng tác mà không mất lịch sử thay đổi", "Trích dẫn và xuất PDF có thể kiểm chứng"], ["Write readable, consistent reports", "Collaborate without losing change history", "Create verifiable citations and PDF output"]),
        deliverable: text("Báo cáo Harvard hoàn chỉnh có mục lục, trích dẫn, accessibility và PDF.", "A complete Harvard-style report with a table of contents, citations, accessibility, and PDF output."),
      }),
      part({
        id: "sheets", icon: "table_view", tone: "green", from: 1, to: 8, duration: text("4 giờ 33 phút", "4 hours 33 minutes"),
        title: text("SHE 201 · Dữ liệu và Báo cáo Vận hành", "SHE 201 · Operational Data and Reporting"),
        summary: text("Biến dữ liệu thô thành tracker sạch, công thức đáng tin cậy và dashboard có thể bàn giao.", "Turn raw data into a clean tracker, reliable formulas, and a handover-ready dashboard."),
        knowledge: text(["Cấu trúc bảng, validation và dữ liệu sạch", "Formula, lookup, Pivot và xử lý lỗi", "Biểu đồ, dashboard, bảo vệ và bàn giao"], ["Table structure, validation, and clean data", "Formulas, lookups, pivots, and error handling", "Charts, dashboards, protection, and handover"]),
        guidance: text(["Xác định một hàng đại diện cho điều gì", "Kiểm thử công thức với dữ liệu biên", "Khóa vùng công thức và viết hướng dẫn sử dụng"], ["Define what one row represents", "Test formulas with edge-case data", "Protect formula ranges and document usage"]),
        outcomes: text(["Tạo dữ liệu nhất quán bằng validation", "Phân tích dữ liệu bằng công thức và Pivot", "Xây dashboard tự cập nhật và bàn giao được"], ["Create consistent data with validation", "Analyze data with formulas and pivots", "Build an auto-updating, handover-ready dashboard"]),
        deliverable: text("Tracker vận hành có validation, phân tích, dashboard và hướng dẫn bàn giao.", "An operational tracker with validation, analysis, a dashboard, and handover instructions."),
      }),
      part({
        id: "ai", icon: "neurology", tone: "purple", from: 1, to: 10, duration: text("5 giờ 12 phút", "5 hours 12 minutes"),
        title: text("AIA 202 · Trợ lý AI: Gemini, ChatGPT và Claude", "AIA 202 · AI Assistants: Gemini, ChatGPT, and Claude"),
        summary: text("Hiểu mô hình sinh câu trả lời bằng cách nào, so ba trợ lý trên chính công việc của bạn, và dựng quy trình có người chịu trách nhiệm.", "Understand how models generate answers, benchmark three assistants on your own work, and build a workflow with clear human accountability."),
        knowledge: text(["Cơ chế sinh văn bản, ảo giác và giới hạn ngữ cảnh", "Yêu cầu bốn phần, tiêu chí đo được và vòng sửa có kiểm soát", "So sánh ba mô hình, đưa nguồn vào ngữ cảnh và kiểm chứng khẳng định"], ["Text generation, hallucination, and context limits", "Four-part prompts, measurable criteria, and controlled iteration", "Model benchmarking, grounding in your sources, and claim verification"]),
        guidance: text(["Không nhập dữ liệu nhạy cảm", "Kiểm tra từng claim bằng nguồn gốc", "Ghi lại prompt, phiên bản và người phê duyệt"], ["Never enter sensitive data", "Verify every claim against a source", "Record prompts, versions, and the approver"]),
        outcomes: text(["Viết yêu cầu cho ra kết quả lặp lại được", "Chọn trợ lý theo phép thử của chính mình, không theo bảng xếp hạng", "Tách bản nháp máy sinh khỏi kết luận đã xác minh"], ["Write prompts that produce repeatable results", "Choose an assistant from your own benchmark, not a leaderboard", "Separate machine drafts from verified conclusions"]),
        deliverable: text("Hồ sơ quy trình AI có nhật ký quyết định, bảng khẳng định đã kiểm, giới hạn và người phê duyệt có tên.", "An AI workflow dossier with a decision log, verified-claims table, stated limits, and a named approver."),
      }),
    ]),
  }),
]);

export const STUDY_COPY = Object.freeze({
  vi: Object.freeze({
    appName: "Study with Hugo", subtitle: "Hugo Studio Learning", largeTitle: "Học tập",
    heroTitle: "Học đúng lộ trình.\nLàm được sản phẩm.",
    intro: "Bài học có thứ tự, thực hành có mục tiêu và đầu ra có thể kiểm chứng.",
    collections: "bộ lộ trình", parts: "phần", lessons: "bài học", continue: "Học tiếp", start: "Bắt đầu",
    suggested: "Đề xuất tiếp theo", completed: "đã hoàn thành", library: "Khoá học của bạn", search: "Tìm kiến thức hoặc kỹ năng",
    all: "Khoá học", tabResources: "Học liệu", tabQuality: "Chất lượng", tabProgress: "Tiến độ", web: "Phát triển Web", digital: "Năng suất & AI", learning: "Đang học", noResults: "Không tìm thấy nội dung phù hợp.",
    original: "Hugo Studio Original", authored: "Lộ trình độc quyền · Biên soạn bởi Hugo Studio", selfPaced: "Tự học có hướng dẫn",
    partCount: "{{count}} phần", lessonCount: "{{count}} bài", viewPart: "Xem nội dung phần", close: "Thu gọn",
    knowledge: "Kiến thức trọng tâm", guidance: "Cách học phần này", outcomes: "Kết quả đầu ra", deliverable: "Sản phẩm hoàn thành",
    openPart: "Vào phần học", progress: "Tiến độ", back: "Quay lại", estimated: "Thời lượng ước tính",
    remaining: "Còn lại", done: "Đã xong",
  }),
  en: Object.freeze({
    appName: "Study with Hugo", subtitle: "Hugo Studio Learning", largeTitle: "Study",
    heroTitle: "Follow the path.\nBuild real work.",
    intro: "Sequenced lessons, purposeful practice, and verifiable outcomes.",
    collections: "collections", parts: "parts", lessons: "lessons", continue: "Continue", start: "Start",
    suggested: "Recommended next", completed: "completed", library: "Your courses", search: "Search knowledge or skills",
    all: "Courses", tabResources: "Library", tabQuality: "Quality", tabProgress: "Progress", web: "Web Development", digital: "Productivity & AI", learning: "In progress", noResults: "No matching learning content found.",
    original: "Hugo Studio Original", authored: "Exclusive learning path · Authored by Hugo Studio", selfPaced: "Guided self-paced study",
    partCount: "{{count}} parts", lessonCount: "{{count}} lessons", viewPart: "View part details", close: "Collapse",
    knowledge: "Core knowledge", guidance: "How to study this part", outcomes: "Learning outcomes", deliverable: "Completion deliverable",
    openPart: "Open learning part", progress: "Progress", back: "Back", estimated: "Estimated duration",
    remaining: "Remaining", done: "Done",
  }),
});

export function localize(value, locale) {
  return value?.[locale] ?? value?.vi ?? value;
}

/**
 * Suy ra Study đang mở màn nào, chỉ từ ĐỊA CHỈ.
 *
 * @param pathname đường dẫn đầy đủ, để cắt ra `basePath`
 * @param segment  đoạn khoá học  (`web`, `calendar`, …)
 * @param sub      đoạn bài học trong khoá đó (tuỳ chọn)
 *
 * Bài phải THUỘC khoá ghi trong địa chỉ; không khớp thì bỏ qua bài và mở bản đồ
 * khoá, thay vì lặng lẽ mở bài của khoá khác.
 *
 * Đoạn lạ (gõ sai, liên kết cũ) coi như không có: về trang chủ Study thay vì
 * dựng một màn trống.
 */
export function resolveStudyRoute(pathname, segment, sub) {
  const path = String(pathname || "").replace(/\/+$/, "");
  const cut = (base, part) => (part && base.endsWith(`/${part}`) ? base.slice(0, -(part.length + 1)) : base);

  /** Khoá mà một id bài thuộc về; null nếu id không hợp lệ. */
  const courseOfLesson = (id) => {
    if (LESSON_PATTERN.test(id || "")) return COURSE_MAP_ROUTE;
    const prefix = String(id || "").split("-")[0];
    return OFFICE_LESSON_PATTERN.test(id || "") && HUGOSO_COURSES[prefix] ? prefix : null;
  };

  const isCourse = segment === COURSE_MAP_ROUTE || Boolean(HUGOSO_COURSES[segment]);

  // Dạng cũ một đoạn: /study/lesson7 hoặc /study/ai-01.
  if (!isCourse) {
    const owner = courseOfLesson(segment);
    if (!owner) return { view: null, courseId: null, lessonId: null, basePath: cut(path, segment) || "/study" };
    return {
      view: owner === COURSE_MAP_ROUTE ? "coder" : "office",
      courseId: owner,
      lessonId: segment,
      basePath: cut(path, segment) || "/study",
    };
  }

  // Bài chỉ được nhận khi đúng là bài của khoá trong địa chỉ.
  const lessonId = sub && courseOfLesson(sub) === segment ? sub : null;
  return {
    view: segment === COURSE_MAP_ROUTE ? "coder" : "office",
    courseId: segment,
    lessonId,
    basePath: cut(cut(path, sub), segment) || "/study",
  };
}
