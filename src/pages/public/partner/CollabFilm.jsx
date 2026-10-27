import { useEffect, useId, useMemo } from "react";
import { motion } from "framer-motion";
import { MASCOT_RIG, OUTLINE, hugoBodySvg, partnerBodySvg } from "./mascotArt";

/**
 * Phim mở màn của trang chiến dịch — dựng hoàn toàn bằng SVG, không file video.
 * Nhịp kiểu keynote: sân khấu đen, một luồng đèn, sàn bóng phản chiếu, chữ hiện
 * ra từ nhoè sang nét, không hạt nhiễu, không hiệu ứng thừa.
 *
 * Kịch bản (giây): 0–1.3 tiêu đề mở màn hiện rồi lui · từ CAST = 1.4 hai nhân
 * vật đi vào (1.6s) · nhìn nhau, BẮT TAY lắc hai nhịp · lấy đà, cùng nhảy lên
 * chữ COLLABORATE đang trồi lên · chữ sáng dần, vệt sáng quét qua, tay kia giơ
 * chào, câu "to build…" và tiêu đề hiện · TOTAL xong.
 *
 * Mọi chuyển động là nội suy thuộc tính (cx, cy, d, x, y) chứ không xoay quanh
 * gốc, nên không phụ thuộc transform-origin của SVG — thứ mỗi trình duyệt hiểu
 * một kiểu. Thân nhân vật lấy từ mascotArt.js (chung với ảnh chia sẻ).
 */

const TOTAL = 6.8;
const CAST = 1.4; // nhân vật vào sân khấu sau tiêu đề mở màn
const FLOOR = 432;
const LAND = 344;
const MIRROR = FLOOR + 3; // mặt sàn bóng — trục của ảnh phản chiếu

/** [[giây, giá trị], …] → { values, times } cho một transition dài TOTAL. */
const track = (points, offset = 0) => {
  const shifted = points.map(([time, value]) => [time + offset, value]);
  if (offset > 0) shifted.unshift([0, points[0][1]]);
  return {
    values: shifted.map(([, value]) => value),
    times: shifted.map(([time]) => Math.min(1, time / TOTAL)),
  };
};

/** Gộp nhiều track của cùng một phần tử vào một cặp animate/transition. */
const tracks = (map, duration, offset = 0) => {
  const animate = {};
  const transition = {};
  for (const [prop, points] of Object.entries(map)) {
    const { values, times } = track(points, offset);
    animate[prop] = values;
    transition[prop] = { duration, times, ease: "easeInOut" };
  }
  return { animate, transition };
};

/** Track của diễn viên: viết theo giờ riêng của cảnh, tự lùi sau tiêu đề mở màn. */
const cast = (map, duration) => tracks(map, duration, CAST);

// Bước đi: 0–1.6s, tám nhịp chân.
const walk = (a, b) => Array.from({ length: 9 }, (_, i) => [i * 0.2, i % 2 ? b : a]);

/** Ống tay/chân kiểu cartoon: viền xanh than dày, lõi màu. */
function Tube({ d, duration, color }) {
  const anim = cast({ d }, duration);
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
  const glove = cast({ cx: hand.map(([t, p]) => [t, p[0]]), cy: hand.map(([t, p]) => [t, p[1]]) }, duration);
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
  const shoe = cast({ d: foot.map(([t, p]) => [t, shoeAt(p)]) }, duration);
  return (
    <>
      <Tube d={d} duration={duration} color={rig.limb} />
      <motion.path d={shoeAt(foot[0][1])} fill={rig.shoe} stroke={OUTLINE} strokeWidth="2.6" strokeLinejoin="round" {...shoe} />
    </>
  );
}

