/**
 * Hạn mức giờ nghe HugoRadio — logic thuần, không chạm express/mongoose.
 * Tách khỏi routes/radioRoutes.js để test chạy được bằng vitest ở gốc repo:
 * CI chỉ `npm ci` ở gốc, không cài server/node_modules, nên bất cứ test nào
 * import file route đều chết ở `import express`.
 */

// Đơn vị người dùng NHÌN THẤY là token, không phải đồng hồ đếm ngược: 1 token =
// 10 phút nghe. Kho vẫn lưu bằng phút vì mọi bản ghi cũ (và sản phẩm
// `radio_time` bên cửa hàng) đã tính bằng phút — đổi đơn vị lưu trữ là một cuộc
// di trú dữ liệu không đổi lại được gì.
export const MINUTES_PER_TOKEN = 10;

// Weekly free allowance in minutes (5 hours = 30 token)
export const WEEKLY_FREE_MINUTES = 300;
export const WEEKLY_FREE_TOKENS = WEEKLY_FREE_MINUTES / MINUTES_PER_TOKEN;

// Làm TRÒN XUỐNG: 29.9 token mà hiện 30 là hứa một token không có thật, người
// dùng bấm phát rồi bị cắt giữa chừng. Số phút lẻ còn lại vẫn nghe được, giao
// diện bày nó ra dưới dạng vạch tiến trình của token đang dùng dở.
export const toTokens = (minutes) => Math.floor(Math.max(0, minutes) / MINUTES_PER_TOKEN);

// Milliseconds in one week
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Peak hours: 00:00-05:00 and 11:00-13:00 (Vietnam time, UTC+7).
// During peak hours time is deducted at 2x speed — marketing lever to
// encourage purchasing additional minutes.
export const PEAK_MULTIPLIER = 2;
const PEAK_RANGES = [
  [0, 5],    // 00:00 – 05:00
  [11, 13],  // 11:00 – 13:00
];

export function isPeakHour(date = new Date()) {
  // Convert to Vietnam time (UTC+7)
  const vnHour = new Date(date.getTime() + 7 * 60 * 60 * 1000).getUTCHours();
  return PEAK_RANGES.some(([start, end]) => vnHour >= start && vnHour < end);
}

// Cộng dồn số thập phân qua hàng trăm nhịp sẽ trôi (0.1 + 0.2…) — chốt hai chữ số.
const round2 = (value) => Math.round(value * 100) / 100;

// Helper: reset weekly free pool if a new week has started since last reset.
// Trả về `true` khi thật sự có thay đổi — /token-status bị hỏi lại mỗi lần mở
// app, gọi bio.save() vô điều kiện là một lượt ghi database cho mỗi lượt xem.
export function ensureWeeklyReset(radioTokens) {
  const now = Date.now();
  const lastReset = radioTokens.weeklyResetAt ? new Date(radioTokens.weeklyResetAt).getTime() : 0;
  if (!lastReset || (now - lastReset) >= WEEK_MS) {
    radioTokens.weeklyUsedMinutes = 0;
    radioTokens.weeklyFreeMinutes = WEEKLY_FREE_MINUTES;
    radioTokens.weeklyResetAt = new Date(now);
    return true;
  }
  return false;
}

/** Mốc reset kế tiếp — giao diện cần nó để nói "nạp lại sau N ngày". */
export function nextResetAt(radioTokens) {
  const lastReset = radioTokens?.weeklyResetAt ? new Date(radioTokens.weeklyResetAt).getTime() : Date.now();
  return new Date(lastReset + WEEK_MS);
}

/**
 * Trừ số phút vừa nghe: hết hạn mức miễn phí 5 giờ/tuần rồi mới đụng tới phần
 * đã mua. Hàm thuần, không chạm database — để kiểm chứng được bằng test.
 *
 * `peakMultiplier`: số nhân giờ cao điểm (1 = bình thường, 2 = cao điểm).
 * Thời gian thực tế nghe là `minutes`, nhưng số phút bị trừ là `minutes * peakMultiplier`.
 */
export function applyListening(tokens, minutes, peakMultiplier = 1) {
  const effectiveMinutes = round2(Math.max(0, minutes) * Math.max(1, peakMultiplier));
  let remaining = effectiveMinutes;

  const freeAvailable = Math.max(0, tokens.weeklyFreeMinutes - tokens.weeklyUsedMinutes);
  const fromFree = Math.min(freeAvailable, remaining);
  tokens.weeklyUsedMinutes = round2(tokens.weeklyUsedMinutes + fromFree);
  remaining -= fromFree;

  const fromPurchased = Math.min(Math.max(0, tokens.purchasedMinutes), remaining);
  tokens.purchasedMinutes = round2(Math.max(0, tokens.purchasedMinutes) - fromPurchased);
  remaining -= fromPurchased;

  const freeLeft = round2(Math.max(0, tokens.weeklyFreeMinutes - tokens.weeklyUsedMinutes));
  const purchasedLeft = round2(Math.max(0, tokens.purchasedMinutes));

  return {
    freeRemaining: freeLeft,
    purchasedRemaining: purchasedLeft,
    totalRemaining: round2(freeLeft + purchasedLeft),
    canListen: freeLeft + purchasedLeft > 0,
    deducted: round2(fromFree + fromPurchased),
  };
}
