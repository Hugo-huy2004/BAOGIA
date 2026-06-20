import React from "react";
import { motion } from "framer-motion";

export default function RadarChart({ scores, maxScore = 42 }) {
  const safeScores = scores || { D: 0, A: 0, S: 0 };
  const scoreD = safeScores.D ?? 0;
  const scoreA = safeScores.A ?? 0;
  const scoreS = safeScores.S ?? 0;

  const size = 160;
  const center = size / 2;
  const radius = center - 20;

  // 3 Points: Top (D), Bottom Right (A), Bottom Left (S)
  const angleD = -Math.PI / 2; // -90 deg
  const angleA = Math.PI / 6; // 30 deg
  const angleS = (5 * Math.PI) / 6; // 150 deg

  const getPoint = (score, angle) => {
    const r = (score / maxScore) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  const ptD = getPoint(scoreD, angleD);
  const ptA = getPoint(scoreA, angleA);
  const ptS = getPoint(scoreS, angleS);

  const maxPtD = getPoint(maxScore, angleD);
  const maxPtA = getPoint(maxScore, angleA);
  const maxPtS = getPoint(maxScore, angleS);

  const polygonPath = `${ptD.x},${ptD.y} ${ptA.x},${ptA.y} ${ptS.x},${ptS.y}`;
  const basePolygonPath = `${maxPtD.x},${maxPtD.y} ${maxPtA.x},${maxPtA.y} ${maxPtS.x},${maxPtS.y}`;

  // Helper for concentric grid
  const getGridPolygon = (ratio) => {
    const d = getPoint(maxScore * ratio, angleD);
    const a = getPoint(maxScore * ratio, angleA);
    const s = getPoint(maxScore * ratio, angleS);
    return `${d.x},${d.y} ${a.x},${a.y} ${s.x},${s.y}`;
  };

  return (
    <div className="relative flex justify-center items-center w-full my-4">
      <svg width={size} height={size} className="overflow-visible drop-shadow-md">
        {/* Grids */}
        {[0.33, 0.66, 1].map((r, i) => (
          <polygon
            key={i}
            points={getGridPolygon(r)}
            fill="none"
            stroke="currentColor"
            className="text-zinc-200 dark:text-zinc-800"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        ))}

        {/* Axes */}
        <line x1={center} y1={center} x2={maxPtD.x} y2={maxPtD.y} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeWidth="1" />
        <line x1={center} y1={center} x2={maxPtA.x} y2={maxPtA.y} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeWidth="1" />
        <line x1={center} y1={center} x2={maxPtS.x} y2={maxPtS.y} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeWidth="1" />

        {/* Data Polygon */}
        <motion.polygon
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          points={polygonPath}
          fill="rgba(59, 130, 246, 0.2)"
          stroke="#3b82f6"
          strokeWidth="2"
          style={{ transformOrigin: "center" }}
        />

        {/* Points */}
        <motion.circle initial={{ r: 0 }} animate={{ r: 4 }} transition={{ delay: 0.3 }} cx={ptD.x} cy={ptD.y} fill="#3b82f6" />
        <motion.circle initial={{ r: 0 }} animate={{ r: 4 }} transition={{ delay: 0.4 }} cx={ptA.x} cy={ptA.y} fill="#ec4899" />
        <motion.circle initial={{ r: 0 }} animate={{ r: 4 }} transition={{ delay: 0.5 }} cx={ptS.x} cy={ptS.y} fill="#eab308" />
      </svg>
      
      {/* Labels */}
      <span className="absolute -top-4 text-[10px] font-black text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">TRẦM CẢM ({scoreD})</span>
      <span className="absolute -bottom-2 -right-4 text-[10px] font-black text-pink-500 bg-pink-50 dark:bg-pink-900/30 px-1.5 py-0.5 rounded">LO ÂU ({scoreA})</span>
      <span className="absolute -bottom-2 -left-6 text-[10px] font-black text-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded">CĂNG THẲNG ({scoreS})</span>
    </div>
  );
}
