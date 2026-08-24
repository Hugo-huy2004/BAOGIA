import crypto from 'crypto';

const SECRET = process.env.JWT_SECRET || 'hugo_cinema_stream_secret_key_2026';
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Sinh token mã hoá HMAC có thời hạn 2 giờ cho một luồng xem phim.
 */
export function generateCinemaStreamToken(movieId, email) {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `${movieId}:${email}:${expiresAt}`;
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(payload)
    .digest('hex');

  const rawToken = `${payload}:${signature}`;
  return Buffer.from(rawToken).toString('base64url');
}

/**
 * Kiểm tra token luồng phim. Trả về metadata { movieId, email } hoặc null nếu hết hạn/sai chữ ký.
 */
export function verifyCinemaStreamToken(tokenString) {
  if (!tokenString) return null;
  try {
    const rawToken = Buffer.from(tokenString, 'base64url').toString('utf8');
    const parts = rawToken.split(':');
    if (parts.length !== 4) return null;

    const [movieId, email, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    if (Number.isNaN(expiresAt) || Date.now() > expiresAt) return null;

    const payload = `${movieId}:${email}:${expiresAtStr}`;
    const expectedSignature = crypto
      .createHmac('sha256', SECRET)
      .update(payload)
      .digest('hex');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);

    if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { movieId, email, expiresAt };
    }
  } catch {
    return null;
  }
  return null;
}
