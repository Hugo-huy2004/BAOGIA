// Đuôi .js tường minh để server Node import chung được bộ đề (coderExamService)
import { BASIC_LESSONS } from "./basic.js";
import { INTERMEDIATE_LESSONS } from "./intermediate.js";
import { ADVANCED_LESSONS } from "./advanced.js";
import { SECURITY_LESSONS } from "./security.js";
import { PROJECT_LESSONS } from "./project.js";
import { DEVOPS_LESSONS } from "./devops.js";
import { withVariedQuestions } from "./variedQuestions.js";
import { withExamBanks } from "./examBanks/index.js";

// 6 chặng — 100 bài:
// 1 (1-10) Phản xạ cơ bản • 2 (11-25) Tư duy kiến trúc
// 3 (26-50) CTDL, giải thuật & mật mã • 4 (51-70) Bảo mật & tiền đề AI
// 5 (71-90) Siêu đồ án Full-Stack & AI • 6 (91-100) DevOps & phát hành
// Lớp câu hỏi đa dạng ghép ở đây (xem variedQuestions.js): nội dung bài giảng
// và hình thức kiểm tra đổi theo nhịp khác nhau, trộn lẫn thì mỗi lần thêm một
// dạng câu hỏi lại phải mở sáu file dài hai nghìn dòng.
export const WEB_COURSES = withExamBanks(withVariedQuestions([
  ...BASIC_LESSONS,
  ...INTERMEDIATE_LESSONS,
  ...ADVANCED_LESSONS,
  ...SECURITY_LESSONS,
  ...PROJECT_LESSONS,
  ...DEVOPS_LESSONS
]));

