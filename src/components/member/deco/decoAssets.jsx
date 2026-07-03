import React from "react";
// HugoDorm — 2D art library + physically-grounded room scene.
// Art rules: floor items draw feet at y≈98; desks put the tabletop top at
// DESK_SURFACE_FRAC; on-desk items draw their base at y≈98. The scene anchors
// each item's BOTTOM to a shared floor/desk line so nothing floats.

const DESK_SURFACE_FRAC = 0.34;

const g = (id, stops) => (
  <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
    {stops.map(([o, c], i) => <stop key={i} offset={o} stopColor={c} />)}
  </linearGradient>
);

// ── DESKS ────────────────────────────────────────────────────────────────────
const DeskBasic = () => (
  <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-2xl" preserveAspectRatio="xMidYMax meet">
    {/* Ground Shadow */}
    <ellipse cx="50" cy="76" rx="46" ry="6" fill="#000" opacity="0.3" filter="blur(2px)" />
    <defs>
      <linearGradient id="db_wood_light" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#eab47c" />
        <stop offset="100%" stopColor="#c58a4e" />
      </linearGradient>
      <linearGradient id="db_wood_dark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8a5a2b" />
        <stop offset="100%" stopColor="#5c3815" />
      </linearGradient>
    </defs>
    
    {/* Back Legs */}
    <rect x="18" y="30" width="8" height="45" rx="3" fill="url(#db_wood_dark)" />
    <rect x="74" y="30" width="8" height="45" rx="3" fill="url(#db_wood_dark)" />
    
    {/* Back Board */}
    <rect x="22" y="30" width="56" height="24" rx="2" fill="#4a2e12" opacity="0.9" />

    {/* Front Legs */}
    <path d="M 10 25 L 22 25 L 20 75 L 12 75 Z" fill="url(#db_wood_light)" />
    <path d="M 90 25 L 78 25 L 80 75 L 88 75 Z" fill="url(#db_wood_light)" />
    {/* Leg 3D Depth */}
    <path d="M 20 25 L 24 25 L 24 73 L 20 75 Z" fill="url(#db_wood_dark)" />
    <path d="M 76 25 L 80 25 L 80 75 L 76 73 Z" fill="url(#db_wood_dark)" />

    {/* Table Top */}
    <path d="M 2 20 L 98 20 L 92 32 L 8 32 Z" fill="url(#db_wood_light)" />
    <path d="M 8 32 L 92 32 L 92 35 L 8 35 Z" fill="url(#db_wood_dark)" />
    <path d="M 2 20 L 8 32 L 8 35 L 2 23 Z" fill="#69431e" />
    <path d="M 98 20 L 92 32 L 92 35 L 98 23 Z" fill="#69431e" />

    {/* Drawers */}
    <rect x="28" y="33" width="44" height="12" rx="2" fill="url(#db_wood_light)" />
    <line x1="28" y1="45" x2="72" y2="45" stroke="#5c3815" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <rect x="42" y="37" width="16" height="3.5" rx="1.5" fill="#3e230d" />
  </svg>
);
const DeskCyber = () => (
  <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-2xl" preserveAspectRatio="xMidYMax meet">
    <ellipse cx="50" cy="76" rx="46" ry="6" fill="#000" opacity="0.5" filter="blur(3px)" />
    <defs>
      <linearGradient id="dc_dark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="dc_top" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>
    </defs>
    
    {/* Desk Base & Legs */}
    <path d="M 14 30 L 28 76 L 16 76 L 8 30 Z" fill="url(#dc_dark)" />
    <path d="M 86 30 L 72 76 L 84 76 L 92 30 Z" fill="url(#dc_dark)" />
    
    {/* Glowing lines on legs */}
    <path d="M 21 45 L 25.5 70" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M 79 45 L 74.5 70" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />

    {/* Desk Top */}
    <path d="M 2 15 L 98 15 L 90 32 L 10 32 Z" fill="url(#dc_top)" />
    <path d="M 2 10 L 98 10 L 98 15 L 2 15 Z" fill="#0f172a" />
    <path d="M 10 32 L 90 32 L 90 36 L 10 36 Z" fill="#020617" />
    
    {/* Cyberpunk details */}
    <path d="M 2 15 L 10 32 L 90 32 L 98 15" fill="none" stroke="#22d3ee" strokeWidth="2" opacity="0.9" />
    <path d="M 12 13 L 40 13 L 45 22 L 55 22 L 60 13 L 88 13" fill="none" stroke="#a855f7" strokeWidth="2.5" />
    <rect x="45" y="22" width="10" height="4" fill="#22d3ee">
      <animate attributeName="opacity" values=".4;1;.4" dur="1.5s" repeatCount="indefinite" />
    </rect>
  </svg>
);
const DeskMinimal = () => (
  <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-2xl" preserveAspectRatio="xMidYMax meet">
    <ellipse cx="50" cy="76" rx="46" ry="5" fill="#000" opacity="0.2" filter="blur(2px)" />
    
    {/* Legs */}
    <path d="M 18 30 L 22 75 L 14 75 L 10 30 Z" fill="#cbd5e1" />
    <path d="M 82 30 L 78 75 L 86 75 L 90 30 Z" fill="#cbd5e1" />
    <path d="M 14 68 L 22 68 L 22 75 L 14 75 Z" fill="#94a3b8" />
    <path d="M 78 68 L 86 68 L 86 75 L 78 75 Z" fill="#94a3b8" />
    
    {/* Desk Top */}
    <path d="M 6 22 L 94 22 L 88 34 L 12 34 Z" fill="#f8fafc" />
    <path d="M 4 15 L 96 15 L 94 22 L 6 22 Z" fill="#ffffff" />
    <path d="M 12 34 L 88 34 L 88 39 L 12 39 Z" fill="#e2e8f0" />
    
    {/* Outline for minimal look */}
    <path d="M 4 15 L 96 15 L 94 22 L 88 34 L 88 39 L 12 39 L 12 34 L 6 22 Z" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
    <line x1="12" y1="34" x2="88" y2="34" stroke="#cbd5e1" strokeWidth="1" />
    <line x1="6" y1="22" x2="94" y2="22" stroke="#cbd5e1" strokeWidth="1" />
  </svg>
);

