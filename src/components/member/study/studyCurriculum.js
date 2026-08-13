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
    title: text("Bộ Phát triển Web Chuyên nghiệp", "Professional Web Development Collection"),
    summary: text(
      "Một lộ trình liền mạch từ nền tảng web đến kiến trúc, bảo mật, AI, đồ án và phát hành sản phẩm thật.",
      "A continuous path from web foundations to architecture, security, AI, a production project, and real-world release.",
    ),
    duration: text("Khoảng 150 giờ tự học", "About 150 hours of self-study"),
    parts: Object.freeze([
      part({
        id: "basic", icon: "terminal", tone: "blue", from: 1, to: 10, duration: text("12 giờ", "12 hours"),
        title: text("Phần 1 · Nền tảng và phản xạ lập trình", "Part 1 · Programming foundations and fluency"),
        summary: text("Nắm cú pháp cốt lõi và tự dựng một trang web có dữ liệu mà không phụ thuộc vào mã mẫu.", "Build core syntax fluency and create a data-backed web page without relying on copied code."),
        knowledge: text(["HTML ngữ nghĩa và cấu trúc tài liệu", "CSS Box Model, responsive và BEM", "JavaScript DOM, SQL CRUD và PHP/PDO"], ["Semantic HTML and document structure", "CSS Box Model, responsive design, and BEM", "JavaScript DOM, SQL CRUD, and PHP/PDO"]),
        guidance: text(["Học theo thứ tự bài 1–10", "Gõ lại ví dụ tối thiểu hai lần", "Hoàn thành bài tập và tự giải thích từng dòng"], ["Follow lessons 1–10 in order", "Retype each example at least twice", "Complete the exercise and explain every important line"]),
        outcomes: text(["Tự viết giao diện responsive cơ bản", "Đọc và sửa lỗi HTML/CSS/JavaScript", "Kết nối biểu mẫu với dữ liệu an toàn ở mức nền tảng"], ["Create a basic responsive interface", "Read and debug HTML/CSS/JavaScript", "Connect forms to data with foundational safety practices"]),
        deliverable: text("Website hồ sơ có biểu mẫu, kiểm tra dữ liệu và lưu trữ cơ bản.", "A profile website with a form, validation, and basic persistence."),
      }),
      part({
        id: "intermediate", icon: "account_tree", tone: "green", from: 11, to: 25, duration: text("18 giờ", "18 hours"),
        title: text("Phần 2 · Tư duy kiến trúc", "Part 2 · Architecture thinking"),
        summary: text("Chuyển từ viết từng màn hình sang thiết kế hệ thống có dữ liệu, API và giao diện nhất quán.", "Move from isolated screens to systems with coherent data, APIs, and interfaces."),
        knowledge: text(["Schema, JOIN và transaction", "MVC, REST API và JSON", "WCAG, CORS, CSP, DRY và SEO kỹ thuật"], ["Schemas, JOINs, and transactions", "MVC, REST APIs, and JSON", "WCAG, CORS, CSP, DRY, and technical SEO"]),
        guidance: text(["Vẽ luồng dữ liệu trước khi code", "Viết hợp đồng API cho từng chức năng", "Đánh giá accessibility và bảo mật sau mỗi phần"], ["Diagram data flow before coding", "Define an API contract for each feature", "Review accessibility and security after every section"]),
        outcomes: text(["Thiết kế schema đúng quan hệ", "Tổ chức dự án theo tầng rõ ràng", "Xây API có mã lỗi và phản hồi nhất quán"], ["Design relational schemas correctly", "Organize a project into clear layers", "Build APIs with consistent responses and error codes"]),
        deliverable: text("Ứng dụng CRUD theo MVC với REST API và giao diện đạt kiểm tra accessibility cơ bản.", "An MVC CRUD application with a REST API and a UI that passes a foundational accessibility review."),
      }),
      part({
        id: "advanced", icon: "data_object", tone: "purple", from: 26, to: 50, duration: text("32 giờ", "32 hours"),
        title: text("Phần 3 · Giải thuật, dữ liệu và mật mã", "Part 3 · Algorithms, data, and cryptography"),
        summary: text("Hiểu phần lõi khoa học máy tính để chọn cấu trúc dữ liệu, đo hiệu năng và bảo vệ thông tin đúng cách.", "Learn the computer-science core needed to choose data structures, measure performance, and protect information correctly."),
        knowledge: text(["Array, linked list, stack, queue và hash table", "Tìm kiếm, sắp xếp và Big O", "AES/RSA, hash, salt, Web Crypto, PWA và unit test"], ["Arrays, linked lists, stacks, queues, and hash tables", "Search, sorting, and Big O", "AES/RSA, hashing, salting, Web Crypto, PWAs, and unit tests"]),
        guidance: text(["Tự cài đặt trước khi dùng thư viện", "Đo thời gian và bộ nhớ bằng dữ liệu thật", "Ghi rõ mô hình đe dọa trước bài mật mã"], ["Implement concepts before using libraries", "Measure time and memory with real data", "Write a threat model before cryptography exercises"]),
        outcomes: text(["Phân tích độ phức tạp của giải pháp", "Chọn thuật toán phù hợp với dữ liệu", "Dùng API mật mã an toàn thay vì tự tạo thuật toán"], ["Analyze solution complexity", "Choose algorithms appropriate to the data", "Use safe cryptographic APIs instead of inventing algorithms"]),
        deliverable: text("Bộ công cụ xử lý dữ liệu có benchmark, kiểm thử và mô-đun mã hóa được giải thích rõ.", "A data-processing toolkit with benchmarks, tests, and a clearly documented encryption module."),
      }),
      part({
        id: "security", icon: "shield_lock", tone: "pink", from: 51, to: 70, duration: text("28 giờ", "28 hours"),
        title: text("Phần 4 · Bảo mật ứng dụng và AI", "Part 4 · Application security and AI"),
        summary: text("Bảo vệ ứng dụng web trước các lỗi phổ biến và tích hợp AI theo quy trình có kiểm soát.", "Protect web applications against common weaknesses and integrate AI through a controlled workflow."),
        knowledge: text(["TLS, XSS, CSRF, JWT và OAuth2", "OWASP Top 10 và kiểm thử bảo mật", "Gemini API, dữ liệu đa phương thức và structured output"], ["TLS, XSS, CSRF, JWT, and OAuth2", "OWASP Top 10 and security testing", "Gemini API, multimodal data, and structured output"]),
        guidance: text(["Lập threat model cho từng chức năng", "Kiểm tra cả luồng thành công và thất bại", "Không gửi bí mật hoặc dữ liệu vượt phạm vi cho AI"], ["Create a threat model for each feature", "Test both success and failure paths", "Never send secrets or out-of-scope data to AI"]),
        outcomes: text(["Nhận diện và sửa lỗi OWASP phổ biến", "Thiết kế xác thực và phân quyền đúng", "Tạo chức năng AI có schema, giới hạn và fallback"], ["Identify and fix common OWASP issues", "Design correct authentication and authorization", "Build AI features with schemas, limits, and fallbacks"]),
        deliverable: text("API có xác thực, phân quyền, kiểm thử tấn công và một chức năng AI được kiểm soát.", "An API with authentication, authorization, attack tests, and one controlled AI capability."),
      }),
      part({
        id: "project", icon: "rocket_launch", tone: "indigo", from: 71, to: 90, duration: text("40 giờ", "40 hours"),
        title: text("Phần 5 · Đồ án Full-stack và AI", "Part 5 · Full-stack and AI capstone"),
        summary: text("Ghép toàn bộ kiến thức thành một sản phẩm có người dùng, dữ liệu, realtime, AI và quy trình phát hành.", "Combine everything into a product with users, data, realtime features, AI, and a release workflow."),
        knowledge: text(["Backend OOP, CRUD và JWT", "Frontend router, state, i18n và responsive", "WebSocket, upload, moderation AI và kiểm thử"], ["OOP backend, CRUD, and JWT", "Frontend routing, state, i18n, and responsive design", "WebSockets, uploads, AI moderation, and testing"]),
        guidance: text(["Mỗi bài hoàn thành một mốc sản phẩm", "Commit có nội dung và bằng chứng kiểm thử", "Review theo yêu cầu, rủi ro và tiêu chí chấp nhận"], ["Each lesson completes one product milestone", "Use meaningful commits with test evidence", "Review requirements, risks, and acceptance criteria"]),
        outcomes: text(["Tự xây sản phẩm full-stack hoàn chỉnh", "Quản lý lỗi và trạng thái bất đồng bộ", "Trình bày quyết định kỹ thuật bằng tài liệu"], ["Build a complete full-stack product", "Manage errors and asynchronous state", "Explain technical decisions through documentation"]),
        deliverable: text("Repository v1.0.0 có tài liệu, kiểm thử và bản demo sẵn sàng đưa vào portfolio.", "A documented, tested v1.0.0 repository with a portfolio-ready demo."),
      }),
      part({
        id: "devops", icon: "cloud_upload", tone: "orange", from: 91, to: 100, duration: text("20 giờ", "20 hours"),
        title: text("Phần 6 · DevOps và phát hành", "Part 6 · DevOps and release"),
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
    icon: "auto_awesome",
    tone: "purple",
    title: text("Bộ Năng suất số và AI", "Digital Productivity and AI Collection"),
    summary: text("Làm chủ lịch, tài liệu, dữ liệu và AI bằng quy trình thực hành có kiểm chứng trên công cụ thật.", "Master schedules, documents, data, and AI through verified practice in real tools."),
    duration: text("17 giờ 42 phút hướng dẫn", "17 hours 42 minutes of guided learning"),
    parts: Object.freeze([
      part({
        id: "calendar", icon: "calendar_month", tone: "blue", from: 1, to: 9, duration: text("4 giờ 11 phút", "4 hours 11 minutes"),
        title: text("Phần 1 · Quản trị thời gian với Calendar", "Part 1 · Time management with Calendar"),
        summary: text("Tổ chức thời gian cá nhân, lịch nhóm và quy trình đặt hẹn không trùng.", "Organize personal time, team calendars, and conflict-free appointment workflows."),
        knowledge: text(["Event, Task, múi giờ và nhắc việc", "Lịch nhóm, quyền chia sẻ và Focus time", "Appointment schedule và booking page"], ["Events, Tasks, time zones, and reminders", "Team calendars, sharing permissions, and Focus time", "Appointment schedules and booking pages"]),
        guidance: text(["Làm trực tiếp trên Calendar", "Kiểm thử với múi giờ và tài khoản khác", "Nộp mô tả cấu hình kèm kết quả kiểm tra"], ["Work directly in Calendar", "Test with another time zone and account", "Submit the configuration and test results"]),
        outcomes: text(["Vận hành một tuần làm việc rõ ràng", "Tổ chức họp có quyền truy cập đúng", "Tạo trang đặt lịch chống double-booking"], ["Run a clearly structured work week", "Organize meetings with correct access", "Create a booking page that prevents double-booking"]),
        deliverable: text("Bộ lịch làm việc và trang đặt hẹn đã kiểm thử đầy đủ.", "A tested work-calendar system and appointment booking page."),
      }),
      part({
        id: "docs", icon: "description", tone: "blue", from: 1, to: 9, duration: text("4 giờ 13 phút", "4 hours 13 minutes"),
        title: text("Phần 2 · Tài liệu và báo cáo học thuật", "Part 2 · Documents and academic reports"),
        summary: text("Xây tài liệu có cấu trúc, cộng tác an toàn, trích dẫn kiểm chứng được và xuất bản đúng chuẩn.", "Create structured documents with safe collaboration, verifiable citations, and standards-based publishing."),
        knowledge: text(["Pages, Pageless, heading và mục lục", "Comment, suggestion, version history và quyền chia sẻ", "Trích dẫn Harvard, accessibility và PDF"], ["Pages, Pageless, headings, and tables of contents", "Comments, suggestions, version history, and sharing", "Harvard citations, accessibility, and PDF output"]),
        guidance: text(["Bắt đầu bằng dàn ý và tiêu chí đầu ra", "Dùng style thay vì định dạng thủ công", "Kiểm tra nguồn, quyền truy cập và bản PDF cuối"], ["Start with an outline and output criteria", "Use styles instead of manual formatting", "Verify sources, access permissions, and the final PDF"]),
        outcomes: text(["Soạn báo cáo dễ đọc và nhất quán", "Cộng tác mà không mất lịch sử thay đổi", "Trích dẫn và xuất PDF có thể kiểm chứng"], ["Write readable, consistent reports", "Collaborate without losing change history", "Create verifiable citations and PDF output"]),
        deliverable: text("Báo cáo Harvard hoàn chỉnh có mục lục, trích dẫn, accessibility và PDF.", "A complete Harvard-style report with a table of contents, citations, accessibility, and PDF output."),
      }),
      part({
        id: "sheets", icon: "table_view", tone: "green", from: 1, to: 8, duration: text("4 giờ 33 phút", "4 hours 33 minutes"),
        title: text("Phần 3 · Dữ liệu và báo cáo với Sheets", "Part 3 · Data and reporting with Sheets"),
        summary: text("Biến dữ liệu thô thành tracker sạch, công thức đáng tin cậy và dashboard có thể bàn giao.", "Turn raw data into a clean tracker, reliable formulas, and a handover-ready dashboard."),
        knowledge: text(["Cấu trúc bảng, validation và dữ liệu sạch", "Formula, lookup, Pivot và xử lý lỗi", "Biểu đồ, dashboard, bảo vệ và bàn giao"], ["Table structure, validation, and clean data", "Formulas, lookups, pivots, and error handling", "Charts, dashboards, protection, and handover"]),
        guidance: text(["Xác định một hàng đại diện cho điều gì", "Kiểm thử công thức với dữ liệu biên", "Khóa vùng công thức và viết hướng dẫn sử dụng"], ["Define what one row represents", "Test formulas with edge-case data", "Protect formula ranges and document usage"]),
        outcomes: text(["Tạo dữ liệu nhất quán bằng validation", "Phân tích dữ liệu bằng công thức và Pivot", "Xây dashboard tự cập nhật và bàn giao được"], ["Create consistent data with validation", "Analyze data with formulas and pivots", "Build an auto-updating, handover-ready dashboard"]),
        deliverable: text("Tracker vận hành có validation, phân tích, dashboard và hướng dẫn bàn giao.", "An operational tracker with validation, analysis, a dashboard, and handover instructions."),
      }),
      part({
        id: "gemini", icon: "auto_awesome", tone: "purple", from: 1, to: 9, duration: text("4 giờ 45 phút", "4 hours 45 minutes"),
        title: text("Phần 4 · AI có kiểm chứng với Gemini", "Part 4 · Verified AI workflows with Gemini"),
        summary: text("Dùng AI để nghiên cứu, tạo bản nháp và tự động hóa mà vẫn giữ nguồn, quyền riêng tư và người chịu trách nhiệm.", "Use AI for research, drafting, and automation while preserving sources, privacy, and human accountability."),
        knowledge: text(["Prompt có mục tiêu, ngữ cảnh, ràng buộc và rubric", "Gems, Canvas, Deep Research và kiểm chứng nguồn", "Workflow Sheets–AI–Docs–Calendar có audit"], ["Prompts with goals, context, constraints, and rubrics", "Gems, Canvas, Deep Research, and source verification", "Auditable Sheets–AI–Docs–Calendar workflows"]),
        guidance: text(["Không nhập dữ liệu nhạy cảm", "Kiểm tra từng claim bằng nguồn gốc", "Ghi lại prompt, phiên bản và người phê duyệt"], ["Never enter sensitive data", "Verify every claim against a source", "Record prompts, versions, and the approver"]),
        outcomes: text(["Viết prompt lặp lại được", "Phân biệt bản nháp AI với kết luận đã kiểm chứng", "Xây workflow có checkpoint và người phê duyệt"], ["Write repeatable prompts", "Separate AI drafts from verified conclusions", "Build workflows with checkpoints and human approval"]),
        deliverable: text("Quy trình AI tám bước có nguồn, nhật ký quyết định, checkpoint và phê duyệt cuối.", "An eight-step AI workflow with sources, a decision log, checkpoints, and final approval."),
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
    suggested: "Đề xuất tiếp theo", completed: "đã hoàn thành", library: "Lộ trình của bạn", search: "Tìm kiến thức hoặc kỹ năng",
    all: "Tất cả", web: "Phát triển Web", digital: "Năng suất & AI", learning: "Đang học", noResults: "Không tìm thấy nội dung phù hợp.",
    original: "Hugo Studio Original", authored: "Lộ trình độc quyền · Biên soạn bởi Hugo Studio", selfPaced: "Tự học có hướng dẫn",
    partCount: "{{count}} phần", lessonCount: "{{count}} bài", viewPart: "Xem nội dung phần", close: "Thu gọn",
    knowledge: "Kiến thức trọng tâm", guidance: "Cách học phần này", outcomes: "Kết quả đầu ra", deliverable: "Sản phẩm hoàn thành",
    openPart: "Vào phần học", progress: "Tiến độ", back: "Quay lại", estimated: "Thời lượng ước tính",
  }),
  en: Object.freeze({
    appName: "Study with Hugo", subtitle: "Hugo Studio Learning", largeTitle: "Study",
    heroTitle: "Follow the path.\nBuild real work.",
    intro: "Sequenced lessons, purposeful practice, and verifiable outcomes.",
    collections: "collections", parts: "parts", lessons: "lessons", continue: "Continue", start: "Start",
    suggested: "Recommended next", completed: "completed", library: "Your learning paths", search: "Search knowledge or skills",
    all: "All", web: "Web Development", digital: "Productivity & AI", learning: "In progress", noResults: "No matching learning content found.",
    original: "Hugo Studio Original", authored: "Exclusive learning path · Authored by Hugo Studio", selfPaced: "Guided self-paced study",
    partCount: "{{count}} parts", lessonCount: "{{count}} lessons", viewPart: "View part details", close: "Collapse",
    knowledge: "Core knowledge", guidance: "How to study this part", outcomes: "Learning outcomes", deliverable: "Completion deliverable",
    openPart: "Open learning part", progress: "Progress", back: "Back", estimated: "Estimated duration",
  }),
});

export function localize(value, locale) {
  return value?.[locale] ?? value?.vi ?? value;
}
