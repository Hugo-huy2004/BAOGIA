import mongoose from 'mongoose';

// A block stores only a keyed HMAC of the network/account identifier. Raw IPs,
// emails and phone numbers do not belong in the enforcement table: operators
// can still match future requests without turning this collection into a new
// source of sensitive data if the database is ever exposed.
const SecurityBlockSchema = new mongoose.Schema({
  actorKey: { type: String, required: true, unique: true, index: true },
  subjectType: { type: String, enum: ['ip', 'email', 'phone'], required: true },
  subjectHash: { type: String, required: true, index: true },
  permanent: { type: Boolean, default: false, index: true },
  expiresAt: { type: Date, default: null, index: true },
  lockCount: { type: Number, default: 0, min: 0 },
  reasonCode: { type: String, default: 'security_policy' },
  lastCaseId: { type: String, default: '' },
  lastLockedAt: { type: Date, default: Date.now },
  // CHỈ cho auto-block IP kẻ tấn công: giữ IP thô + id rule Cloudflare để nút
  // "gỡ chặn" trên Telegram gỡ được cả ở tường lửa edge. Đây là hạ tầng của
  // bên tấn công, không phải dữ liệu người dùng.
  edgeIp: { type: String, default: '' },
  edgeRuleId: { type: String, default: '' },
}, { timestamps: true });

SecurityBlockSchema.index({ subjectType: 1, subjectHash: 1 }, { unique: true });

export default mongoose.model('SecurityBlock', SecurityBlockSchema);
