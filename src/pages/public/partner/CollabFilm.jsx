import { useEffect, useId, useMemo } from "react";
import { motion } from "framer-motion";
import { MASCOT_RIG, OUTLINE, hugoBodySvg, partnerBodySvg } from "./mascotArt";

/**
 * Phim mở màn của trang chiến dịch — dựng hoàn toàn bằng SVG, không file video.
 *
 * Kịch bản (giây): 0–1.6 hai nhân vật đi vào từ hai phía · 1.7 nhìn nhau ·
 * 1.8–2.5 đưa tay BẮT TAY, lắc hai nhịp · 2.5 lấy đà · 2.7–3.6 cùng nhảy lên
 * chữ COLLABORATE đang trồi lên · 3.6–4.6 chữ phát sáng, tay kia giơ chào,
 * câu "to build…" và tiêu đề hiện · 5.0 xong.
 *
 * Mọi chuyển động là nội suy thuộc tính (cx, cy, d, x, y) chứ không xoay quanh
 * gốc, nên không phụ thuộc transform-origin của SVG — thứ mỗi trình duyệt hiểu
 * một kiểu. Thân nhân vật lấy từ mascotArt.js (chung với ảnh chia sẻ).
 */

const TOTAL = 5;
const FLOOR = 432;
const LAND = 344;

/** [[giây, giá trị], …] → { values, times } cho một transition dài TOTAL. */
const track = (points) => ({
  values: points.map(([, value]) => value),
  times: points.map(([time]) => Math.min(1, time / TOTAL)),
});

/** Gộp nhiều track của cùng một phần tử vào một cặp animate/transition. */
const tracks = (map, duration) => {
  const animate = {};
  const transition = {};
  for (const [prop, points] of Object.entries(map)) {
    const { values, times } = track(points);
    animate[prop] = values;
    transition[prop] = { duration, times, ease: "easeInOut" };
  }
  return { animate, transition };
};

// Bước đi: 0–1.6s, tám nhịp chân.
const walk = (a, b) => Array.from({ length: 9 }, (_, i) => [i * 0.2, i % 2 ? b : a]);

/** Ống tay/chân kiểu cartoon: viền xanh than dày, lõi màu. */
function Tube({ d, duration, color }) {
  const anim = tracks({ d }, duration);
  return (
    <>
      <motion.path d={d[0][1]} {...anim} fill="none" stroke={OUTLINE} strokeWidth="9.5" strokeLinecap="round" />
      <motion.path d={d[0][1]} {...anim} fill="none" stroke={color} strokeWidth="5.5" strokeLinecap="round" />
    </>
  );
}

function Arm({ from, hand, duration, color }) {
  // hand: [[t, [x, y]], …] — khuỷu tay cong nhẹ ra ngoài.
  const d = hand.map(([t, [x, y]]) => [t, `M ${from[0]} ${from[1]} Q ${(from[0] + x) / 2 + (x < from[0] ? -5 : 5)} ${(from[1] + y) / 2 + 4} ${x} ${y}`]);
  const glove = tracks({ cx: hand.map(([t, p]) => [t, p[0]]), cy: hand.map(([t, p]) => [t, p[1]]) }, duration);
  return (
    <>
      <Tube d={d} duration={duration} color={color} />
      <motion.circle cx={hand[0][1][0]} cy={hand[0][1][1]} r="7" fill="#fff" stroke={OUTLINE} strokeWidth="2.6" {...glove} />
    </>
  );
}

function Leg({ hip, foot, duration, rig }) {
  const d = foot.map(([t, [x, y]]) => [t, `M ${hip[0]} ${hip[1]} L ${x} ${y - 6}`]);
  const shoeAt = ([x, y]) => `M ${x - 10} ${y + 1} Q ${x - 10} ${y - 7} ${x} ${y - 7} Q ${x + 11} ${y - 7} ${x + 11} ${y + 1} Z`;
  const shoe = tracks({ d: foot.map(([t, p]) => [t, shoeAt(p)]) }, duration);
  return (
    <>
      <Tube d={d} duration={duration} color={rig.limb} />
      <motion.path d={shoeAt(foot[0][1])} fill={rig.shoe} stroke={OUTLINE} strokeWidth="2.6" strokeLinejoin="round" {...shoe} />
    </>
  );
}