// Ranh giới 6 chặng dùng chung cho sidebar/guidebook/tier.
// intro: hiển thị trước bài đầu tiên của chặng — kiến thức sẽ học,
// thách thức và lời hứa khi hoàn thành.
export const STAGES = [
  {
    id: "basic", tone: "blue", phaseNumber: 1, title: "WEB 101 · Nền tảng và Phản xạ Lập trình", rangeText: "Bài 1 - 10", from: 0, to: 10,
    intro: {
      tagline: "Gõ đi gõ lại cho đến khi thuộc lòng — nền móng của mọi kỹ sư.",
      learn: ["Semantic HTML & khung tài liệu chuẩn", "CSS Box Model & code sạch chuẩn BEM", "JavaScript ES6+ & DOM Events", "SQL CRUD, PHP + PDO & kỹ thuật debug"],
      challenge: "Mỗi bài phải gõ lại tối thiểu 2 lần không nhìn tài liệu — chưa cần tư duy cao siêu, cần thuộc cú pháp trước đã.",
      promise: "Kết chặng: tay bạn tự gõ được khung web + truy vấn dữ liệu mà không cần Google từng dòng.",
      reading: [{"title": "MDN Web Docs — HTML/CSS/JavaScript", "author": "Mozilla", "url": "https://developer.mozilla.org/vi/docs/Learn"}, {"title": "freeCodeCamp — Responsive Web Design", "author": "freeCodeCamp", "url": "https://www.freecodecamp.org/learn/2022/responsive-web-design/"}, {"title": "The Odin Project — Foundations", "author": "The Odin Project", "url": "https://www.theodinproject.com/paths/foundations"}]
    }
  },
  {
    id: "intermediate", tone: "green", phaseNumber: 2, title: "WEB 102 · Tư duy Kiến trúc Hệ thống", rangeText: "Bài 11 - 25", from: 10, to: 25,
    intro: {
      tagline: "Thoát ly code thô — bắt đầu suy nghĩ như người thiết kế hệ thống.",
      learn: ["Thiết kế schema, JOIN & transaction ACID", "MVC, RESTful API & JSON chuẩn", "UI/UX theo chuẩn WCAG + toán ứng dụng", "CORS/CSP, DRY & SEO kỹ thuật"],
      challenge: "Không còn bài tập chép mẫu — bạn phải tự phán đoán: đặt gì ở tầng nào, chuẩn nào áp cho tình huống nào.",
      promise: "Kết chặng: đọc một yêu cầu là phác được kiến trúc dữ liệu + API + giao diện trong đầu.",
      reading: [{"title": "Eloquent JavaScript (miễn phí)", "author": "Marijn Haverbeke", "url": "https://eloquentjavascript.net/"}, {"title": "REST API Tutorial", "author": "restfulapi.net", "url": "https://restfulapi.net/"}, {"title": "Refactoring Guru — Design Patterns & MVC", "author": "Refactoring Guru", "url": "https://refactoring.guru/design-patterns"}, {"title": "Web Content Accessibility Guidelines (WCAG)", "author": "W3C", "url": "https://www.w3.org/WAI/standards-guidelines/wcag/"}]
    }
  },
  {
    id: "advanced", tone: "purple", phaseNumber: 3, title: "WEB 201 · Giải thuật, Dữ liệu và Mật mã", rangeText: "Bài 26 - 50", from: 25, to: 50,
    intro: {
      tagline: "Phần lõi khoa học máy tính — thứ phân biệt kỹ sư với thợ code.",
      learn: ["Array, Linked List, Stack, Queue, Hash Table", "Tìm kiếm, sắp xếp & phân tích Big O", "AES/RSA, hash & salt, encoding, tam giác CIA", "Event Loop, WebSockets, hiệu năng, PWA & unit test"],
      challenge: "25 bài dày đặc nhất lộ trình — mỗi thuật toán phải tự cài chạy được, mỗi khái niệm phải đo bằng số liệu thật.",
      promise: "Kết chặng: bạn nhìn code là ước được độ phức tạp, nhìn hệ thống là chỉ được điểm nghẽn + nhận thưởng +800 JOY.",
      reading: [{"title": "Grokking Algorithms (sách nền tảng giải thuật)", "author": "Aditya Bhargava", "url": "https://www.manning.com/books/grokking-algorithms"}, {"title": "Big-O Cheat Sheet", "author": "Eric Rowell", "url": "https://www.bigocheatsheet.com/"}, {"title": "web.dev — Performance & Core Web Vitals", "author": "Google", "url": "https://web.dev/learn/performance"}, {"title": "MDN — Web Crypto API", "author": "Mozilla", "url": "https://developer.mozilla.org/docs/Web/API/Web_Crypto_API"}]
    }
  },
  {
    id: "security", tone: "pink", phaseNumber: 4, title: "WEB 202 · Bảo mật Ứng dụng và AI", rangeText: "Bài 51 - 70", from: 50, to: 70,
    intro: {
      tagline: "Chống lại tấn công mạng thật và đưa trí tuệ nhân tạo vào sản phẩm.",
      learn: ["HTTPS/TLS, XSS, CSRF, JWT & OAuth2 theo chuẩn OWASP", "2 kỳ thi tổng hợp 25 câu rà toàn bộ kiến thức", "Gemini API, multimodal & Structured Outputs", "SRS, kiến trúc, Git chuyên nghiệp, seeding & tài liệu"],
      challenge: "Vượt 2 bài kiểm tra tổng hợp (≥60%) và viết trọn bộ hồ sơ dự án — cửa ải cuối trước khi vào đồ án thật.",
      promise: "Kết chặng: đủ vũ khí bảo mật + AI + quy trình để tự tin khởi công sản phẩm thật + nhận thưởng +800 JOY.",
      reading: [{"title": "OWASP Top 10", "author": "OWASP Foundation", "url": "https://owasp.org/www-project-top-ten/"}, {"title": "OWASP Cheat Sheet Series", "author": "OWASP Foundation", "url": "https://cheatsheetseries.owasp.org/"}, {"title": "JWT.io — Introduction to JSON Web Tokens", "author": "Auth0", "url": "https://jwt.io/introduction"}, {"title": "Google AI — Gemini API Docs", "author": "Google", "url": "https://ai.google.dev/gemini-api/docs"}]
    }
  },
  {
    id: "project", tone: "indigo", phaseNumber: 5, title: "WEB 301 · Đồ án Full-stack và AI", rangeText: "Bài 71 - 90", from: 70, to: 90,
    intro: {
      tagline: "20 cột mốc — một sản phẩm: tự tay code toàn bộ hệ thống từ số 0.",
      learn: ["Backend OOP + CRUD + JWT auth hoàn chỉnh", "Frontend hiện đại: router, store, i18n, responsive", "Chat realtime WebSocket + upload ảnh có nén", "AI moderation, chatbot, insights + kiểm thử & release v1.0.0"],
      challenge: "Không còn bài tập — mỗi bài là một phần sản phẩm TỐT NGHIỆP của chính bạn, tuần nào cũng phải có commit cột mốc.",
      promise: "Kết chặng: repo v1.0.0 hoàn chỉnh chuẩn thương mại mang đi phỏng vấn được + nhận thưởng +800 JOY.",
      reading: [{"title": "The Twelve-Factor App", "author": "Heroku", "url": "https://12factor.net/"}, {"title": "Vite — Hướng dẫn chính thức", "author": "Vite", "url": "https://vitejs.dev/guide/"}, {"title": "Socket.IO — Realtime docs", "author": "Socket.IO", "url": "https://socket.io/docs/v4/"}, {"title": "Testing JavaScript", "author": "Kent C. Dodds", "url": "https://testingjavascript.com/"}]
    },
    elite: true
  },
  {
    id: "devops", tone: "orange", phaseNumber: 6, title: "WEB 302 · DevOps và Phát hành Sản phẩm", rangeText: "Bài 91 - 100", from: 90, to: 100,
    intro: {
      tagline: "Đưa sản phẩm ra Internet thật — đón người dùng thật.",
      learn: ["Thuê & cứng hóa VPS, môi trường Node/MySQL production", "Nginx reverse proxy, DNS + SSL Let's Encrypt", "Tường lửa UFW/Fail2ban, PM2 & quản lý log", "Load test, deploy có rollback & bảo vệ đồ án"],
      challenge: "Máy chủ thật, tên miền thật, bot tấn công thật — mọi cấu hình sai đều có hậu quả nhìn thấy được.",
      promise: "Vạch đích: sản phẩm sống trên Internet, 4.000 JOY + Giấy chứng nhận Kỹ sư Full-Stack Web của Hugo Studio.",
      reading: [{"title": "DigitalOcean Community Tutorials", "author": "DigitalOcean", "url": "https://www.digitalocean.com/community/tutorials"}, {"title": "Nginx — Official Docs", "author": "Nginx", "url": "https://nginx.org/en/docs/"}, {"title": "Let's Encrypt — Getting Started", "author": "Let's Encrypt", "url": "https://letsencrypt.org/getting-started/"}, {"title": "PM2 — Process Manager Docs", "author": "PM2", "url": "https://pm2.keymetrics.io/docs/usage/quick-start/"}]
    },
    elite: true
  }
];

