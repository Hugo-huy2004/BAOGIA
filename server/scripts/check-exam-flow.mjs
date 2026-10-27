/**
 * Kiểm luồng trắc nghiệm cuối step — chạy trong `npm run check:all` và CI.
 *
 * Giữ ba lời hứa:
 *   1. Đề gửi xuống trình duyệt KHÔNG lộ đáp án: không `a`, không `why`, và các
 *      câu sắp thứ tự / nối cặp không nằm sẵn đúng thứ tự.
 *   2. Máy chủ chấm đúng trên chính đề đã xáo: trả lời đúng hết → 100%, sai hết
 *      → 0% và không qua; ngưỡng qua là STEP_PASS_PERCENT.
 *   3. Chép đáp án theo thứ tự GỐC trong mã nguồn không qua được.
 */
import { WEB_COURSES, STEP_PASS_PERCENT } from '../../src/components/member/hugoCoder/lessons/index.js';
import { presentQuiz, publicQuiz } from '../../shared/stepQuiz.js';
import { gradeStepQuiz, PASS_PERCENT } from '../utils/coderExamService.js';

const problems = [];
const written = WEB_COURSES.filter((step) => !step.draft);

if (PASS_PERCENT !== STEP_PASS_PERCENT) problems.push(`Máy chủ chấm ngưỡng ${PASS_PERCENT}%, giáo trình ghi ${STEP_PASS_PERCENT}%.`);

// Câu trả lời đúng cho một câu của đề đã xáo, đúng hình dạng giao diện gửi lên.
const rightAnswer = (question) => {
  // Câu nối cặp gốc không có `a`: đáp án ngầm là cặp thẳng hàng (i → i).
  if (question.kind === 'match') return Object.fromEntries(question.pairs.map((_, index) => [index, question.a ? question.a[index] : index]));
  if (question.kind === 'blank') return Array.isArray(question.a) ? question.a[0] : question.a;
  return question.a;
};

for (const step of written) {
  const shown = publicQuiz(step.quiz);
  if (shown.some((question) => 'a' in question || 'why' in question)) {
    problems.push(`${step.id}: đề gửi xuống còn mang đáp án hoặc lời giải.`);
  }
  step.quiz.forEach((question, index) => {
    const seen = shown[index];
    if (question.kind === 'order' && seen.items.every((item, i) => item === question.items[question.a[i]])) {
      problems.push(`${step.id} câu ${index + 1}: câu sắp thứ tự hiện sẵn đúng thứ tự.`);
    }
    if (question.kind === 'match' && seen.pairs.every(([, right], i) => right === question.pairs[i][1])) {
      problems.push(`${step.id} câu ${index + 1}: câu nối cặp hiện sẵn đúng cặp.`);
    }
  });

  // Cùng câu phải ra cùng đề: máy chủ chấm trên đề nó dựng lại.
  if (JSON.stringify(presentQuiz(step.quiz)) !== JSON.stringify(presentQuiz(step.quiz))) {
    problems.push(`${step.id}: xáo đề không ổn định giữa hai lần dựng.`);
  }

  const full = presentQuiz(step.quiz);
  const perfect = gradeStepQuiz(step.id, full.map(rightAnswer));
  if (perfect.score !== 100 || !perfect.passed) problems.push(`${step.id}: trả lời đúng hết mà được ${perfect.score}%.`);

  const blank = gradeStepQuiz(step.id, full.map(() => null));
  if (blank.score !== 0 || blank.passed) problems.push(`${step.id}: bỏ trống mà được ${blank.score}%.`);
  if (blank.review.length !== full.length || blank.review.some((item) => !item.answer)) {
    problems.push(`${step.id}: lời giải sau khi chấm thiếu câu hoặc thiếu đáp án.`);
  }

  const copied = gradeStepQuiz(step.id, step.quiz.map(rightAnswer));
  if (copied.passed) problems.push(`${step.id}: chép đáp án gốc từ mã nguồn vẫn qua (${copied.score}%).`);
}

if (gradeStepQuiz('step999', []) !== null) problems.push('Step không tồn tại phải trả null.');

if (problems.length) {
  console.error(`Trắc nghiệm step có ${problems.length} vấn đề:`);
  problems.forEach((item) => console.error(`  - ${item}`));
  process.exit(1);
}

console.log(
  `Trắc nghiệm step: ${written.length} step đã soạn, đề không lộ đáp án, máy chủ chấm đúng, `
  + `chép đáp án gốc không qua, đạt từ ${PASS_PERCENT}%.`,
);
