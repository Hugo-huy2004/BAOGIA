import mongoose from 'mongoose';
import {
  PROJECT_STATUSES, PROJECT_ID_PATTERN, MAX_CUSTOMER_EDITS,
} from '../../shared/projectWorkflow.js';

/**
 * Dự án khách hàng — từ lúc admin mở hồ sơ tới lúc khách đánh giá xong.
 *
 * Quy trình, nhãn trạng thái, bộ câu hỏi và công thức ước lượng nằm ở
 * `shared/projectWorkflow.js`; model này chỉ LƯU, không tự định nghĩa luật.
 *
 * Ba mã khác nhau, đừng lẫn:
 *   `projectId`  HG-2609-007 — mã NGƯỜI đọc, nhìn là biết mở tháng nào. In lên
 *                hoá đơn, nhắc trong email. Cố tình đoán được.
 *   `accessCode` — mã khách dùng để mở trang dự án. Phải KHÓ ĐOÁN, không bao giờ
 *                suy ra được từ projectId.
 *   `formToken`  — mã nằm trong liên kết phiếu yêu cầu. Dùng một giai đoạn rồi
 *                thôi, tách khỏi accessCode để gửi link cho người khác điền hộ
 *                mà không trao luôn quyền vào trang dự án.
 */

const HistoryEntrySchema = new mongoose.Schema({
  at: { type: Date, default: Date.now },
  // 'system' khi máy tự ghi, 'admin' | 'customer' khi người thao tác.
  actor: { type: String, enum: ['system', 'admin', 'customer'], required: true },
  actorName: { type: String, default: '' },
  action: { type: String, required: true },
  fromStatus: { type: String, default: '' },
  toStatus: { type: String, default: '' },
  note: { type: String, default: '' },
  // Ảnh chụp thay đổi khi admin sửa sau lúc đã chốt — yêu cầu "edit thì phải
  // ghi vào lịch sử" chính là trường này.
  changes: { type: mongoose.Schema.Types.Mixed, default: null },
}, { _id: false });

const CustomerProjectSchema = new mongoose.Schema(
  {
    projectId: {
      type: String, required: true, unique: true, index: true,
      validate: { validator: (v) => PROJECT_ID_PATTERN.test(v), message: 'Mã dự án sai định dạng HG-YYMM-NNN' },
    },
    // Đếm riêng theo tháng để sinh số thứ tự; lưu lại để truy vấn nhanh.
    period: { type: String, required: true, index: true },

    name: { type: String, required: true },
    accessCode: { type: String, required: true, unique: true, index: true, select: false },
    formToken: { type: String, index: true, select: false },

    status: {
      type: String,
      enum: Object.keys(PROJECT_STATUSES),
      default: 'draft',
      index: true,
    },

    // Gói khách chọn trong phiếu; admin có thể đổi lại khi xem xét.
    packageId: { type: String, default: '' },

    customer: {
      fullName: { type: String, default: '' },
      email: { type: String, default: '', index: true },
      phone: { type: String, default: '' },
      orgName: { type: String, default: '' },
    },

    /** Toàn bộ câu trả lời phiếu yêu cầu, khoá theo `field.id` của REQUIREMENT_SECTIONS. */
    requirements: { type: mongoose.Schema.Types.Mixed, default: {} },
    requirementsSubmittedAt: { type: Date, default: null },

    /**
     * Khách được tự sửa tối đa MAX_CUSTOMER_EDITS lần. Hết quota thì chỉ admin
     * sửa được — và mỗi lần admin sửa đều phải ghi vào `history`.
     */
    customerEditCount: { type: Number, default: 0 },
    scopeLockedAt: { type: Date, default: null },

    estimate: {
      workingDays: { type: Number, default: 0 },
      breakdown: { type: [mongoose.Schema.Types.Mixed], default: [] },
      startedAt: { type: Date, default: null },
      dueAt: { type: Date, default: null },
      // Ngày dự kiến ban đầu, giữ nguyên kể cả khi sau này trượt tiến độ — để
      // còn so được đã hứa gì với đã giao gì.
      originalDueAt: { type: Date, default: null },
    },

    /** Việc trong sprint, đủ để chạy Scrum mà không cần công cụ ngoài. */
    backlog: {
      type: [{
        title: { type: String, required: true },
        detail: { type: String, default: '' },
        moscow: { type: String, enum: ['must', 'should', 'could', 'wont'], default: 'should' },
        state: { type: String, enum: ['todo', 'doing', 'review', 'done'], default: 'todo' },
        sprint: { type: Number, default: 1 },
        points: { type: Number, default: 1 },
        // Khách nhìn thấy việc này trên trang của họ không. Việc kỹ thuật nội bộ
        // để false, kẻo trang khách đầy chữ họ không hiểu.
        visibleToCustomer: { type: Boolean, default: true },
        doneAt: { type: Date, default: null },
      }],
      default: [],
    },
    currentSprint: { type: Number, default: 1 },

    /** Mã nguồn bàn giao. Dự án không được đóng khi chưa có tệp này. */
    sourceDelivery: {
      fileUrl: { type: String, default: '' },
      fileName: { type: String, default: '' },
      sizeBytes: { type: Number, default: 0 },
      checksum: { type: String, default: '' },
      uploadedAt: { type: Date, default: null },
      notes: { type: String, default: '' },
    },

    addons: {
      offeredAt: { type: Date, default: null },
      respondedAt: { type: Date, default: null },
      // Khách bỏ qua hết cũng là một câu trả lời hợp lệ: mảng rỗng + respondedAt.
      selected: { type: [String], default: [] },
    },

    feedback: {
      submittedAt: { type: Date, default: null },
      answers: { type: mongoose.Schema.Types.Mixed, default: {} },
      overall: { type: Number, default: null },
    },

    history: { type: [HistoryEntrySchema], default: [] },
    adminNote: { type: String, default: '' },
  },
  { timestamps: true }
);

CustomerProjectSchema.index({ status: 1, createdAt: -1 });
CustomerProjectSchema.index({ 'customer.email': 1, createdAt: -1 });

/** Số lần khách còn được tự sửa phiếu. */
CustomerProjectSchema.virtual('customerEditsLeft').get(function editsLeft() {
  return Math.max(0, MAX_CUSTOMER_EDITS - (this.customerEditCount || 0));
});

CustomerProjectSchema.set('toJSON', { virtuals: true });
CustomerProjectSchema.set('toObject', { virtuals: true });

export default mongoose.models.CustomerProject
  || mongoose.model('CustomerProject', CustomerProjectSchema);
