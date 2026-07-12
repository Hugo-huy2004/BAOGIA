import { BASIC_LESSONS } from "./basic";
import { INTERMEDIATE_LESSONS } from "./intermediate";
import { ADVANCED_LESSONS } from "./advanced";
import { SECURITY_LESSONS } from "./security";
import { PROJECT_LESSONS } from "./project";
import { DEVOPS_LESSONS } from "./devops";

// 6 chặng — 100 bài:
// 1 (1-10) Phản xạ cơ bản • 2 (11-25) Tư duy kiến trúc
// 3 (26-50) CTDL, giải thuật & mật mã • 4 (51-70) Bảo mật & tiền đề AI
// 5 (71-90) Siêu đồ án Full-Stack & AI • 6 (91-100) DevOps & phát hành
export const WEB_COURSES = [
  ...BASIC_LESSONS,
  ...INTERMEDIATE_LESSONS,
  ...ADVANCED_LESSONS,
  ...SECURITY_LESSONS,
  ...PROJECT_LESSONS,
  ...DEVOPS_LESSONS
];

// Ranh giới 6 chặng dùng chung cho sidebar/guidebook/tier.
// intro: hiển thị trước bài đầu tiên của chặng — kiến thức sẽ học,
// thách thức và lời hứa khi hoàn thành.
export const STAGES = [
  {
    id: "basic", phaseNumber: 1, title: "Chặng 1: Phản Xạ Cơ Bản", rangeText: "Bài 1 - 10", from: 0, to: 10,
    intro: {
      tagline: "Gõ đi gõ lại cho đến khi thuộc lòng — nền móng của mọi kỹ sư.",
      learn: ["Semantic HTML & khung tài liệu chuẩn", "CSS Box Model & code sạch chuẩn BEM", "JavaScript ES6+ & DOM Events", "SQL CRUD, PHP + PDO & kỹ thuật debug"],
      challenge: "Mỗi bài phải gõ lại tối thiểu 2 lần không nhìn tài liệu — chưa cần tư duy cao siêu, cần thuộc cú pháp trước đã.",
      promise: "Kết chặng: tay bạn tự gõ được khung web + truy vấn dữ liệu mà không cần Google từng dòng."
    }
  },
  {
    id: "intermediate", phaseNumber: 2, title: "Chặng 2: Tư Duy Kiến Trúc", rangeText: "Bài 11 - 25", from: 10, to: 25,
    intro: {
      tagline: "Thoát ly code thô — bắt đầu suy nghĩ như người thiết kế hệ thống.",
      learn: ["Thiết kế schema, JOIN & transaction ACID", "MVC, RESTful API & JSON chuẩn", "UI/UX theo chuẩn WCAG + toán ứng dụng", "CORS/CSP, DRY & SEO kỹ thuật"],
      challenge: "Không còn bài tập chép mẫu — bạn phải tự phán đoán: đặt gì ở tầng nào, chuẩn nào áp cho tình huống nào.",
      promise: "Kết chặng: đọc một yêu cầu là phác được kiến trúc dữ liệu + API + giao diện trong đầu."
    }
  },
  {
    id: "advanced", phaseNumber: 3, title: "Chặng 3: CTDL, Giải Thuật & Mật Mã", rangeText: "Bài 26 - 50", from: 25, to: 50,
    intro: {
      tagline: "Phần lõi khoa học máy tính — thứ phân biệt kỹ sư với thợ code.",
      learn: ["Array, Linked List, Stack, Queue, Hash Table", "Tìm kiếm, sắp xếp & phân tích Big O", "AES/RSA, hash & salt, encoding, tam giác CIA", "Event Loop, WebSockets, hiệu năng, PWA & unit test"],
      challenge: "25 bài dày đặc nhất lộ trình — mỗi thuật toán phải tự cài chạy được, mỗi khái niệm phải đo bằng số liệu thật.",
      promise: "Kết chặng: bạn nhìn code là ước được độ phức tạp, nhìn hệ thống là chỉ được điểm nghẽn + nhận thưởng +800 JOY."
    }
  },
  {
    id: "security", phaseNumber: 4, title: "Chặng 4: Kỹ Sư Bảo Mật & Tiền Đề AI", rangeText: "Bài 51 - 70", from: 50, to: 70,
    intro: {
      tagline: "Chống lại tấn công mạng thật và đưa trí tuệ nhân tạo vào sản phẩm.",
      learn: ["HTTPS/TLS, XSS, CSRF, JWT & OAuth2 theo chuẩn OWASP", "2 kỳ thi tổng hợp 25 câu rà toàn bộ kiến thức", "Gemini API, multimodal & Structured Outputs", "SRS, kiến trúc, Git chuyên nghiệp, seeding & tài liệu"],
      challenge: "Vượt 2 bài kiểm tra tổng hợp (≥60%) và viết trọn bộ hồ sơ dự án — cửa ải cuối trước khi vào đồ án thật.",
      promise: "Kết chặng: đủ vũ khí bảo mật + AI + quy trình để tự tin khởi công sản phẩm thật + nhận thưởng +800 JOY."
    }
  },
  {
    id: "project", phaseNumber: 5, title: "Chặng 5: Siêu Đồ Án Full-Stack & AI", rangeText: "Bài 71 - 90", from: 70, to: 90,
    intro: {
      tagline: "20 cột mốc — một sản phẩm: tự tay code toàn bộ hệ thống từ số 0.",
      learn: ["Backend OOP + CRUD + JWT auth hoàn chỉnh", "Frontend hiện đại: router, store, i18n, responsive", "Chat realtime WebSocket + upload ảnh có nén", "AI moderation, chatbot, insights + kiểm thử & release v1.0.0"],
      challenge: "Không còn bài tập — mỗi bài là một phần sản phẩm TỐT NGHIỆP của chính bạn, tuần nào cũng phải có commit cột mốc.",
      promise: "Kết chặng: repo v1.0.0 hoàn chỉnh chuẩn thương mại mang đi phỏng vấn được + nhận thưởng +800 JOY."
    }
  },
  {
    id: "devops", phaseNumber: 6, title: "Chặng 6: Kỹ Sư DevOps & Phát Hành", rangeText: "Bài 91 - 100", from: 90, to: 100,
    intro: {
      tagline: "Đưa sản phẩm ra Internet thật — đón người dùng thật.",
      learn: ["Thuê & cứng hóa VPS, môi trường Node/MySQL production", "Nginx reverse proxy, DNS + SSL Let's Encrypt", "Tường lửa UFW/Fail2ban, PM2 & quản lý log", "Load test, deploy có rollback & bảo vệ đồ án"],
      challenge: "Máy chủ thật, tên miền thật, bot tấn công thật — mọi cấu hình sai đều có hậu quả nhìn thấy được.",
      promise: "Vạch đích: sản phẩm sống trên Internet, 4.000 JOY + Giấy chứng nhận Kỹ sư Full-Stack Web của Hugo Studio."
    }
  }
];

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
