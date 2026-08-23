/**
 * Ngân hàng đề thi cuối chặng, tách khỏi file bài giảng.
 *
 * Để riêng vì hai thứ này đổi theo hai nhịp khác nhau: nội dung bài giảng sửa
 * theo giáo trình, ngân hàng đề sửa theo chất lượng đánh giá. Trộn vào nhau thì
 * mỗi lần thêm câu hỏi lại phải mở một file bài giảng dài hai nghìn dòng — đúng
 * lý do `variedQuestions.js` cũng đứng riêng.
 */
import { EXAM_SIZE } from "../../../../../../shared/examBlueprint.js";
import lesson6 from "./lesson6.js";
import lesson25 from "./lesson25.js";
import lesson50 from "./lesson50.js";
import lesson57 from "./lesson57.js";
import lesson58 from "./lesson58.js";

export const EXAM_BANKS = Object.freeze({
  lesson6,
  lesson25,
  lesson50,
  lesson57,
  lesson58,
});

/** Gắn ngân hàng đề vào đúng bài thi; bài khác giữ nguyên. */
export function withExamBanks(courses) {
  return courses.map((course) => {
    const bank = EXAM_BANKS[course.id];
    if (!bank) return course;
    return { ...course, quizPool: bank, quizSize: EXAM_SIZE };
  });
}
