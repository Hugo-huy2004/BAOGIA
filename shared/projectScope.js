/**
 * Bản PHẠM VI CÔNG VIỆC (scope statement) — sản phẩm chính của giai đoạn Phân
 * tích. Phiếu yêu cầu là lời khách kể; bản phạm vi là thứ hai bên KÝ: mục tiêu
 * đo được, từng trang làm gì, từng tính năng thế nào là "xong", cái gì KHÔNG làm.
 *
 * Ba việc của BA nằm ở đây:
 *   1. draftScope()      — dựng bản nháp từ phiếu, để admin sửa chứ không viết từ số 0.
 *   2. openQuestions()   — phân tích chỗ hổng: câu trả lời thiếu / mơ hồ thành câu
 *                          hỏi gửi lại khách. Câu hỏi soạn theo tâm lý mua hàng
 *                          (JTBD, nỗi lo trước khi mua, tư duy đảo ngược) và đo
 *                          lường (con số hiện tại → mục tiêu → đo bằng sự kiện nào).
 *   3. scopeCompleteness() — cổng chốt phạm vi chỉ mở khi bản này đủ 100%.
 *
 * Phụ lục A của hợp đồng in chính bản này; backlog Scrum lấy tiêu chí nghiệm
 * thu của nó làm "định nghĩa xong" cho từng việc.
 */

// Sự kiện đo lường cho hành động chính, đặt tên object_action (chuẩn GA4).
export const GOAL_EVENTS = {
  'Nhận liên hệ / khách để lại thông tin': { event: 'form_submitted', label: 'Số lượt gửi form liên hệ' },
  'Bán hàng trực tuyến': { event: 'order_completed', label: 'Số đơn hoàn tất' },
  'Giới thiệu năng lực, tạo uy tín': { event: 'contact_clicked', label: 'Số lượt bấm liên hệ (gọi, Zalo, email)' },
  'Nhận đặt lịch / đặt bàn': { event: 'booking_completed', label: 'Số lượt đặt lịch thành công' },
  'Làm hồ sơ cá nhân, portfolio': { event: 'contact_clicked', label: 'Số lượt bấm liên hệ' },
  'Ra mắt một chiến dịch': { event: 'cta_clicked', label: 'Số lượt bấm nút chính của chiến dịch' },
};

const PAGE_PURPOSE = {
  'Trang chủ': 'Trong 5 giây nói rõ bạn là ai, khác gì, và dẫn tới hành động chính.',
  'Giới thiệu': 'Tạo niềm tin: câu chuyện, con người, bằng chứng.',
  'Dịch vụ': 'Mỗi dịch vụ: giải quyết vấn đề gì, cho ai, bước tiếp theo.',
  'Bảng giá': 'Giá rõ ràng, trả lời trước câu "có phát sinh không".',
  'Sản phẩm': 'Trình bày sản phẩm đủ để khách quyết định, dẫn tới đặt / mua.',
  'Thực đơn': 'Món, giá, ảnh thật; dẫn tới đặt bàn / gọi món.',
  'Dự án / Bộ sưu tập': 'Bằng chứng năng lực: việc đã làm, kết quả.',
  'Tin tức': 'Cập nhật để khách thấy doanh nghiệp đang hoạt động.',
  'Hỏi đáp': 'Gỡ những điều khách do dự trước khi liên hệ.',
  'Liên hệ': 'Mọi cách liên hệ trong một chạm; bản đồ nếu có địa chỉ.',
  'Tuyển dụng': 'Vị trí đang tuyển và cách ứng tuyển.',
  'Trang đích (landing page)': 'Một thông điệp, một hành động: dẫn khách từ quảng cáo tới nút chính.',
};

