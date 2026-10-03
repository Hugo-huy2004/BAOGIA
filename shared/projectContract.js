/**
 * Hợp đồng dịch vụ tự dựng từ dữ liệu dự án — NGUỒN DUY NHẤT cho server, trang
 * quản trị và cổng khách.
 *
 * Hợp đồng KHÔNG lưu bản văn: nó được dựng lại từ sổ chi phí, phiếu yêu cầu,
 * nhật ký, bảo hành… mỗi lần mở. Nhờ vậy không thể có chuyện "hợp đồng ghi một
 * đằng, sổ ghi một nẻo". Mỗi thay đổi ảnh hưởng hợp đồng tăng `contract.version`
 * (xem server/services/projectContractService.js) và khách xác nhận lại.
 *
 * Hai ngôn ngữ hiển thị: `vi` và `en` (người xem tiếng Trung đọc bản `en`). Bản
 * GỐC có giá trị khi hai bản khác nhau theo thị trường của dự án: trong nước →
 * tiếng Việt, quốc tế → tiếng Anh (Điều 14).
 *
 * Căn cứ pháp lý ghi trong hợp đồng — kiểm lại khi luật thay đổi:
 *   BLDS 2015 (91/2015/QH13): Điều 513 hợp đồng dịch vụ, Điều 328 đặt cọc,
 *   Điều 428 đơn phương chấm dứt (phải THÔNG BÁO NGAY cho bên kia — nên điều
 *   chấm dứt ghi "có hiệu lực khi gửi thông báo", không phải "không thông báo").
 *   Luật GDĐT 2023 (20/2023/QH15): xác nhận trên cổng = giao kết điện tử.
 *   Luật SHTT (50/2005/QH11, sửa đổi 07/2022/QH15). NĐ 13/2023/NĐ-CP dữ liệu cá nhân.
 *
 * Không nhắc tới thuế của Hugo Studio ở đây (chủ dịch vụ tự xử lý). Không có
 * chức năng thu tiền trên website: tiền ghi vào sổ khi admin xác nhận đã nhận.
 */

import { getPackageFacts, formatMoney, marketOf, LIFETIME } from './projectPackages.js';
import { PROJECT_STATUSES } from './projectWorkflow.js';

export const STUDIO_PARTY = {
  brand: 'Hugo Studio',
  representative: 'Hugo Wishpax',
  email: 'contact@hugowishpax.studio',
  website: 'https://www.hugowishpax.studio',
};

// ── Tiền ─────────────────────────────────────────────────────────────────────
/**
 * Tiền thật của một dòng. Dòng `adjustment` là GIẢM GIÁ cho cả hợp đồng: không
 * có đơn giá, chỉ có số giảm → ra số âm. Mọi dòng khác không bao giờ âm.
 */
export const effectiveAmount = (e) => {
  if (e.kind === 'adjustment') return -Math.max(0, Number(e.discount) || 0);
  return e.free ? 0 : Math.max(0, (Number(e.amount) || 0) * (Number(e.quantity) || 1) - (Number(e.discount) || 0));
};
const counts = (e) => !e.voided && !e.pending;

/** Tổng của sổ chi phí. Mọi con số trong hợp đồng đều ra từ đây. */
export function ledgerTotals(project) {
  const currency = marketOf(project.market).currency;
  const lines = (project.ledger || []).filter(counts);
  const charges = lines.filter((e) => e.kind !== 'payment');
  const sum = (arr) => arr.reduce((s, e) => s + effectiveAmount(e), 0);
  const total = sum(charges);
  const paid = lines.filter((e) => e.kind === 'payment').reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const paidRevisions = sum(charges.filter((e) => e.kind === 'revision'));
  const listTotal = charges.filter((e) => e.kind !== 'adjustment').reduce((s, e) => s + (Number(e.amount) || 0) * (Number(e.quantity) || 1), 0);
  return {
    currency, total, paid, due: Math.max(0, total - paid), paidRevisions,
    savings: Math.max(0, listTotal - total),
    freeRevisions: (project.ledger || []).filter((e) => counts(e) && e.kind === 'revision' && e.free).length,
    pending: (project.ledger || []).filter((e) => !e.voided && e.pending).length,
  };
}

// ── Bảo hành ─────────────────────────────────────────────────────────────────
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

/**
 * Bảo hành từng hạng mục, tính từ lúc bàn giao: gói chính trọn đời (kèm hạn
 * đổi chữ/ảnh), mỗi gói lẻ theo số ngày của nó, gói duy trì theo thời gian đăng
 * ký. Miễn phí hay giảm giá KHÔNG làm ngắn bảo hành.
 */
export function warrantyItems(project) {
  const start = project.warranty?.startsAt;
  if (!start) return [];
  const items = [];
  const main = getPackageFacts(project.packageId);
  if (main) {
    items.push({
      title: main.label, startsAt: start,
      endsAt: main.warranty === LIFETIME ? null : (main.warrantyDays ? addDays(start, main.warrantyDays) : null),
      lifetime: main.warranty === LIFETIME,
      contentEditUntil: main.contentEditDays ? addDays(start, main.contentEditDays) : null,
    });
  }
  for (const e of (project.ledger || []).filter((x) => counts(x) && x.kind === 'addon')) {
    const f = getPackageFacts(e.itemId);
    if (!f) continue;
    const at = e.at && new Date(e.at) > new Date(start) ? e.at : start;
    items.push({
      title: e.title, startsAt: at,
      endsAt: f.warrantyDays ? addDays(at, f.warrantyDays) : null,
      subscription: f.warranty === 'subscription',
    });
  }
  return items;
}

