import mongoose from 'mongoose';

// Một lượt nhận quà chiến dịch hợp tác — hoặc một lượt BỊ TỪ CHỐI vì trùng
// người. Lượt bị từ chối cũng giữ chỗ {campaign, emailKey}: tài khoản đó không
// thử lại được nữa cho tới khi admin gỡ (DELETE /admin/:slug/claims/:id).
//
// Dấu vết danh tính chỉ lưu dạng HMAC (securityHash) — đủ để so trùng, không
// giữ số điện thoại, IP hay toạ độ thô.
const hashField = { type: String, default: null };

const PartnerClaimSchema = new mongoose.Schema({
  campaign: { type: String, required: true },
  email: { type: String, required: true },
  // Email chuẩn hoá: Gmail bỏ dấu chấm và phần "+..." — cùng một hộp thư.
  emailKey: { type: String, required: true },
  status: { type: String, enum: ['granted', 'rejected'], required: true },
  reason: { type: String, default: '' },

  phoneHash: hashField,
  deviceIdHash: hashField,
  // Vân tay phần cứng/trình duyệt — trùng giữa các máy cùng đời là chuyện
  // thường (iPhone cùng model), nên chỉ chặn khi đi KÈM cùng mạng: `deviceNetHash`.
  deviceFpHash: hashField,
  deviceNetHash: hashField,
  ipHash: hashField,
  locationHash: hashField,

  bioDays: { type: Number, default: 0 },
  joy: { type: Number, default: 0 },
  // Claim tạo trước, quà cộng sau — mỗi phần một cờ riêng, lật bằng điều kiện
  // nguyên tử. Cộng JOY lỗi giữa chừng thì lần gọi lại chỉ cộng nốt JOY, không
  // cộng ngày lần hai.
  daysApplied: { type: Boolean, default: false },
  joyApplied: { type: Boolean, default: false },
  // Phần thưởng giáo dục có thể đến sau (xác minh HSSV được duyệt muộn).
  eduBonusApplied: { type: Boolean, default: false },
  eduBonusDays: { type: Number, default: 0 },
  eduBonusAt: { type: Date, default: null },
  expiresAtAfter: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

PartnerClaimSchema.index({ campaign: 1, emailKey: 1 }, { unique: true });
PartnerClaimSchema.index({ campaign: 1, status: 1, createdAt: -1 });

// Hai tài khoản khác nhau bấm nhận CÙNG LÚC trên một máy/một số điện thoại thì
// cả hai đều qua bước so trùng (chưa ai ghi). Chỉ mục duy nhất trên lượt
// `granted` là chốt chặn cuối: lần ghi sau đụng E11000 và bị từ chối.
for (const field of ['phoneHash', 'deviceIdHash', 'deviceNetHash']) {
  PartnerClaimSchema.index(
    { campaign: 1, [field]: 1 },
    { unique: true, partialFilterExpression: { status: 'granted', [field]: { $type: 'string' } } },
  );
}
PartnerClaimSchema.index({ campaign: 1, ipHash: 1, createdAt: -1 });
PartnerClaimSchema.index({ campaign: 1, locationHash: 1 });

const PartnerClaim = mongoose.model('PartnerClaim', PartnerClaimSchema);
export default PartnerClaim;
