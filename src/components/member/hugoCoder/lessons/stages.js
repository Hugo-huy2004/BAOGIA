// Sáu chặng của khoá Coding. `id` giữ đúng mã chặng cũ (basic…devops) vì giá
// bán từng chặng (shared/joyPrices.js), cờ sở hữu trên hồ sơ và thưởng mốc
// chặng đều tra theo mã này — đổi mã là phải đổi cả đường tiền.
//
// Cả khoá xoay quanh MỘT sản phẩm: "Nhịp", mạng xã hội chia sẻ bài viết ngắn (trang
// đăng bài + trang cá nhân), dựng từ trang HTML tĩnh tới bản PHP + MySQL chạy
// thật trên Internet.
export const STAGE_DEFS = [
  {
    id: "basic", tone: "blue", phaseNumber: 1, code: "CODE 101",
    title: "CODE 101 · Nền tảng lập trình và Web",
    intro: {
      tagline: "Từ con số 0 tới bản mẫu Nhịp chạy được trên trình duyệt.",
      learn: ["Tư duy thuật toán, biến, điều kiện, vòng lặp, hàm", "Web vận hành thế nào: client, server, HTTP, DNS", "HTML ngữ nghĩa và CSS bố cục mạng xã hội", "JavaScript, DOM và sự kiện: đăng bài, thả tim ngay trên trang"],
      challenge: "Chưa có máy chủ, chưa có cơ sở dữ liệu: mọi thứ phải chạy bằng HTML, CSS và JavaScript thuần.",
      promise: "Kết chặng: bản mẫu Nhịp gồm trang bảng tin và trang cá nhân, đăng bài và thả tim được.",
      reading: [
        { title: "CS50's Introduction to Computer Science", author: "Harvard University", url: "https://cs50.harvard.edu/x/" },
        { title: "MDN Learn web development", author: "Mozilla", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development" },
        { title: "HTML Living Standard", author: "WHATWG", url: "https://html.spec.whatwg.org/" },
      ],
    },
  },
  {
    id: "intermediate", tone: "green", phaseNumber: 2, code: "CODE 102",
    title: "CODE 102 · PHP, SQL và máy chủ localhost",
    intro: {
      tagline: "Cho Nhịp một bộ não: máy chủ PHP và cơ sở dữ liệu MySQL ngay trên máy bạn.",
      learn: ["XAMPP: Apache, PHP, MySQL và phpMyAdmin trên localhost", "PHP nền tảng và xử lý biểu mẫu", "Thiết kế cơ sở dữ liệu quan hệ cho mạng xã hội", "SQL và PDO với prepared statement"],
      challenge: "Dữ liệu không còn nằm trong trình duyệt: tải lại trang, đổi máy, bài vẫn còn.",
      promise: "Kết chặng: bảng tin Nhịp đọc bài thật từ MySQL qua PDO.",
      reading: [
        { title: "PHP Manual", author: "The PHP Group", url: "https://www.php.net/manual/en/" },
        { title: "MySQL 8.4 Reference Manual", author: "Oracle", url: "https://dev.mysql.com/doc/refman/8.4/en/" },
        { title: "PHP Data Objects (PDO)", author: "The PHP Group", url: "https://www.php.net/manual/en/book.pdo.php" },
      ],
    },
  },
  {
    id: "advanced", tone: "purple", phaseNumber: 3, code: "CODE 201",
    title: "CODE 201 · CRUD mạng xã hội",
    intro: {
      tagline: "Tài khoản, bài đăng, trang cá nhân, theo dõi, thả tim, trả lời — trọn vòng CRUD.",
      learn: ["Đăng ký, đăng nhập, session và password_hash", "Tạo, đọc, sửa, xoá bài đăng có kiểm quyền", "Trang cá nhân, ảnh đại diện, theo dõi", "Trả lời lồng nhau, tìm kiếm và Fetch API"],
      challenge: "Mỗi thao tác ghi phải trả lời được: ai đang làm, và người đó có quyền không.",
      promise: "Kết chặng: Nhịp là một mạng xã hội dùng được trên localhost + thưởng 800 JOY.",
      reading: [
        { title: "PHP Sessions", author: "The PHP Group", url: "https://www.php.net/manual/en/book.session.php" },
        { title: "Password Hashing", author: "The PHP Group", url: "https://www.php.net/manual/en/book.password.php" },
        { title: "Using the Fetch API", author: "Mozilla", url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch" },
      ],
    },
  },
  {
    id: "security", tone: "pink", phaseNumber: 4, code: "CODE 202",
    title: "CODE 202 · Bảo mật ứng dụng web",
    intro: {
      tagline: "Tự tấn công Nhịp, rồi vá từng lỗ hổng tận gốc.",
      learn: ["Mô hình mối đe doạ, CIA và OWASP Top 10", "SQL Injection và XSS", "CSRF, phiên đăng nhập, cookie và tải tệp", "Phân quyền, giới hạn tần suất và nhật ký"],
      challenge: "Mỗi lỗ hổng phải được chứng minh bằng một lần tấn công thử, và mỗi bản vá phải chặn được đúng lần tấn công đó.",
      promise: "Kết chặng: Nhịp qua được bảng rà soát bảo mật + thưởng 800 JOY.",
      reading: [
        { title: "OWASP Top 10", author: "OWASP Foundation", url: "https://owasp.org/www-project-top-ten/" },
        { title: "OWASP Cheat Sheet Series", author: "OWASP Foundation", url: "https://cheatsheetseries.owasp.org/" },
        { title: "Content Security Policy (CSP)", author: "Mozilla", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP" },
      ],
    },
  },
  {
    id: "project", tone: "indigo", phaseNumber: 5, code: "CODE 301",
    title: "CODE 301 · Hoàn thiện sản phẩm",
    intro: {
      tagline: "Từ chạy được tới đáng dùng: mã gọn, nhanh, dễ tiếp cận, nhiều tính năng.",
      learn: ["Tổ chức mã theo MVC gọn và Git", "Chỉ mục SQL, lỗi N+1, ảnh và khả năng tiếp cận", "Thông báo, hashtag và nhắc tên"],
      challenge: "Thêm tính năng mà không làm vỡ tính năng cũ.",
      promise: "Kết chặng: Nhịp đủ tính năng của một mạng xã hội nhỏ + thưởng 800 JOY.",
      reading: [
        { title: "Pro Git", author: "Chacon, S. and Straub, B.", url: "https://git-scm.com/book/en/v2" },
        { title: "Optimization and Indexes", author: "Oracle", url: "https://dev.mysql.com/doc/refman/8.4/en/optimization-indexes.html" },
        { title: "Web Content Accessibility Guidelines 2.2", author: "W3C", url: "https://www.w3.org/TR/WCAG22/" },
      ],
    },
    elite: true,
  },
  {
    id: "devops", tone: "orange", phaseNumber: 6, code: "CODE 302",
    title: "CODE 302 · Phân tích, triển khai và dự án hoàn tất",
    intro: {
      tagline: "Đưa Nhịp lên Internet miễn phí, đo người dùng, viết tài liệu và bảo vệ dự án hoàn tất.",
      learn: ["Phân tích sản phẩm và dữ liệu bằng SQL", "Triển khai PHP + MySQL lên hosting miễn phí", "Viết README và hướng dẫn sử dụng", "Dự án hoàn tất: 5 tính năng mới + 3 trang liên kết"],
      challenge: "Người lạ phải tự cài, tự dùng được sản phẩm của bạn chỉ bằng tài liệu bạn viết.",
      promise: "Vạch đích: dự án hoàn tất được duyệt — 4.000 JOY + Giấy chứng nhận của Hugo Studio.",
      reading: [
        { title: "InfinityFree — Free PHP & MySQL hosting", author: "InfinityFree", url: "https://www.infinityfree.com/" },
        { title: "Make a README", author: "Danny Guo", url: "https://www.makeareadme.com/" },
        { title: "Diátaxis documentation framework", author: "Procida, D.", url: "https://diataxis.fr/" },
      ],
    },
    elite: true,
  },
];

/**
 * Đề cương 26 step. Step nào đã soạn thì có tệp riêng trong ./steps/ (đặt
 * cùng id); step chưa soạn chỉ có đề cương và bị khoá là "đang soạn".
 */
export const OUTLINE = [
  // Chặng 1 — Nền tảng lập trình và Web
  ["basic", "Tư duy lập trình: thuật toán, biến và chương trình đầu tiên"],
  ["basic", "Web vận hành thế nào: client, server, HTTP và dự án Nhịp"],
  ["basic", "HTML ngữ nghĩa: dựng khung trang bảng tin và trang cá nhân"],
  ["basic", "CSS và bố cục: biến khung thành giao diện mạng xã hội"],
  ["basic", "JavaScript nền tảng: điều kiện, vòng lặp, hàm, mảng và đối tượng"],
  ["basic", "DOM và sự kiện: bảng tin Nhịp chạy được trên trình duyệt"],
  // Chặng 2 — PHP, SQL và localhost
  ["intermediate", "Dựng localhost: XAMPP, Apache, PHP và phpMyAdmin"],
  ["intermediate", "PHP nền tảng: cú pháp, mảng, hàm, include và biểu mẫu"],
  ["intermediate", "Cơ sở dữ liệu quan hệ: thiết kế lược đồ cho mạng xã hội"],
  ["intermediate", "SQL: truy vấn bảng tin, JOIN, gom nhóm và phân trang"],
  ["intermediate", "PDO: nối PHP với MySQL bằng prepared statement"],
  // Chặng 3 — CRUD mạng xã hội
  ["advanced", "Tài khoản: đăng ký, đăng nhập, session và băm mật khẩu"],
  ["advanced", "CRUD bài đăng: tạo, đọc, sửa, xoá có kiểm quyền sở hữu"],
  ["advanced", "Trang cá nhân: hồ sơ, ảnh đại diện và theo dõi"],
  ["advanced", "Tương tác: thả tim, trả lời lồng nhau, tìm kiếm và Fetch API"],
  // Chặng 4 — Bảo mật
  ["security", "Lý thuyết bảo mật: mô hình mối đe doạ, CIA và OWASP Top 10"],
  ["security", "SQL Injection và XSS: tấn công thử rồi vá tận gốc"],
  ["security", "CSRF, phiên đăng nhập, cookie và tải tệp an toàn"],
  ["security", "Phân quyền, giới hạn tần suất và nhật ký: rà soát bảo mật Nhịp"],
  // Chặng 5 — Hoàn thiện sản phẩm
  ["project", "Tổ chức mã: MVC gọn, router và Git"],
  ["project", "Hiệu năng và trải nghiệm: chỉ mục, lỗi N+1, ảnh và khả năng tiếp cận"],
  ["project", "Thông báo, hashtag và nhắc tên"],
  // Chặng 6 — Phân tích, triển khai và dự án hoàn tất
  ["devops", "Phân tích sản phẩm và dữ liệu: yêu cầu, chỉ số và truy vấn thống kê"],
  ["devops", "Triển khai miễn phí: đưa PHP + MySQL lên Internet"],
  ["devops", "Viết tài liệu: README, hướng dẫn cài đặt và sử dụng"],
  ["devops", "Dự án hoàn tất: 5 tính năng mới và 3 trang liên kết"],
];

/** Qua một step: bài trắc nghiệm cuối step đạt từ mức này (máy chủ chấm lại). */
export const STEP_PASS_PERCENT = 60;
/** Trần số slide của một step, tính cả câu trắc nghiệm. */
export const MAX_SLIDES = 35;

export const STEP_IDS = OUTLINE.map((_, index) => `step${index + 1}`);

// Ranh giới chặng suy ra từ đề cương: thêm/bớt step là chặng tự tính lại.
export const STAGES = STAGE_DEFS.map((stage) => {
  const from = OUTLINE.findIndex(([stageId]) => stageId === stage.id);
  const to = from + OUTLINE.filter(([stageId]) => stageId === stage.id).length;
  return { ...stage, from, to, rangeText: `Step ${from + 1} – ${to}` };
});