function Face({ y, look, duration, delay = 0 }) {
  // look: [[t, -1|0|1], …] — hướng con ngươi. Chớp mắt lặp chậm suốt phim.
  const blink = { animate: { ry: [7.6, 7.6, 0.8, 7.6] }, transition: { duration: 3.6, times: [0, 0.9, 0.95, 1], repeat: Infinity, delay } };
  const pupil = (base) => tracks({ cx: look.map(([t, v]) => [t, base + v * 2.2]) }, duration);
  const brows = tracks({ y: [[0, 0], [2.6, 0], [2.8, -4], [3.6, -4], [3.9, -1], [TOTAL, -1]] }, duration);
  const closed = `M -7 ${y + 11} Q 0 ${y + 17} 7 ${y + 11} Q 0 ${y + 14} -7 ${y + 11} Z`;
  const grin = `M -9 ${y + 10} Q 0 ${y + 10} 9 ${y + 10} Q 7 ${y + 21} 0 ${y + 21} Q -7 ${y + 21} -9 ${y + 10} Z`;
  const mouth = tracks({ d: [[0, closed], [1.75, closed], [2.0, grin], [2.5, grin], [2.65, closed], [2.75, grin], [TOTAL, grin]] }, duration);
  const tongue = tracks({ opacity: [[0, 0], [1.9, 0], [2.0, 1], [2.5, 1], [2.65, 0], [2.75, 1], [TOTAL, 1]] }, duration);
  return (
    <g>
      <ellipse cx="-19" cy={y + 12} rx="5.5" ry="3.2" fill="#ff8fb0" opacity=".7" />
      <ellipse cx="19" cy={y + 12} rx="5.5" ry="3.2" fill="#ff8fb0" opacity=".7" />
      <motion.g {...brows}>
        <path d={`M -16 ${y - 11} Q -10 ${y - 15} -4 ${y - 11}`} fill="none" stroke={OUTLINE} strokeWidth="2.6" strokeLinecap="round" />
        <path d={`M 4 ${y - 11} Q 10 ${y - 15} 16 ${y - 11}`} fill="none" stroke={OUTLINE} strokeWidth="2.6" strokeLinecap="round" />
      </motion.g>
      <motion.ellipse cx="-10" cy={y} rx="6.2" ry="7.6" fill="#fff" stroke={OUTLINE} strokeWidth="2.4" {...blink} />
      <motion.ellipse cx="10" cy={y} rx="6.2" ry="7.6" fill="#fff" stroke={OUTLINE} strokeWidth="2.4" {...blink} />
      <motion.circle cx={-10} cy={y + 1} r="3.6" fill={OUTLINE} {...pupil(-10)} />
      <motion.circle cx={10} cy={y + 1} r="3.6" fill={OUTLINE} {...pupil(10)} />
      <motion.circle cx={-11} cy={y - 0.8} r="1.3" fill="#fff" {...pupil(-11)} />
      <motion.circle cx={9} cy={y - 0.8} r="1.3" fill="#fff" {...pupil(9)} />
      <motion.path d={closed} fill={OUTLINE} stroke={OUTLINE} strokeWidth="1.5" strokeLinejoin="round" {...mouth} />
      <motion.ellipse cx="0" cy={y + 18} rx="4" ry="2.4" fill="#ff7a8e" {...tongue} />
    </g>
  );
}

