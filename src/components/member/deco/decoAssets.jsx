import React from "react";

// HugoDorm — 2D art library + physically-grounded room scene.
// Art rules: floor items draw feet at y≈98; desks put the tabletop top at
// DESK_SURFACE_FRAC; on-desk items draw their base at y≈98. The scene anchors
// each item's BOTTOM to a shared floor/desk line so nothing floats.

const DESK_SURFACE_FRAC = 0.17;

const g = (id, stops) => (
  <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
    {stops.map(([o, c], i) => <stop key={i} offset={o} stopColor={c} />)}
  </linearGradient>
);

// ── DESKS (tabletop top ~y17, legs to ~y98) ──
const DeskBasic = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>{g("dwb", [["0%", "#d8a066"], ["100%", "#b47a3d"]])}{g("dwl", [["0%", "#9c6631"], ["100%", "#71481f"]])}</defs>
    <rect x="24" y="30" width="7" height="68" rx="2" fill="#835426" />
    <rect x="69" y="30" width="7" height="68" rx="2" fill="#835426" />
    <rect x="13" y="32" width="9" height="66" rx="2.5" fill="url(#dwl)" />
    <rect x="78" y="32" width="9" height="66" rx="2.5" fill="url(#dwl)" />
    <rect x="11" y="27" width="78" height="12" rx="2" fill="#a76e35" />
    <rect x="54" y="30" width="26" height="7" rx="1.5" fill="#8a5a2b" />
    <circle cx="76" cy="33.5" r="1.4" fill="#e7bd88" />
    <rect x="6" y="17" width="88" height="12" rx="4" fill="url(#dwb)" />
    <rect x="6" y="17" width="88" height="3.5" rx="2" fill="#f0cd9a" opacity=".85" />
    <line x1="12" y1="24" x2="88" y2="24" stroke="#8a5a2b" strokeWidth=".5" opacity=".35" />
  </svg>
);
const DeskCyber = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>{g("dcy", [["0%", "#2c3050"], ["100%", "#14151f"]])}</defs>
    <rect x="17" y="30" width="8" height="68" rx="2" fill="#0e0f1a" />
    <rect x="75" y="30" width="8" height="68" rx="2" fill="#0e0f1a" />
    <rect x="18" y="92" width="6" height="4" rx="1" fill="#a855f7"><animate attributeName="opacity" values=".5;1;.5" dur="2s" repeatCount="indefinite" /></rect>
    <rect x="76" y="92" width="6" height="4" rx="1" fill="#22d3ee"><animate attributeName="opacity" values=".5;1;.5" dur="2.6s" repeatCount="indefinite" /></rect>
    <rect x="11" y="27" width="78" height="10" rx="2" fill="#1a1c2c" />
    <rect x="4" y="16" width="92" height="13" rx="4" fill="url(#dcy)" />
    <rect x="4" y="26" width="92" height="2.6" rx="1.3" fill="#22d3ee"><animate attributeName="opacity" values=".45;1;.45" dur="2.4s" repeatCount="indefinite" /></rect>
    <circle cx="66" cy="22" r="2.4" fill="#0a0b12" />
  </svg>
);
const DeskMinimal = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>{g("dmn", [["0%", "#ffffff"], ["100%", "#e4e7ee"]])}</defs>
    <rect x="15" y="28" width="5" height="70" rx="2" fill="#cdd1da" />
    <rect x="80" y="28" width="5" height="70" rx="2" fill="#cdd1da" />
    <rect x="17" y="82" width="66" height="4" rx="2" fill="#d8dbe3" />
    <rect x="8" y="18" width="84" height="11" rx="5" fill="url(#dmn)" stroke="#d3d6de" strokeWidth="1" />
    <rect x="8" y="18" width="84" height="3" rx="1.5" fill="#ffffff" />
  </svg>
);

