import { useId } from "react";

/**
 * Hình trong icon ứng dụng — mỗi app một cảnh 3D nhỏ, vẽ bằng SVG nội tuyến.
 *
 * Trước đây icon chỉ là một nét lucide đơn sắc đặt giữa ô gradient: mười cái
 * đứng cạnh nhau trông như một cái nhân mười. Cảnh riêng cho từng app mới là
 * thứ người dùng nhận ra trước cả khi đọc tên — cùng lối vẽ đã dùng cho ảnh
 * bìa trong Chợ, nhưng gọn lại cho ô 48×48.
 *
 * Vì sao SVG chứ không phải PNG: mỗi icon một tấm ảnh là vài trăm KB nhân với
 * số lần mở portal — đúng khoản băng thông đã từng làm cháy hạn mức Render.
 * SVG đi kèm bundle, nét ở mọi kích cỡ, đổi màu theo app mà không xuất lại.
 *
 * Chiều sâu dựng bằng ba mảng: bản sao tối lệch xuống làm bóng, mặt trắng, dải
 * sáng ở nửa trên. Không filter blur — tốn GPU máy yếu và iOS hay vỡ hình
 * trong vùng cuộn.
 *
 * Id gradient là toàn cục theo tài liệu SVG nên phải lấy từ useId(): hai icon
 * cùng khai báo một id thì gỡ cái đầu khỏi DOM là cái sau mất màu, hiện ra
 * mảng đen.
 */

/** Khối hộp giả phối cảnh: bóng đổ, mặt, dải sáng. */
const Slab = ({ x, y, w, h, r = 4, fill, d = 1.6 }) => (
  <>
    <rect x={x + d * 0.6} y={y + d} width={w} height={h} rx={r} fill="#000" opacity="0.18" />
    <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} />
    <rect x={x} y={y} width={w} height={h * 0.4} rx={r} fill="#fff" opacity="0.24" />
  </>
);

// ── Cảnh của từng ứng dụng ────────────────────────────────────────────────
// f = mặt trắng có chuyển sắc, g = mảng kính trong. Toạ độ nằm trong 48×48,
// chừa ~7px lề để icon không chạm mép ô bo góc.

