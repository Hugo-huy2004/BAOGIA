/**
 * Khảo sát định kỳ (server/routes/surveyRoutes.js).
 *
 * Mọi hàm ở đây NUỐT LỖI và trả về giá trị trung tính. Khảo sát là thứ phụ:
 * mạng chập chờn hay server trả 500 thì người dùng không được thấy gì cả, chứ
 * không phải thấy một thông báo đỏ về bảng hỏi họ chưa từng mở.
 *
 * Token do apiAuthInterceptor.js tự gắn — không tự dựng header ở đây.
 */
const BASE = "/api/survey";

/** Đợt của tháng này, hoặc `null` khi không có gì để hỏi. */
export async function fetchDueSurvey() {
  try {
    const res = await fetch(`${BASE}/due`, { credentials: "include" });
    if (!res.ok) return null;
    return (await res.json())?.survey || null;
  } catch {
    return null;
  }
}

/** Gửi câu trả lời. Trả `true` khi đã ghi được. */
export async function submitSurvey(month, answers) {
  try {
    const res = await fetch(`${BASE}/answer`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, answers }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Ghi nhận một lượt mở ứng dụng — bắn đi rồi quên.
 *
 * Chỉ bắn MỘT lần mỗi app mỗi phiên: máy chủ đã gộp theo ngày rồi, nên bắn
 * thêm chỉ tốn lượt gọi. Người mở đi mở lại một app trong một buổi không cần
 * chục request giống hệt nhau.
 */
const sentThisSession = new Set();

export function trackAppOpen(appId) {
  if (!appId || sentThisSession.has(appId)) return;
  sentThisSession.add(appId);
  fetch(`${BASE}/track`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ appId }),
    keepalive: true,
  }).catch(() => {
    // Hỏng thì thôi — và XOÁ dấu để lần mở sau thử lại, nếu không một lần mất
    // mạng lúc khởi động sẽ làm cả phiên không ghi được gì.
    sentThisSession.delete(appId);
  });
}