// ── CHAIRS (feet ~y98, seat mid) ──
const ChairBasic = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>{g("stw", [["0%", "#e0b483"], ["100%", "#c68a4e"]])}</defs>
    <rect x="26" y="52" width="7" height="46" rx="3" fill="#8a5a2b" transform="rotate(7 29 75)" />
    <rect x="67" y="52" width="7" height="46" rx="3" fill="#8a5a2b" transform="rotate(-7 71 75)" />
    <rect x="30" y="74" width="40" height="5" rx="2.5" fill="#6d461f" />
    <ellipse cx="50" cy="52" rx="28" ry="10" fill="#a9713a" />
    <ellipse cx="50" cy="49" rx="28" ry="9.5" fill="url(#stw)" />
    <ellipse cx="50" cy="47" rx="22" ry="6" fill="#f0cd9a" opacity=".6" />
  </svg>
);
const ChairGaming = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>{g("cg", [["0%", "#ef4b52"], ["100%", "#9e1c27"]])}</defs>
    <path d="M50 74 L27 95 M50 74 L73 95 M50 74 L50 96" stroke="#0d0d0d" strokeWidth="4.5" strokeLinecap="round" />
    <circle cx="27" cy="95" r="4" fill="#1f1f1f" /><circle cx="73" cy="95" r="4" fill="#1f1f1f" /><circle cx="50" cy="96" r="4" fill="#1f1f1f" />
    <rect x="46.5" y="60" width="7" height="16" rx="2" fill="#2a2a2a" />
    <rect x="26" y="52" width="48" height="12" rx="5" fill="#161616" />
    <rect x="29" y="53" width="42" height="4" rx="2" fill="#2c2c2c" />
    <rect x="30" y="8" width="40" height="48" rx="14" fill="url(#cg)" />
    <rect x="37" y="14" width="26" height="40" rx="9" fill="#171717" />
    <rect x="43" y="19" width="14" height="32" rx="5" fill="#2a2a2a" />
    <rect x="40" y="4" width="20" height="11" rx="5.5" fill="#141414" />
    <rect x="45" y="6" width="10" height="5" rx="2.5" fill="#ef4b52" />
  </svg>
);
const ChairOffice = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>{g("co", [["0%", "#767d8a"], ["100%", "#454b54"]])}</defs>
    <path d="M50 76 L28 95 M50 76 L72 95 M50 76 L50 96" stroke="#1c1c1c" strokeWidth="4.5" strokeLinecap="round" />
    <circle cx="28" cy="95" r="4" fill="#111" /><circle cx="72" cy="95" r="4" fill="#111" /><circle cx="50" cy="96" r="4" fill="#111" />
    <rect x="46.5" y="62" width="7" height="16" rx="2" fill="#33383f" />
    <rect x="29" y="54" width="42" height="11" rx="5" fill="#3a3f47" />
    <rect x="32" y="16" width="36" height="42" rx="13" fill="url(#co)" />
    <rect x="37" y="22" width="26" height="30" rx="8" fill="#5a616c" />
    <path d="M40 28 h20 M40 34 h20 M40 40 h20" stroke="#454b54" strokeWidth="1.2" opacity=".6" />
  </svg>
);