function Face({ y, look, duration, delay = 0 }) {
  // look: [[t, -1|0|1], …] — hướng con ngươi. Chớp mắt lặp chậm suốt phim.
  const blink = { animate: { ry: [7.6, 7.6, 0.8, 7.6] }, transition: { duration: 3.6, times: [0, 0.9, 0.95, 1], repeat: Infinity, delay: CAST + delay } };
  const pupil = (base) => cast({ cx: look.map(([t, v]) => [t, base + v * 2.2]) }, duration);
  const brows = cast({ y: [[0, 0], [2.6, 0], [2.8, -4], [3.6, -4], [3.9, -1], [TOTAL, -1]] }, duration);
  const closed = `M -7 ${y + 11} Q 0 ${y + 17} 7 ${y + 11} Q 0 ${y + 14} -7 ${y + 11} Z`;
  const grin = `M -9 ${y + 10} Q 0 ${y + 10} 9 ${y + 10} Q 7 ${y + 21} 0 ${y + 21} Q -7 ${y + 21} -9 ${y + 10} Z`;
  const mouth = cast({ d: [[0, closed], [1.75, closed], [2.0, grin], [2.5, grin], [2.65, closed], [2.75, grin], [TOTAL, grin]] }, duration);
  const tongue = cast({ opacity: [[0, 0], [1.9, 0], [2.0, 1], [2.5, 1], [2.65, 0], [2.75, 1], [TOTAL, 1]] }, duration);
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
function Mascot({ side, baseX, duration, body, rig }) {
  const inward = -side; // hướng về phía bạn
  const { faceY, shoulder } = rig;
  // Hai bàn tay gặp nhau ở giữa sân khấu (x = 400) — rồi lắc hai nhịp.
  const meetX = 400 - baseX;
  const outerShoulder = [shoulder * side, -55];
  const innerShoulder = [shoulder * inward, -55];

  const pos = cast({
    x: [[0, 480 * side], [1.6, 0], [TOTAL, 0]],
    opacity: [[0, 0], [0.35, 1], [TOTAL, 1]],
    y: [[0, FLOOR], [2.45, FLOOR], [2.65, FLOOR + 6], [2.75, FLOOR - 20], [3.15, 250], [3.55, LAND], [3.7, LAND + 5], [3.9, LAND], [TOTAL, LAND]],
  }, duration);
  // Đi bộ nhún nhảy, chỉ trong đoạn đi vào.
  const bob = cast({ y: [...walk(0, -7), [1.7, 0], [TOTAL, 0]] }, duration);

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
          {...cast({ opacity: [[0, 0.3], [2.7, 0.3], [3.1, 0.06], [3.55, 0.24], [TOTAL, 0.24]] }, duration)} />
        <motion.g {...bob}>
          <Leg hip={[-9, -24]} foot={legFoot(-11)} duration={duration} rig={rig} />
          <Leg hip={[9, -24]} foot={legFoot(11)} duration={duration} rig={rig} />
          {/* Thân vẽ sẵn thành chuỗi SVG (mascotArt.js) để ảnh OG dùng chung bản vẽ. */}
          <g dangerouslySetInnerHTML={{ __html: body }} />
          <Face y={faceY} look={look} duration={duration} delay={side < 0 ? 0.4 : 1.3} />
          <Arm from={outerShoulder} hand={outerHand} duration={duration} color={rig.limb} />
          <Arm from={innerShoulder} hand={innerHand} duration={duration} color={rig.limb} />
        </motion.g>
      </motion.g>
    </g>
  );
}