const SCENES = {
  // Trang Bio — thẻ hồ sơ
  bio: (f) => (
    <>
      <Slab x={10} y={12} w={28} h={24} r={5} fill={f} />
      <circle cx="19" cy="22" r="5" fill="#6366f1" />
      <circle cx="19" cy="20.4" r="2.1" fill="#fff" opacity="0.95" />
      <path d="M15.6 25.6a3.5 3.5 0 0 1 6.8 0Z" fill="#fff" opacity="0.95" />
      <rect x="27" y="18.6" width="9" height="2.2" rx="1.1" fill="#0f172a" opacity="0.3" />
      <rect x="27" y="23.2" width="6.4" height="2.2" rx="1.1" fill="#0f172a" opacity="0.19" />
      <rect x="14" y="30" width="20" height="2.8" rx="1.4" fill="#0f172a" opacity="0.13" />
    </>
  ),

  // Coding — cửa sổ mã mang ký hiệu </>
  study: (f) => (
    <>
      <ellipse cx="24" cy="38.5" rx="13" ry="2.4" fill="#000" opacity="0.16" />
      <Slab x={8} y={11} w={32} h={25} r={4} fill={f} />
      <circle cx="12.5" cy="15.5" r="1.3" fill="#f87171" />
      <circle cx="16.5" cy="15.5" r="1.3" fill="#fbbf24" />
      <circle cx="20.5" cy="15.5" r="1.3" fill="#34d399" />
      <g fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="m18.5 22.5-4.5 4.5 4.5 4.5" />
        <path d="m29.5 22.5 4.5 4.5-4.5 4.5" />
        <path d="m26 21.5-4 11" />
      </g>
    </>
  ),

  // Nhóm — ba người và đường nối
  team: (f) => (
    <>
      <path d="M15 27.5 24 20l9 7.5" fill="none" stroke="#fff" strokeOpacity="0.42" strokeWidth="1.6" />
      {[[15, 29, "#6366f1"], [33, 29, "#14b8a6"], [24, 17, "#f59e0b"]].map(([cx, cy, tint]) => (
        <g key={`${cx}-${cy}`}>
          <ellipse cx={cx} cy={cy + 6.5} rx="6.4" ry="2.2" fill="#000" opacity="0.16" />
          <circle cx={cx} cy={cy} r="6.4" fill={f} />
          <circle cx={cx} cy={cy - 1.8} r="2.4" fill={tint} />
          <path d={`M${cx - 3.6} ${cy + 4.6}a3.6 3.6 0 0 1 7.2 0Z`} fill={tint} />
        </g>
      ))}
    </>
  ),


  // Tập Trung — vòng thở quanh quả cầu
  aura: (f, g) => (
    <>
      {[17, 13, 9.5].map((r, i) => (
        <circle key={r} cx="24" cy="24" r={r} fill="none" stroke="#fff" strokeOpacity={0.16 + i * 0.13} strokeWidth="1.4" />
      ))}
      <circle cx="24" cy="24" r="6.4" fill={g} />
      <circle cx="24" cy="24" r="6.4" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.1" />
      <circle cx="21.6" cy="21.6" r="2.2" fill="#fff" opacity="0.5" />
      <circle cx="38" cy="12" r="1.5" fill="#fff" opacity="0.55" />
      <circle cx="11" cy="35" r="1.2" fill="#fff" opacity="0.42" />
    </>
  ),

  // Supporter — tai nghe trợ lý AI 24/7
  supporter: () => (
    <>
      <rect x="7" y="7" width="34" height="34" rx="9" fill="#000" opacity="0.2" />
      <rect x="7" y="7" width="34" height="34" rx="9" fill="url(#supporter-glyph-grad)" />
      <defs>
        <linearGradient id="supporter-glyph-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path d="M15 25a9 9 0 0 1 18 0v6a3 3 0 0 1-3 3h-2a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h5" fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" />
      <rect x="12" y="21" width="5" height="9" rx="2.5" fill="#ffffff" opacity="0.9" />
      <rect x="31" y="21" width="5" height="9" rx="2.5" fill="#ffffff" opacity="0.9" />
      <circle cx="24" cy="22" r="3.5" fill="#ffffff" />
      <circle cx="24" cy="22" r="1.5" fill="#0f172a" />
    </>
  ),

  // Sàn ảo (Invest) — hai cây nến giá trên nền lục, đọc một cái là biết chứng khoán
  invest: () => (
    <>
      <rect x="7" y="7" width="34" height="34" rx="9" fill="#000" opacity="0.2" />
      <rect x="7" y="7" width="34" height="34" rx="9" fill="url(#invest-glyph-grad)" />
      <defs>
        <linearGradient id="invest-glyph-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <rect x="17" y="17" width="4" height="14" rx="1.4" fill="#ffffff" />
      <rect x="18.4" y="14" width="1.2" height="20" rx="0.6" fill="#ffffff" />
      <rect x="27" y="22" width="4" height="10" rx="1.4" fill="#fca5a5" />
      <rect x="28.4" y="19" width="1.2" height="16" rx="0.6" fill="#fca5a5" />
    </>
  ),

  // Phim (Cinema) — Clapperboard Điện Ảnh & Cuộn Phim Tím Indigo Độc Quyền
  cinema: () => (
    <>
      <rect x="7" y="7" width="34" height="34" rx="9" fill="#000" opacity="0.2" />
      <rect x="7" y="7" width="34" height="34" rx="9" fill="url(#cinema-glyph-grad)" />
      <defs>
        <linearGradient id="cinema-glyph-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      {/* Bảng bấm máy Clapperboard trắng */}
      <rect x="13" y="19" width="22" height="16" rx="3" fill="#ffffff" opacity="0.95" />
      {/* Thanh bấm máy nghiêng */}
      <path d="M12 17 L36 12 L36 16 L12 21 Z" fill="#ffffff" />
      <path d="M16 16.2 L19 15.6 L18 19 L15 19.6 Z" fill="#4f46e5" />
      <path d="M23 14.8 L26 14.2 L25 17.6 L22 18.2 Z" fill="#4f46e5" />
      <path d="M30 13.4 L33 12.8 L32 16.2 L29 16.8 Z" fill="#4f46e5" />
      {/* Mắt cuộn phim trung tâm */}
      <circle cx="24" cy="27" r="3.5" fill="#4f46e5" />
      <circle cx="24" cy="27" r="1.5" fill="#ffffff" />
    </>
  ),

  // Bản Tin Hệ Thống — vòng thông tin
  info: (f) => (
    <>
      <circle cx="25" cy="25.4" r="13" fill="#000" opacity="0.2" />
      <circle cx="24" cy="24" r="13" fill={f} />
      <circle cx="24" cy="17.6" r="2.3" fill="#0f172a" opacity="0.5" />
      <rect x="21.8" y="21.4" width="4.4" height="10.4" rx="2.2" fill="#0f172a" opacity="0.5" />
    </>
  ),

  // Ví JOY — ví và đồng xu
  joy_wallet: (f) => (
    <>
      {/* Đồng xu nhô lên khỏi miệng ví. Viền sẫm để nó còn thấy được khi ô
          nền cũng màu hổ phách — xu vàng trên nền vàng là biến mất. */}
      <circle cx="30" cy="13" r="6.4" fill="#0f172a" opacity="0.25" />
      <circle cx="30" cy="12.4" r="6.4" fill="#fde68a" />
      <circle cx="30" cy="12.4" r="6.4" fill="none" stroke="#b45309" strokeWidth="1.2" opacity="0.55" />
      <circle cx="28" cy="10.4" r="2" fill="#fff" opacity="0.75" />
      <Slab x={9} y={17} w={30} h={19} r={5} fill={f} />
      <rect x="9" y="17" width="30" height="6.5" rx="3.2" fill="#fff" opacity="0.45" />
      <rect x="27" y="26" width="12" height="7" rx="3.5" fill="#0f172a" opacity="0.22" />
      <circle cx="32.4" cy="29.5" r="2.1" fill="#fff" opacity="0.85" />
    </>
  ),

  // Chợ Hugo — túi mua sắm
  store: (f) => (
    <>
      <path d="M13 17h22l-2 19a2.6 2.6 0 0 1-2.6 2.4H17.6A2.6 2.6 0 0 1 15 36Z" fill="#000" opacity="0.18" transform="translate(1.2 1.4)" />
      <path d="M19 18v-3.4a5 5 0 0 1 10 0V18" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M13 17h22l-2 19a2.6 2.6 0 0 1-2.6 2.4H17.6A2.6 2.6 0 0 1 15 36Z" fill={f} />
      <path d="M13 17h22l-0.7 6.6H13.7Z" fill="#fff" opacity="0.3" />
      <circle cx="24" cy="29" r="4.2" fill="#6366f1" opacity="0.85" />
      <path d="m21.9 29 1.6 1.6 3-3.4" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),







  // Học Tập — hai lớp cửa sổ mã
  ide: (f) => (
    <>
      <rect x="12" y="10" width="27" height="19" rx="3.4" fill="#fff" opacity="0.28" />
      <Slab x={8} y={16} w={27} h={21} r={3.4} fill={f} />
      <circle cx="12" cy="20" r="1.3" fill="#f87171" />
      <circle cx="16" cy="20" r="1.3" fill="#fbbf24" />
      <circle cx="20" cy="20" r="1.3" fill="#34d399" />
      {[[12, 24.6, 12], [12, 28.2, 17], [15, 31.8, 10]].map(([x, y, w]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height="1.9" rx="0.9" fill="#0f172a" opacity="0.26" />
      ))}
    </>
  ),

  // HugoSO — chồng sách
  hugoso: (f) => (
    <>
      <Slab x={11} y={29} w={26} h={7} r={2} fill={f} />
      <Slab x={9.5} y={22} w={29} h={7} r={2} fill={f} />
      <Slab x={12.5} y={15} w={23} h={7} r={2} fill={f} />
      <rect x="27" y="15" width="4" height="11" fill="#f43f5e" opacity="0.9" />
      <path d="M27 26h4l-2-2.2Z" fill="#0f172a" opacity="0.3" />
    </>
  ),
};

/** Cảnh dự phòng: ba khối xếp lớp — dùng khi app chưa có hình riêng. */
const FALLBACK = (f) => (
  <>
    <Slab x={9} y={22} w={12} h={12} r={3} fill={f} />
    <Slab x={18} y={15} w={12} h={12} r={3} fill={f} />
    <Slab x={27} y={22} w={12} h={12} r={3} fill={f} />
  </>
);

export default function AppGlyph({ appId }) {
  const uid = useId();
  if (appId === "eduhugo") {
    return <img src="/brand/edu-hugo-mascot.png" alt="" className="h-full w-full object-contain" />;
  }
  const face = `${uid}-face`;
  const glass = `${uid}-glass`;
  const scene = SCENES[appId] || FALLBACK;

  return (
    <svg viewBox="0 0 48 48" className="h-auto w-full" aria-hidden="true">
      <defs>
        <linearGradient id={face} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.97" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.74" />
        </linearGradient>
        <linearGradient id={glass} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      {scene(`url(#${face})`, `url(#${glass})`)}
    </svg>
  );
}
