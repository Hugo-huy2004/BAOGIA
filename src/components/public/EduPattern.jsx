/**
 * Hoạ tiết nền học đường: mũ tốt nghiệp, sách, bút chì, thước, bóng đèn, quả
 * địa cầu, cúp, ngôi sao… lặp thành một tấm giấy gói.
 *
 * Vẽ thẳng bằng SVG chứ không dùng ảnh: tệp chỉ vài KB, nét luôn sắc ở mọi độ
 * phân giải, và toàn bộ hình ăn theo `currentColor` nên vẫn là đơn sắc — đúng
 * quy ước biểu tượng của trang công khai, tự đảo màu ở nền tối.
 *
 * Ô lặp 240×240 đơn vị. Muốn thưa hơn thì tăng `tile`, muốn mờ hơn thì đổi lớp
 * `text-*` ở nơi gọi. Giữa tấm có lớp mờ dần (mask) để chữ ở giữa không phải
 * đọc trên nền rối.
 */
export default function EduPattern({ className = "", tile = 240 }) {
  return (
    <svg
      aria-hidden
      className={`pointer-events-none absolute inset-0 size-full ${className}`}
      style={{
        maskImage: "radial-gradient(120% 85% at 50% 45%, transparent 18%, black 68%)",
        WebkitMaskImage: "radial-gradient(120% 85% at 50% 45%, transparent 18%, black 68%)",
      }}
    >
      <defs>
        <pattern id="edu-doodles" width={tile} height={tile} patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            {/* Mũ tốt nghiệp */}
            <g transform="translate(34 38) rotate(-8)">
              <path d="M-22 0 0-10 22 0 0 10Z" />
              <path d="M-13 4v10c0 4 26 4 26 0V4" />
              <path d="M22 0v12" />
            </g>

            {/* Sách mở */}
            <g transform="translate(120 30) rotate(6)">
              <path d="M-20-9 0-4v16l-20-5Z" />
              <path d="M20-9 0-4v16l20-5Z" />
            </g>

            {/* Bút chì */}
            <g transform="translate(200 44) rotate(38)">
              <path d="M-4-18h8v26l-4 8-4-8Z" />
              <path d="M-4 8h8" />
            </g>

            {/* Thước kẻ */}
            <g transform="translate(46 118) rotate(-24)">
              <rect x="-26" y="-7" width="52" height="14" rx="2" />
              <path d="M-14-7v5M-2-7v7M10-7v5M20-7v7" />
            </g>

            {/* Bóng đèn */}
            <g transform="translate(128 116)">
              <path d="M0-14a12 12 0 0 1 7 22v4h-14v-4a12 12 0 0 1 7-22Z" />
              <path d="M-5 16h10M-4 20h8" />
              <path d="M0-22v-5M16-8h5M-16-8h-5M12-19l3-3M-12-19l-3-3" />
            </g>

            {/* Ngôi sao */}
            <g transform="translate(206 124) rotate(12)">
              <path d="M0-14 4.2-4.4 14-3.2 6.8 3.6 8.6 13.4 0 8.6-8.6 13.4l1.8-9.8L-14-3.2l9.8-1.2Z" />
            </g>

            {/* Quả địa cầu */}
            <g transform="translate(38 196)">
              <circle r="15" />
              <path d="M-15 0h30M0-15c7 7 7 23 0 30M0-15c-7 7-7 23 0 30" />
            </g>

            {/* Cúp */}
            <g transform="translate(120 198) rotate(-6)">
              <path d="M-9-14h18v9a9 9 0 0 1-18 0Z" />
              <path d="M-9-10h-5a5 5 0 0 0 5 6M9-10h5a5 5 0 0 1-5 6" />
              <path d="M0 4v7M-7 13h14" />
            </g>

            {/* Nét vẽ nguệch ngoạc */}
            <path d="M182 190q9-12 18 0t18 0" />

            {/* Dấu cộng và chấm nhỏ rải cho đỡ trống */}
            <path d="M76 68h10M81 63v10M160 168h10M165 163v10M92 152h8M96 148v8" />
            <circle cx="170" cy="76" r="2.6" />
            <circle cx="58" cy="158" r="2.2" />
            <circle cx="224" cy="184" r="2.6" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#edu-doodles)" />
    </svg>
  );
}
