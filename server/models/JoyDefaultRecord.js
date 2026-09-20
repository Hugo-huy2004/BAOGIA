import mongoose from 'mongoose';

/**
 * SỔ ĐEN JOYlater — hồ sơ một lần quỵt nợ, giữ VĨNH VIỄN.
 *
 * ── VÌ SAO KHÔNG LƯU TRONG BIO ──────────────────────────────────────────────
 * Vì hồ sơ phải sống lâu hơn tài khoản. Xoá Bio rồi đăng ký lại bằng đúng số
 * điện thoại đó là cách né chế tài đơn giản nhất, và nếu hồ sơ nằm trong Bio
 * thì nó biến mất cùng lúc.
 *
 * ── VÌ SAO CHỈ LƯU BĂM ──────────────────────────────────────────────────────
 * Giống SecurityBlock: đối chiếu được người quay lại mà không biến bảng này
 * thành một kho email/số điện thoại mới nếu database lộ ra. Băm bằng cùng hàm
 * `securityHash` của securityEnforcement.js, nên hai bảng khớp khoá nhau.
 *
 * ── SỐ ĐIỆN THOẠI LÀ KHOÁ CHÍNH, KHÔNG PHẢI EMAIL ───────────────────────────
 * Email mới lấy trong ba mươi giây. Số điện thoại thì đã qua xác minh trong hệ
 * này và tốn kém hơn nhiều để thay. Dò theo email chỉ là lớp phụ.
 */
const JoyDefaultRecordSchema = new mongoose.Schema({
  caseId: { type: String, required: true, unique: true },
  // Băm HMAC — xem securityEnforcement.securityHash.
  phoneHash: { type: String, default: '', index: true },
  emailHash: { type: String, required: true, index: true },

  outstanding: { type: Number, required: true, min: 0 },
  principal: { type: Number, default: 0, min: 0 },
  daysOverdue: { type: Number, default: 0, min: 0 },
  stage: { type: String, default: 'review' },

  // Hồ sơ dựng xong CHƯA có hiệu lực. Chỉ khi admin bấm duyệt (`confirmedAt`)
  // thì nó mới thành cấm vĩnh viễn — xem chú thích đầu shared/joyLaterPolicy.js.
  confirmedAt: { type: Date, default: null },
  confirmedBy: { type: String, default: '' },
  // Admin có thể xoá án: ghi lại chứ không xoá dòng, để còn biết đã từng có.
  clearedAt: { type: Date, default: null },
  clearedBy: { type: String, default: '' },
  clearedReason: { type: String, default: '' },

  note: { type: String, default: '' },
}, { timestamps: true });

/** Đang có hiệu lực = đã duyệt và chưa được xoá án. */
JoyDefaultRecordSchema.statics.activeFor = function activeFor({ phoneHash, emailHash }) {
  const or = [];
  if (phoneHash) or.push({ phoneHash });
  if (emailHash) or.push({ emailHash });
  if (!or.length) return Promise.resolve([]);
  return this.find({ $or: or, confirmedAt: { $ne: null }, clearedAt: null }).lean();
};

export default mongoose.model('JoyDefaultRecord', JoyDefaultRecordSchema);
