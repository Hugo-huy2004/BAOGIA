/**
 * Chuyển một bài của học phần Năng suất sang các bước của `LessonPlayer`.
 *
 * Trước đây hai chương trình có hai giao diện học khác hẳn nhau: khoá Web đi
 * từng bước màn cố định có nhân vật, âm thanh và màn chúc mừng; khoá Năng suất
 * đổ cả bài ra một trang dài. Cùng một trường mà học hai kiểu thì người học phải
 * học lại cách học mỗi lần đổi khoá.
 *
 * Ở đây giáo trình KHÔNG phải sửa: bài vẫn giữ nguyên `guide`, `tip`, `quiz`,
 * `practice`; chỉ có lớp chuyển đổi này đọc chúng rồi bày thành các bước.
 *
 * Ánh xạ:
 *   summary          → một bước đọc mở đầu (mục tiêu bài)
 *   guide[]          → mỗi mục một bước thực hành, kèm việc phải tự kiểm
 *   tip              → một bước nhắc (dùng đúng ô cảnh báo của trình học)
 *   quiz             → một bước hỏi, đổi sang khuôn `{q, o, a}` chung
 *   practice         → một bước NỘP: gõ bằng chứng, đủ từ khoá mới qua được
 */
import { shuffleQuizOptions } from "../../../../shared/quizKinds";

/** Bỏ dấu để so từ khoá — người học gõ "Ho Chi Minh" hay "hồ chí minh" đều tính. */
const normalize = (value = "") => value
  .toLocaleLowerCase("vi-VN")
  .normalize("NFD")
  .replace(/[̀-ͯ]/g, "")
  .replace(/đ/g, "d")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

/** Từ khoá nào trong bài nộp đã xuất hiện — dùng cho thanh bằng chứng. */
export function practiceEvidence(step, value) {
  const text = normalize(value);
  return (step.keywords || []).map((keyword) => ({
    keyword,
    label: keyword.replaceAll("_", " "),
    matched: Boolean(text) && text.includes(normalize(keyword)),
  }));
}

export function isPracticeDone(step, value) {
  const matched = practiceEvidence(step, value).filter((item) => item.matched).length;
  return matched >= (step.minimumKeywords || 1);
}

export function buildOfficeSteps(lesson) {
  const steps = [];

  if (lesson.summary) {
    steps.push({ kind: "read", title: "Bài này làm được gì", body: lesson.summary });
  }

  (lesson.guide || []).forEach((item, index) => {
    steps.push({
      kind: "do",
      index,
      title: item.heading,
      body: item.detail,
      // Bài Năng suất làm trên công cụ thật nên không có mã mẫu; thay vào đó là
      // việc phải tự kiểm sau khi thao tác xong.
      checkpoint: item.checkpoint,
    });
  });

  if (lesson.tip) {
    steps.push({
      kind: "warn",
      title: "Ghi nhớ",
      items: [{ symptom: lesson.tip }],
    });
  }

  if (lesson.quiz) {
    steps.push({
      kind: "quiz",
      index: 0,
      title: "Kiểm tra hiểu bài",
      question: shuffleQuizOptions({
        q: lesson.quiz.question,
        o: lesson.quiz.options,
        a: lesson.quiz.correct,
        e: lesson.quiz.explanation,
      }),
    });
  }

  if (lesson.practice) {
    steps.push({
      kind: "submit",
      title: "Nộp bằng chứng",
      body: lesson.practice.prompt,
      placeholder: lesson.practice.placeholder,
      keywords: lesson.practice.keywords,
      minimumKeywords: lesson.practice.minimumKeywords,
    });
  }

  return steps;
}
