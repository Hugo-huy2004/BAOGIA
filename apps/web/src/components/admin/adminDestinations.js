import { hasAdminPermission } from "../../../../../packages/shared/adminAccess";

export const ADMIN_GROUPS = [
  { id: "operate", title: "Vận hành" },
  { id: "business", title: "Kinh doanh" },
  { id: "control", title: "Kiểm soát" },
];

export const ADMIN_DESTINATIONS = [
  { id: "dashboard", group: "operate", label: "Tổng quan", sub: "Tình trạng hôm nay", icon: "space_dashboard", permission: "overview" },
  { id: "queue", group: "operate", label: "Việc cần xử lý", sub: "Ưu tiên theo thời hạn", icon: "inbox", permission: "queue", countKey: "queue" },
  { id: "users", group: "operate", label: "Thành viên", sub: "Hồ sơ, ví và xác minh", icon: "group", permission: "users", countKey: "users" },
  { id: "support", group: "operate", label: "Hỗ trợ", sub: "Yêu cầu từ người dùng", icon: "support_agent", permission: "support", countKey: "openTickets" },
  { id: "services", group: "business", label: "Gói dịch vụ", sub: "Bảng giá đang bán", icon: "sell", permission: "commerce", countKey: "packages" },
  { id: "apis", group: "business", label: "API-m", sub: "Key, lượt gọi, link đã tạo", icon: "api", permission: "users" },
  { id: "control", group: "control", label: "Điều khiển", sub: "Khách thật, an ninh, công tắc", icon: "radar", permission: "system" },
  { id: "data", group: "control", label: "Dữ liệu", sub: "Thêm, sửa, xoá mọi bảng", icon: "table_view", permission: "overview" },
  { id: "access", group: "control", label: "Quyền quản trị", sub: "Tài khoản và vai trò", icon: "admin_panel_settings", permission: "access" },
];

export const DEFAULT_DESTINATION = "dashboard";
export const LEGACY_TAB_ALIASES = { ai_sentinel: "control", sentinel: "control", monitor: "control", audit: "control", settings: "control", system: "control" };

export const destinationsForPermissions = (permissions = ["*"]) =>
  ADMIN_DESTINATIONS.filter((destination) => hasAdminPermission(permissions, destination.permission));

export const isValidDestination = (id, permissions = ["*"]) =>
  destinationsForPermissions(permissions).some((destination) => destination.id === id);
