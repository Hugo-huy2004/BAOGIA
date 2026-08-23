/**
 * Kiểm bài thi cuối chặng — chạy trong `npm run check:all`.
 *
 * Lỗi từng gặp: trình học mới tự chấm bộ `miniQuiz` rồi gọi `award-learning`,
 * trong khi máy chủ đòi "vé đậu" do `coder-exam/submit` cấp. Năm bài thi vì thế
 * đi hết các bước vẫn 400, và mọi bài sau kẹt thứ tự 409. Không thấy bằng mắt
 * được vì màn hình vẫn bắn pháo hoa "hoàn thành".
 *
 * Những thứ script này giữ:
 *   1. Hai danh sách bài thi (joyRoutes và practiceType) không được lệch nhau.
 *   2. Ngân hàng đề đúng bản thiết kế: đủ 40 câu, đủ mỗi nhóm để lượt thi lại
 *      vẫn ra được đề khác hoàn toàn.
 *   3. Đề ra đúng cơ cấu: mỗi lượt đủ suy luận/lý thuyết/điền code/nâng cao.
 *   4. Đáp án không đứng yên một chỗ (ngân hàng viết đáp án ở vị trí đầu, máy
 *      chủ phải xáo).
 *   5. Lượt thi lại không lặp câu của lượt trước.
 *   6. Chấm đúng cả hai chiều: đúng hết thì đậu VÀ cấp vé; sai hết thì rớt và
 *      KHÔNG cấp vé.
 */
import { readFileSync } from 'node:fs';
import { WEB_COURSES } from '../../src/components/member/hugoCoder/lessons/index.js';
import {
  EXAM_BLUEPRINT,
  EXAM_SIZE,
  matchesSlot,
  validateExamBank,
} from '../../shared/examBlueprint.js';
import { startExam, submitExam, consumeExamPass, isQuizLesson, PASS_PERCENT } from '../utils/coderExamService.js';

const problems = [];
const EMAIL = 'check-exam-flow@local';

const declared = new Set(
  WEB_COURSES.filter((course) => course.practiceType === 'quiz').map((course) => course.id),
);

// Danh sách trong joyRoutes viết tay, nên nó là chỗ dễ lệch nhất khi thêm bài.
const routeSource = readFileSync(new URL('../routes/joyRoutes.js', import.meta.url), 'utf8');
const routeMatch = /CODER_QUIZ_LESSONS = new Set\(\[([^\]]*)\]\)/.exec(routeSource);
if (!routeMatch) {
  problems.push('Không đọc được CODER_QUIZ_LESSONS trong joyRoutes.js');
} else {
  const gated = new Set([...routeMatch[1].matchAll(/'([^']+)'/g)].map((item) => item[1]));
  for (const id of gated) {
    if (!declared.has(id)) problems.push(`${id}: joyRoutes đòi thi nhưng giáo trình không đặt practiceType "quiz" — bài này sẽ kẹt vĩnh viễn.`);
  }
  for (const id of declared) {
    if (!gated.has(id)) problems.push(`${id}: giáo trình đặt là bài thi nhưng joyRoutes không chặn — điểm client tự khai sẽ được nhận.`);
  }
}

/** Vị trí đáp án qua nhiều lượt ra đề — dồn hết vào một chỗ là hỏng. */
const answerPositions = new Map();

for (const course of WEB_COURSES.filter((item) => declared.has(item.id))) {
  const { id } = course;
  if (!isQuizLesson(id)) {
    problems.push(`${id}: coderExamService không nhận là bài thi.`);
    continue;
  }

  validateExamBank(course.quizPool || []).forEach((issue) => problems.push(`${id}: ${issue}`));

  const exam = startExam(EMAIL, id);
  if (exam.total !== EXAM_SIZE) problems.push(`${id}: đề ra ${exam.total} câu, cần ${EXAM_SIZE}.`);

  // Cơ cấu đề: mỗi ô của bản thiết kế phải được lấp đủ.
  for (const slot of EXAM_BLUEPRINT) {
    const got = exam.questions.filter((question) => {
      const source = course.quizPool.find((item) => item.q === question.q);
      return source && matchesSlot(source, slot);
    }).length;
    if (got !== slot.count) {
      const name = slot.level ? `${slot.group}/${slot.level}` : slot.group;
      problems.push(`${id}: đề có ${got} câu nhóm ${name}, bản thiết kế cần ${slot.count}.`);
    }
  }

  // Câu nhóm `code` phải xuống tới client kèm đoạn mã, nếu không người thi
  // không có gì để đọc mà điền.
  const codeWithoutSnippet = exam.questions.filter((question) => question.group === 'code' && !question.code);
  if (codeWithoutSnippet.length) {
    problems.push(`${id}: ${codeWithoutSnippet.length} câu đọc–điền code gửi xuống thiếu đoạn mã.`);
  }

  // Đáp án đúng phải theo câu hỏi sang vị trí mới sau khi máy chủ xáo phương án.
  const answerKey = exam.questions.map((question) => {
    const source = course.quizPool.find((item) => item.q === question.q);
    const correctText = source.o[source.a];
    const at = question.o.indexOf(correctText);
    if (at === -1) problems.push(`${id}: xáo phương án làm mất đáp án đúng của câu "${question.q.slice(0, 40)}…".`);
    answerPositions.set(at, (answerPositions.get(at) || 0) + 1);
    return at;
  });

  const passing = submitExam(EMAIL, exam.examId, answerKey);
  if (!passing.passed) problems.push(`${id}: trả lời đúng hết mà vẫn rớt (${passing.score}%).`);
  if (consumeExamPass(EMAIL, id) === null) problems.push(`${id}: đậu nhưng không cấp vé — award-learning sẽ trả 400.`);

  // Lượt thi lại: đề phải khác hoàn toàn.
  const retry = startExam(EMAIL, id);
  const overlap = retry.questions.filter((question) => exam.questions.some((item) => item.q === question.q));
  if (overlap.length) {
    problems.push(`${id}: thi lại lặp ${overlap.length}/${retry.total} câu của lượt trước.`);
  }

  const failing = submitExam(EMAIL, retry.examId, retry.questions.map(() => -1));
  if (failing.passed) problems.push(`${id}: sai hết mà vẫn đậu.`);
  if (consumeExamPass(EMAIL, id) !== null) problems.push(`${id}: rớt mà vẫn được cấp vé — ai cũng qua được bài thi.`);
}

// Không có vị trí nào được chiếm quá nửa số câu — dấu hiệu quên xáo phương án.
const totalAnswers = [...answerPositions.values()].reduce((sum, n) => sum + n, 0);
for (const [position, count] of answerPositions) {
  if (totalAnswers && count / totalAnswers > 0.5) {
    problems.push(`Đáp án đúng nằm ở vị trí ${String.fromCharCode(65 + position)} tới ${Math.round(count / totalAnswers * 100)}% số câu — phương án chưa được xáo.`);
  }
}

if (problems.length) {
  console.error(`Bài thi cuối chặng có ${problems.length} vấn đề:`);
  problems.forEach((item) => console.error(`  - ${item}`));
  process.exit(1);
}

console.log(
  `Bài thi cuối chặng: ${declared.size} bài × ${EXAM_SIZE} câu (ngân hàng 40), `
  + `đúng cơ cấu, xáo phương án, thi lại không trùng câu, đạt từ ${PASS_PERCENT}%.`,
);
