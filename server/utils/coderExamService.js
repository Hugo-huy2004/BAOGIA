// Dùng chung giáo trình với client — một nguồn sự thật, không nhân bản câu hỏi.
import { WEB_COURSES, STAGES, STEP_PASS_PERCENT } from '../../src/components/member/hugoCoder/lessons/index.js';
import { gradeStage } from '../../shared/stageGrading.js';
import { resolveStageKey } from '../../shared/courseCatalog.js';
import { isQuizAnswerCorrect, quizAnswerText } from '../../shared/quizKinds.js';
import { presentQuiz } from '../../shared/stepQuiz.js';

export const PASS_PERCENT = STEP_PASS_PERCENT;
const STEPS = new Map(WEB_COURSES.map((course) => [course.id, course]));

/**
 * Máy chủ chấm trắc nghiệm cuối step. `answers[i]` là câu trả lời cho câu thứ
 * i của đề ĐÃ XÁO (publicQuiz) — đúng thứ người học nhìn thấy. Điểm client tự
 * khai không bao giờ được tin. `review` chỉ trả về SAU khi nộp.
 */
export function gradeStepQuiz(stepId, answers) {
  const quiz = presentQuiz(STEPS.get(stepId)?.quiz || []);
  if (!quiz.length) return null;
  const given = Array.isArray(answers) && answers.length === quiz.length ? answers : [];
  const review = quiz.map((question, index) => ({
    correct: isQuizAnswerCorrect(question, given[index]),
    answer: quizAnswerText(question),
    why: question.why || '',
  }));
  const correct = review.filter((item) => item.correct).length;
  const score = Math.round((correct / quiz.length) * 100);
  return { score, correct, total: quiz.length, passed: score >= PASS_PERCENT, review };
}

// ==== Chứng chỉ công khai ====
/**
 * Giấy chứng nhận cho một chặng. `key` là "coding-N"/mã chặng của khoá Coding,
 * hoặc số "1".."6" của khoá Web CŨ (bản lưu trữ, chấm trên lesson1–100 mà hồ sơ
 * vẫn giữ) — để mọi giấy đã cấp trước 27/10/2026 vẫn mở được.
 */
export function getStageCertificate(bio, key) {
  const found = resolveStageKey(key);
  if (!found) return null;
  const { course, stage, legacy } = found;

  const completed = bio?.completedLessons || [];
  const done = new Set(completed);
  let missing = stage.lessonIds.filter((id) => !done.has(id));

  // Chặng cuối: dự án hoàn tất được duyệt thay cho step cuối (bài 100 ở khoá cũ).
  if (stage.phaseNumber === 6 && bio?.hugoCoderProjectStatus === 'approved') {
    const finalStep = stage.lessonIds.at(-1);
    missing = missing.filter((lessonId) => lessonId !== finalStep);
  }
  if (missing.length) return null;

  // Chứng chỉ phải nói ra NĂNG LỰC, không chỉ nói "đã học hết". Hai người cùng
  // đi hết chặng nhưng một người 92% ngay lần đầu, người kia 61% ở lần thứ tư —
  // tờ giấy phải phân biệt được.
  const assessment = gradeStage({
    lessonIds: stage.lessonIds,
    examIds: stage.examIds,
    completedLessons: completed,
    examScores: bio?.hugoCoderExamScores || {},
  });

  const source = legacy ? stage : STAGES.find((item) => item.id === stage.id);
  return {
    displayName: bio.displayName,
    slug: bio.slug,
    courseId: course.id,
    courseCode: course.code,
    courseTitle: course.title,
    phaseNumber: stage.phaseNumber,
    stageTitle: stage.title,
    rangeText: source?.rangeText || `${stage.lessonIds.length} step`,
    tagline: (legacy ? source.tagline : source?.intro?.tagline) || '',
    skills: (legacy ? source.skills : source?.intro?.learn) || [],
    lessonsInStage: stage.lessonIds.length,
    totalCompleted: completed.length,
    graduated: bio?.hugoCoderProjectStatus === 'approved',
    score: assessment.score,
    grade: assessment.grade,
    gradeLabel: assessment.gradeLabel,
    gradeNote: assessment.gradeNote,
    breakdown: assessment.breakdown,
    verifiedAt: new Date().toISOString()
  };
}

/** Xếp loại một chặng cho giao diện, kể cả khi chưa đủ điều kiện cấp chứng chỉ. */
export function getStageAssessment(bio, stageId) {
  const stage = STAGES.find((item) => item.id === stageId);
  if (!stage) return null;

  const lessonIds = WEB_COURSES.slice(stage.from, stage.to).map((course) => course.id);
  return {
    stageId: stage.id,
    phaseNumber: stage.phaseNumber,
    ...gradeStage({
      lessonIds,
      examIds: lessonIds,
      completedLessons: bio?.completedLessons || [],
      examScores: bio?.hugoCoderExamScores || {},
    }),
  };
}
