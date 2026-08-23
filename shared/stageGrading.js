/**
 * Xếp loại từng chặng — dùng chung cho máy chủ (cấp chứng chỉ) và giao diện.
 *
 * Trước đây chứng chỉ chỉ có hai trạng thái: học hết bài thì được cấp, chưa hết
 * thì không. Hai người cùng cầm một tờ giấy dù một người thi 92% lần đầu, người
 * kia 61% ở lần thứ tư. Ở đây chứng chỉ nói ra năng lực thật.
 *
 * Điểm chặng = 3 thành phần, mỗi thành phần 0–100:
 *
 *   Bài thi   70%  — điểm bài thi cuối chặng (chặng nào không có bài thi thì
 *                    phần này dồn sang phần hoàn thành, xem `WEIGHTS_NO_EXAM`)
 *   Hoàn tất  20%  — tỉ lệ bài đã học xong trong chặng
 *   Bền bỉ    10%  — đỗ ngay lần đầu được trọn, mỗi lần thi lại trừ dần
 *
 * `firstTry` được ưu tiên hơn `best`: đó là điểm phản ánh đúng lúc học xong.
 * Nhưng thi lại vẫn có ý nghĩa — điểm cuối cùng lấy trung bình có trọng số
 * nghiêng về lần đầu, để người ôn lại vẫn được ghi nhận mà không "mua" được
 * hạng cao bằng cách thi mãi.
 */
export const GRADE_BANDS = Object.freeze([
  { min: 90, id: "excellent", label: "Xuất sắc", note: "Nắm chắc toàn chặng, làm được ngay." },
  { min: 80, id: "great", label: "Giỏi", note: "Vững kiến thức, chỉ còn vài chỗ nhỏ." },
  { min: 70, id: "good", label: "Khá", note: "Đủ dùng, nên ôn lại phần còn yếu." },
  { min: 60, id: "pass", label: "Đạt", note: "Qua chặng, nhưng nền chưa chắc." },
  { min: 0, id: "none", label: "Chưa đạt", note: "Cần học lại trước khi đi tiếp." },
]);

const WEIGHTS = Object.freeze({ exam: 0.7, completion: 0.2, persistence: 0.1 });
// Chặng không có bài thi (đồ án/tốt nghiệp): phần bài thi dồn sang hoàn thành.
const WEIGHTS_NO_EXAM = Object.freeze({ exam: 0, completion: 0.9, persistence: 0.1 });

export const STAGE_PASS_SCORE = 60;

export function gradeOf(score) {
  return GRADE_BANDS.find((band) => score >= band.min) || GRADE_BANDS[GRADE_BANDS.length - 1];
}

/**
 * Điểm bài thi của chặng: nghiêng về lần đầu (70%) nhưng vẫn ghi nhận lần tốt
 * nhất (30%). Nhiều bài thi trong một chặng thì lấy trung bình.
 */
function examScore(examIds, scores) {
  const results = examIds
    .map((id) => scores?.[id])
    .filter((entry) => entry && typeof entry.best === "number");
  if (!results.length) return null;

  const total = results.reduce((sum, entry) => {
    const firstTry = typeof entry.firstTry === "number" ? entry.firstTry : entry.best;
    return sum + (firstTry * 0.7 + entry.best * 0.3);
  }, 0);
  return total / results.length;
}

/** Mỗi lượt thi lại quá lượt đầu trừ 25 điểm bền bỉ, sàn 0. */
function persistenceScore(examIds, scores) {
  if (!examIds.length) return 100;
  const attempts = examIds.map((id) => Number(scores?.[id]?.attempts || 0)).filter((n) => n > 0);
  if (!attempts.length) return 100;
  const extra = attempts.reduce((sum, n) => sum + Math.max(0, n - 1), 0) / attempts.length;
  return Math.max(0, Math.round(100 - extra * 25));
}

/**
 * Chấm một chặng.
 *
 * @param {object} input
 * @param {string[]} input.lessonIds     mọi bài trong chặng
 * @param {string[]} input.examIds       bài thi thuộc chặng (có thể rỗng)
 * @param {string[]} input.completedLessons  bài đã hoàn thành của người học
 * @param {object}   input.examScores    bio.hugoCoderExamScores
 */
export function gradeStage({ lessonIds = [], examIds = [], completedLessons = [], examScores = {} }) {
  const done = new Set(completedLessons);
  const completedInStage = lessonIds.filter((id) => done.has(id)).length;
  const completion = lessonIds.length ? (completedInStage / lessonIds.length) * 100 : 0;

  const exam = examScore(examIds, examScores);
  const persistence = persistenceScore(examIds, examScores);
  // Có bài thi nhưng chưa thi lần nào thì không thể xếp loại theo bài thi —
  // dùng công thức không-bài-thi để không cho điểm khống 0%.
  const weights = exam === null ? WEIGHTS_NO_EXAM : WEIGHTS;

  const score = Math.round(
    (exam ?? 0) * weights.exam
    + completion * weights.completion
    + persistence * weights.persistence,
  );

  // Đã học hết bài VÀ mọi bài thi đều vượt sàn thì người này đủ điều kiện nhận
  // chứng chỉ — hạng thấp nhất lúc đó là "Đạt", không bao giờ là "Chưa đạt".
  // Thi tới lần thứ tám mới đỗ thì điểm thấp là đúng, nhưng in "Chưa đạt" lên
  // tờ giấy vừa cấp cho họ thì tự mâu thuẫn.
  const clearedEveryExam = examIds.length === 0
    || examIds.every((id) => Number(examScores?.[id]?.best || 0) >= STAGE_PASS_SCORE);
  const completedAll = lessonIds.length > 0 && completedInStage === lessonIds.length;
  const qualifies = completedAll && clearedEveryExam;

  const grade = qualifies ? gradeOf(Math.max(score, STAGE_PASS_SCORE)) : gradeOf(score);
  return {
    score,
    grade: grade.id,
    gradeLabel: grade.label,
    gradeNote: grade.note,
    passed: qualifies,
    breakdown: {
      exam: exam === null ? null : Math.round(exam),
      completion: Math.round(completion),
      persistence,
      completedInStage,
      lessonsInStage: lessonIds.length,
      examCount: examIds.length,
      // Số lượt thi đã dùng, để chứng chỉ nói được "đỗ ngay lần đầu".
      attempts: examIds.reduce((sum, id) => sum + Number(examScores?.[id]?.attempts || 0), 0),
    },
    weights,
  };
}
