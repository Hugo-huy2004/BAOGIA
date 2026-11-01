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
import sql23 from "./steps/sql23.js";
import sql24 from "./steps/sql24.js";
import sql25 from "./steps/sql25.js";
import sql26 from "./steps/sql26.js";
import sql27 from "./steps/sql27.js";
import sql28 from "./steps/sql28.js";
import sql29 from "./steps/sql29.js";
import sql30 from "./steps/sql30.js";
import sql31 from "./steps/sql31.js";
import sql32 from "./steps/sql32.js";
import sql33 from "./steps/sql33.js";
import sql34 from "./steps/sql34.js";
import sql35 from "./steps/sql35.js";
import sql36 from "./steps/sql36.js";
import sql37 from "./steps/sql37.js";
import sql38 from "./steps/sql38.js";
import sql39 from "./steps/sql39.js";
import sql40 from "./steps/sql40.js";

export { STAGES, STEP_IDS, STEP_PASS_PERCENT, MAX_SLIDES } from "./stages.js";

const WRITTEN = new Map([sql1, sql2, sql3, sql4, sql5, sql6, sql7, sql8, sql9, sql10, sql11, sql12, sql13, sql14, sql15, sql16, sql17, sql18, sql19, sql20, sql21, sql22, sql23, sql24, sql25, sql26, sql27, sql28, sql29, sql30, sql31, sql32, sql33, sql34, sql35, sql36, sql37, sql38, sql39, sql40].map((step) => [step.id, step]));

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
