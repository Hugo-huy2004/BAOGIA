import crypto from 'node:crypto';
import mongoose from 'mongoose';
import CustomerProject from '../models/CustomerProject.js';
import Counter from '../models/Counter.js';
import {
  PROJECT_STATUSES, canTransition, formatProjectId, projectIdPeriod,
  estimateProject, addWorkingDays, MAX_CUSTOMER_EDITS,
} from '../../shared/projectWorkflow.js';

/**
 * Nghiệp vụ dự án khách hàng. Route chỉ nhận request và trả response; mọi luật
 * nằm ở đây để cả admin, cổng khách hàng và tác vụ nền dùng chung một bộ luật.
 */

/**
 * Số thứ tự trong tháng, cấp bằng `findOneAndUpdate` NGUYÊN TỬ.
 *
 * Đếm bằng `countDocuments()` rồi +1 là sai: hai dự án tạo cùng lúc sẽ nhận
 * cùng một số và cái thứ hai vỡ ở ràng buộc unique. Counter cấp số một lần một,
 * không ai chen được vào giữa.
 */
async function nextSequence(period) {
  const doc = await Counter.findOneAndUpdate(
    { _id: `project:${period}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return doc.seq;
}

/** Mã khách dùng để mở trang dự án. Phải KHÓ ĐOÁN — không suy được từ projectId. */
function generateAccessCode() {
  // Bỏ các ký tự dễ đọc nhầm khi khách chép tay: 0/O, 1/I/L.
  const alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  return Array.from(crypto.randomBytes(10))
    .map((b) => alphabet[b % alphabet.length])
    .join('');
}

const generateFormToken = () => crypto.randomBytes(24).toString('base64url');

function historyEntry({ actor, actorName = '', action, fromStatus = '', toStatus = '', note = '', changes = null }) {
  return { at: new Date(), actor, actorName, action, fromStatus, toStatus, note, changes };
}

/**
 * Admin mở một dự án mới. Mã sinh ở đây, không nhận từ client.
 */
export async function createProject({ name, customer = {}, packageId = '', actorName = 'admin' }) {
  const period = projectIdPeriod();
  const seq = await nextSequence(period);
  const projectId = formatProjectId(period, seq);

  return CustomerProject.create({
    projectId,
    period,
    name: String(name).trim(),
    accessCode: generateAccessCode(),
    formToken: generateFormToken(),
    packageId,
    status: 'draft',
    customer: {
      fullName: customer.fullName || '',
      email: String(customer.email || '').toLowerCase(),
      phone: customer.phone || '',
      orgName: customer.orgName || '',
    },
    history: [historyEntry({
      actor: 'admin', actorName, action: 'Mở hồ sơ dự án', toStatus: 'draft',
      note: `Cấp mã ${projectId}`,
    })],
  });
}

/**
 * Đổi trạng thái. Đây là CỬA DUY NHẤT được phép đổi `status`.
 *
 * Trả về `{ project, shouldNotify }` — route quyết định gửi thư, service không
 * tự gửi để còn test được mà không bắn thư thật.
 */
export async function transitionProject(project, toStatus, { actor, actorName = '', note = '' } = {}) {
  const from = project.status;
  if (from === toStatus) {
    const error = new Error(`Dự án đã ở trạng thái "${PROJECT_STATUSES[from]?.adminLabel || from}".`);
    error.code = 'SAME_STATUS';
    throw error;
  }
  if (!canTransition(from, toStatus)) {
    const allowed = (PROJECT_STATUSES[from]?.next || []).map((s) => PROJECT_STATUSES[s].adminLabel).join(', ');
    const error = new Error(
      `Không đi thẳng từ "${PROJECT_STATUSES[from]?.adminLabel || from}" sang "${PROJECT_STATUSES[toStatus]?.adminLabel || toStatus}" được.`
      + (allowed ? ` Từ đây chỉ đi được sang: ${allowed}.` : ' Đây là điểm cuối.'),
    );
    error.code = 'BAD_TRANSITION';
    throw error;
  }

  const target = PROJECT_STATUSES[toStatus];

  // Bàn giao mà chưa có tệp mã nguồn thì thư "đã bàn giao" là nói dối.
  if (target.requiresSourceZip && !project.sourceDelivery?.fileUrl) {
    const error = new Error('Chưa có tệp mã nguồn. Tải tệp ZIP lên trước khi chuyển sang bàn giao.');
    error.code = 'MISSING_SOURCE';
    throw error;
  }

  // Chốt thiết kế: khoá phạm vi và tính ngày dự kiến TỪ ĐÂY, không phải từ lúc
  // mở hồ sơ — đồng hồ chỉ chạy khi đã biết phải làm gì.
  if (target.startsEstimate && !project.estimate?.startedAt) {
    const estimate = estimateProject(project.packageId, project.requirements || {});
    const startedAt = new Date();
    const dueAt = addWorkingDays(startedAt, estimate.workingDays);
    project.estimate = {
      workingDays: estimate.workingDays,
      breakdown: estimate.breakdown,
      startedAt,
      dueAt,
      originalDueAt: project.estimate?.originalDueAt || dueAt,
    };
  }
  if (target.locksScope && !project.scopeLockedAt) project.scopeLockedAt = new Date();
  if (toStatus === 'addons' && !project.addons?.offeredAt) project.addons.offeredAt = new Date();

  project.status = toStatus;
  project.history.push(historyEntry({
    actor, actorName, action: 'Đổi trạng thái', fromStatus: from, toStatus, note,
  }));
  await project.save();

  return { project, shouldNotify: Boolean(target.notify) };
}

/**
 * Khách nộp hoặc sửa phiếu yêu cầu.
 *
 * Quota 3 lần chỉ áp cho KHÁCH. Admin sửa không tiêu quota nhưng BẮT BUỘC để
 * lại dấu vết trong `history` — đó là lý do `actor` là tham số bắt buộc.
 */
export async function saveRequirements(project, requirements, { actor, actorName = '', note = '' }) {
  if (actor === 'customer') {
    if (project.scopeLockedAt) {
      const error = new Error('Phạm vi đã chốt. Liên hệ Hugo Studio nếu bạn cần đổi.');
      error.code = 'SCOPE_LOCKED';
      throw error;
    }
    if (project.customerEditCount >= MAX_CUSTOMER_EDITS) {
      const error = new Error(`Bạn đã sửa đủ ${MAX_CUSTOMER_EDITS} lần. Hãy nhắn cho Hugo Studio để chỉnh tiếp.`);
      error.code = 'EDIT_LIMIT';
      throw error;
    }
  }

  const before = project.requirements || {};
  const changed = Object.keys({ ...before, ...requirements })
    .filter((k) => JSON.stringify(before[k]) !== JSON.stringify(requirements[k]));

  const first = !project.requirementsSubmittedAt;
  project.requirements = { ...before, ...requirements };
  if (requirements.packageId) project.packageId = requirements.packageId;
  for (const key of ['fullName', 'email', 'phone', 'orgName']) {
    if (requirements[key]) project.customer[key] = key === 'email'
      ? String(requirements[key]).toLowerCase() : requirements[key];
  }
  if (first) project.requirementsSubmittedAt = new Date();
  if (actor === 'customer' && !first) project.customerEditCount += 1;

  project.history.push(historyEntry({
    actor, actorName,
    action: first ? 'Nộp phiếu yêu cầu' : 'Sửa phiếu yêu cầu',
    note: note || (changed.length ? `Đổi ${changed.length} mục: ${changed.slice(0, 8).join(', ')}` : ''),
    changes: changed.length ? changed : null,
  }));

  await project.save();
  return project;
}

/** Ghi tệp mã nguồn bàn giao. Không đổi trạng thái — đó là việc của transition. */
export async function attachSourceDelivery(project, file, { actorName = '' } = {}) {
  project.sourceDelivery = {
    fileUrl: file.fileUrl,
    fileName: file.fileName || '',
    sizeBytes: Number(file.sizeBytes) || 0,
    checksum: file.checksum || '',
    uploadedAt: new Date(),
    notes: file.notes || '',
  };
  project.history.push(historyEntry({
    actor: 'admin', actorName, action: 'Tải lên mã nguồn',
    note: `${file.fileName || 'source.zip'}${file.sizeBytes ? ` · ${Math.round(file.sizeBytes / 1024)} KB` : ''}`,
  }));
  await project.save();
  return project;
}

/** Ẩn mọi bí mật trước khi trả cho khách. */
export function toCustomerView(project) {
  const obj = project.toObject ? project.toObject() : { ...project };
  delete obj.accessCode;
  delete obj.formToken;
  delete obj.adminNote;
  obj.backlog = (obj.backlog || []).filter((item) => item.visibleToCustomer);
  obj.history = (obj.history || []).filter((h) => h.actor !== 'admin' || h.toStatus);
  return obj;
}

export { generateAccessCode, historyEntry, MAX_CUSTOMER_EDITS };
export const isObjectId = (v) => mongoose.Types.ObjectId.isValid(v);