export default function CollabFilm({ mark, eyebrow, headline, tagline, reduced = false, onDone }) {
  const uid = useId().replace(/:/g, "");
  const duration = reduced ? 0.001 : TOTAL;

  useEffect(() => {
    const timer = window.setTimeout(() => onDone?.(), reduced ? 0 : TOTAL * 1000);
    return () => window.clearTimeout(timer);
  }, [onDone, reduced]);

  const ids = useMemo(() => ({
    hugo: `hugo-${uid}`, partner: `partner-${uid}`, text: `text-${uid}`, glow: `glow-${uid}`, aura: `aura-${uid}`,
    sweep: `sweep-${uid}`, clip: `clip-${uid}`, scene: `scene-${uid}`, fade: `fade-${uid}`, mask: `mask-${uid}`, floor: `floor-${uid}`,
  }), [uid]);
  const hugoBody = useMemo(() => hugoBodySvg(ids.hugo), [ids.hugo]);
  const partnerBody = useMemo(() => partnerBodySvg(ids.partner, mark), [ids.partner, mark]);
  const partnerRig = useMemo(() => MASCOT_RIG.partner(mark), [mark]);

  const show = (from, to = from + 0.6) => cast({ opacity: [[0, 0], [from, 0], [to, 1], [TOTAL, 1]] }, duration);
  // Tiêu đề mở màn: hiện từ nhoè sang nét, giữ một nhịp, rồi lui lên và tan.
  const opening = (delay) => ({
    initial: { opacity: 0, y: 14, filter: "blur(10px)" },
    animate: { opacity: [0, 1, 1, 0], y: [14, 0, 0, -18], filter: ["blur(10px)", "blur(0px)", "blur(0px)", "blur(6px)"] },
    transition: { duration: reduced ? 0.001 : 1.35 - delay, times: [0, 0.45, 0.8, 1], delay, ease: [0.22, 1, 0.36, 1] },
  });
  const word = { x: 400, y: 420, textAnchor: "middle", textLength: 680, lengthAdjust: "spacingAndGlyphs", className: "collab-film__word" };

  return (
    <svg className="collab-film" viewBox="0 0 800 560" role="img" aria-label={`${headline} — collaborate`}>
      <defs>
        <linearGradient id={ids.text} x1="60" y1="0" x2="740" y2="0" gradientUnits="userSpaceOnUse">
          {/* Nửa đầu là "Studio" của Hugo (cyan → xanh → tím), nửa sau là hwagfu (cam → kem). */}
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset=".28" stopColor="#3b82f6" />
          <stop offset=".5" stopColor="#7c6cf0" />
          <stop offset=".74" stopColor={mark.accent} />
          <stop offset="1" stopColor="#ffd9a8" />
        </linearGradient>
        <filter id={ids.glow} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <filter id={ids.aura} x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation="46" />
        </filter>
        <linearGradient id={ids.sweep} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={ids.clip}>
          <text {...word}>COLLABORATE</text>
        </clipPath>
        {/* Sàn bóng: ảnh phản chiếu đậm sát mặt sàn, tan dần xuống dưới. */}
        <linearGradient id={ids.fade} x1="0" y1={MIRROR} x2="0" y2={MIRROR + 56} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity=".22" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={ids.mask} maskUnits="userSpaceOnUse" x="0" y={MIRROR} width="800" height="125">
          <rect x="0" y={MIRROR} width="800" height="125" fill={`url(#${ids.fade})`} />
        </mask>
        <linearGradient id={ids.floor} x1="80" y1="0" x2="720" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".28" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Mở màn: dòng nhỏ + tiêu đề, giữa khung hình. */}
      <motion.text x="400" y="232" textAnchor="middle" className="collab-film__eyebrow" {...opening(0.1)}>
        {eyebrow}
      </motion.text>
      <motion.text x="400" y="292" textAnchor="middle" className="collab-film__title" {...opening(0.25)}>
        {headline}
      </motion.text>

      {/* Tiêu đề thu nhỏ trở lại ở cuối phim. */}
      <motion.text x="400" y="104" textAnchor="middle" className="collab-film__headline" {...show(4.1, 4.8)}>
        {headline}
      </motion.text>

      {/* Quầng màu thương hiệu dưới chữ — thở chậm sau khi chữ lên. */}
      <motion.ellipse cx="400" cy="392" rx="300" ry="54" fill={`url(#${ids.text})`} filter={`url(#${ids.aura})`}
        {...cast({ opacity: [[0, 0], [3.3, 0], [4.0, 0.75], [4.6, 0.45], [TOTAL, 0.55]] }, duration)} />

      {/* Đường chân trời mảnh — mặt sàn bóng. */}
      <motion.line x1="80" x2="720" y1={MIRROR} y2={MIRROR} stroke={`url(#${ids.floor})`} strokeWidth="1"
        {...cast({ opacity: [[0, 0], [0.2, 1], [TOTAL, 1]] }, duration)} />

      <g id={ids.scene}>
        {/* Chữ COLLABORATE: trồi lên từ mặt sàn, rồi phát sáng. */}
        <motion.g {...cast({ y: [[0, 170], [2.7, 170], [3.3, 0], [TOTAL, 0]], opacity: [[0, 0], [2.7, 0], [3.05, 1], [TOTAL, 1]] }, duration)}>
          <motion.text {...word} fill={`url(#${ids.text})`} filter={`url(#${ids.glow})`}
            {...cast({ opacity: [[0, 0], [3.4, 0], [3.9, 0.9], [4.4, 0.45], [TOTAL, 0.6]] }, duration)}>
            COLLABORATE
          </motion.text>
          <text {...word} fill={`url(#${ids.text})`}>COLLABORATE</text>
          {/* Vệt sáng quét ngang mặt chữ. */}
          <g clipPath={`url(#${ids.clip})`}>
            <motion.rect y="330" width="160" height="110" fill={`url(#${ids.sweep})`}
              {...cast({ x: [[0, -220], [3.7, -220], [4.6, 820], [TOTAL, 820]] }, duration)} />
          </g>
        </motion.g>

        {/* Nhún nhẹ mãi sau khi đứng lên chữ. */}
        <motion.g animate={{ y: [0, -7, 0] }} transition={{ duration: 1.2, delay: reduced ? 0 : TOTAL, repeat: Infinity, ease: "easeInOut" }}>
          <Mascot side={-1} baseX={330} duration={duration} body={hugoBody} rig={MASCOT_RIG.hugo} />
          <Mascot side={1} baseX={470} duration={duration} body={partnerBody} rig={partnerRig} />
        </motion.g>
      </g>

      {/* Ảnh phản chiếu trên sàn bóng: bản sao sống của cả cảnh, lật quanh mặt sàn. */}
      <g mask={`url(#${ids.mask})`} aria-hidden="true">
        <use href={`#${ids.scene}`} transform={`translate(0 ${MIRROR * 2}) scale(1 -1)`} />
      </g>

      <motion.text x="400" y="524" textAnchor="middle" className="collab-film__tagline" {...show(4.0, 4.6)}>
        {tagline}
      </motion.text>
    </svg>
  );
}
