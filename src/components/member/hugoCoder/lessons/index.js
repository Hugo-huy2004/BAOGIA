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

// Ranh giới 6 chặng dùng chung cho sidebar/guidebook/tier
export const STAGES = [
  { id: "basic", phaseNumber: 1, title: "Chặng 1: Phản Xạ Cơ Bản", rangeText: "Bài 1 - 10", from: 0, to: 10 },
  { id: "intermediate", phaseNumber: 2, title: "Chặng 2: Tư Duy Kiến Trúc", rangeText: "Bài 11 - 25", from: 10, to: 25 },
  { id: "advanced", phaseNumber: 3, title: "Chặng 3: CTDL, Giải Thuật & Mật Mã", rangeText: "Bài 26 - 50", from: 25, to: 50 },
  { id: "security", phaseNumber: 4, title: "Chặng 4: Kỹ Sư Bảo Mật & Tiền Đề AI", rangeText: "Bài 51 - 70", from: 50, to: 70 },
  { id: "project", phaseNumber: 5, title: "Chặng 5: Siêu Đồ Án Full-Stack & AI", rangeText: "Bài 71 - 90", from: 70, to: 90 },
  { id: "devops", phaseNumber: 6, title: "Chặng 6: Kỹ Sư DevOps & Phát Hành", rangeText: "Bài 91 - 100", from: 90, to: 100 }
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
