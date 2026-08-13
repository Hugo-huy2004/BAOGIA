import { describe, it, expect } from 'vitest';
import { WEB_COURSES, STAGES } from '../../src/components/member/hugoCoder/lessons/index.js';
import { stripCodeComments } from '../../src/components/member/hugoCoder/workspaceUtils.js';

// Khung bài học của HugoCoder là hợp đồng, không phải quy ước miệng. 100 bài do
// nhiều đợt viết ra; không có bài test này thì chỉ cần một bài thiếu `theory`
// hay một `verify` viết lỏng là học viên qua bài mà không gõ dòng nào — và bài
// đó vẫn tính vào giấy chứng nhận.

const PRACTICE_TYPES = new Set([
  'code_challenge', 'quiz', 'drag_drop_html', 'drag_drop_sql',
  'theme_match', 'php_match', 'js_button', 'screenshot_upload',
  'graduation_submission',
]);

const codeLessons = WEB_COURSES.filter((c) => c.practiceType === 'code_challenge');
const quizLessons = WEB_COURSES.filter((c) => c.practiceType === 'quiz');

describe('bộ 100 bài HugoCoder', () => {
  it('đủ 100 bài, id duy nhất và đúng thứ tự lesson1..lesson100', () => {
    expect(WEB_COURSES).toHaveLength(100);
    expect(new Set(WEB_COURSES.map((c) => c.id)).size).toBe(100);
    expect(WEB_COURSES.map((c) => c.id)).toEqual(
      Array.from({ length: 100 }, (_, i) => `lesson${i + 1}`),
    );
  });

  it('6 chặng phủ kín 100 bài, không chồng lấn không hở', () => {
    expect(STAGES.map((s) => s.from)).toEqual([0, 10, 25, 50, 70, 90]);
    expect(STAGES.map((s) => s.to)).toEqual([10, 25, 50, 70, 90, 100]);
    for (const stage of STAGES) {
      expect(WEB_COURSES.slice(stage.from, stage.to).length).toBe(stage.to - stage.from);
    }
  });

  it.each(WEB_COURSES.map((c) => [c.id, c]))('%s — đủ khung 5 phần', (_id, course) => {
    // Phần 1 — tổng quan & mục tiêu
    expect(course.overview?.description?.length).toBeGreaterThan(30);
    expect(course.overview?.outcomes?.length).toBeGreaterThanOrEqual(1);
    // Phần 2 — lý thuyết
    expect(course.theory?.length).toBeGreaterThan(200);
    // Phần 3 — thực hành từng bước
    expect(course.labSteps?.length).toBeGreaterThanOrEqual(3);
    // Phần 4 — bẫy lỗi, mỗi bẫy đủ ba vế
    expect(course.commonMistakes?.length).toBeGreaterThanOrEqual(1);
    for (const mistake of course.commonMistakes) {
      expect(mistake.symptom && mistake.cause && mistake.fix).toBeTruthy();
    }
    // Phần 5 — thử thách + checklist tự kiểm
    expect(course.challenge?.length).toBeGreaterThan(20);
    expect(course.checklist?.length).toBeGreaterThanOrEqual(1);
    // Siêu dữ liệu dùng cho giao diện và bộ chấm
    expect(course.title).toMatch(/^\d+\./);
    expect(course.duration).toBeTruthy();
    expect(PRACTICE_TYPES.has(course.practiceType)).toBe(true);
    expect(typeof course.verify).toBe('function');
  });

  it.each(codeLessons.map((c) => [c.id, c]))('%s — chấm bài phải thật sự phân biệt', (_id, course) => {
    // Nộp rỗng: trượt.
    expect(course.verify('')).toBe(false);
    // Nộp nguyên mẫu: trượt. Bộ chấm nhận code ĐÃ bỏ comment (xem
    // MemberIdeTab), nên chữ trong TODO không cứu được bài nộp.
    expect(course.verify(stripCodeComments(course.starterCode || ''))).toBe(false);
  });

  it.each(quizLessons.map((c) => [c.id, c]))('%s — ngân hàng đề đủ rút', (_id, course) => {
    expect(course.quizPool.length).toBeGreaterThanOrEqual(course.quizSize);
  });

  it('mọi câu trắc nghiệm có đáp án hợp lệ', () => {
    for (const course of WEB_COURSES) {
      for (const question of [...(course.miniQuiz || []), ...(course.quizPool || [])]) {
        expect(question.o.length).toBeGreaterThanOrEqual(2);
        expect(question.a).toBeGreaterThanOrEqual(0);
        expect(question.a).toBeLessThan(question.o.length);
      }
    }
  });
});