/** side = -1 đứng bên trái (tay trong vươn sang phải), 1 đứng bên phải. */
function Mascot({ side, baseX, duration, body, rig, label }) {
  const inward = -side; // hướng về phía bạn
  const { faceY, shoulder } = rig;
  // Hai bàn tay gặp nhau ở giữa sân khấu (x = 400) — rồi lắc hai nhịp.
  const meetX = 400 - baseX;
  const outerShoulder = [shoulder * side, -55];
  const innerShoulder = [shoulder * inward, -55];

  const pos = tracks({
    x: [[0, 480 * side], [1.6, 0], [TOTAL, 0]],
    y: [[0, FLOOR], [2.45, FLOOR], [2.65, FLOOR + 6], [2.75, FLOOR - 20], [3.15, 250], [3.55, LAND], [3.7, LAND + 5], [3.9, LAND], [TOTAL, LAND]],
  }, duration);
  // Đi bộ nhún nhảy, chỉ trong đoạn đi vào.
  const bob = tracks({ y: [...walk(0, -7), [1.7, 0], [TOTAL, 0]] }, duration);

  const stand = (x) => [x, 0];
  // Hai chân lệch pha nhau: chân này bước tới thì chân kia lùi về.
  const legFoot = (x) => {
    const phase = x < 0 ? 0 : 1;
    const stride = 7 * inward;
    return [
      ...walk(0, 1).map(([t, step]) => [t, step === phase ? [x + stride, -4] : [x - stride, 0]]),
      [1.7, stand(x)], [2.6, stand(x)], [2.75, [x, -2]], [3.1, [x * 1.4, -12]], [3.5, stand(x)], [TOTAL, stand(x)],
    ];
  };

  const o = outerShoulder[0];
  const outerHand = [
    [0, [o + 10 * side, -30]],
    ...walk([o + 15 * side, -34], [o + 5 * side, -30]).slice(1),
    [2.5, [o + 10 * side, -30]],
    [3.1, [o + 18 * side, -84]],
    [3.6, [o + 14 * side, -92]],
    [3.9, [o + 22 * side, -84]],
    [4.2, [o + 13 * side, -94]],
    [4.5, [o + 22 * side, -84]],
    [TOTAL, [o + 14 * side, -92]],
  ];
  const innerHand = [
    [0, [innerShoulder[0] + 8 * inward, -30]],
    [1.75, [innerShoulder[0] + 8 * inward, -30]],
    [2.0, [meetX, -42]],
    [2.12, [meetX, -48]], [2.24, [meetX, -36]], [2.36, [meetX, -46]], [2.48, [meetX, -42]],
    [3.9, [meetX, -42]],
    [4.05, [meetX, -47]], [4.2, [meetX, -38]], [4.35, [meetX, -42]],
    [TOTAL, [meetX, -42]],
  ];
  // Nhìn thẳng khi đi, nhìn nhau khi bắt tay, rồi nhìn khán giả.
  const look = [[0, 0], [1.6, 0], [1.75, inward], [2.6, inward], [2.8, 0], [3.9, 0], [4.05, inward], [4.5, inward], [4.7, 0], [TOTAL, 0]];

  return (
    <g transform={`translate(${baseX} 0)`}>
      <motion.g {...pos}>
        {/* Bóng đổ dưới chân — mờ đi khi bay lên. */}
        <motion.ellipse cx="0" cy="3" rx="30" ry="5" fill="#000"
          {...tracks({ opacity: [[0, 0.3], [2.7, 0.3], [3.1, 0.06], [3.55, 0.24], [TOTAL, 0.24]] }, duration)} />
        <motion.g {...bob}>
          <Leg hip={[-9, -24]} foot={legFoot(-11)} duration={duration} rig={rig} />
          <Leg hip={[9, -24]} foot={legFoot(11)} duration={duration} rig={rig} />
          {/* Thân vẽ sẵn thành chuỗi SVG (mascotArt.js) để ảnh OG dùng chung bản vẽ. */}
          <g dangerouslySetInnerHTML={{ __html: body }} />
          <Face y={faceY} look={look} duration={duration} delay={side < 0 ? 0.4 : 1.3} />
          <Arm from={outerShoulder} hand={outerHand} duration={duration} color={rig.limb} />
          <Arm from={innerShoulder} hand={innerHand} duration={duration} color={rig.limb} />
        </motion.g>
        <motion.text x="0" y="30" textAnchor="middle" className="collab-film__label" fill={rig.label}
          {...tracks({ opacity: [[0, 0], [0.8, 1], [2.4, 1], [2.7, 0], [TOTAL, 0]] }, duration)}>
          {label}
        </motion.text>
      </motion.g>
    </g>
  );
}

const SPARKS = [
  [118, 300, 1.1], [690, 290, 0.9], [210, 470, 0.7], [600, 478, 1.2], [80, 400, 0.8], [730, 405, 1],
  [300, 262, 0.6], [520, 256, 0.75], [400, 492, 0.9], [160, 230, 0.6], [650, 225, 0.65],
];

