// Key đối tác Education Hugo: admin cấp (32 ký tự ngẫu nhiên, gửi thẳng vào mail đối
// tác, có hạn), thư viện @education-hugo/react gửi kèm mỗi yêu cầu qua header
// X-Edu-Partner-Key. Key hợp lệ = mở toàn bộ nội dung bài, không cần tài khoản.
import crypto from 'crypto';
import EduPartnerKey from '../models/EduPartnerKey.js';
import { sendAdminLetter } from './emailService.js';
import { EDU_ORIGIN } from '../../../packages/shared/eduSite.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
export const KEY_LENGTH = 32;
export const MAX_DAYS = 365;

const hash = (key) => crypto.createHash('sha256').update(key).digest('hex');

// Lấy mẫu loại bỏ (rejection sampling) để mọi ký tự đều xác suất như nhau.
export function randomKey(length = KEY_LENGTH) {
  let out = '';
  while (out.length < length) {
    for (const byte of crypto.randomBytes(length * 2)) {
      if (byte < 256 - (256 % ALPHABET.length)) out += ALPHABET[byte % ALPHABET.length];
      if (out.length === length) break;
    }
  }
  return out;
}

const cleanOrigins = (list) => [...new Set((Array.isArray(list) ? list : String(list || '').split(/[\s,]+/))
  .map((o) => String(o).trim().replace(/\/+$/, '').toLowerCase())
  .filter((o) => /^https?:\/\/[a-z0-9.-]+(:\d+)?$/.test(o)))].slice(0, 10);

export async function issuePartnerKey({ email, days = 30, origins, note = '', admin }) {
  const to = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw Object.assign(new Error('Email không hợp lệ.'), { status: 400 });
  const span = Math.min(MAX_DAYS, Math.max(1, Number.parseInt(days, 10) || 30));
  const key = randomKey();
  const expiresAt = new Date(Date.now() + span * 86400_000);
  const doc = await EduPartnerKey.create({
    email: to, keyHash: hash(key), last4: key.slice(-4), origins: cleanOrigins(origins),
    note: String(note).slice(0, 200), expiresAt, createdBy: admin,
  });
  const until = expiresAt.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  await sendAdminLetter(to, 'Key đối tác Education Hugo', [
    'Chào bạn,',
    `Hugo Studio cấp cho bạn một key đối tác để dùng thư viện Education Hugo. Key có hiệu lực ${span} ngày, tới hết ngày ${until}.`,
    `<div style="font:700 18px/1.4 ui-monospace,Menlo,monospace;letter-spacing:.06em;padding:14px 16px;border-radius:12px;background:#f1f5f9;word-break:break-all;">${key}</div>`,
    `Mở ${EDU_ORIGIN}/developers, nhập key ở mục Đối tác để xem lệnh cài đặt và hướng dẫn. Không chia sẻ key này: mỗi lượt dùng đều được ghi nhận, và key có thể bị thu hồi bất cứ lúc nào.`,
    doc.origins.length ? `Key chỉ chạy trên: ${doc.origins.join(', ')}.` : '',
  ].filter(Boolean).join('<br><br>'), { team: 'Education Hugo', eyebrow: 'Đối tác' });
  return { id: String(doc._id), email: to, last4: doc.last4, expiresAt, origins: doc.origins };
}

/** Key hợp lệ (chưa thu hồi, chưa hết hạn, đúng tên miền) → bản ghi; ngược lại null. */
export async function verifyPartnerKey(key, origin) {
  if (typeof key !== 'string' || key.length !== KEY_LENGTH) return null;
  const doc = await EduPartnerKey.findOne({ keyHash: hash(key), revokedAt: null, expiresAt: { $gt: new Date() } }).lean();
  if (!doc) return null;
  if (doc.origins.length && origin && !doc.origins.includes(String(origin).toLowerCase())) return null;
  EduPartnerKey.updateOne({ _id: doc._id }, { $set: { lastUsedAt: new Date() }, $inc: { uses: 1 } }).catch(() => {});
  return doc;
}

export const partnerKeyOf = (req) => req.get('x-edu-partner-key') || '';

export const listPartnerKeys = () => EduPartnerKey.find().sort({ createdAt: -1 }).limit(200).select('-keyHash').lean();

export const revokePartnerKey = (id) => EduPartnerKey.updateOne({ _id: id, revokedAt: null }, { $set: { revokedAt: new Date() } });
