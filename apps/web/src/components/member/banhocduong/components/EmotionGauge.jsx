import { motion } from "framer-motion";
import { EMOTIONS, ZONE_COLORS } from "../brain/companionMind";

// Đồng hồ cảm xúc của nhân vật: nửa vòng 5 vùng (giận · buồn · bình yên · cười ·
// thương) và một chiếc kim. Kim quay mềm sang vùng mới mỗi khi cảm xúc đổi —
// người dùng THẤY nhân vật đang cảm thấy gì, không chỉ đọc được qua lời.
const ZONE_ICONS = ["sentiment_extremely_dissatisfied", "sentiment_sad", "sentiment_calm", "sentiment_very_satisfied", "favorite"];
const W = 120;
const R = 54;      // bán kính ngoài
const R_IN = 30;   // bán kính trong
const CX = W / 2;
const CY = 58;

const polar = (r, deg) => [CX + r * Math.cos((deg * Math.PI) / 180), CY - r * Math.sin((deg * Math.PI) / 180)];

function segment(i) {
  // 180° → 0°, mỗi vùng 36°, chừa khe 2° giữa các vùng.
  const a0 = 180 - i * 36 - 1;
  const a1 = a0 - 34;
  const [x0, y0] = polar(R, a0);
  const [x1, y1] = polar(R, a1);
  const [x2, y2] = polar(R_IN, a1);
  const [x3, y3] = polar(R_IN, a0);
  return `M${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1} L${x2},${y2} A${R_IN},${R_IN} 0 0 0 ${x3},${y3} Z`;
}

export default function EmotionGauge({ emotion = "binh", intensity = 0.5 }) {
  const meta = EMOTIONS[emotion] || EMOTIONS.binh;
  // Tâm vùng, lệch nhẹ theo cường độ để kim không đứng im khi cảm xúc mạnh lên.
  const angle = 180 - (meta.zone + 0.5) * 36 + (intensity - 0.5) * 12;

  return (
    <div className="relative shrink-0" style={{ width: W, height: CY + 6 }} aria-hidden="true">
      <svg width={W} height={CY + 6} viewBox={`0 0 ${W} ${CY + 6}`}>
        {ZONE_COLORS.map((color, i) => (
          <path key={color} d={segment(i)} fill={color} opacity={i === meta.zone ? 1 : 0.28} />
        ))}
        <motion.g
          initial={false}
          animate={{ rotate: 90 - angle }}
          transition={{ type: "spring", stiffness: 120, damping: 12 }}
          // Kim dựng đứng (90°); quay theo chiều kim đồng hồ (90 − góc) quanh chân kim.
          style={{ originX: 0.5, originY: 1 }}
        >
          <line x1={CX} y1={CY} x2={CX} y2={CY - R + 4} stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-foreground" />
        </motion.g>
        <circle cx={CX} cy={CY} r="5" className="fill-foreground" />
      </svg>
      {ZONE_ICONS.map((icon, i) => {
        const [x, y] = polar((R + R_IN) / 2, 180 - (i + 0.5) * 36);
        return (
          <span
            key={icon}
            className="material-symbols-outlined pointer-events-none absolute text-[13px] leading-none text-white"
            style={{ left: x - 6.5, top: y - 6.5, opacity: i === meta.zone ? 1 : 0.7 }}
          >
            {icon}
          </span>
        );
      })}
    </div>
  );
}
