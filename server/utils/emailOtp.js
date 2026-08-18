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
const store = new Map();

const hash = (code) => crypto.createHash('sha256').update(String(code).trim()).digest('hex');
const keyOf = (email, scope) => `${scope}:${String(email).trim().toLowerCase()}`;

/** Tạo mã 6 số mới cho (email, scope). Mã cũ của cùng cặp đó bị thay thế. */
export function issueEmailOtp(email, scope = 'login') {
  const code = String(crypto.randomInt(100000, 1000000));
  store.set(keyOf(email, scope), { codeHash: hash(code), expiresAt: Date.now() + OTP_TTL_MS });
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
  if (hash(code) !== entry.codeHash) return { ok: false, reason: 'mismatch' };
  store.delete(key);
  return { ok: true };
}

/** Còn mã nào đang sống không — để không bắt người dùng chờ gửi lại vô ích. */
export function hasLiveEmailOtp(email, scope = 'login') {
  const entry = store.get(keyOf(email, scope));
  return Boolean(entry && Date.now() <= entry.expiresAt);
}

export default { issueEmailOtp, verifyEmailOtp, hasLiveEmailOtp };