const FEATURE_ACCEPTANCE = {
  'Form liên hệ': 'Gửi thử 3 lần trên điện thoại và máy tính, thư về đủ trong 1 phút, có chống thư rác.',
  'Bản đồ chỉ đường': 'Hiện đúng vị trí; bấm "Chỉ đường" mở Google Maps.',
  'Chat Zalo/Messenger': 'Nút mở đúng tài khoản Zalo / Messenger của khách trên điện thoại.',
  'Đặt lịch hẹn': 'Chọn được ngày giờ còn trống; khách và chủ đều nhận email xác nhận.',
  'Giỏ hàng và thanh toán': 'Thêm, bớt món trong giỏ; đơn thử đi đủ tới bước thanh toán.',
  'Tài khoản khách hàng': 'Đăng ký, đăng nhập, xem lại đơn cũ.',
  'Tự đăng bài viết': 'Đăng một bài thử, bài hiện đúng trên web.',
  'Đa ngôn ngữ': 'Nút đổi ngôn ngữ trên mọi trang; mỗi ngôn ngữ đủ nội dung khách gửi.',
  'Tìm kiếm': 'Gõ tên sản phẩm / bài viết có thật thì ra đúng kết quả.',
  'Đánh giá của khách': 'Hiện đánh giá thật khách cung cấp, có tên hoặc ẩn tên theo đồng ý.',
  'Theo dõi quảng cáo': 'Sự kiện chuyển đổi ghi nhận trong công cụ đo khi bấm thử.',
};

const DEFAULT_OUT_OF_SCOPE = [
  'Viết mới toàn bộ nội dung, thiết kế logo, chụp ảnh.',
  'Tên miền, hosting và phí dịch vụ bên thứ ba (khách đứng tên, tự trả).',
  'Tính năng không có trong danh sách tính năng dưới đây.',
];

const page = (name, r) => ({
  name,
  purpose: PAGE_PURPOSE[name] || '',
  primaryAction: r.visitorAction || '',
  acceptance: 'Hiển thị đúng trên điện thoại và máy tính; nút hành động chính hoạt động; nội dung đúng bản khách duyệt.',
});

/** Dựng bản nháp phạm vi từ phiếu yêu cầu. Admin sửa lại, không viết từ số 0. */
export function draftScope(project) {
  const r = project.requirements || {};
  const goal = GOAL_EVENTS[r.primaryGoal];
  const pages = Array.isArray(r.pages) && r.pages.length
    ? r.pages
    : project.packageId === 'hugo-one' ? ['Trang đích (landing page)'] : ['Trang chủ', 'Giới thiệu', 'Dịch vụ', 'Liên hệ'];
  const features = [];
  const f = r.features && typeof r.features === 'object' ? r.features : {};
  for (const moscow of ['must', 'should', 'could']) {
    for (const name of f[moscow] || []) features.push({ name, moscow, acceptance: FEATURE_ACCEPTANCE[name] || '' });
  }
  if (!features.some((x) => x.name === 'Form liên hệ')) features.push({ name: 'Form liên hệ', moscow: 'must', acceptance: FEATURE_ACCEPTANCE['Form liên hệ'] });
  const sources = Array.isArray(r.trafficSources) ? r.trafficSources : [];
  const assumptions = [];
  if (r.copySource) assumptions.push(`Nội dung chữ: ${r.copySource}${r.contentReady ? ` — gửi ${r.contentReady}` : ''}.`);
  if (r.photoSource) assumptions.push(`Hình ảnh: ${r.photoSource}.`);
  assumptions.push('Thời gian chờ khách gửi nội dung, phản hồi, thanh toán không tính vào tiến độ.');
  const risks = [];
  if (r.deadline) risks.push(`Khách cần xong trước ${r.deadline}${r.deadlineReason ? ` (${r.deadlineReason})` : ''} — kiểm tra với ngày dự kiến trước khi chốt.`);
  if ((f.must || []).length > 4) risks.push('Nhiều tính năng Bắt buộc — dễ trễ hạn; cân nhắc dời bớt sang "Nên có".');
  if (Array.isArray(r.integrations) && r.integrations.length) risks.push(`Tích hợp bên thứ ba (${r.integrations.join(', ')}) phụ thuộc thời gian duyệt của nhà cung cấp.`);
  if (!r.contentReady) risks.push('Chưa có mốc gửi nội dung — lý do trễ hạn phổ biến nhất.');

  return {
    objective: [r.primaryGoal, r.visitorAction].filter(Boolean).join(': '),
    kpis: [{
      metric: goal?.label || 'Hành động chính của khách trên web',
      baseline: r.baselineMetric || '',
      target: r.successMetric || '',
      measure: goal ? `Sự kiện ${goal.event} trong ${r.trackingNow && r.trackingNow !== 'Chưa có' ? r.trackingNow : 'Google Analytics 4'}` : '',
    }],
    persona: [r.audience, r.buyingTrigger && `Quyết định khi: ${r.buyingTrigger}`, r.objections && `Do dự vì: ${r.objections}`].filter(Boolean).join('\n'),
    journey: sources.length || r.visitorAction ? `${sources.length ? sources.join(', ') : '(nguồn khách)'} → ${pages[0]} → ${r.visitorAction || '(hành động chính)'}` : '',
    pages: pages.map((name) => page(name, r)),
    features,
    outOfScope: [...(f.wont || []).map((x) => `${x} (khách chọn "Lần này không cần").`), ...DEFAULT_OUT_OF_SCOPE],
    assumptions,
    risks,
    answers: {},
  };
}