// ── CHAIRS ───────────────────────────────────────────────────────────────────
const ChairBasic = () => (
  <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xl" preserveAspectRatio="xMidYMax meet">
    {/* Ground shadow */}
    <ellipse cx="50" cy="115" rx="25" ry="5" fill="#000" opacity="0.4" filter="blur(2px)" />
    <defs>
      <linearGradient id="cb_wood_light" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f0c292" />
        <stop offset="100%" stopColor="#d59b5b" />
      </linearGradient>
      <linearGradient id="cb_wood_dark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8a5a2b" />
        <stop offset="100%" stopColor="#5c3815" />
      </linearGradient>
    </defs>
    
    {/* Back Legs */}
    <rect x="30" y="65" width="8" height="50" rx="3" fill="url(#cb_wood_dark)" />
    <rect x="62" y="65" width="8" height="50" rx="3" fill="url(#cb_wood_dark)" />
    
    {/* Backrest Pillars */}
    <rect x="32" y="10" width="6" height="55" rx="2" fill="url(#cb_wood_dark)" />
    <rect x="62" y="10" width="6" height="55" rx="2" fill="url(#cb_wood_dark)" />

    {/* Backrest Board */}
    <path d="M 26 15 Q 50 5 74 15 L 70 40 Q 50 32 30 40 Z" fill="url(#cb_wood_light)" />
    <path d="M 30 40 Q 50 32 70 40 L 70 44 Q 50 36 30 44 Z" fill="url(#cb_wood_dark)" />
    <rect x="42" y="20" width="16" height="15" rx="4" fill="#b57a40" />

    {/* Front Legs */}
    <rect x="22" y="65" width="10" height="50" rx="4" fill="url(#cb_wood_light)" />
    <rect x="68" y="65" width="10" height="50" rx="4" fill="url(#cb_wood_light)" />
    
    {/* Seat Top */}
    <path d="M 18 55 Q 50 48 82 55 Q 88 65 78 72 Q 50 76 22 72 Q 12 65 18 55 Z" fill="url(#cb_wood_light)" />
    {/* Seat depth */}
    <path d="M 22 72 Q 50 76 78 72 L 78 78 Q 50 82 22 78 Z" fill="url(#cb_wood_dark)" />
  </svg>
);
const ChairGaming = () => (
  <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xl" preserveAspectRatio="xMidYMax meet">
    <ellipse cx="50" cy="115" rx="35" ry="6" fill="#000" opacity="0.5" filter="blur(3px)" />
    <defs>
      <linearGradient id="cg_red" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#b91c1c" />
      </linearGradient>
      <linearGradient id="cg_dark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
    </defs>

    <path d="M 50 95 L 15 110 L 20 105 L 50 95" fill="#1e293b" />
    <path d="M 50 95 L 85 110 L 80 105 L 50 95" fill="#1e293b" />
    <path d="M 50 95 L 35 115 L 40 110 L 50 95" fill="#0f172a" />
    <path d="M 50 95 L 65 115 L 60 110 L 50 95" fill="#0f172a" />
    
    <circle cx="15" cy="110" r="3" fill="#020617" />
    <circle cx="85" cy="110" r="3" fill="#020617" />
    <circle cx="35" cy="115" r="3" fill="#020617" />
    <circle cx="65" cy="115" r="3" fill="#020617" />

    <rect x="44" y="70" width="12" height="25" fill="#1e293b" />
    <rect x="47" y="70" width="6" height="25" fill="#0f172a" />
    
    <path d="M 25 10 C 50 -5, 50 -5, 75 10 L 68 65 L 32 65 Z" fill="url(#cg_red)" />
    <path d="M 32 15 C 50 5, 50 5, 68 15 L 62 60 L 38 60 Z" fill="url(#cg_dark)" />
    
    <rect x="35" y="15" width="30" height="14" rx="7" fill="url(#cg_red)" />
    
    <rect x="15" y="50" width="18" height="8" rx="4" fill="url(#cg_dark)" />
    <rect x="67" y="50" width="18" height="8" rx="4" fill="url(#cg_dark)" />
    <rect x="20" y="55" width="8" height="20" fill="#0f172a" />
    <rect x="72" y="55" width="8" height="20" fill="#0f172a" />

    <path d="M 16 65 C 50 58 50 58 84 65 L 88 75 C 50 80 50 80 12 75 Z" fill="url(#cg_red)" />
    <path d="M 22 65 C 50 60 50 60 78 65 L 80 73 C 50 76 50 76 20 73 Z" fill="url(#cg_dark)" />
  </svg>
);
const ChairOffice = () => (
  <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xl" preserveAspectRatio="xMidYMax meet">
    <ellipse cx="50" cy="115" rx="35" ry="6" fill="#000" opacity="0.3" filter="blur(3px)" />
    <defs>
      <linearGradient id="co_gray" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <linearGradient id="co_dark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#64748b" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
    </defs>

    <path d="M 50 95 L 20 110 L 24 105 L 50 95" fill="#1e293b" />
    <path d="M 50 95 L 80 110 L 76 105 L 50 95" fill="#1e293b" />
    <path d="M 50 95 L 35 115 L 40 110 L 50 95" fill="#0f172a" />
    <path d="M 50 95 L 65 115 L 60 110 L 50 95" fill="#0f172a" />
    
    <circle cx="20" cy="110" r="3" fill="#020617" />
    <circle cx="80" cy="110" r="3" fill="#020617" />
    <circle cx="35" cy="115" r="3" fill="#020617" />
    <circle cx="65" cy="115" r="3" fill="#020617" />

    <rect x="45" y="70" width="10" height="25" fill="#1e293b" />
    <rect x="47" y="70" width="6" height="25" fill="#94a3b8" />
    
    <rect x="25" y="15" width="50" height="50" rx="14" fill="url(#co_gray)" />
    <rect x="30" y="18" width="40" height="44" rx="10" fill="url(#co_dark)" />
    <rect x="46" y="60" width="8" height="15" fill="#1e293b" />
    
    <path d="M 16 50 L 26 50 L 26 65" fill="none" stroke="#1e293b" strokeWidth="6" strokeLinejoin="round" />
    <path d="M 84 50 L 74 50 L 74 65" fill="none" stroke="#1e293b" strokeWidth="6" strokeLinejoin="round" />
    <rect x="12" y="46" width="18" height="8" rx="4" fill="#334155" />
    <rect x="70" y="46" width="18" height="8" rx="4" fill="#334155" />
    
    <rect x="18" y="66" width="64" height="14" rx="6" fill="url(#co_gray)" />
    <rect x="22" y="68" width="56" height="10" rx="4" fill="url(#co_dark)" />
  </svg>
);

// ── COMPUTERS (base ~y98, rests on desk) ──
const Laptop = ({ on = true }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <ellipse cx="50" cy="95" rx="42" ry="4" fill="#000" opacity=".12" />
    {/* Lid/Screen Back */}
    <rect x="24" y="30" width="52" height="52" rx="4" fill="#3a3f47" />
    
    {/* Screen Display */}
    <rect x="27" y="33" width="46" height="43" rx="2" fill={on ? "#0f172a" : "#1c2530"} />
    
    {on && (
      <>
        {/* Abstract desktop wallpaper / coding lines */}
        <rect x="31" y="37" width="22" height="2" rx="1" fill="#38bdf8" opacity="0.8" />
        <rect x="31" y="41" width="16" height="2" rx="1" fill="#818cf8" opacity="0.8" />
        <rect x="31" y="45" width="28" height="2" rx="1" fill="#34d399" opacity="0.8" />
        <circle cx="64" cy="40" r="4" fill="#f43f5e" opacity="0.9" />
        
        {/* Specular Diagonal Sheen (Reflection) */}
        <path d="M 27 33 L 55 33 L 27 65 Z" fill="#ffffff" opacity="0.08" />
        <path d="M 45 33 L 73 33 L 45 65 Z" fill="#ffffff" opacity="0.04" />
      </>
    )}
    
    {/* Keyboard Base & Tray */}
    <path d="M14 82 h72 l7 12 H7 z" fill="#cbd5e1" />
    <path d="M14 82 h72 l2 3 H12 z" fill="#f1f5f9" />
    {/* Keyboard Keys Details */}
    <rect x="20" y="84" width="60" height="4" fill="#64748b" opacity="0.6" rx="1" />
    <rect x="18" y="89" width="64" height="3" fill="#64748b" opacity="0.6" rx="1" />
    {/* Trackpad */}
    <rect x="42" y="92" width="16" height="2" rx="0.5" fill="#94a3b8" />
  </svg>
);

