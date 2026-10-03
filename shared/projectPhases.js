/**
 * Giai đoạn dự án (Waterfall) + chia việc tự động (Scrum) — NGUỒN DUY NHẤT cho
 * server (chặn chuyển trạng thái) và trang quản trị (dẫn admin từng bước).
 *
 * Mô hình lai "water-scrum-fall":
 *   • Tầng NGOÀI là 7 giai đoạn nối tiếp, mỗi giai đoạn có CỔNG: danh sách điều
 *     kiện phải xong mới được sang giai đoạn sau. Cổng kiểm cả ở server
 *     (transitionProject) — bấm nhầm hay gọi API thẳng cũng không nhảy cóc được.
 *   • Tầng TRONG giai đoạn Phát triển chạy Scrum: backlog sinh từ phiếu yêu cầu,
 *     xếp theo MoSCoW, chia sprint theo sức một người làm.
 *
 * Mỗi điều kiện là `auto` (hệ thống tự thấy từ dữ liệu: đã có ZIP, đã thu đủ…)
 * hoặc `manual` (admin tự tích: đã gửi thiết kế, khách đã duyệt…). Điều kiện tự
 * động KHÔNG tích tay được — không có cách "lách" cổng bằng một cú bấm.
 */

import { ledgerTotals } from './projectContract.js';
import { getPackageFacts } from './projectPackages.js';
import { scopeCompleteness } from './projectScope.js';

// ── Giai đoạn ────────────────────────────────────────────────────────────────
export const PHASES = [
  { id: 'intake', no: 1, label: 'Tiếp nhận', goal: 'Gửi link cổng dự án, khách nộp phiếu yêu cầu.', statuses: ['draft', 'awaiting_requirements', 'requirements_submitted'] },
  { id: 'analysis', no: 2, label: 'Phân tích & chốt phạm vi', goal: 'Hiểu đúng yêu cầu, chốt gói và danh sách trang, khách xác nhận hợp đồng, nhận cọc.', statuses: ['in_review'] },
  { id: 'design', no: 3, label: 'Thiết kế', goal: 'Dựng bản thiết kế, khách duyệt. Phạm vi đã khoá.', statuses: ['design'] },
  { id: 'build', no: 4, label: 'Phát triển', goal: 'Làm theo backlog từng sprint cho tới khi xong mọi việc Bắt buộc.', statuses: ['build'] },
  { id: 'test', no: 5, label: 'Kiểm thử & nghiệm thu', goal: 'Khách dùng thử, góp ý theo danh sách, nghiệm thu. Thu đủ tiền.', statuses: ['client_review', 'revision'] },
  { id: 'handover', no: 6, label: 'Bàn giao', goal: 'Giao mã nguồn .ZIP (và web đã chạy nếu gói có liên kết). Bảo hành bắt đầu.', statuses: ['delivery'] },
  { id: 'care', no: 7, label: 'Hậu mãi', goal: 'Chào gói lẻ, xin đánh giá, đóng dự án. Bảo hành và duy trì tiếp tục.', statuses: ['addons', 'feedback', 'closed'] },
];

export const phaseOf = (status) => PHASES.find((p) => p.statuses.includes(status)) || null;

// ── Điều kiện ────────────────────────────────────────────────────────────────
const worklogCount = (p, phase) => (p.worklog || []).filter((w) => w.phase === phase).length;
const liveLedger = (p) => (p.ledger || []).filter((e) => !e.voided && !e.pending);
const mustTasks = (p) => (p.backlog || []).filter((t) => t.moscow === 'must');

/**
 * `where` nói cho admin biết làm điều kiện này ở thẻ nào của trang quản trị.
 * `when` (không bắt buộc) — điều kiện chỉ áp dụng cho một số gói.
 */
