/**
 * Cấu hình các kênh Donate & Sponsorship toàn cầu của Hugo Wishpax Studio.
 * Cho phép tuỳ biến qua biến môi trường hoặc dùng link mặc định của Studio.
 */
export const DONATION_CONFIG = {
  buyMeACoffeeUrl: import.meta.env.VITE_BUY_ME_A_COFFEE_URL || "https://buymeacoffee.com/hugowishpax",
  githubSponsorsUrl: import.meta.env.VITE_GITHUB_SPONSORS_URL || "https://github.com/sponsors/Hugo-huy2004",
  paypalUrl: import.meta.env.VITE_PAYPAL_DONATE_URL || "https://paypal.me/hugowishpax",
  kofiUrl: import.meta.env.VITE_KOFI_URL || "https://ko-fi.com/hugowishpax",
};