// ── COMPUTERS (base ~y98, rests on desk) ──
const Laptop = ({ on = true }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <ellipse cx="50" cy="95" rx="42" ry="4" fill="#000" opacity=".12" />
    <rect x="24" y="30" width="52" height="52" rx="4" fill="#3a3f47" />
    <rect x="27" y="33" width="46" height="43" rx="2" fill={on ? "#6ee7ff" : "#1c2530"}>
      {on && <animate attributeName="fill" values="#6ee7ff;#a7f0ff;#6ee7ff" dur="4s" repeatCount="indefinite" />}
    </rect>
    {on && <rect x="31" y="37" width="20" height="3" rx="1.5" fill="#fff" opacity=".5" />}
    <path d="M14 82 h72 l7 12 H7 z" fill="#c8cdd6" />
    <path d="M14 82 h72 l2 3 H12 z" fill="#e4e8ee" />
    <rect x="40" y="86" width="20" height="3" rx="1.5" fill="#9aa1ac" />
  </svg>
);
const PcMasterRace = ({ on = true }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <ellipse cx="54" cy="95" rx="46" ry="4" fill="#000" opacity=".12" />
    {[10, 38, 66].map((x, i) => (
      <g key={i}>
        <rect x={x} y={26 + (i === 1 ? -4 : 0)} width="26" height="20" rx="2.5" fill="#1d2027" />
        <rect x={x + 2} y={28 + (i === 1 ? -4 : 0)} width="22" height="16" rx="1.5" fill={on ? "#7c3aed" : "#161820"}>
          {on && <animate attributeName="opacity" values=".8;1;.8" dur={`${2 + i}s`} repeatCount="indefinite" />}
        </rect>
      </g>
    ))}
    <rect x="34" y="46" width="40" height="4" rx="2" fill="#2b2f36" />
    <rect x="50" y="50" width="8" height="34" rx="2" fill="#2b2f36" />
    <rect x="40" y="84" width="28" height="6" rx="3" fill="#33383f" />
    <rect x="2" y="60" width="15" height="34" rx="3" fill="#14161c" />
    <rect x="5" y="64" width="9" height="3" rx="1" fill="#22d3ee"><animate attributeName="opacity" values=".4;1;.4" dur="1.6s" repeatCount="indefinite" /></rect>
    <rect x="5" y="69" width="9" height="3" rx="1" fill="#f0abfc"><animate attributeName="opacity" values=".4;1;.4" dur="2.1s" repeatCount="indefinite" /></rect>
  </svg>
);
const Macbook = ({ on = true }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <ellipse cx="50" cy="95" rx="40" ry="4" fill="#000" opacity=".12" />
    <rect x="26" y="32" width="48" height="48" rx="4" fill="#d9dce1" />
    <rect x="29" y="35" width="42" height="40" rx="2" fill={on ? "#0f1626" : "#0b0e16"} />
    {on && <rect x="33" y="39" width="18" height="3" rx="1.5" fill="#e5e7eb" opacity=".55" />}
    <circle cx="50" cy="57" r="3" fill={on ? "#c7ccd6" : "#3a3f4a"} opacity=".8" />
    <path d="M18 80 h64 l6 12 H12 z" fill="#e6e9ee" />
    <path d="M44 80 h12 l1 3 H43 z" fill="#c9cdd5" />
  </svg>
);

// ── PETS (feet ~y96; interactive) ──
const CatOrange = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>{g("cot", [["0%", "#fcc06e"], ["100%", "#f08a24"]])}</defs>
    <ellipse cx="50" cy="94" rx="26" ry="4" fill="#000" opacity=".12" />
    <ellipse cx="50" cy="72" rx="28" ry="22" fill="url(#cot)" />
    <path d="M28 44 l6 -20 13 11 z" fill="#f5a13a" />
    <path d="M72 44 l-6 -20 -13 11 z" fill="#f5a13a" />
    <circle cx="50" cy="52" r="21" fill="#fcbf6a" />
    <ellipse className="deco-blink" cx="43" cy="51" rx="3" ry="4" fill="#2b2b2b" />
    <ellipse className="deco-blink" cx="57" cy="51" rx="3" ry="4" fill="#2b2b2b" />
    <path d="M47 59 q3 3 6 0" stroke="#7a4a12" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M31 55 h9 M31 59 h9 M60 55 h9 M60 59 h9" stroke="#e59a3c" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M74 78 q14 -6 8 -18" stroke="#f08a24" strokeWidth="6" fill="none" strokeLinecap="round" />
  </svg>
);
const CatBlack = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <ellipse cx="50" cy="94" rx="26" ry="4" fill="#000" opacity=".12" />
    <ellipse cx="50" cy="72" rx="28" ry="22" fill="#2b2d38" />
    <path d="M28 44 l6 -20 13 11 z" fill="#22242e" />
    <path d="M72 44 l-6 -20 -13 11 z" fill="#22242e" />
    <circle cx="50" cy="52" r="21" fill="#33353f" />
    <ellipse className="deco-blink" cx="43" cy="51" rx="3.2" ry="4.2" fill="#7CFC98" />
    <ellipse className="deco-blink" cx="57" cy="51" rx="3.2" ry="4.2" fill="#7CFC98" />
    <path d="M47 59 q3 3 6 0" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M74 78 q14 -6 8 -18" stroke="#2b2d38" strokeWidth="6" fill="none" strokeLinecap="round" />
  </svg>
);
const DogCorgi = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>{g("dc", [["0%", "#f5c07c"], ["100%", "#d98f38"]])}</defs>
    <ellipse cx="50" cy="94" rx="30" ry="4" fill="#000" opacity=".12" />
    <ellipse cx="50" cy="74" rx="30" ry="20" fill="url(#dc)" />
    <path d="M50 74 h-14 v18 h14 z" fill="#f8d29a" />
    <path d="M26 44 l-3 -18 16 9 z" fill="#c97f2c" />
    <path d="M74 44 l3 -18 -16 9 z" fill="#c97f2c" />
    <circle cx="50" cy="54" r="21" fill="#f8d29a" />
    <ellipse className="deco-blink" cx="43" cy="53" rx="3" ry="4" fill="#3a2a17" />
    <ellipse className="deco-blink" cx="57" cy="53" rx="3" ry="4" fill="#3a2a17" />
    <ellipse cx="50" cy="61" rx="4.5" ry="3.5" fill="#2c1c0f" />
    <path d="M45 65 q5 4 10 0" stroke="#7a4a12" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

