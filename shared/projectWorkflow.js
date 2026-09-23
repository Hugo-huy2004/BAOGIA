/**
 * Quy trình dự án khách hàng — NGUỒN DUY NHẤT cho cả server lẫn giao diện.
 *
 * Gồm bốn thứ, cố ý để chung một tệp vì chúng phải khớp nhau từng chữ:
 *   1. Lược đồ MÃ DỰ ÁN — nhìn mã là biết dự án mở tháng nào.
 *   2. MÁY TRẠNG THÁI — trạng thái nào đi được sang trạng thái nào, và bước nào
 *      thì gửi thư cho khách.
 *   3. BỘ CÂU HỎI YÊU CẦU — form khách điền.
 *   4. CÔNG THỨC ƯỚC LƯỢNG — từ gói + yêu cầu ra số ngày dự kiến.
 *
 * Server đọc để kiểm tra và tính; giao diện đọc để dựng form và hiện nhãn. Tách
 * đôi thì sớm muộn máy chủ cho phép một bước mà màn hình không vẽ, hoặc ngược lại.
 */

// ── 1. MÃ DỰ ÁN ──────────────────────────────────────────────────────────────
/**
 * Dạng `HG-YYMM-NNN`, ví dụ `HG-2609-007`:
 *   HG   — Hugo Studio (cố định, để mã không lẫn với mã của bên khác)
 *   26   — hai số cuối của năm
 *   09   — tháng
 *   007  — số thứ tự TRONG THÁNG đó, đếm lại từ 001 mỗi tháng
 *
 * Nhìn `HG-2609-007` là biết ngay: dự án thứ 7 mở trong tháng 9/2026. Đây là mã
 * để NGƯỜI đọc và trao đổi; nó KHÔNG phải mã đăng nhập — mã đăng nhập phải khó
 * đoán, còn mã này thì cố tình đoán được.
 */
export const PROJECT_ID_PREFIX = 'HG';
export const PROJECT_ID_PATTERN = /^HG-\d{4}-\d{3}$/;

