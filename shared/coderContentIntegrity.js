import { validateQuizQuestion } from "./quizKinds.js";

/** Bảy phần của một step, đúng thứ tự giáo trình. `quiz` nằm ở mảng riêng. */
const STEP_SECTIONS = Object.freeze(["intro", "visual", "research", "ideate", "core", "apply"]);
const MIN_QUIZ = 8;

const text = (value) => typeof value === "string" && value.trim().length > 0;
// Giữ lại toán tử: đây là khoá so trùng cho khoá học LẬP TRÌNH, mà ký hiệu
// chính là nội dung câu hỏi — "0 ?? 100" và "0 || 100" là hai câu khác nhau.
const questionKey = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[̀-ͯ]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9?|&!=<>+\-*/%.]+/g, " ")
  .trim();
// Trích dẫn kiểu Harvard: "Tác giả (năm) …" trong một dòng trích (>).
const HARVARD_CITATION = /^>\s*.+\((?:\d{4}|n\.d\.)\)/m;

/**
 * Kiểm giáo trình Coding. `visualKeys` là các hình CodingVisual có thật,
 * `imageExists(src)` báo ảnh chụp màn hình có trong public/ không.
 * Trả `{ valid, issues, courseCount, writtenCount, slideCount, questionCount }`.
 */
export function auditCoderContent(courses, stages, { maxSlides = 35, visualKeys = null, imageExists = null } = {}) {
  const issues = [];
  const questions = new Map();
  let slideCount = 0;
  let questionCount = 0;

  (courses || []).forEach((course, courseIndex) => {
    const path = course?.id || `courses[${courseIndex}]`;
    if (course?.id !== `step${courseIndex + 1}`) issues.push(`${path}: id phải là step${courseIndex + 1}.`);
    if (!text(course?.title)) issues.push(`${path}: thiếu tiêu đề.`);
    if (course?.draft) return;

    const slides = course.slides || [];
    const quiz = course.quiz || [];
    slideCount += slides.length;
    if (slides.length + quiz.length > maxSlides) {
      issues.push(`${path}: ${slides.length} slide + ${quiz.length} câu = ${slides.length + quiz.length}, vượt trần ${maxSlides}.`);
    }

    // Đủ bảy phần, và đi đúng thứ tự giáo trình (không quay lại phần trước).
    let last = -1;
    for (const [slideIndex, slide] of slides.entries()) {
      const at = `${path}.slides[${slideIndex}]`;
      const order = STEP_SECTIONS.indexOf(slide?.section);
      if (order < 0) {
        issues.push(`${at}: phần "${slide?.section}" không hợp lệ.`);
        continue;
      }
      if (order < last) issues.push(`${at}: phần "${slide.section}" nằm sau phần muộn hơn — sai thứ tự giáo trình.`);
      last = Math.max(last, order);
      if (!text(slide.title)) issues.push(`${at}: thiếu tiêu đề.`);
      if (!text(slide.body) && !slide.visual && !slide.image && !slide.code) issues.push(`${at}: slide trống.`);
      if (slide.visual && visualKeys && !visualKeys.has(slide.visual)) issues.push(`${at}: hình minh hoạ "${slide.visual}" không có trong CodingVisual.`);
      if (slide.section === "visual" && !slide.visual && !slide.image) issues.push(`${at}: slide minh hoạ thiếu hình.`);
      if (slide.image) {
        if (!text(slide.image.src) || !text(slide.image.alt)) issues.push(`${at}: ảnh chụp thiếu src hoặc alt.`);
        else if (imageExists && !imageExists(slide.image.src)) issues.push(`${at}: không có tệp ảnh ${slide.image.src} trong public/.`);
      }
      if (slide.section === "research" && !HARVARD_CITATION.test(slide.body || "")) {
        issues.push(`${at}: slide học thuật phải trích ít nhất một nguồn kiểu Harvard ("> Tác giả (năm) …").`);
      }
      if (slide.code && (!text(slide.code.file) || !text(slide.code.content))) issues.push(`${at}: khối mã thiếu tên tệp hoặc nội dung.`);
    }
    for (const section of STEP_SECTIONS) {
      if (!slides.some((slide) => slide?.section === section)) issues.push(`${path}: thiếu phần "${section}".`);
    }

    if (quiz.length < MIN_QUIZ) issues.push(`${path}: trắc nghiệm cần ít nhất ${MIN_QUIZ} câu, đang có ${quiz.length}.`);
    quiz.forEach((question, questionIndex) => {
      questionCount += 1;
      const at = `${path}.quiz[${questionIndex}]`;
      issues.push(...validateQuizQuestion(question, at));
      if (!text(question?.why)) issues.push(`${at}: thiếu lời giải "why" — người học sai phải biết vì sao.`);
      const key = questionKey(question?.q);
      if (!key) return;
      if (questions.has(key)) issues.push(`${at}: đề bài trùng ${questions.get(key)}.`);
      else questions.set(key, at);
    });
  });

  for (const stage of stages || []) {
    if (!text(stage?.id) || !Number.isInteger(stage?.from) || !Number.isInteger(stage?.to)) {
      issues.push("stages: chặng thiếu id/from/to hợp lệ.");
    } else if (stage.from < 0 || stage.to > (courses?.length || 0) || stage.from >= stage.to) {
      issues.push(`stages.${stage.id}: khoảng step không hợp lệ.`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    courseCount: courses?.length || 0,
    writtenCount: (courses || []).filter((course) => !course?.draft).length,
    slideCount,
    questionCount,
  };
}
