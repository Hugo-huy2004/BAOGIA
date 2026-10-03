import { historyEntry } from './projectService.js';
import { getPackageFacts, listPrice, formatMoney, marketOf } from '../../shared/projectPackages.js';
import { PROJECT_STATUSES } from '../../shared/projectWorkflow.js';
import { warrantyActive } from '../../shared/projectContract.js';

/**
 * Nghiệp vụ hợp đồng, sổ chi phí, nhật ký, bảo hành, duy trì, chấm dứt.
 *
 * Luật chung: MỌI thao tác đều để lại một dòng `history`, và mọi thay đổi làm
 * hợp đồng khác đi đều gọi `bumpContract()` — khách thấy "có phiên bản mới cần
 * xác nhận" và Phụ lục F ghi lý do. Không có hàm nào XOÁ dữ liệu tiền.
 *
 * Hàm ở đây KHÔNG tự lưu trừ khi tên có chữ "save"; route gọi `project.save()`
 * một lần sau khi mọi thay đổi xong, để một thao tác không lưu nửa vời.
 */

const fail = (code, message) => Object.assign(new Error(message), { code });
const money = (project, n) => formatMoney(n, marketOf(project.market).currency);
const clean = (s, max = 4000) => String(s ?? '').trim().slice(0, max);

export function bumpContract(project, reason) {
  const c = project.contract || {};
  const version = (c.version || 0) + 1;
  project.contract = {
    ...(c.toObject?.() || c),
    version,
    updatedAt: new Date(),
    changes: [...(c.changes || []), { version, at: new Date(), reason: clean(reason, 300) }],
  };
}

function log(project, actor, actorName, action, note) {
  project.history.push(historyEntry({ actor, actorName, action, note }));
}

const KINDS = ['package', 'addon', 'unit', 'revision', 'adjustment', 'maintenance', 'payment'];

/**
 * Thêm một dòng sổ chi phí. Lần chỉnh TÍNH PHÍ bắt buộc có `detail` — nội dung
 * yêu cầu của khách lần đó — để hợp đồng giải thích được vì sao có khoản này.
 */
export function addLedgerEntry(project, input, { actor = 'admin', actorName = '' } = {}) {
  const kind = String(input.kind || '');
  if (!KINDS.includes(kind)) throw fail('BAD_INPUT', 'Loại khoản không hợp lệ.');
  const quantity = Math.max(1, Math.floor(Number(input.quantity) || 1));
  const free = Boolean(input.free);
  const facts = input.itemId ? getPackageFacts(input.itemId) : null;
  let amount = input.amount === '' || input.amount === undefined
    ? listPrice(input.itemId, project.packageId, project.market)
    : Number(input.amount);
  if (!Number.isFinite(amount) || amount < 0) throw fail('BAD_INPUT', 'Số tiền không hợp lệ.');
  const discount = Math.max(0, Number(input.discount) || 0);
  // Giảm giá cả hợp đồng: không có đơn giá, phải có số giảm và lý do.
  if (kind === 'adjustment') {
    amount = 0;
    if (discount <= 0) throw fail('BAD_INPUT', 'Nhập số tiền giảm.');
    if (clean(input.detail).length < 5) throw fail('BAD_INPUT', 'Ghi lý do giảm giá (ghi vào hợp đồng).');
  } else if (discount > amount * quantity) throw fail('BAD_INPUT', 'Số giảm lớn hơn giá của khoản.');
  const title = clean(input.title, 200) || facts?.label || '';
  if (!title) throw fail('BAD_INPUT', 'Thiếu tên khoản.');
  const detail = clean(input.detail);
  if (['revision', 'unit'].includes(kind) && !free && detail.length < 5) {
    throw fail('BAD_INPUT', 'Khoản tính phí phải ghi nội dung yêu cầu của khách lần đó.');
  }
  if (kind === 'payment') amount = Math.abs(amount);

  const entry = {
    kind, itemId: clean(input.itemId, 60), title, detail, quantity, amount, discount, free,
    pending: Boolean(input.pending), period: clean(input.period, 20), at: new Date(), by: actorName,
  };
  project.ledger.push(entry);
  const label = kind === 'payment' ? `Ghi nhận thanh toán ${money(project, amount)}`
    : kind === 'adjustment' ? `${title}: giảm ${money(project, discount)}`
    : `${title}: ${free ? 'miễn phí' : money(project, Math.max(0, amount * quantity - discount))}`;
  log(project, actor, actorName, kind === 'payment' ? 'Thanh toán' : 'Thêm khoản vào hợp đồng', label + (detail ? ` — ${detail}` : ''));
  if (!entry.pending) bumpContract(project, label);
  return project.ledger[project.ledger.length - 1];
}

