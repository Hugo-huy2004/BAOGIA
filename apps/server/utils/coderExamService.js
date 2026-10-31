// Dùng chung giáo trình với client — một nguồn sự thật, không nhân bản câu hỏi.
import { WEB_COURSES, STAGES, STEP_PASS_PERCENT } from '../../web/src/components/member/hugoCoder/lessons/index.js';
import { isQuizAnswerCorrect, quizAnswerText } from '../../../packages/shared/quizKinds.js';
import { presentQuiz } from '../../../packages/shared/stepQuiz.js';

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
