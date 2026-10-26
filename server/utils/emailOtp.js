import crypto from 'crypto';

/**
 * Kho mã OTP gửi qua email, dùng chung cho đăng nhập magic-OTP và cho đợt kiểm
 * tra thông tin định kỳ. Trước đây kho này là một Map nằm kẹt trong
 * memberAuthRoutes nên chỗ nào cần OTP cũng phải tự đẻ ra một kho riêng —
 * nhiều kho là nhiều cách hết hạn khác nhau, và sớm muộn có cái quên xoá mã
 * sau khi dùng.
 *
 * Mã chỉ lưu dạng băm: log hay dump bộ nhớ cũng không đọc ra được mã đang sống.
 *
 * ponytail: để trong RAM nên khởi động lại là mất, và nhiều instance thì không
 * chia sẻ được. Đủ dùng cho mã sống 10 phút; cần bền thì đổi sang Redis
 * (REDIS_URL đã có sẵn chỗ cắm).
 */
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_LIVE_OTPS = 10000;
const store = new Map();

const hash = (code) => crypto.createHash('sha256').update(String(code).trim()).digest('hex');

// So sánh chuỗi bằng `===` dừng ngay ký tự đầu khác nhau, nên thời gian trả lời
// rò rỉ "đúng được mấy ký tự" — đủ để dò dần từng ký tự qua mạng ổn định. Băm
// luôn dài bằng nhau nên timingSafeEqual dùng được thẳng.
const sameSecret = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};
const keyOf = (email, scope) => `${scope}:${String(email).trim().toLowerCase()}`;

/** Tạo mã 6 số mới cho (email, scope). Mã cũ của cùng cặp đó bị thay thế. */
export function issueEmailOtp(email, scope = 'login') {
  const code = String(crypto.randomInt(100000, 1000000));
  const key = keyOf(email, scope);
  if (store.size >= MAX_LIVE_OTPS && !store.has(key)) store.delete(store.keys().next().value);
  const entry = { codeHash: hash(code), expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 };
  store.set(key, entry);
  setTimeout(() => {
    if (store.get(key) === entry) store.delete(key);
  }, OTP_TTL_MS + 1000).unref?.();
  return code;
}

/**
 * Trả { ok } hoặc { ok: false, reason: 'expired' | 'mismatch' }.
 * Đúng thì mã bị xoá ngay — dùng một lần là một lần.
 */
export function verifyEmailOtp(email, code, scope = 'login') {
  const key = keyOf(email, scope);
  const entry = store.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    store.delete(key);
    return { ok: false, reason: 'expired' };
  }
  if (!sameSecret(hash(code), entry.codeHash)) {
    entry.attempts += 1;
    if (entry.attempts >= MAX_ATTEMPTS) store.delete(key);
    return { ok: false, reason: 'mismatch' };
  }
  store.delete(key);
  return { ok: true };
}

/** Còn mã nào đang sống không — để không bắt người dùng chờ gửi lại vô ích. */
export function hasLiveEmailOtp(email, scope = 'login') {
  const entry = store.get(keyOf(email, scope));
  return Boolean(entry && Date.now() <= entry.expiresAt);
}

export default { issueEmailOtp, verifyEmailOtp, hasLiveEmailOtp };
