/**
 * Bản thiết kế đề thi cuối chặng — một nguồn sự thật cho cả client và server.
 *
 * Trước đây đề chỉ là "bốc ngẫu nhiên N câu từ một rổ", nên một lượt thi có thể
 * toàn câu lý thuyết dễ, lượt khác toàn câu khó. Ở đây đề bốc THEO NHÓM: mỗi
 * lượt thi luôn có đủ suy luận, lý thuyết, đọc–điền code và câu nâng cao của
 * chặng, đúng số lượng, nên hai người thi khác đề nhưng cùng độ khó.
 *
 * Ngân hàng 40 câu, mỗi đề rút 20 → lượt thi lại loại hết câu của lượt trước
 * vẫn còn đủ 20 câu, tức là thi lại được một đề khác hoàn toàn.
 */
export const EXAM_SIZE = 20;
export const EXAM_BANK_SIZE = 40;
export const EXAM_PASS_PERCENT = 70;

/** Nhóm câu hỏi, kèm nhãn hiển thị cho người học. */
export const EXAM_GROUPS = Object.freeze({
  logic: "Suy luận",
  theory: "Lý thuyết",
  code: "Đọc & điền code",
  advanced: "Nâng cao",
});

export const EXAM_LEVELS = Object.freeze({
  easy: "Nhẹ",
  medium: "Trung bình",
  hard: "Nâng cao",
});

/**
 * Mỗi dòng là một ô phải lấp đầy khi ra đề. `level` chỉ ràng buộc ở nhóm suy
 * luận — ba nhóm còn lại không phân tầng, độ khó nằm sẵn trong nội dung nhóm.
 */
export const EXAM_BLUEPRINT = Object.freeze([
  { group: "logic", level: "easy", count: 2 },
  { group: "logic", level: "medium", count: 2 },
  { group: "logic", level: "hard", count: 1 },
  { group: "theory", count: 5 },
  { group: "code", count: 5 },
  { group: "advanced", count: 5 },
]);

/** Số câu mỗi nhóm phải có trong ngân hàng để đề nào cũng rút đủ, kể cả lượt thi lại. */
export const EXAM_BANK_QUOTA = Object.freeze({
  logic: { easy: 4, medium: 4, hard: 2 },
  theory: 10,
  code: 10,
  advanced: 10,
});

/** Câu có khớp một ô của bản thiết kế không. */
export function matchesSlot(question, slot) {
  if (question.group !== slot.group) return false;
  return !slot.level || question.level === slot.level;
}

/**
 * Kiểm ngân hàng đề có ra được đề đúng bản thiết kế không — kể cả khi đã loại
 * hết câu của lượt thi trước. Trả về danh sách vấn đề, rỗng là đạt.
 */
export function validateExamBank(bank) {
  const problems = [];
  if (!Array.isArray(bank)) return ["ngân hàng đề không phải mảng"];
  if (bank.length !== EXAM_BANK_SIZE) {
    problems.push(`ngân hàng có ${bank.length} câu, cần đúng ${EXAM_BANK_SIZE}`);
  }

  for (const slot of EXAM_BLUEPRINT) {
    const available = bank.filter((question) => matchesSlot(question, slot)).length;
    // Cần GẤP ĐÔI: lượt thi lại loại hết câu vừa dùng mà vẫn phải lấp đủ ô này.
    if (available < slot.count * 2) {
      const name = slot.level ? `${slot.group}/${slot.level}` : slot.group;
      problems.push(`nhóm ${name} chỉ có ${available} câu, cần ${slot.count * 2} để thi lại không trùng`);
    }
  }

  const seen = new Set();
  bank.forEach((question, index) => {
    if (!question.q) problems.push(`#${index}: thiếu đề bài`);
    if (seen.has(question.q)) problems.push(`#${index}: trùng đề bài với câu trước`);
    seen.add(question.q);
    if (!Array.isArray(question.o) || question.o.length < 3) {
      problems.push(`#${index}: cần tối thiểu 3 phương án`);
    }
    if (new Set(question.o || []).size !== (question.o || []).length) {
      problems.push(`#${index}: có phương án trùng nội dung`);
    }
    if (typeof question.a !== "number" || question.a < 0 || question.a >= (question.o || []).length) {
      problems.push(`#${index}: chỉ số đáp án ${question.a} nằm ngoài mảng phương án`);
    }
    if (!EXAM_GROUPS[question.group]) problems.push(`#${index}: nhóm "${question.group}" không hợp lệ`);
    if (question.group === "logic" && !EXAM_LEVELS[question.level]) {
      problems.push(`#${index}: câu suy luận thiếu mức độ`);
    }
    // Câu nhóm `code` phải có đoạn mã, nếu không thì nó chỉ là câu lý thuyết.
    if (question.group === "code" && !question.code) {
      problems.push(`#${index}: câu đọc–điền code thiếu đoạn mã`);
    }
  });

  return problems;
}