/** Huỷ (không xoá) một dòng sổ, hoặc xác nhận dòng khách chọn ở cổng. */
export function updateLedgerEntry(project, entryId, input, { actorName = '' } = {}) {
  const e = project.ledger.id(entryId);
  if (!e) throw fail('NOT_FOUND', 'Không tìm thấy khoản này.');
  if (e.voided) throw fail('BAD_INPUT', 'Khoản đã huỷ, không sửa được nữa.');
  if (input.void) {
    const reason = clean(input.reason, 300);
    if (reason.length < 5) throw fail('BAD_INPUT', 'Ghi lý do huỷ khoản này.');
    e.voided = true;
    e.voidReason = reason;
    log(project, 'admin', actorName, 'Huỷ khoản', `${e.title} — ${reason}`);
    bumpContract(project, `Huỷ khoản: ${e.title}`);
    return e;
  }
  if (input.confirm && e.pending) {
    if (input.discount !== undefined) {
      const d = Math.max(0, Number(input.discount) || 0);
      if (d > e.amount * e.quantity) throw fail('BAD_INPUT', 'Số giảm lớn hơn giá của khoản.');
      e.discount = d;
    }
    if (input.free !== undefined) e.free = Boolean(input.free);
    e.pending = false;
    log(project, 'admin', actorName, 'Xác nhận khoản khách chọn', `${e.title}${e.free ? ' — miễn phí' : e.discount ? ` — giảm ${money(project, e.discount)}` : ''}`);
    bumpContract(project, `Xác nhận: ${e.title}`);
    if (e.itemId === 'flow-care-plan') startMaintenance(project, { actorName, fee: Math.max(0, e.amount - e.discount) });
    return e;
  }
  throw fail('BAD_INPUT', 'Không có gì để cập nhật.');
}

const PHASES = ['implementation', 'addition', 'testing', 'revision', 'handover', 'note'];

export function addWorklog(project, input, { actorName = '' } = {}) {
  const phase = String(input.phase || '');
  if (!PHASES.includes(phase)) throw fail('BAD_INPUT', 'Giai đoạn không hợp lệ.');
  const title = clean(input.title, 200);
  if (title.length < 3) throw fail('BAD_INPUT', 'Ghi nội dung cho mục nhật ký.');
  project.worklog.push({
    phase, title, detail: clean(input.detail), at: new Date(), by: actorName,
    visibleToCustomer: input.visibleToCustomer !== false,
  });
  if (phase !== 'note') bumpContract(project, `Nhật ký: ${title}`);
}

/** Gọi khi dự án chuyển trạng thái — việc máy tự làm theo mốc. */
export function onStatusChanged(project, toStatus, { actorName = '' } = {}) {
  // Bắt đầu phân tích → gói chính vào sổ theo giá niêm yết của thị trường, để
  // hợp đồng có giá cho khách xác nhận TRƯỚC khi chốt phạm vi (cổng vào Thiết kế
  // đòi hợp đồng đã xác nhận). Đổi gói thì huỷ dòng này và thêm lại.
  if ((toStatus === 'in_review' || PROJECT_STATUSES[toStatus]?.locksScope) && !project.ledger.some((e) => e.kind === 'package' && !e.voided)) {
    const facts = getPackageFacts(project.packageId);
    if (facts) addLedgerEntry(project, { kind: 'package', itemId: facts.id, title: facts.label }, { actor: 'system', actorName });
  }
  // Bàn giao → bảo hành bắt đầu, chụp lại mã kiểm tra của bản ZIP làm căn cứ.
  if (toStatus === 'delivery' && !project.warranty?.startsAt) {
    project.warranty.startsAt = new Date();
    project.warranty.checksum = project.sourceDelivery?.checksum || '';
    bumpContract(project, 'Bàn giao — bắt đầu bảo hành');
  }
}

