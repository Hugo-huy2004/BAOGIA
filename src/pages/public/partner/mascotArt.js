// Hai nhân vật cartoon, vẽ theo đúng logo — MỘT bản vẽ dùng cho cả phim mở màn
// (CollabFilm.jsx) lẫn ảnh chia sẻ (scripts/generate-partner-og.mjs).
// Toạ độ: gốc ở giữa hai bàn chân, thân nằm trong y ∈ [-116, -22].
//
//   Hugo Studio — giọt nước THUỶ TINH (chấm chữ "i" trong logo): trong, ánh
//                 xanh, đốm sáng trắng ở đỉnh.
//   Đối tác     — ô vuông bo góc mang ký hiệu của logo (hwagfu.dev: nền kem,
//                 "<" ">" cam ôm chữ "J" xanh than).
// Phong cách cartoon: viền xanh than dày, đổ bóng một tông (cel shading), găng
// tay trắng, giày sneaker, mắt to có lông mày. Gặp nhau thì BẮT TAY — đây là
// một lời mời hợp tác công việc.

export const OUTLINE = "#1e2740";
export const HUGO_DROP = "M47.43 8.25 A3 3 0 0 1 52.57 8.25 L75.68 46.48 A30 30 0 1 1 24.32 46.48 Z";

/** Thông số khuôn mặt + tay chân của từng nhân vật. */
export const MASCOT_RIG = {
  hugo: { faceY: -58, shoulder: 26, limb: "#5aa9ff", shoe: "#7c6cf0", sole: "#ffffff", label: "#bfe3ff" },
  partner: (mark) => ({ faceY: -77, shoulder: 33, limb: mark.accent, shoe: mark.glyph, sole: mark.tile, label: "#ffd9bf" }),
};

export function hugoBodySvg(id) {
  return `
  <defs>
    <radialGradient id="${id}-glass" cx="42%" cy="40%" r="72%">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset=".45" stop-color="#cfe9ff"/>
      <stop offset="1" stop-color="#7fb8ff"/>
    </radialGradient>
    <clipPath id="${id}-clip"><path transform="translate(-50 -116)" d="${HUGO_DROP}"/></clipPath>
    <filter id="${id}-soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="8"/></filter>
  </defs>
  <path transform="translate(-50 -116)" d="${HUGO_DROP}" fill="#5aa9ff" opacity=".5" filter="url(#${id}-soft)"/>
  <path transform="translate(-50 -116)" d="${HUGO_DROP}" fill="url(#${id}-glass)"/>
  <g clip-path="url(#${id}-clip)">
    <ellipse cx="22" cy="-44" rx="26" ry="34" fill="#4f8cff" opacity=".38"/>
    <ellipse cx="0" cy="-27" rx="30" ry="9" fill="#ffffff" opacity=".5"/>
  </g>
  <path transform="translate(-50 -116)" d="${HUGO_DROP}" fill="none" stroke="${OUTLINE}" stroke-width="3.2" stroke-linejoin="round"/>
  <ellipse cx="-14" cy="-70" rx="3.2" ry="7" transform="rotate(28 -14 -70)" fill="#ffffff" opacity=".9"/>
  <circle cx="0" cy="-90" r="8" fill="#ffffff" opacity=".45" filter="url(#${id}-soft)"/>
  <circle cx="0" cy="-90" r="3.6" fill="#ffffff"/>`;
}

export function partnerBodySvg(id, mark) {
  const { tile, accent, glyph, letter = "J" } = mark;
  // "J" dựng bằng nét chứ không bằng font: ảnh OG rasterize ở máy không có font
  // của logo, nét vẽ thì ở đâu cũng giống nhau.
  const glyphPath = letter === "J"
    ? `<path d="M -6 -56 L 8 -56 M 4 -56 L 4 -42 Q 4 -33 -3 -33 Q -9 -33 -10 -39" fill="none" stroke="${glyph}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<text x="0" y="-34" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="26" fill="${glyph}">${letter}</text>`;
  return `
  <defs>
    <clipPath id="${id}-clip"><rect x="-33" y="-96" width="66" height="74" rx="20"/></clipPath>
    <filter id="${id}-soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="8"/></filter>
  </defs>
  <rect x="-33" y="-96" width="66" height="74" rx="20" fill="${accent}" opacity=".35" filter="url(#${id}-soft)"/>
  <rect x="-33" y="-96" width="66" height="74" rx="20" fill="${tile}"/>
  <g clip-path="url(#${id}-clip)">
    <rect x="-40" y="-34" width="80" height="20" fill="#e6d6c0"/>
    <rect x="18" y="-100" width="22" height="80" fill="#e6d6c0" opacity=".7"/>
  </g>
  <rect x="-33" y="-96" width="66" height="74" rx="20" fill="none" stroke="${OUTLINE}" stroke-width="3.2"/>
  <rect x="-25" y="-90" width="10" height="5" rx="2.5" fill="#ffffff" opacity=".95"/>
  <polyline points="-13,-54 -23,-45 -13,-36" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <polyline points="15,-54 25,-45 15,-36" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  ${glyphPath}`;
}

