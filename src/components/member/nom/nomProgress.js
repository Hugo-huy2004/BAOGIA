/**
 * Tiến độ học chữ Nôm — lưu trên máy người học.
 *
 * ponytail: localStorage, không đồng bộ lên máy chủ. Đây là tiến độ học của
 * một người trên một máy, không phải tài sản cần khôi phục; đẩy lên máy chủ
 * chỉ khi người học thật sự đòi học tiếp trên máy khác.
 *
 * Nhớ theo CHỮ chứ không theo bài: người học có thể gặp lại một chữ ở bài sau,
 * và cái đáng đếm là "đã thuộc bao nhiêu chữ", không phải "đã mở bao nhiêu bài".
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
    /* chế độ riêng tư: không nhớ được thì học lại từ đầu, không làm vỡ app */
  }
};

/** Số lần nhận đúng liên tiếp để coi là ĐÃ THUỘC. */
export const MASTER_AT = 3;

export const progress = () => read();

export const knownChars = () => {
  const all = read();
  return new Set(Object.keys(all).filter((ch) => (all[ch]?.streak || 0) >= MASTER_AT));
};

/** Ghi một lần trả lời. Sai thì chuỗi đúng về 0 — thuộc là thuộc chắc. */
export function record(char, correct) {
  const all = read();
  const entry = all[char] || { streak: 0, seen: 0, wrong: 0 };
  entry.seen += 1;
  if (correct) entry.streak += 1;
  else { entry.streak = 0; entry.wrong += 1; }
  entry.at = Date.now();
  all[char] = entry;
  write(all);
  return entry;
}

export function resetAll() {
  write({});
}
