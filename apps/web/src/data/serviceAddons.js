/**
 * Gói lẻ — PHẦN KHÔNG DỊCH. Chữ nằm ở `servicePkg.addonItems.<id>` trong
 * translation.json (vi/en/zh).
 *
 * `slug` là địa chỉ công khai /services/add-ons/<slug>: tiếng Anh, ngắn, để copy gửi
 * khách qua Zalo. ĐỪNG đổi slug đã phát hành — link khách đã lưu sẽ chết.
 * `appliesTo` quyết định gói lẻ nào làm mờ trên trang một gói chính; không suy
 * từ chữ "for" vì chữ đó đi qua máy dịch.
 *
 * ĐỪNG thêm gói lẻ giá thấp cho việc lặt vặt (mã QR, popup… đã gỡ 2026-09-28):
 * mỗi gói lẻ là một lần mở lại dự án, đọc lại mã, dựng lại môi trường — không
 * đáng công nếu giá chỉ vài trăm nghìn. Và chỉ giữ việc làm xong dưới 3 giờ:
 * viết chữ, song ngữ, chuyển web cũ, trang quản trị, bán hàng thêm đều đã gỡ.
 */
const ALL = ["hugo-one", "hugo-story", "hugo-flow-plus"];

export const ADDON_GROUPS = ["start", "care", "after"];

export const SERVICE_ADDONS = [
  // Story và Flow+ đã gồm liên kết trong lúc làm — Gói Liên kết chỉ bán cho Hugo One.
  { id: "link", slug: "domain-setup", group: "start", appliesTo: ["hugo-one"] },
  { id: "seo", slug: "seo", group: "start", appliesTo: ALL },
  // Chỉ gói có thứ phải trông (CSDL, thanh toán, thư viện) mới có gói duy trì.
  // Hugo One, Story là web tĩnh: không bán phí hằng tháng cho thứ không cần.
  { id: "maintain", slug: "flow-care-plan", group: "care", appliesTo: ["hugo-flow-plus"] },
  { id: "support", slug: "support", group: "after", appliesTo: ALL },
];

export const findAddon = (slugOrId) => SERVICE_ADDONS.find((a) => a.slug === slugOrId || a.id === slugOrId);
export const addonPath = (addon) => `/services/add-ons/${addon.slug}`;
