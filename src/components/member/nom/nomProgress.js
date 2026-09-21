/**
 * Tiến độ học chữ Nôm — lưu trên máy người học.
 *
 * ponytail: localStorage, không đồng bộ lên máy chủ. Đây là tiến độ học trên
 * đúng máy này, không phải tài sản cần khôi phục.
 *
 * Nhớ theo BÀI (mỗi bài một bộ thủ) chứ không theo từng chữ: mục tiêu của lối
 * dạy này là hiểu QUY LUẬT GHÉP, và điều đó chỉ chứng minh được bằng một bài
 * kiểm tra trên chữ chưa từng thấy — không phải bằng việc nhận ra vài mặt chữ.
 */
const KEY = "hugo_nom_progress";

const read = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  } catch {
    return {};
  }
};

const write = (value) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* chế độ riêng tư: không nhớ được thì học lại, không làm vỡ app */
  }
};

/** Điểm tối thiểu để qua môn. */
export const PASS_MARK = 0.8;

export const progress = () => read();

/** Bài đã qua môn — điểm cao nhất từng đạt ≥ 80%. */
export const passedLessons = () => {
  const all = read();
  return new Set(Object.keys(all).filter((id) => (all[id]?.best || 0) >= PASS_MARK));
};

/**
 * Ghi kết quả một lượt thi. Giữ ĐIỂM CAO NHẤT, không ghi đè bằng điểm mới:
 * thi lại để ôn mà bị tụt hạng thì người học sẽ ngại thi lại.
 */
export function recordExam(lessonId, correct, total) {
  const all = read();
  const score = total ? correct / total : 0;
  const entry = all[lessonId] || { attempts: 0, best: 0 };
  entry.attempts += 1;
  entry.last = score;
  entry.best = Math.max(entry.best || 0, score);
  entry.at = Date.now();
  all[lessonId] = entry;
  write(all);
  return entry;
}

export const resetAll = () => write({});
