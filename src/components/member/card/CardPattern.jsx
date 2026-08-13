/**
 * Hoạ tiết nền của thẻ thành viên — mỗi hạng một kiểu, để nhìn hoa văn là biết
 * hạng chứ không chỉ nhìn màu (người mù màu vẫn phân biệt được).
 *
 * Dùng `preserveAspectRatio="xMidYMid slice"`, KHÔNG phải "none": kéo giãn hình
 * tròn theo tỉ lệ thẻ biến nó thành elip khổng lồ, và đường cong của elip đó
 * chạy vòng quanh mép trông y hệt viền một tấm thẻ thứ hai nằm sau.
 *
 * Mọi hình đều vẽ bằng `currentColor` ở độ mờ thấp, nên hoạ tiết tự ăn theo màu
 * chữ của hạng: nền pastel ra hoa văn đậm hơn nền, nền mực ra hoa văn vàng.
 * Không thêm màu cứng nào ở đây.
 */
export default function CardPattern({ kind }) {
  const common = "pointer-events-none absolute inset-0 h-full w-full";

  if (kind === "waves") {
    return (
      <svg className={common} viewBox="0 0 400 252" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true">
        <path d="M0 150 C 70 108, 150 186, 232 146 S 350 96, 400 128 L400 252 L0 252 Z" fill="currentColor" opacity="0.08" />
        <path d="M0 182 C 88 148, 158 208, 244 176 S 348 138, 400 162 L400 252 L0 252 Z" fill="currentColor" opacity="0.07" />
        <path d="M0 130 C 60 98, 140 158, 226 122 S 352 78, 400 108" stroke="currentColor" strokeOpacity="0.14" strokeWidth="1.5" />
      </svg>
    );
  }

  if (kind === "rays") {
    // Nan quạt toả từ góc trên phải — hạng Gold.
    return (
      <svg className={common} viewBox="0 0 400 252" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true">
        <g opacity="0.1" fill="currentColor">
          {Array.from({ length: 9 }, (_, i) => {
            const spread = 8 + i * 15;
            return <path key={i} d={`M400 -10 L${400 - spread * 3} 262 L${400 - spread * 3 - 26} 262 Z`} />;
          })}
        </g>
        <circle cx="400" cy="-10" r="120" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.5" fill="none" />
        <circle cx="400" cy="-10" r="180" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1.5" fill="none" />
      </svg>
    );
  }

  if (kind === "facets") {
    // Mặt cắt kim cương — các mảnh tam giác gãy khúc.
    return (
      <svg className={common} viewBox="0 0 400 252" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true">
        <g fill="currentColor">
          <path d="M262 252 L340 96 L400 176 L400 252 Z" opacity="0.09" />
          <path d="M330 252 L400 110 L400 252 Z" opacity="0.07" />
          <path d="M180 252 L268 132 L318 252 Z" opacity="0.05" />
        </g>
        <g stroke="currentColor" strokeOpacity="0.14" strokeWidth="1.2">
          <path d="M232 252 L336 60 L400 148" />
          <path d="M290 252 L360 84" />
        </g>
      </svg>
    );
  }

  if (kind === "stars") {
    // Bầu trời sao thưa — hạng đỉnh, nền mực.
    const dots = [
      [58, 46, 1.6], [126, 92, 1.1], [206, 40, 1.4], [268, 118, 1], [330, 62, 1.7],
      [92, 168, 1.2], [178, 206, 1], [286, 190, 1.5], [364, 148, 1.1], [36, 116, 1],
      [232, 148, 1.2], [148, 42, 1],
    ];
    return (
      <svg className={common} viewBox="0 0 400 252" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true">
        <g fill="currentColor">
          {dots.map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} opacity={0.16 + (i % 3) * 0.08} />
          ))}
        </g>
        {/* Hai tia sáng bốn cánh cho có điểm nhấn */}
        <g fill="currentColor" opacity="0.3">
          <path d="M318 96 L322 108 L334 112 L322 116 L318 128 L314 116 L302 112 L314 108 Z" />
          <path d="M84 208 L87 217 L96 220 L87 223 L84 232 L81 223 L72 220 L81 217 Z" />
        </g>
      </svg>
    );
  }

  // "guilloche" — vân kẻ chéo mảnh như mặt thẻ kim loại chải xước, mặc định cho
  // hạng cơ bản. Bản trước dùng bốn vòng cung lớn ở góc: bán kính của chúng gần
  // bằng khổ thẻ nên đường cong chạy vòng quanh mép, nhìn ra đúng một tấm thẻ
  // thứ hai nằm sau. Vân thẳng thì không bao giờ giả làm cái viền được.
  return (
    <svg className={common} viewBox="0 0 400 252" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1" strokeOpacity="0.055">
        {Array.from({ length: 26 }, (_, i) => (
          <path key={i} d={`M${-120 + i * 26} 262 L${40 + i * 26} -10`} />
        ))}
      </g>
    </svg>
  );
}
