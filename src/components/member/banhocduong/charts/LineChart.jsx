import React from "react";
import { motion } from "framer-motion";

export default function LineChart({ data = [], maxScore = 27, color = "#10b981", height = 80 }) {
  if (data.length === 0) return null;

  const width = 280;
  const paddingX = 20;
  const paddingY = 15;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;

  const stepX = data.length > 1 ? innerWidth / (data.length - 1) : innerWidth;

  const getPoint = (val, i) => {
    const x = paddingX + i * stepX;
    const y = paddingY + innerHeight - (val / maxScore) * innerHeight;
    return { x, y };
  };

  const points = data.map((d, i) => getPoint(d?.value ?? 0, i));
  const pathD = points.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(" ");

  // Create area path for gradient
  const areaD = points.length > 1 
    ? `${pathD} L ${points[points.length-1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`
    : "";

  return (
    <div className="w-full flex justify-center my-2">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeDasharray="2,2" />
        <line x1={paddingX} y1={height/2} x2={width - paddingX} y2={height/2} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeDasharray="2,2" />
        <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" />

        {/* Area */}
        {points.length > 1 && (
          <motion.path
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            d={areaD}
            fill={`url(#gradient-${color})`}
          />
        )}

        {/* Line */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points and Labels */}
        {points.map((p, i) => (
          <g key={i}>
            <motion.circle
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1 + i * 0.1 }}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#fff"
              stroke={color}
              strokeWidth="2"
              className="drop-shadow-sm"
            />
            {/* Show value label above the point */}
            <motion.text
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 + i * 0.1 }}
              x={p.x}
              y={p.y - 8}
              textAnchor="middle"
              className="text-[9px] font-black fill-zinc-600 dark:fill-zinc-300 font-mono"
            >
              {data[i]?.value ?? 0}
            </motion.text>
            {/* Show date label below the axis */}
            <motion.text
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 + i * 0.1 }}
              x={p.x}
              y={height - 2}
              textAnchor="middle"
              className="text-[7px] font-bold fill-zinc-400 dark:fill-zinc-500 uppercase"
            >
              Lần {i + 1}
            </motion.text>
          </g>
        ))}
      </svg>
    </div>
  );
}