// ── Chữ ──────────────────────────────────────────────────────────────────────
const L = {
  vi: {
    title: 'HỢP ĐỒNG DỊCH VỤ THIẾT KẾ VÀ PHÁT TRIỂN WEBSITE',
    no: 'Số', version: 'Phiên bản', date: 'Lập ngày', status: 'Trạng thái dự án',
    partyA: 'BÊN A — BÊN CUNG CẤP DỊCH VỤ', partyB: 'BÊN B — BÊN SỬ DỤNG DỊCH VỤ',
    name: 'Tên', rep: 'Người đại diện', email: 'Email', phone: 'Điện thoại', org: 'Tổ chức', web: 'Website',
    bases: 'CĂN CỨ',
    basesList: ['Bộ luật Dân sự số 91/2015/QH13;', 'Luật Giao dịch điện tử số 20/2023/QH15;',
      'Luật Sở hữu trí tuệ số 50/2005/QH11, sửa đổi, bổ sung bởi Luật số 07/2022/QH15;',
      'Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15;', 'Luật Bảo vệ quyền lợi người tiêu dùng số 19/2023/QH15 (khi Bên B là người tiêu dùng);', 'Nhu cầu và thoả thuận của hai bên.'],
    kinds: { package: 'Gói dịch vụ', addon: 'Gói lẻ', unit: 'Phát sinh', revision: 'Chỉnh sửa', adjustment: 'Điều chỉnh', maintenance: 'Phí duy trì', payment: 'Đã thanh toán' },
    phases: { implementation: 'Thực hiện', addition: 'Nội dung thêm vào', testing: 'Kiểm thử', revision: 'Chỉnh sửa', handover: 'Bàn giao', note: 'Ghi chú' },
    free: 'Miễn phí', pending: 'Chờ xác nhận', voided: 'Đã huỷ',
    cols: {
      ledger: ['Ngày giờ', 'Loại', 'Nội dung', 'Yêu cầu của khách / ghi chú', 'Đơn giá', 'Giảm', 'Thành tiền'],
      history: ['Ngày giờ', 'Người thực hiện', 'Từ', 'Sang', 'Nội dung'],
      worklog: ['Ngày giờ', 'Giai đoạn', 'Nội dung', 'Chi tiết'],
      warranty: ['Hạng mục', 'Bắt đầu', 'Kết thúc'],
      claims: ['Mã', 'Ngày giờ báo', 'Người báo', 'Mô tả', 'Kết quả', 'Thuộc bảo hành', 'Ngày giờ xử lý'],
      versions: ['Phiên bản', 'Ngày giờ', 'Lý do'],
      scope: ['Mục', 'Nội dung'],
    },
    actors: { system: 'Hệ thống', admin: 'Bên A', customer: 'Bên B' },
    yes: 'Có', no2: 'Không', lifetime: 'Trọn đời (theo Điều 7)', subscription: 'Trong thời gian đăng ký',
    totals: { total: 'Tổng giá trị hợp đồng', revisions: 'Trong đó: chỉnh sửa tính phí', savings: 'Đã giảm / miễn phí', paid: 'Bên B đã thanh toán', due: 'Còn phải thanh toán' },
  },
  en: {
    title: 'WEBSITE DESIGN AND DEVELOPMENT SERVICE AGREEMENT',
    no: 'No.', version: 'Version', date: 'Date', status: 'Project status',
    partyA: 'PARTY A — SERVICE PROVIDER', partyB: 'PARTY B — CLIENT',
    name: 'Name', rep: 'Represented by', email: 'Email', phone: 'Phone', org: 'Organisation', web: 'Website',
    bases: 'LEGAL BASIS',
    basesList: ['Civil Code No. 91/2015/QH13 of Vietnam;', 'Law on Electronic Transactions No. 20/2023/QH15;',
      'Law on Intellectual Property No. 50/2005/QH11, as amended by Law No. 07/2022/QH15;',
      'Law on Personal Data Protection No. 91/2025/QH15;', 'Law on Protection of Consumer Rights No. 19/2023/QH15 (where Party B is a consumer);', 'The needs and agreement of both parties.'],
    kinds: { package: 'Package', addon: 'Add-on', unit: 'Extra', revision: 'Revision', adjustment: 'Adjustment', maintenance: 'Care plan fee', payment: 'Payment received' },
    phases: { implementation: 'Implementation', addition: 'Added content', testing: 'Testing', revision: 'Revision', handover: 'Handover', note: 'Note' },
    free: 'Free', pending: 'Awaiting confirmation', voided: 'Voided',
    cols: {
      ledger: ['Date & time', 'Type', 'Item', 'Client request / note', 'Unit price', 'Discount', 'Amount'],
      history: ['Date & time', 'By', 'From', 'To', 'Details'],
      worklog: ['Date & time', 'Phase', 'Item', 'Details'],
      warranty: ['Item', 'Starts', 'Ends'],
      claims: ['Code', 'Reported', 'Reported by', 'Description', 'Outcome', 'Covered', 'Resolved'],
      versions: ['Version', 'Date & time', 'Reason'],
      scope: ['Item', 'Details'],
    },
    actors: { system: 'System', admin: 'Party A', customer: 'Party B' },
    yes: 'Yes', no2: 'No', lifetime: 'Lifetime (per Article 7)', subscription: 'While subscribed',
    totals: { total: 'Total contract value', revisions: 'Of which: paid revisions', savings: 'Discounts / free items', paid: 'Paid by Party B', due: 'Balance due' },
  },
};

