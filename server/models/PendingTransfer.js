import mongoose from 'mongoose';

// Giao dịch lớn/bất thường đang GIỮ chờ duyệt — như ngân hàng giữ một lệnh
// chuyển khoản lớn để rà soát trước khi cho đi. Lưu đủ số liệu đã tính để khi
// Boss duyệt thì thực thi y hệt, không phải tính lại (và không lệch một xu).
const PendingTransferSchema = new mongoose.Schema({
  txCode: { type: String, required: true, unique: true, index: true },
  fromEmail: { type: String, required: true, index: true },
  toEmail: { type: String, required: true },
  fromName: { type: String, default: '' },
  toName: { type: String, default: '' },
  numAmount: { type: Number, required: true },      // JOY gốc người nhận nhận được
  totalDeducted: { type: Number, required: true },  // JOY gốc trừ của người gửi (gồm phí)
  feeAmount: { type: Number, default: 0 },
  conversionFee: { type: Number, default: 0 },
  fromDenom: { type: String, default: '' },
  toDenom: { type: String, default: '' },
  message: { type: String, default: '' },
  reason: { type: String, default: '' },            // vì sao bị giữ
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'expired'], default: 'pending', index: true },
  decidedBy: { type: String, default: '' },
  decidedAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

export default mongoose.model('PendingTransfer', PendingTransferSchema);
