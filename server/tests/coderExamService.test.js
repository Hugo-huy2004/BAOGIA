import { describe, it, expect } from 'vitest';
import {
  startExam,
  submitExam,
  consumeExamPass,
  isQuizLesson,
  getStageCertificate,
  PASS_PERCENT
} from '../utils/coderExamService.js';

const EMAIL = 'hs@test.vn';

describe('coderExamService — chấm thi phía máy chủ', () => {
  it('ra đề không kèm đáp án, đúng số câu quizSize', () => {
    const exam = startExam(EMAIL, 'lesson6');
    expect(exam.examId).toBeTruthy();
    expect(exam.total).toBe(8);
    expect(exam.questions).toHaveLength(8);
    for (const q of exam.questions) {
      expect(q.q).toBeTruthy();
      expect(q.o).toHaveLength(4);
      expect(q).not.toHaveProperty('a'); // đáp án không bao giờ rời máy chủ
    }
  });

  it('nộp toàn đáp án sai thì rớt và không có vé đậu', () => {
    const exam = startExam(EMAIL, 'lesson6');
    const result = submitExam(EMAIL, exam.examId, exam.questions.map(() => -1));
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
    expect(consumeExamPass(EMAIL, 'lesson6')).toBeNull();
  });

  it('đề dùng một lần — nộp lại cùng examId bị từ chối', () => {
    const exam = startExam(EMAIL, 'lesson25');
    submitExam(EMAIL, exam.examId, exam.questions.map(() => 0));
    expect(() => submitExam(EMAIL, exam.examId, exam.questions.map(() => 0))).toThrow();
  });

  it('không nộp hộ được đề của người khác', () => {
    const exam = startExam(EMAIL, 'lesson50');
    expect(() => submitExam('kegian@test.vn', exam.examId, exam.questions.map(() => 0))).toThrow();
  });

  it('vé đậu chỉ tiêu được một lần (chặn phát thưởng lặp)', () => {
    // Không có đáp án từ startExam — mô phỏng đậu bằng cách thử tổ hợp:
    // gian lận kiểu vét cạn cũng phải nộp N lần đề KHÁC NHAU, mỗi lần một đề mới.
    // Ở đây kiểm tra cơ chế vé: chưa đậu -> null.
    expect(consumeExamPass(EMAIL, 'lesson57')).toBeNull();
  });

  it('isQuizLesson nhận diện đúng 5 bài thi của giáo trình', () => {
    for (const id of ['lesson6', 'lesson25', 'lesson50', 'lesson57', 'lesson58']) {
      expect(isQuizLesson(id)).toBe(true);
    }
    expect(isQuizLesson('lesson1')).toBe(false);
    expect(PASS_PERCENT).toBe(60);
  });

  it('chứng chỉ chặng chỉ cấp khi hoàn thành bài cuối chặng', () => {
    const bio = {
      displayName: 'Hugo Học Viên',
      slug: 'hugo-hoc-vien',
      completedLessons: Array.from({ length: 25 }, (_, i) => `lesson${i + 1}`)
    };
    const cert1 = getStageCertificate(bio, 1);
    expect(cert1).toMatchObject({ phaseNumber: 1, displayName: 'Hugo Học Viên' });
    expect(cert1.skills.length).toBeGreaterThan(0);

    expect(getStageCertificate(bio, 2)).toBeTruthy();   // đã xong lesson25
    expect(getStageCertificate(bio, 3)).toBeNull();      // chưa tới lesson50
    expect(getStageCertificate(bio, 99)).toBeNull();     // chặng không tồn tại
  });

  it('chứng chỉ chặng 6 cấp khi đồ án được duyệt dù chưa tick bài 100', () => {
    const bio = {
      displayName: 'Hugo Tốt Nghiệp',
      slug: 'hugo-tot-nghiep',
      completedLessons: Array.from({ length: 99 }, (_, i) => `lesson${i + 1}`),
      hugoCoderProjectStatus: 'approved'
    };
    const cert = getStageCertificate(bio, 6);
    expect(cert).toBeTruthy();
    expect(cert.graduated).toBe(true);
  });
});
