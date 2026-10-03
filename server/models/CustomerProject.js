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

/**
 * Sổ chi phí. MỌI khoản tiền của dự án đều là một dòng ở đây — gói chính, gói
 * lẻ, lần chỉnh tính phí, giảm giá, phí duy trì, và cả tiền khách đã trả. Hợp
 * đồng cộng thẳng trên sổ này, nên không có con số nào "ngoài sổ".
 *
 * Không bao giờ XOÁ dòng: sai thì `voided` kèm lý do, để lịch sử tiền luôn đọc
 * lại được. `amount` là giá niêm yết của khoản đó, `discount` là số được giảm,
 * `free` = miễn phí hẳn. Tiền thật tính = free ? 0 : amount − discount.
 */
const LedgerEntrySchema = new mongoose.Schema({
  kind: { type: String, enum: ['package', 'addon', 'unit', 'revision', 'adjustment', 'maintenance', 'payment'], required: true },
  itemId: { type: String, default: '' },
  title: { type: String, required: true },
  // Nội dung yêu cầu của khách cho lần chỉnh / việc thêm — bắt buộc với khoản tính phí.
  detail: { type: String, default: '' },
  quantity: { type: Number, default: 1, min: 1 },
  amount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  free: { type: Boolean, default: false },
  // Khách tự chọn ở cổng thì chờ admin xác nhận trước khi tính vào tổng.
  pending: { type: Boolean, default: false },
  period: { type: String, default: '' },
  at: { type: Date, default: Date.now },
  by: { type: String, default: '' },
  voided: { type: Boolean, default: false },
  voidReason: { type: String, default: '' },
});

/** Nhật ký thực hiện theo giai đoạn — nội dung chi tiết cho từng bước. */
const WorklogEntrySchema = new mongoose.Schema({
  phase: { type: String, enum: ['implementation', 'addition', 'testing', 'revision', 'handover', 'note'], required: true },
  title: { type: String, required: true },
  detail: { type: String, default: '' },
  at: { type: Date, default: Date.now },
  by: { type: String, default: '' },
  visibleToCustomer: { type: Boolean, default: true },
});

/** Một lần yêu cầu bảo hành — ghi như phiếu bảo hành: ngày giờ, nội dung, kết quả. */
const WarrantyClaimSchema = new mongoose.Schema({
  code: { type: String, required: true },
  reportedAt: { type: Date, default: Date.now },
  reportedBy: { type: String, enum: ['customer', 'admin'], required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['open', 'fixed', 'rejected'], default: 'open' },
  covered: { type: Boolean, default: null },
  resolution: { type: String, default: '' },
  resolvedAt: { type: Date, default: null },
  by: { type: String, default: '' },
});

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

    /** Trong nước (VNĐ, hợp đồng gốc tiếng Việt) hay quốc tế (USD, bản gốc tiếng Anh). Chọn lúc tạo, không đổi. */
    market: { type: String, enum: ['domestic', 'international'], default: 'domestic' },

    /** Ô tích tay của các điều kiện giai đoạn (shared/projectPhases.js): { id: { done, at, by } }. */
    checklist: { type: mongoose.Schema.Types.Mixed, default: {} },

    /**
     * Bản phạm vi công việc (shared/projectScope.js) — Phụ lục A. `contractVersion`
     * là phiên bản hợp đồng lúc lưu: khách phải xác nhận từ phiên bản đó trở lên.
     */
    scope: { type: mongoose.Schema.Types.Mixed, default: null },

    ledger: { type: [LedgerEntrySchema], default: [] },
    worklog: { type: [WorklogEntrySchema], default: [] },

    /**
     * Bảo hành bắt đầu lúc bàn giao. `checksum` của bản ZIP chụp lại tại đó là
     * căn cứ đối chiếu: mã bị sửa so với bản này thì bảo hành chấm dứt.
     */
    warranty: {
      startsAt: { type: Date, default: null },
      checksum: { type: String, default: '' },
      claims: { type: [WarrantyClaimSchema], default: [] },
    },

    /** Gói duy trì hằng tháng — chỉ gia hạn khi admin xác nhận đã nhận phí. */
    maintenance: {
      active: { type: Boolean, default: false },
      planId: { type: String, default: '' },
      monthlyFee: { type: Number, default: 0 },
      startedAt: { type: Date, default: null },
      paidThrough: { type: Date, default: null },
      endedAt: { type: Date, default: null },
    },

    /**
     * Hợp đồng được DỰNG từ dữ liệu dự án (shared/projectContract.js), không lưu
     * bản văn. Mỗi thay đổi ảnh hưởng hợp đồng tăng `version`; khách xác nhận
     * phiên bản nào thì ghi lại đúng phiên bản đó, kèm thời điểm, IP, trình duyệt.
     */
    contract: {
      version: { type: Number, default: 0 },
      updatedAt: { type: Date, default: null },
      changes: { type: [{ version: Number, at: Date, reason: String }], default: [] },
      acceptedVersion: { type: Number, default: 0 },
      acceptedAt: { type: Date, default: null },
      acceptedName: { type: String, default: '' },
      acceptedIp: { type: String, default: '' },
      acceptedUserAgent: { type: String, default: '' },
    },

    termination: {
      at: { type: Date, default: null },
      clause: { type: String, default: '' },
      reason: { type: String, default: '' },
      by: { type: String, default: '' },
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
