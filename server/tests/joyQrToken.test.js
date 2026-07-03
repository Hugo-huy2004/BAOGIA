import { describe, it, expect, vi, afterEach } from 'vitest';
import { signQrToken, verifyQrToken, JOY_QR_BUCKET_MS } from '../utils/joyQrToken.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('joyQrToken', () => {
  it('round-trips a referral code', () => {
    const token = signQrToken('ABC12345');
    expect(verifyQrToken(token)).toBe('ABC12345');
  });

  it('canonicalizes lowercase/short codes the same way on sign and verify', () => {
    const token = signQrToken('ab1');
    expect(verifyQrToken(token)).toBe('AB100000');
  });

  it('rejects forged/garbage tokens', () => {
    expect(verifyQrToken('AAAAAAAAAAAAAA')).toBeNull();
    expect(verifyQrToken('')).toBeNull();
    expect(verifyQrToken(null)).toBeNull();
  });

  it('rejects a token whose signature bytes were tampered with', () => {
    const buf = Buffer.from(signQrToken('ABC12345'), 'base64url');
    buf[9] ^= 0xff; // flip bits in the HMAC tag
    expect(verifyQrToken(buf.toString('base64url'))).toBeNull();
  });

  it('still accepts a token from the previous time bucket, but not older', () => {
    vi.useFakeTimers();
    const t0 = Date.now();
    const token = signQrToken('ABC12345');

    vi.setSystemTime(t0 + JOY_QR_BUCKET_MS); // previous bucket — grace window
    expect(verifyQrToken(token)).toBe('ABC12345');

    vi.setSystemTime(t0 + 2 * JOY_QR_BUCKET_MS + 1); // two buckets on — expired
    expect(verifyQrToken(token)).toBeNull();
  });
});
