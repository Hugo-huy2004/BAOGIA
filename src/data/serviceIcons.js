/**
 * Icon cho từng mục của trang gói — PHẦN KHÔNG DỊCH.
 *
 * Mỗi hạng mục trong "Gói bao gồm", "Chưa bao gồm", "Bảo hành", "Chính sách"
 * và "Dành cho ai" có một icon riêng thay vì dùng chung một dấu tick. Trang
 * gói vốn là một bức tường chữ; icon riêng cho mỗi thẻ là thứ giúp mắt bám vào
 * và đoán được nội dung trước khi đọc.
 *
 * Tên icon là chuỗi Material Symbols, KHÔNG nằm trong tệp dịch: máy sinh chữ
 * Nôm sẽ dịch mất chúng (xem `src/data/serviceCompare.js`). Phông nạp đầy bộ
 * từ Google Fonts nên tên nào cũng vẽ được.
 *
 * Thứ tự PHẢI khớp thứ tự mục trong `servicePkg.*`. Thêm hay bớt một mục thì
 * sửa mảng ở đây — `useServiceCopy` ghép hai bên theo chỉ số.
 */
export const SHARED_ICONS = {
  // "Mã nguồn viết tay 100%" luôn là mục đầu của Gói bao gồm.
  handCoded: "code_blocks",
  excludes: ["public", "dns", "block", "photo_library", "receipt_long"],
  connectExclude: "cable",
  policy: ["account_balance_wallet", "checklist", "lock", "copyright", "pause_circle"],
};

export const PACKAGE_ICONS = {
  "hugo-one": {
    audience: ["campaign", "badge", "event"],
    includes: ["design_services", "ads_click", "devices", "mail", "search", "code", "rocket_launch"],
    warranty: ["bug_report", "edit", "schedule"],
    policyExtra: ["hourglass_top"],
  },
  "hugo-story": {
    audience: ["storefront", "restaurant", "public"],
    includes: ["account_tree", "alt_route", "place", "search", "devices", "code"],
    warranty: ["bug_report", "edit", "school"],
    policyExtra: ["hourglass_top"],
  },
  "hugo-flow-plus": {
    audience: ["storefront", "inventory_2", "event_available"],
    includes: ["inventory_2", "shopping_cart", "credit_card", "account_circle", "search", "dashboard", "api"],
    warranty: ["bug_report", "support_agent", "school"],
    policyExtra: ["hourglass_top", "payments", "badge", "admin_panel_settings"],
  },
  "hugo-edu-plus": {
    audience: ["school", "work", "groups"],
    includes: ["card_giftcard", "link", "person", "folder_open", "edit_note", "devices"],
    warranty: ["support_agent", "folder_shared"],
    policyExtra: ["verified", "person", "account_circle", "update"],
  },
};
