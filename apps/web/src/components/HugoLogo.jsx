import { useId } from "react";

/**
 * Dấu hiệu Hugo Studio — giọt nước.
 *
 * Dựng bằng compa: đường tròn r30 tâm (50,62), hai tiếp tuyến kẻ từ đỉnh
 * (50,4), đỉnh bo r3. Đừng vẽ lại bằng tay.
 *
 * Cái tên "Hugo Studio" dạng CHỮ chỉ còn trong văn bản pháp lý; mọi nơi khác
 * dùng hình này.
 *
 * Màu do class `hugo-mark` trong index.css quyết định — một sắc độ chung cho
 * cả app, đổi liên tục và đồng bộ với favicon. Nơi gọi CHỈ đặt kích thước;
 * đặt thêm text-* là phá mất sự đồng bộ đó.
 *
 * Quầng sáng đặt BÊN TRONG svg chứ không dùng `drop-shadow` của CSS: bán kính
 * ở đây tính theo đơn vị viewBox nên nó co giãn cùng hình. Nếu để CSS lo,
 * cùng một giá trị px sẽ thành quầng khổng lồ ở favicon 16px và gần như vô
 * hình ở logo 56px.
 */
const HugoLogo = ({ className = "h-6 w-6", ...props }) => {
  const glow = useId();
  return (
    <svg
      viewBox="19 3 62 90"
      fill="currentColor"
      role="img"
      aria-label="Hugo Studio"
      className={`hugo-mark ${className}`}
      {...props}
    >
      <filter id={glow} x="-45%" y="-35%" width="190%" height="170%">
        <feDropShadow dx="0" dy="0" stdDeviation="1.8" floodColor="currentColor" floodOpacity="0.95" />
        <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor="currentColor" floodOpacity="0.5" />
      </filter>
      <path filter={`url(#${glow})`} d="M47.43 8.25 A3 3 0 0 1 52.57 8.25 L75.68 46.48 A30 30 0 1 1 24.32 46.48 Z" />
    </svg>
  );
};

/**
 * Chữ đổ gradient Gemini. KHÔNG phải logo: nó dùng để tô tên hiển thị do người
 * dùng tự nhập trong các theme Bio, nên vẫn giữ nguyên.
 */
const GEMINI_GRADIENT =
  "linear-gradient(90deg, #2678ff 0%, #0797ff 28%, #7359e8 55%, #d45aa3 78%, #f0445e 100%)";

export const RenderColoredText = ({ text }) => {
  if (!text || typeof text !== "string") return null;
  return (
    <span
      style={{
        backgroundImage: GEMINI_GRADIENT,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }}
    >
      {text}
    </span>
  );
};

export default HugoLogo;