export const CHECK_ITEMS = {
  linkSent: { label: 'Đã gửi link cổng dự án cho khách (Zalo / email)', manual: true, where: 'work' },
  requirementsIn: { label: 'Khách đã nộp phiếu yêu cầu', auto: (p) => Boolean(p.requirementsSubmittedAt), where: 'brief' },
  requirementsRead: { label: 'Đã đọc phiếu, hỏi lại chỗ chưa rõ', manual: true, where: 'brief' },
  scopeReady: { label: 'Bản phạm vi công việc đủ 100% (mục tiêu, KPI, trang, tiêu chí nghiệm thu, ngoài phạm vi)', auto: (p) => scopeCompleteness(p).percent === 100, where: 'brief' },
  packageInLedger: { label: 'Gói chính đã vào bảng tiền', auto: (p) => liveLedger(p).some((e) => e.kind === 'package'), where: 'money' },
  // Phải là phiên bản ĐÃ CÓ bản phạm vi (Phụ lục A) — xác nhận bản cũ không tính.
  contractAccepted: {
    label: 'Khách đã xác nhận hợp đồng có kèm bản phạm vi',
    auto: (p) => (p.contract?.acceptedVersion || 0) > 0 && (p.contract?.acceptedVersion || 0) >= (p.scope?.contractVersion || 0),
    where: 'contract',
  },
  depositPaid: {
    label: 'Đã nhận cọc 50% gói chính',
    when: (p) => !getPackageFacts(p.packageId)?.noDeposit,
    auto: (p) => {
      const pkg = liveLedger(p).find((e) => e.kind === 'package');
      return Boolean(pkg) && ledgerTotals(p).paid >= Math.round(((pkg.amount || 0) - (pkg.discount || 0)) * 0.5);
    },
    where: 'money',
  },
  designSent: { label: 'Đã gửi bản thiết kế cho khách xem', manual: true, where: 'chat' },
  designApproved: { label: 'Khách đã duyệt thiết kế', manual: true, where: 'chat' },
  backlogReady: { label: 'Đã có backlog việc cần làm', auto: (p) => (p.backlog || []).length > 0, where: 'work' },
  mustDone: { label: 'Mọi việc Bắt buộc trong backlog đã xong', auto: (p) => mustTasks(p).length > 0 && mustTasks(p).every((t) => t.state === 'done'), where: 'work' },
  implLogged: { label: 'Đã ghi nhật ký thực hiện', auto: (p) => worklogCount(p, 'implementation') > 0, where: 'log' },
  testLogged: { label: 'Đã tự kiểm thử và ghi nhật ký kiểm thử', auto: (p) => worklogCount(p, 'testing') > 0, where: 'log' },
  clientAccepted: { label: 'Khách đã nghiệm thu bản chạy thử', manual: true, where: 'chat' },
  zipUploaded: { label: 'Đã tải bản bàn giao .ZIP', auto: (p) => Boolean(p.sourceDelivery?.fileUrl), where: 'handover' },
  paidInFull: { label: 'Khách đã thanh toán đủ', auto: (p) => ledgerTotals(p).total > 0 && ledgerTotals(p).due === 0, where: 'money' },
  domainConnected: { label: 'Đã kết nối web vào tên miền của khách, gửi link web đã chạy', manual: true, when: (p) => Boolean(getPackageFacts(p.packageId)?.linkIncluded), where: 'handover' },
  handoverLogged: { label: 'Đã ghi nhật ký bàn giao', auto: (p) => worklogCount(p, 'handover') > 0, where: 'log' },
  addonsAnswered: { label: 'Khách đã trả lời lời chào gói lẻ (chọn hoặc bỏ qua)', auto: (p) => Boolean(p.addons?.respondedAt), manual: true, where: 'money' },
  feedbackAsked: { label: 'Đã mời khách đánh giá', manual: true, where: 'chat' },
};

/**
 * CỔNG: muốn BƯỚC VÀO trạng thái này thì các điều kiện kia phải xong. Chỉ đặt
 * cổng cho bước tiến; lùi lại, huỷ và chấm dứt không bị chặn.
 */
export const GATES = {
  awaiting_requirements: ['linkSent'],
  in_review: ['requirementsIn'],
  design: ['requirementsRead', 'scopeReady', 'packageInLedger', 'contractAccepted', 'depositPaid'],
  build: ['designSent', 'designApproved'],
  client_review: ['backlogReady', 'mustDone', 'implLogged', 'testLogged'],
  delivery: ['clientAccepted', 'zipUploaded', 'paidInFull'],
  addons: ['handoverLogged', 'domainConnected'],
  feedback: ['addonsAnswered'],
  closed: ['feedbackAsked'],
};

/** Một điều kiện đã xong chưa: tự động theo dữ liệu, hoặc admin đã tích. */
export function itemDone(project, id) {
  const item = CHECK_ITEMS[id];
  if (!item) return true;
  if (item.when && !item.when(project)) return true;
  if (item.auto && item.auto(project)) return true;
  return Boolean(item.manual && project.checklist?.[id]?.done);
}

export const itemApplies = (project, id) => !CHECK_ITEMS[id]?.when || CHECK_ITEMS[id].when(project);

/** Trạng thái cổng vào `toStatus`: đủ chưa, thiếu những gì. */
export function gateStatus(project, toStatus) {
  const ids = (GATES[toStatus] || []).filter((id) => itemApplies(project, id));
  const missing = ids.filter((id) => !itemDone(project, id));
  return { ok: missing.length === 0, items: ids.map((id) => ({ id, ...CHECK_ITEMS[id], done: itemDone(project, id) })), missing };
}

// ── Scrum: chia việc tự động ────────────────────────────────────────────────
/** Sức một người làm trong một sprint (≈ một tuần làm việc). */
export const SPRINT_CAPACITY = 8;
const MOSCOW_POINTS = { must: 3, should: 2, could: 1 };

/**
 * Sinh backlog từ gói + phiếu yêu cầu — BA chia việc thay admin. Mỗi trang là
 * một việc, mỗi tính năng là một việc theo đúng mức MoSCoW khách chọn; việc nền
 * luôn có. "Lần này không làm" bị loại. Chia sprint: Bắt buộc trước, không
 * sprint nào quá SPRINT_CAPACITY điểm.
 */
