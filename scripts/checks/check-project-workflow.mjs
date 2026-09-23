// Soát quy trình dự án khách hàng — chạy: npm run check:project
//
// Máy trạng thái là thứ quyết định khi nào thư tự động bay tới khách. Một bước
// nhảy sai sẽ gửi thư "đã bàn giao mã nguồn" cho người còn chưa điền phiếu yêu
// cầu, nên nó phải có phép kiểm riêng.
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
check('closed và cancelled là điểm cuối',
  !PROJECT_STATUSES.closed.next.length && !PROJECT_STATUSES.cancelled.next.length);

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
check('mọi dịch vụ kèm đều ghi giá', PROJECT_ADDONS.every((a) => a.price && a.blurb));
check('bài đánh giá có câu hỏi mở', FEEDBACK_QUESTIONS.some((q) => q.type === 'textarea'));
check('bài đánh giá đủ ngắn', FEEDBACK_QUESTIONS.length <= 10, `${FEEDBACK_QUESTIONS.length} câu`);

console.log();
if (fails.length) {
  console.log(`❌ Quy trình dự án: ${fails.length} phép kiểm hỏng`);
  fails.forEach((f) => console.log(`   · ${f}`));
  process.exit(1);
}
console.log('✅ Quy trình dự án đạt — mã truy ngược được, không bước nhảy sai, ước lượng giải thích được');
