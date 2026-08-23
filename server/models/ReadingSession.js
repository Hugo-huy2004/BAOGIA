import mongoose from 'mongoose';

/**
 * Phiên đọc học liệu.
 *
 * Có những nội dung không kiểm tra được bằng bốn lựa chọn — "vì sao mô hình bịa"
 * hay "khi nào KHÔNG nên dùng agent" là hiểu biết, không phải mẹo nhớ. Với các
 * bài đó, điều kiện qua bài là ĐỌC đủ số phút tối thiểu.
 *
 * Mốc thời gian bắt đầu do MÁY CHỦ ghi, không nhận từ client: nếu tin
 * `startedAt` trong body thì bấm mở rồi khai lùi lại năm phút là xong bài.
 * Client chỉ được phép nói "tôi bắt đầu đọc" và "tôi đọc xong"; phần trừ thời
 * gian nằm ở server.
 *
 * Đây KHÔNG phải bằng chứng người học thực sự đọc — mở tab rồi đi pha trà vẫn
 * tính. Nó chặn đúng một thứ: bấm qua bài trong hai giây. Muốn đo hiểu thì phải
 * hỏi, mà hỏi thì lại quay về trắc nghiệm.
 */
const ReadingSessionSchema = new mongoose.Schema(
  {
    memberEmail: { type: String, required: true, index: true, lowercase: true, trim: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'CoderResource', required: true },
    // Số phút phải đọc, chốt lại tại thời điểm bắt đầu. Chốt ở đây thay vì đọc
    // lại từ học liệu lúc kết thúc: admin sửa `readingMinutes` giữa chừng thì
    // người đang đọc dở không bị đổi luật.
    requiredMinutes: { type: Number, required: true, min: 1, max: 60 },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Mỗi người một phiên cho mỗi học liệu. Mở lại bài đang đọc dở thì cập nhật
// phiên cũ chứ không đẻ phiên mới — nếu không, đọc bốn phút rồi tải lại trang
// là mất sạch thời gian đã bỏ ra.
ReadingSessionSchema.index({ memberEmail: 1, resourceId: 1 }, { unique: true });

export default mongoose.models.ReadingSession
  || mongoose.model('ReadingSession', ReadingSessionSchema);