const PcMasterRace = ({ on = true }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <ellipse cx="54" cy="95" rx="46" ry="4" fill="#000" opacity=".15" />
    
    {/* RGB Underglow Behind Monitors */}
    {on && (
      <ellipse cx="50" cy="35" rx="42" ry="12" fill="#ec4899" opacity="0.15" filter="blur(6px)">
        <animate attributeName="opacity" values="0.1;0.25;0.1" dur="3s" repeatCount="indefinite" />
      </ellipse>
    )}

    {/* Triple Monitor Screens */}
    {[10, 38, 66].map((x, i) => (
      <g key={i}>
        {/* Monitor Frame */}
        <rect x={x} y={26 + (i === 1 ? -4 : 0)} width="26" height="20" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="0.5" />
        {/* Monitor Screen */}
        <rect x={x + 1} y={27 + (i === 1 ? -4 : 0)} width="24" height="18" rx="2" fill={on ? "#0b0f19" : "#020617"} />
        
        {/* Cyberpunk workspace UI lines */}
        {on && (
          <>
            <path d={`M ${x + 3} ${35 + (i === 1 ? -4 : 0)} L ${x + 15} ${35 + (i === 1 ? -4 : 0)}`} stroke={i === 1 ? "#22d3ee" : "#a855f7"} strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
            <path d={`M ${x + 3} ${40 + (i === 1 ? -4 : 0)} L ${x + 10} ${40 + (i === 1 ? -4 : 0)}`} stroke="#f43f5e" strokeWidth="1" strokeLinecap="round" />
            <circle cx={x + 20} cy={33 + (i === 1 ? -4 : 0)} r="2" fill="#22d3ee" />
            <circle cx={x + 20} cy={39 + (i === 1 ? -4 : 0)} r="1.5" fill="#eab308" />
            {/* Gloss sheen */}
            <path d={`M ${x + 1} ${27 + (i === 1 ? -4 : 0)} L ${x + 12} ${27 + (i === 1 ? -4 : 0)} L ${x + 1} ${38 + (i === 1 ? -4 : 0)} Z`} fill="#ffffff" opacity="0.08" />
          </>
        )}
      </g>
    ))}
    
    {/* Monitor Stands */}
    <rect x="34" y="46" width="40" height="4" rx="2" fill="#1e293b" />
    <rect x="50" y="50" width="8" height="34" rx="2" fill="#334155" />
    <rect x="40" y="84" width="28" height="6" rx="3" fill="#1e293b" />
    
    {/* PC Case Tower (Glass side panel & glowing RGB fans) */}
    <rect x="2" y="56" width="16" height="38" rx="3" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
    {/* Front panel grill */}
    <rect x="15" y="58" width="2" height="34" fill="#334155" />
    
    {/* Interior Glass Showcase */}
    <rect x="4" y="60" width="10" height="32" rx="1.5" fill="#1e293b" />
    {on ? (
      <>
        {/* Glowing CPU cooler / RGB RAM sticks */}
        <rect x="10" y="65" width="2" height="6" fill="#a855f7" />
        <rect x="11.5" y="65" width="1" height="6" fill="#ec4899" />
        
        {/* Glowing dual cooling fans */}
        <circle cx="8" cy="68" r="4.5" fill="none" stroke="#22d3ee" strokeWidth="1.2" opacity="0.8">
          <animate attributeName="stroke" values="#22d3ee;#f43f5e;#22d3ee" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="8" cy="80" r="4.5" fill="none" stroke="#ec4899" strokeWidth="1.2" opacity="0.8">
          <animate attributeName="stroke" values="#ec4899;#a855f7;#ec4899" dur="3s" repeatCount="indefinite" />
        </circle>
        
        {/* Light emission overlay */}
        <rect x="4" y="60" width="10" height="32" rx="1.5" fill="#22d3ee" opacity="0.1" />
      </>
    ) : (
      <rect x="4" y="60" width="10" height="32" rx="1.5" fill="#090d16" />
    )}
  </svg>
);

const Macbook = ({ on = true }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <ellipse cx="50" cy="95" rx="40" ry="4" fill="#000" opacity=".12" />
    {/* Sleek Aluminum Space Gray Lid */}
    <rect x="25" y="30" width="50" height="50" rx="5" fill="#64748b" />
    
    {/* Screen */}
    <rect x="28" y="33" width="44" height="42" rx="2.5" fill={on ? "#111827" : "#030712"} />
    
    {on && (
      <>
        {/* Premium gradient wallpaper */}
        <defs>
          <linearGradient id="mb_wp" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <rect x="29" y="34" width="42" height="40" rx="1.5" fill="url(#mb_wp)" opacity="0.9" />
        {/* Specular highlight sheen */}
        <path d="M 29 34 L 56 34 L 29 65 Z" fill="#ffffff" opacity="0.12" />
        <path d="M 45 34 L 71 34 L 45 65 Z" fill="#ffffff" opacity="0.06" />
        {/* Tiny camera notch / dot */}
        <circle cx="50" cy="35" r="0.75" fill="#fff" />
      </>
    )}
    
    {/* Base keyboard assembly */}
    <path d="M16 80 h68 l6 12 H10 z" fill="#94a3b8" />
    <path d="M16 80 h68 l1.5 3 H14.5 z" fill="#cbd5e1" />
    
    {/* Keyboard key tray */}
    <rect x="22" y="82" width="56" height="5" rx="1" fill="#1e293b" opacity="0.85" />
    {/* Trackpad */}
    <rect x="42" y="88" width="16" height="3" rx="0.5" fill="#64748b" opacity="0.5" />
  </svg>
);

// ── PETS (feet ~y96; interactive) ──
const CatOrange = () => (
  <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xl" preserveAspectRatio="xMidYMax meet">
    <ellipse cx="50" cy="115" rx="35" ry="6" fill="#000" opacity="0.3" filter="blur(2px)" />
    <path d="M 70 95 Q 90 95 90 75 Q 90 60 80 55" stroke="#ea580c" strokeWidth="8" fill="none" strokeLinecap="round" />
    <path d="M 70 95 Q 90 95 90 75 Q 90 60 80 55" stroke="#f97316" strokeWidth="4" fill="none" strokeLinecap="round" />
    
    <ellipse cx="50" cy="85" rx="28" ry="24" fill="#ea580c" />
    <ellipse cx="50" cy="83" rx="26" ry="22" fill="#f97316" />
    <ellipse cx="50" cy="95" rx="14" ry="8" fill="#ffedd5" opacity="0.9" />
    
    <rect x="30" y="95" width="8" height="15" rx="4" fill="#ea580c" />
    <rect x="62" y="95" width="8" height="15" rx="4" fill="#ea580c" />
    <rect x="42" y="100" width="6" height="12" rx="3" fill="#fdba74" />
    <rect x="52" y="100" width="6" height="12" rx="3" fill="#fdba74" />

    {/* Collar & Gold Tag */}
    <rect x="35" y="70" width="30" height="4.5" rx="2" fill="#ef4444" />
    <circle cx="50" cy="74.5" r="3.2" fill="#f59e0b" />
    <circle cx="50" cy="74.5" r="1.5" fill="#fef08a" />

    <path d="M 25 35 L 35 15 L 45 30 Z" fill="#ea580c" />
    <path d="M 28 32 L 34 20 L 40 30 Z" fill="#ffedd5" />
    <path d="M 75 35 L 65 15 L 55 30 Z" fill="#ea580c" />
    <path d="M 72 32 L 66 20 L 60 30 Z" fill="#ffedd5" />
    
    <circle cx="50" cy="45" r="26" fill="#ea580c" />
    <circle cx="50" cy="45" r="24" fill="#f97316" />
    
    <ellipse cx="50" cy="55" rx="12" ry="8" fill="#ffedd5" />
    
    {/* Eyes & Blinks with speculation points */}
    <g className="deco-blink">
      <ellipse cx="38" cy="42" rx="4.5" ry="5.5" fill="#431407" />
      <circle cx="36.5" cy="40.5" r="1.2" fill="#fff" />
      <ellipse cx="62" cy="42" rx="4.5" ry="5.5" fill="#431407" />
      <circle cx="60.5" cy="40.5" r="1.2" fill="#fff" />
    </g>
    
    {/* Rosy Cheeks */}
    <circle cx="28" cy="48" r="3.2" fill="#fda4af" opacity="0.65" />
    <circle cx="72" cy="48" r="3.2" fill="#fda4af" opacity="0.65" />

    <circle cx="50" cy="52" r="2.5" fill="#f43f5e" />
    <path d="M 45 56 Q 50 60 50 56 Q 50 60 55 56" stroke="#431407" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    
    <path d="M 15 45 L 30 48 M 12 52 L 28 52 M 15 59 L 30 56" stroke="#fdba74" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    <path d="M 85 45 L 70 48 M 88 52 L 72 52 M 85 59 L 70 56" stroke="#fdba74" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
  </svg>
);

