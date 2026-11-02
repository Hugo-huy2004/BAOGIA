// Tài khoản đã lưu trên máy + mục tiêu chọn lúc onboarding — tách khỏi EduOnboard.jsx để
// EducationApp dùng mà không kéo cả màn onboarding vào gói đầu.
export const ACCOUNTS = "edu.accounts";
export const GOAL = "edu.pendingGoal";
export const GOALS = [1, 2, 3, 5];

export const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
export const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* chế độ riêng tư */ } };

/** Ghi tài khoản vừa dùng vào danh sách "đã lưu trên máy" (mới nhất lên đầu, tối đa 5). Chỉ tên + email + avatar, không token. */
export function rememberAccount({ email, name, avatar }) {
  if (!email) return;
  write(ACCOUNTS, [{ email, name: name || "", avatar: avatar || null }, ...read(ACCOUNTS, []).filter((a) => a.email !== email)].slice(0, 5));
}

/** Mục tiêu đã chọn trong onboarding — lấy ra một lần sau khi đăng nhập. */
export function takePendingGoal() {
  const goal = read(GOAL, null);
  try { localStorage.removeItem(GOAL); } catch { /* bỏ qua */ }
  return GOALS.includes(goal) ? goal : null;
}


// Lần đầu vào Edu: chọn ngôn ngữ + đồng ý điều khoản (EduWelcome). Đổi VERSION là hỏi lại.
export const KEY = "edu.consent";
export const VERSION = 1;

export function needsWelcome() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null")?.v !== VERSION;
  } catch {
    return false; // không có bộ nhớ (chế độ riêng tư chặn): đừng chặn người học mỗi lần tải
  }
}
