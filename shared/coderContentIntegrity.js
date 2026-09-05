import { validateQuizQuestion } from "./quizKinds.js";

const text = (value) => typeof value === "string" && value.trim().length > 0;
// Giữ lại toán tử: đây là khoá so trùng cho khoá học LẬP TRÌNH, mà ký hiệu
// chính là nội dung câu hỏi. Xoá sạch ký hiệu thì "0 ?? 100" và "0 || 100"
// — hai câu dạy đúng cái khác nhau giữa ?? và || — thành cùng một chuỗi.
const questionKey = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9?|&!=<>+\-*/%.]+/g, " ")
  .trim();

// Luật hợp lệ của từng dạng câu hỏi nằm ở quizKinds.js — cùng một file mà giao
// diện dùng để chấm. Giữ bản sao ở đây thì sớm muộn hai bên cũng lệch nhau.
function validateQuestion(question, path, issues) {
  issues.push(...validateQuizQuestion(question, path));
}

export function auditCoderContent(courses, stages) {
  const issues = [];
  const ids = new Set();
  const questions = new Map();
  let questionCount = 0;

  if (!Array.isArray(courses) || courses.length !== 100) {
    issues.push(`courses: cần đúng 100 bài, hiện có ${courses?.length ?? 0}.`);
  }

  for (const [courseIndex, course] of (courses || []).entries()) {
    const path = `courses[${courseIndex}]`;
    if (!text(course?.id)) issues.push(`${path}.id: thiếu ID.`);
    if (ids.has(course?.id)) issues.push(`${path}.id: ID trùng ${course.id}.`);
    ids.add(course?.id);
    if (course?.id !== `lesson${courseIndex + 1}`) {
      issues.push(`${path}.id: phải là lesson${courseIndex + 1}, nhận ${course?.id}.`);
    }
    if (!text(course?.title)) issues.push(`${path}.title: thiếu tiêu đề.`);
    if (!text(course?.practiceType)) issues.push(`${path}.practiceType: thiếu kiểu thực hành.`);

    for (const bankName of ["miniQuiz", "quizPool"]) {
      const bank = course?.[bankName];
      if (bank === undefined) continue;
      if (!Array.isArray(bank) || bank.length === 0) {
        issues.push(`${path}.${bankName}: ngân hàng câu hỏi rỗng hoặc sai kiểu.`);
        continue;
      }
      bank.forEach((question, questionIndex) => {
        questionCount += 1;
        validateQuestion(question, `${path}.${bankName}[${questionIndex}]`, issues);
        const key = questionKey(question?.q);
        if (!key) return;
        const first = questions.get(key);
        if (first) {
          issues.push(`${path}.${bankName}[${questionIndex}]: đề bài trùng ${first}.`);
        } else {
          questions.set(key, `${path}.${bankName}[${questionIndex}]`);
        }
      });
    }

    if (course?.practiceType === "quiz") {
      if (!Array.isArray(course.quizPool) || course.quizPool.length === 0) {
        issues.push(`${path}: bài thi không có quizPool.`);
      }
      if (
        !Number.isInteger(course.quizSize)
        || course.quizSize < 1
        || course.quizSize > (course.quizPool?.length || 0)
      ) {
        issues.push(`${path}.quizSize: số câu thi vượt ngoài ngân hàng đề.`);
      }
    }

    if (Array.isArray(course?.correctOrder)) {
      const blockIds = new Set((course.dragBlocks || []).map((block) => block.id));
      if (course.correctOrder.length === 0 || course.correctOrder.some((id) => !blockIds.has(id))) {
        issues.push(`${path}.correctOrder: tham chiếu block không tồn tại.`);
      }
    }

    if (course?.mobilePuzzle) {
      const { options, correctIdx } = course.mobilePuzzle;
      if (!Array.isArray(options) || options.length < 2) {
        issues.push(`${path}.mobilePuzzle.options: cần ít nhất 2 phương án.`);
      } else {
        const correctOptions = options.flatMap((option, index) => option?.correct === true ? [index] : []);
        if (!Number.isInteger(correctIdx) || correctIdx < 0 || correctIdx >= options.length) {
          issues.push(`${path}.mobilePuzzle.correctIdx: đáp án không tồn tại.`);
        } else if (correctOptions.length !== 1 || correctOptions[0] !== correctIdx) {
          issues.push(`${path}.mobilePuzzle: correctIdx không khớp phương án correct.`);
        }
      }
    }
  }

  for (const stage of stages || []) {
    if (!text(stage?.id) || !Number.isInteger(stage?.from) || !Number.isInteger(stage?.to)) {
      issues.push("stages: chặng thiếu id/from/to hợp lệ.");
      continue;
    }
    if (stage.from < 0 || stage.to > (courses?.length || 0) || stage.from >= stage.to) {
      issues.push(`stages.${stage.id}: khoảng bài không hợp lệ.`);
    }
  }

  return { valid: issues.length === 0, issues, courseCount: courses?.length || 0, questionCount };
}
