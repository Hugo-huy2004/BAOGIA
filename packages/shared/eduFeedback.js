// Bài đánh giá Education Hugo — dùng chung web (form) + server (kiểm tra, tổng hợp admin).
export const FEEDBACK_QUESTIONS = ['content', 'ease', 'design', 'motivation', 'recommend'];

/** Làm sạch bài nộp: đủ 5 câu, mỗi câu 1–5 sao; góp ý ≤ 2000 ký tự. null = không hợp lệ. */
export function cleanFeedback(input = {}) {
  const ratings = {};
  for (const key of FEEDBACK_QUESTIONS) {
    const value = Number(input?.ratings?.[key]);
    if (!Number.isInteger(value) || value < 1 || value > 5) return null;
    ratings[key] = value;
  }
  return { ratings, comment: String(input?.comment || '').trim().slice(0, 2000) };
}
