// Đầu trang riêng của Education Hugo. Cùng index.html với www nên manifest,
// icon, màu chủ đề và splash iOS phải đổi lúc chạy — trình duyệt đọc lại thẻ
// manifest khi nó đổi, và iOS đọc icon/tên ở thời điểm "Thêm vào MH chính".
import { useEffect } from "react";

const TITLE = "Education Hugo — Học lập trình web miễn phí";
const DESCRIPTION = "Học lập trình web miễn phí bằng cách tự tay làm mạng xã hội Nhịp: HTML, CSS, JavaScript, PHP, MySQL, bảo mật và triển khai. Thuộc Hugo Studio.";

function upsert(selector, create, attr, value) {
  const nodes = document.head.querySelectorAll(selector);
  if (!nodes.length) {
    const node = document.createElement(create.tag);
    Object.entries(create.attrs).forEach(([key, val]) => node.setAttribute(key, val));
    node.setAttribute(attr, value);
    document.head.appendChild(node);
    return;
  }
  nodes.forEach((node) => node.setAttribute(attr, value));
}

export function useEduHead() {
  useEffect(() => {
    document.title = TITLE;
    document.documentElement.lang = "vi";
    upsert('link[rel="manifest"]', { tag: "link", attrs: { rel: "manifest" } }, "href", "/edu.webmanifest");
    upsert('link[rel="apple-touch-icon"]', { tag: "link", attrs: { rel: "apple-touch-icon" } }, "href", "/edu/apple-touch-icon.png");
    upsert('link[rel="icon"]', { tag: "link", attrs: { rel: "icon", type: "image/svg+xml" } }, "href", "/edu/buddy-learn.svg");
    upsert('meta[name="theme-color"]', { tag: "meta", attrs: { name: "theme-color" } }, "content", "#29cdff");
    upsert('meta[name="apple-mobile-web-app-title"]', { tag: "meta", attrs: { name: "apple-mobile-web-app-title" } }, "content", "Edu Hugo");
    upsert('meta[name="description"]', { tag: "meta", attrs: { name: "description" } }, "content", DESCRIPTION);
    upsert('meta[property="og:title"]', { tag: "meta", attrs: { property: "og:title" } }, "content", TITLE);
    upsert('meta[property="og:description"]', { tag: "meta", attrs: { property: "og:description" } }, "content", DESCRIPTION);
    upsert('link[rel="canonical"]', { tag: "link", attrs: { rel: "canonical" } }, "href", `${window.location.origin}/`);
    // Ảnh mở app của Hugo Studio không thuộc về Education Hugo.
    document.head.querySelectorAll('link[rel="apple-touch-startup-image"]').forEach((node) => node.remove());
  }, []);
}

// beforeinstallprompt chỉ bắn MỘT lần, thường trước khi màn nào kịp mount —
// bắt ở cấp module (chunk này nạp ngay khi vào tên miền Edu).
let deferredInstall = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstall = event;
    window.dispatchEvent(new Event("edu:installable"));
  });
}

/** true = đã hiện hộp cài của trình duyệt; false = trình duyệt không hỗ trợ (iOS) → tự hướng dẫn. */
export async function promptInstall() {
  if (!deferredInstall) return false;
  const event = deferredInstall;
  deferredInstall = null;
  await event.prompt();
  return true;
}