const CatBlack = () => (
  <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xl" preserveAspectRatio="xMidYMax meet">
    <ellipse cx="50" cy="115" rx="35" ry="6" fill="#000" opacity="0.3" filter="blur(2px)" />
    <path d="M 70 95 Q 90 95 90 75 Q 90 60 80 55" stroke="#0f172a" strokeWidth="8" fill="none" strokeLinecap="round" />
    <path d="M 70 95 Q 90 95 90 75 Q 90 60 80 55" stroke="#1e293b" strokeWidth="4" fill="none" strokeLinecap="round" />
    
    <ellipse cx="50" cy="85" rx="28" ry="24" fill="#0f172a" />
    <ellipse cx="50" cy="83" rx="26" ry="22" fill="#1e293b" />
    <ellipse cx="50" cy="95" rx="14" ry="8" fill="#334155" opacity="0.9" />
    
    <rect x="30" y="95" width="8" height="15" rx="4" fill="#0f172a" />
    <rect x="62" y="95" width="8" height="15" rx="4" fill="#0f172a" />
    <rect x="42" y="100" width="6" height="12" rx="3" fill="#475569" />
    <rect x="52" y="100" width="6" height="12" rx="3" fill="#475569" />

    {/* Collar & Gold Tag */}
    <rect x="35" y="70" width="30" height="4.5" rx="2" fill="#10b981" />
    <circle cx="50" cy="74.5" r="3.2" fill="#f59e0b" />
    <circle cx="50" cy="74.5" r="1.5" fill="#fef08a" />

    <path d="M 25 35 L 35 15 L 45 30 Z" fill="#0f172a" />
    <path d="M 28 32 L 34 20 L 40 30 Z" fill="#334155" />
    <path d="M 75 35 L 65 15 L 55 30 Z" fill="#0f172a" />
    <path d="M 72 32 L 66 20 L 60 30 Z" fill="#334155" />
    
    <circle cx="50" cy="45" r="26" fill="#0f172a" />
    <circle cx="50" cy="45" r="24" fill="#1e293b" />
    
    <ellipse cx="50" cy="55" rx="12" ry="8" fill="#334155" />
    
    {/* Eyes & Blinks with speculation points */}
    <g className="deco-blink">
      <ellipse cx="38" cy="42" rx="5.5" ry="6.5" fill="#eab308" />
      <circle cx="36" cy="40" r="1.5" fill="#0f172a" />
      <circle cx="37.5" cy="38.5" r="0.8" fill="#fff" />
      
      <ellipse cx="62" cy="42" rx="5.5" ry="6.5" fill="#eab308" />
      <circle cx="64" cy="40" r="1.5" fill="#0f172a" />
      <circle cx="63.5" cy="38.5" r="0.8" fill="#fff" />
    </g>
    
    {/* Rosy Cheeks */}
    <circle cx="28" cy="48" r="3.2" fill="#fda4af" opacity="0.45" />
    <circle cx="72" cy="48" r="3.2" fill="#fda4af" opacity="0.45" />

    <circle cx="50" cy="52" r="2.5" fill="#f43f5e" />
    <path d="M 45 56 Q 50 60 50 56 Q 50 60 55 56" stroke="#0f172a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    
    <path d="M 15 45 L 30 48 M 12 52 L 28 52 M 15 59 L 30 56" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    <path d="M 85 45 L 70 48 M 88 52 L 72 52 M 85 59 L 70 56" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
  </svg>
);

const DogCorgi = () => (
  <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xl" preserveAspectRatio="xMidYMax meet">
    <ellipse cx="50" cy="115" rx="35" ry="6" fill="#000" opacity="0.3" filter="blur(2px)" />
    
    <ellipse cx="50" cy="85" rx="32" ry="20" fill="#d97706" />
    <ellipse cx="50" cy="83" rx="30" ry="18" fill="#f59e0b" />
    
    <ellipse cx="50" cy="95" rx="20" ry="8" fill="#fff" opacity="0.9" />
    
    <rect x="25" y="95" width="10" height="15" rx="5" fill="#d97706" />
    <rect x="65" y="95" width="10" height="15" rx="5" fill="#d97706" />
    <rect x="40" y="100" width="8" height="12" rx="4" fill="#fef3c7" />
    <rect x="52" y="100" width="8" height="12" rx="4" fill="#fef3c7" />

    {/* Collar & Gold Tag */}
    <rect x="34" y="72" width="32" height="4.5" rx="2" fill="#3b82f6" />
    <circle cx="50" cy="76.5" r="3" fill="#f59e0b" />
    <circle cx="50" cy="76.5" r="1.2" fill="#fef08a" />

    <path d="M 25 35 L 20 15 L 45 35 Z" fill="#d97706" />
    <path d="M 28 32 L 25 20 L 40 32 Z" fill="#fef3c7" />
    <path d="M 75 35 L 80 15 L 55 35 Z" fill="#d97706" />
    <path d="M 72 32 L 75 20 L 60 32 Z" fill="#fef3c7" />
    
    <circle cx="50" cy="45" r="26" fill="#d97706" />
    <circle cx="50" cy="45" r="24" fill="#f59e0b" />
    <path d="M 30 45 Q 50 70 70 45 Z" fill="#fff" />
    
    {/* Eyes & Blinks with speculation points */}
    <g className="deco-blink">
      <ellipse cx="40" cy="40" rx="4.5" ry="5.5" fill="#431407" />
      <circle cx="38.5" cy="38.5" r="1.2" fill="#fff" />
      <ellipse cx="60" cy="40" rx="4.5" ry="5.5" fill="#431407" />
      <circle cx="58.5" cy="38.5" r="1.2" fill="#fff" />
    </g>

    {/* Rosy Cheeks */}
    <circle cx="30" cy="48" r="3.2" fill="#fda4af" opacity="0.6" />
    <circle cx="70" cy="48" r="3.2" fill="#fda4af" opacity="0.6" />
    
    <ellipse cx="50" cy="52" rx="5" ry="3" fill="#1c1917" />
    <path d="M 45 56 Q 50 62 55 56" stroke="#431407" strokeWidth="2" fill="none" strokeLinecap="round" />
    
    <path d="M 50 56 Q 50 65 50 65" stroke="#ef4444" strokeWidth="6" fill="none" strokeLinecap="round" />
  </svg>
);

