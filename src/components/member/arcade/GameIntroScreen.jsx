import { useTranslation } from "react-i18next";
import "./game-intro.css";

const GAME_META = {
  pinball: { icon: "disc_full", detail: "2.5D HYBRID", badge: "PINBALL 3D" },
  chess: { icon: "castle", detail: "8 × 8", badge: "BOT · LOCAL" },
  survivor: { icon: "rocket_launch", detail: "SPACE WARS", badge: "3D BATTLE" },
  "2048": {
    icon: "auto_awesome",
    detail: "4 × 4",
    badge: "JELLY MONSTER",
    fact2Title: "20 CẤP",
    fact2Desc: "TIẾN HÓA",
  },
  caro: { icon: "close", detail: "5 IN ROW", badge: "10 × 10" },
  snake: {
    icon: "emoji_nature",
    detail: "HOẠT HÌNH 3D",
    badge: "BÉ RẮN THẦN KỲ",
    fact2Title: "5 CHƯƠNG",
    fact2Desc: "CỐT TRUYỆN",
  },
};

function JellyPileArtwork() {
  return (
    <div className="intro-art intro-art--2048" aria-hidden="true">
      <div className="jelly-pile-stage">
        <svg
          viewBox="0 0 520 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="jelly-pile-svg"
        >
          <defs>
            <linearGradient id="jellyPurple" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="25%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#7e22ce" />
            </linearGradient>

            <linearGradient id="jellyPink" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="35%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#be185d" />
            </linearGradient>

            <linearGradient id="jellyCoral" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="35%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#be123c" />
            </linearGradient>

            <linearGradient id="jellyLime" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a3e635" />
              <stop offset="40%" stopColor="#84cc16" />
              <stop offset="100%" stopColor="#4d7c0f" />
            </linearGradient>

            <linearGradient id="jellyMint" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5eead4" />
              <stop offset="35%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#0f766e" />
            </linearGradient>

            <linearGradient id="jellyCyan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="35%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>

            <linearGradient id="jellyOrange" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="35%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>

            <linearGradient id="jellyPlum" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="35%" stopColor="#9333ea" />
              <stop offset="100%" stopColor="#581c87" />
            </linearGradient>

            <linearGradient id="jellyLavender" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a5b4fc" />
              <stop offset="35%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4338ca" />
            </linearGradient>

            <linearGradient id="jellyYellow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="35%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#a16207" />
            </linearGradient>

            <filter id="jellyShadow" x="-20%" y="-20%" width="150%" height="150%">
              <feDropShadow dx="0" dy="8" stdDeviation="6" floodOpacity="0.25" floodColor="#000000" />
            </filter>
            <filter id="jellyHeroShadow" x="-25%" y="-25%" width="160%" height="160%">
              <feDropShadow dx="0" dy="12" stdDeviation="8" floodOpacity="0.32" floodColor="#000000" />
            </filter>
          </defs>

          {/* 1. Yellow Jelly (Top-Right Back) */}
          <g transform="translate(390, 48) rotate(22)" filter="url(#jellyShadow)">
            <rect width="82" height="82" rx="18" fill="url(#jellyYellow)" />
            <rect x="10" y="7" width="62" height="8" rx="4" fill="white" opacity="0.45" />
            <ellipse cx="32" cy="46" rx="10" ry="14" fill="white" />
            <ellipse cx="30" cy="48" rx="6" ry="8" fill="#111" />
            <circle cx="28" cy="44" r="2.2" fill="white" />
          </g>

          {/* 2. Mint Turquoise Jelly (Top-Center Back) */}
          <g transform="translate(182, 16) rotate(-4)" filter="url(#jellyShadow)">
            <rect width="90" height="90" rx="20" fill="url(#jellyMint)" />
            <rect x="10" y="7" width="70" height="9" rx="4.5" fill="white" opacity="0.45" />
            <circle cx="36" cy="45" r="4.5" fill="#042f2e" />
            <circle cx="56" cy="45" r="4.5" fill="#042f2e" />
            <circle cx="26" cy="52" r="5" fill="#f43f5e" opacity="0.45" />
            <circle cx="66" cy="52" r="5" fill="#f43f5e" opacity="0.45" />
          </g>

          {/* 3. Warm Orange Jelly (Top-Center-Right Back) */}
          <g transform="translate(280, 24) rotate(8)" filter="url(#jellyShadow)">
            <rect width="94" height="94" rx="20" fill="url(#jellyOrange)" />
            <rect x="10" y="7" width="74" height="9" rx="4.5" fill="white" opacity="0.45" />
            <circle cx="35" cy="46" r="9" fill="white" />
            <circle cx="35" cy="49" r="5.5" fill="#111" />
            <circle cx="33" cy="47" r="2" fill="white" />
            <circle cx="65" cy="46" r="9" fill="white" />
            <circle cx="65" cy="49" r="5.5" fill="#111" />
            <circle cx="63" cy="47" r="2" fill="white" />
          </g>

          {/* 4. Lavender / Periwinkle Jelly (Top-Left Back) */}
          <g transform="translate(132, 42) rotate(-14)" filter="url(#jellyShadow)">
            <rect width="86" height="86" rx="19" fill="url(#jellyLavender)" />
            <rect x="9" y="6" width="68" height="8" rx="4" fill="white" opacity="0.45" />
            <circle cx="25" cy="44" r="6.5" fill="white" />
            <circle cx="25" cy="45" r="4" fill="#1e1b4b" />
            <circle cx="43" cy="42" r="6.5" fill="white" />
            <circle cx="43" cy="43" r="4" fill="#1e1b4b" />
            <circle cx="61" cy="44" r="6.5" fill="white" />
            <circle cx="61" cy="45" r="4" fill="#1e1b4b" />
            <rect x="36" y="58" width="14" height="8" rx="4" fill="#1e1b4b" />
            <rect x="41" y="58" width="4" height="3" rx="1" fill="white" />
          </g>

          {/* 5. Lime Green Jelly (Left-Far) */}
          <g transform="translate(18, 112) rotate(-22)" filter="url(#jellyShadow)">
            <rect width="95" height="95" rx="22" fill="url(#jellyLime)" />
            <rect x="10" y="7" width="75" height="9" rx="4.5" fill="white" opacity="0.45" />
            <circle cx="34" cy="46" r="8" fill="white" />
            <circle cx="34" cy="42" r="4.5" fill="#111" />
            <circle cx="32" cy="40" r="1.8" fill="white" />
            <circle cx="65" cy="48" r="8" fill="white" />
            <circle cx="65" cy="44" r="4.5" fill="#111" />
            <circle cx="63" cy="42" r="1.8" fill="white" />
            <path d="M 38 68 Q 50 78 62 68" stroke="#1a2e05" strokeWidth="4" strokeLinecap="round" fill="none" />
            <rect x="44" y="66" width="4" height="4" rx="1" fill="white" />
            <rect x="52" y="66" width="4" height="4" rx="1" fill="white" />
          </g>

          {/* 6. Coral Pink Jelly (Left-Middle) */}
          <g transform="translate(68, 60) rotate(-8)" filter="url(#jellyShadow)">
            <rect width="96" height="96" rx="22" fill="url(#jellyCoral)" />
            <rect x="10" y="7" width="76" height="9" rx="4.5" fill="white" opacity="0.45" />
            <circle cx="30" cy="44" r="9.5" fill="white" />
            <circle cx="31" cy="44" r="6" fill="#111" />
            <circle cx="29" cy="42" r="2.2" fill="white" />
            <circle cx="66" cy="42" r="9.5" fill="white" />
            <circle cx="65" cy="42" r="6" fill="#111" />
            <circle cx="63" cy="40" r="2.2" fill="white" />
            <path d="M 38 62 Q 48 74 58 62" stroke="#4c0519" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <rect x="46" y="62" width="5" height="4" rx="1" fill="white" />
          </g>

          {/* 7. Plum/Deep Violet Jelly (Right-Middle) */}
          <g transform="translate(340, 75) rotate(14)" filter="url(#jellyShadow)">
            <rect width="100" height="100" rx="23" fill="url(#jellyPlum)" />
            <rect x="10" y="7" width="80" height="9" rx="4.5" fill="white" opacity="0.45" />
            <circle cx="44" cy="50" r="14" fill="white" />
            <circle cx="42" cy="51" r="8" fill="#111" />
            <circle cx="39" cy="47" r="3" fill="white" />
            <path d="M 34 76 Q 44 70 54 76 Q 64 82 72 76" stroke="#2e1065" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <rect x="45" y="74" width="5" height="5" rx="1.5" fill="white" />
          </g>

          {/* 8. Bright Cyan Jelly (Right-Bottom) */}
          <g transform="translate(385, 118) rotate(7)" filter="url(#jellyShadow)">
            <rect width="96" height="96" rx="22" fill="url(#jellyCyan)" />
            <rect x="10" y="7" width="76" height="9" rx="4.5" fill="white" opacity="0.45" />
            <circle cx="34" cy="44" r="8.5" fill="white" />
            <circle cx="37" cy="44" r="5" fill="#082f49" />
            <circle cx="35" cy="42" r="1.8" fill="white" />
            <circle cx="68" cy="42" r="8.5" fill="white" />
            <circle cx="71" cy="42" r="5" fill="#082f49" />
            <circle cx="69" cy="40" r="1.8" fill="white" />
            <rect x="44" y="66" width="18" height="12" rx="6" fill="#082f49" />
            <rect x="50" y="66" width="5" height="4" rx="1" fill="white" />
          </g>

          {/* 9. Avocado Green Buddy (Bottom-Right Under Hero) */}
          <g transform="translate(325, 160) rotate(-6)" filter="url(#jellyShadow)">
            <rect width="94" height="90" rx="22" fill="url(#jellyLime)" />
            <rect x="10" y="7" width="74" height="9" rx="4.5" fill="white" opacity="0.45" />
            <circle cx="34" cy="40" r="7.5" fill="white" />
            <circle cx="34" cy="37" r="4" fill="#14532d" />
            <circle cx="64" cy="40" r="7.5" fill="white" />
            <circle cx="64" cy="37" r="4" fill="#14532d" />
            <rect x="42" y="60" width="18" height="11" rx="5.5" fill="#14532d" />
            <rect x="48" y="60" width="5" height="4" rx="1" fill="white" />
          </g>

          {/* 10. Bubblegum Pink Jelly (Left-Front) */}
          <g transform="translate(85, 105) rotate(-16)" filter="url(#jellyHeroShadow)">
            <rect width="112" height="112" rx="26" fill="url(#jellyPink)" />
            <rect x="12" y="8" width="88" height="12" rx="6" fill="white" opacity="0.45" />
            <g>
              <ellipse cx="35" cy="56" rx="17" ry="18" fill="white" />
              <ellipse cx="37" cy="57" rx="12" ry="13" fill="#0284c7" />
              <ellipse cx="39" cy="58" rx="8" ry="9" fill="#082f49" />
              <circle cx="33" cy="51" r="4" fill="white" />
              <circle cx="42" cy="64" r="1.8" fill="white" />
            </g>
            <g>
              <ellipse cx="80" cy="52" rx="16" ry="17" fill="white" />
              <ellipse cx="79" cy="53" rx="11" ry="12" fill="#0284c7" />
              <ellipse cx="78" cy="54" rx="7" ry="8" fill="#082f49" />
              <circle cx="75" cy="47" r="3.5" fill="white" />
              <circle cx="83" cy="60" r="1.6" fill="white" />
            </g>
            <rect x="50" y="78" width="18" height="14" rx="7" fill="#500724" />
            <rect x="56" y="78" width="6" height="5" rx="1.5" fill="white" />
          </g>

          {/* 11. HERO PURPLE JELLY (Center-Front Signature Block) */}
          <g transform="translate(178, 68) rotate(-1)" filter="url(#jellyHeroShadow)">
            <rect width="162" height="156" rx="34" fill="url(#jellyPurple)" />
            <rect x="18" y="11" width="126" height="15" rx="7.5" fill="white" opacity="0.42" />

            <g>
              <rect x="42" y="58" width="24" height="42" rx="12" fill="white" />
              <ellipse cx="53" cy="83" rx="8.5" ry="9.5" fill="#0f172a" />
              <circle cx="51" cy="79" r="2.8" fill="white" />
            </g>
            <g>
              <rect x="94" y="68" width="22" height="38" rx="11" fill="white" />
              <ellipse cx="104" cy="90" rx="8" ry="9" fill="#0f172a" />
              <circle cx="102" cy="86" r="2.6" fill="white" />
            </g>

            <rect x="63" y="112" width="36" height="24" rx="12" fill="#3b0764" />
            <rect x="74" y="112" width="8" height="9" rx="2" fill="white" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function CartoonSnakeArtwork() {
  return (
    <div className="intro-art intro-art--snake" aria-hidden="true">
      <div className="snake-fruit-stage" style={{ width: "100%", maxWidth: "460px", margin: "0 auto" }}>
        <svg
          viewBox="0 0 460 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto drop-shadow-xl"
        >
          <defs>
            {/* Sunburst Glow */}
            <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#fde047" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
            </radialGradient>

            {/* Snake Body Blue */}
            <linearGradient id="snakeBlue" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="40%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            {/* Snake Belly Cyan */}
            <linearGradient id="snakeBelly" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#bae6fd" />
            </linearGradient>

            {/* Kiwi Gradient */}
            <radialGradient id="kiwiPulp" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef9c3" />
              <stop offset="30%" stopColor="#86efac" />
              <stop offset="85%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#15803d" />
            </radialGradient>

            {/* Strawberry Gradient */}
            <linearGradient id="berryRed" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="40%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#9f1239" />
            </linearGradient>

            {/* Donut Glaze Pink */}
            <linearGradient id="donutPink" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fbcfe8" />
              <stop offset="50%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#db2777" />
            </linearGradient>

            {/* Shadow Filter */}
            <filter id="fruitShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.22" floodColor="#713f12" />
            </filter>
          </defs>

          {/* Vầng hào quang mặt trời nắng ấm */}
          <circle cx="230" cy="130" r="125" fill="url(#sunGlow)" />

          {/* Tia nắng tỏa tròn */}
          <g stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" opacity="0.4">
            <line x1="230" y1="15" x2="230" y2="35" />
            <line x1="330" y1="40" x2="315" y2="55" />
            <line x1="365" y1="130" x2="345" y2="130" />
            <line x1="330" y1="215" x2="315" y2="200" />
            <line x1="230" y1="245" x2="230" y2="225" />
            <line x1="130" y1="215" x2="145" y2="200" />
            <line x1="95" y1="130" x2="115" y2="130" />
            <line x1="130" y1="40" x2="145" y2="55" />
          </g>

          {/* 1. BÁNH DONUT KEM DÂU (Góc Trái Dưới) */}
          <g transform="translate(68, 145) rotate(-12)" filter="url(#fruitShadow)">
            <ellipse cx="42" cy="42" rx="38" ry="32" fill="#d97706" />
            <ellipse cx="42" cy="40" rx="36" ry="30" fill="url(#donutPink)" />
            {/* Lỗ donut */}
            <ellipse cx="42" cy="40" rx="14" ry="11" fill="#fef08a" />
            {/* Hạt kẹo cốm rắc */}
            <rect x="24" y="26" width="7" height="3" rx="1.5" fill="#38bdf8" transform="rotate(25 24 26)" />
            <rect x="52" y="24" width="7" height="3" rx="1.5" fill="#fde047" transform="rotate(-30 52 24)" />
            <rect x="22" y="44" width="7" height="3" rx="1.5" fill="#ffffff" transform="rotate(15 22 44)" />
            <rect x="56" y="46" width="7" height="3" rx="1.5" fill="#4ade80" transform="rotate(-45 56 46)" />
            <rect x="38" y="58" width="7" height="3" rx="1.5" fill="#c084fc" transform="rotate(10 38 58)" />
          </g>

          {/* 2. DÂU TÂY MỌNG NƯỚC (Góc Phải) */}
          <g transform="translate(340, 95) rotate(15)" filter="url(#fruitShadow)">
            <path d="M 42 12 C 65 12 75 35 68 62 C 62 82 46 95 42 96 C 38 95 22 82 16 62 C 9 35 19 12 42 12 Z" fill="url(#berryRed)" />
            {/* Chùm lá đài xanh */}
            <path d="M 42 16 L 35 2 L 40 14 L 42 0 L 44 14 L 49 2 L 42 16 Z" fill="#22c55e" />
            <path d="M 42 16 L 22 10 L 36 18 L 18 24 L 35 22 Z" fill="#16a34a" />
            <path d="M 42 16 L 62 10 L 48 18 L 66 24 L 49 22 Z" fill="#16a34a" />
            {/* Chấm hạt vàng */}
            <circle cx="34" cy="36" r="1.8" fill="#fef08a" />
            <circle cx="48" cy="38" r="1.8" fill="#fef08a" />
            <circle cx="40" cy="52" r="1.8" fill="#fef08a" />
            <circle cx="28" cy="62" r="1.8" fill="#fef08a" />
            <circle cx="52" cy="64" r="1.8" fill="#fef08a" />
            <circle cx="42" cy="78" r="1.8" fill="#fef08a" />
          </g>

          {/* 3. LÁT CHUỐI & VIỆT QUẤT (Phụ họa) */}
          <g transform="translate(95, 45)" filter="url(#fruitShadow)">
            <ellipse cx="22" cy="22" rx="20" ry="18" fill="#fef08a" />
            <ellipse cx="22" cy="22" rx="17" ry="15" fill="#facc15" />
            <circle cx="22" cy="22" r="3" fill="#854d0e" />
          </g>
          <g transform="translate(325, 40)" filter="url(#fruitShadow)">
            <circle cx="16" cy="16" r="15" fill="#0284c7" />
            <circle cx="16" cy="16" r="13" fill="#0369a1" />
            <path d="M 16 6 L 18 10 L 22 9 L 19 12 L 21 16 L 16 13 L 11 16 L 13 12 L 10 9 L 14 10 Z" fill="#0c4a6e" />
          </g>

          {/* 4. THÂN BÉ RẮN XANH UỐN LƯỢN (S-Curve Body) */}
          <g filter="url(#fruitShadow)">
            {/* Đuôi và thân sau uốn vòng */}
            <path
              d="M 130 195 C 95 155 110 85 185 65 C 265 45 320 85 305 155 C 295 200 240 220 185 205 C 150 195 140 165 155 140"
              stroke="url(#snakeBlue)"
              strokeWidth="48"
              strokeLinecap="round"
              fill="none"
            />
            {/* Vệt bụng nhạt viền theo thân */}
            <path
              d="M 135 195 C 105 160 118 95 185 75 C 255 58 305 92 295 150"
              stroke="url(#snakeBelly)"
              strokeWidth="16"
              strokeLinecap="round"
              fill="none"
              opacity="0.85"
            />
          </g>

          {/* 5. NỬA QUẢ KIWI CẮT LÁT ÔM TRƯỚC NGỰC BÉ RẮN */}
          <g transform="translate(182, 130)" filter="url(#fruitShadow)">
            <ellipse cx="44" cy="44" rx="42" ry="38" fill="#78350f" />
            <ellipse cx="44" cy="42" rx="39" ry="35" fill="url(#kiwiPulp)" />
            {/* Lõi kem */}
            <ellipse cx="44" cy="42" rx="11" ry="9" fill="#fef9c3" />
            {/* Hạt kiwi */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const hx = 44 + Math.cos(rad) * 20;
              const hy = 42 + Math.sin(rad) * 17;
              return <circle key={deg} cx={hx} cy={hy} r="1.8" fill="#1c1917" />;
            })}
          </g>

          {/* 6. ĐẦU BÉ RẮN HOẠT HÌNH SIÊU CUTE (Cute Snake Head) */}
          <g transform="translate(205, 52)" filter="url(#fruitShadow)">
            {/* Sọ đầu bầu bĩnh */}
            <ellipse cx="52" cy="48" rx="46" ry="42" fill="url(#snakeBlue)" />
            {/* Cằm bụng dưới */}
            <ellipse cx="52" cy="72" rx="34" ry="20" fill="url(#snakeBelly)" />

            {/* Má hồng đào */}
            <circle cx="20" cy="58" r="9" fill="#f43f5e" opacity="0.5" />
            <circle cx="84" cy="58" r="9" fill="#f43f5e" opacity="0.5" />

            {/* Mắt Trái */}
            <ellipse cx="34" cy="38" rx="14" ry="17" fill="#ffffff" />
            <ellipse cx="36" cy="40" rx="9" ry="12" fill="#0284c7" />
            <ellipse cx="37" cy="41" rx="6" ry="8" fill="#09090b" />
            <circle cx="34" cy="35" r="3.2" fill="#ffffff" />
            <circle cx="40" cy="44" r="1.6" fill="#ffffff" />

            {/* Mắt Phải */}
            <ellipse cx="70" cy="38" rx="14" ry="17" fill="#ffffff" />
            <ellipse cx="68" cy="40" rx="9" ry="12" fill="#0284c7" />
            <ellipse cx="67" cy="41" rx="6" ry="8" fill="#09090b" />
            <circle cx="65" cy="35" r="3.2" fill="#ffffff" />
            <circle cx="71" cy="44" r="1.6" fill="#ffffff" />

            {/* Miệng cười há to vui mừng */}
            <path d="M 36 62 Q 52 82 68 62" stroke="#be123c" strokeWidth="3" fill="#be123c" />
            {/* Lưỡi hồng thè ra */}
            <path d="M 47 70 C 47 78 57 78 57 70 Z" fill="#fb7185" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function SpaceWarsArtwork() {
  return (
    <div className="intro-art intro-art--survivor relative overflow-hidden" aria-hidden="true">
      <div className="w-full h-full flex items-center justify-center p-2 relative">
        <svg viewBox="0 0 240 240" className="w-full h-full drop-shadow-2xl">
          <defs>
            <radialGradient id="nebulaGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
              <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="laserGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#00f0ff" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="tieLaser" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
            <linearGradient id="shipBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <linearGradient id="planetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="60%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#0c4a6e" />
            </linearGradient>
          </defs>

          {/* Vũ trụ sâu thẳm & Tinh vân */}
          <circle cx="120" cy="120" r="105" fill="url(#nebulaGlow)" />
          <circle cx="45" cy="40" r="1.5" fill="#ffffff" opacity="0.8" />
          <circle cx="195" cy="55" r="1.2" fill="#38bdf8" opacity="0.9" />
          <circle cx="30" cy="160" r="1.6" fill="#fde047" opacity="0.75" />
          <circle cx="210" cy="175" r="1.4" fill="#ffffff" opacity="0.8" />
          <circle cx="150" cy="25" r="1.8" fill="#c084fc" opacity="0.85" />

          {/* Hành tinh khí với vành đai */}
          <g transform="translate(165, 65)">
            <ellipse cx="0" cy="0" rx="36" ry="12" fill="none" stroke="#38bdf8" strokeWidth="2.5" opacity="0.6" transform="rotate(-25)" />
            <circle cx="0" cy="0" r="20" fill="url(#planetGrad)" />
            <ellipse cx="0" cy="0" rx="36" ry="12" fill="none" stroke="#7dd3fc" strokeWidth="1.2" opacity="0.8" strokeDasharray="3 2" transform="rotate(-25)" />
          </g>

          {/* Tiêm kích địch TIE Fighter đằng xa */}
          <g transform="translate(60, 75) scale(0.65)">
            <rect x="-16" y="-18" width="4" height="36" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
            <rect x="12" y="-18" width="4" height="36" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
            <circle cx="0" cy="0" r="9" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="4.5" fill="#22c55e" opacity="0.8" />
            <line x1="-3" y1="12" x2="-8" y2="40" stroke="url(#tieLaser)" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* Cổng Hyperdrive Warp Ring */}
          <ellipse cx="120" cy="115" rx="85" ry="40" fill="none" stroke="#ef4444" strokeWidth="3.5" opacity="0.45" strokeDasharray="8 6" />
          <ellipse cx="120" cy="115" rx="85" ry="40" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.75" />

          {/* Chiến cơ người chơi lao về phía trước */}
          <g transform="translate(120, 140)">
            <ellipse cx="-16" cy="38" rx="3" ry="9" fill="#38bdf8" />
            <ellipse cx="16" cy="38" rx="3" ry="9" fill="#38bdf8" />
            <ellipse cx="-26" cy="32" rx="2.5" ry="7" fill="#00f0ff" />
            <ellipse cx="26" cy="32" rx="2.5" ry="7" fill="#00f0ff" />

            <path d="M -10 10 L -65 -15 L -62 -18 L -8 5 Z" fill="#dc2626" stroke="#b91c1c" strokeWidth="1" />
            <path d="M 10 10 L 65 -15 L 62 -18 L 8 5 Z" fill="#dc2626" stroke="#b91c1c" strokeWidth="1" />
            <path d="M -10 18 L -60 38 L -57 41 L -8 22 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
            <path d="M 10 18 L 60 38 L 57 41 L 8 22 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />

            <rect x="-66" y="-34" width="3" height="24" fill="#0f172a" rx="1.5" />
            <circle cx="-64.5" cy="-35" r="2.5" fill="#00f0ff" />
            <rect x="63" y="-34" width="3" height="24" fill="#0f172a" rx="1.5" />
            <circle cx="64.5" cy="-35" r="2.5" fill="#00f0ff" />

            <rect x="-61" y="24" width="3" height="22" fill="#0f172a" rx="1.5" />
            <circle cx="-59.5" cy="23" r="2.5" fill="#00f0ff" />
            <rect x="58" y="24" width="3" height="22" fill="#0f172a" rx="1.5" />
            <circle cx="59.5" cy="23" r="2.5" fill="#00f0ff" />

            <polygon points="0,-48 14,24 -14,24" fill="url(#shipBodyGrad)" stroke="#64748b" strokeWidth="1.5" />
            <polygon points="0,-24 7,4 -7,4" fill="#00f0ff" opacity="0.9" />
            <polygon points="0,-20 4,2 -4,2" fill="#ffffff" opacity="0.6" />

            {/* Tia Laser Song Đôi */}
            <line x1="-12" y1="-30" x2="-28" y2="-110" stroke="url(#laserGlow)" strokeWidth="4" strokeLinecap="round" />
            <line x1="12" y1="-30" x2="28" y2="-110" stroke="url(#laserGlow)" strokeWidth="4" strokeLinecap="round" />
            <line x1="-64.5" y1="-36" x2="-75" y2="-100" stroke="url(#laserGlow)" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
            <line x1="64.5" y1="-36" x2="75" y2="-100" stroke="url(#laserGlow)" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function GameArtwork({ gameId }) {
  if (gameId === "2048") {
    return <JellyPileArtwork />;
  }

  if (gameId === "snake") {
    return <CartoonSnakeArtwork />;
  }

  if (gameId === "survivor") {
    return <SpaceWarsArtwork />;
  }

  if (gameId === "chess") {
    return (
      <div className="intro-art intro-art--chess" aria-hidden="true">
        <div className="chess-orbit" />
        <div className="chess-board">{Array.from({ length: 36 }, (_, index) => <i key={index} />)}</div>
        <span className="material-symbols-outlined chess-king">chess</span>
        <span className="chess-rank">BOT +<br /><b>LOCAL</b></span>
      </div>
    );
  }
  return (
    <div className="intro-art intro-art--caro" aria-hidden="true">
      <div className="caro-grid" />
      <span className="caro-mark caro-mark--x">×</span>
      <span className="caro-mark caro-mark--o">○</span>
      <span className="caro-mark caro-mark--x2">×</span>
      <div className="caro-line" />
      <span className="caro-vs">YOU <b>VS</b> AI</span>
    </div>
  );
}

export default function GameIntroScreen({
  gameId,
  onStartGame,
  onClose,
}) {
  const { t } = useTranslation();
  const meta = GAME_META[gameId] || GAME_META["2048"];
  const gameKey = `arcadeIntro.games.${gameId}`;

  return (
    <section className={`arcade-intro arcade-intro--${gameId}`}>
      <div className="arcade-intro__aurora" aria-hidden="true" />
      <header className="arcade-intro__header">
        <button type="button" className="arcade-intro__back" onClick={onClose} aria-label={t("arcadeIntro.close")}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span className="arcade-intro__brand">HUGO ARCADE</span>
        <span className="arcade-intro__edition">{meta.badge}</span>
      </header>

      <div className="arcade-intro__body">
        <div className="arcade-intro__copy">
          <span className="arcade-intro__eyebrow">
            <span className="material-symbols-outlined">{meta.icon}</span>
            {t(`${gameKey}.eyebrow`)}
          </span>
          <h1>{t(`${gameKey}.title`)}</h1>
          <p>{t(`${gameKey}.description`)}</p>
        </div>

        <GameArtwork gameId={gameId} />

        <div className="arcade-intro__footer">
          <div className="arcade-intro__facts">
            <span><b>{meta.detail}</b>{t("arcadeIntro.board")}</span>
            <span>
              <b>{meta.fact2Title || t("arcadeGame.joyByScore")}</b>
              {meta.fact2Desc || t("arcadeIntro.reward")}
            </span>
            <span><b>∞</b>{t("arcadeIntro.endless")}</span>
          </div>
          {Boolean(t(`${gameKey}.hint`)) && <p className="arcade-intro__hint">{t(`${gameKey}.hint`)}</p>}

          <button
            type="button"
            className="arcade-intro__play-btn"
            onClick={onStartGame}
          >
            <span className="material-symbols-outlined">play_arrow</span>
            {t("arcadeIntro.playNow")}
          </button>
        </div>
      </div>
    </section>
  );
}
