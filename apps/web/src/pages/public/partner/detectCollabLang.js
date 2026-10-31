import { isPartnerLang } from "../../../../../../packages/shared/partnerCampaigns";

// Ngôn ngữ của trang chiến dịch: đoán theo VÙNG của thiết bị, rồi để người
// dùng xác nhận trong bộ chọn. Không gọi máy chủ hay dịch vụ định vị IP nào:
// trình duyệt đã có đủ hai tín hiệu — ngôn ngữ hệ thống (kèm mã vùng, vd.
// "en-VN") và múi giờ.

const STORAGE_KEY = "collab_lang";

const REGION_LANG = { VN: "vi", CN: "zh", TW: "zh", HK: "zh", MO: "zh" };

const TIMEZONE_LANG = {
  "Asia/Ho_Chi_Minh": "vi",
  "Asia/Saigon": "vi",
  "Asia/Shanghai": "zh",
  "Asia/Chongqing": "zh",
  "Asia/Harbin": "zh",
  "Asia/Urumqi": "zh",
  "Asia/Hong_Kong": "zh",
  "Asia/Macau": "zh",
  "Asia/Taipei": "zh",
};

/**
 * Ngôn ngữ gợi ý cho thiết bị này:
 *  1. Ngôn ngữ hệ thống là tiếng Việt hoặc tiếng Trung → dùng luôn.
 *  2. Không thì xét vùng: mã vùng trong locale ("en-VN") hoặc múi giờ.
 *  3. Còn lại → tiếng Anh.
 */
export function detectCollabLang() {
  if (typeof navigator === "undefined") return "vi";
  const locales = [...(navigator.languages || []), navigator.language].filter(Boolean);
  for (const locale of locales) {
    const base = locale.toLowerCase().split("-")[0];
    if (base === "vi" || base === "zh") return base;
  }
  for (const locale of locales) {
    const region = locale.split("-").find((part, index) => index > 0 && /^[A-Za-z]{2}$/.test(part));
    if (region && REGION_LANG[region.toUpperCase()]) return REGION_LANG[region.toUpperCase()];
  }
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TIMEZONE_LANG[zone]) return TIMEZONE_LANG[zone];
  } catch {
    // Trình duyệt cũ không có Intl đầy đủ: bỏ qua tín hiệu múi giờ.
  }
  return "en";
}

export function getSavedCollabLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isPartnerLang(saved) ? saved : null;
  } catch {
    return null;
  }
}

export function saveCollabLang(lang) {
  try {
    if (isPartnerLang(lang)) localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Chế độ ẩn danh chặn lưu trữ: lần sau hỏi lại, không sao.
  }
}
