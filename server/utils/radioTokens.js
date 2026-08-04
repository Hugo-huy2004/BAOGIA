/**
 * Hạn mức giờ nghe HugoRadio — logic thuần, không chạm express/mongoose.
 * Tách khỏi routes/radioRoutes.js để test chạy được bằng vitest ở gốc repo:
 * CI chỉ `npm ci` ở gốc, không cài server/node_modules, nên bất cứ test nào
 * import file route đều chết ở `import express`.
 */

// Weekly free allowance in minutes (5 hours)
export const WEEKLY_FREE_MINUTES = 300;
// Milliseconds in one week
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Cộng dồn số thập phân qua hàng trăm nhịp sẽ trôi (0.1 + 0.2…) — chốt hai chữ số.
const round2 = (value) => Math.round(value * 100) / 100;

// Helper: reset weekly free pool if a new week has started since last reset.
export function ensureWeeklyReset(radioTokens) {
  const now = Date.now();
  const lastReset = radioTokens.weeklyResetAt ? new Date(radioTokens.weeklyResetAt).getTime() : 0;
  if (!lastReset || (now - lastReset) >= WEEK_MS) {
    radioTokens.weeklyUsedMinutes = 0;
    radioTokens.weeklyFreeMinutes = WEEKLY_FREE_MINUTES;
    radioTokens.weeklyResetAt = new Date(now);
  }
  return radioTokens;
}

/**
 * Trừ số phút vừa nghe: hết hạn mức miễn phí 5 giờ/tuần rồi mới đụng tới phần
 * đã mua. Hàm thuần, không chạm database — để kiểm chứng được bằng test.
 */
export function applyListening(tokens, minutes) {
  let remaining = Math.max(0, minutes);

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
