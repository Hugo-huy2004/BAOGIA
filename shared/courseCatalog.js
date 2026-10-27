/**
 * Danh mục khoá học — một nguồn sự thật. Từ 27/10/2026 chỉ còn MỘT khoá:
 * Coding (26 step, 6 chặng); bốn học phần văn phòng và bộ 100 bài Web cũ đã gỡ.
 *
 * Hình dạng một khoá:
 *   id          đoạn khoá trong địa chỉ
 *   code        mã hiển thị
 *   title       tên đầy đủ
 *   stages[]    { id, phaseNumber, title, lessonIds[], examIds[] }
 *   lessonIds[] mọi step, đúng thứ tự học
 *   examIds[]   step có chấm điểm — mọi step đều có trắc nghiệm cuối bài
 *
 * Chỉ đọc đề cương nhẹ (stages.js), không kéo nội dung bài vào bundle.
 */
import { STAGES, STEP_IDS } from "../src/components/member/hugoCoder/lessons/stages.js";
import LEGACY_CERTIFICATES from "./legacyCertificates.js";

export const WEB_COURSE_ID = "coding";

function buildCodingCourse() {
  const stages = STAGES.map((stage) => {
    const lessonIds = STEP_IDS.slice(stage.from, stage.to);
    return {
      id: stage.id,
      phaseNumber: stage.phaseNumber,
      title: stage.title,
      tone: stage.tone,
      lessonIds,
      examIds: lessonIds,
    };
  });

  return {
    id: WEB_COURSE_ID,
    kind: "coder",
    code: "CODE",
    title: "Coding — Lập trình web mạng xã hội",
    icon: "code",
    tone: "blue",
    color: "#007aff",
    stages,
    lessonIds: stages.flatMap((stage) => stage.lessonIds),
    examIds: stages.flatMap((stage) => stage.examIds),
  };
}

export const COURSE_CATALOG = Object.freeze([buildCodingCourse()]);

export function getCourse(courseId) {
  return COURSE_CATALOG.find((course) => course.id === courseId) || null;
}

/** Khoá chứa một step; null nếu id không thuộc khoá nào. */
export function courseOfLesson(lessonId) {
  return COURSE_CATALOG.find((course) => course.lessonIds.includes(lessonId)) || null;
}

/** Id step đã hoàn thành của một khoá — bộ đếm chung cho mọi bảng. */
export function completedInCourse(course, completedLessons = []) {
  const done = new Set(completedLessons);
  return course.lessonIds.filter((id) => done.has(id));
}

/**
 * Chặng tra theo khoá trong đường dẫn chứng chỉ:
 *   "coding-1" hoặc "basic" → chặng 1 khoá Coding
 *   "1"                     → chặng 1 khoá Web CŨ (lesson1–100), chỉ để giấy
 *                             chứng nhận đã cấp trước 27/10/2026 vẫn mở được
 * Trả `{ course, stage, legacy? }` hoặc null.
 */
export function resolveStageKey(key) {
  const raw = String(key ?? "").trim();
  if (!raw) return null;

  const legacy = LEGACY_CERTIFICATES.find((item) => item.keys.includes(raw));
  if (legacy) {
    return {
      legacy: true,
      course: { id: legacy.courseId, code: legacy.courseCode, title: legacy.courseTitle },
      stage: { ...legacy, id: `legacy-${legacy.phaseNumber}`, title: legacy.stageTitle },
    };
  }

  const coding = getCourse(WEB_COURSE_ID);
  const match = /^coding-(\d+)$/.exec(raw);
  const stage = match
    ? coding.stages.find((item) => item.phaseNumber === Number(match[1]))
    : coding.stages.find((item) => item.id === raw);
  return stage ? { course: coding, stage } : null;
}

/** Đường dẫn chứng chỉ của một chặng khoá Coding. */
export const certificateKey = (phaseNumber) => `coding-${phaseNumber}`;
