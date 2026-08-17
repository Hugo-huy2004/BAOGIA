/**
 * Hình minh hoạ cho từng ứng dụng — mỗi app một cảnh riêng, vẽ bằng SVG nội
 * tuyến.
 *
 * Vì sao là SVG chứ không phải ảnh: mỗi thẻ một tấm PNG là vài trăm KB nhân với
 * số lần mở cửa hàng, và đó đúng là khoản băng thông đã từng làm cháy hạn mức
 * Render một lần rồi. SVG nội tuyến đi kèm bundle, nét ở mọi độ phân giải, và
 * đổi màu theo app mà không cần xuất lại ảnh.
 *
 * Cách dựng chiều sâu: mỗi khối là ba mảng — mặt trên sáng, mặt bên tối, bóng
 * đổ xuống nền. Không dùng filter blur (tốn GPU trên máy yếu và iOS hay vỡ
 * hình trong vùng cuộn), bóng là ellipse mờ dần bằng gradient.
 */

/**
 * Bộ gradient dùng chung, vẽ MỘT lần cho cả cửa hàng.
 *
 * Không nhét defs vào từng cảnh: id trong SVG là toàn cục theo tài liệu, nên
 * hai chục cảnh cùng khai báo `hgs-face` là hai chục id trùng nhau — và tệ hơn,
 * khi React tháo cái đầu tiên khỏi DOM thì mọi cảnh còn lại mất luôn gradient,
 * hiện ra một mảng đen. Đặt ở đây thì chỉ có một bản, sống suốt phiên.
 */
export function ArtDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" className="absolute">
      <defs>
        <radialGradient id="hgs-glow" cx="50%" cy="34%" r="62%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hgs-shade" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hgs-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.72" />
        </linearGradient>
        <linearGradient id="hgs-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.14" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Nền chung: quầng sáng + bóng đổ dưới chân vật thể. */
function Stage({ children }) {
  return (
    <svg
      viewBox="0 0 200 132"
      preserveAspectRatio="xMidYMid slice"
      className="hgs-art-svg"
      aria-hidden="true"
    >
      <rect width="200" height="132" fill="url(#hgs-glow)" />
      <ellipse cx="100" cy="116" rx="62" ry="10" fill="url(#hgs-shade)" />
      {children}
    </svg>
  );
}

/** Khối hộp giả lập phối cảnh: mặt trên, thân, mặt bên. */
function Slab({ x, y, w, h, d = 8, r = 6, fill = "url(#hgs-face)" }) {
  return (
    <g>
      <rect x={x + d * 0.5} y={y + d} width={w} height={h} rx={r} fill="#000" opacity="0.16" />
      <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} />
      <rect x={x} y={y} width={w} height={h * 0.42} rx={r} fill="#fff" opacity="0.28" />
    </g>
  );
}

// ── Cảnh của từng ứng dụng ────────────────────────────────────────────────
// Mỗi cảnh nói đúng app đó làm gì; đừng thay bằng hình chung chung, vì mảng
// hình chính là thứ người dùng nhận ra trước cả khi đọc tên.