// ── POSTERS (on wall) ────────────────────────────────────────────────────────
const PosterHugo = () => (
  <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md">
    <rect x="5" y="5" width="90" height="110" rx="4" fill="#1e1b4b" />
    <rect x="10" y="10" width="80" height="100" rx="2" fill="#4338ca" />
    <defs>
      <linearGradient id="ph_grad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#818cf8" />
        <stop offset="100%" stopColor="#c084fc" />
      </linearGradient>
    </defs>
    <rect x="12" y="12" width="76" height="96" fill="url(#ph_grad2)" />
    
    <circle cx="50" cy="55" r="28" fill="#fde047" />
    <circle cx="50" cy="55" r="22" fill="#fef08a" />
    <path d="M 25 108 L 75 108 L 50 75 Z" fill="#6366f1" opacity="0.8" />
    <path d="M 12 108 L 50 108 L 30 80 Z" fill="#4f46e5" opacity="0.6" />
    <path d="M 88 108 L 50 108 L 70 80 Z" fill="#4338ca" opacity="0.5" />
    
    <text x="50" y="68" textAnchor="middle" fontSize="36" fontWeight="900" fill="#fff" filter="drop-shadow(0px 3px 3px rgba(0,0,0,0.4))">H</text>
  </svg>
);
const PosterAnime = () => (
  <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md">
    <rect x="5" y="5" width="90" height="110" rx="4" fill="#fdf2f8" stroke="#fbcfe8" strokeWidth="2" />
    <defs>
      <linearGradient id="pa_grad2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fecdd3" />
        <stop offset="100%" stopColor="#a78bfa" />
      </linearGradient>
    </defs>
    <rect x="10" y="10" width="80" height="100" rx="2" fill="url(#pa_grad2)" />
    
    <circle cx="30" cy="35" r="16" fill="#fff" opacity="0.8" />
    <circle cx="50" cy="28" r="20" fill="#fff" opacity="0.8" />
    <circle cx="75" cy="35" r="14" fill="#fff" opacity="0.8" />
    <rect x="30" y="28" width="45" height="20" fill="#fff" opacity="0.8" />

    <path d="M 80 20 L 83 28 L 91 32 L 83 36 L 80 44 L 77 36 L 69 32 L 77 28 Z" fill="#fef08a" />
    <path d="M 25 50 L 27 55 L 32 57 L 27 59 L 25 64 L 23 59 L 18 57 L 23 55 Z" fill="#fef08a" transform="scale(0.8) translate(5, 10)" />
    
    <path d="M 85 70 A 20 20 0 1 1 65 50 A 16 16 0 1 0 85 70 Z" fill="#fef08a" />

    <path d="M 10 110 Q 30 75 55 110 Z" fill="#c4b5fd" opacity="0.9" />
    <path d="M 40 110 Q 70 60 90 110 Z" fill="#a78bfa" opacity="0.8" />
  </svg>
);
const PosterCyber = () => (
  <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md">
    <rect x="5" y="5" width="90" height="110" rx="4" fill="#020617" />
    <defs>
      <linearGradient id="pc_grad2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1e1b4b" />
        <stop offset="60%" stopColor="#4c1d95" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
    </defs>
    <rect x="8" y="8" width="84" height="104" rx="2" fill="url(#pc_grad2)" />
    
    <circle cx="50" cy="60" r="24" fill="#ec4899" />
    <rect x="15" y="65" width="70" height="2" fill="url(#pc_grad2)" />
    <rect x="15" y="70" width="70" height="3" fill="url(#pc_grad2)" />
    <rect x="15" y="76" width="70" height="4" fill="url(#pc_grad2)" />
    
    <path d="M 8 82 L 92 82 L 92 112 L 8 112 Z" fill="#0f172a" />
    <path d="M 8 90 L 92 90 M 8 98 L 92 98 M 8 106 L 92 106" stroke="#22d3ee" strokeWidth="1.5" opacity="0.6" />
    <path d="M 50 82 L 50 112 M 30 82 L 10 112 M 70 82 L 90 112" stroke="#22d3ee" strokeWidth="1.5" opacity="0.6" />
    
    <rect x="8" y="8" width="84" height="104" rx="2" fill="none" stroke="#22d3ee" strokeWidth="2" opacity="0.8" />
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
    {/* Base fringe (tassels) */}
    <path d="M 2 50 L 5 50 M 95 50 L 98 50" stroke="#fef08a" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
    <path d="M 3 45 L 6 55 M 94 45 L 97 55" stroke="#fde047" strokeWidth="2" />
    
    {/* Main Outer Layer */}
    <ellipse cx="50" cy="50" rx="47" ry="29" fill="#991b1b" />
    {/* Ornate Gold Border */}
    <ellipse cx="50" cy="50" rx="43" ry="25" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 2" />
    
    {/* Inside Blue Medallion Frame */}
    <ellipse cx="50" cy="50" rx="34" ry="19" fill="#1e3a8a" />
    
    {/* Center Gold Crest */}
    <ellipse cx="50" cy="50" rx="20" ry="10" fill="#dc2626" />
    <path d="M 50 43 L 55 50 L 50 57 L 45 50 Z" fill="#fbbf24" />
    
    {/* Side Corner Accents */}
    <circle cx="24" cy="50" r="3.5" fill="#f59e0b" />
    <circle cx="76" cy="50" r="3.5" fill="#f59e0b" />
    <circle cx="34" cy="42" r="1.5" fill="#fff" opacity="0.7" />
    <circle cx="66" cy="42" r="1.5" fill="#fff" opacity="0.7" />
    <circle cx="34" cy="58" r="1.5" fill="#fff" opacity="0.7" />
    <circle cx="66" cy="58" r="1.5" fill="#fff" opacity="0.7" />
  </svg>
);

// ── PLANTS ──
const PlantFern = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <ellipse cx="50" cy="96" rx="20" ry="3.5" fill="#000" opacity=".12" />
    
    {/* Green Fronds with details */}
    {[-42, -21, 0, 21, 42].map((r, i) => (
      <g key={i} transform={`rotate(${r} 50 72)`}>
        <path d="M50 72 Q50 28 50 18" stroke={i % 2 ? "#15803d" : "#166534"} strokeWidth="7" fill="none" strokeLinecap="round" />
        {/* Leaf stems / ridges */}
        <path d="M50 22 Q46 25 45 28 M50 30 Q54 33 55 36 M50 38 Q45 42 44 46 M50 48 Q55 52 56 56" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      </g>
    ))}
    
    {/* Ceramic Pot with Gold Rim Accent */}
    <path d="M34 68 h32 l-4 28 h-24 z" fill="#eae8e6" />
    <path d="M34 68 h32 l-1 5 h-30 z" fill="#d97706" /> {/* Terracotta gold band */}
    <rect x="37" y="77" width="26" height="1.5" fill="#fbbf24" /> {/* Gold line details */}
  </svg>
);

const PlantMonstera = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <ellipse cx="50" cy="96" rx="22" ry="3.5" fill="#000" opacity=".12" />
    
    {/* Detailed Monstera Leaves */}
    {[[-24, .82], [0, 1], [24, .82]].map(([r, s], i) => (
      <g key={i} transform={`rotate(${r} 50 70) scale(${s})`} style={{ transformOrigin: "50px 70px" }}>
        <ellipse cx="50" cy="38" rx="16" ry="22" fill="#166534" />
        {/* Monstera leaf slits (punched holes) */}
        <path d="M 38 28 Q 50 38 42 38 M 62 28 Q 50 38 58 38 M 36 44 Q 50 48 42 48 M 64 44 Q 50 48 58 48" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="50" cy="38" rx="15" ry="21" fill="#15803d" />
        {/* Veins */}
        <path d="M50 22 v34 M42 32 Q48 34 50 35 M50 44 Q54 46 58 48 M42 48 Q48 50 50 51" stroke="#22c55e" strokeWidth="1.5" />
      </g>
    ))}
    
    {/* Ceramic Pot */}
    <path d="M37 68 h26 l-4 28 h-18 z" fill="#f8fafc" />
    <path d="M37 68 h26 l-1 5 h-24 z" fill="#64748b" />
    <circle cx="50" cy="80" r="3.5" fill="#3b82f6" opacity="0.3" /> {/* Brand icon on pot */}
  </svg>
);

