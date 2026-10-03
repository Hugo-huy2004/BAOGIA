// Soát quy trình dự án khách hàng — chạy: npm run check:project
//
// Máy trạng thái là thứ quyết định khi nào thư tự động bay tới khách. Một bước
// nhảy sai sẽ gửi thư "đã bàn giao mã nguồn" cho người còn chưa điền phiếu yêu
// cầu, nên nó phải có phép kiểm riêng.
import { listPrice } from '../../shared/projectPackages.js';
import { ledgerTotals, buildContract, warrantyItems, contractLangFor, warrantyActive } from '../../shared/projectContract.js';
import { buildBrief } from '../../shared/projectBrief.js';
import { PHASES, GATES, CHECK_ITEMS, gateStatus, generateBacklog, phaseOf, SPRINT_CAPACITY } from '../../shared/projectPhases.js';
import { draftScope, openQuestions } from '../../shared/projectScope.js';
import {
  PROJECT_STATUSES, PROJECT_STATUS_ORDER, canTransition, isValidStatus,
  formatProjectId, parseProjectId, projectIdPeriod, PROJECT_ID_PATTERN,
  REQUIREMENT_SECTIONS, MOSCOW_LEVELS, MAX_CUSTOMER_EDITS,
  estimateProject, addWorkingDays, PACKAGE_BASE_DAYS, PROJECT_ADDONS, FEEDBACK_QUESTIONS,
} from '../../shared/projectWorkflow.js';

