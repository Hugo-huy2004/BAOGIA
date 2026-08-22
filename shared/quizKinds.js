/**
 * Các dạng câu hỏi của Study with Hugo.
 *
 * Trước file này, 471/471 câu hỏi trong giáo trình đều là trắc nghiệm bốn lựa
 * chọn. Học một trăm bài mà lần nào cũng đúng một hình thức thì người học đoán
 * theo phản xạ chứ không nghĩ — và chán.
 *
 * Hợp đồng dữ liệu giữ nguyên hình dạng cũ: câu hỏi KHÔNG có `kind` vẫn là trắc
 * nghiệm một đáp án, nên toàn bộ ngân hàng câu hỏi cũ chạy y như trước. Dạng mới
 * khai báo `kind` tường minh.
 *
 * Chấm điểm nằm ở đây chứ không nằm trong component: giao diện dựng câu hỏi ở
 * hai nơi (bảng bên cạnh cho máy tính, sổ tay cho điện thoại) và bộ kiểm tra nội
 * dung cũng cần biết thế nào là hợp lệ. Ba bản sao của luật chấm là ba cơ hội để
 * chúng lệch nhau.
 */

export const QUIZ_KINDS = Object.freeze([
  "mcq",        // chọn một trong nhiều — dạng mặc định
  "multi",      // chọn nhiều đáp án đúng
  "truefalse",  // đúng hay sai
  "blank",      // điền vào chỗ trống trong đoạn mã
  "order",      // sắp xếp các bước cho đúng thứ tự
  "match",      // nối cặp
  "bug",        // chỉ ra dòng mã sai
  "output",     // đoán kết quả đoạn mã in ra
]);

/** Dạng của một câu hỏi. Thiếu `kind` nghĩa là trắc nghiệm một đáp án. */
export const quizKind = (question) => question?.kind || "mcq";

const sameSet = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((value, index) => value === right[index]);
};

const sameOrder = (a, b) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length
  && a.every((value, index) => value === b[index]);

// So khớp câu trả lời gõ tay: bỏ khoảng trắng thừa và không phân biệt hoa
// thường. KHÔNG bỏ dấu tiếng Việt và không bỏ dấu câu — với câu hỏi điền mã
// nguồn thì `!==` khác `!=`, và đó chính là thứ đang được kiểm tra.
const normalizeTyped = (value) => String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();

/**
 * Chấm một câu. `answer` là thứ giao diện thu được, hình dạng tuỳ theo dạng câu
 * hỏi. Trả về true/false, không ném lỗi — câu chưa trả lời chỉ là câu sai.
 */
export function isQuizAnswerCorrect(question, answer) {
  switch (quizKind(question)) {
    case "multi":
      return sameSet(answer, question.a);

    case "truefalse":
      return typeof answer === "boolean" && answer === question.a;

    case "blank":
      // `a` có thể là một chuỗi, hoặc một mảng các cách viết đều được chấp nhận.
      return (Array.isArray(question.a) ? question.a : [question.a])
        .some((accepted) => normalizeTyped(accepted) === normalizeTyped(answer));

    case "order":
      return sameOrder(answer, question.a);

    case "match":
      // Đáp án là ánh xạ { chỉ số vế trái: chỉ số vế phải }. Nối đúng nghĩa là
      // mọi cặp đều trỏ về đúng chính nó.
      return Array.isArray(question.pairs)
        && question.pairs.every((_, index) => Number(answer?.[index]) === index);

    case "bug":
    case "output":
    case "mcq":
    default:
      return Number(answer) === question.a;
  }
}

/** Đáp án đúng, dạng chữ để hiện lại cho người học sau khi nộp. */
export function quizAnswerText(question) {
  switch (quizKind(question)) {
    case "multi":
      return (question.a || []).map((index) => question.o?.[index]).filter(Boolean).join(" · ");
    case "truefalse":
      return question.a ? "Đúng" : "Sai";
    case "blank":
      return Array.isArray(question.a) ? question.a[0] : String(question.a ?? "");
    case "order":
      return (question.a || []).map((index) => question.items?.[index]).filter(Boolean).join(" → ");
    case "match":
      return (question.pairs || []).map(([left, right]) => `${left} → ${right}`).join(" · ");
    case "bug":
      return `Dòng ${Number(question.a) + 1}`;
    default:
      return question.o?.[question.a] ?? "";
  }
}

const text = (value) => typeof value === "string" && value.trim().length > 0;

/**
 * Kiểm tra một câu hỏi có hợp lệ không. Trả về mảng lỗi (rỗng là đạt).
 * `scripts/check-coder-content.mjs` gọi hàm này cho từng câu trong giáo trình.
 */
