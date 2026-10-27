import { hasAdminPermission } from "../../../shared/adminAccess";

export const ADMIN_GROUPS = [
  { id: "operate", title: "Vận hành" },
  { id: "business", title: "Kinh doanh" },
  { id: "community", title: "Cộng đồng & học tập" },
  { id: "control", title: "Kiểm soát" },
];

export const ADMIN_DESTINATIONS = [
  { id: "dashboard", group: "operate", label: "Tổng quan", sub: "Tình trạng hôm nay", icon: "space_dashboard", permission: "overview" },
  { id: "queue", group: "operate", label: "Việc cần xử lý", sub: "Ưu tiên theo thời hạn", icon: "inbox", permission: "queue", countKey: "queue" },
  { id: "users", group: "operate", label: "Thành viên", sub: "Hồ sơ, ví và xác minh", icon: "group", permission: "users", countKey: "users" },
  { id: "support", group: "operate", label: "Hỗ trợ", sub: "Yêu cầu từ người dùng", icon: "support_agent", permission: "support", countKey: "openTickets" },
  { id: "projects", group: "business", label: "Dự án", sub: "Tiến độ và khách hàng", icon: "work", permission: "projects", countKey: "totalProjects" },
  { id: "services", group: "business", label: "Gói dịch vụ", sub: "Bảng giá đang bán", icon: "sell", permission: "commerce", countKey: "packages" },
  { id: "store", group: "business", label: "Cửa hàng", sub: "Sản phẩm và đơn hàng", icon: "storefront", permission: "commerce" },
  { id: "joylater", group: "business", label: "Tài chính JOY", sub: "Dư nợ và hạn mức", icon: "account_balance_wallet", permission: "commerce" },
  { id: "hugoteam", group: "community", label: "HugoTeam", sub: "Mentor, member và đội nhóm", icon: "diversity_3", permission: "hugoteam" },
  { id: "submissions", group: "community", label: "Bài nộp Coding", sub: "Chấm và phản hồi", icon: "fact_check", permission: "learning" },
  { id: "learners", group: "community", label: "Người học", sub: "Tiến độ và điểm nghẽn", icon: "school", permission: "learning" },
  { id: "resources", group: "community", label: "Học liệu", sub: "Nội dung Hugo Coding", icon: "menu_book", permission: "learning" },
  { id: "sentinel", group: "control", label: "An ninh", sub: "Cảnh báo và kiểm duyệt", icon: "shield", permission: "security" },
  { id: "monitor", group: "control", label: "Hệ thống", sub: "Sức khỏe và lỗi", icon: "monitor_heart", permission: "system" },
  { id: "audit", group: "control", label: "Nhật ký", sub: "Dấu vết thao tác", icon: "history", permission: "audit" },
  { id: "settings", group: "control", label: "Cấu hình", sub: "Thiết lập nền tảng", icon: "tune", permission: "system" },
  { id: "access", group: "control", label: "Quyền quản trị", sub: "Tài khoản và vai trò", icon: "admin_panel_settings", permission: "access" },
];

export const DEFAULT_DESTINATION = "dashboard";
export const LEGACY_TAB_ALIASES = { ai_sentinel: "sentinel", ecosystem: "store", system: "settings" };

export const destinationsForPermissions = (permissions = ["*"]) =>
  ADMIN_DESTINATIONS.filter((destination) => hasAdminPermission(permissions, destination.permission));

export const isValidDestination = (id, permissions = ["*"]) =>
  destinationsForPermissions(permissions).some((destination) => destination.id === id);
