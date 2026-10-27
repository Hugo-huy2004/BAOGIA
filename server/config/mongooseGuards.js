/**
 * Chốt chặn cuối ở tầng cơ sở dữ liệu.
 *
 * `requestThreatGuard` và `express-mongo-sanitize` đã lọc toán tử `$` trong body
 * và query của HTTP. Nhưng dữ liệu còn vào bằng đường khác: tin nhắn WebSocket,
 * webhook Telegram/PayOS, cron đọc dữ liệu cũ, script admin. Lớp này đứng ngay
 * trước MongoDB nên mọi đường đều phải đi qua:
 *
 *   - Cấm toán tử chạy JavaScript phía server ($where, $function, $accumulator):
 *     mã của ứng dụng không dùng chúng, nên gặp là bị chèn — từ chối luôn.
 *   - Cấm khoá làm bẩn prototype (__proto__, constructor, prototype).
 *
 * Phải được import TRƯỚC mọi model: plugin toàn cục của Mongoose chỉ gắn vào
 * schema biên dịch sau khi đăng ký. server.js import tệp này ở dòng đầu tiên.
 */
import mongoose from 'mongoose';

const FORBIDDEN_KEYS = new Set(['$where', '$function', '$accumulator', '__proto__', 'constructor', 'prototype']);
const MAX_DEPTH = 32;

export class UnsafeQueryError extends Error {
  constructor(key) {
    super(`Truy vấn bị chặn: toán tử không được phép (${key}).`);
    this.name = 'UnsafeQueryError';
    this.status = 400;
  }
}

/** Trả về khoá cấm đầu tiên tìm thấy, hoặc '' nếu sạch. */
export function findForbiddenKey(value, depth = 0) {
  if (!value || typeof value !== 'object' || depth > MAX_DEPTH) return '';
  // ObjectId, Date, Buffer… không phải đối tượng truy vấn, bỏ qua cho nhanh.
  if (value instanceof Date || Buffer.isBuffer(value) || value._bsontype) return '';
  if (Array.isArray(value)) {
    for (const item of value) {
      const hit = findForbiddenKey(item, depth + 1);
      if (hit) return hit;
    }
    return '';
  }
  for (const key of Object.keys(value)) {
    if (FORBIDDEN_KEYS.has(key)) return key;
    const hit = findForbiddenKey(value[key], depth + 1);
    if (hit) return hit;
  }
  return '';
}

const QUERY_HOOKS = [
  'countDocuments', 'deleteMany', 'deleteOne', 'distinct', 'find', 'findOne',
  'findOneAndDelete', 'findOneAndReplace', 'findOneAndUpdate', 'replaceOne',
  'updateMany', 'updateOne',
];

function guardQuery() {
  const key = findForbiddenKey(this.getFilter()) || findForbiddenKey(this.getUpdate?.());
  if (key) throw new UnsafeQueryError(key);
}

function guardAggregate() {
  const key = findForbiddenKey(this.pipeline());
  if (key) throw new UnsafeQueryError(key);
}

export function queryGuardPlugin(schema) {
  schema.pre(QUERY_HOOKS, guardQuery);
  schema.pre('aggregate', guardAggregate);
}

mongoose.plugin(queryGuardPlugin);