/**
 * Phân tích chỗ hổng — mỗi câu hỏi có `id` cố định để lưu câu trả lời. Câu hỏi
 * chỉ hiện khi phiếu thiếu hoặc mơ hồ; trả lời xong thì hết cảnh báo.
 */
export function openQuestions(project) {
  const r = project.requirements || {};
  const s = project.scope || {};
  const answers = s.answers || {};
  const qs = [];
  const ask = (id, q, why, en) => { if (!answers[id]) qs.push({ id, q, why, en }); };
  const vague = (t) => !t || String(t).trim().length < 12;
  if (vague(r.audience)) ask('audience', 'Khách hàng chính của Quý khách là ai (tuổi, nghề, ở đâu), và họ đang gặp khó khăn gì?', 'Không biết nói với ai thì trang đầu không giữ được ai.', 'Who are your main customers (age, job, location), and what problem are they facing?');
  if (vague(r.buyingTrigger)) ask('trigger', 'Điều gì khiến một khách hàng quyết định mua / đặt NGAY, thay vì để hôm khác?', 'Đây là thông điệp màn hình đầu.', 'What makes a customer decide to buy or book NOW rather than later?');
  if (vague(r.objections)) ask('objections', 'Trước khi mua, khách thường hỏi lại hoặc lo ngại điều gì nhất?', 'Mỗi nỗi lo cần một câu trả lời trên web: hỏi đáp, bảo hành, đánh giá.', 'Before buying, what do customers most often ask about or worry about?');
  if (!r.visitorAction || !/(bấm|gọi|nhắn|đặt|gửi|mua|đăng ký|điền|tải|liên hệ)/i.test(r.visitorAction)) ask('action', 'Khi vào web, Quý khách muốn khách làm đúng MỘT hành động nào (bấm gọi, nhắn Zalo, đặt lịch, gửi form…)?', 'Hành động mơ hồ thì không đo được và không thiết kế được nút chính.', 'When people visit the website, which ONE action should they take (call, message, book, send a form…)?');
  if (!r.baselineMetric) ask('baseline', 'Hiện mỗi tháng Quý khách nhận khoảng bao nhiêu liên hệ / đơn / lượt đặt (ước lượng cũng được)?', 'Không có con số hiện tại thì không biết web có làm tốt hơn không.', 'Roughly how many enquiries, orders or bookings do you get each month today? An estimate is fine.');
  if (!r.successMetric || !/\d/.test(r.successMetric)) ask('target', 'Sau 3 tháng, con số nào chứng minh website thành công (ví dụ 20 lượt đặt lịch mỗi tháng)?', 'Mục tiêu có con số mới đặt được sự kiện đo lường.', 'Three months after launch, which number would prove the website works (for example, 20 bookings a month)?');
  if (vague(r.failureCase)) ask('failure', 'Nếu ra mắt xong mà website KHÔNG làm được điều gì, Quý khách sẽ coi là thất bại?', 'Biết điều tối kỵ thì biết cái gì phải làm trước.', 'After launch, what would the website have to fail at for you to call it a failure?');
  if (!Array.isArray(r.trafficSources) || !r.trafficSources.length) ask('sources', 'Khách thường biết tới Quý khách từ đâu (Facebook, Google Maps, người quen giới thiệu…)?', 'Nguồn khách quyết định trang đầu vào và chỗ đặt đo lường.', 'Where do customers usually find you (Facebook, Google Maps, referrals…)?');
  if (!Array.isArray(r.pages) || !r.pages.length) ask('pages', 'Website cần những trang nào? Mỗi trang để làm gì?', 'Danh sách trang là phần chốt giá.', 'Which pages does the website need, and what is each page for?');
  if (!r.features?.must?.length) ask('must', 'Tính năng nào nếu thiếu thì website coi như không dùng được?', 'Phân biệt Bắt buộc với Có thì tốt để không trễ hạn.', 'Which features would make the website unusable if they were missing?');
  if (!r.contentReady) ask('content', 'Khi nào Quý khách gửi đủ chữ và ảnh cho website?', 'Nội dung trễ là lý do trễ hạn phổ biến nhất.', 'When will you send all the text and images for the website?');
  if (r.deadline && !r.deadlineReason) ask('deadline', `Vì sao cần xong trước ${r.deadline}? Có sự kiện nào gắn với mốc đó không?`, 'Biết lý do để ưu tiên đúng phần phải kịp.', `Why does it need to be ready by ${r.deadline}? Is there an event tied to that date?`);
  return qs;
}

