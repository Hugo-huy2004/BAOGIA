/**
 * SOCIAL PLATFORM DEFINITIONS
 * ============================================================================
 * Danh sách 12 nền tảng được hỗ trợ và logic nhận diện URL/Label.
 */

export const SUPPORTED_PLATFORMS = [
  { id: "facebook", name: "Facebook", placeholder: "https://facebook.com/username", prefix: "https://facebook.com/" },
  { id: "instagram", name: "Instagram", placeholder: "https://instagram.com/username", prefix: "https://instagram.com/" },
  { id: "x", name: "X", placeholder: "https://x.com/username", prefix: "https://x.com/" },
  { id: "threads", name: "Threads", placeholder: "https://threads.net/@username", prefix: "https://threads.net/@" },
  { id: "zalo", name: "Zalo", placeholder: "Tự động lấy số điện thoại", prefix: "https://zalo.me/" },
  { id: "github", name: "GitHub", placeholder: "https://github.com/username", prefix: "https://github.com/" },
  { id: "discord", name: "Discord", placeholder: "https://discord.gg/invite", prefix: "https://discord.gg/" },
  { id: "tiktok", name: "TikTok", placeholder: "https://tiktok.com/@username", prefix: "https://tiktok.com/@" },
  { id: "linkedin", name: "LinkedIn", placeholder: "https://linkedin.com/in/username", prefix: "https://linkedin.com/in/" },
  { id: "pinterest", name: "Pinterest", placeholder: "https://pinterest.com/username", prefix: "https://pinterest.com/" },
  { id: "shopping", name: "Website bán hàng", placeholder: "https://shopee.vn/shop hoặc link cửa hàng", prefix: "https://" },
  { id: "website", name: "Website cá nhân", placeholder: "https://yourwebsite.com", prefix: "https://" },
];

/**
 * Tự động nhận diện nền tảng từ URL và nhãn
 */
export function detectSocialPlatform(label = "", url = "") {
  const normLabel = String(label || "").toLowerCase().trim();
  const normUrl = String(url || "").toLowerCase().trim();

  if (normUrl.includes("facebook.com") || normUrl.includes("fb.com") || normUrl.includes("fb.me") || normLabel.includes("facebook") || normLabel === "fb") {
    return "facebook";
  }
  if (normUrl.includes("instagram.com") || normUrl.includes("instagr.am") || normLabel.includes("instagram") || normLabel === "ig") {
    return "instagram";
  }
  if (normUrl.includes("x.com") || normUrl.includes("twitter.com") || normLabel === "x" || normLabel.includes("twitter")) {
    return "x";
  }
  if (normUrl.includes("threads.net") || normLabel.includes("threads")) {
    return "threads";
  }
  if (normUrl.includes("zalo.me") || normUrl.includes("zaloapp.com") || normLabel.includes("zalo")) {
    return "zalo";
  }
  if (normUrl.includes("github.com") || normLabel.includes("github") || normLabel === "git") {
    return "github";
  }
  if (normUrl.includes("discord.gg") || normUrl.includes("discord.com") || normLabel.includes("discord")) {
    return "discord";
  }
  if (normUrl.includes("tiktok.com") || normLabel.includes("tiktok")) {
    return "tiktok";
  }
  if (normUrl.includes("linkedin.com") || normLabel.includes("linkedin")) {
    return "linkedin";
  }
  if (normUrl.includes("pinterest.com") || normUrl.includes("pin.it") || normLabel.includes("pinterest")) {
    return "pinterest";
  }
  if (
    normUrl.includes("shopee") ||
    normUrl.includes("lazada") ||
    normUrl.includes("tiki") ||
    normUrl.includes("sendo") ||
    normUrl.includes("store") ||
    normUrl.includes("shop") ||
    normLabel.includes("bán hàng") ||
    normLabel.includes("shop") ||
    normLabel.includes("store")
  ) {
    return "shopping";
  }
  return "website";
}
