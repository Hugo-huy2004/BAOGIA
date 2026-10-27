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

const WEB_COURSE_ID = "coding";

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

/** Id step đã hoàn thành của một khoá — bộ đếm chung cho mọi bảng. */
export function completedInCourse(course, completedLessons = []) {
  const done = new Set(completedLessons);
  return course.lessonIds.filter((id) => done.has(id));
}