const filled = (v) => v !== undefined && v !== null && String(v).trim().length > 0;

/** Bản phạm vi đủ để chốt chưa. `missing` là danh sách việc còn thiếu, đọc được. */
export function scopeCompleteness(project) {
  const s = project.scope;
  if (!s || !s.savedAt) return { percent: 0, missing: ['Chưa lưu bản phạm vi — bấm "Tạo bản nháp từ phiếu" rồi chỉnh và lưu.'] };
  const checks = [
    [filled(s.objective), 'Mục tiêu dự án'],
    [(s.kpis || []).some((k) => filled(k.metric) && filled(k.target) && filled(k.measure)), 'Ít nhất một KPI có mục tiêu và cách đo'],
    [filled(s.persona), 'Chân dung khách hàng'],
    [(s.pages || []).length > 0, 'Danh sách trang'],
    [(s.pages || []).every((p) => filled(p.purpose) && filled(p.primaryAction) && filled(p.acceptance)), 'Mỗi trang có mục đích, hành động chính, tiêu chí nghiệm thu'],
    [(s.features || []).filter((f) => f.moscow === 'must').every((f) => filled(f.acceptance)), 'Mỗi tính năng Bắt buộc có tiêu chí nghiệm thu'],
    [(s.outOfScope || []).length > 0, 'Danh sách những gì KHÔNG làm'],
    [openQuestions(project).length === 0, 'Trả lời hết câu hỏi còn mơ hồ'],
  ];
  const done = checks.filter(([ok]) => ok).length;
  return { percent: Math.round((done / checks.length) * 100), missing: checks.filter(([ok]) => !ok).map(([, label]) => label) };
}

/** Mã câu hỏi hợp lệ — máy chủ chỉ nhận câu trả lời cho những mã này. */
export const QUESTION_IDS = ['audience', 'trigger', 'objections', 'action', 'baseline', 'target', 'failure', 'sources', 'pages', 'must', 'content', 'deadline'];

export const MOSCOW_VI = { must: 'Bắt buộc', should: 'Nên có', could: 'Có thì tốt' };