// ── POSTERS ──
const PosterHugo = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>{g("ph", [["0%", "#6366f1"], ["100%", "#a855f7"]])}</defs>
    <rect x="12" y="6" width="76" height="88" rx="6" fill="#c7b8ff" />
    <rect x="15" y="9" width="70" height="82" rx="4" fill="url(#ph)" />
    <text x="50" y="58" textAnchor="middle" fontSize="34" fontWeight="900" fill="#fff">H</text>
    <circle cx="50" cy="74" r="4" fill="#fde047" />
  </svg>
);
const PosterAnime = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>{g("pa", [["0%", "#fda4af"], ["100%", "#c084fc"]])}</defs>
    <rect x="12" y="6" width="76" height="88" rx="6" fill="#fbe3ef" />
    <rect x="15" y="9" width="70" height="82" rx="4" fill="url(#pa)" />
    <circle cx="50" cy="42" r="17" fill="#fff7ed" />
    <circle cx="43" cy="42" r="3" fill="#1f2937" /><circle cx="57" cy="42" r="3" fill="#1f2937" />
    <path d="M44 49 q6 5 12 0" stroke="#be123c" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M30 74 h40" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".7" />
  </svg>
);
const PosterCyber = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <rect x="12" y="6" width="76" height="88" rx="6" fill="#1b2440" />
    <rect x="15" y="9" width="70" height="82" rx="4" fill="#0b1020" />
    <path d="M20 74 L40 42 L52 58 L68 26 L80 42" stroke="#f0abfc" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="68" cy="26" r="3.5" fill="#22d3ee" />
    <rect x="22" y="80" width="56" height="4" rx="2" fill="#22d3ee" opacity=".6" />
  </svg>
);

// ── WINDOWS ──
const WindowDay = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>{g("wd", [["0%", "#c7ecff"], ["100%", "#8fd2fb"]])}</defs>
    <rect x="6" y="6" width="88" height="88" rx="9" fill="#e8eef3" />
    <rect x="10" y="10" width="80" height="80" rx="6" fill="url(#wd)" />
    <circle cx="70" cy="30" r="10" fill="#fff3b0" />
    <ellipse cx="34" cy="42" rx="14" ry="7" fill="#fff" opacity=".85" />
    <ellipse cx="52" cy="62" rx="18" ry="8" fill="#fff" opacity=".7" />
    <line x1="50" y1="10" x2="50" y2="90" stroke="#e8eef3" strokeWidth="5" />
    <line x1="10" y1="50" x2="90" y2="50" stroke="#e8eef3" strokeWidth="5" />
  </svg>
);
const WindowNight = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>{g("wn", [["0%", "#181546"], ["100%", "#302c7e"]])}</defs>
    <rect x="6" y="6" width="88" height="88" rx="9" fill="#cbd3ef" />
    <rect x="10" y="10" width="80" height="80" rx="6" fill="url(#wn)" />
    <circle cx="68" cy="28" r="9" fill="#fef9c3" /><circle cx="63" cy="25" r="9" fill="#241f5c" />
    {[[24, 24], [40, 20], [30, 46], [56, 40], [46, 66], [72, 58], [22, 68]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r="1.6" fill="#fff"><animate attributeName="opacity" values=".3;1;.3" dur={`${2 + (i % 3)}s`} repeatCount="indefinite" /></circle>
    ))}
    <line x1="50" y1="10" x2="50" y2="90" stroke="#cbd3ef" strokeWidth="5" />
    <line x1="10" y1="50" x2="90" y2="50" stroke="#cbd3ef" strokeWidth="5" />
  </svg>
);

