/**
 * Ảnh minh hoạ cho toàn bộ demo — vẽ 100% bằng SVG, không dùng file ảnh.
 *
 * Mỗi mặt hàng là một hình khối đơn giản đặt trên nền chuyển màu riêng, nên
 * demo không phụ thuộc ảnh chụp, không tốn băng thông và co giãn vô cấp.
 *
 * ponytail: hình vẽ tay bằng path cơ bản thay cho illustration chi tiết —
 * đủ nhận diện ở cỡ thẻ sản phẩm; cần đẹp hơn thì thay path, không đổi API.
 */

const P = {
  slate: ["#E9EDF5", "#C7D0E3"],
  ink: ["#2B303B", "#151922"],
  sand: ["#F6EADA", "#E4CDAA"],
  rose: ["#FBE4E6", "#F1BFC6"],
  mint: ["#DDF3E8", "#B2DEC9"],
  sky: ["#DEEBFB", "#B7D3F3"],
  gold: ["#F6E7BE", "#D9B44A"],
  cocoa: ["#EFE0D2", "#CDAE93"],
  violet: ["#EAE4FB", "#C7B8F0"],
  night: ["#1E2230", "#0B0E16"],
};

/* ---------------------------------------------------------------- hàng hoá */

const SHAPES = {
  sneaker: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
      <path d="M28 96c0-14 6-24 14-30l12 10 10-14 14 12c10 8 24 10 36 12 8 1 14 5 14 12v8H28z" fill={ink} fillOpacity=".14" />
      <path d="M26 104h102a8 8 0 0 1 8 8v6H34a8 8 0 0 1-8-8z" fill={ink} fillOpacity=".3" />
      <path d="M54 76 44 90M68 62 58 78M82 68 74 84" />
    </g>
  ),
  jacket: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <path d="M60 36h40l26 16-10 24-10-6v54H54V70l-10 6-10-24z" fill={ink} fillOpacity=".14" />
      <path d="M60 36l20 16 20-16" />
      <path d="M80 52v72" strokeDasharray="6 5" />
      <path d="M62 96h14M104 96h14" />
    </g>
  ),
  backpack: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <path d="M46 62a34 34 0 0 1 68 0v56a10 10 0 0 1-10 10H56a10 10 0 0 1-10-10z" fill={ink} fillOpacity=".14" />
      <path d="M62 62a18 18 0 0 1 36 0" />
      <rect x="62" y="92" width="36" height="24" rx="6" />
      <path d="M46 74H38v26h8M114 74h8v26h-8" />
    </g>
  ),
  watch: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <rect x="62" y="24" width="36" height="30" rx="10" fill={ink} fillOpacity=".2" />
      <rect x="62" y="106" width="36" height="30" rx="10" fill={ink} fillOpacity=".2" />
      <rect x="52" y="50" width="56" height="60" rx="16" fill={ink} fillOpacity=".14" />
      <path d="M80 66v16l12 8" strokeLinecap="round" />
    </g>
  ),
  earbuds: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <rect x="40" y="70" width="52" height="46" rx="14" fill={ink} fillOpacity=".14" />
      <path d="M52 70V60a14 14 0 0 1 28 0v10" />
      <path d="M106 44a16 16 0 0 1 16 16c0 10-6 14-6 24v22" strokeLinecap="round" />
      <circle cx="106" cy="44" r="10" fill={ink} fillOpacity=".3" />
    </g>
  ),
  cap: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <path d="M42 92a38 38 0 0 1 76 0z" fill={ink} fillOpacity=".16" />
      <path d="M118 92h18a8 8 0 0 1 0 16H42a8 8 0 0 1 0-16" fill={ink} fillOpacity=".28" />
      <path d="M80 54v38" />
    </g>
  ),
  glasses: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <rect x="26" y="62" width="44" height="34" rx="14" fill={ink} fillOpacity=".16" />
      <rect x="90" y="62" width="44" height="34" rx="14" fill={ink} fillOpacity=".16" />
      <path d="M70 74h20M26 70l-12-8M134 70l12-8" />
    </g>
  ),
  bottle: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <rect x="68" y="22" width="24" height="16" rx="5" fill={ink} fillOpacity=".3" />
      <path d="M70 38h20v10l10 12v70a8 8 0 0 1-8 8H68a8 8 0 0 1-8-8V60l10-12z" fill={ink} fillOpacity=".14" />
      <path d="M60 82h40" />
    </g>
  ),
  keyboard: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <rect x="22" y="52" width="116" height="56" rx="10" fill={ink} fillOpacity=".14" />
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3, 4, 5].map((col) => (
          <rect key={`${row}-${col}`} x={34 + col * 16} y={62 + row * 14} width="10" height="8" rx="2" fill={ink} fillOpacity=".3" stroke="none" />
        )),
      )}
    </g>
  ),
  lamp: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <path d="M52 62 80 26l28 36z" fill={ink} fillOpacity=".18" />
      <path d="M80 62v56" />
      <path d="M58 130h44a6 6 0 0 0-6-12H64a6 6 0 0 0-6 12z" fill={ink} fillOpacity=".28" />
    </g>
  ),
  speaker: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <rect x="46" y="26" width="68" height="108" rx="16" fill={ink} fillOpacity=".14" />
      <circle cx="80" cy="66" r="20" />
      <circle cx="80" cy="66" r="7" fill={ink} fillOpacity=".35" />
      <circle cx="80" cy="110" r="11" />
    </g>
  ),
  hoodie: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <path d="M56 40h48l24 18-8 22-10-5v54H50V75l-10 5-8-22z" fill={ink} fillOpacity=".14" />
      <path d="M58 40a22 22 0 0 0 44 0" />
      <path d="M62 96h36v18H62z" />
    </g>
  ),

  espresso: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <path d="M48 62h56l-6 40a16 16 0 0 1-16 14H70a16 16 0 0 1-16-14z" fill={ink} fillOpacity=".18" />
      <path d="M104 70h10a12 12 0 0 1 0 24h-12" />
      <ellipse cx="76" cy="126" rx="46" ry="8" fill={ink} fillOpacity=".22" stroke="none" />
      <path d="M68 42c0-6 8-6 8-12M84 42c0-6 8-6 8-12" strokeLinecap="round" />
    </g>
  ),
  latte: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <path d="M44 52h64l-8 62a14 14 0 0 1-14 12H66a14 14 0 0 1-14-12z" fill={ink} fillOpacity=".16" />
      <path d="M52 68h48" />
      <path d="M76 82c-8 4-8 14 0 18 8-4 8-14 0-18z" fill={ink} fillOpacity=".35" />
    </g>
  ),
  coldbrew: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <path d="M50 36h60l-8 96a10 10 0 0 1-10 9H68a10 10 0 0 1-10-9z" fill={ink} fillOpacity=".16" />
      <path d="M56 72h48" />
      <rect x="64" y="82" width="18" height="18" rx="4" fill={ink} fillOpacity=".3" />
      <rect x="86" y="98" width="16" height="16" rx="4" fill={ink} fillOpacity=".3" />
      <path d="M96 36 112 16" strokeLinecap="round" />
    </g>
  ),
  tea: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <path d="M52 40h56l-6 92a10 10 0 0 1-10 9H68a10 10 0 0 1-10-9z" fill={ink} fillOpacity=".16" />
      <circle cx="72" cy="84" r="12" fill={ink} fillOpacity=".3" />
      <circle cx="92" cy="106" r="9" fill={ink} fillOpacity=".24" />
      <path d="M58 66h44" />
    </g>
  ),
  matcha: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <path d="M46 66h68v34a24 24 0 0 1-24 24H70a24 24 0 0 1-24-24z" fill={ink} fillOpacity=".18" />
      <path d="M46 78h68" />
      <path d="M96 30v26M104 34v22M112 40v16" strokeLinecap="round" />
    </g>
  ),
  croissant: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <path d="M26 96c14-34 54-52 88-42 12 4 18 14 16 24-2 12-16 18-30 16 6 10 2 22-10 26-24 8-56-2-64-24z" fill={ink} fillOpacity=".18" />
      <path d="M58 74c4 12 6 24 4 36M84 66c2 14 2 26-2 38" />
    </g>
  ),
  tiramisu: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <path d="M36 62h88v52a10 10 0 0 1-10 10H46a10 10 0 0 1-10-10z" fill={ink} fillOpacity=".16" />
      <path d="M36 80h88M36 98h88" />
      <path d="M36 62l44-22 44 22" fill={ink} fillOpacity=".3" />
      <circle cx="66" cy="54" r="3" fill={ink} stroke="none" />
      <circle cx="92" cy="50" r="3" fill={ink} stroke="none" />
    </g>
  ),

  goldbar: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <path d="M44 58h72l14 56H30z" fill={ink} fillOpacity=".2" />
      <path d="M44 58l8-16h56l8 16" fill={ink} fillOpacity=".12" />
      <path d="M56 76h48M52 94h56" />
    </g>
  ),
  ring: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <circle cx="80" cy="98" r="34" fill={ink} fillOpacity=".12" />
      <path d="M64 52h32l12 18-28 22-28-22z" fill={ink} fillOpacity=".3" />
      <path d="M64 52 80 92 96 52M52 70h56" />
    </g>
  ),
  necklace: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <path d="M34 34c0 44 20 66 46 66s46-22 46-66" />
      <path d="M80 100l-14 20 14 20 14-20z" fill={ink} fillOpacity=".3" />
    </g>
  ),
  earring: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <path d="M54 32v18a14 14 0 0 0 28 0" />
      <circle cx="54" cy="90" r="18" fill={ink} fillOpacity=".22" />
      <path d="M110 34v18a12 12 0 0 1-24 0" />
      <circle cx="110" cy="86" r="14" fill={ink} fillOpacity=".22" />
    </g>
  ),
  bracelet: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <ellipse cx="80" cy="80" rx="46" ry="34" fill={ink} fillOpacity=".1" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => {
        const angle = (index / 8) * Math.PI * 2;
        return <circle key={index} cx={80 + Math.cos(angle) * 46} cy={80 + Math.sin(angle) * 34} r="7" fill={ink} fillOpacity=".3" />;
      })}
    </g>
  ),
  coin: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <circle cx="80" cy="80" r="44" fill={ink} fillOpacity=".16" />
      <circle cx="80" cy="80" r="30" />
      <path d="m80 62 6 14 15 1-11 10 3 15-13-8-13 8 3-15-11-10 15-1z" fill={ink} fillOpacity=".35" stroke="none" />
    </g>
  ),

  portrait: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <circle cx="80" cy="62" r="24" fill={ink} fillOpacity=".24" />
      <path d="M34 136c0-26 20-42 46-42s46 16 46 42z" fill={ink} fillOpacity=".18" />
    </g>
  ),
  street: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <path d="M20 132h120" />
      <rect x="28" y="60" width="26" height="72" fill={ink} fillOpacity=".2" />
      <rect x="64" y="36" width="30" height="96" fill={ink} fillOpacity=".26" />
      <rect x="104" y="74" width="28" height="58" fill={ink} fillOpacity=".18" />
      <circle cx="118" cy="34" r="12" fill={ink} fillOpacity=".3" stroke="none" />
    </g>
  ),
  nature: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <path d="M18 128 60 66l26 34 16-20 42 48z" fill={ink} fillOpacity=".22" />
      <circle cx="46" cy="42" r="14" fill={ink} fillOpacity=".3" stroke="none" />
    </g>
  ),
  still: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <rect x="30" y="86" width="42" height="46" rx="8" fill={ink} fillOpacity=".2" />
      <circle cx="104" cy="106" r="26" fill={ink} fillOpacity=".24" />
      <path d="M20 132h120" />
    </g>
  ),
  fashion: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <path d="M60 30h40l18 22-14 12v62H56V64L42 52z" fill={ink} fillOpacity=".2" />
      <path d="M70 84h20" />
    </g>
  ),
  studio: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <path d="M40 40h44l16 22H40z" fill={ink} fillOpacity=".28" />
      <path d="M62 62v62M40 130h44" />
      <circle cx="116" cy="88" r="20" fill={ink} fillOpacity=".2" />
    </g>
  ),

  screen: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <rect x="22" y="34" width="116" height="76" rx="8" fill={ink} fillOpacity=".14" />
      <path d="M22 54h116" />
      <rect x="32" y="64" width="40" height="36" rx="4" fill={ink} fillOpacity=".26" stroke="none" />
      <rect x="80" y="64" width="48" height="8" rx="4" fill={ink} fillOpacity=".26" stroke="none" />
      <rect x="80" y="80" width="34" height="8" rx="4" fill={ink} fillOpacity=".2" stroke="none" />
      <path d="M62 122h36" />
    </g>
  ),
  chart: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <rect x="22" y="28" width="116" height="104" rx="10" fill={ink} fillOpacity=".12" />
      <rect x="38" y="86" width="16" height="30" rx="4" fill={ink} fillOpacity=".3" stroke="none" />
      <rect x="62" y="66" width="16" height="50" rx="4" fill={ink} fillOpacity=".34" stroke="none" />
      <rect x="86" y="76" width="16" height="40" rx="4" fill={ink} fillOpacity=".3" stroke="none" />
      <rect x="110" y="48" width="16" height="68" rx="4" fill={ink} fillOpacity=".4" stroke="none" />
    </g>
  ),
  cart: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <path d="M28 38h16l14 58h58l14-40H54" />
      <circle cx="66" cy="118" r="10" fill={ink} fillOpacity=".3" />
      <circle cx="112" cy="118" r="10" fill={ink} fillOpacity=".3" />
    </g>
  ),
  news: (ink) => (
    <g fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round">
      <rect x="26" y="30" width="108" height="100" rx="8" fill={ink} fillOpacity=".12" />
      <rect x="38" y="44" width="46" height="34" rx="4" fill={ink} fillOpacity=".28" stroke="none" />
      <path d="M94 48h28M94 62h28M38 92h84M38 108h60" />
    </g>
  ),
};

