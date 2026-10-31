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
  { id: "hugoteam", group: "community", label: "Hugo Team", sub: "Học tập, bài nộp, mentor và team", icon: "diversity_3", permission: "hugoteam" },
  { id: "control", group: "control", label: "Điều khiển", sub: "Khách thật, an ninh, công tắc", icon: "radar", permission: "system" },
  { id: "data", group: "control", label: "Dữ liệu", sub: "Thêm, sửa, xoá mọi bảng", icon: "table_view", permission: "overview" },
  { id: "access", group: "control", label: "Quyền quản trị", sub: "Tài khoản và vai trò", icon: "admin_panel_settings", permission: "access" },
];

export const DEFAULT_DESTINATION = "dashboard";
export const LEGACY_TAB_ALIASES = { ai_sentinel: "control", sentinel: "control", monitor: "control", audit: "control", settings: "control", ecosystem: "store", system: "control", submissions: "hugoteam", learners: "hugoteam", resources: "hugoteam" };

export const destinationsForPermissions = (permissions = ["*"]) =>
  ADMIN_DESTINATIONS.filter((destination) => hasAdminPermission(permissions, destination.permission));

export const isValidDestination = (id, permissions = ["*"]) =>
  destinationsForPermissions(permissions).some((destination) => destination.id === id);
