export const ADMIN_PERMISSIONS = [
  "overview",
  "queue",
  "users",
  "support",
  "projects",
  "commerce",
  "learning",
  "hugoteam",
  "security",
  "system",
  "audit",
  "access",
];

export const ADMIN_ROLES = {
  owner: {
    label: "Chủ hệ thống",
    description: "Toàn quyền, bao gồm tài khoản quản trị và cấu hình bảo mật.",
    permissions: ["*"],
  },
  operator: {
    label: "Điều hành",
    description: "Vận hành thành viên, dự án, hỗ trợ và các chương trình cộng đồng.",
    permissions: ["overview", "queue", "users", "support", "projects", "commerce", "learning", "hugoteam"],
  },
  support: {
    label: "Hỗ trợ",
    description: "Xử lý hàng đợi, hồ sơ thành viên và yêu cầu hỗ trợ.",
    permissions: ["overview", "queue", "users", "support"],
  },
  finance: {
    label: "Tài chính",
    description: "Theo dõi thành viên, dự án, cửa hàng và nghiệp vụ JOY.",
    permissions: ["overview", "queue", "users", "projects", "commerce", "audit"],
  },
  learning: {
    label: "Đào tạo",
    description: "Quản lý Hugo Coding, HugoTeam và tiến độ người học.",
    permissions: ["overview", "users", "learning", "hugoteam"],
  },
  security: {
    label: "An ninh",
    description: "Giám sát, xử lý sự cố và xem nhật ký kiểm toán.",
    permissions: ["overview", "queue", "users", "security", "system", "audit"],
  },
  viewer: {
    label: "Chỉ xem",
    description: "Chỉ xem tổng quan, không có quyền thay đổi dữ liệu.",
    permissions: ["overview"],
  },
};

export const resolveAdminPermissions = (role = "owner", customPermissions = []) => {
  const base = ADMIN_ROLES[role]?.permissions || ADMIN_ROLES.viewer.permissions;
  if (role === "owner") return ["*"];
  const selected = customPermissions.length ? customPermissions : base;
  return [...new Set(selected.filter((permission) => ADMIN_PERMISSIONS.includes(permission)))];
};

export const hasAdminPermission = (permissions = [], permission) =>
  permissions.includes("*") || permissions.includes(permission);