export function addWarrantyClaim(project, { description, reportedBy, actorName = '' }) {
  if (!project.warranty?.startsAt) throw fail('BAD_INPUT', 'Dự án chưa bàn giao nên chưa có bảo hành.');
  if (!warrantyActive(project)) throw fail('BAD_INPUT', 'Hợp đồng đã chấm dứt, bảo hành không còn hiệu lực (Điều 11).');
  const text = clean(description);
  if (text.length < 10) throw fail('BAD_INPUT', 'Mô tả lỗi cụ thể hơn: trang nào, thiết bị, trình duyệt, lỗi ra sao.');
  const code = `BH-${String((project.warranty.claims?.length || 0) + 1).padStart(2, '0')}`;
  project.warranty.claims.push({ code, reportedAt: new Date(), reportedBy, description: text });
  log(project, reportedBy === 'admin' ? 'admin' : 'customer', actorName, `Yêu cầu bảo hành ${code}`, text.slice(0, 300));
  bumpContract(project, `Yêu cầu bảo hành ${code}`);
  return code;
}

export function resolveWarrantyClaim(project, claimId, { status, covered, resolution, actorName = '' }) {
  const k = project.warranty.claims.id(claimId);
  if (!k) throw fail('NOT_FOUND', 'Không tìm thấy yêu cầu bảo hành.');
  if (!['fixed', 'rejected'].includes(status)) throw fail('BAD_INPUT', 'Kết quả phải là đã sửa hoặc từ chối.');
  const text = clean(resolution);
  if (text.length < 5) throw fail('BAD_INPUT', 'Ghi kết quả xử lý (đã sửa gì, hoặc vì sao không thuộc bảo hành).');
  Object.assign(k, { status, covered: Boolean(covered), resolution: text, resolvedAt: new Date(), by: actorName });
  log(project, 'admin', actorName, `Xử lý bảo hành ${k.code}`, `${status === 'fixed' ? 'Đã sửa' : 'Từ chối'} — ${text}`);
  bumpContract(project, `Xử lý bảo hành ${k.code}`);
}

export function startMaintenance(project, { actorName = '', fee } = {}) {
  const planFee = fee ?? listPrice('flow-care-plan', project.packageId, project.market);
  project.maintenance = {
    ...(project.maintenance?.toObject?.() || project.maintenance || {}),
    active: true, planId: 'flow-care-plan', monthlyFee: planFee,
    startedAt: project.maintenance?.startedAt || new Date(), endedAt: null,
  };
  log(project, 'admin', actorName, 'Bắt đầu gói duy trì', `${money(project, planFee)} / tháng`);
}

const monthLabel = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/**
 * Admin xác nhận ĐÃ NHẬN phí duy trì của một tháng → gia hạn thêm một tháng.
 * Ghi hai dòng sổ (phí + tiền đã nhận) để công nợ không đổi và Phụ lục E đọc
 * được từng tháng. Không có gì tự trừ tiền.
 */
