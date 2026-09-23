/**
 * Danh sách điểm đến của bảng điều khiển — NGUỒN DUY NHẤT.
 *
 * Trước 2026-09-23 điều hướng có BA TẦNG: 7 "hub" ở thanh bên, mỗi hub một dải
 * nút phụ, riêng nhánh HugoCoder còn một dải nút phụ nữa. Muốn tới màn chấm bài
 * phải bấm Hệ sinh thái → HugoCoder → Bài nộp. Cái giá phải trả:
 *   · 6 biến `useState` chỉ để nhớ đang ở tầng nào,
 *   · 36 nhánh điều kiện trong `AdminPanel.jsx`,
 *   · 5 dải nút phụ với markup gần như giống hệt nhau, sửa một chỗ quên bốn chỗ.
 *
 * Nay mọi màn hình là một điểm đến phẳng, bấm MỘT lần là tới. `group` chỉ để
 * xếp nhóm cho dễ nhìn, không phải một tầng phải bấm qua.
 *
 * Thêm màn hình mới = thêm một phần tử ở đây + một nhánh trong `renderTab()`.
 * Đừng dựng lại tầng phụ.
 */
/**
 * Ba TẦNG, không phải một rổ nhóm ngang hàng.
 *
 * Trước đó sáu nhóm nằm cùng một mức nên "Gói dịch vụ" (thứ khách nhìn thấy
 * trên web) đứng ngang "Nhật ký kiểm toán" (thứ chỉ máy chủ biết) — nhìn vào
 * không phân biệt được mình đang sửa mặt tiền hay đang động vào hạ tầng.
 *
 *   ops      — việc có hạn, cắt ngang cả hai tầng dưới.
 *   frontend — thứ NGƯỜI DÙNG NHÌN THẤY: bảng giá, cửa hàng, dự án, học liệu.
 *              Sửa ở đây là đổi cái khách đang xem.
 *   backend  — dữ liệu, hạ tầng, an ninh, tài khoản. Sửa ở đây là động vào
 *              máy chủ và dữ liệu thật.
 */
export const ADMIN_REALMS = [
  { id: "ops", title: "Vận hành", note: "Việc có hạn" },
  { id: "frontend", title: "Mặt tiền", note: "Thứ người dùng nhìn thấy" },
  { id: "backend", title: "Hậu trường", note: "Dữ liệu, hạ tầng, an ninh" },
];

/**
 * `daily: true` = mục mở gần như mỗi ngày. Mười chín mục bày ngang nhau thì
 * không mục nào nổi lên, và người dùng phải đọc lại cả danh sách mỗi lần —
 * đó là cái rối còn lại sau khi đã làm phẳng.
 *
 * Thanh bên hiện thẳng nhóm hằng ngày; phần còn lại gập sau "Xem tất cả",
 * mở ra vẫn đầy đủ, KHÔNG mục nào bị giấu mất.
 */
export const DAILY_DESTINATION_IDS = ["queue", "projects", "users", "dashboard"];

export const ADMIN_GROUPS = [
  { id: "work", realm: "ops", title: "VIỆC CẦN LÀM" },
  { id: "business", realm: "frontend", title: "KINH DOANH" },
  { id: "learning", realm: "frontend", title: "HỌC TẬP" },
  { id: "people", realm: "backend", title: "TÀI KHOẢN & HỖ TRỢ" },
  { id: "intelligence", realm: "backend", title: "AI & AN NINH" },
  { id: "platform", realm: "backend", title: "HẠ TẦNG" },
];

