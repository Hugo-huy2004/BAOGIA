import mongoose from 'mongoose';

// Trạng thái ngắn hạn của bot Telegram: lệnh đang chờ Boss bấm nút, việc vừa
// làm để hoàn tác, và trí nhớ hội thoại của quản gia.
//
// Vì sao không để trong RAM: Render khởi động lại process rất thường xuyên
// (deploy, ngủ đông, hết bộ nhớ). Mỗi lần restart là mọi nút "Đồng ý" đang nằm
// trong khung chat chết lặng — bấm vào chỉ nhận "lệnh đã hết hạn" mà Boss không
// làm gì sai cả — và quản gia quên sạch câu chuyện đang nói dở.
//
// TTL tự dọn: không có việc quét rác nào phải viết thêm.
const TelegramStateSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  kind: { type: String, required: true, index: true }, // pending | undo | memory
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

export default mongoose.model('TelegramState', TelegramStateSchema);