export function verifyMaintenancePayment(project, { amount, note, actorName = '' }) {
  const m = project.maintenance;
  if (!m?.active) throw fail('BAD_INPUT', 'Dự án chưa bật gói duy trì.');
  if (project.status === 'terminated') throw fail('BAD_INPUT', 'Hợp đồng đã chấm dứt.');
  const fee = amount === undefined || amount === '' ? m.monthlyFee : Number(amount);
  if (!Number.isFinite(fee) || fee < 0) throw fail('BAD_INPUT', 'Số tiền không hợp lệ.');
  const base = m.paidThrough && new Date(m.paidThrough) > new Date() ? new Date(m.paidThrough) : new Date();
  const period = monthLabel(base);
  const through = new Date(base);
  through.setMonth(through.getMonth() + 1);
  const detail = clean(note, 300) || `Phí duy trì tháng ${period}`;
  project.ledger.push({ kind: 'maintenance', itemId: 'flow-care-plan', title: `Duy trì ${period}`, detail, amount: fee, period, at: new Date(), by: actorName });
  project.ledger.push({ kind: 'payment', title: `Nhận phí duy trì ${period}`, detail, amount: fee, period, at: new Date(), by: actorName });
  m.paidThrough = through;
  log(project, 'admin', actorName, 'Xác nhận phí duy trì', `${period} · ${money(project, fee)} · gia hạn tới ${through.toLocaleDateString('vi-VN')}`);
  bumpContract(project, `Duy trì ${period}`);
}

export function stopMaintenance(project, { actorName = '', reason = '' } = {}) {
  if (!project.maintenance?.active) return;
  project.maintenance.active = false;
  project.maintenance.endedAt = new Date();
  log(project, 'admin', actorName, 'Dừng gói duy trì', clean(reason, 300));
  bumpContract(project, 'Dừng gói duy trì');
}

/** Khách xác nhận hợp đồng ở phiên bản hiện tại — giao kết điện tử (Luật GDĐT 2023). */
export function acceptContract(project, { name, ip, userAgent }) {
  const typed = clean(name, 120);
  if (typed.length < 2) throw fail('BAD_INPUT', 'Gõ họ tên của bạn để xác nhận.');
  const c = project.contract;
  if (!c?.version) throw fail('BAD_INPUT', 'Hợp đồng chưa có nội dung để xác nhận.');
  c.acceptedVersion = c.version;
  c.acceptedAt = new Date();
  c.acceptedName = typed;
  c.acceptedIp = clean(ip, 64);
  c.acceptedUserAgent = clean(userAgent, 300);
  log(project, 'customer', typed, 'Xác nhận hợp đồng', `Phiên bản ${c.version}`);
}

/** Khách chọn gói lẻ khi dự án ở bước chọn dịch vụ kèm — chờ admin xác nhận. */
export function customerPickAddons(project, ids = []) {
  if (project.status !== 'addons') throw fail('BAD_INPUT', 'Chỉ chọn gói lẻ sau khi dự án đã bàn giao.');
  const picked = [...new Set(ids.map(String))].filter((id) => {
    const f = getPackageFacts(id);
    return f && f.group === 'addon' && (!f.appliesTo || f.appliesTo.includes(project.packageId));
  });
  for (const id of picked) {
    if (project.ledger.some((e) => e.itemId === id && !e.voided && e.pending)) continue;
    addLedgerEntry(project, { kind: 'addon', itemId: id, pending: true }, { actor: 'customer', actorName: project.customer?.fullName || '' });
  }
  project.addons.selected = picked;
  project.addons.respondedAt = new Date();
  return picked;
}

/**
 * Chấm dứt do bên khách vi phạm (Điều 11 hợp đồng). Có hiệu lực ngay; ghi căn cứ
 * và lý do. Gọi xong route phải chuyển trạng thái qua transitionProject.
 */
export function recordTermination(project, { clause, reason, actorName = '' }) {
  const c = clean(clause, 60);
  const r = clean(reason, 2000);
  if (!c) throw fail('BAD_INPUT', 'Chọn khoản vi phạm làm căn cứ chấm dứt.');
  if (r.length < 20) throw fail('BAD_INPUT', 'Ghi rõ hành vi vi phạm và bằng chứng (ít nhất một câu đầy đủ).');
  project.termination = { at: new Date(), clause: c, reason: r, by: actorName };
  if (project.maintenance?.active) {
    project.maintenance.active = false;
    project.maintenance.endedAt = new Date();
  }
  bumpContract(project, `Chấm dứt hợp đồng — ${c}`);
}
