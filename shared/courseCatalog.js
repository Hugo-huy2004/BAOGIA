/**
 * Danh mục MỌI khoá học của Hugo Learning — một nguồn sự thật.
 *
 * Trước đây mỗi chỗ tự đếm theo cách riêng: chứng nhận chỉ biết 6 chặng khoá
 * Web (tra theo `phaseNumber`, nên `office-calendar` ra `NaN` và luôn 404); ba
 * bảng Học liệu / Chất lượng / Tiến độ chỉ nhìn thấy khoá Web; thêm một khoá là
 * phải nhớ sửa từng nơi — và chắc chắn sẽ quên một nơi.
 *
 * Ở đây khoá nào cũng có CÙNG một hình dạng, và danh mục dựng bằng cách đọc
 * giáo trình chứ không liệt kê tay. Thêm một học phần vào `HUGOSO_COURSES`, hay
 * thêm một chặng vào `STAGES`, là mọi thứ tự tính lại: không phải sửa file này.
 *
 * Hình dạng một khoá:
 *   id          đoạn khoá trong địa chỉ (`web`, `calendar`, …)
 *   kind        "coder" | "office" — quyết định bài học lấy từ nguồn nào
 *   code        mã học phần hiển thị ("WEB", "CAL 101", …)
 *   title       tên đầy đủ
 *   stages[]    chặng con: { id, title, lessonIds[], examIds[] }
 *   lessonIds[] mọi bài, đúng thứ tự học
 *   examIds[]   bài có chấm điểm
 */
import { WEB_COURSES, STAGES } from "../src/components/member/hugoCoder/lessons/index.js";
import { HUGOSO_COURSES, HUGOSO_COURSE_ORDER } from "../src/components/member/hugoSO/hugoSOCourses.js";

export const WEB_COURSE_ID = "web";

/** Tách "CAL 101 · Khoa …" thành mã học phần; không có mã thì trả chuỗi rỗng. */
function codeOf(text) {
  const match = /^([A-Z]{2,4}\s?\d{3})\b/.exec(String(text || "").trim());
  return match ? match[1] : "";
}

function buildWebCourse() {
  const stages = STAGES.map((stage) => {
    const lessons = WEB_COURSES.slice(stage.from, stage.to);
    return {
      id: stage.id,
      phaseNumber: stage.phaseNumber,
      title: stage.title,
      tone: stage.tone,
      lessonIds: lessons.map((lesson) => lesson.id),
      examIds: lessons.filter((lesson) => lesson.practiceType === "quiz").map((lesson) => lesson.id),
    };
  });

  return {
    id: WEB_COURSE_ID,
    kind: "coder",
    code: "WEB",
    title: "Chương trình Kỹ sư Phát triển Web",
    icon: "code_blocks",
    tone: "blue",
    color: "#007aff",
    stages,
    lessonIds: stages.flatMap((stage) => stage.lessonIds),
    examIds: stages.flatMap((stage) => stage.examIds),
  };
}

function buildOfficeCourse(courseId) {
  const course = HUGOSO_COURSES[courseId];
  const lessonIds = course.steps.map((step) => step.id);
  // Bài cuối là bài kiểm tra tổng hợp của học phần (xem adaptOfficePartToCoderFormat).
  const examIds = lessonIds.slice(-1);

  return {
    id: courseId,
    kind: "office",
    code: codeOf(course.eyebrow) || courseId.toUpperCase(),
    title: course.title,
    icon: course.icon,
    tone: "purple",
    color: course.color,
    stages: [{
      id: courseId,
      phaseNumber: 1,
      title: course.title,
      tone: "purple",
      lessonIds,
      examIds,
    }],
    lessonIds,
    examIds,
  };
}

/** Mọi khoá, theo thứ tự hiển thị. Khoá Web đứng đầu vì nó là lộ trình dài nhất. */
export const COURSE_CATALOG = Object.freeze([
  buildWebCourse(),
  ...HUGOSO_COURSE_ORDER.filter((id) => HUGOSO_COURSES[id]).map(buildOfficeCourse),
]);

export function getCourse(courseId) {
  return COURSE_CATALOG.find((course) => course.id === courseId) || null;
}

/** Khoá chứa một bài; null nếu id bài không thuộc khoá nào. */
export function courseOfLesson(lessonId) {
  return COURSE_CATALOG.find((course) => course.lessonIds.includes(lessonId)) || null;
}

/** Id bài đã hoàn thành của một khoá — bộ đếm chung cho mọi bảng. */
export function completedInCourse(course, completedLessons = []) {
  const done = new Set(completedLessons);
  return course.lessonIds.filter((id) => done.has(id));
}

/**
 * Khoá chứa một chặng, tra theo NHIỀU dạng khoá để mọi liên kết cũ còn sống:
 *   "1" hoặc 1        → chặng 1 của khoá Web (dạng cũ của giấy chứng nhận)
 *   "office-calendar" → học phần CAL 101
 *   "calendar"        → học phần CAL 101
 *   "basic"           → chặng 1 của khoá Web, theo id chặng
 */
export function resolveStageKey(key) {
  const raw = String(key ?? "").trim();
  if (!raw) return null;

  const asNumber = Number(raw);
  if (Number.isInteger(asNumber) && asNumber > 0) {
    const web = getCourse(WEB_COURSE_ID);
    const stage = web.stages.find((item) => item.phaseNumber === asNumber);
    return stage ? { course: web, stage } : null;
  }

  const id = raw.startsWith("office-") ? raw.slice("office-".length) : raw;
  const course = getCourse(id);
  if (course) return { course, stage: course.stages[0] };

  for (const item of COURSE_CATALOG) {
    const stage = item.stages.find((s) => s.id === id);
    if (stage) return { course: item, stage };
  }
  return null;
}
