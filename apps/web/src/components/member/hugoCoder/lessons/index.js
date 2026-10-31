// Đuôi .js tường minh để server Node import chung (lessonController, chấm trắc nghiệm).
import { OUTLINE, STAGES, STEP_IDS } from "./stages.js";
import step1 from "./steps/step1.js";
import step2 from "./steps/step2.js";
import step3 from "./steps/step3.js";
import step4 from "./steps/step4.js";
import step5 from "./steps/step5.js";
import step6 from "./steps/step6.js";
import step7 from "./steps/step7.js";
import step8 from "./steps/step8.js";
import step9 from "./steps/step9.js";
import step10 from "./steps/step10.js";
import step11 from "./steps/step11.js";
import step12 from "./steps/step12.js";
import step13 from "./steps/step13.js";
import step14 from "./steps/step14.js";
import step15 from "./steps/step15.js";
import step16 from "./steps/step16.js";
import step17 from "./steps/step17.js";
import step18 from "./steps/step18.js";
import step19 from "./steps/step19.js";
import step20 from "./steps/step20.js";
import step21 from "./steps/step21.js";
import step22 from "./steps/step22.js";
import step23 from "./steps/step23.js";
import step24 from "./steps/step24.js";
import step25 from "./steps/step25.js";
import step26 from "./steps/step26.js";

export { STAGES, STEP_IDS, STEP_PASS_PERCENT, MAX_SLIDES } from "./stages.js";

const WRITTEN = new Map([step1, step2, step3, step4, step5, step6, step7, step8, step9, step10, step11, step12, step13, step14, step15, step16, step17, step18, step19, step20, step21, step22, step23, step24, step25, step26].map((step) => [step.id, step]));

/**
 * 26 step của khoá Coding, đúng thứ tự học. Step chưa soạn mang `draft: true`:
 * bản đồ vẫn hiện để người học thấy cả lộ trình, nhưng không mở được.
 */
export const WEB_COURSES = OUTLINE.map(([stage, title], index) => {
  const id = STEP_IDS[index];
  const content = WRITTEN.get(id);
  return {
    lang: "html",
    file: "",
    duration: "",
    ...content,
    id,
    stage,
    title: `${index + 1}. ${title}`,
    practiceType: "slides",
    ...(content ? {} : { draft: true, slides: [], quiz: [] }),
  };
});

// Quyền lợi của từng gói chặng — hiển thị TRƯỚC khi thanh toán.
export function getStageBenefits(stageId) {
  const stage = STAGES.find((s) => s.id === stageId);
  if (!stage) return [];
  const steps = WEB_COURSES.slice(stage.from, stage.to);
  const benefits = [
    `${steps.length} step chuyên sâu (${stage.rangeText}) — mỗi step tối đa 35 slide: giới thiệu, minh hoạ, học thuật, lên ý tưởng, kiến thức chính, áp dụng vào dự án, trắc nghiệm`,
    "Trắc nghiệm cuối mỗi step chấm tại máy chủ, đạt từ 60% mới qua",
    "Chứng nhận hoàn thành chặng ghi vào hồ sơ học tập của bạn",
  ];
  if ([3, 4, 5].includes(stage.phaseNumber)) benefits.push("Thưởng hoàn thành chặng +800 JOY");
  if (stage.id === "devops") benefits.push("Dự án hoàn tất được duyệt: thưởng 4.000 JOY");
  benefits.push("Sở hữu vĩnh viễn + nhận mọi cập nhật nội dung sau này");
  return benefits;
}