const PlantCactus = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <ellipse cx="50" cy="96" rx="18" ry="3.5" fill="#000" opacity=".12" />
    
    {/* Main Cactus Body */}
    <rect x="40" y="32" width="20" height="44" rx="10" fill="#15803d" />
    <rect x="24" y="46" width="12" height="20" rx="6" fill="#166534" />
    <rect x="64" y="40" width="12" height="24" rx="6" fill="#166534" />
    
    {/* Cactus Needles / Ribs */}
    <path d="M 45 38 L 45 70 M 50 36 L 50 72 M 55 38 L 55 70" stroke="#22c55e" strokeWidth="1" strokeLinecap="round" strokeDasharray="1 3" />
    <path d="M 28 50 L 28 62" stroke="#4ade80" strokeWidth="1" strokeDasharray="1 2" />
    <path d="M 70 44 L 70 60" stroke="#4ade80" strokeWidth="1" strokeDasharray="1 2" />
    
    {/* Pink Flowers */}
    <circle cx="50" cy="32" r="4.5" fill="#f43f5e" />
    <circle cx="50" cy="32" r="2.5" fill="#fda4af" />
    <circle cx="28" cy="45" r="2.5" fill="#f43f5e" />
    <circle cx="70" cy="39" r="3" fill="#f43f5e" />
    
    {/* Clay Terracotta Pot */}
    <path d="M34 74 h32 l-3 22 h-26 z" fill="#c2410c" />
    <path d="M32 74 h36 l-1 5 h-34 z" fill="#ea580c" />
  </svg>
);

// ── LAMPS (mood light) ───────────────────────────────────────────────────────
const LampFloor = () => (
  <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xl" preserveAspectRatio="xMidYMax meet">
    <ellipse cx="50" cy="115" rx="20" ry="4" fill="#000" opacity="0.4" filter="blur(2px)" />
    <ellipse cx="50" cy="112" rx="20" ry="4" fill="#a8a29e" />
    <ellipse cx="50" cy="110" rx="20" ry="4" fill="#d6d3d1" />
    
    <rect x="47" y="30" width="6" height="80" fill="#a8a29e" />
    <rect x="47" y="30" width="3" height="80" fill="#e7e5e4" />
    
    <ellipse cx="50" cy="35" rx="30" ry="15" fill="#fef08a" opacity="0.4" filter="blur(5px)">
      <animate attributeName="opacity" values=".3;.6;.3" dur="3s" repeatCount="indefinite" />
    </ellipse>
    <path d="M 20 40 L 80 40 L 90 90 L 10 90 Z" fill="#fef08a" opacity="0.15">
      <animate attributeName="opacity" values=".1;.25;.1" dur="3s" repeatCount="indefinite" />
    </path>
    
    <path d="M 35 15 C 35 5, 65 5, 65 15 L 80 40 C 80 50, 20 50, 20 40 Z" fill="#facc15" />
    <path d="M 35 15 C 35 5, 65 5, 65 15 L 77 40 C 77 50, 23 50, 23 40 Z" fill="#fef08a" />
    <path d="M 20 40 C 20 50, 80 50, 80 40 C 80 30, 20 30, 20 40 Z" fill="#fde047" opacity="0.8" />
  </svg>
);
const LampNeon = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl" preserveAspectRatio="xMidYMax meet">
    {/* Base wall mount */}
    <rect x="40" y="85" width="20" height="8" rx="3" fill="#334155" />
    <rect x="48" y="75" width="4" height="10" fill="#475569" />
    
    {/* Glow background */}
    <path d="M 25 75 Q 5 40 35 20 Q 65 0 85 30 Q 95 60 65 75" fill="none" stroke="#f0abfc" strokeWidth="16" strokeLinecap="round" opacity="0.3" filter="blur(4px)">
      <animate attributeName="opacity" values=".2;.5;.2" dur="4s" repeatCount="indefinite" />
    </path>
    
    {/* Neon tube */}
    <path d="M 25 75 Q 5 40 35 20 Q 65 0 85 30 Q 95 60 65 75" stroke="#f0abfc" strokeWidth="5" fill="none" strokeLinecap="round">
      <animate attributeName="stroke" values="#f0abfc;#22d3ee;#f0abfc" dur="4s" repeatCount="indefinite" />
    </path>
    <path d="M 25 75 Q 5 40 35 20 Q 65 0 85 30 Q 95 60 65 75" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
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

