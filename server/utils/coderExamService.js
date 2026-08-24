import crypto from 'crypto';
// Dùng chung bộ đề với client — một nguồn sự thật, không nhân bản câu hỏi.
import { WEB_COURSES, STAGES } from '../../src/components/member/hugoCoder/lessons/index.js';
import { EXAM_BLUEPRINT, matchesSlot } from '../../shared/examBlueprint.js';
import { gradeStage } from '../../shared/stageGrading.js';
import { resolveStageKey, WEB_COURSE_ID } from '../../shared/courseCatalog.js';

export const PASS_PERCENT = 60;
const EXAM_TTL_MS = 30 * 60 * 1000;   // 30 phút làm bài
const PASS_TTL_MS = 15 * 60 * 1000;   // 15 phút để gọi award-learning sau khi đậu

// ponytail: in-memory Map đủ cho server đơn tiến trình hiện tại;
// chạy PM2 cluster/nhiều máy thì chuyển sang Redis.
const exams = new Map();   // examId -> { email, lessonId, answerKey: number[], expiresAt }
const passes = new Map();  // `${email}:${lessonId}` -> { score, expiresAt }
// Đề của lượt gần nhất, để lượt thi lại không lặp lại câu nào. Chỉ giữ nội dung
// câu hỏi chứ không giữ đáp án — mất khi khởi động lại cũng chỉ khiến một lượt
// thi lại có thể trùng câu, không sai điểm.
const lastServed = new Map(); // `${email}:${lessonId}` -> string[]

const QUIZ_COURSES = new Map(
  WEB_COURSES.filter((c) => c.practiceType === 'quiz').map((c) => [c.id, c])
);

function sweepExpired() {
  const now = Date.now();
  for (const [id, exam] of exams) if (exam.expiresAt < now) exams.delete(id);
  for (const [key, pass] of passes) if (pass.expiresAt < now) passes.delete(key);
}

export function isQuizLesson(lessonId) {
  return QUIZ_COURSES.has(lessonId);
}

/** Fisher–Yates với crypto.randomInt — thứ tự không đoán trước được. */
function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Ra đề theo BẢN THIẾT KẾ: mỗi ô (nhóm + mức độ) rút đủ số câu quy định, nên
 * lượt thi nào cũng có đủ suy luận, lý thuyết, đọc–điền code và câu nâng cao.
 * Bốc ngẫu nhiên từ một rổ chung như trước có thể ra một đề toàn câu dễ.
 *
 * Ngân hàng cũ (chưa gắn nhóm) vẫn chạy được: không câu nào khớp bản thiết kế
 * thì rơi về cách bốc ngẫu nhiên, để bài chưa soạn lại đề không chết.
 */
function pickQuestions(pool, size, exclude) {
  const fresh = pool.filter((question) => !exclude.has(question.q));
  // Ngân hàng cạn vì loại quá nhiều: quay lại dùng cả rổ, thà lặp câu còn hơn
  // không ra được đề.
  const source = fresh.length >= size ? fresh : pool;

  const slots = EXAM_BLUEPRINT.flatMap((slot) => {
    const candidates = shuffle(source.filter((question) => matchesSlot(question, slot)));
    return candidates.slice(0, slot.count);
  });

  if (slots.length === size) return shuffle(slots);
  return shuffle(source).slice(0, size);
}

/**
 * Server ra đề, giữ đáp án lại, chỉ trả câu hỏi + phương án xuống client.
 *
 * Phương án cũng được xáo và chỉ số đáp án dời theo: ngân hàng đề viết đáp án
 * đúng ở vị trí đầu cho dễ soát, không xáo thì đáp án luôn là A.
 */
export function startExam(email, lessonId) {
  sweepExpired();
  const course = QUIZ_COURSES.get(lessonId);
  if (!course) throw new Error('Bài học này không phải bài thi trắc nghiệm.');

  const pool = course.quizPool || [];
  const size = Math.min(course.quizSize || pool.length, pool.length);
  if (!size) throw new Error('Bài thi chưa có ngân hàng đề.');

  // Lượt thi lại phải khác đề hẳn: loại mọi câu vừa ra ở lượt trước.
  const lastKey = `${email}:${lessonId}`;
  const exclude = new Set(lastServed.get(lastKey) || []);
  const picked = pickQuestions(pool, size, exclude);

  const prepared = picked.map((question) => {
    const order = shuffle(question.o.map((_, index) => index));
    return {
      q: question.q,
      code: question.code || undefined,
      group: question.group,
      o: order.map((index) => question.o[index]),
      a: order.indexOf(question.a),
    };
  });

  lastServed.set(lastKey, picked.map((question) => question.q));

  const examId = crypto.randomUUID();
  const questions = prepared.map(({ q, o, code, group }) => ({ q, o, code, group }));
  exams.set(examId, {
    email,
    lessonId,
    answerKey: prepared.map((question) => question.a),
    questions,
    expiresAt: Date.now() + EXAM_TTL_MS
  });

  return {
    examId,
    lessonId,
    total: size,
    passPercent: PASS_PERCENT,
    questions
  };
}