export default function CollabFilm({ mark, headline, tagline, reduced = false, onDone }) {
  const uid = useId().replace(/:/g, "");
  const duration = reduced ? 0.001 : TOTAL;

  useEffect(() => {
    const timer = window.setTimeout(() => onDone?.(), reduced ? 0 : TOTAL * 1000);
    return () => window.clearTimeout(timer);
  }, [onDone, reduced]);

  const ids = useMemo(() => ({
    hugo: `hugo-${uid}`, partner: `partner-${uid}`, text: `text-${uid}`, glow: `glow-${uid}`, sweep: `sweep-${uid}`, clip: `clip-${uid}`,
  }), [uid]);
  const hugoBody = useMemo(() => hugoBodySvg(ids.hugo), [ids.hugo]);
  const partnerBody = useMemo(() => partnerBodySvg(ids.partner, mark), [ids.partner, mark]);
  const partnerRig = useMemo(() => MASCOT_RIG.partner(mark), [mark]);

  const show = (from, to = from + 0.5) => tracks({ opacity: [[0, 0], [from, 0], [to, 1], [TOTAL, 1]] }, duration);
  const word = { x: 400, y: 420, textAnchor: "middle", textLength: 700, lengthAdjust: "spacingAndGlyphs", className: "collab-film__word" };

  return (
    <svg className="collab-film" viewBox="0 0 800 560" role="img" aria-label={`${headline} — collaborate`}>
      <defs>
        <linearGradient id={ids.text} x1="50" y1="0" x2="750" y2="0" gradientUnits="userSpaceOnUse">
          {/* Nửa đầu là "Studio" của Hugo (cyan → xanh → tím), nửa sau là hwagfu (cam → kem). */}
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset=".28" stopColor="#3b82f6" />
          <stop offset=".5" stopColor="#7c6cf0" />
          <stop offset=".74" stopColor={mark.accent} />
          <stop offset="1" stopColor="#ffd9a8" />
        </linearGradient>
        <filter id={ids.glow} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <linearGradient id={ids.sweep} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={ids.clip}>
          <text {...word}>COLLABORATE</text>
        </clipPath>
      </defs>

      {/* Tiêu đề hiện cuối phim. */}
      <motion.text x="400" y="108" textAnchor="middle" className="collab-film__headline" {...show(4.2, 4.7)}>
        {headline}
      </motion.text>

      {/* Mặt sàn ban đầu — tan đi khi chữ trồi lên thay chỗ đứng. */}
      <motion.line x1="90" x2="710" y1={FLOOR + 4} y2={FLOOR + 4} stroke="currentColor" strokeOpacity=".22" strokeWidth="2" strokeDasharray="3 9"
        {...tracks({ opacity: [[0, 1], [2.7, 1], [3.1, 0], [TOTAL, 0]] }, duration)} />

      {/* Chữ COLLABORATE: trồi lên, rồi phát sáng. */}
      <motion.g {...tracks({ y: [[0, 170], [2.7, 170], [3.3, 0], [TOTAL, 0]], opacity: [[0, 0], [2.7, 0], [3.0, 1], [TOTAL, 1]] }, duration)}>
        <motion.text {...word} fill={`url(#${ids.text})`} filter={`url(#${ids.glow})`}
          {...tracks({ opacity: [[0, 0], [3.4, 0], [3.8, 1], [4.3, 0.55], [TOTAL, 0.85]] }, duration)}>
          COLLABORATE
        </motion.text>
        <text {...word} fill={`url(#${ids.text})`} stroke={OUTLINE} strokeWidth="2" paintOrder="stroke">COLLABORATE</text>
        {/* Vệt sáng quét ngang mặt chữ. */}
        <g clipPath={`url(#${ids.clip})`}>
          <motion.rect y="330" width="140" height="110" fill={`url(#${ids.sweep})`}
            {...tracks({ x: [[0, -200], [3.6, -200], [4.4, 820], [TOTAL, 820]] }, duration)} />
        </g>
        <motion.text x="400" y="472" textAnchor="middle" className="collab-film__tagline" {...show(3.9, 4.4)}>
          {tagline}
        </motion.text>
      </motion.g>

      {/* Lấp lánh quanh chữ sau khi tiếp đất. */}
      {SPARKS.map(([x, y, s], i) => (
        <motion.path
          key={i}
          d={`M ${x} ${y - 10 * s} L ${x + 2.4 * s} ${y - 2.4 * s} L ${x + 10 * s} ${y} L ${x + 2.4 * s} ${y + 2.4 * s} L ${x} ${y + 10 * s} L ${x - 2.4 * s} ${y + 2.4 * s} L ${x - 10 * s} ${y} L ${x - 2.4 * s} ${y - 2.4 * s} Z`}
          fill={i % 3 === 0 ? "#ffd9a8" : i % 3 === 1 ? "#7cc4ff" : mark.accent}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.2, 1, 0] }}
          transition={{ duration: 1.8, delay: (reduced ? 0 : 3.6) + i * 0.09, repeat: Infinity, repeatDelay: 0.6 + (i % 4) * 0.35 }}
        />
      ))}

      {/* Nhún nhảy mãi sau khi đứng lên chữ. */}
      <motion.g animate={{ y: [0, -9, 0] }} transition={{ duration: 0.9, delay: reduced ? 0 : TOTAL, repeat: Infinity, ease: "easeInOut" }}>
        <Mascot side={-1} baseX={330} duration={duration} body={hugoBody} rig={MASCOT_RIG.hugo} label="Hugo Studio" />
        <Mascot side={1} baseX={470} duration={duration} body={partnerBody} rig={partnerRig} label={mark.label} />
      </motion.g>
    </svg>
  );
}
