import { auditCoderContent } from "../shared/coderContentIntegrity.js";
import { STAGES, WEB_COURSES } from "../src/components/member/hugoCoder/lessons/index.js";

const result = auditCoderContent(WEB_COURSES, STAGES);
if (!result.valid) {
  console.error(`Coder content invalid (${result.issues.length} lỗi):`);
  result.issues.forEach((issue) => console.error(`- ${issue}`));
  process.exitCode = 1;
} else {
  console.log(`Coder content OK: ${result.courseCount} bài, ${result.questionCount} câu hỏi có đáp án hợp lệ.`);
}