export function validateQuizQuestion(question, path = "question") {
  const issues = [];
  if (!question || typeof question !== "object") {
    return [`${path}: câu hỏi không phải object.`];
  }
  if (!text(question.q)) issues.push(`${path}.q: thiếu nội dung câu hỏi.`);

  const kind = quizKind(question);
  if (!QUIZ_KINDS.includes(kind)) {
    return [...issues, `${path}.kind: dạng không hợp lệ (${kind}).`];
  }

  const checkOptions = (min) => {
    if (!Array.isArray(question.o) || question.o.length < min) {
      issues.push(`${path}.o: cần ít nhất ${min} phương án.`);
      return false;
    }
    if (question.o.some((option) => !text(option))) {
      issues.push(`${path}.o: có phương án trống.`);
    }
    const normalized = question.o.map((option) => String(option).trim().toLocaleLowerCase("vi"));
    if (new Set(normalized).size !== normalized.length) {
      issues.push(`${path}.o: có phương án trùng nhau.`);
    }
    return true;
  };

  switch (kind) {
    case "multi": {
      if (!checkOptions(3)) break;
      if (!Array.isArray(question.a) || question.a.length < 2) {
        issues.push(`${path}.a: câu chọn nhiều phải có ít nhất 2 đáp án đúng.`);
        break;
      }
      if (question.a.length >= question.o.length) {
        issues.push(`${path}.a: không thể đúng hết mọi phương án.`);
      }
      if (question.a.some((index) => !Number.isInteger(index) || index < 0 || index >= question.o.length)) {
        issues.push(`${path}.a: có chỉ số đáp án không tồn tại.`);
      }
      if (new Set(question.a).size !== question.a.length) {
        issues.push(`${path}.a: chỉ số đáp án bị lặp.`);
      }
      break;
    }

    case "truefalse":
      if (typeof question.a !== "boolean") issues.push(`${path}.a: phải là true hoặc false.`);
      if (!text(question.why)) issues.push(`${path}.why: câu đúng/sai phải giải thích vì sao.`);
      break;

    case "blank": {
      if (!text(question.code)) issues.push(`${path}.code: thiếu đoạn mã có chỗ trống.`);
      else if (!question.code.includes("___")) {
        issues.push(`${path}.code: phải có chỗ trống đánh dấu bằng ___.`);
      }
      const accepted = Array.isArray(question.a) ? question.a : [question.a];
      if (!accepted.length || accepted.some((value) => !text(value))) {
        issues.push(`${path}.a: thiếu đáp án cho chỗ trống.`);
      }
      break;
    }

    case "order":
      if (!Array.isArray(question.items) || question.items.length < 3) {
        issues.push(`${path}.items: cần ít nhất 3 bước để việc sắp xếp có nghĩa.`);
        break;
      }
      if (question.items.some((item) => !text(item))) issues.push(`${path}.items: có bước trống.`);
      if (!Array.isArray(question.a) || question.a.length !== question.items.length) {
        issues.push(`${path}.a: thứ tự đúng phải liệt kê đủ mọi bước.`);
        break;
      }
      if (new Set(question.a).size !== question.a.length
        || question.a.some((index) => !Number.isInteger(index) || index < 0 || index >= question.items.length)) {
        issues.push(`${path}.a: thứ tự đúng không phải một hoán vị hợp lệ.`);
      }
      break;

    case "match": {
      if (!Array.isArray(question.pairs) || question.pairs.length < 3) {
        issues.push(`${path}.pairs: cần ít nhất 3 cặp.`);
        break;
      }
      const flat = question.pairs.flat();
      if (question.pairs.some((pair) => !Array.isArray(pair) || pair.length !== 2)
        || flat.some((value) => !text(value))) {
        issues.push(`${path}.pairs: mỗi cặp phải là [vế trái, vế phải] và không được trống.`);
        break;
      }
      // Vế phải trùng nhau thì có hai cách nối đều "đúng" theo mắt người học,
      // nhưng bộ chấm chỉ nhận một — câu hỏi trở thành đánh đố.
      const rights = question.pairs.map(([, right]) => String(right).trim().toLocaleLowerCase("vi"));
      if (new Set(rights).size !== rights.length) {
        issues.push(`${path}.pairs: vế phải bị trùng nên câu hỏi có nhiều lời giải đúng.`);
      }
      break;
    }

    case "bug":
      if (!Array.isArray(question.lines) || question.lines.length < 3) {
        issues.push(`${path}.lines: cần ít nhất 3 dòng mã.`);
        break;
      }
      if (!Number.isInteger(question.a) || question.a < 0 || question.a >= question.lines.length) {
        issues.push(`${path}.a: dòng sai không tồn tại (${question.a}).`);
      }
      if (!text(question.why)) issues.push(`${path}.why: phải nói rõ dòng đó sai ở đâu.`);
      break;

    case "output":
      if (!text(question.code)) issues.push(`${path}.code: thiếu đoạn mã.`);
      if (!checkOptions(2)) break;
      if (!Number.isInteger(question.a) || question.a < 0 || question.a >= question.o.length) {
        issues.push(`${path}.a: chỉ số đáp án không tồn tại (${question.a}).`);
      }
      break;

    default:
      if (!checkOptions(2)) break;
      if (!Number.isInteger(question.a) || question.a < 0 || question.a >= question.o.length) {
        issues.push(`${path}.a: chỉ số đáp án không tồn tại (${question.a}).`);
      }
  }

  return issues;
}
