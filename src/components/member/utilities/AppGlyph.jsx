import { useId } from "react";

/**
 * Hình trong icon ứng dụng — mỗi app một cảnh 3D nhỏ, vẽ bằng SVG nội tuyến.
 *
 * Trước đây icon chỉ là một nét lucide đơn sắc đặt giữa ô gradient: mười cái
 * đứng cạnh nhau trông như một cái nhân mười. Cảnh riêng cho từng app mới là
 * thứ người dùng nhận ra trước cả khi đọc tên — cùng lối vẽ đã dùng cho ảnh
 * bìa trong Chợ (hugoStore/ui/AppArt.jsx), nhưng gọn lại cho ô 48×48.
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

  // Hồ sơ — huy hiệu và dấu kiểm
  profile: (f) => (
    <>
      <path d="M24 9 36 13.4V25c0 7.6-5.4 11.8-12 14.6C17.4 36.8 12 32.6 12 25V13.4Z" fill="#000" opacity="0.18" transform="translate(1 1.4)" />
      <path d="M24 9 36 13.4V25c0 7.6-5.4 11.8-12 14.6C17.4 36.8 12 32.6 12 25V13.4Z" fill={f} />
      <path d="M24 9 36 13.4V25c0 3.4-1.1 6.2-2.9 8.5" fill="none" stroke="#fff" strokeOpacity="0.65" strokeWidth="1.3" />
      <path d="m17.6 23.6 4.6 4.6L31 19.4" fill="none" stroke="#10b981" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),

  // Học Cùng Hugo — mũ tốt nghiệp
  study: (f) => (
    <>
      <ellipse cx="24" cy="37.5" rx="12" ry="2.6" fill="#000" opacity="0.16" />
      <path d="M16 22v7.5c0 3.2 3.6 5.3 8 5.3s8-2.1 8-5.3V22Z" fill={f} />
      <path d="M16 22v7.5c0 1.7 1 3.1 2.6 4V22Z" fill="#000" opacity="0.13" />
      <path d="m24 12 16 6.6-16 6.6-16-6.6Z" fill="#000" opacity="0.2" transform="translate(0 1.6)" />
      <path d="m24 12 16 6.6-16 6.6-16-6.6Z" fill={f} />
      <path d="m24 12 16 6.6-16 6.6Z" fill="#000" opacity="0.1" />
      <path d="M38 20v9" stroke="#fbbf24" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="38" cy="30.4" r="2.4" fill="#fbbf24" />
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

  // Tâm Trí — trái tim và nhịp đập
  psychology: (f) => (
    <>
      <path d="M24 38c-9.6-6.8-13.6-11.8-13.6-17.2A7.8 7.8 0 0 1 24 15.6a7.8 7.8 0 0 1 13.6 5.2C37.6 26.2 33.6 31.2 24 38Z" fill="#000" opacity="0.18" transform="translate(1 1.4)" />
      <path d="M24 38c-9.6-6.8-13.6-11.8-13.6-17.2A7.8 7.8 0 0 1 24 15.6a7.8 7.8 0 0 1 13.6 5.2C37.6 26.2 33.6 31.2 24 38Z" fill={f} />
      <path d="M17.6 18.4a5.4 5.4 0 0 0-4.6 4.4" fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M13.4 24.6h4.2l2-4.4 2.8 8.6 2.2-4.6h9" fill="none" stroke="#f43f5e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),

  // Âm Thanh — loa và sóng lan ra
  radio: (f, g) => (
    <>
      {[9, 14, 19].map((r, i) => (
        <path
          key={r}
          d={`M 33 ${24 - r * 0.7} A ${r} ${r} 0 0 1 33 ${24 + r * 0.7}`}
          fill="none"
          stroke="#fff"
          strokeOpacity={0.5 - i * 0.14}
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      ))}
      <Slab x={9} y={13} w={21} h={22} r={5} fill={f} />
      <circle cx="19.5" cy="26" r="6.6" fill="#000" opacity="0.22" />
      <circle cx="19.5" cy="26" r="5" fill={g} />
      <circle cx="19.5" cy="26" r="2.1" fill="#fff" opacity="0.9" />
      <circle cx="19.5" cy="18.5" r="1.7" fill="#fff" opacity="0.6" />
    </>
  ),

  // Công Cụ — mã QR và tệp
  handle: (f) => (
    <>
      <Slab x={9} y={11} w={24} h={24} r={5} fill={f} />
      {[[12.5, 14.5], [24, 14.5], [12.5, 26]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="6.4" height="6.4" rx="1.8" fill="#0f172a" opacity="0.72" />
          <rect x={x + 2.1} y={y + 2.1} width="2.2" height="2.2" rx="0.6" fill="#fff" />
        </g>
      ))}
      {[[24, 26], [28.4, 30.4], [24, 30.4]].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="2.4" height="2.4" rx="0.6" fill="#0f172a" opacity="0.5" />
      ))}
      <Slab x={31} y={19} w={9} h={16} r={2.6} fill={f} />
      <rect x="33" y="24" width="5" height="1.6" rx="0.8" fill="#0f172a" opacity="0.24" />
      <rect x="33" y="27.6" width="3.4" height="1.6" rx="0.8" fill="#0f172a" opacity="0.18" />
    </>
  ),

  // Trò Chơi — cần điều khiển và hai nút
  arcade: (f) => (
    <>
      <Slab x={9} y={22} w={30} h={13} r={6} fill={f} />
      <ellipse cx="17.5" cy="26" rx="5.4" ry="2.6" fill="#000" opacity="0.2" />
      <rect x="16.2" y="14" width="2.6" height="12" rx="1.3" fill="#fff" opacity="0.78" />
      <circle cx="17.5" cy="12.6" r="4.6" fill="#f43f5e" />
      <circle cx="16" cy="11.2" r="1.5" fill="#fff" opacity="0.6" />
      <circle cx="29" cy="26.5" r="3.6" fill="#38bdf8" />
      <circle cx="27.9" cy="25.4" r="1.1" fill="#fff" opacity="0.65" />
      <circle cx="35" cy="30.5" r="2.7" fill="#fbbf24" />
      <circle cx="34.2" cy="29.7" r="0.9" fill="#fff" opacity="0.65" />
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

  // Cờ Vua — bàn cờ nghiêng và quân vua
  arcade_chess: (f) => (
    <>
      <g transform="translate(24 31) scale(1 0.5) rotate(45) translate(-24 -31)">
        <rect x="12" y="19" width="24" height="24" fill="#fff" opacity="0.9" />
        {[0, 1, 2, 3].flatMap((r) => [0, 1, 2, 3].map((c) => ((r + c) % 2 === 0 ? (
          <rect key={`${r}-${c}`} x={12 + c * 6} y={19 + r * 6} width="6" height="6" fill="#0f172a" opacity="0.66" />
        ) : null)))}
      </g>
      <ellipse cx="24" cy="29.6" rx="5.6" ry="1.9" fill="#000" opacity="0.2" />
      <path d="M20.6 28.6h6.8l-1.3-8h-4.2Z" fill={f} />
      <ellipse cx="24" cy="28.6" rx="4.2" ry="1.6" fill="#fff" />
      <circle cx="24" cy="18" r="3.4" fill={f} />
      <rect x="22.8" y="10.6" width="2.4" height="6" rx="1" fill="#fff" />
      <rect x="21.2" y="12.4" width="5.6" height="2.1" rx="1" fill="#fff" />
    </>
  ),

  // 2048 — các ô số xếp bậc thang
  arcade_2048: (f) => (
    <>
      <Slab x={8} y={24} w={15} h={14} r={3.2} fill={f} />
      <Slab x={17} y={17} w={15} h={14} r={3.2} fill={f} />
      <Slab x={26} y={10} w={15} h={14} r={3.2} fill={f} />
      <text x="15.5" y="34.6" textAnchor="middle" fontSize="9" fontWeight="800" fill="#0f172a" opacity="0.55">2</text>
      <text x="24.5" y="27.6" textAnchor="middle" fontSize="9" fontWeight="800" fill="#0f172a" opacity="0.55">4</text>
      <text x="33.5" y="20.6" textAnchor="middle" fontSize="9" fontWeight="800" fill="#0f172a" opacity="0.6">8</text>
    </>
  ),

  // Cờ Caro — lưới với X và O
  arcade_caro: (f) => (
    <>
      <Slab x={10} y={12} w={28} h={24} r={5} fill={f} />
      {[1, 2].map((i) => (
        <g key={i}>
          <rect x={10 + i * 9.3} y="14" width="1.1" height="20" rx="0.5" fill="#0f172a" opacity="0.2" />
          <rect x="12" y={12 + i * 8} width="24" height="1.1" rx="0.5" fill="#0f172a" opacity="0.2" />
        </g>
      ))}
      <path d="m14.6 15.6 4 4m0-4-4 4" stroke="#f43f5e" strokeWidth="2.1" strokeLinecap="round" />
      <circle cx="24" cy="24" r="3.2" fill="none" stroke="#38bdf8" strokeWidth="2.1" />
      <path d="m29.6 28.6 4 4m0-4-4 4" stroke="#f43f5e" strokeWidth="2.1" strokeLinecap="round" />
    </>
  ),

  // Rắn — thân uốn theo phối cảnh và quả mồi
  arcade_snake: (f) => (
    <>
      <path d="M12 33h7a3.4 3.4 0 0 0 3.4-3.4v-5a3.4 3.4 0 0 1 3.4-3.4h5.2" fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="7" strokeLinecap="round" transform="translate(1 1.4)" />
      <path d="M12 33h7a3.4 3.4 0 0 0 3.4-3.4v-5a3.4 3.4 0 0 1 3.4-3.4h5.2" fill="none" stroke={f} strokeWidth="6.2" strokeLinecap="round" />
      <circle cx="32.6" cy="21.2" r="4.6" fill={f} />
      <circle cx="34.2" cy="19.6" r="1.1" fill="#0f172a" />
      <circle cx="31" cy="19.6" r="1.1" fill="#0f172a" />
      <circle cx="36" cy="32" r="3.4" fill="#f43f5e" />
      <path d="M36 28.6q1.6-2.2 3.2-1.8" fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),

  // Sinh Tồn — phi thuyền, hành tinh có vành
  arcade_survivor: (f) => (
    <>
      <circle cx="36" cy="13" r="6.4" fill="#fff" opacity="0.22" />
      <ellipse cx="36" cy="13" rx="9.6" ry="2.6" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="1.3" />
      <ellipse cx="21" cy="37" rx="6" ry="2" fill="#000" opacity="0.2" />
      <path d="M21 9c5 4.4 7.2 11 7.2 16.8H13.8C13.8 20 16 13.4 21 9Z" fill={f} />
      <path d="M21 9c-5 4.4-7.2 11-7.2 16.8h4.4C18.2 20 19 13.4 21 9Z" fill="#fff" opacity="0.34" />
      <circle cx="21" cy="19.4" r="3" fill="#38bdf8" />
      <circle cx="19.9" cy="18.3" r="1" fill="#fff" opacity="0.8" />
      <path d="m13.8 25.8-4.2 5.2h5.8Zm14.4 0 4.2 5.2h-5.8Z" fill="#f43f5e" />
      <path d="M17.8 31.4q2.2 6 4.4 0-2.2 3.2-4.4 0Z" fill="#fbbf24" />
      <circle cx="10" cy="14" r="1.2" fill="#fff" opacity="0.55" />
      <circle cx="40" cy="37" r="1" fill="#fff" opacity="0.5" />
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
