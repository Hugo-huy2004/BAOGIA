/**
 * Sinh đường viền bản đồ cho dấu ấn bản của tab TODAY.
 *
 *   node scripts/generate-edition-outlines.mjs
 *
 * Nguồn: Natural Earth 1:50m admin_0 (PHẠM VI CÔNG CỘNG — không cần ghi công,
 * nhưng vẫn ghi ở đây cho người sau biết đường lần). Tải một lần, in ra
 * src/components/member/today/editionOutlines.js rồi commit — chạy lại chỉ khi
 * cần đổi độ chi tiết.
 *
 * KHÔNG sinh cho Trung Quốc: đường viền của họ đã được vẽ tay có chủ đích
 * (đại lục + Hải Nam + Đài Loan, không kèm bất kỳ đường yêu sách biển nào) —
 * xem ChinaEditionMark. Đè bằng dữ liệu Natural Earth sẽ đổi lựa chọn đó.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const SOURCE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson';
const OUT = 'src/components/member/today/editionOutlines.js';

// `window` cắt phần lãnh thổ nằm quá xa làm khung hình vô dụng: Guiana thuộc
// Pháp ở Nam Mỹ, Canarias của Tây Ban Nha ngoài châu Phi, Alaska/Hawaii của Mỹ.
// Cắt ở đây là quyết định TRÌNH BÀY (vẽ vừa một con tem 124px), không phải phát
// biểu về chủ quyền — nên phần bị bỏ được ghi rõ trong `note`.
const COUNTRIES = {
  vi: { name: 'Vietnam', note: 'đất liền; dữ liệu 50m không có Hoàng Sa/Trường Sa' },
  en: { name: 'United States of America', window: [-127, 24, -66, 50], note: 'lục địa 48 bang; không có Alaska/Hawaii' },
  th: { name: 'Thailand' },
  ja: { name: 'Japan' },
  ko: { name: 'South Korea' },
  id: { name: 'Indonesia' },
  es: { name: 'Spain', window: [-10, 35, 5, 44], note: 'bán đảo + Baleares; không có Canarias' },
  fr: { name: 'France', window: [-6, 41, 10, 52], note: 'chính quốc; không có lãnh thổ hải ngoại' },
};

const VIEW = 1000;          // bề rộng viewBox
const TOLERANCE = 0.015;    // độ (~1,7km) — bờ biển còn nếp, path vẫn dưới 6KB
const MIN_AREA_RATIO = 0.004; // đảo nhỏ hơn 0,4% đảo lớn nhất thì bỏ

const ringArea = (ring) => Math.abs(ring.reduce(
  (sum, [x, y], i) => { const [px, py] = ring[(i + 1) % ring.length]; return sum + (x * py - px * y); },
  0,
)) / 2;

// Douglas–Peucker: bỏ điểm nào nằm sát đoạn thẳng nối hai đầu.
function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];
  let index = 0;
  let maxDistance = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const [px, py] = points[i];
    const dx = bx - ax;
    const dy = by - ay;
    const distance = Math.hypot(dx, dy) === 0
      ? Math.hypot(px - ax, py - ay)
      : Math.abs(dy * px - dx * py + bx * ay - by * ax) / Math.hypot(dx, dy);
    if (distance > maxDistance) { index = i; maxDistance = distance; }
  }
  if (maxDistance <= tolerance) return [points[0], points[points.length - 1]];
  return [
    ...simplify(points.slice(0, index + 1), tolerance).slice(0, -1),
    ...simplify(points.slice(index), tolerance),
  ];
}

const inWindow = (ring, w) => !w || ring.some(([x, y]) => x >= w[0] && x <= w[2] && y >= w[1] && y <= w[3]);

async function main() {
  const geo = await (await fetch(SOURCE)).json();
  const entries = [];

  for (const [code, config] of Object.entries(COUNTRIES)) {
    const feature = geo.features.find((f) => f.properties.NAME === config.name);
    if (!feature) throw new Error(`Không tìm thấy ${config.name} trong dữ liệu`);

    const polygons = (feature.geometry.type === 'Polygon'
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates)
      .map((rings) => rings[0])                       // chỉ vành ngoài, bỏ hồ bên trong
      .filter((ring) => inWindow(ring, config.window));

    const biggest = Math.max(...polygons.map(ringArea));
    const kept = polygons.filter((ring) => ringArea(ring) >= biggest * MIN_AREA_RATIO);

    // Phép chiếu: kinh độ nhân cos(vĩ độ giữa) để nước không bị kéo bè ngang —
    // xấp xỉ rẻ tiền của phép chiếu hình nón, đủ đúng cho một quốc gia.
    const lats = kept.flat().map(([, y]) => y);
    const lons = kept.flat().map(([x]) => x);
    const kx = Math.cos((Math.min(...lats) + Math.max(...lats)) / 2 * Math.PI / 180);
    const minX = Math.min(...lons) * kx;
    const maxX = Math.max(...lons) * kx;
    const minY = -Math.max(...lats);
    const maxY = -Math.min(...lats);
    const scale = VIEW / (maxX - minX);
    const height = Math.round((maxY - minY) * scale);
    const round = (n) => Math.round(n * 10) / 10;
    const project = ([lon, lat]) => [
      round((lon * kx - minX) * scale),
      round((-lat - minY) * scale),
    ];

    const d = kept
      .map((ring) => simplify(ring, TOLERANCE).map(project))
      .map((ring) => `M${ring.map(([x, y]) => `${x} ${y}`).join('L')}Z`)
      .join('');

    entries.push({ code, viewBox: `0 0 ${VIEW} ${height}`, d, parts: kept.length, note: config.note });
    console.log(`${code}: ${kept.length} mảnh, ${d.length} ký tự${config.note ? ` — ${config.note}` : ''}`);
  }

  const body = entries.map(({ code, viewBox, d, note }) => [
    note ? `  // ${note}` : null,
    `  ${code}: { viewBox: '${viewBox}', d: '${d}' },`,
  ].filter(Boolean).join('\n')).join('\n');

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, [
    '// SINH TỰ ĐỘNG bởi scripts/generate-edition-outlines.mjs — đừng sửa tay.',
    '// Nguồn: Natural Earth 1:50m admin_0 (phạm vi công cộng).',
    '// Trung Quốc không nằm ở đây: đường viền của họ được vẽ tay trong',
    '// ChinaEditionMark.jsx và có ghi chú riêng.',
    'export const EDITION_OUTLINES = Object.freeze({',
    body,
    '});',
    '',
  ].join('\n'));
  console.log(`→ ${OUT}`);
}

main();
