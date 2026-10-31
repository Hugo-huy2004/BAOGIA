const DROP =
  "M47.43 8.25 A3 3 0 0 1 52.57 8.25 L75.68 46.48 A30 30 0 1 1 24.32 46.48 Z";

// Favicon mang theo cùng quầng sáng, dựng bằng filter SVG chứ không phải bóng
// CSS: tệp này là một ảnh độc lập, không có CSS nào chạm tới được.
const faviconUrl = (hue) => {
  const color = `hsl(${hue % 360} 100% 58%)`;
  return (
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="19 3 62 90">` +
        `<filter id="g" x="-45%" y="-35%" width="190%" height="170%">` +
        `<feDropShadow dx="0" dy="0" stdDeviation="1.8" flood-color="${color}" flood-opacity="0.95"/>` +
        `<feDropShadow dx="0" dy="0" stdDeviation="4.5" flood-color="${color}" flood-opacity="0.5"/>` +
        `</filter>` +
        `<path filter="url(#g)" d="${DROP}" fill="${color}"/></svg>`,
    )
  );
};

function svgIconLink() {
  const existing = document.querySelector('link[rel~="icon"][type="image/svg+xml"]');
  if (existing) return existing;
  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/svg+xml";
  document.head.appendChild(link);
  return link;
}

/** Sắc độ thương hiệu. Trùng đúng giá trị trong `--hugo-color` (index.css) và
 *  trong public/favicon/favicon.svg — ba chỗ phải cùng một con số. */
const BRAND_HUE = 194;

export function startBrandColorCycle() {
  if (typeof document === "undefined") return;
  const link = svgIconLink();
  // faviconUrl là HÀM: thiếu tham số thì href nhận cả đoạn mã nguồn stringify
  // và favicon im lặng hỏng — tệp tĩnh che mất, nên lỗi rất khó thấy.
  link.href = faviconUrl(BRAND_HUE);
}
