// Khoá SQL — cùng hình dạng với ../coding/index.js; ../index.js đăng ký nó cho API (?course=sql).
import { OUTLINE, STEP_IDS } from "./stages.js";
import sql1 from "./steps/sql1.js";
import sql2 from "./steps/sql2.js";
import sql3 from "./steps/sql3.js";
import sql4 from "./steps/sql4.js";
import sql5 from "./steps/sql5.js";
import sql6 from "./steps/sql6.js";
import sql7 from "./steps/sql7.js";
import sql8 from "./steps/sql8.js";
import sql9 from "./steps/sql9.js";
import sql10 from "./steps/sql10.js";
import sql11 from "./steps/sql11.js";

export { STAGES, STEP_IDS, STEP_PASS_PERCENT, MAX_SLIDES } from "./stages.js";

const WRITTEN = new Map([sql1, sql2, sql3, sql4, sql5, sql6, sql7, sql8, sql9, sql10, sql11].map((step) => [step.id, step]));

/** 40 step của khoá SQL, đúng thứ tự học. Step chưa soạn mang `draft: true`. */
export const WEB_COURSES = OUTLINE.map(([stage, title], index) => {
  const id = STEP_IDS[index];
  const content = WRITTEN.get(id);
  return {
    lang: "sql",
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