// ── RUGS ──
const RugRound = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
    <ellipse cx="50" cy="50" rx="48" ry="30" fill="#e07a5f" />
    <ellipse cx="50" cy="50" rx="36" ry="22" fill="#f2cc8f" />
    <ellipse cx="50" cy="50" rx="22" ry="13" fill="#e07a5f" />
    <ellipse cx="50" cy="50" rx="10" ry="6" fill="#f4f1de" />
  </svg>
);
const RugPersian = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
    <ellipse cx="50" cy="50" rx="48" ry="30" fill="#7f1d1d" />
    <ellipse cx="50" cy="50" rx="42" ry="25" fill="none" stroke="#fbbf24" strokeWidth="2" />
    <ellipse cx="50" cy="50" rx="24" ry="14" fill="#1e3a8a" />
    <path d="M50 40 l6 10 -6 10 -6 -10 z" fill="#fbbf24" />
    {[20, 80].map((x, i) => <path key={i} d={`M${x} 44 l4 6 -4 6 -4 -6 z`} fill="#fbbf24" />)}
  </svg>
);

// ── PLANTS ──
const PlantFern = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <ellipse cx="50" cy="96" rx="20" ry="3.5" fill="#000" opacity=".12" />
    {[-42, -21, 0, 21, 42].map((r, i) => (
      <path key={i} d="M50 72 Q50 28 50 18" stroke={i % 2 ? "#2f9e44" : "#37b24d"} strokeWidth="7" fill="none" strokeLinecap="round" transform={`rotate(${r} 50 72)`} />
    ))}
    <path d="M35 70 h30 l-4 26 h-22 z" fill="#c97f2c" />
    <path d="M35 70 h30 l-1 5 h-28 z" fill="#e0a458" />
  </svg>
);
const PlantMonstera = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <ellipse cx="50" cy="96" rx="22" ry="3.5" fill="#000" opacity=".12" />
    {[[-24, .82], [0, 1], [24, .82]].map(([r, s], i) => (
      <g key={i} transform={`rotate(${r} 50 70) scale(${s})`} style={{ transformOrigin: "50px 70px" }}>
        <ellipse cx="50" cy="38" rx="16" ry="22" fill="#2f9e44" />
        <path d="M50 22 v34 M42 32 h8 M50 44 h8 M42 48 h8" stroke="#166534" strokeWidth="2" />
      </g>
    ))}
    <path d="M37 68 h26 l-4 28 h-18 z" fill="#d97706" />
    <path d="M37 68 h26 l-1 5 h-24 z" fill="#f59e0b" />
  </svg>
);
const PlantCactus = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <ellipse cx="50" cy="96" rx="18" ry="3.5" fill="#000" opacity=".12" />
    <rect x="40" y="32" width="20" height="44" rx="10" fill="#40a02b" />
    <rect x="24" y="46" width="12" height="20" rx="6" fill="#40a02b" />
    <rect x="64" y="40" width="12" height="24" rx="6" fill="#40a02b" />
    <circle cx="50" cy="34" r="4" fill="#f9a8d4" />
    <path d="M34 76 h32 l-3 20 h-26 z" fill="#ea580c" />
    <path d="M34 76 h32 l-1 5 h-30 z" fill="#fb923c" />
  </svg>
);

// ── LAMPS ──
const LampFloor = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <ellipse cx="50" cy="95" rx="16" ry="3.5" fill="#000" opacity=".12" />
    <ellipse cx="50" cy="28" rx="20" ry="11" fill="#fff7cc" opacity=".45"><animate attributeName="opacity" values=".28;.55;.28" dur="3s" repeatCount="indefinite" /></ellipse>
    <path d="M34 24 h32 l-6 20 h-20 z" fill="#fcd34d" />
    <path d="M34 24 h32 l-2 6 h-28 z" fill="#fde68a" />
    <rect x="47" y="44" width="6" height="48" fill="#78716c" />
    <ellipse cx="50" cy="93" rx="15" ry="4" fill="#57534e" />
  </svg>
);
const LampNeon = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <ellipse cx="50" cy="94" rx="10" ry="3" fill="#000" opacity=".12" />
    <rect x="44" y="70" width="12" height="22" rx="2" fill="#1f2430" />
    <path d="M30 72 Q32 20 52 22 Q72 24 64 50" stroke="#f0abfc" strokeWidth="6" fill="none" strokeLinecap="round"><animate attributeName="stroke" values="#f0abfc;#22d3ee;#f0abfc" dur="5s" repeatCount="indefinite" /></path>
    <path d="M30 72 Q32 20 52 22 Q72 24 64 50" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".8" />
  </svg>
);

