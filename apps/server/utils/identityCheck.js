/**
 * Xác nhận chủ tài khoản định kỳ — kiểu Apple, không hỏi đố.
 *
 * Bản cũ (tới 31/10/2026) hỏi lại số điện thoại / ngày sinh / mã email và khoá
 * tài khoản khi sai: người quen biết đủ để qua, còn chủ thật gõ nhầm thì bị khoá
 * oan. Giờ mỗi mốc chỉ đòi mở khoá bằng Face ID / vân tay (passkey) hoặc Google
 * — thứ chỉ chủ nhân mở được. Không có "trả lời sai", nên không có khoá oan.
 * Vừa đăng nhập bằng một trong hai sau mốc hẹn thì tính là đã qua, khỏi hỏi.
 */

// Qua một mốc thì mốc sau thưa hơn; chạm mốc cuối thì giữ ~1 năm.
export const SCHEDULE_DAYS = [30, 90, 180, 365];
const DAY_MS = 24 * 60 * 60 * 1000;

export function isDue(bio, now = Date.now()) {
  const due = bio.identityCheck?.nextDueAt;
  return Boolean(due) && new Date(due).getTime() <= now;
}

/** Hẹn mốc kế tiếp. `advance` = vừa xác nhận xong nên được giãn ra xa hơn. */
export function scheduleNext(bio, { advance = true, now = Date.now() } = {}) {
  // Kẹp lại: hồ sơ theo lịch cũ 5 mốc có thể đang giữ tier 4.
  const current = Math.min(bio.identityCheck?.tier ?? 0, SCHEDULE_DAYS.length - 1);
  const tier = advance ? Math.min(current + 1, SCHEDULE_DAYS.length - 1) : current;
  bio.identityCheck = {
    ...(bio.identityCheck?.toObject?.() || bio.identityCheck || {}),
    tier,
    nextDueAt: new Date(now + SCHEDULE_DAYS[tier] * DAY_MS),
    attempts: 0,
    pendingField: '',
  };
  return bio.identityCheck;
}

export async function recordPass(bio, now = Date.now()) {
  bio.identityCheck = {
    ...(bio.identityCheck?.toObject?.() || bio.identityCheck || {}),
    lastField: 'device',
    lastVerifiedAt: new Date(now),
    failStreak: 0,
  };
  scheduleNext(bio, { advance: true, now });
  await bio.save();
  return bio.identityCheck;
}

/** Hôm nay có phải xác nhận không. Đóng dấu luôn nếu phiên đã mở bằng Face ID/Google sau mốc. */
export async function checkDue(bio, verifiedAt) {
  if (!bio.identityCheck?.nextDueAt) {
    scheduleNext(bio, { advance: false });
    await bio.save();
    return false;
  }
  if (!isDue(bio)) return false;
  if (verifiedAt && verifiedAt >= new Date(bio.identityCheck.nextDueAt)) {
    await recordPass(bio);
    return false;
  }
  return true;
}

// Tự kiểm: node apps/server/utils/identityCheck.js
if (import.meta.url === `file://${process.argv[1]}`) {
  const assert = (await import('node:assert/strict')).default;
  const bio = (ic) => ({ identityCheck: ic, save: async () => {} });
  const past = new Date(Date.now() - DAY_MS);
  const b0 = bio(undefined);
  assert.equal(await checkDue(b0, null), false, 'new member: schedule, never ask now');
  assert.equal(b0.identityCheck.tier, 0);
  assert.equal(await checkDue(bio({ tier: 1, nextDueAt: past }), null), true, 'due without fresh proof');
  const b1 = bio({ tier: 1, nextDueAt: past });
  assert.equal(await checkDue(b1, new Date()), false, 'fresh Face ID/Google after due = passed');
  assert.equal(b1.identityCheck.tier, 2);
  assert.equal(await checkDue(bio({ tier: 1, nextDueAt: past }), new Date(past - DAY_MS)), true, 'proof older than due does not count');
  const b4 = bio({ tier: 4, nextDueAt: past });
  await recordPass(b4);
  assert.equal(b4.identityCheck.tier, 3, 'old 5-step tier clamps to last step');
  console.log('OK — identity check schedule');
}