// Một đường dẫn chính theo chủ đề cho TỪNG bài. Đây là tài liệu để mở ngay
// khi vấp ở bài hiện tại; danh sách đọc của chặng bên dưới vẫn là phần đào sâu.
// Chỉ dùng tài liệu chính thức hoặc tổ chức chuẩn, không nhét link blog vô danh.
const LESSON_READING_TRACKS = [
  [5, "MDN Learn — HTML, CSS và JavaScript", "Mozilla", "https://developer.mozilla.org/en-US/docs/Learn_web_development", "Đọc đúng nền tảng rồi quay lại tự làm lại bài, không chép đáp án."],
  [8, "MySQL 8.4 Reference Manual", "Oracle", "https://dev.mysql.com/doc/refman/8.4/en/", "Tra cú pháp SQL và transaction bằng tài liệu của chính hệ quản trị."],
  [15, "HTTP Semantics (RFC 9110)", "IETF", "https://www.rfc-editor.org/rfc/rfc9110", "Đối chiếu method và status code với chuẩn giao thức thật."],
  [17, "Web Content Accessibility Guidelines (WCAG)", "W3C", "https://www.w3.org/WAI/standards-guidelines/wcag/", "Kiểm tra tương phản, nhãn và thao tác bàn phím trên giao diện của bạn."],
  [25, "MDN — JavaScript Guide", "Mozilla", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", "Dùng ví dụ ngắn để kiểm tra lại logic trước khi chạy code."],
  [30, "JavaScript data structures", "MDN", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Keyed_collections", "So sánh cấu trúc dữ liệu với bài toán thực tế trước khi chọn thuật toán."],
  [35, "Web Crypto API", "MDN", "https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API", "Dùng API đã được kiểm tra thay vì tự cài thuật toán mật mã."],
  [37, "Asynchronous JavaScript", "MDN", "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Async_JS", "Chạy từng ví dụ nhỏ để quan sát Promise và event loop hoạt động."],
  [43, "Learn Performance", "web.dev", "https://web.dev/learn/performance", "Đo LCP, INP, CLS trên trang thật thay vì đoán bằng cảm giác."],
  [48, "Progressive web apps", "MDN", "https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps", "Áp dụng từng phần: manifest, service worker, rồi mới thử offline."],
  [50, "Vitest Guide", "Vitest", "https://vitest.dev/guide/", "Viết một ca kiểm thử cho hành vi có thể hỏng, không chỉ kiểm tra biến tồn tại."],
  [58, "OWASP Cheat Sheet Series", "OWASP Foundation", "https://cheatsheetseries.owasp.org/", "Chuyển từng rủi ro bảo mật trong bài thành một kiểm soát có thể kiểm chứng."],
  [60, "Learn Performance", "web.dev", "https://web.dev/learn/performance", "Lấy số liệu từ DevTools hoặc dữ liệu thực địa trước khi tối ưu."],
  [64, "Gemini API Documentation", "Google AI", "https://ai.google.dev/gemini-api/docs", "Giữ khoá ở máy chủ, xác thực dữ liệu đầu ra và thử với dữ liệu biên."],
  [66, "Software Engineering Body of Knowledge", "IEEE Computer Society", "https://www.computer.org/education/bodies-of-knowledge/software-engineering", "Dùng yêu cầu và quyết định kiến trúc để giải thích lựa chọn của bạn."],
  [67, "Pro Git", "Git SCM", "https://git-scm.com/book/en/v2", "Thử trên branch riêng và đọc diff trước khi merge hoặc revert."],
  [69, "OpenAPI Specification", "OpenAPI Initiative", "https://spec.openapis.org/oas/latest.html", "Mô tả endpoint, input và lỗi trước khi nối frontend với backend."],
  [73, "Express 5 API", "Express", "https://expressjs.com/en/5x/api.html", "Xác thực ở middleware, lấy danh tính từ token đã kiểm tra và thử cả nhánh lỗi."],
  [82, "React Learn", "React", "https://react.dev/learn", "Chia component theo trách nhiệm, rồi đo lại phần tải trước khi lazy-load."],
  [85, "Using files from web applications", "MDN", "https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications", "Kiểm tra loại, kích thước và xử lý lỗi ở server, không tin metadata từ browser."],
  [88, "Gemini API Documentation", "Google AI", "https://ai.google.dev/gemini-api/docs", "Ràng buộc schema, nhưng vẫn xác thực giá trị trước khi lưu hoặc hiển thị."],
  [90, "Semantic Versioning", "semver.org", "https://semver.org/", "Tag bản phát hành từ commit đã qua kiểm tra và ghi rõ thay đổi cho người dùng."],
  [100, "Nginx Documentation", "F5 NGINX", "https://nginx.org/en/docs/", "Thử cấu hình trong môi trường an toàn, kiểm tra health check rồi mới phát hành."],
];

export function getLessonReading(course) {
  const ownResources = course?.resources || [];
  if (ownResources.length) return ownResources;
  const lessonNumber = Number(String(course?.id || "").replace("lesson", ""));
  const track = LESSON_READING_TRACKS.find(([lastLesson]) => lessonNumber <= lastLesson);
  if (!track) return [];
  const [, title, author, url, note] = track;
  return [{ title, author, url, note }];
}


// Quyền lợi cụ thể của từng gói chặng — hiển thị TRƯỚC khi thanh toán
// để học viên biết rõ trong gói có gì.
export function getStageBenefits(stageId) {
  const stage = STAGES.find((s) => s.id === stageId);
  if (!stage) return [];
  const lessons = WEB_COURSES.slice(stage.from, stage.to);
  const examCount = lessons.filter((l) => l.practiceType === "quiz").length;

  const benefits = [
    `${lessons.length} bài học chuyên sâu (${stage.rangeText}) — khung 5 phần: mục tiêu, lý thuyết, thực hành, bẫy lỗi, thử thách`
  ];
  if (examCount > 0) {
    benefits.push(`${examCount} bài kiểm tra chấm tại máy chủ — MỖI BÀI 1 lượt thi trong gói (thi lại 250 JOY/lượt)`);
  }
  benefits.push("Giấy chứng nhận chặng công khai — link chia sẻ, xác thực trực tuyến, in/lưu PDF");
  if ([3, 4, 5].includes(stage.phaseNumber)) {
    benefits.push("Thưởng hoàn thành chặng +800 JOY");
  }
  if (stage.id === "project") {
    benefits.push("20 cột mốc xây sản phẩm tốt nghiệp của chính bạn (repo v1.0.0 chuẩn thương mại)");
  }
  if (stage.id === "devops") {
    benefits.push("Bảo vệ đồ án tốt nghiệp: thưởng 4.000 JOY + Giấy chứng nhận Kỹ sư Full-Stack + quà VVIP");
  }
  benefits.push("Sở hữu vĩnh viễn + nhận mọi cập nhật nội dung sau này");
  return benefits;
}

// Chọn hình minh họa theo chủ đề bài học (các loại có sẵn trong VisualIllustrations)
function getVisualTypeForLesson(id, lesson) {
  const num = parseInt(id.replace("lesson", ""), 10);
  const lang = lesson?.lang || "html";

  // Chặng 1 — phản xạ cú pháp
  if (num === 1) return "htmlTree";
  if (num === 2) return "boxModel";
  if (num <= 4) return "htmlTree";
  if (num === 5) return "eventFlow";
  if (num === 6) return "debugTree";
  if (num === 7) return "sqlPipeline";
  if (num === 8) return "phpFlow";
  if (num === 9) return "debugTree";
  if (num === 10) return "flexboxPreview";

  // Chặng 2 — kiến trúc
  if (num <= 12) return "sqlPipeline";
  if (num === 13) return "fullstackArchitecture";
  if (num <= 15) return "apiFlow";
  if (num <= 17) return "boxModel";
  if (num <= 20) return "eventFlow";
  if (num === 21) return "securityVault";
  if (num <= 24) return "htmlTree";
  if (num === 25) return "debugTree";

  // Chặng 3 — CS lõi
  if (num <= 30) return "debugTree";
  if (num <= 35) return "securityVault";
  if (num === 36) return "eventFlow";
  if (num === 37) return "apiFlow";
  if (num <= 41) return "boxModel";
  if (num <= 43) return "sqlPipeline";
  if (num <= 45) return "htmlTree";
  if (num <= 48) return "fullstackArchitecture";
  if (num <= 50) return "debugTree";

  // Chặng 4 — bảo mật & AI
  if (num <= 58) return "securityVault";
  if (num <= 60) return "debugTree";
  if (num <= 64) return "apiFlow";
  if (num <= 70) return "fullstackArchitecture";

  // Chặng 5 — đồ án
  if (num <= 73) return "fullstackArchitecture";
  if (num <= 76) return "htmlTree";
  if (num <= 78) return "apiFlow";
  if (num <= 81) return "flexboxPreview";
  if (num === 82) return "boxModel";
  if (num <= 84) return "eventFlow";
  if (num <= 88) return "apiFlow";
  if (num <= 90) return "debugTree";

  // Chặng 6 — DevOps
  if (num <= 93) return lang === "sql" ? "sqlPipeline" : "phpFlow";
  if (num <= 97) return "fullstackArchitecture";
  return "securityVault";
}

// Dữ liệu hiển thị mobile — sinh từ khung 5 phần của mỗi bài học
export const MOBILE_GUIDE_EXTRAS = {};

WEB_COURSES.forEach((course) => {
  MOBILE_GUIDE_EXTRAS[course.id] = {
    visualType: getVisualTypeForLesson(course.id, course),
    // Phần 1 — Tổng quan & Mục tiêu
    mentalModel: course.overview?.description || "",
    keyIdeas: course.overview?.outcomes || course.tasks || [],
    // Phần 3 — Thực hành & Code Lab (từng bước)
    deepDive: (course.labSteps || []).map((step, i) => ({
      title: `Bước ${i + 1}`,
      body: step
    })),
    // Phần 4 — Bẫy lỗi & Cách khắc phục
    commonMistakes: (course.commonMistakes || []).map(
      (m) => `${m.symptom} — Nguyên nhân: ${m.cause} Cách sửa: ${m.fix}`
    ),
    // Phần 5 — Tự hỏi nhanh (câu hỏi của miniQuiz)
    quiz: course.miniQuiz?.map((q) => q.q) || [],
    demoCode: course.starterCode || ""
  };
});