export const ADMIN_DESTINATIONS = [
  // Đứng đầu vì đây là thứ DUY NHẤT có hạn: đơn kháng nghị và giao dịch bị giữ
  // đang treo tiền và treo tài khoản của người thật.
  { id: "queue", group: "work", label: "Việc chờ duyệt", sub: "Kháng nghị, giao dịch bị giữ, nợ JOY, phiếu hỗ trợ",
    icon: "pending_actions", accent: "from-amber-500 to-rose-600", countKey: "queue", glow: true },
  { id: "dashboard", group: "work", label: "Tổng quan", sub: "Số liệu toàn hệ thống",
    icon: "dashboard", accent: "from-blue-500 to-indigo-600" },

  { id: "users", group: "people", label: "Thành viên", sub: "Hồ sơ 360°, ví, xác minh",
    icon: "group", accent: "from-emerald-500 to-teal-600", countKey: "users" },
  { id: "support", group: "people", label: "Hỗ trợ khách", sub: "Phiếu hỗ trợ và liên hệ",
    icon: "support_agent", accent: "from-emerald-500 to-cyan-600", countKey: "openTickets" },
  { id: "hugoteam", group: "people", label: "Hugo Team", sub: "Hồ sơ ứng tuyển và cộng tác viên",
    icon: "diversity_3", accent: "from-teal-500 to-emerald-600" },

  { id: "projects", group: "business", label: "Dự án khách hàng", sub: "Tiến độ và yêu cầu",
    icon: "work", accent: "from-amber-500 to-orange-600", countKey: "totalProjects" },
  { id: "services", group: "business", label: "Gói dịch vụ", sub: "Gói bán và bảng giá",
    icon: "sell", accent: "from-orange-500 to-amber-600", countKey: "packages" },
  { id: "store", group: "business", label: "Cửa hàng tiện ích", sub: "Sản phẩm và đơn hàng",
    icon: "storefront", accent: "from-purple-500 to-fuchsia-600" },
  { id: "joylater", group: "business", label: "Cho vay JOY", sub: "Dư nợ, hạn mức, công tắc dừng cho vay",
    icon: "account_balance", accent: "from-amber-500 to-yellow-600" },

  { id: "submissions", group: "learning", label: "Bài nộp", sub: "Chấm bài HugoCoder",
    icon: "assignment_turned_in", accent: "from-amber-500 to-yellow-600" },
  { id: "resources", group: "learning", label: "Học liệu", sub: "Tài nguyên cho người học",
    icon: "library_books", accent: "from-yellow-500 to-amber-600" },
  { id: "learners", group: "learning", label: "Người học", sub: "Tiến độ và chỗ đang mắc",
    icon: "school", accent: "from-lime-500 to-green-600" },

  { id: "sentinel", group: "intelligence", label: "Sentinel", sub: "Chặn, kiểm duyệt, sự kiện an ninh",
    icon: "shield", accent: "from-rose-500 to-red-600" },
  { id: "brain", group: "intelligence", label: "Bộ não AI", sub: "Trạng thái, hạn mức, công tắc",
    icon: "psychology", accent: "from-cyan-500 to-blue-600" },
  { id: "workforce", group: "intelligence", label: "Nhân sự AI", sub: "Việc giao cho AI và phê duyệt",
    icon: "smart_toy", accent: "from-blue-500 to-cyan-600" },
  { id: "robot", group: "intelligence", label: "Robot & IoT", sub: "Thiết bị kết nối",
    icon: "precision_manufacturing", accent: "from-sky-500 to-blue-600" },

  { id: "monitor", group: "platform", label: "Giám sát hệ thống", sub: "Vitals, nhật ký lỗi, dung lượng",
    icon: "monitor_heart", accent: "from-rose-500 to-pink-600" },
  { id: "audit", group: "platform", label: "Nhật ký kiểm toán", sub: "Ai đã làm gì, lúc nào",
    icon: "history", accent: "from-slate-500 to-zinc-600" },
  { id: "oauth", group: "platform", label: "Ứng dụng OAuth", sub: "Khoá và quyền của bên thứ ba",
    icon: "key", accent: "from-indigo-500 to-violet-600" },
  { id: "settings", group: "platform", label: "Cài đặt", sub: "Cấu hình hệ thống và quảng cáo",
    icon: "settings", accent: "from-zinc-500 to-slate-600" },
];

export const DEFAULT_DESTINATION = "queue";

/** Id cũ (thời còn hub) → điểm đến mới, để đường dẫn và liên kết đã lưu không chết. */
export const LEGACY_TAB_ALIASES = {
  ai_sentinel: "brain",
  ecosystem: "store",
  system: "settings",
};

export const isValidDestination = (id) => ADMIN_DESTINATIONS.some((d) => d.id === id);
