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
  // "Viết mã tay" luôn đứng đầu Gói bao gồm, hai mục `includesTail` đứng cuối.
  handCoded: "code_blocks",
  includesTail: ["design_services", "folder_zip"],
  excludes: ["language", "dns", "alternate_email", "forward_to_inbox", "account_balance", "photo_library", "receipt_long", "gavel", "add_circle"],
  // Thứ tự khớp servicePkg.policy: online · cọc (hoặc miễn cọc) · bản quyền.
  policy: ["forum", "account_balance_wallet", "copyright"],
  feedback: ["checklist", "chat_bubble", "grid_on", "lock", "schedule"],
};

export const PACKAGE_ICONS = {
  "hugo-one": {
    audience: ["campaign", "badge", "event"],
    includes: ["view_agenda", "palette", "mail", "rocket_launch"],
    warranty: ["all_inclusive", "edit"],
    policyExtra: [],
  },
  "hugo-story": {
    audience: ["storefront", "restaurant", "public"],
    includes: ["account_tree", "palette", "alt_route", "call", "search", "rocket_launch"],
    warranty: ["all_inclusive", "edit"],
    policyExtra: [],
  },
  "hugo-flow-plus": {
    audience: ["event_available", "storefront", "inbox"],
    includes: ["web", "touch_app", "table_chart", "qr_code_2", "edit_note"],
    warranty: ["all_inclusive", "edit", "smart_display"],
    policyExtra: ["admin_panel_settings"],
  },
  "hugo-edu-plus": {
    audience: ["school", "work", "groups"],
    includes: ["card_giftcard", "link", "person", "folder_open", "edit_note", "devices"],
    warranty: ["support_agent", "folder_shared"],
    policyExtra: ["verified", "person", "account_circle", "update"],
  },
};
