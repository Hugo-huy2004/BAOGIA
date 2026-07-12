import crypto from 'crypto';
// Dùng chung bộ đề với client — một nguồn sự thật, không nhân bản câu hỏi.
import { WEB_COURSES, STAGES } from '../../src/components/member/hugoCoder/lessons/index.js';

export const PASS_PERCENT = 60;
const EXAM_TTL_MS = 30 * 60 * 1000;   // 30 phút làm bài
const PASS_TTL_MS = 15 * 60 * 1000;   // 15 phút để gọi award-learning sau khi đậu

// ponytail: in-memory Map đủ cho server đơn tiến trình hiện tại;
// chạy PM2 cluster/nhiều máy thì chuyển sang Redis.
const exams = new Map();   // examId -> { email, lessonId, answerKey: number[], expiresAt }
const passes = new Map();  // `${email}:${lessonId}` -> { score, expiresAt }

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

/**
 * Server ra đề: chọn ngẫu nhiên quizSize câu từ pool, giữ đáp án lại,
 * chỉ trả câu hỏi + phương án xuống client.
 */
export function startExam(email, lessonId) {
  sweepExpired();
  const course = QUIZ_COURSES.get(lessonId);
  if (!course) throw new Error('Bài học này không phải bài thi trắc nghiệm.');

  const pool = course.quizPool || [];
  const size = Math.min(course.quizSize || pool.length, pool.length);
  if (!size) throw new Error('Bài thi chưa có ngân hàng đề.');

  // Fisher–Yates với crypto.randomInt — đề không đoán trước được
  const indices = pool.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const picked = indices.slice(0, size);

  const examId = crypto.randomUUID();
  exams.set(examId, {
    email,
    lessonId,
    answerKey: picked.map((i) => pool[i].a),
    expiresAt: Date.now() + EXAM_TTL_MS
  });

  return {
    examId,
    lessonId,
    total: size,
    passPercent: PASS_PERCENT,
    questions: picked.map((i) => ({ q: pool[i].q, o: pool[i].o }))
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

  if (passed) {
    passes.set(`${email}:${exam.lessonId}`, { score, expiresAt: Date.now() + PASS_TTL_MS });
  }

  return { lessonId: exam.lessonId, score, passed, correctCount, total: exam.answerKey.length };
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

// ==== Chứng chỉ chặng công khai ====
// Điều kiện cấp: hoàn thành bài cuối chặng (chặng 6 cần đồ án được duyệt hoặc bài 100).
export function getStageCertificate(bio, phaseNumber) {
  const stage = STAGES.find((s) => s.phaseNumber === Number(phaseNumber));
  if (!stage) return null;

  const completed = bio?.completedLessons || [];
  const lastLessonId = `lesson${stage.to}`;
  const earned = stage.phaseNumber === 6
    ? (completed.includes(lastLessonId) || bio?.hugoCoderProjectStatus === 'approved')
    : completed.includes(lastLessonId);
  if (!earned) return null;

  return {
    displayName: bio.displayName,
    slug: bio.slug,
    phaseNumber: stage.phaseNumber,
    stageTitle: stage.title,
    rangeText: stage.rangeText,
    tagline: stage.intro?.tagline || '',
    skills: stage.intro?.learn || [],
    lessonsInStage: stage.to - stage.from,
    totalCompleted: completed.length,
    graduated: bio?.hugoCoderProjectStatus === 'approved',
    verifiedAt: new Date().toISOString()
  };
}