export function generateBacklog(project) {
  const r = project.requirements || {};
  const pkg = getPackageFacts(project.packageId);
  const tasks = [];
  const add = (title, moscow, points, detail = '', visibleToCustomer = true) => tasks.push({ title, moscow, points, detail, visibleToCustomer, state: 'todo' });

  add('Khởi tạo dự án, cấu hình khung mã', 'must', 1, 'Kho mã, môi trường chạy thử, cấu trúc thư mục.', false);
  add('Hệ thiết kế: màu, phông chữ, lưới theo thương hiệu', 'must', 2, 'Áp đúng bản thiết kế đã duyệt cho mọi màn hình.');

  // Có bản phạm vi đã lưu thì chia việc theo nó: tiêu chí nghiệm thu của từng
  // trang / tính năng trở thành "định nghĩa xong" của việc tương ứng.
  const scope = project.scope?.savedAt ? project.scope : null;
  const pagePoints = pkg?.id === 'hugo-one' ? 5 : 3;
  if (scope?.pages?.length) {
    for (const p of scope.pages) add(`Dựng trang: ${p.name}`, 'must', pagePoints, [p.purpose && `Mục đích: ${p.purpose}`, p.primaryAction && `Hành động chính: ${p.primaryAction}`, p.acceptance && `Xong khi: ${p.acceptance}`].filter(Boolean).join('\n'));
  } else {
    const pages = Array.isArray(r.pages) && r.pages.length
      ? r.pages
      : pkg?.id === 'hugo-one' ? ['Trang đích (landing page)'] : ['Trang chủ', 'Giới thiệu', 'Dịch vụ', 'Liên hệ'];
    for (const page of pages) add(`Dựng trang: ${page}`, 'must', pagePoints, 'Bố cục, nội dung khách gửi, hiển thị tốt trên điện thoại.');
  }

  const seen = new Set();
  if (scope?.features?.length) {
    for (const f of scope.features) {
      if (!MOSCOW_POINTS[f.moscow] || seen.has(f.name)) continue;
      seen.add(f.name);
      add(`Tính năng: ${f.name}`, f.moscow, MOSCOW_POINTS[f.moscow], f.acceptance ? `Xong khi: ${f.acceptance}` : '');
    }
  } else {
    const features = r.features && typeof r.features === 'object' ? r.features : {};
    for (const level of ['must', 'should', 'could']) {
      for (const f of features[level] || []) {
        if (seen.has(f)) continue;
        seen.add(f);
        add(`Tính năng: ${f}`, level, MOSCOW_POINTS[level]);
      }
    }
  }
  const kpi = scope?.kpis?.find((k) => k.measure);
  if (kpi) add(`Đo lường: ${kpi.measure}`, 'must', 1, `Để đo KPI "${kpi.metric}" — mục tiêu ${kpi.target || '—'}.`);
  if (!seen.has('Form liên hệ') && !seen.has('Form liên hệ gửi về email')) add('Tính năng: Form liên hệ gửi về email', 'must', 2);
  if (pkg?.id === 'hugo-flow-plus') {
    add('Trang quản trị: đăng nhập, danh sách đơn, đổi trạng thái đơn', 'must', 5);
    add('Luồng đặt lịch / nhận đơn và email báo đơn mới', 'must', 5);
    add('Trả tiền bằng mã QR hoặc link thanh toán của khách', 'must', 2);
  }
  const langs = Array.isArray(r.languages) ? r.languages : [];
  if (langs.length > 1) add(`Đa ngôn ngữ: ${langs.join(', ')}`, 'should', 3);
  for (const integ of Array.isArray(r.integrations) ? r.integrations : []) add(`Tích hợp: ${integ}`, 'should', 2);
  add('SEO nền: tiêu đề, mô tả, ảnh chia sẻ, sơ đồ trang', 'must', 1);
  add('Tối ưu tốc độ và nén ảnh', 'should', 1, '', false);

  const order = { must: 0, should: 1, could: 2 };
  const sorted = tasks.map((t, i) => ({ ...t, i })).sort((a, b) => order[a.moscow] - order[b.moscow] || a.i - b.i);
  let sprint = 1;
  let load = 0;
  for (const t of sorted) {
    if (load > 0 && load + t.points > SPRINT_CAPACITY) { sprint += 1; load = 0; }
    t.sprint = sprint;
    load += t.points;
    delete t.i;
  }
  return sorted;
}

/** Tóm tắt Scrum để vẽ tiến độ và gợi ý sprint kế tiếp. */
export function scrumSummary(project) {
  const backlog = project.backlog || [];
  const current = project.currentSprint || 1;
  const inSprint = backlog.filter((t) => t.sprint === current);
  const points = (arr) => arr.reduce((s, t) => s + (t.points || 0), 0);
  const lastSprint = backlog.reduce((m, t) => Math.max(m, t.sprint || 1), 1);
  return {
    current, lastSprint,
    donePoints: points(backlog.filter((t) => t.state === 'done')),
    totalPoints: points(backlog),
    sprintDone: inSprint.length > 0 && inSprint.every((t) => t.state === 'done'),
    sprintPoints: points(inSprint),
  };
}