const fmtDate = (d, lang, withTime = true) => {
  if (!d) return '—';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '—';
  return x.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-GB', withTime
    ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const REQ_LABELS = {
  vi: { packageId: 'Gói', pages: 'Các trang', features: 'Tính năng', languages: 'Ngôn ngữ', deadline: 'Mốc cần xong', offering: 'Sản phẩm / dịch vụ', audience: 'Khách hàng mục tiêu', primaryGoal: 'Mục tiêu chính', constraints: 'Ràng buộc', notes: 'Ghi chú thêm' },
  en: { packageId: 'Package', pages: 'Pages', features: 'Features', languages: 'Languages', deadline: 'Needed by', offering: 'Product / service', audience: 'Target customers', primaryGoal: 'Main goal', constraints: 'Constraints', notes: 'Additional notes' },
};
const MOSCOW = { vi: { must: 'Bắt buộc', should: 'Nên có', could: 'Có thì tốt', wont: 'Lần này không làm' }, en: { must: 'Must', should: 'Should', could: 'Could', wont: 'Not this time' } };

const SCOPE_LABELS = {
  vi: { objective: 'Mục tiêu', kpi: 'Chỉ số thành công', persona: 'Khách hàng mục tiêu', journey: 'Hành trình của khách', out: 'KHÔNG thuộc phạm vi', assumptions: 'Giả định', risks: 'Rủi ro đã biết', now: 'hiện tại', measure: 'đo bằng',
    pages: ['Trang', 'Mục đích', 'Hành động chính', 'Nghiệm thu khi'], features: ['Tính năng', 'Mức ưu tiên', 'Nghiệm thu khi'], pagesCap: 'Danh sách trang', featuresCap: 'Danh sách tính năng' },
  en: { objective: 'Objective', kpi: 'Success metric', persona: 'Target customer', journey: 'Customer journey', out: 'OUT of scope', assumptions: 'Assumptions', risks: 'Known risks', now: 'now', measure: 'measured by',
    pages: ['Page', 'Purpose', 'Primary action', 'Accepted when'], features: ['Feature', 'Priority', 'Accepted when'], pagesCap: 'Pages', featuresCap: 'Features' },
};

/**
 * Phụ lục A. Có bản phạm vi đã lưu (shared/projectScope.js) thì in bản đó —
 * mục tiêu đo được, từng trang, từng tính năng kèm tiêu chí nghiệm thu, và
 * danh sách KHÔNG làm. Chưa có thì in tạm lời khách trong phiếu yêu cầu.
 */
function scheduleA(project, lang) {
  const pkg = getPackageFacts(project.packageId);
  const head = [lang === 'vi' ? 'Gói' : 'Package', pkg?.label || '—'];
  const s = project.scope;
  if (!s?.savedAt) return { rows: [head, ...scopeRows(project, lang).filter((r) => r[0] !== head[0])] };
  const L2 = SCOPE_LABELS[lang];
  const list = (xs) => (xs || []).filter(Boolean).map((x) => `• ${x}`).join('\n');
  const rows = [head, [L2.objective, s.objective]];
  for (const k of s.kpis || []) if (k.metric) rows.push([L2.kpi, `${k.metric}: ${k.baseline ? `${L2.now} ${k.baseline} → ` : ''}${k.target || '—'}${k.measure ? ` (${L2.measure} ${k.measure})` : ''}`]);
  rows.push([L2.persona, s.persona], [L2.journey, s.journey], [L2.out, list(s.outOfScope)], [L2.assumptions, list(s.assumptions)], [L2.risks, list(s.risks)]);
  return {
    rows: rows.filter((r) => r[1]),
    subs: [
      { caption: L2.pagesCap, columns: L2.pages, rows: (s.pages || []).map((p) => [p.name, p.purpose || '—', p.primaryAction || '—', p.acceptance || '—']) },
      { caption: L2.featuresCap, columns: L2.features, rows: (s.features || []).map((f) => [f.name, MOSCOW[lang][f.moscow] || f.moscow, f.acceptance || '—']) },
    ],
  };
}

function scopeRows(project, lang) {
  const r = project.requirements || {};
  const rows = [];
  for (const [key, label] of Object.entries(REQ_LABELS[lang])) {
    const v = key === 'packageId' ? (getPackageFacts(project.packageId || r.packageId)?.label || '') : r[key];
    if (v === undefined || v === '' || v === null) continue;
    if (key === 'features' && typeof v === 'object') {
      for (const [lvl, items] of Object.entries(v)) if (items?.length) rows.push([`${label} — ${MOSCOW[lang][lvl]}`, items.join(', ')]);
      continue;
    }
    rows.push([label, Array.isArray(v) ? v.join(', ') : String(v)]);
  }
  return rows;
}

// ── Điều khoản ───────────────────────────────────────────────────────────────
function articles(project, lang, t, totals) {
  const money = (n) => formatMoney(n, totals.currency);
  const pkg = getPackageFacts(project.packageId);
  const noDeposit = Boolean(pkg?.noDeposit);
  const intl = project.market === 'international';
  const due = project.estimate?.dueAt ? fmtDate(project.estimate.dueAt, lang, false) : (lang === 'vi' ? 'xác định khi chốt phạm vi' : 'set when the scope is locked');
  const governing = intl ? (lang === 'vi' ? 'tiếng Anh' : 'English') : (lang === 'vi' ? 'tiếng Việt' : 'Vietnamese');

  if (lang === 'vi') return [
    ['Định nghĩa', [
      '“Sản phẩm” là website và các hạng mục mô tả tại Phụ lục A và Phụ lục B.',
      '“Bản bàn giao” là tệp mã nguồn (.ZIP) Bên A tải lên Cổng dự án khi bàn giao, được ghi mã kiểm tra SHA-256 và thời điểm tải lên.',
      '“Cổng dự án” là trang quản lý riêng của dự án, truy cập bằng đường dẫn Bên A cấp cho Bên B; mọi trao đổi, xác nhận và nhật ký ghi tại đây.',
      '“Phụ lục” là các bảng A đến F đính kèm, là bộ phận không tách rời của hợp đồng và được cập nhật theo tiến trình dự án.',
    ]],
    ['Phạm vi công việc', [
      `Bên A thực hiện ${pkg ? `gói ${pkg.label}` : 'dịch vụ'} theo phạm vi tại Phụ lục A.`,
      project.scopeLockedAt ? `Phạm vi được chốt lúc ${fmtDate(project.scopeLockedAt, lang)}. Từ thời điểm này, danh sách trang và bản thiết kế đã duyệt không thay đổi.` : 'Phạm vi được chốt khi Bên A chuyển dự án sang bước thiết kế; thời điểm chốt ghi tại Phụ lục C.',
      'Việc ngoài phạm vi chỉ được thực hiện sau khi có giá và được ghi vào Phụ lục B. Không có khoản phát sinh nào ngoài Phụ lục B.',
    ]],
    ['Giá trị hợp đồng và thanh toán', [
      `Giá trị hợp đồng tại phiên bản này là ${money(totals.total)}, gồm các khoản tại Phụ lục B. Bên B đã thanh toán ${money(totals.paid)}; còn lại ${money(totals.due)}.`,
      noDeposit ? 'Gói này không yêu cầu đặt cọc. Bên B thanh toán đủ một lần khi nghiệm thu, trước khi Bên A bàn giao.' : 'Bên B đặt cọc 50% giá trị gói trước khi bắt đầu (Điều 328 Bộ luật Dân sự). Phần còn lại thanh toán khi nghiệm thu, trước khi bàn giao.',
      'Khoản phát sinh (gói lẻ, chỉnh sửa tính phí) thanh toán trước khi thực hiện. Phí duy trì hằng tháng thanh toán trước cho từng tháng.',
      intl ? 'Giá tính bằng đô la Mỹ (USD). Chênh lệch tỷ giá và phí chuyển tiền của ngân hàng hoặc cổng thanh toán do Bên B chịu.' : 'Giá tính bằng đồng Việt Nam (VNĐ).',
      'Thanh toán bằng chuyển khoản. Website của Bên A không thu tiền; khoản tiền được ghi vào Phụ lục B khi Bên A xác nhận đã nhận.',
      'Chi phí trả cho bên thứ ba (tên miền, lưu trữ, email, cổng thanh toán…) không nằm trong giá trị hợp đồng; thuế của các dịch vụ này tuỳ theo từng nhà cung cấp.',
    ]],
    ['Tiến độ', [
      `Ngày hoàn thành dự kiến: ${due}. Cách tính ghi tại Cổng dự án.`,
      'Thời gian chờ Bên B cung cấp nội dung, phản hồi hoặc thanh toán không tính vào tiến độ của Bên A.',
    ]],
    ['Góp ý và chỉnh sửa', [
      'Hai lần chỉnh thiết kế đầu tiên nằm trong giá. Từ lần thứ ba, mỗi lần chỉnh tính theo đơn giá trong bảng giá và được ghi vào Phụ lục B cùng nội dung yêu cầu của Bên B.',
      'Mỗi lần chỉnh, Bên B gửi một danh sách góp ý đầy đủ bằng văn bản, chỉ rõ phần cần đổi. Góp ý rời rạc được gom vào lần chỉnh kế tiếp.',
      'Khoảng cách, căn lề và cỡ chữ theo hệ lưới thống nhất cho mọi màn hình. Bên A không điều chỉnh từng chi tiết theo cảm nhận trên một thiết bị.',
      'Bản thiết kế đã duyệt là bản được lập trình. Thay đổi sau khi duyệt tính là một lần chỉnh thêm.',
    ]],
    ['Nghiệm thu và bàn giao', [
      'Bên A gửi bản chạy thử để Bên B nghiệm thu. Bên B phản hồi trong 7 ngày kể từ ngày nhận; Bên A nhắc lại qua Cổng dự án ít nhất một lần trước khi hết hạn. Quá hạn mà Bên B không phản hồi thì được xem là đã nghiệm thu.',
      'Bên A bàn giao Bản bàn giao qua Cổng dự án. Mã kiểm tra SHA-256 của Bản bàn giao là căn cứ đối chiếu cho bảo hành.',
      pkg?.linkIncluded ? 'Gói này gồm việc kết nối website với tên miền và nơi lưu trữ do Bên B đứng tên; Bên A bàn giao kèm đường dẫn website đã hoạt động.' : 'Việc kết nối website với tên miền của Bên B thực hiện qua Gói Liên kết nếu Bên B chọn.',
    ]],
    ['Bảo hành', [
      'Bảo hành bắt đầu từ thời điểm bàn giao, theo từng hạng mục tại Phụ lục D. Gói chính bảo hành trọn đời, nghĩa là trong suốt thời gian website còn chạy đúng Bản bàn giao.',
      'Bảo hành chỉ áp dụng cho lỗi do Bên A gây ra trên phần đã nghiệm thu. Bên B báo lỗi bằng văn bản qua Cổng dự án, kèm ảnh chụp màn hình, thiết bị và trình duyệt; Bên A phản hồi trong 1 – 2 ngày làm việc. Mỗi lần báo lỗi được ghi vào Phụ lục D.',
      'Không thuộc bảo hành: mã nguồn đã bị chỉnh sửa so với Bản bàn giao (khi đó bảo hành chấm dứt và Bên A ngừng hỗ trợ website này, trừ khi Bên B dùng Hỗ trợ lẻ); thay đổi từ bên thứ ba; tên miền, lưu trữ hết hạn; mật khẩu bị lộ từ phía Bên B; nội dung do Bên B hoặc người khác tự thêm; yêu cầu thiết kế hoặc tính năng mới; trình duyệt đã ngừng cập nhật.',
    ]],
    ['Duy trì hằng tháng', [
      'Gói duy trì (nếu có) chỉ gia hạn khi Bên A xác nhận đã nhận phí của tháng đó; không tự động trừ tiền. Mỗi tháng được ghi vào Phụ lục E.',
      'Bên B dừng gói duy trì bằng cách báo trước một tháng qua Cổng dự án.',
    ]],
    ['Sở hữu trí tuệ', [
      'Khi Bên B thanh toán đủ, quyền tài sản đối với thiết kế, nội dung và mã nguồn của dự án chuyển cho Bên B. Quyền nhân thân của tác giả được giữ theo Luật Sở hữu trí tuệ.',
      'Thư viện và khung mã Bên A dùng chung giữa các dự án vẫn thuộc Bên A; Bên B được sử dụng vĩnh viễn trong phạm vi dự án này, không được bán lại hoặc tách ra phân phối riêng.',
      'Bên A chỉ giới thiệu dự án trong hồ sơ năng lực khi Bên B đồng ý bằng văn bản (kể cả tin nhắn trên Cổng dự án). Bên B rút lại đồng ý bất cứ lúc nào; Bên A gỡ trong 7 ngày.',
    ]],
    ['Bảo mật và dữ liệu cá nhân', [
      'Bên B là bên kiểm soát dữ liệu cá nhân mà website thu thập và tự chịu trách nhiệm về chính sách quyền riêng tư của website.',
      'Bên A chỉ tiếp cận dữ liệu khi sửa lỗi theo yêu cầu của Bên B, không lưu giữ mật khẩu tài khoản của Bên B.',
      'Để thực hiện và làm chứng cứ cho hợp đồng, Bên A xử lý thông tin Bên B cung cấp (họ tên, email, số điện thoại, nội dung trao đổi) và thông tin ghi khi xác nhận (địa chỉ IP, trình duyệt). Thông tin được lưu trong thời gian hợp đồng còn hiệu lực và 3 năm sau khi chấm dứt, không bán hoặc chia sẻ cho bên khác trừ khi pháp luật yêu cầu. Bên B có quyền xem, sửa và yêu cầu xoá theo Luật Bảo vệ dữ liệu cá nhân, trừ phần pháp luật buộc phải lưu.',
    ]],
    ['Chấm dứt hợp đồng', [
      'Bên B có thể dừng hợp đồng bất cứ lúc nào. Phần việc đã làm được bàn giao tương ứng số tiền đã thanh toán; khoản đặt cọc không hoàn lại.',
      'Bên A đơn phương chấm dứt hợp đồng (Điều 428 Bộ luật Dân sự) khi Bên B: (a) chậm thanh toán quá 15 ngày kể từ hạn; (b) dùng Sản phẩm cho nội dung hoặc mục đích vi phạm pháp luật; (c) cung cấp thông tin sai sự thật để giao kết hợp đồng; (d) xúc phạm, đe doạ hoặc quấy rối Bên A, có tin nhắn hoặc bản ghi làm bằng; (e) sao chép, bán lại khung mã dùng chung của Bên A; (f) cố ý truy cập trái phép hệ thống hoặc tài khoản của Bên A.',
      'Việc chấm dứt theo khoản trên có hiệu lực ngay khi Bên A gửi thông báo qua email và Cổng dự án, không cần báo trước; hợp đồng không được gia hạn hay khôi phục.',
      'Khi chấm dứt, Bên A dừng thực hiện và duy trì; các khoản Bên B còn nợ vẫn phải thanh toán. Phần đã thanh toán đủ và đã bàn giao trước thời điểm chấm dứt vẫn được bảo hành theo Điều 7, trừ khi chấm dứt vì lý do (b), (e) hoặc (f).',
      'Dữ liệu ghi nhận trên Cổng dự án (nhật ký, tin nhắn, Bản bàn giao) là chứng cứ của cả hai bên; hai bên thừa nhận giá trị chứng cứ của dữ liệu này theo Luật Giao dịch điện tử.',
      'Bên B có quyền phản hồi hoặc khiếu nại về việc chấm dứt qua email trong 15 ngày; Bên A trả lời bằng văn bản. Điều này không hạn chế quyền khởi kiện của Bên B.',
    ]],
    ['Giao kết điện tử', [
      'Việc Bên B bấm xác nhận trên Cổng dự án là giao kết hợp đồng bằng phương tiện điện tử. Hệ thống ghi lại phiên bản, thời điểm, địa chỉ IP và trình duyệt tại Phụ lục F.',
      'Mỗi phiên bản mới (khi thêm gói lẻ, chỉnh sửa tính phí, giảm giá…) cần Bên B xác nhận lại; phiên bản đã xác nhận trước đó vẫn giữ giá trị cho phần nội dung của nó.',
    ]],
    ['Giải quyết tranh chấp', [
      'Tranh chấp được giải quyết trước hết bằng thương lượng trong 15 ngày. Không thương lượng được thì một bên có quyền yêu cầu Toà án nhân dân có thẩm quyền của Việt Nam giải quyết.',
      intl ? 'Hợp đồng chịu sự điều chỉnh của pháp luật Việt Nam. Điều này không làm mất các quyền bắt buộc của người tiêu dùng mà Bên B có theo pháp luật nơi Bên B cư trú.' : 'Hợp đồng chịu sự điều chỉnh của pháp luật Việt Nam.',
    ]],
    ['Hiệu lực và ngôn ngữ', [
      'Hợp đồng có hiệu lực từ thời điểm Bên B xác nhận trên Cổng dự án đến khi hai bên hoàn thành nghĩa vụ, kể cả thời hạn bảo hành.',
      `Hợp đồng được lập bằng tiếng Việt và tiếng Anh. Khi có khác biệt, bản ${governing} được ưu tiên áp dụng.`,
    ]],
  ];

  return [
    ['Definitions', [
      '“Product” means the website and the items described in Schedule A and Schedule B.',
      '“Deliverable” means the source-code file (.ZIP) Party A uploads to the Project Portal at handover, recorded with its SHA-256 checksum and upload time.',
      '“Project Portal” means the private project page reached through the link Party A gives Party B; all communication, confirmations and logs are kept there.',
      '“Schedules” means Schedules A to F attached, which form an integral part of this Agreement and are updated as the project progresses.',
    ]],
    ['Scope of work', [
      `Party A delivers ${pkg ? `the ${pkg.label} package` : 'the service'} within the scope set out in Schedule A.`,
      project.scopeLockedAt ? `The scope was locked on ${fmtDate(project.scopeLockedAt, lang)}. From then on, the page list and approved design do not change.` : 'The scope is locked when Party A moves the project to the design stage; the time is recorded in Schedule C.',
      'Work outside the scope is done only after it is priced and recorded in Schedule B. There are no charges outside Schedule B.',
    ]],
    ['Contract value and payment', [
      `The contract value at this version is ${money(totals.total)}, made up of the items in Schedule B. Party B has paid ${money(totals.paid)}; the balance is ${money(totals.due)}.`,
      noDeposit ? 'This package requires no deposit. Party B pays in full once, at acceptance, before handover.' : 'Party B pays a 50% deposit of the package price before work starts. The balance is due at acceptance, before handover.',
      'Extras (add-ons, paid revisions) are paid before the work. Monthly care-plan fees are paid in advance for each month.',
      intl ? 'Prices are in US dollars (USD). Exchange differences and bank or payment-provider fees are borne by Party B.' : 'Prices are in Vietnamese dong (VND).',
      'Payment is by bank transfer or payment link. Party A’s website does not take payments; amounts are recorded in Schedule B once Party A confirms receipt.',
      'Third-party costs (domain, hosting, email, payment providers…) are not part of the contract value; taxes on those services depend on each provider.',
    ]],
    ['Timeline', [
      `Expected completion: ${due}. The calculation is shown in the Project Portal.`,
      'Time spent waiting for Party B’s content, feedback or payment does not count towards Party A’s timeline.',
    ]],
    ['Feedback and revisions', [
      'The first two design revisions are included. From the third, each revision is charged at the listed price and recorded in Schedule B with Party B’s request.',
      'For each revision, Party B sends one complete written list naming what should change. Scattered feedback rolls into the next revision.',
      'Spacing, margins and type sizes follow one grid across all screens. Party A does not adjust details to taste on a single device.',
      'The approved design is what gets built. Changes after approval count as an extra revision.',
    ]],
    ['Acceptance and handover', [
      'Party A provides a test version for Party B to accept. Party B responds within 7 days of receipt; Party A sends at least one reminder through the Project Portal before that time runs out. No response within that time counts as acceptance.',
      'Party A hands over the Deliverable through the Project Portal. Its SHA-256 checksum is the reference for warranty claims.',
      pkg?.linkIncluded ? 'This package includes connecting the website to the domain and hosting held in Party B’s name; Party A hands over the live website link.' : 'Connecting the website to Party B’s domain is done through the Link bundle if Party B chooses it.',
    ]],
    ['Warranty', [
      'Warranty starts at handover, for each item as listed in Schedule D. The main package carries a lifetime warranty, meaning for as long as the website runs the exact Deliverable.',
      'Warranty covers only defects caused by Party A in accepted work. Party B reports defects in writing through the Project Portal with a screenshot, device and browser; Party A responds within 1 – 2 working days. Every report is recorded in Schedule D.',
      'Not covered: code modified compared with the Deliverable (the warranty then ends and Party A stops supporting that website, unless Party B uses one-off support); third-party changes; expired domain or hosting; passwords leaked on Party B’s side; content added by Party B or others; new design or feature requests; browsers no longer updated.',
    ]],
    ['Monthly care', [
      'A care plan (if any) renews only when Party A confirms receipt of that month’s fee; nothing is charged automatically. Each month is recorded in Schedule E.',
      'Party B may stop the care plan with one month’s notice through the Project Portal.',
    ]],
    ['Intellectual property', [
      'Once Party B has paid in full, the economic rights in the project’s design, content and source code pass to Party B. The author’s moral rights remain as provided by the Law on Intellectual Property.',
      'Libraries and framework code Party A reuses across projects remain Party A’s; Party B receives a perpetual licence to use them within this project and may not resell or distribute them separately.',
      'Party A shows the project in its portfolio only with Party B’s written consent (a message in the Project Portal counts). Party B may withdraw consent at any time; Party A removes it within 7 days.',
    ]],
    ['Confidentiality and personal data', [
      'Party B is the controller of personal data collected by the website and is responsible for the website’s privacy policy.',
      'Party A accesses data only to fix defects at Party B’s request and does not keep Party B’s account passwords.',
      'To perform and evidence this Agreement, Party A processes the information Party B provides (name, email, phone number, messages) and the details recorded on confirmation (IP address, browser). It is kept while the Agreement is in force and for 3 years after it ends, and is not sold or shared unless the law requires. Party B may access, correct and request deletion under the Law on Personal Data Protection, except where the law requires retention.',
    ]],
    ['Termination', [
      'Party B may stop the Agreement at any time. Work done is handed over in proportion to the amount paid; deposits are not refunded.',
      'Party A may terminate the Agreement unilaterally (Article 428, Civil Code) if Party B: (a) is more than 15 days late with a payment; (b) uses the Product for unlawful content or purposes; (c) gave false information to enter into the Agreement; (d) insults, threatens or harasses Party A, as shown by messages or records; (e) copies or resells Party A’s shared framework code; (f) deliberately accesses Party A’s systems or accounts without authorisation.',
      'Termination under the clause above takes effect as soon as Party A sends notice by email and through the Project Portal, without prior notice; the Agreement is not extended or reinstated.',
      'On termination, Party A stops work and care; any amounts Party B owes remain payable. Items paid in full and handed over before termination keep their warranty under Article 7, unless termination is for reason (b), (e) or (f).',
      'Records in the Project Portal (logs, messages, the Deliverable) are evidence for both parties; both parties accept their evidential value under the Law on Electronic Transactions.',
      'Party B may respond to or dispute the termination by email within 15 days; Party A replies in writing. This does not limit Party B’s right to go to court.',
    ]],
    ['Electronic execution', [
      'Party B’s confirmation in the Project Portal executes this Agreement electronically. The system records the version, time, IP address and browser in Schedule F.',
      'Each new version (new add-ons, paid revisions, discounts…) requires Party B’s confirmation; earlier confirmed versions remain valid for their content.',
    ]],
    ['Disputes and governing law', [
      'Disputes are first settled by negotiation within 15 days. Failing that, either party may bring the dispute before a competent People’s Court of Vietnam.',
      intl ? 'This Agreement is governed by the laws of Vietnam. Nothing in it removes mandatory consumer rights Party B has under the law of the country where Party B lives.' : 'This Agreement is governed by the laws of Vietnam.',
    ]],
    ['Effect and language', [
      'This Agreement takes effect when Party B confirms it in the Project Portal and lasts until both parties have fulfilled their obligations, including the warranty period.',
      `This Agreement is made in Vietnamese and English. In case of difference, the ${governing} version prevails.`,
    ]],
  ];
}

const REFERENCES = {
  vi: (date) => [
    `Hugo Studio (2026) Bảng giá và điều khoản dịch vụ. Có tại: ${STUDIO_PARTY.website}/services (Truy cập: ${date}).`,
    'Quốc hội (2005) Luật Sở hữu trí tuệ, Luật số 50/2005/QH11, sửa đổi, bổ sung bởi Luật số 07/2022/QH15. Hà Nội: Quốc hội.',
    'Quốc hội (2015) Bộ luật Dân sự, Luật số 91/2015/QH13. Hà Nội: Quốc hội.',
    'Quốc hội (2023) Luật Bảo vệ quyền lợi người tiêu dùng, Luật số 19/2023/QH15. Hà Nội: Quốc hội.',
    'Quốc hội (2023) Luật Giao dịch điện tử, Luật số 20/2023/QH15. Hà Nội: Quốc hội.',
    'Quốc hội (2025) Luật Bảo vệ dữ liệu cá nhân, Luật số 91/2025/QH15. Hà Nội: Quốc hội.',
  ],
  en: (date) => [
    `Hugo Studio (2026) Service pricing and terms. Available at: ${STUDIO_PARTY.website}/en/services (Accessed: ${date}).`,
    'National Assembly of Vietnam (2005) Law on Intellectual Property, Law No. 50/2005/QH11, as amended by Law No. 07/2022/QH15. Hanoi: National Assembly.',
    'National Assembly of Vietnam (2015) Civil Code, Law No. 91/2015/QH13. Hanoi: National Assembly.',
    'National Assembly of Vietnam (2023) Law on Electronic Transactions, Law No. 20/2023/QH15. Hanoi: National Assembly.',
    'National Assembly of Vietnam (2023) Law on Protection of Consumer Rights, Law No. 19/2023/QH15. Hanoi: National Assembly.',
    'National Assembly of Vietnam (2025) Law on Personal Data Protection, Law No. 91/2025/QH15. Hanoi: National Assembly.',
  ],
};

/**
 * Điều 11: chấm dứt thì dừng việc và duy trì, nhưng phần đã trả đủ và đã bàn
 * giao vẫn được bảo hành — trừ khi chấm dứt vì (b) vi phạm pháp luật, (e) sao
 * chép khung mã, (f) truy cập trái phép. Cắt bảo hành của phần khách đã trả đủ
 * vì lý do khác dễ thành điều khoản loại trừ trách nhiệm (Luật BVQLNTD 2023).
 */
export function warrantyActive(project) {
  if (!project.warranty?.startsAt) return false;
  if (project.status !== 'terminated') return project.status !== 'cancelled';
  if (/\((b|e|f)\)/.test(project.termination?.clause || '')) return false;
  return ledgerTotals(project).due <= 0;
}

/** Ngôn ngữ hợp đồng cho người xem: vi (cả chữ Nôm) → vi, còn lại → en. */
export const contractLangFor = (uiLang) => (['vi', 'nom'].includes(String(uiLang || '').split('-')[0]) ? 'vi' : 'en');

/**
 * Dựng toàn bộ hợp đồng. Trả dữ liệu có cấu trúc (không phải HTML) để trang
 * quản trị, cổng khách và bản in dùng chung một bố cục.
 */
export function buildContract(project, { lang = 'vi', now = new Date() } = {}) {
  const t = L[lang] || L.vi;
  const totals = ledgerTotals(project);
  const money = (n) => formatMoney(n, totals.currency);
  const ledger = (project.ledger || []);
  const c = project.contract || {};

  const ledgerRows = ledger.map((e) => [
    fmtDate(e.at, lang),
    t.kinds[e.kind] || e.kind,
    `${e.title}${e.quantity > 1 ? ` × ${e.quantity}` : ''}${e.voided ? ` (${t.voided}${e.voidReason ? `: ${e.voidReason}` : ''})` : e.pending ? ` (${t.pending})` : ''}`,
    e.detail || '—',
    e.kind === 'payment' || e.kind === 'adjustment' ? '—' : money(e.amount),
    e.kind === 'payment' || e.kind === 'adjustment' ? '—' : (e.free ? t.free : (e.discount ? money(-e.discount) : '—')),
    e.kind === 'payment' ? money(-e.amount) : (e.voided ? '—' : money(effectiveAmount(e))),
  ]);

  const warranty = warrantyItems(project).map((w) => [
    w.title + (w.contentEditUntil ? (lang === 'vi' ? ` (đổi chữ, ảnh tới ${fmtDate(w.contentEditUntil, lang, false)})` : ` (copy changes until ${fmtDate(w.contentEditUntil, lang, false)})`) : ''),
    fmtDate(w.startsAt, lang),
    w.lifetime ? t.lifetime : w.subscription ? t.subscription : fmtDate(w.endsAt, lang),
  ]);

  const maint = project.maintenance || {};
  const maintRows = ledger.filter((e) => e.kind === 'maintenance' && !e.voided)
    .map((e) => [e.period || '—', fmtDate(e.at, lang), money(effectiveAmount(e)), e.detail || '—']);

  return {
    lang,
    title: t.title,
    meta: [
      [t.no, `${project.projectId}/${lang === 'vi' ? 'HĐDV' : 'SA'}`],
      [t.version, String(c.version || 0)],
      [t.date, fmtDate(c.updatedAt || project.createdAt || now, lang, false)],
      [t.status, lang === 'vi' ? (PROJECT_STATUSES[project.status]?.label || project.status) : project.status],
    ],
    parties: [
      { heading: t.partyA, rows: [[t.name, STUDIO_PARTY.brand], [t.rep, STUDIO_PARTY.representative], [t.email, STUDIO_PARTY.email], [t.web, STUDIO_PARTY.website]] },
      { heading: t.partyB, rows: [[t.name, project.customer?.fullName || project.name || '—'], ...(project.customer?.orgName ? [[t.org, project.customer.orgName]] : []), [t.email, project.customer?.email || '—'], [t.phone, project.customer?.phone || '—']] },
    ],
    bases: { heading: t.bases, items: t.basesList },
    articles: articles(project, lang, t, totals).map(([title, paras], i) => ({ no: i + 1, title, paras })),
    schedules: [
      { id: 'A', title: lang === 'vi' ? 'Phụ lục A — Phạm vi công việc' : 'Schedule A — Scope of work', columns: t.cols.scope, ...scheduleA(project, lang) },
      { id: 'B', title: lang === 'vi' ? 'Phụ lục B — Bảng kê chi phí' : 'Schedule B — Statement of charges', columns: t.cols.ledger, rows: ledgerRows,
        totals: [[t.totals.total, money(totals.total)], [t.totals.revisions, money(totals.paidRevisions)], [t.totals.savings, money(totals.savings)], [t.totals.paid, money(totals.paid)], [t.totals.due, money(totals.due)]] },
      { id: 'C', title: lang === 'vi' ? 'Phụ lục C — Nhật ký thực hiện' : 'Schedule C — Project log', columns: t.cols.history,
        rows: (project.history || []).map((h) => [fmtDate(h.at, lang), t.actors[h.actor] || h.actor, h.fromStatus || '—', h.toStatus || '—', [h.action, h.note].filter(Boolean).join(' — ')]),
        sub: { columns: t.cols.worklog, rows: (project.worklog || []).map((w) => [fmtDate(w.at, lang), t.phases[w.phase] || w.phase, w.title, w.detail || '—']) } },
      { id: 'D', title: lang === 'vi' ? 'Phụ lục D — Phiếu bảo hành' : 'Schedule D — Warranty card', columns: t.cols.warranty, rows: warranty,
        facts: [[lang === 'vi' ? 'Bàn giao lúc' : 'Handed over', fmtDate(project.warranty?.startsAt, lang)], ['SHA-256', project.warranty?.checksum || project.sourceDelivery?.checksum || '—']],
        sub: { columns: t.cols.claims, rows: (project.warranty?.claims || []).map((k) => [k.code, fmtDate(k.reportedAt, lang), t.actors[k.reportedBy === 'admin' ? 'admin' : 'customer'], k.description,
          k.status === 'open' ? (lang === 'vi' ? 'Đang xử lý' : 'Open') : (k.resolution || (k.status === 'fixed' ? (lang === 'vi' ? 'Đã sửa' : 'Fixed') : (lang === 'vi' ? 'Từ chối' : 'Declined'))),
          k.covered === null ? '—' : (k.covered ? t.yes : t.no2), fmtDate(k.resolvedAt, lang)]) } },
      { id: 'E', title: lang === 'vi' ? 'Phụ lục E — Duy trì hằng tháng' : 'Schedule E — Monthly care', columns: lang === 'vi' ? ['Tháng', 'Xác nhận lúc', 'Số tiền', 'Ghi chú'] : ['Month', 'Confirmed', 'Amount', 'Note'], rows: maintRows,
        facts: [[lang === 'vi' ? 'Trạng thái' : 'Status', maint.active ? (lang === 'vi' ? 'Đang dùng' : 'Active') : (lang === 'vi' ? 'Không dùng' : 'Not active')], [lang === 'vi' ? 'Đã trả tới' : 'Paid through', fmtDate(maint.paidThrough, lang, false)]] },
      { id: 'F', title: lang === 'vi' ? 'Phụ lục F — Phiên bản và xác nhận' : 'Schedule F — Versions and confirmation', columns: t.cols.versions,
        rows: (c.changes || []).map((v) => [String(v.version), fmtDate(v.at, lang), v.reason]),
        facts: [[lang === 'vi' ? 'Bên B xác nhận phiên bản' : 'Version confirmed by Party B', c.acceptedVersion ? String(c.acceptedVersion) : '—'],
          [lang === 'vi' ? 'Người xác nhận' : 'Confirmed by', c.acceptedName || '—'], [lang === 'vi' ? 'Thời điểm' : 'Time', fmtDate(c.acceptedAt, lang)],
          ['IP', c.acceptedIp || '—'], [lang === 'vi' ? 'Trình duyệt' : 'Browser', c.acceptedUserAgent || '—']] },
    ],
    termination: project.termination?.at ? {
      heading: lang === 'vi' ? 'THÔNG BÁO CHẤM DỨT HỢP ĐỒNG' : 'NOTICE OF TERMINATION',
      rows: [[lang === 'vi' ? 'Thời điểm có hiệu lực' : 'Effective', fmtDate(project.termination.at, lang)], [lang === 'vi' ? 'Căn cứ' : 'Clause', project.termination.clause], [lang === 'vi' ? 'Lý do' : 'Reason', project.termination.reason]],
    } : null,
    references: { heading: lang === 'vi' ? 'TÀI LIỆU THAM CHIẾU' : 'REFERENCES', items: REFERENCES[lang](fmtDate(now, lang, false)) },
    totals,
    needsAcceptance: (c.version || 0) > (c.acceptedVersion || 0),
  };
}