const KIND_PALETTE = {
  sneaker: P.sky, jacket: P.slate, backpack: P.ink, watch: P.slate, earbuds: P.violet,
  cap: P.mint, glasses: P.sand, bottle: P.sky, keyboard: P.slate, lamp: P.sand,
  speaker: P.ink, hoodie: P.rose,
  espresso: P.cocoa, latte: P.sand, coldbrew: P.sand, tea: P.rose, matcha: P.mint,
  croissant: P.sand, tiramisu: P.cocoa,
  goldbar: P.gold, ring: P.gold, necklace: P.gold, earring: P.gold, bracelet: P.gold, coin: P.gold,
  portrait: P.night, street: P.night, nature: P.night, still: P.night, fashion: P.night, studio: P.night,
  screen: P.slate, chart: P.mint, cart: P.sky, news: P.rose,
};

const DARK_ART = new Set(["portrait", "street", "nature", "still", "fashion", "studio", "backpack", "speaker"]);

/**
 * Ảnh sản phẩm/ảnh minh hoạ.
 * @param kind  tên hình trong SHAPES
 * @param ratio "square" | "wide" | "tall"
 */
export function Art({ kind, className = "", ratio = "square", rounded = "0" }) {
  const shape = SHAPES[kind] || SHAPES.screen;
  const [from, to] = KIND_PALETTE[kind] || P.slate;
  const ink = DARK_ART.has(kind) ? "#FFFFFF" : "#1B2230";
  const id = `art-${kind}`;
  const viewBox = ratio === "wide" ? "0 20 160 120" : ratio === "tall" ? "20 0 120 160" : "0 0 160 160";

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid slice"
      className={`block h-full w-full ${className}`}
      style={{ borderRadius: rounded }}
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="160" height="160" fill={`url(#${id})`} />
      <circle cx="130" cy="26" r="34" fill={ink} opacity=".07" />
      <circle cx="24" cy="140" r="28" fill={ink} opacity=".05" />
      {shape(ink)}
    </svg>
  );
}

/** Ảnh bìa trừu tượng cho hero — dải màu + lưới mảnh. */
export function HeroArt({ from = "#1B2230", to = "#3A4257", className = "" }) {
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className={`block h-full w-full ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id="hero-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="url(#hero-bg)" />
      <circle cx="330" cy="40" r="90" fill="#fff" opacity=".08" />
      <circle cx="70" cy="190" r="70" fill="#fff" opacity=".06" />
      <path d="M0 150c60-40 120 20 200-10s140 10 200-30v90H0z" fill="#fff" opacity=".07" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
        <rect key={index} x={index * 50 + 6} y="0" width="1" height="200" fill="#fff" opacity=".05" />
      ))}
    </svg>
  );
}

/** Avatar chữ cái — thay ảnh chân dung thật trong danh sách đánh giá. */
export function Avatar({ name = "?", size = 40, tint = "#8E8E93" }) {
  const initials = name.trim().split(/\s+/).slice(-2).map((word) => word[0]).join("").toUpperCase();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: tint, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