const fails = [];
const check = (name, ok, detail = '') => {
  console.log(`  ${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails.push(name);
};

console.log('Mã dự án — nhìn là biết mở khi nào');
const id = formatProjectId(projectIdPeriod(new Date('2026-09-23')), 7);
check('sinh đúng dạng HG-YYMM-NNN', id === 'HG-2609-007', id);
check('khớp biểu thức kiểm tra', PROJECT_ID_PATTERN.test(id));
const parsed = parseProjectId(id);
check('đọc ngược ra tháng mở', parsed?.year === 2026 && parsed?.month === 9, parsed?.label);
check('từ chối mã sai dạng', parseProjectId('ABC-1-2') === null);
check('từ chối tháng 13', parseProjectId('HG-2613-001') === null);

console.log('\nMáy trạng thái');
check('mọi trạng thái trong thứ tự đều tồn tại', PROJECT_STATUS_ORDER.every(isValidStatus));
for (const [id_, s] of Object.entries(PROJECT_STATUSES)) {
  check(`${id_}: mọi bước kế tiếp đều hợp lệ`, s.next.every(isValidStatus), s.next.join(' → ') || 'điểm cuối');
}
check('KHÔNG nhảy thẳng draft → delivery', !canTransition('draft', 'delivery'));
check('KHÔNG nhảy thẳng awaiting_requirements → closed', !canTransition('awaiting_requirements', 'closed'));
check('đi được in_review → design (mốc chốt)', canTransition('in_review', 'design'));
check('design khoá phạm vi và bắt đầu đếm ngày',
  PROJECT_STATUSES.design.locksScope === true && PROJECT_STATUSES.design.startsEstimate === true);
check('delivery đòi có tệp mã nguồn', PROJECT_STATUSES.delivery.requiresSourceZip === true);
check('cancelled và terminated là điểm cuối',
  !PROJECT_STATUSES.cancelled.next.length && !PROJECT_STATUSES.terminated.next.length);
// Đóng dự án không đóng bảo hành/duy trì: vi phạm sau khi đóng vẫn chấm dứt được.
check('closed chỉ đi được sang terminated',
  PROJECT_STATUSES.closed.next.length === 1 && PROJECT_STATUSES.closed.next[0] === 'terminated');
check('mọi trạng thái đang chạy đều chấm dứt được',
  Object.entries(PROJECT_STATUSES).filter(([k]) => !['cancelled', 'terminated'].includes(k))
    .every(([, s]) => s.next.includes('terminated')));

// Mọi trạng thái (trừ nháp) phải tới được từ nháp, nếu không nó là ngõ cụt chết.
const reachable = new Set(['draft']);
let grew = true;
while (grew) {
  grew = false;
  for (const s of [...reachable]) {
    for (const n of PROJECT_STATUSES[s].next) if (!reachable.has(n)) { reachable.add(n); grew = true; }
  }
}
const orphan = Object.keys(PROJECT_STATUSES).filter((s) => !reachable.has(s));
check('không trạng thái nào là ngõ cụt không tới được', orphan.length === 0, orphan.join(', ') || 'tất cả đều tới được');

console.log('\nThư tự động');
const notifying = Object.entries(PROJECT_STATUSES).filter(([, s]) => s.notify).map(([k]) => k);
check('draft KHÔNG gửi thư (khách chưa biết dự án tồn tại)', !PROJECT_STATUSES.draft.notify);
check('mọi trạng thái khách nhìn thấy đều có thư báo',
  Object.entries(PROJECT_STATUSES).filter(([, s]) => s.customer).every(([, s]) => s.notify),
  `${notifying.length} trạng thái gửi thư`);
check('mọi trạng thái đều có câu giải thích cho khách',
  Object.values(PROJECT_STATUSES).every((s) => s.label && s.blurb));

console.log('\nPhiếu yêu cầu');
const fields = REQUIREMENT_SECTIONS.flatMap((s) => s.fields);
const ids = fields.map((f) => f.id);
check('không trùng mã câu hỏi', ids.length === new Set(ids).size, `${ids.length} câu hỏi`);
check('mọi câu hỏi đều có nhãn và kiểu', fields.every((f) => f.label && f.type));
check('có chọn gói dịch vụ', fields.some((f) => f.type === 'package'));
check('có hỏi màu sắc', fields.some((f) => f.type === 'colors'));
check('có hỏi website mẫu', fields.some((f) => f.type === 'references'));
check('có phân loại MoSCoW', fields.some((f) => f.type === 'moscow') && MOSCOW_LEVELS.length === 4);
check('số câu bắt buộc còn ít', fields.filter((f) => f.required).length <= 8,
  `${fields.filter((f) => f.required).length}/${fields.length} bắt buộc`);
check('điều kiện hiện/ẩn trỏ vào câu hỏi có thật',
  fields.filter((f) => f.showIf).every((f) => ids.includes(f.showIf.field)));
check('khách được sửa đúng 3 lần', MAX_CUSTOMER_EDITS === 3);

console.log('\nƯớc lượng thời gian');
for (const pkg of Object.keys(PACKAGE_BASE_DAYS)) {
  const e = estimateProject(pkg, {});
  check(`${pkg}: có số ngày và giải thích được`, e.workingDays > 0 && e.breakdown.length >= 2,
    `${e.workingDays} ngày`);
}
const big = estimateProject('hugo-story', {
  pages: ['a', 'b', 'c', 'd', 'e', 'f'], features: { must: ['x', 'y'], should: ['z'] },
  languages: ['Tiếng Việt', 'Tiếng Anh'], copySource: 'Nhờ Hugo Studio viết',
});
const small = estimateProject('hugo-story', {});
check('yêu cầu nhiều hơn thì mất nhiều ngày hơn', big.workingDays > small.workingDays,
  `${small.workingDays} → ${big.workingDays} ngày`);
check('tổng bằng đúng tổng các khoản',
  big.workingDays === Math.ceil(big.breakdown.reduce((a, b) => a + b.days, 0)));
const due = addWorkingDays(new Date('2026-09-25'), 3); // thứ Sáu + 3 ngày làm việc
check('cộng ngày làm việc bỏ qua cuối tuần', due.getDay() !== 0 && due.getDay() !== 6,
  due.toLocaleDateString('vi-VN'));

console.log('\nKết thúc dự án');
check('có danh mục dịch vụ kèm', PROJECT_ADDONS.length >= 3);
check('mọi dịch vụ kèm đều có giá trong danh mục (VNĐ và USD)',
  PROJECT_ADDONS.every((a) => a.blurb && listPrice(a.id, 'hugo-story', 'domestic') > 0 && listPrice(a.id, 'hugo-story', 'international') > 0));
// ── Sổ chi phí và hợp đồng (tiền: phải cộng đúng từng đồng) ──
{
  const p = {
    projectId: 'HG-2609-001', market: 'domestic', packageId: 'hugo-story', status: 'closed',
    customer: { fullName: 'Khách thử' }, requirements: { pages: ['Trang chủ'] },
    warranty: { startsAt: new Date('2026-10-01T09:00:00Z'), claims: [] },
    contract: { version: 3, acceptedVersion: 2, changes: [] },
    ledger: [
      { kind: 'package', itemId: 'hugo-story', title: 'Hugo Story', amount: 2990000 },
      { kind: 'revision', title: 'Lần chỉnh 1', amount: 200000, free: true },
      { kind: 'revision', title: 'Lần chỉnh 3', amount: 200000, detail: 'Đổi màu nút' },
      { kind: 'addon', itemId: 'seo', title: 'Gói SEO', amount: 1790000, discount: 290000 },
      { kind: 'unit', itemId: 'extra-page', title: 'Thêm trang', amount: 390000, quantity: 2 },
      { kind: 'addon', itemId: 'domain-setup', title: 'Huỷ', amount: 350000, voided: true },
      { kind: 'addon', itemId: 'seo', title: 'Chờ', amount: 1790000, pending: true },
      { kind: 'payment', title: 'Cọc', amount: 1495000 },
      { kind: 'adjustment', title: 'Giảm cho khách quen', discount: 100000 },
    ],
  };
  const tot = ledgerTotals(p);
  const expected = 2990000 + 0 + 200000 + 1500000 + 780000 - 100000;
  check('sổ chi phí: tổng đúng từng đồng (miễn phí = 0, giảm giá trừ, số lượng nhân, dòng giảm cả HĐ trừ)', tot.total === expected, `${tot.total} = ${expected}`);
  check('sổ chi phí: tiết kiệm = giá niêm yết − tổng', tot.savings === (2990000 + 400000 + 1790000 + 780000) - expected, String(tot.savings));
  check('sổ chi phí: khoản đã huỷ và chờ xác nhận KHÔNG tính', tot.pending === 1 && tot.total === expected);
  check('sổ chi phí: chỉnh sửa tính phí tự cộng riêng', tot.paidRevisions === 200000 && tot.freeRevisions === 1);
  check('sổ chi phí: còn nợ = tổng − đã trả', tot.due === expected - 1495000, String(tot.due));
  const w = warrantyItems(p);
  check('bảo hành: gói chính trọn đời, có hạn đổi chữ 14 ngày', w[0]?.lifetime === true && w[0].contentEditUntil instanceof Date);
  check('bảo hành: gói lẻ SEO 30 ngày', w.some((x) => x.title === 'Gói SEO' && x.endsAt));
  for (const lang of ['vi', 'en']) {
    const c = buildContract(p, { lang });
    check(`hợp đồng ${lang}: đủ 14 điều và 6 phụ lục`, c.articles.length === 14 && c.schedules.length === 6);
    check(`hợp đồng ${lang}: phiên bản mới chưa xác nhận thì đòi xác nhận`, c.needsAcceptance === true);
    check(`hợp đồng ${lang}: bảng kê ghi đủ mọi dòng sổ`, c.schedules[1].rows.length === p.ledger.length);
  }
  check('người đọc tiếng Trung xem hợp đồng tiếng Anh', contractLangFor('zh') === 'en' && contractLangFor('nom') === 'vi');
  const intl = ledgerTotals({ ...p, market: 'international', ledger: [{ kind: 'package', amount: 449 }] });
  check('dự án quốc tế tính bằng USD', intl.currency === 'usd' && intl.total === 449);
}

// ── Giai đoạn (Waterfall) và chia việc (Scrum) ──
{
  const all = Object.keys(PROJECT_STATUSES).filter((s) => !['cancelled', 'terminated'].includes(s));
  check('mọi trạng thái đang chạy đều thuộc đúng một giai đoạn', all.every((s) => PHASES.filter((p) => p.statuses.includes(s)).length === 1));
  check('mọi điều kiện trong cổng đều có định nghĩa', Object.values(GATES).flat().every((id) => CHECK_ITEMS[id]));
  check('mọi điều kiện đều tự động hoặc tích tay', Object.values(CHECK_ITEMS).every((i) => i.auto || i.manual));
  check('cổng chỉ đặt trên trạng thái có thật', Object.keys(GATES).every(isValidStatus));
  const bare = { status: 'build', packageId: 'hugo-story', ledger: [], backlog: [], worklog: [] };
  check('KHÔNG sang nghiệm thu khi chưa xong backlog và chưa kiểm thử', !gateStatus(bare, 'client_review').ok);
  check('KHÔNG bàn giao khi chưa có ZIP và chưa thu đủ', gateStatus(bare, 'delivery').missing.includes('zipUploaded') && gateStatus(bare, 'delivery').missing.includes('paidInFull'));
  check('lùi lại (sửa tiếp) và huỷ không bị chặn', gateStatus(bare, 'revision').ok && gateStatus(bare, 'cancelled').ok);
  const readyScope = { savedAt: new Date(), contractVersion: 1, objective: 'Nhận đặt bàn', kpis: [{ metric: 'Lượt đặt', target: '20/tháng', measure: 'booking_completed' }], persona: 'Dân văn phòng quận 1', pages: [{ name: 'Trang chủ', purpose: 'x', primaryAction: 'Đặt bàn', acceptance: 'y' }], features: [], outOfScope: ['Logo'], answers: { audience: 1, trigger: 1, objections: 1, action: 1, baseline: 1, target: 1, failure: 1, sources: 1, pages: 1, must: 1, content: 1, deadline: 1 } };
  const one = { packageId: 'hugo-one', ledger: [{ kind: 'package', amount: 1290000 }], contract: { acceptedVersion: 1 }, scope: readyScope, checklist: { requirementsRead: { done: true } } };
  check('Hugo One không cọc: đủ điều kiện chốt phạm vi khi chưa nhận đồng nào', gateStatus(one, 'design').ok);
  const story = { ...one, packageId: 'hugo-story', ledger: [{ kind: 'package', amount: 2990000 }] };
  check('Hugo Story chưa cọc: KHÔNG được chốt phạm vi', gateStatus(story, 'design').missing.includes('depositPaid'));
  const paid = { ...story, ledger: [...story.ledger, { kind: 'payment', amount: 1495000 }] };
  check('Hugo Story đã cọc 50%: được chốt phạm vi', gateStatus(paid, 'design').ok);
  check('điều kiện tự động không lách bằng tích tay', !gateStatus({ ...bare, checklist: { zipUploaded: { done: true } } }, 'delivery').items.find((i) => i.id === 'zipUploaded').done);
  const tasks = generateBacklog({ packageId: 'hugo-story', requirements: { pages: ['Trang chủ', 'Giới thiệu', 'Thực đơn', 'Liên hệ', 'Tuyển dụng'], features: { must: ['Bản đồ chỉ đường'], should: ['Đặt lịch hẹn'], could: ['Tìm kiếm'], wont: ['Giỏ hàng và thanh toán'] } } });
  check('backlog: mỗi trang một việc', tasks.filter((t) => t.title.startsWith('Dựng trang')).length === 5);
  check('backlog: bỏ "Lần này không làm"', !tasks.some((t) => t.title.includes('Giỏ hàng')));
  const sprints = {};
  for (const t of tasks) sprints[t.sprint] = (sprints[t.sprint] || 0) + t.points;
  check('backlog: không sprint nào quá sức một người', Object.values(sprints).every((pts) => pts <= Math.max(SPRINT_CAPACITY, 5)), JSON.stringify(sprints));
  const firstShould = tasks.findIndex((t) => t.moscow !== 'must');
  check('backlog: làm hết Bắt buộc trước', tasks.slice(0, firstShould).every((t) => t.moscow === 'must') && tasks.slice(firstShould).every((t) => t.moscow !== 'must'));
  check('phaseOf đọc đúng giai đoạn', phaseOf('revision')?.id === 'test' && phaseOf('closed')?.id === 'care');
  check('KHÔNG chốt phạm vi khi chưa có bản phạm vi', gateStatus({ ...one, scope: null }, 'design').missing.includes('scopeReady'));
  check('khách xác nhận hợp đồng CŨ (trước khi có phạm vi) không tính', gateStatus({ ...one, scope: { ...readyScope, contractVersion: 3 } }, 'design').missing.includes('contractAccepted'));
  const vague = openQuestions({ requirements: { visitorAction: 'biết thương hiệu', successMetric: 'nhiều khách' } });
  check('BA: hành động không có động từ và mục tiêu không có số thì bị hỏi lại', vague.some((q) => q.id === 'action') && vague.some((q) => q.id === 'target'));
  check('BA: trả lời rồi thì hết hỏi', openQuestions({ requirements: {}, scope: { answers: { audience: 'x' } } }).every((q) => q.id !== 'audience'));
  const draft = draftScope({ packageId: 'hugo-story', requirements: { primaryGoal: 'Nhận đặt lịch / đặt bàn', visitorAction: 'Bấm đặt bàn', pages: ['Trang chủ', 'Thực đơn'], features: { must: ['Bản đồ chỉ đường'], wont: ['Giỏ hàng và thanh toán'] } } });
  check('bản nháp: KPI gắn đúng sự kiện đo', draft.kpis[0].measure.includes('booking_completed'));
  check('bản nháp: "Lần này không cần" vào mục ngoài phạm vi', draft.outOfScope.some((x) => x.includes('Giỏ hàng')));
  check('bản nháp: trang có sẵn mục đích và tiêu chí nghiệm thu', draft.pages.every((p) => p.purpose && p.acceptance));
  const fromScope = generateBacklog({ packageId: 'hugo-story', scope: { ...readyScope, pages: [{ name: 'Thực đơn', acceptance: 'Đủ món' }] } });
  check('backlog lấy trang và tiêu chí nghiệm thu từ bản phạm vi', fromScope.some((t) => t.title === 'Dựng trang: Thực đơn' && t.detail.includes('Xong khi: Đủ món')));
  const paidUp = { warranty: { startsAt: new Date() }, ledger: [{ kind: 'package', amount: 100 }, { kind: 'payment', amount: 100 }] };
  check('chấm dứt vì lý do (d): phần đã trả đủ VẪN được bảo hành', warrantyActive({ ...paidUp, status: 'terminated', termination: { clause: '11.2(d)' } }));
  check('chấm dứt vì (b)/(e)/(f): hết bảo hành', !warrantyActive({ ...paidUp, status: 'terminated', termination: { clause: '11.2(e)' } }));
  check('chấm dứt khi còn nợ: hết bảo hành', !warrantyActive({ ...paidUp, ledger: paidUp.ledger.slice(0, 1), status: 'terminated', termination: { clause: '11.2(a)' } }));
  const brief = buildBrief({ projectId: 'HG-2609-001', requirements: { fullName: 'A', packageId: 'hugo-story', deadline: '2026-10-20' } });
  check('bảng yêu cầu A4: bỏ câu trống, gói in tên, ngày in dd/mm/yyyy', brief.sections.length === 3 && brief.sections.some((x) => x.rows.some(([, v]) => v === 'Hugo Story')) && brief.sections.some((x) => x.rows.some(([, v]) => v === '20/10/2026')));
  check('hợp đồng căn cứ Luật BVDLCN 2025, không còn Nghị định 13/2023', buildContract({ ledger: [] }, { lang: 'vi' }).bases.items.some((x) => x.includes('91/2025')) && !JSON.stringify(buildContract({ ledger: [] }, { lang: 'en' })).includes('13/2023'));
}

check('bài đánh giá có câu hỏi mở', FEEDBACK_QUESTIONS.some((q) => q.type === 'textarea'));
check('bài đánh giá đủ ngắn', FEEDBACK_QUESTIONS.length <= 10, `${FEEDBACK_QUESTIONS.length} câu`);

console.log();
if (fails.length) {
  console.log(`❌ Quy trình dự án: ${fails.length} phép kiểm hỏng`);
  fails.forEach((f) => console.log(`   · ${f}`));
  process.exit(1);
}
console.log('✅ Quy trình dự án đạt — mã truy ngược được, không bước nhảy sai, ước lượng giải thích được');