// ── Phần dưới chỉ dùng cho ảnh tĩnh (OG). Phim tự vẽ bản chuyển động. ──────
const glove = (x, y) => `<circle cx="${x}" cy="${y}" r="7" fill="#ffffff" stroke="${OUTLINE}" stroke-width="2.6"/>`;
const tube = (d, color) =>
  `<path d="${d}" fill="none" stroke="${OUTLINE}" stroke-width="9.5" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="5.5" stroke-linecap="round"/>`;
const shoe = (x, rig) =>
  `<path d="M ${x - 10} 1 Q ${x - 10} -7 ${x} -7 Q ${x + 11} -7 ${x + 11} 1 Z" fill="${rig.shoe}" stroke="${OUTLINE}" stroke-width="2.6" stroke-linejoin="round"/><path d="M ${x - 10} 1 L ${x + 11} 1" stroke="${rig.sole}" stroke-width="2"/>`;

/** Mặt tĩnh: `look` = hướng nhìn (-1 trái, 1 phải), miệng cười mở. */
export function faceSvg(y, look = 0) {
  return `
  <ellipse cx="-19" cy="${y + 12}" rx="5.5" ry="3.2" fill="#ff8fb0" opacity=".7"/>
  <ellipse cx="19" cy="${y + 12}" rx="5.5" ry="3.2" fill="#ff8fb0" opacity=".7"/>
  <path d="M -16 ${y - 11} Q -10 ${y - 15} -4 ${y - 11}" fill="none" stroke="${OUTLINE}" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M 4 ${y - 11} Q 10 ${y - 15} 16 ${y - 11}" fill="none" stroke="${OUTLINE}" stroke-width="2.6" stroke-linecap="round"/>
  <ellipse cx="-10" cy="${y}" rx="6.2" ry="7.6" fill="#ffffff" stroke="${OUTLINE}" stroke-width="2.4"/>
  <ellipse cx="10" cy="${y}" rx="6.2" ry="7.6" fill="#ffffff" stroke="${OUTLINE}" stroke-width="2.4"/>
  <circle cx="${-10 + look * 2}" cy="${y + 1}" r="3.6" fill="${OUTLINE}"/>
  <circle cx="${10 + look * 2}" cy="${y + 1}" r="3.6" fill="${OUTLINE}"/>
  <circle cx="${-11 + look * 2}" cy="${y - 0.6}" r="1.3" fill="#ffffff"/>
  <circle cx="${9 + look * 2}" cy="${y - 0.6}" r="1.3" fill="#ffffff"/>
  <path d="M -8 ${y + 10} Q 0 ${y + 10} 8 ${y + 10} Q 7 ${y + 20} 0 ${y + 20} Q -7 ${y + 20} -8 ${y + 10} Z" fill="${OUTLINE}"/>
  <ellipse cx="0" cy="${y + 17}" rx="4" ry="2.4" fill="#ff7a8e"/>`;
}

/** Tay chân tĩnh: tay ngoài giơ chào, tay trong bắt tay tại `meetX` (toạ độ cục bộ). */
export function limbsSvg(rig, side, meetX) {
  const s = rig.shoulder;
  const out = [s * side, -55];
  const inn = [-s * side, -55];
  const raised = [out[0] + 16 * side, -92];
  return `
  ${tube("M -9 -24 L -11 -6", rig.limb)}${tube("M 9 -24 L 11 -6", rig.limb)}
  ${shoe(-12, rig)}${shoe(11, rig)}
  ${tube(`M ${out[0]} ${out[1]} Q ${out[0] + 12 * side} ${-70} ${raised[0]} ${raised[1]}`, rig.limb)}${glove(raised[0], raised[1])}
  ${tube(`M ${inn[0]} ${inn[1]} Q ${(inn[0] + meetX) / 2} -42 ${meetX} -42`, rig.limb)}${glove(meetX, -42)}`;
}