export const DECO_ART = {
  desk_basic: DeskBasic, desk_cyber: DeskCyber, desk_minimal: DeskMinimal,
  chair_basic: ChairBasic, chair_gaming: ChairGaming, chair_office: ChairOffice,
  laptop: Laptop, pc_master_race: PcMasterRace, macbook: Macbook,
  cat_orange: CatOrange, cat_black: CatBlack, dog_corgi: DogCorgi,
  poster_hugo: PosterHugo, poster_anime: PosterAnime, poster_cyberpunk: PosterCyber,
  window_day: WindowDay, window_night: WindowNight,
  rug_round: RugRound, rug_persian: RugPersian,
  plant_fern: PlantFern, plant_monstera: PlantMonstera, plant_cactus: PlantCactus,
  lamp_floor: LampFloor, lamp_neon: LampNeon,
};

export const DECO_TYPE_META = {
  desk: { label: "Bàn", icon: "table_restaurant" },
  chair: { label: "Ghế", icon: "chair" },
  computer: { label: "Máy tính", icon: "computer" },
  window: { label: "Cửa sổ", icon: "window" },
  poster: { label: "Poster", icon: "wallpaper" },
  rug: { label: "Thảm", icon: "crop_square" },
  plant: { label: "Cây cảnh", icon: "potted_plant" },
  lamp: { label: "Đèn", icon: "light" },
  pet: { label: "Thú cưng", icon: "pets" },
};

export function DecoItemArt({ itemId, className = "" }) {
  const Comp = DECO_ART[itemId];
  if (!Comp) return null;
  return <div className={className}><Comp /></div>;
}

function RoomItem({ id }) {
  const Comp = DECO_ART[id];
  return Comp ? <Comp /> : null;
}

export const isNightRoom = (items) => items?.window === "window_night";

export function cozinessScore(items = {}) {
  const filled = ["desk", "chair", "computer", "window", "poster", "rug", "plant", "lamp", "pet"]
    .filter((slot) => items[slot]).length;
  const petBonus = items.pet ? 12 : 0;
  const greenBonus = items.plant ? 8 : 0;
  return Math.min(100, Math.round((filled / 9) * 80) + petBonus + greenBonus);
}

const SCENE_CSS = `
@keyframes decoFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
@keyframes decoHop { 0%,70%,100%{transform:translateY(0)} 80%{transform:translateY(-11px)} 90%{transform:translateY(-3px)} }
@keyframes decoBlink { 0%,92%,100%{transform:scaleY(1)} 96%{transform:scaleY(.1)} }
@keyframes decoGlow { 0%,100%{opacity:.35} 50%{opacity:.7} }
.deco-blink{transform-box:fill-box;transform-origin:center;animation:decoBlink 4.5s infinite}
`;

const FLOOR_TOP = 60;
const DESK_TOP = 48;
const DESK_BOTTOM = 90;
const DESK_LEFT = 30;
const DESK_WIDTH = 46;
const DESK_HEIGHT = DESK_BOTTOM - DESK_TOP;
const DESK_CX = DESK_LEFT + DESK_WIDTH / 2;
const SURFACE_Y = DESK_TOP + DESK_HEIGHT * DESK_SURFACE_FRAC;