@keyframes driftUp {
  0% { transform: translateY(0) scale(0.85); opacity: 0; }
  15% { opacity: 0.6; }
  85% { opacity: 0.2; }
  100% { transform: translateY(-28px) scale(1.1); opacity: 0; }
}
@keyframes sway {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(4px); }
}
@keyframes sweepBroom {
  0%, 100% { transform: rotate(-22deg) translate(0, 0); }
  50% { transform: rotate(18deg) translate(-14px, 5px); }
}
@keyframes sparkleScale {
  0% { transform: scale(0) rotate(0deg); opacity: 0; }
  50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
  100% { transform: scale(0) rotate(360deg); opacity: 0; }
}
`;

const FLOOR_TOP = 60;
const DESK_TOP = 48;
const DESK_BOTTOM = 90;
const DESK_LEFT = 30;
const DESK_WIDTH = 46;
const DESK_HEIGHT = DESK_BOTTOM - DESK_TOP;
const DESK_CX = DESK_LEFT + DESK_WIDTH / 2;
const SURFACE_Y = DESK_TOP + DESK_HEIGHT * DESK_SURFACE_FRAC;


function Draggable({ slot, itemId, left, bottom, width, height, zIndex, positions, onPositionChange, interactive, filter, className="", children, extra={}, onClick }) {
  const customPos = positions?.[slot];
  const currentLeft = customPos?.left ?? left;
  const currentBottom = customPos?.bottom ?? bottom;

  const elementRef = React.useRef(null);

  const handlePointerDown = (e) => {
    if (!interactive) return;
    
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    
    const startX = e.clientX;
    const startY = e.clientY;
    let hasMoved = false;

    if (elementRef.current) {
      elementRef.current.style.animation = 'none';
    }

    const onPointerMove = (moveEvent) => {
      const mx = moveEvent.clientX - startX;
      const my = moveEvent.clientY - startY;
      if (Math.abs(mx) > 3 || Math.abs(my) > 3) {
        hasMoved = true;
      }
      
      if (elementRef.current) {
        // Direct DOM manipulation for maximum 60hz/120hz smoothness
        elementRef.current.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
        elementRef.current.style.zIndex = '999';
        elementRef.current.style.transition = 'none';
        elementRef.current.style.animation = 'none';
      }
    };

    const onPointerUp = (upEvent) => {
      target.releasePointerCapture(upEvent.pointerId);
      target.removeEventListener('pointermove', onPointerMove);
      target.removeEventListener('pointerup', onPointerUp);
      target.removeEventListener('pointercancel', onPointerUp);
      
      const mx = upEvent.clientX - startX;
      const my = upEvent.clientY - startY;
      
      if (elementRef.current) {
        elementRef.current.style.transform = '';
        elementRef.current.style.zIndex = '';
        elementRef.current.style.transition = '';
      }
      
      if (hasMoved) {
        const parent = document.getElementById('room-scene-container');
        if (parent) {
          const rect = parent.getBoundingClientRect();
          const dxPct = (mx / rect.width) * 100;
          const dyPct = (my / rect.height) * 100;
          
          let nextLeft = currentLeft + dxPct;
          let nextBottom = currentBottom + dyPct;
          
          // Clamp horizontally (allowing small overhang, e.g. 5%)
          const aspect = width / height;
          const pxWidth = rect.height * (height / 100) * aspect;
          const pctWidth = (pxWidth / rect.width) * 100;
          const minL = -5;
          const maxL = 105 - pctWidth;
          nextLeft = Math.max(minL, Math.min(maxL, nextLeft));
          
          // Clamp vertically
          const minB = height - 5;
          const maxB = 105;
          nextBottom = Math.max(minB, Math.min(maxB, nextBottom));
          
          onPositionChange?.(slot, {
            left: nextLeft,
            bottom: nextBottom
          });
        }
      } else {
        onClick?.();
      }
    };

    target.addEventListener('pointermove', onPointerMove);
    target.addEventListener('pointerup', onPointerUp);
    target.addEventListener('pointercancel', onPointerUp);
  };

  return (
    <div
      ref={elementRef}
      onPointerDown={handlePointerDown}
      className={`absolute ${className} ${interactive ? 'cursor-grab active:cursor-grabbing' : ''}`}
      style={{
        left: `${currentLeft}%`,
        bottom: `${100 - currentBottom}%`,
        height: `${height}%`,
        width: 'auto',
        aspectRatio: `${width} / ${height}`,
        zIndex,
        filter,
        touchAction: interactive ? 'none' : 'auto',
        ...extra
      }}
    >
      {children || <RoomItem id={itemId} />}
    </div>
  );
}

export function DecoRoomScene({ room = {}, interactive = false, lastCleanedAt, onCleanSuccess, onItemClick, onPositionChange, className = "", zoom }) {
  const items = room.items || {};
  const positions = room.positions || {};
  const night = isNightRoom(items);

  const isDirty = React.useMemo(() => {
    if (!lastCleanedAt) return false;
    const last = new Date(lastCleanedAt).getTime();
    return Date.now() - last >= 12 * 60 * 60 * 1000;
  }, [lastCleanedAt]);

  const [cleanState, setCleanState] = React.useState('clean'); // 'dirty', 'sweeping', 'sparkling', 'clean'
  const [isCleaning, setIsCleaning] = React.useState(false);

  React.useEffect(() => {
    setCleanState(isDirty ? 'dirty' : 'clean');
  }, [isDirty]);

  const startCleaning = async (e) => {
    e.stopPropagation();
    if (cleanState !== 'dirty' || isCleaning || !interactive || !onCleanSuccess) return;
    setIsCleaning(true);
    setCleanState('sweeping');

    try {
      const res = await fetch('/api/deco/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTimeout(() => {
        setCleanState('sparkling');
        onCleanSuccess?.(data.balance, data.lastCleanedAt);
        setIsCleaning(false);
      }, 1500);
    } catch (err) {
      alert(err.message || 'Lỗi quét dọn rác');
      setCleanState('dirty');
      setIsCleaning(false);
    }
  };
  
  const wallKey = room.wallColor || (night ? "#2a2440" : "#f4f4f5");
  const wallMap = {
    wall_white: "#f4f4f5",
    wall_pink: "#fbcfe8",
    wall_blue: "#ccfbf1",
    wall_dark: "#1e1b4b",
    wall_yellow: "#fef08a",
  };
  const wall = wallMap[wallKey] || wallKey;

  const [petHop, setPetHop] = React.useState(false);

  const clickPet = () => {
    if (!interactive) return;
    setPetHop(true);
    setTimeout(() => setPetHop(false), 700);
    onItemClick?.("pet");
  };

  const floorStyleKey = room.floorStyle || 'wood_basic';
  const floorTint = {
    wood_basic: "linear-gradient(180deg,#d29a5e,#a9713a)",
    wood_dark: "linear-gradient(180deg,#6b4423,#4a2e17)",
    floor_wood_dark: "linear-gradient(180deg,#6b4423,#4a2e17)",
    tile_white: "linear-gradient(180deg,#eceff4,#cfd4de)",
    floor_tile_white: "linear-gradient(180deg,#eceff4,#cfd4de)",
    tile_checker: "repeating-conic-gradient(#e5e7eb 0deg 90deg,#9ca3af 90deg 180deg)",
    floor_tile_checker: "repeating-conic-gradient(#e5e7eb 0deg 90deg,#9ca3af 90deg 180deg)",
  }[floorStyleKey] || "linear-gradient(180deg,#d29a5e,#a9713a)";

  const dragProps = { positions, onPositionChange, interactive };

  return (
    <div id="room-scene-container" className={`relative w-full h-full overflow-hidden select-none ${className}`}>
      <style>{SCENE_CSS}</style>

      <div 
        className="w-full h-full relative" 
        style={zoom ? {
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          width: `${100 / zoom}%`,
          height: `${100 / zoom}%`
        } : undefined}
      >
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${wall}, ${shade(wall, night ? -8 : -6)})` }}>
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
        </div>

        {items.window && <Draggable slot="window" itemId={items.window} left={66} width={26} bottom={52} height={44} className="drop-shadow-md" {...dragProps} />}
        {items.poster && <Draggable slot="poster" itemId={items.poster} left={7} width={14} bottom={50} height={40} className="drop-shadow-md" {...dragProps} />}

        {items.lamp && (
          <div className="absolute pointer-events-none" style={{ bottom: "16%", left: "2%", width: "42%", height: "56%", background: "radial-gradient(circle at 28% 55%, rgba(255,224,150,.5), transparent 62%)", animation: "decoGlow 3.5s ease-in-out infinite" }} />
        )}

        <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: `${100 - FLOOR_TOP}%`, backgroundImage: floorTint, backgroundSize: room.floorStyle === "tile_checker" ? "44px 44px" : undefined }}>
          <div className="absolute top-0 left-0 right-0 h-[5px] bg-black/15" />
          {!room.floorStyle?.startsWith("tile") && (
            <div className="absolute inset-0 opacity-[0.13]" style={{ backgroundImage: "linear-gradient(90deg,transparent 48%,#000 50%,transparent 52%)", backgroundSize: "46px 100%" }} />
          )}
        </div>

        {items.rug && <Draggable slot="rug" itemId={items.rug} left={18} width={64} bottom={88} height={20} zIndex={1} filter="drop-shadow(0 4px 6px rgba(0,0,0,.15))" {...dragProps} />}
        {items.lamp && <Draggable slot="lamp" itemId={items.lamp} left={28} width={12} bottom={63} height={25} extra={{ animation: "decoFloat 6s ease-in-out infinite" }} zIndex={6} filter="drop-shadow(0 15px 15px rgba(0,0,0,.3))" {...dragProps} />}
        {items.plant && <Draggable slot="plant" itemId={items.plant} left={76} width={22} bottom={92} height={36} zIndex={8} filter="drop-shadow(0 12px 10px rgba(0,0,0,.25))" {...dragProps} />}
        {items.desk && <Draggable slot="desk" itemId={items.desk} left={DESK_LEFT} width={DESK_WIDTH} bottom={DESK_BOTTOM} height={DESK_HEIGHT} zIndex={10} filter="drop-shadow(0 15px 12px rgba(0,0,0,.4))" {...dragProps} />}

        {items.computer && (
          <Draggable slot="computer" itemId={items.computer} left={DESK_CX - 12} width={24} bottom={SURFACE_Y + 1} height={22} zIndex={12} filter="drop-shadow(0 8px 8px rgba(0,0,0,.2))" onClick={() => interactive && onItemClick?.("computer")} {...dragProps} />
        )}

        {items.chair && (
          <Draggable slot="chair" itemId={items.chair} left={18} width={28} bottom={96} height={46} zIndex={20} filter="drop-shadow(0 18px 15px rgba(0,0,0,.5))" className="transition-transform hover:-translate-y-1 hover:scale-105 duration-300" {...dragProps} />
        )}

        {items.pet && (
          <Draggable slot="pet" itemId={items.pet} left={68} width={20} bottom={97} height={30} zIndex={30} filter="drop-shadow(0 12px 10px rgba(0,0,0,.3))" extra={{ animation: petHop ? "decoHop .7s ease" : "decoFloat 4s ease-in-out infinite" }} onClick={clickPet} {...dragProps} />
        )}

        {/* Trash & Cleaning Elements */}
        {cleanState !== 'clean' && (
          <div 
            onClick={startCleaning}
            className={`absolute z-[25] group transition-all duration-300 ${interactive && cleanState === 'dirty' ? 'cursor-pointer hover:scale-105' : 'pointer-events-none'}`}
            style={{
              bottom: '8%',
              left: '52%',
              width: '85px',
              height: '80px',
            }}
          >
            {/* Smelly green fumes (only when dirty) */}
            {cleanState === 'dirty' && (
              <div className="absolute inset-0 pointer-events-none overflow-visible">
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                  {/* Fume 1 */}
                  <path d="M 30,50 Q 20,30 30,10" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"
                    style={{ animation: 'driftUp 2.8s ease-in-out infinite, sway 1.8s ease-in-out infinite' }} />
                  {/* Fume 2 */}
                  <path d="M 50,55 Q 60,35 45,15" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" opacity="0.5"
                    style={{ animation: 'driftUp 3.2s ease-in-out infinite 0.6s, sway 2.2s ease-in-out infinite 0.3s' }} />
                  {/* Fume 3 */}
                  <path d="M 70,50 Q 60,32 75,12" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" opacity="0.65"
                    style={{ animation: 'driftUp 2.5s ease-in-out infinite 1.2s, sway 1.5s ease-in-out infinite 0.8s' }} />
                </svg>
              </div>
            )}

            {/* Trash Pile SVG (fades out when sweeping/clean) */}
            {(cleanState === 'dirty' || cleanState === 'sweeping') && (
              <div className={`w-full h-full transition-opacity duration-500 ${cleanState === 'sweeping' ? 'opacity-40 scale-90' : 'opacity-100'}`}>
                <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-md">
                  {/* Crumpled paper balls */}
                  <path d="M 25,65 Q 18,52 32,54 Z" fill="#e4e4e7" stroke="#a1a1aa" strokeWidth="1" />
                  <path d="M 55,68 Q 62,56 70,62 Z" fill="#d4d4d8" stroke="#71717a" strokeWidth="1" />
                  {/* Banana peel */}
                  <path d="M 35,62 C 30,64 22,60 18,65 C 28,68 35,65 35,62 Z" fill="#facc15" />
                  <path d="M 35,62 C 38,58 42,55 50,60 C 45,63 38,64 35,62 Z" fill="#eab308" />
                  <path d="M 38,58 C 30,55 35,50 36,46 C 40,49 42,54 38,58 Z" fill="#facc15" />
                  <circle cx="28" cy="61" r="1" fill="#713f12" />
                  <circle cx="43" cy="57" r="1.2" fill="#713f12" />
                  {/* Apple core */}
                  <path d="M 46,65 L 52,65 Q 49,60 49,54 L 47,54 Q 47,60 46,65 Z" fill="#fafafa" stroke="#d4d4d8" strokeWidth="0.5" />
                  <path d="M 45,54 Q 49,51 53,54 L 45,54" fill="#b91c1c" />
                  <path d="M 45,65 Q 49,68 53,65 L 45,65" fill="#b91c1c" />
                  <path d="M 49,51 Q 50,45 52,43" fill="none" stroke="#78350f" strokeWidth="1.5" />
                  {/* Dust dots */}
                  <circle cx="15" cy="70" r="1.5" fill="#71717a" />
                  <circle cx="75" cy="68" r="2.2" fill="#52525b" />
                  <circle cx="82" cy="72" r="1" fill="#3f3f46" />
                </svg>
              </div>
            )}

            {/* Sweep Broom SVG (only when sweeping) */}
            {cleanState === 'sweeping' && (
              <div 
                className="absolute inset-0 pointer-events-none origin-bottom-right"
                style={{
                  width: '80px',
                  height: '110px',
                  bottom: '15px',
                  right: '-15px',
                  animation: 'sweepBroom 0.5s ease-in-out infinite'
                }}
              >
                <svg viewBox="0 0 80 120" className="w-full h-full drop-shadow-lg">
                  {/* Wood Handle */}
                  <rect x="36" y="5" width="6" height="75" rx="3" fill="#b45309" stroke="#78350f" strokeWidth="1" />
                  {/* Handle Grip tip */}
                  <path d="M 36,15 L 42,15 L 42,5 A 3,3 0 0,0 36,5 Z" fill="#78350f" />
                  {/* Gold bristle holder */}
                  <path d="M 24,80 L 54,80 L 58,95 L 20,95 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="1.2" />
                  {/* Bristles */}
                  <path d="M 20,95 Q 6,118 12,120 Q 39,112 70,118 Q 72,114 58,95 Z" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
                  {/* Bristle texture lines */}
                  <path d="M 28,95 L 22,112" stroke="#ca8a04" strokeWidth="1" strokeLinecap="round" />
                  <path d="M 38,95 L 39,114" stroke="#ca8a04" strokeWidth="1" strokeLinecap="round" />
                  <path d="M 48,95 L 56,112" stroke="#ca8a04" strokeWidth="1" strokeLinecap="round" />
                </svg>
              </div>
            )}

            {/* Sparkle Clean Effect (only when sparkling) */}
            {cleanState === 'sparkling' && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                  {/* Sparkle Star 1 */}
                  <path d="M 50,20 Q 50,40 30,40 Q 50,40 50,60 Q 50,40 70,40 Q 50,40 50,20" fill="#facc15"
                    style={{ transformOrigin: 'center', animation: 'sparkleScale 1s ease-in-out forwards' }} />
                  {/* Sparkle Star 2 */}
                  <path d="M 25,45 Q 25,55 15,55 Q 25,55 25,65 Q 25,55 35,55 Q 25,55 25,45" fill="#facc15"
                    style={{ transformOrigin: 'center', animation: 'sparkleScale 0.8s ease-in-out forwards 0.2s' }} />
                  {/* Sparkle Star 3 */}
                  <path d="M 75,55 Q 75,65 65,65 Q 75,65 75,75 Q 75,65 85,65 Q 75,65 75,55" fill="#facc15"
                    style={{ transformOrigin: 'center', animation: 'sparkleScale 0.9s ease-in-out forwards 0.1s' }} />
                </svg>
              </div>
            )}

            {/* Tooltip text when dirty and interactive */}
            {interactive && cleanState === 'dirty' && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-950/85 backdrop-blur-sm text-white px-2.5 py-1 rounded-xl text-[9px] font-black tracking-wide whitespace-nowrap border border-zinc-800 shadow-xl opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity pointer-events-none">
                🧹 Quét rác dọn phòng (+5 JOY)
              </div>
            )}
          </div>
        )}

        {night && <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 70% 22%, rgba(120,120,255,.10), rgba(10,8,30,.42) 92%)" }} />}
      </div>
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
