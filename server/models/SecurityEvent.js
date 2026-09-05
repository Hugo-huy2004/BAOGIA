import mongoose from 'mongoose';

// Security audit events intentionally contain no raw request body or direct
// identifiers. Evidence is represented by a digest and a stable rule id, which
// is enough to correlate repeats without retaining harmful/private content.
const SecurityEventSchema = new mongoose.Schema({
  caseId: { type: String, required: true, unique: true, index: true },
  category: {
    type: String,
    enum: ['intrusion', 'joy_abuse', 'availability_attack', 'system_attack', 'violent_facilitation', 'identity_fraud'],
    required: true,
    index: true,
  },
  severity: { type: String, enum: ['high', 'critical'], required: true, index: true },
  action: { type: String, enum: ['rejected', 'temporary_block', 'permanent_block'], required: true },
  ruleId: { type: String, required: true },
  method: { type: String, default: '' },
  path: { type: String, default: '' },
  ipHash: { type: String, default: '', index: true },
  // Nhãn MẠNG của kẻ gõ cửa (tên miền ngược / nhà cung cấp), suy ra từ IP tấn
  // công lúc xảy ra sự kiện. Không phải dữ liệu cá nhân của người dùng — đây là
  // hạ tầng của bên tấn công, và là thứ trả lời "chúng đến từ đâu". Ta vẫn chỉ
  // lưu IP dạng băm (ipHash), không giữ IP thô.
  network: { type: String, default: '', index: true },
  emailHash: { type: String, default: '', index: true },
  phoneHash: { type: String, default: '', index: true },
  evidenceHash: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

// Six months is enough for repeat-abuse investigations while bounding storage
// and avoiding indefinite retention of behavioural security telemetry.
SecurityEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

export default mongoose.model('SecurityEvent', SecurityEventSchema);
