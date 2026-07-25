// Per-game visual themes for the standalone game shell.
// Each game gets its own gradient, accent color, glow, and icon —
// creating the illusion of a separate app within the app.

const GAME_THEMES = {
  chess: {
    name: "HugoChess AI 2500",
    icon: "castle",
    gradient: "linear-gradient(135deg, #1a1040 0%, #0d0a1a 40%, #050210 100%)",
    accent: "#a78bfa",
    accentGlow: "rgba(167,139,250,0.35)",
    headerBg: "rgba(26,16,64,0.95)",
    statusBar: "linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed)",
  },
  survivor: {
    name: "Space Survivor",
    icon: "rocket",
    gradient: "linear-gradient(135deg, #0f172a 0%, #020617 40%, #000 100%)",
    accent: "#38bdf8",
    accentGlow: "rgba(56,189,248,0.35)",
    headerBg: "rgba(15,23,42,0.95)",
    statusBar: "linear-gradient(90deg, #0ea5e9, #38bdf8, #0ea5e9)",
  },
  flappy: {
    name: "Flappy Cyber",
    icon: "zap",
    gradient: "linear-gradient(135deg, #0a1628 0%, #030a14 40%, #000305 100%)",
    accent: "#22d3ee",
    accentGlow: "rgba(34,211,238,0.35)",
    headerBg: "rgba(10,22,40,0.95)",
    statusBar: "linear-gradient(90deg, #06b6d4, #22d3ee, #06b6d4)",
  },
  tetris: {
    name: "Tetris Neon",
    icon: "grid_3x3",
    gradient: "linear-gradient(135deg, #0c0a1a 0%, #06030f 40%, #010008 100%)",
    accent: "#c084fc",
    accentGlow: "rgba(192,132,252,0.35)",
    headerBg: "rgba(12,10,26,0.95)",
    statusBar: "linear-gradient(90deg, #a855f7, #c084fc, #a855f7)",
  },
  "2048": {
    name: "2048 Mega Fusion",
    icon: "blocks",
    gradient: "linear-gradient(135deg, #1a1005 0%, #0d0a02 40%, #050301 100%)",
    accent: "#fbbf24",
    accentGlow: "rgba(251,191,36,0.35)",
    headerBg: "rgba(26,16,5,0.95)",
    statusBar: "linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)",
  },
  caro: {
    name: "Caro AI Master",
    icon: "swords",
    gradient: "linear-gradient(135deg, #1a0a0a 0%, #0d0505 40%, #050202 100%)",
    accent: "#fb7185",
    accentGlow: "rgba(251,113,133,0.35)",
    headerBg: "rgba(26,10,10,0.95)",
    statusBar: "linear-gradient(90deg, #f43f5e, #fb7185, #f43f5e)",
  },
  wordguess: {
    name: "Mat Ma Tu 3D",
    icon: "keyboard",
    gradient: "linear-gradient(135deg, #0a1a10 0%, #050d08 40%, #020603 100%)",
    accent: "#4ade80",
    accentGlow: "rgba(74,222,128,0.35)",
    headerBg: "rgba(10,26,16,0.95)",
    statusBar: "linear-gradient(90deg, #22c55e, #4ade80, #22c55e)",
  },
  snake: {
    name: "Snake 3D Pro",
    icon: "swap_vert",
    gradient: "linear-gradient(135deg, #071a0a 0%, #040d05 40%, #020602 100%)",
    accent: "#34d399",
    accentGlow: "rgba(52,211,153,0.35)",
    headerBg: "rgba(7,26,10,0.95)",
    statusBar: "linear-gradient(90deg, #10b981, #34d399, #10b981)",
  },
};

export default GAME_THEMES;
