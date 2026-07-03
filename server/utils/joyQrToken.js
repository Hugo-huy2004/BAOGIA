// Signed, time-bound JOY QR tokens.
//
// This is the layer that actually guarantees "only our system issues valid
// codes": each token carries an HMAC-SHA256 tag computed with a server secret,
// so nobody without the secret can forge a token that resolve-qr will accept.
// The client only transports the opaque bytes — it never signs or verifies.
//
// Token = 10 bytes (fits the particle code exactly):
//   bytes 0..5 : referral code (8 base36 chars) packed big-endian
//   bytes 6..9 : first 4 bytes of HMAC-SHA256(secret, `${referral}|${bucket}`)
// `bucket = floor(now / BUCKET_MS)` is NOT stored — the verifier recomputes it
// for the current and previous window, so a token is valid for ~1–2 buckets and
// then expires (anti-replay). The displayed code rotates as the bucket advances.

import crypto from 'crypto';
import { JOY_QR_SECRET as SECRET } from './secrets.js';

// 2-minute buckets; accepting current + previous gives a ~2–4 minute lifetime.
export const JOY_QR_BUCKET_MS = 120000;

const B36 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// 8 base36 chars <-> 6 bytes. Non-conforming input is uppercased, stripped to
// [0-9A-Z], and padded/truncated to 8 so packing always round-trips.
function canonical(code) {
  return String(code || '').toUpperCase().replace(/[^0-9A-Z]/g, '0').slice(0, 8).padEnd(8, '0');
}
function packReferral(code) {
  let v = 0n;
  for (const ch of canonical(code)) v = v * 36n + BigInt(B36.indexOf(ch));
  const out = Buffer.alloc(6);
  for (let i = 5; i >= 0; i--) { out[i] = Number(v & 0xffn); v >>= 8n; }
  return out;
}
function unpackReferral(buf6) {
  let v = 0n;
  for (let i = 0; i < 6; i++) v = (v << 8n) | BigInt(buf6[i]);
  let s = '';
  for (let i = 0; i < 8; i++) { s = B36[Number(v % 36n)] + s; v /= 36n; }
  return s;
}
function sig4(referral, bucket) {
  return crypto.createHmac('sha256', SECRET).update(`${referral}|${bucket}`).digest().subarray(0, 4);
}

// referralCode -> base64url token string for the current time bucket.
export function signQrToken(referralCode) {
  const packed = packReferral(referralCode);
  const referral = unpackReferral(packed); // canonical form the verifier will see
  const bucket = Math.floor(Date.now() / JOY_QR_BUCKET_MS);
  const token = Buffer.concat([packed, sig4(referral, bucket)]); // 6 + 4 = 10 bytes
  return token.toString('base64url');
}

// base64url token -> canonical referral code, or null if forged/expired.
export function verifyQrToken(b64) {
  try {
    const token = Buffer.from(String(b64 || ''), 'base64url');
    if (token.length !== 10) return null;
    const referral = unpackReferral(token.subarray(0, 6));
    const provided = token.subarray(6, 10);
    const bucket = Math.floor(Date.now() / JOY_QR_BUCKET_MS);
    for (const b of [bucket, bucket - 1]) {
      const expected = sig4(referral, b);
      if (provided.length === expected.length && crypto.timingSafeEqual(provided, expected)) {
        return referral;
      }
    }
    return null;
  } catch {
    return null;
  }
}
