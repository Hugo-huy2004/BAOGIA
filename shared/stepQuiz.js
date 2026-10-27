/**
 * Trắc nghiệm cuối step: đề gửi xuống trình duyệt KHÔNG mang đáp án.
 *
 * Giáo trình soạn đáp án ở vị trí dễ soát (bước sắp xếp viết sẵn đúng thứ tự,
 * cặp nối viết sẵn đúng cặp). Gửi nguyên như thế thì đáp án nằm ngay trong
 * JSON. Nên trước khi gửi, máy chủ xáo phương án/bước/vế phải theo một hạt giống
 * lấy từ chính câu hỏi — cùng câu luôn ra cùng một cách xáo — rồi mới cắt
 * `a`/`why`. Lúc chấm, máy chủ dựng lại đúng đề đã xáo đó để so.
 */
import { quizKind } from "./quizKinds.js";

function seededRandom(text) {
  let h = 2166136261;
  for (const ch of String(text)) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** `perm[newIndex] = oldIndex`; không bao giờ trả thứ tự gốc khi có từ 2 phần tử. */
function permutation(length, seed) {
  const random = seededRandom(seed);
  const perm = Array.from({ length }, (_, i) => i);
  for (let i = length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  if (length > 1 && perm.every((value, index) => value === index)) perm.push(perm.shift());
  return perm;
}

const newIndexOf = (perm) => new Map(perm.map((old, now) => [old, now]));

/**
 * Hoán vị mà đáp án đúng KHÔNG nằm nguyên chỗ cũ. Mã nguồn giáo trình công
 * khai: nếu xáo xong đáp án vẫn ở vị trí gốc, người chép đáp án theo thứ tự gốc
 * trúng câu đó. Còn trùng thì xoay thêm một nấc — mỗi nấc dời mọi vị trí đi
 * một, nên đáp án chắc chắn đổi chỗ (trừ khi mọi phương án đều đúng).
 */
function answerMovingPermutation(question, seed) {
  const answers = Array.isArray(question.a) ? question.a : [question.a];
  const original = [...answers].sort((x, y) => x - y).join(",");
  let perm = permutation(question.o.length, seed);
  for (let turn = 0; turn < perm.length; turn += 1) {
    const at = newIndexOf(perm);
    if (answers.map((old) => at.get(old)).sort((x, y) => x - y).join(",") !== original) break;
    perm = [...perm.slice(1), perm[0]];
  }
  return perm;
}

/** Một câu sau khi xáo, đáp án dời theo. Vẫn còn `a`/`why` — chỉ máy chủ giữ bản này. */
function presentQuestion(question, index) {
  const seed = `${index}:${question.q}`;
  switch (quizKind(question)) {
    case "mcq":
    case "output":
    case "multi": {
      const perm = answerMovingPermutation(question, seed);
      const at = newIndexOf(perm);
      return {
        ...question,
        o: perm.map((old) => question.o[old]),
        a: Array.isArray(question.a) ? question.a.map((old) => at.get(old)).sort((x, y) => x - y) : at.get(question.a),
      };
    }
    case "order": {
      const perm = permutation(question.items.length, seed);
      const at = newIndexOf(perm);
      return { ...question, items: perm.map((old) => question.items[old]), a: question.a.map((old) => at.get(old)) };
    }
    case "match": {
      // Vế trái giữ nguyên, vế phải bị xáo: `a[i]` là vị trí đúng của vế phải cho vế trái i.
      const perm = permutation(question.pairs.length, seed);
      const at = newIndexOf(perm);
      return {
        ...question,
        pairs: question.pairs.map(([left], i) => [left, question.pairs[perm[i]][1]]),
        a: question.pairs.map((_, i) => at.get(i)),
      };
    }
    default:
      return question;
  }
}

/** Đề đầy đủ (kèm đáp án) theo đúng thứ tự người học thấy. Chỉ dùng ở máy chủ. */
export const presentQuiz = (quiz = []) => quiz.map(presentQuestion);

/** Đề gửi xuống trình duyệt: đã xáo, không đáp án, không lời giải. */
export const publicQuiz = (quiz = []) => presentQuiz(quiz).map((question) => {
  const { a, why, ...rest } = question; // eslint-disable-line no-unused-vars -- cắt đáp án và lời giải
  return rest;
});
