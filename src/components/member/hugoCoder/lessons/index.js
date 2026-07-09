import { BASIC_LESSONS } from "./basic";
import { INTERMEDIATE_LESSONS } from "./intermediate";
import { ADVANCED_LESSONS } from "./advanced";
import { SECURITY_LESSONS } from "./security";
import { EXAM_LESSONS } from "./exam";
import { OPTIMIZE_LESSONS } from "./optimize";
import { ULTIMATE_LESSONS } from "./ultimate";

export const WEB_COURSES = [
  ...BASIC_LESSONS,
  ...INTERMEDIATE_LESSONS,
  ...ADVANCED_LESSONS,
  ...SECURITY_LESSONS,
  ...EXAM_LESSONS,
  ...OPTIMIZE_LESSONS,
  ...ULTIMATE_LESSONS
];

function getVisualTypeForLesson(id) {
  const num = parseInt(id.replace("lesson", ""), 10);
  if (num === 1) return "htmlTree";
  if (num === 2) return "boxModel";
  if (num === 3) return "eventFlow";
  if (num === 4) return "apiFlow";
  if (num === 5) return "sqlPipeline";
  if (num === 6) return "phpFlow";
  if (num === 7) return "debugTree";
  if (num === 8) return "flexboxPreview";
  if (num === 9) return "fullstackArchitecture";
  if (num === 10) return "securityVault";
  
  // Phase 2: Intermediate
  if (num === 11 || num === 12) return "apiFlow";
  if (num === 13) return "fullstackArchitecture";
  if (num === 14 || num === 15) return "sqlPipeline";
  if (num === 16 || num === 17) return "boxModel";
  if (num === 18 || num === 19) return "flexboxPreview";
  if (num === 20) return "eventFlow";
  if (num === 21 || num === 22) return "securityVault";
  if (num === 23 || num === 24) return "htmlTree";
  
  // Phase 3: Advanced
  if (num >= 26 && num <= 30) return "debugTree";
  if (num >= 31 && num <= 34) return "securityVault";
  if (num === 35 || num === 36) return "apiFlow";
  if (num >= 37 && num <= 40) return "boxModel";
  if (num === 41 || num === 42) return "sqlPipeline";
  if (num === 43 || num === 44) return "htmlTree";
  if (num >= 45 && num <= 47) return "phpFlow";
  if (num >= 48) return "fullstackArchitecture";
  
  // Phase 4: Security
  if (num >= 51 && num <= 60) return "securityVault";
  
  // Phase 5: Exams
  if (num >= 61 && num <= 62) return "eventFlow";
  
  // Phase 6: Optimize & AI
  if (num >= 63 && num <= 70) return "apiFlow";
  
  // Phase 7: Ultimate
  return "fullstackArchitecture";
}

// Compile MOBILE_GUIDE_EXTRAS dynamically from the course definitions
export const MOBILE_GUIDE_EXTRAS = {};

WEB_COURSES.forEach(course => {
  const match = course.theory.match(/### LÝ THUYẾT & ĐỊNH NGHĨA\n([\s\S]*?)(?=\n\n###|$)/);
  const mentalModel = match ? match[1].trim() : "";
  
  MOBILE_GUIDE_EXTRAS[course.id] = {
    visualType: getVisualTypeForLesson(course.id),
    mentalModel: mentalModel,
    keyIdeas: course.tasks || [],
    deepDive: [],
    commonMistakes: [],
    quiz: course.miniQuiz?.map(q => q.q) || [],
    demoCode: course.starterCode || ""
  };
});