const SCENES = {
  // Âm Thanh — loa nổi và sóng âm lan ra
  radio: (
    <>
      {[26, 40, 54].map((r, i) => (
        <path
          key={r}
          d={`M ${138} ${62 - r * 0.62} A ${r} ${r} 0 0 1 ${138} ${62 + r * 0.62}`}
          fill="none"
          stroke="#fff"
          strokeOpacity={0.5 - i * 0.13}
          strokeWidth="4"
          strokeLinecap="round"
        />
      ))}
      <Slab x={54} y={38} w={62} h={56} d={9} r={12} />
      <circle cx="85" cy="66" r="19" fill="#000" opacity="0.24" />
      <circle cx="85" cy="66" r="14" fill="url(#hgs-glass)" />
      <circle cx="85" cy="66" r="6" fill="#fff" opacity="0.9" />
      <circle cx="85" cy="48" r="4" fill="#fff" opacity="0.55" />
    </>
  ),

  // Trò Chơi — cần điều khiển và hai nút, nhìn chéo
  arcade: (
    <>
      <Slab x={44} y={52} w={112} h={44} d={10} r={16} />
      <ellipse cx="74" cy="66" rx="16" ry="8" fill="#000" opacity="0.2" />
      <rect x="71" y="40" width="6" height="26" rx="3" fill="#fff" opacity="0.75" />
      <circle cx="74" cy="38" r="12" fill="#f43f5e" />
      <circle cx="70" cy="34" r="4" fill="#fff" opacity="0.6" />
      <circle cx="120" cy="66" r="10" fill="#38bdf8" />
      <circle cx="117" cy="63" r="3" fill="#fff" opacity="0.65" />
      <circle cx="142" cy="76" r="8" fill="#fbbf24" />
      <circle cx="140" cy="74" r="2.5" fill="#fff" opacity="0.65" />
    </>
  ),

  // Tập Trung — vòng thở đồng tâm quanh một quả cầu
  aura: (
    <>
      {[46, 36, 26].map((r, i) => (
        <circle
          key={r}
          cx="100"
          cy="62"
          r={r}
          fill="none"
          stroke="#fff"
          strokeOpacity={0.16 + i * 0.12}
          strokeWidth="2"
        />
      ))}
      <circle cx="100" cy="62" r="18" fill="url(#hgs-glass)" />
      <circle cx="100" cy="62" r="18" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.5" />
      <circle cx="93" cy="55" r="6" fill="#fff" opacity="0.5" />
      <circle cx="146" cy="34" r="3" fill="#fff" opacity="0.6" />
      <circle cx="56" cy="88" r="2.5" fill="#fff" opacity="0.45" />
    </>
  ),

  // Học Tập — ba lớp cửa sổ mã xếp chồng theo chiều sâu
  ide: (
    <>
      <Slab x={38} y={30} w={104} h={62} d={0} r={9} fill="#fff" />
      <rect x="38" y="30" width="104" height="62" rx="9" fill="#fff" opacity="0.18" />
      <Slab x={50} y={40} w={104} h={62} d={9} r={9} />
      <circle cx="60" cy="50" r="3" fill="#f87171" />
      <circle cx="70" cy="50" r="3" fill="#fbbf24" />
      <circle cx="80" cy="50" r="3" fill="#34d399" />
      {[
        [60, 62, 46], [60, 71, 66], [68, 80, 40], [60, 89, 54],
      ].map(([x, y, w]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height="4" rx="2" fill="#0f172a" opacity="0.28" />
      ))}
    </>
  ),

  // Trang Bio — thẻ hồ sơ và các liên kết rơi xuống
  bio: (
    <>
      <Slab x={46} y={34} w={92} h={64} d={9} r={12} />
      <circle cx="70" cy="58" r="14" fill="#818cf8" />
      <circle cx="70" cy="53" r="5" fill="#fff" opacity="0.9" />
      <path d="M62 66 a8 8 0 0 1 16 0 Z" fill="#fff" opacity="0.9" />
      <rect x="92" y="50" width="36" height="5" rx="2.5" fill="#0f172a" opacity="0.3" />
      <rect x="92" y="60" width="26" height="5" rx="2.5" fill="#0f172a" opacity="0.18" />
      <rect x="60" y="80" width="68" height="8" rx="4" fill="#0f172a" opacity="0.12" />
      <circle cx="150" cy="40" r="9" fill="#fff" opacity="0.35" />
      <circle cx="40" cy="96" r="6" fill="#fff" opacity="0.28" />
    </>
  ),

  // Tâm Trí — vầng đầu và nhịp tim
  psychology: (
    <>
      <path
        d="M74 96 V72 a28 28 0 1 1 56 0 v6 h8 a5 5 0 0 1 0 10 h-8 v8 a8 8 0 0 1-8 8 Z"
        fill="url(#hgs-face)"
      />
      <path d="M74 96 V72 a28 28 0 0 1 14-24" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="2" />
      <path
        d="M84 66 h10 l5-10 6 20 5-12 h12"
        fill="none"
        stroke="#f43f5e"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="150" cy="44" r="5" fill="#fff" opacity="0.4" />
      <circle cx="52" cy="58" r="3.5" fill="#fff" opacity="0.32" />
    </>
  ),

  // Nhóm — ba người và những đường nối
  team: (
    <>
      <path d="M70 74 L100 56 L130 74" fill="none" stroke="#fff" strokeOpacity="0.42" strokeWidth="2.5" />
      {[[70, 78], [130, 78], [100, 52]].map(([cx, cy], i) => (
        <g key={cx}>
          <ellipse cx={cx} cy={cy + 18} rx="17" ry="6" fill="#000" opacity="0.16" />
          <circle cx={cx} cy={cy} r="16" fill="url(#hgs-face)" />
          <circle cx={cx} cy={cy - 4} r="6" fill={["#6366f1", "#14b8a6", "#f59e0b"][i]} />
          <path d={`M${cx - 9} ${cy + 12} a9 9 0 0 1 18 0 Z`} fill={["#6366f1", "#14b8a6", "#f59e0b"][i]} />
        </g>
      ))}
    </>
  ),

  // Công Cụ — mã QR và tệp
  handle: (
    <>
      <Slab x={48} y={36} w={62} h={62} d={9} r={10} />
      {[[56, 44], [88, 44], [56, 76]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="16" height="16" rx="4" fill="#0f172a" opacity="0.75" />
          <rect x={x + 5} y={y + 5} width="6" height="6" rx="1.5" fill="#fff" />
        </g>
      ))}
      {[[90, 78], [98, 86], [82, 86]].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="6" height="6" rx="1.5" fill="#0f172a" opacity="0.55" />
      ))}
      <Slab x={118} y={50} w={38} h={48} d={7} r={7} />
      <rect x="126" y="62" width="22" height="4" rx="2" fill="#0f172a" opacity="0.25" />
      <rect x="126" y="72" width="16" height="4" rx="2" fill="#0f172a" opacity="0.18" />
    </>
  ),

  // Hồ sơ — huy hiệu có dấu kiểm
  profile: (
    <>
      <path
        d="M100 26 L138 40 V70 c0 20-16 32-38 40-22-8-38-20-38-40V40 Z"
        fill="url(#hgs-face)"
      />
      <path d="M100 26 L138 40 V70 c0 8-3 15-8 21" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="2" />
      <path
        d="M84 66 l11 11 22-24"
        fill="none"
        stroke="#10b981"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="52" cy="44" r="4" fill="#fff" opacity="0.4" />
      <circle cx="152" cy="88" r="5" fill="#fff" opacity="0.3" />
    </>
  ),

  // Cờ Vua — bàn cờ nghiêng và quân vua
  arcade_chess: (
    <>
      <g transform="translate(100 82) scale(1 0.5) rotate(45) translate(-100 -82)">
        <rect x="66" y="48" width="68" height="68" fill="#fff" opacity="0.9" />
        {[0, 1, 2, 3].flatMap(r => [0, 1, 2, 3].map(c => (
          (r + c) % 2 === 0 ? (
            <rect key={`${r}-${c}`} x={66 + c * 17} y={48 + r * 17} width="17" height="17" fill="#0f172a" opacity="0.68" />
          ) : null
        )))}
      </g>
      <ellipse cx="100" cy="76" rx="15" ry="5" fill="#000" opacity="0.2" />
      <path d="M92 74 h16 l-3 -18 h-10 Z" fill="url(#hgs-face)" />
      <ellipse cx="100" cy="74" rx="10" ry="4" fill="#fff" />
      <circle cx="100" cy="50" r="8" fill="url(#hgs-face)" />
      <rect x="97" y="34" width="6" height="14" rx="2" fill="#fff" />
      <rect x="92" y="38" width="16" height="5" rx="2" fill="#fff" />
    </>
  ),

  // 2048 — các ô số xếp chồng
  arcade_2048: (
    <>
      <Slab x={46} y={62} w={44} h={40} d={8} r={8} />
      <Slab x={78} y={44} w={44} h={40} d={8} r={8} />
      <Slab x={110} y={26} w={44} h={40} d={8} r={8} />
      <text x="68" y="88" textAnchor="middle" fontSize="16" fontWeight="800" fill="#0f172a" opacity="0.55">2</text>
      <text x="100" y="70" textAnchor="middle" fontSize="16" fontWeight="800" fill="#0f172a" opacity="0.55">4</text>
      <text x="132" y="52" textAnchor="middle" fontSize="15" fontWeight="800" fill="#0f172a" opacity="0.6">8</text>
    </>
  ),

  // Cờ Caro — lưới với X và O
  arcade_caro: (
    <>
      <Slab x={52} y={30} w={96} h={72} d={9} r={10} />
      {[1, 2].map(i => (
        <g key={i}>
          <rect x={52 + i * 32} y="34" width="2" height="64" rx="1" fill="#0f172a" opacity="0.2" />
          <rect x="56" y={30 + i * 24} width="88" height="2" rx="1" fill="#0f172a" opacity="0.2" />
        </g>
      ))}
      <path d="M62 40 l12 12 M74 40 l-12 12" stroke="#f43f5e" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="100" cy="66" r="8" fill="none" stroke="#38bdf8" strokeWidth="4.5" />
      <path d="M126 72 l12 12 M138 72 l-12 12" stroke="#f43f5e" strokeWidth="4.5" strokeLinecap="round" />
    </>
  ),

  // Rắn 3D — thân rắn uốn theo phối cảnh và quả mồi
  arcade_snake: (
    <>
      <path
        d="M52 88 h30 a10 10 0 0 0 10-10 v-14 a10 10 0 0 1 10-10 h20"
        fill="none"
        stroke="#000"
        strokeOpacity="0.18"
        strokeWidth="18"
        strokeLinecap="round"
        transform="translate(3 5)"
      />
      <path
        d="M52 88 h30 a10 10 0 0 0 10-10 v-14 a10 10 0 0 1 10-10 h20"
        fill="none"
        stroke="url(#hgs-face)"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <circle cx="128" cy="54" r="12" fill="url(#hgs-face)" />
      <circle cx="132" cy="50" r="2.6" fill="#0f172a" />
      <circle cx="124" cy="50" r="2.6" fill="#0f172a" />
      <circle cx="152" cy="76" r="9" fill="#f43f5e" />
      <path d="M152 67 q4 -6 8 -5" stroke="#34d399" strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),

  // Sinh Tồn — phi thuyền, hành tinh có vành và sao
  arcade_survivor: (
    <>
      <circle cx="150" cy="38" r="18" fill="#fff" opacity="0.22" />
      <ellipse cx="150" cy="38" rx="28" ry="7" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="2.5" />
      <ellipse cx="92" cy="100" rx="16" ry="5" fill="#000" opacity="0.2" />
      <path d="M92 30 c14 12 20 30 20 46 h-40 c0-16 6-34 20-46 Z" fill="url(#hgs-face)" />
      <path d="M92 30 c-14 12-20 30-20 46 h12 c0-16 2-34 8-46 Z" fill="#fff" opacity="0.35" />
      <circle cx="92" cy="56" r="8" fill="#38bdf8" />
      <circle cx="89" cy="53" r="2.5" fill="#fff" opacity="0.8" />
      <path d="M72 76 l-12 14 h16 Z M112 76 l12 14 h-16 Z" fill="#f43f5e" />
      <path d="M86 90 q6 16 12 0 q-6 8 -12 0 Z" fill="#fbbf24" />
      {[[46, 34], [60, 62], [166, 96]].map(([cx, cy]) => (
        <circle key={cx} cx={cx} cy={cy} r="2.5" fill="#fff" opacity="0.6" />
      ))}
    </>
  ),
};

/** Cảnh dự phòng cho app chưa có hình riêng: ba khối xếp lớp. */
const FALLBACK = (
  <>
    <Slab x={54} y={58} w={40} h={40} d={8} r={10} />
    <Slab x={80} y={40} w={40} h={40} d={8} r={10} />
    <Slab x={106} y={58} w={40} h={40} d={8} r={10} />
  </>
);

export default function AppArt({ appId }) {
  return <Stage>{SCENES[appId] || FALLBACK}</Stage>;
}
