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
import sql12 from "./steps/sql12.js";
import sql13 from "./steps/sql13.js";
import sql14 from "./steps/sql14.js";
import sql15 from "./steps/sql15.js";
import sql16 from "./steps/sql16.js";
import sql17 from "./steps/sql17.js";
import sql18 from "./steps/sql18.js";
import sql19 from "./steps/sql19.js";
import sql20 from "./steps/sql20.js";
import sql21 from "./steps/sql21.js";
import sql22 from "./steps/sql22.js";

export { STAGES, STEP_IDS, STEP_PASS_PERCENT, MAX_SLIDES } from "./stages.js";

const WRITTEN = new Map([sql1, sql2, sql3, sql4, sql5, sql6, sql7, sql8, sql9, sql10, sql11, sql12, sql13, sql14, sql15, sql16, sql17, sql18, sql19, sql20, sql21, sql22].map((step) => [step.id, step]));

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