export function projectIdPeriod(date = new Date()) {
  const yy = String(date.getFullYear() % 100).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${yy}${mm}`;
}

export function formatProjectId(period, sequence) {
  return `${PROJECT_ID_PREFIX}-${period}-${String(sequence).padStart(3, '0')}`;
}

/** Đọc ngược mã ra tháng mở dự án. Trả null nếu mã sai dạng. */
export function parseProjectId(id) {
  if (!PROJECT_ID_PATTERN.test(String(id || ''))) return null;
  const [, period, seq] = String(id).split('-');
  const year = 2000 + Number(period.slice(0, 2));
  const month = Number(period.slice(2, 4));
  if (month < 1 || month > 12) return null;
  return { year, month, sequence: Number(seq), label: `${String(month).padStart(2, '0')}/${year}` };
}

// ── 2. MÁY TRẠNG THÁI ────────────────────────────────────────────────────────
/**
 * Mỗi trạng thái khai báo:
 *   label     — chữ hiện cho KHÁCH (không dùng từ nội bộ như "sprint", "backlog")
 *   adminLabel— chữ hiện cho admin
 *   blurb     — một câu giải thích khách đang ở đâu và chờ gì
 *   next      — những trạng thái đi tiếp hợp lệ
 *   notify    — có gửi thư cho khách khi bước vào trạng thái này không
 *   customer  — khách có nhìn thấy trạng thái này trên trang của họ không
 *
 * `next` là hàng rào thật: mọi thay đổi trạng thái đều phải đi qua
 * `canTransition()`. Không có nó thì một thao tác nhầm đưa dự án từ "chờ khách
 * điền" thẳng sang "đã bàn giao", và thư báo bàn giao bay tới khách.
 */
export const PROJECT_STATUSES = {
  draft: {
    label: 'Đang chuẩn bị',
    adminLabel: 'Nháp — chưa gửi form',
    blurb: 'Hugo Studio đang mở hồ sơ dự án.',
    next: ['awaiting_requirements', 'cancelled'],
    notify: false,
    customer: false,
  },
  awaiting_requirements: {
    label: 'Chờ bạn gửi yêu cầu',
    adminLabel: 'Đã gửi form — chờ khách điền',
    blurb: 'Bạn hãy điền phiếu yêu cầu để Hugo Studio hiểu đúng thứ bạn cần.',
    next: ['requirements_submitted', 'cancelled'],
    notify: true,
    customer: true,
  },
  requirements_submitted: {
    label: 'Đã nhận yêu cầu',
    adminLabel: 'Khách đã nộp — chờ đọc',
    blurb: 'Hugo Studio đã nhận phiếu yêu cầu của bạn và đang đọc.',
    next: ['in_review', 'awaiting_requirements', 'cancelled'],
    notify: true,
    customer: true,
  },
  in_review: {
    label: 'Đang xem xét và báo giá',
    adminLabel: 'Đang xem xét — chốt phạm vi',
    blurb: 'Hugo Studio đang chốt phạm vi công việc và chuẩn bị báo giá.',
    next: ['design', 'awaiting_requirements', 'cancelled'],
    notify: true,
    customer: true,
  },
  design: {
    // Đây là MỐC CHỐT: bước vào đây thì phạm vi khoá lại và hệ thống tính ngày
    // dự kiến hoàn thành.
    label: 'Đang thiết kế',
    adminLabel: 'Đã chốt thiết kế — phạm vi khoá',
    blurb: 'Phạm vi đã chốt. Hugo Studio đang dựng bản thiết kế.',
    next: ['build', 'in_review', 'cancelled'],
    notify: true,
    customer: true,
    locksScope: true,
    startsEstimate: true,
  },
  build: {
    label: 'Đang phát triển',
    adminLabel: 'Đang phát triển — chạy sprint',
    blurb: 'Bản thiết kế đang được dựng thành website chạy thật.',
    next: ['client_review', 'design', 'cancelled'],
    notify: true,
    customer: true,
  },
  client_review: {
    label: 'Chờ bạn nghiệm thu',
    adminLabel: 'Đã gửi khách nghiệm thu',
    blurb: 'Bản chạy thử đã sẵn sàng. Bạn xem và cho Hugo Studio biết cần sửa gì.',
    next: ['revision', 'delivery', 'cancelled'],
    notify: true,
    customer: true,
  },
  revision: {
    label: 'Đang chỉnh theo góp ý',
    adminLabel: 'Đang chỉnh — vòng sửa',
    blurb: 'Hugo Studio đang chỉnh theo góp ý của bạn.',
    next: ['client_review', 'delivery', 'cancelled'],
    notify: true,
    customer: true,
  },
  delivery: {
    label: 'Đang bàn giao',
    adminLabel: 'Bàn giao — nộp mã nguồn',
    blurb: 'Hugo Studio đang bàn giao mã nguồn và tài liệu cho bạn.',
    next: ['addons', 'revision'],
    notify: true,
    customer: true,
    requiresSourceZip: true,
  },
  addons: {
    label: 'Chọn dịch vụ đi kèm',
    adminLabel: 'Chờ khách chọn dịch vụ kèm',
    blurb: 'Dự án đã bàn giao. Bạn có thể chọn thêm dịch vụ đi kèm, hoặc bỏ qua.',
    next: ['feedback'],
    notify: true,
    customer: true,
  },
  feedback: {
    label: 'Mời bạn đánh giá',
    adminLabel: 'Chờ khách đánh giá',
    blurb: 'Bạn dành vài phút cho Hugo Studio biết cảm nhận nhé.',
    next: ['closed'],
    notify: true,
    customer: true,
  },
  closed: {
    label: 'Đã hoàn tất',
    adminLabel: 'Đã đóng',
    blurb: 'Dự án đã hoàn tất. Cảm ơn bạn.',
    next: [],
    notify: true,
    customer: true,
  },
  cancelled: {
    label: 'Đã dừng',
    adminLabel: 'Đã huỷ',
    blurb: 'Dự án đã dừng lại.',
    next: [],
    notify: true,
    customer: true,
  },
};

export const PROJECT_STATUS_ORDER = [
  'draft', 'awaiting_requirements', 'requirements_submitted', 'in_review',
  'design', 'build', 'client_review', 'revision', 'delivery', 'addons',
  'feedback', 'closed',
];

export const isValidStatus = (s) => Object.hasOwn(PROJECT_STATUSES, s);

export function canTransition(from, to) {
  if (!isValidStatus(from) || !isValidStatus(to)) return false;
  return PROJECT_STATUSES[from].next.includes(to);
}

/** Phần trăm tiến độ để vẽ thanh cho khách. "Đã dừng" không có tiến độ. */
export function progressPercent(status) {
  if (status === 'cancelled') return 0;
  const i = PROJECT_STATUS_ORDER.indexOf(status);
  if (i === -1) return 0;
  return Math.round((i / (PROJECT_STATUS_ORDER.length - 1)) * 100);
}

// ── 3. BỘ CÂU HỎI YÊU CẦU ────────────────────────────────────────────────────
/**
 * Soạn theo lối thu thập yêu cầu tiêu chuẩn (elicitation), gom thành 8 nhóm đi
 * từ BỐI CẢNH → MỤC TIÊU → PHẠM VI → HÌNH THỨC → KỸ THUẬT → RÀNG BUỘC. Thứ tự
 * này có lý do: hỏi "bạn thích màu gì" trước khi biết khách của họ là ai thì
 * nhận được sở thích cá nhân, không phải yêu cầu của dự án.
 *
 * Mỗi trường có:
 *   help    — hướng dẫn NGẮN ngay dưới ô nhập, luôn hiện (không giấu sau dấu ?)
 *   hint    — câu tư vấn tự động, hiện khi người ta chần chừ hoặc bỏ trống
 *   example — ví dụ điền mẫu, bấm là chèn vào
 *   moscow  — trường thuộc nhóm tính năng thì cho phân loại theo MoSCoW
 *
 * `required` cố ý RẤT ÍT. Form dài mà bắt buộc mọi ô thì người ta bỏ giữa chừng;
 * thà nhận phiếu điền 70% rồi hỏi tiếp còn hơn không nhận được gì.
 */
export const REQUIREMENT_SECTIONS = [
  {
    id: 'contact',
    title: 'Bạn là ai',
    intro: 'Để Hugo Studio biết liên hệ với ai và xưng hô thế nào.',
    fields: [
      { id: 'fullName', label: 'Họ và tên', type: 'text', required: true,
        help: 'Tên bạn muốn Hugo Studio gọi trong suốt dự án.' },
      { id: 'orgName', label: 'Tên doanh nghiệp / cửa hàng', type: 'text',
        help: 'Bỏ trống nếu đây là dự án cá nhân.' },
      { id: 'role', label: 'Vai trò của bạn', type: 'text',
        help: 'Chủ, quản lý, phụ trách marketing… — để biết ai là người chốt.',
        hint: 'Nếu người duyệt cuối là người khác, ghi luôn ở đây. Biết sớm thì đỡ một vòng sửa.' },
      { id: 'email', label: 'Email', type: 'email', required: true,
        help: 'Mọi thông báo về dự án gửi tới địa chỉ này.' },
      { id: 'phone', label: 'Số điện thoại', type: 'tel', required: true },
      { id: 'contactChannel', label: 'Kênh liên lạc bạn hay dùng', type: 'select',
        options: ['Zalo', 'Điện thoại', 'Email', 'Messenger'], default: 'Zalo' },
      { id: 'contactTime', label: 'Giờ dễ liên lạc', type: 'text',
        help: 'Ví dụ: sau 18h các ngày trong tuần.' },
    ],
  },
  {
    id: 'business',
    title: 'Bạn làm gì',
    intro: 'Hiểu việc kinh doanh trước, rồi mới bàn tới website.',
    fields: [
      { id: 'industry', label: 'Ngành nghề', type: 'text', required: true,
        example: 'Quán cà phê specialty' },
      { id: 'offering', label: 'Bạn bán gì hoặc làm dịch vụ gì', type: 'textarea',
        help: 'Kể như đang nói với một người bạn chưa biết gì về nghề của bạn.',
        hint: 'Viết 3–4 câu là đủ. Thứ Hugo Studio cần là bạn kiếm tiền từ đâu.' },
      { id: 'audience', label: 'Khách hàng của bạn là ai', type: 'textarea',
        help: 'Tuổi, nghề, ở đâu, họ đang khó khăn chuyện gì.',
        hint: 'Càng hẹp càng tốt. "Ai cũng là khách" thường dẫn tới một website không nói với ai cả.' },
      { id: 'differentiator', label: 'Điều khiến bạn khác các nơi khác', type: 'textarea',
        hint: 'Đây thường là câu sẽ nằm ngay màn hình đầu của website.' },
      { id: 'competitors', label: 'Đối thủ hoặc nơi bạn hay được so sánh', type: 'textarea',
        help: 'Ghi tên hoặc dán liên kết, mỗi dòng một nơi.' },
    ],
  },
  {
    id: 'goal',
    title: 'Website để làm gì',
    intro: 'Một website làm tốt MỘT việc thì luôn hơn một website làm tạm năm việc.',
    fields: [
      { id: 'primaryGoal', label: 'Mục tiêu chính', type: 'select', required: true,
        options: ['Nhận liên hệ / khách để lại thông tin', 'Bán hàng trực tuyến',
                  'Giới thiệu năng lực, tạo uy tín', 'Nhận đặt lịch / đặt bàn',
                  'Làm hồ sơ cá nhân, portfolio', 'Ra mắt một chiến dịch'],
        help: 'Chọn MỘT. Thứ còn lại vẫn làm được, nhưng cái này được ưu tiên.' },
      { id: 'visitorAction', label: 'Bạn muốn khách làm gì khi vào web', type: 'text',
        example: 'Bấm nút nhắn Zalo để đặt bàn',
        hint: 'Nói bằng một hành động cụ thể, có động từ. "Biết đến thương hiệu" thì không đo được.' },
      { id: 'successMetric', label: 'Sau 3 tháng, thế nào thì bạn coi là thành công', type: 'text',
        example: '10 khách nhắn Zalo mỗi tuần',
        hint: 'Có con số thì sau này còn biết đường tối ưu. Chưa có ý niệm gì thì bỏ trống cũng được.' },
      { id: 'hasCurrentSite', label: 'Bạn đã có website chưa', type: 'select',
        options: ['Chưa có', 'Có rồi, muốn làm lại', 'Có rồi, chỉ muốn sửa'], default: 'Chưa có' },
      { id: 'currentSiteUrl', label: 'Địa chỉ website hiện tại', type: 'url',
        showIf: { field: 'hasCurrentSite', notEquals: 'Chưa có' },
        help: 'Và cho biết điều gì ở đó đang làm bạn khó chịu nhất.' },
    ],
  },
  {
    id: 'scope',
    title: 'Bạn cần những gì',
    intro: 'Phân loại theo mức cần thiết để Hugo Studio biết cắt gì trước nếu thiếu thời gian.',
    moscow: true,
    fields: [
      { id: 'packageId', label: 'Gói bạn chọn', type: 'package', required: true,
        help: 'Chưa chắc thì chọn gói gần nhất — Hugo Studio sẽ tư vấn lại sau khi đọc phiếu này.' },
      { id: 'pages', label: 'Các trang bạn muốn có', type: 'taglist',
        suggestions: ['Trang chủ', 'Giới thiệu', 'Dịch vụ', 'Bảng giá', 'Sản phẩm', 'Thực đơn',
                      'Dự án / Bộ sưu tập', 'Tin tức', 'Hỏi đáp', 'Liên hệ', 'Tuyển dụng'],
        help: 'Bấm để chọn, hoặc gõ thêm trang của riêng bạn.',
        hint: 'Số trang ảnh hưởng trực tiếp tới giá và thời gian. Chốt xong là khoá, thêm trang sau tính phí.' },
      { id: 'features', label: 'Tính năng', type: 'moscow',
        suggestions: ['Form liên hệ', 'Bản đồ chỉ đường', 'Chat Zalo/Messenger', 'Đặt lịch hẹn',
                      'Giỏ hàng và thanh toán', 'Tài khoản khách hàng', 'Tự đăng bài viết',
                      'Đa ngôn ngữ', 'Tìm kiếm', 'Đánh giá của khách', 'Theo dõi quảng cáo'],
        help: 'Kéo mỗi tính năng vào đúng nhóm: Bắt buộc · Nên có · Có thì tốt · Lần này không cần.',
        hint: 'Đừng để mọi thứ vào "Bắt buộc". Danh sách bắt buộc càng ngắn thì dự án càng dễ về đích đúng hẹn.' },
      { id: 'languages', label: 'Ngôn ngữ', type: 'taglist',
        suggestions: ['Tiếng Việt', 'Tiếng Anh', 'Tiếng Trung'], default: ['Tiếng Việt'] },
    ],
  },
  {
    id: 'design',
    title: 'Bạn muốn nó trông thế nào',
    intro: 'Phần này không cần biết thuật ngữ thiết kế. Cứ chỉ vào thứ bạn thích.',
    fields: [
      { id: 'hasDesign', label: 'Bạn đã có bản thiết kế sẵn chưa', type: 'select',
        options: ['Chưa có, Hugo Studio thiết kế giúp', 'Có file thiết kế (Figma/PSD)',
                  'Có bản phác thảo tay'], default: 'Chưa có, Hugo Studio thiết kế giúp' },
      { id: 'hasBrand', label: 'Bạn đã có logo và bộ nhận diện chưa', type: 'select',
        options: ['Có đầy đủ', 'Chỉ có logo', 'Chưa có gì'], default: 'Chỉ có logo',
        hint: 'Chưa có gì cũng không sao. Hugo Studio sẽ chọn màu và phông hợp với ngành của bạn.' },
      { id: 'colors', label: 'Màu sắc', type: 'colors',
        help: 'Chọn vài màu bạn thấy hợp, hoặc dán mã màu thương hiệu nếu đã có.',
        hint: 'Chưa biết chọn gì thì để trống — màu là thứ dễ bàn sau khi nhìn bản nháp đầu.' },
      { id: 'avoidColors', label: 'Màu bạn KHÔNG muốn dùng', type: 'colors',
        help: 'Ví dụ màu trùng với đối thủ, hoặc màu kiêng trong ngành của bạn.' },
      { id: 'mood', label: 'Cảm giác bạn muốn website mang lại', type: 'taglist',
        suggestions: ['Sang trọng', 'Tối giản', 'Ấm áp, gần gũi', 'Trẻ trung, năng động',
                      'Chuyên nghiệp, đáng tin', 'Sáng tạo, phá cách', 'Cổ điển', 'Công nghệ'] },
      { id: 'references', label: 'Website mẫu bạn thích', type: 'references',
        help: 'Dán liên kết, và nói rõ bạn thích ĐIỀU GÌ ở đó.',
        hint: 'Câu "thích chỗ này" quan trọng hơn chính cái liên kết. Thích bố cục hay thích màu là hai việc khác nhau.' },
      { id: 'dislikeReferences', label: 'Website bạn thấy KHÔNG ổn', type: 'references',
        help: 'Biết bạn ghét gì đôi khi hữu ích hơn biết bạn thích gì.' },
      { id: 'remakeOf', label: 'Muốn làm giống hẳn một trang nào đó', type: 'url',
        help: 'Hugo Studio dựng theo tinh thần của trang đó, KHÔNG sao chép nguyên bản.',
        hint: 'Sao chép nguyên si vừa vi phạm bản quyền vừa làm bạn giống hệt người khác.' },
    ],
  },
  {
    id: 'content',
    title: 'Nội dung ai lo',
    intro: 'Đây là lý do số một khiến dự án web bị chậm.',
    fields: [
      { id: 'copySource', label: 'Chữ trên website', type: 'select', required: true,
        options: ['Tôi tự viết và gửi', 'Tôi có sẵn nhưng cần biên tập lại',
                  'Nhờ Hugo Studio viết (tính phí riêng)'], default: 'Tôi tự viết và gửi',
        hint: 'Chọn thật lòng. Nội dung chưa xong là đồng hồ dự án dừng, không phải chạy tiếp.' },
      { id: 'photoSource', label: 'Hình ảnh', type: 'select',
        options: ['Tôi có ảnh sẵn', 'Dùng kho ảnh miễn phí', 'Cần chụp mới (tính phí riêng)'],
        default: 'Tôi có ảnh sẵn' },
      { id: 'contentReady', label: 'Khi nào bạn gửi được nội dung', type: 'text',
        example: 'Trong vòng 1 tuần' },
    ],
  },
  {
    id: 'technical',
    title: 'Phần kỹ thuật',
    intro: 'Không rành thì cứ chọn "chưa biết" — Hugo Studio sẽ hướng dẫn.',
    fields: [
      { id: 'domain', label: 'Tên miền', type: 'select',
        options: ['Đã có rồi', 'Chưa có, cần tư vấn mua', 'Chưa biết'], default: 'Chưa biết',
        help: 'Tên miền do bạn đứng tên mua và sở hữu. Hugo Studio không bán tên miền.' },
      { id: 'domainName', label: 'Tên miền hiện tại', type: 'text',
        showIf: { field: 'domain', equals: 'Đã có rồi' } },
      { id: 'hosting', label: 'Nơi lưu trữ (hosting)', type: 'select',
        options: ['Đã có rồi', 'Chưa có, cần tư vấn', 'Chưa biết'], default: 'Chưa biết' },
      { id: 'integrations', label: 'Cần nối với dịch vụ nào đang dùng', type: 'taglist',
        suggestions: ['Cổng thanh toán', 'Đơn vị vận chuyển', 'Phần mềm bán hàng', 'Phần mềm kế toán',
                      'Google Analytics', 'Facebook Pixel', 'Email marketing', 'CRM'] },
      { id: 'seoNeeds', label: 'Bạn có cần lên Google không', type: 'select',
        options: ['Có, rất quan trọng', 'Có thì tốt', 'Không cần'], default: 'Có thì tốt' },
    ],
  },
  {
    id: 'constraints',
    title: 'Thời gian và ràng buộc',
    fields: [
      { id: 'deadline', label: 'Bạn cần xong trước ngày nào', type: 'date',
        help: 'Có mốc cụ thể thì ghi. Không gấp thì bỏ trống.',
        hint: 'Gấp dưới mức thời gian tiêu chuẩn của gói sẽ tính thêm phí làm gấp.' },
      { id: 'deadlineReason', label: 'Vì sao lại là ngày đó', type: 'text',
        example: 'Khai trương cửa hàng' },
      { id: 'constraints', label: 'Điều Hugo Studio cần biết trước', type: 'textarea',
        help: 'Giới hạn pháp lý, quy định ngành, nội dung nhạy cảm, người duyệt khó tính…' },
      { id: 'notes', label: 'Còn gì bạn muốn nói thêm', type: 'textarea' },
    ],
  },
];

export const MOSCOW_LEVELS = [
  { id: 'must', label: 'Bắt buộc', blurb: 'Thiếu cái này thì dự án coi như thất bại.' },
  { id: 'should', label: 'Nên có', blurb: 'Quan trọng, nhưng thiếu vẫn dùng được.' },
  { id: 'could', label: 'Có thì tốt', blurb: 'Làm nếu còn thời gian.' },
  { id: 'wont', label: 'Lần này không cần', blurb: 'Để dành cho giai đoạn sau.' },
];

/** Số lần khách được tự sửa phiếu. Quá số này thì chỉ admin sửa được. */
export const MAX_CUSTOMER_EDITS = 3;

// ── 4. ƯỚC LƯỢNG THỜI GIAN ───────────────────────────────────────────────────
/**
 * Tính ngày dự kiến hoàn thành khi admin CHỐT THIẾT KẾ (bước vào `design`).
 *
 * Nguyên tắc: con số phải TRUY RA ĐƯỢC, không phải một cảm giác. Hàm trả về cả
 * phần diễn giải từng khoản cộng, để trang của khách hiện "vì sao lại là 24
 * ngày" chứ không chỉ ném ra một con số.
 *
 * Đây là NGÀY LÀM VIỆC, đã trừ cuối tuần khi quy ra ngày lịch. Mốc chuẩn khớp
 * với thời gian ghi trong `servicePkg.items.*.policyExtra` trên trang dịch vụ —
 * hai nơi lệch nhau thì khách bắt được ngay.
 */
export const PACKAGE_BASE_DAYS = {
  'hugo-one': 7,
  'hugo-story': 14,
  'hugo-flow-plus': 40,
  'hugo-edu-plus': 1,
};

export const ESTIMATE_RULES = [
  { id: 'extraPages', label: 'Số trang vượt mức cơ bản',
    note: 'Mỗi trang thêm ngoài 4 trang đầu tính 1,5 ngày.',
    apply: (r) => Math.max(0, (r.pages?.length || 0) - 4) * 1.5 },
  { id: 'mustFeatures', label: 'Tính năng bắt buộc',
    note: 'Mỗi tính năng ở nhóm Bắt buộc tính 2 ngày.',
    apply: (r) => (r.features?.must?.length || 0) * 2 },
  { id: 'shouldFeatures', label: 'Tính năng nên có',
    note: 'Mỗi tính năng ở nhóm Nên có tính 1 ngày.',
    apply: (r) => (r.features?.should?.length || 0) * 1 },
  { id: 'languages', label: 'Đa ngôn ngữ',
    note: 'Mỗi ngôn ngữ ngoài tiếng Việt tính 3 ngày.',
    apply: (r) => Math.max(0, (r.languages?.length || 1) - 1) * 3 },
  { id: 'copywriting', label: 'Hugo Studio viết nội dung',
    note: 'Viết nội dung thay khách tính 4 ngày.',
    apply: (r) => (r.copySource || '').includes('Hugo Studio') ? 4 : 0 },
  { id: 'photography', label: 'Chụp ảnh mới',
    note: 'Sắp lịch và chụp tính 3 ngày.',
    apply: (r) => (r.photoSource || '').includes('chụp mới') ? 3 : 0 },
  { id: 'integrations', label: 'Tích hợp dịch vụ ngoài',
    note: 'Mỗi tích hợp tính 1,5 ngày; cổng thanh toán và vận chuyển còn phụ thuộc thời gian duyệt của nhà cung cấp.',
    apply: (r) => (r.integrations?.length || 0) * 1.5 },
  { id: 'migration', label: 'Chuyển nội dung từ web cũ',
    note: 'Chuyển dữ liệu từ website đang chạy tính 3 ngày.',
    apply: (r) => (r.hasCurrentSite || '').includes('làm lại') ? 3 : 0 },
];

/** Đệm cho vòng nghiệm thu và sửa. Dự án nào cũng có, nên nó nằm trong công thức. */
export const REVIEW_BUFFER_DAYS = 3;

export function estimateProject(packageId, requirements = {}) {
  const base = PACKAGE_BASE_DAYS[packageId] ?? 10;
  const breakdown = [{ id: 'base', label: 'Mức cơ bản của gói', days: base,
    note: 'Thời gian chuẩn ghi trên trang dịch vụ của gói này.' }];

  for (const rule of ESTIMATE_RULES) {
    const days = Number(rule.apply(requirements)) || 0;
    if (days > 0) breakdown.push({ id: rule.id, label: rule.label, days, note: rule.note });
  }
  breakdown.push({ id: 'buffer', label: 'Đệm nghiệm thu và chỉnh sửa', days: REVIEW_BUFFER_DAYS,
    note: 'Hai vòng chỉnh nằm trong giá, nên thời gian của chúng cũng nằm trong ước lượng.' });

  const workingDays = Math.ceil(breakdown.reduce((sum, item) => sum + item.days, 0));
  return { packageId, workingDays, breakdown };
}

/** Cộng N ngày LÀM VIỆC vào một mốc, bỏ qua thứ Bảy và Chủ nhật. */
export function addWorkingDays(start, workingDays) {
  const date = new Date(start);
  let left = Math.max(0, Math.ceil(workingDays));
  while (left > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) left -= 1;
  }
  return date;
}

// ── 5. DỊCH VỤ ĐI KÈM ────────────────────────────────────────────────────────
/**
 * Hỏi SAU KHI đã bàn giao mã nguồn, không phải trước. Chào thêm dịch vụ lúc dự
 * án chưa xong là bán ép; chào sau khi khách đã cầm được sản phẩm là đề nghị.
 * Bỏ qua hết cũng là một lựa chọn hợp lệ và phải nói rõ như vậy trên màn hình.
 */
export const PROJECT_ADDONS = [
  { id: 'care', label: 'Gói chăm sóc hằng tháng', price: '350.000₫ / tháng', recurring: true,
    blurb: 'Kiểm tra định kỳ và cập nhật nhỏ trong hai giờ mỗi tháng. Huỷ lúc nào cũng được.' },
  { id: 'connect', label: 'Gói kết nối', price: '350.000 – 900.000₫ · một lần',
    blurb: 'Trỏ tên miền, cài chứng chỉ bảo mật, đưa website lên nơi lưu trữ của bạn.' },
  { id: 'training', label: 'Buổi hướng dẫn sử dụng', price: 'Báo giá theo buổi',
    blurb: 'Hướng dẫn trực tuyến, có quay màn hình để bạn xem lại.' },
  { id: 'seo', label: 'Thiết lập theo dõi và SEO nâng cao', price: 'Báo giá riêng',
    blurb: 'Gắn công cụ đo, khai báo với Google, tối ưu tốc độ sâu hơn mức nền tảng.' },
  { id: 'content', label: 'Viết thêm nội dung', price: 'Báo giá theo khối lượng',
    blurb: 'Bài giới thiệu, mô tả dịch vụ, bài viết cho mục tin tức.' },
];

/** Câu hỏi đánh giá sau khi đóng dự án. Ngắn — dài thì không ai điền. */
export const FEEDBACK_QUESTIONS = [
  { id: 'overall', label: 'Nhìn chung bạn hài lòng đến đâu', type: 'rating', max: 5, required: true },
  { id: 'communication', label: 'Việc trao đổi trong dự án', type: 'rating', max: 5 },
  { id: 'timeline', label: 'Tiến độ so với kỳ vọng của bạn', type: 'rating', max: 5 },
  { id: 'result', label: 'Sản phẩm cuối so với điều bạn hình dung', type: 'rating', max: 5 },
  { id: 'bestPart', label: 'Điều gì bạn thấy ổn nhất', type: 'textarea' },
  { id: 'improve', label: 'Điều gì Hugo Studio nên làm khác đi', type: 'textarea',
    help: 'Cứ nói thẳng. Đây là phần hữu ích nhất của bài đánh giá.' },
  { id: 'recommend', label: 'Bạn có giới thiệu Hugo Studio cho người khác không', type: 'select',
    options: ['Chắc chắn có', 'Có thể', 'Không'] },
  { id: 'publishable', label: 'Hugo Studio được phép trích lời đánh giá này không', type: 'select',
    options: ['Được, kèm tên', 'Được, ẩn tên', 'Không'], default: 'Được, ẩn tên' },
];