/**
 * Server chấm: so lựa chọn với đáp án đã giữ. Đề dùng một lần —
 * nộp xong là hủy; đậu thì cấp "vé" ngắn hạn cho award-learning.
 */
export function submitExam(email, examId, answers) {
  sweepExpired();
  const exam = exams.get(examId);
  if (!exam || exam.email !== email) throw new Error('Đề thi không tồn tại hoặc đã hết hạn — hãy bấm đổi đề để nhận đề mới.');
  exams.delete(examId);

  if (!Array.isArray(answers) || answers.length !== exam.answerKey.length) {
    throw new Error('Bài nộp không hợp lệ.');
  }

  const correctCount = exam.answerKey.reduce(
    (sum, key, i) => sum + (Number(answers[i]) === key ? 1 : 0),
    0
  );
  const score = Math.round((correctCount / exam.answerKey.length) * 100);
  const passed = score >= PASS_PERCENT;
  const review = exam.answerKey.map((correctAnswer, index) => ({
    questionIndex: index,
    selectedAnswer: Number(answers[index]),
    correctAnswer,
    correct: Number(answers[index]) === correctAnswer,
    correctText: exam.questions[index]?.o?.[correctAnswer] || '',
  }));

  if (passed) {
    passes.set(`${email}:${exam.lessonId}`, { score, expiresAt: Date.now() + PASS_TTL_MS });
  }

  return {
    lessonId: exam.lessonId,
    score,
    passed,
    correctCount,
    total: exam.answerKey.length,
    review,
  };
}

/** Vé đậu dùng một lần: award-learning đọc là xoá. Trả null nếu chưa đậu tại server. */
export function consumeExamPass(email, lessonId) {
  sweepExpired();
  const key = `${email}:${lessonId}`;
  const pass = passes.get(key);
  if (!pass) return null;
  passes.delete(key);
  return pass.score;
}

// ==== Chứng chỉ công khai ====
/**
 * Giấy chứng nhận cho MỘT chặng bất kỳ trong danh mục.
 *
 * `key` nhận nhiều dạng để liên kết cũ không chết: số chặng của khoá Web ("1"),
 * id học phần ("calendar"), hay dạng cũ "office-calendar". Trước đây hàm chỉ tra
 * theo `phaseNumber`, nên mọi khoá Năng suất đều ra NaN và không bao giờ cấp
 * được chứng nhận — đó là lý do bấm "Nhận chứng nhận" không hiện gì.
 *
 * Danh mục tự dựng từ giáo trình, nên thêm khoá mới là có chứng nhận ngay,
 * không phải sửa hàm này.
 */
export function getStageCertificate(bio, key) {
  const found = resolveStageKey(key);
  if (!found) return null;
  const { course, stage } = found;

  const completed = bio?.completedLessons || [];
  const done = new Set(completed);
  let missing = stage.lessonIds.filter((id) => !done.has(id));

  // Chặng cuối khoá Web: đồ án được duyệt thay cho bài 100.
  if (course.id === WEB_COURSE_ID && stage.phaseNumber === 6 && bio?.hugoCoderProjectStatus === 'approved') {
    missing = missing.filter((lessonId) => lessonId !== 'lesson100');
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

  const source = STAGES.find((item) => item.id === stage.id);
  return {
    displayName: bio.displayName,
    slug: bio.slug,
    courseId: course.id,
    courseCode: course.code,
    courseTitle: course.title,
    phaseNumber: stage.phaseNumber,
    stageTitle: stage.title,
    rangeText: source?.rangeText || `${stage.lessonIds.length} bài`,
    tagline: source?.intro?.tagline || '',
    skills: source?.intro?.learn || [],
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
      examIds: lessonIds.filter((id) => QUIZ_COURSES.has(id)),
      completedLessons: bio?.completedLessons || [],
      examScores: bio?.hugoCoderExamScores || {},
    }),
  };
}