export function DecoRoomScene({ room = {}, interactive = false, onItemClick, className = "" }) {
  const items = room.items || {};
  const night = isNightRoom(items);
  const wall = room.wallColor || (night ? "#2a2440" : "#f4f4f5");
  const [petHop, setPetHop] = React.useState(false);

  const clickPet = () => {
    if (!interactive) return;
    setPetHop(true);
    setTimeout(() => setPetHop(false), 700);
    onItemClick?.("pet");
  };

  const floorTint = {
    wood_basic: "linear-gradient(180deg,#d29a5e,#a9713a)",
    wood_dark: "linear-gradient(180deg,#6b4423,#4a2e17)",
    tile_white: "linear-gradient(180deg,#eceff4,#cfd4de)",
    tile_checker: "repeating-conic-gradient(#e5e7eb 0deg 90deg,#9ca3af 90deg 180deg)",
  }[room.floorStyle] || "linear-gradient(180deg,#d29a5e,#a9713a)";

  const box = (leftPct, widthPct, bottomPct, heightPct, extra = {}) => ({
    position: "absolute", left: `${leftPct}%`, width: `${widthPct}%`,
    bottom: `${100 - bottomPct}%`, height: `${heightPct}%`, ...extra,
  });

  return (
    <div className={`relative w-full h-full overflow-hidden select-none ${className}`}>
      <style>{SCENE_CSS}</style>

      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${wall}, ${shade(wall, night ? -8 : -6)})` }}>
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
      </div>

      {items.window && <div style={box(66, 26, 52, 44)} className="drop-shadow-md"><RoomItem id={items.window} /></div>}
      {items.poster && <div style={box(7, 14, 50, 40)} className="drop-shadow-md"><RoomItem id={items.poster} /></div>}

      {items.lamp && (
        <div className="absolute pointer-events-none" style={{ bottom: "16%", left: "2%", width: "42%", height: "56%", background: "radial-gradient(circle at 28% 55%, rgba(255,224,150,.5), transparent 62%)", animation: "decoGlow 3.5s ease-in-out infinite" }} />
      )}

      <div className="absolute bottom-0 left-0 right-0" style={{ height: `${100 - FLOOR_TOP}%`, backgroundImage: floorTint, backgroundSize: room.floorStyle === "tile_checker" ? "44px 44px" : undefined }}>
        <div className="absolute top-0 left-0 right-0 h-[5px] bg-black/15" />
        {!room.floorStyle?.startsWith("tile") && (
          <div className="absolute inset-0 opacity-[0.13]" style={{ backgroundImage: "linear-gradient(90deg,transparent 48%,#000 50%,transparent 52%)", backgroundSize: "46px 100%" }} />
        )}
      </div>

      {items.rug && <div style={{ ...box(18, 64, 88, 20), zIndex: 1 }}><RoomItem id={items.rug} /></div>}
      {items.lamp && <div style={{ ...box(1, 17, 90, 46, { animation: "decoFloat 6s ease-in-out infinite" }), zIndex: 6 }}><RoomItem id={items.lamp} /></div>}
      {items.plant && <div style={{ ...box(77, 21, 91, 34), zIndex: 8 }} className="drop-shadow-sm"><RoomItem id={items.plant} /></div>}
      {items.desk && <div style={{ ...box(DESK_LEFT, DESK_WIDTH, DESK_BOTTOM, DESK_HEIGHT), zIndex: 10, filter: "drop-shadow(0 10px 10px rgba(0,0,0,.22))" }}><RoomItem id={items.desk} /></div>}

      {items.computer && (
        <button type="button" onClick={() => interactive && onItemClick?.("computer")}
          style={{ ...box(DESK_CX - 12, 24, SURFACE_Y + 1, 22), zIndex: 12, border: 0, background: "transparent", padding: 0, cursor: interactive ? "pointer" : "default" }}>
          <RoomItem id={items.computer} />
        </button>
      )}

      {items.chair && <div style={{ ...box(12, 27, 95, 50), zIndex: 20, filter: "drop-shadow(0 12px 12px rgba(0,0,0,.28))" }}><RoomItem id={items.chair} /></div>}

      {items.pet && (
        <button type="button" onClick={clickPet}
          style={{ ...box(66, 20, 97, 30, { animation: petHop ? "decoHop .7s ease" : "decoFloat 4s ease-in-out infinite" }), zIndex: 30, border: 0, background: "transparent", padding: 0, cursor: interactive ? "pointer" : "default" }}>
          <RoomItem id={items.pet} />
        </button>
      )}

      {night && <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 70% 22%, rgba(120,120,255,.10), rgba(10,8,30,.42) 92%)" }} />}
    </div>
  );
}

function shade(hex, pct) {
  try {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
    const f = 1 + pct / 100;
    r = Math.max(0, Math.min(255, Math.round(r * f)));
    gg = Math.max(0, Math.min(255, Math.round(gg * f)));
    b = Math.max(0, Math.min(255, Math.round(b * f)));
    return `#${((r << 16) | (gg << 8) | b).toString(16).padStart(6, "0")}`;
  } catch { return hex; }
}
