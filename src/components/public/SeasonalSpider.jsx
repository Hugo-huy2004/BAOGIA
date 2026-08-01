import { useEffect, useState } from "react";
import { activeSeason } from "../../config/season";

/* Trang trí theo mùa: mạng nhện bám hai góc trên của trang, và một chibi đu tơ
   tụt xuống, tiếp đất rồi chạy biến — diễn lại mỗi lần vào trang.
   Toàn bộ là trang trí: pointer-events-none, aria-hidden, không chặn thao tác. */

// Mùa nào cũng nhả nhện: "spider" là cửa sổ riêng (31/07–15/08), "halloween"
// là mùa cố định hằng năm. Thêm mùa mới thì khai báo ở season.js rồi bỏ id vào đây.
const SPIDER_SEASONS = new Set(["spider", "halloween"]);

const R = 300; // bán kính mạng nhện, đơn vị viewBox
const SPOKES = 9;
const RINGS = 5;

const ang = (i) => Math.PI / 2 + (Math.PI / 2) * (i / (SPOKES - 1)); // 90° → 180°
const P = (a, r) => `${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`;

/* Nan hoa toả ra từ góc, mỗi vòng tơ võng vào trong giữa hai nan liền nhau. */
function webPaths() {
  const spokes = Array.from({ length: SPOKES }, (_, i) => `M 0 0 L ${P(ang(i), R)}`);
  const rings = [];
  for (let k = 1; k <= RINGS; k += 1) {
    const r = (R * k) / RINGS;
    for (let i = 0; i < SPOKES - 1; i += 1) {
      const mid = (ang(i) + ang(i + 1)) / 2;
      rings.push(`M ${P(ang(i), r)} Q ${P(mid, r * 0.82)} ${P(ang(i + 1), r)}`);
    }
  }
  return [...spokes, ...rings];
}

function CornerWeb({ className }) {
  return (
    <svg
      viewBox={`${-R - 6} -6 ${R + 12} ${R + 12}`}
      className={`pointer-events-none absolute top-0 text-foreground/25 ${className}`}
      aria-hidden="true"
    >
      {webPaths().map((d) => (
        <path key={d} d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ))}
    </svg>
  );
}

/* Muốn thay bằng hình riêng: bỏ file vào public/image/ rồi trỏ hằng số này vào
   nó (vd "/image/spider.png"). Để rỗng thì dùng bóng người vẽ sẵn bên dưới.
   Chỉ dùng hình bạn tự vẽ hoặc đã mua bản quyền — art Marvel thì không. */
const FIGURE_IMG = "";

/* Chibi tự vẽ: đầu to bằng nửa người, mắt kính to, người mặc đồ màu brand của
   site. Cố tình KHÔNG dùng đỏ-xanh và không kẻ mạng lên đồ — đó là nhận diện
   của Marvel. Một tư thế dùng cho cả treo (lộn ngược) lẫn chạy. */
/* Bảng màu nhân vật. Đỏ + xanh thép là tông siêu anh hùng cổ điển, dùng chung
   cả ngành — thứ KHÔNG lấy là hoạ tiết mạng trên đồ, con nhện ngực và dáng mắt
   kính của Marvel. Đổi tông khác chỉ cần sửa bốn hằng số này. */
const SUIT = "#c62f2b"; // đỏ chính
const SUIT_LIGHT = "#e8635c"; // mảng bắt sáng
const SUIT_DARK = "#33587f"; // xanh thép: mảng ngực, găng, giày
const INK = "#1b0e10"; // viền, thứ giữ dáng nhân vật ở cỡ nhỏ

/* Nhân vật vẽ bằng bản đồ pixel: 1 ký tự = 1 ô vuông. Sửa dáng thì sửa thẳng
   trên "hình vẽ" này chứ không phải mò toạ độ path.
     K viền · S đồ chính · L bắt sáng · D đồ tối (thân, găng, giày) · W tròng kính
   Vẽ ở tư thế đứng; lúc treo hệ animation lật 180° nên hàng mắt cố tình đối
   xứng trên–dưới để úp ngược vẫn ra mắt. */
const PIXELS = [
  "....KKKKK....",
  "..KKSSSSSKK..",
  ".KSLLSSSSSSK.",
  "KSLLSSSSSSSSK",
  "KSSSSSSSSSSSK",
  "KSSWWSSSWWSSK",
  "KSWWWSSSWWWSK",
  "KSSWWSSSWWSSK",
  "KSSSSSSSSSSSK",
  ".KSSSSSSSSSK.",
  "..KKSSSSSKK..",
  "...KKKKKKK...",
  "...KSSSSSK...",
  ".KSKSSSSSKSK.",
  ".KSKSDDDSKSK.",
  ".KLKSDDDSKSK.",
  ".KDKSSSSSKDK.",
  "..KKSSSSSKK..",
  "...KSSKSSK...",
  "...KLSKSSK...",
  "...KDDKDDK...",
  "...KKKKKKK...",
];

const PALETTE = { K: INK, S: SUIT, L: SUIT_LIGHT, D: SUIT_DARK, W: "#ffffff" };
const PX = 6; // cạnh một pixel, px màn hình

// Thiếu/thừa một ký tự là cả hàng lệch mà nhìn code không ra — kêu ngay khi dev.
if (import.meta.env.DEV && PIXELS.some((r) => r.length !== PIXELS[0].length)) {
  throw new Error("SeasonalSpider: mọi hàng trong PIXELS phải dài bằng nhau");
}

function Figure() {
  if (FIGURE_IMG) {
    return <img src={FIGURE_IMG} width="96" height="116" alt="" className="block select-none" />;
  }
  const cols = PIXELS[0].length;
  return (
    <svg
      width={cols * PX}
      height={PIXELS.length * PX}
      viewBox={`0 0 ${cols} ${PIXELS.length}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {PIXELS.flatMap((row, y) =>
        [...row].map((ch, x) =>
          ch === "." ? null : (
            <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={PALETTE[ch]} />
          ),
        ),
      )}
    </svg>
  );
}

export default function SeasonalSpider() {
  const season = activeSeason();
  const reduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Diễn lại mỗi lần vào trang. Bản trước chỉ diễn một lần mỗi phiên nên F5
  // xong không thấy gì, tưởng hỏng — cái cờ đó tốn nhiều hơn nó đáng.
  const [phase, setPhase] = useState(reduced ? "gone" : "drop");

  useEffect(() => {
    if (!SPIDER_SEASONS.has(season) || phase === "gone") return undefined;
    const toRun = setTimeout(() => setPhase("run"), 3400);
    const toGone = setTimeout(() => setPhase("gone"), 7100);
    return () => {
      clearTimeout(toRun);
      clearTimeout(toGone);
    };
    // Chỉ chạy một lần khi vào trang; đổi phase không được đặt lại hẹn giờ.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season]);

  if (!SPIDER_SEASONS.has(season)) return null;

  return (
    // h-[70vh] để overflow-hidden có gì mà cắt — nếu không, cú chạy sang trái
    // đẻ ra thanh cuộn ngang.
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-[70vh] overflow-hidden" aria-hidden="true">
      <style>{SPIDER_CSS}</style>
      <CornerWeb className="right-0 w-[46vw] max-w-[380px]" />
      <CornerWeb className="left-0 w-[26vw] max-w-[210px] -scale-x-100" />

      {phase !== "gone" && (
        <div className={`spidey spidey--${phase}`}>
          <span className="spidey-thread" />
          <span className="spidey-body">
            <Figure />
          </span>
        </div>
      )}
    </div>
  );
}

const SPIDER_CSS = `
.spidey {
  position: absolute;
  top: 0;
  right: 22%;
  display: flex;
  flex-direction: column;
  align-items: center;
  will-change: transform;
}
.spidey-thread {
  width: 1px;
  height: 42vh;
  background: currentColor;
  color: hsl(var(--foreground) / 0.35);
  transform-origin: top center;
}
/* Xoay quanh TÂM, không phải mép trên: lấy mép trên thì cả khối bị đẩy ngược
   lên và sợi tơ chạy xuyên qua người. Xoay quanh tâm thì chân dính đúng đầu tơ. */
.spidey-body {
  transform-origin: center;
  line-height: 0;
}
/* Tụt xuống, vượt đà một chút rồi mới đứng yên đung đưa. */
.spidey--drop { animation: spidey-drop 1.5s cubic-bezier(.34,1.3,.64,1) both; }
.spidey--drop .spidey-body {
  transform: rotate(180deg);
  animation: spidey-sway 2.4s 1.5s ease-in-out infinite alternate;
}
/* Nhả tơ, tiếp đất rồi chạy vụt sang trái ra khỏi màn hình. */
/* linear + tự chia mốc: rơi nhanh rồi chạy đều — chạy quá nhanh thì không ai
   kịp nhìn, mà đó lại là khoảnh khắc duy nhất đáng nhìn. */
.spidey--run { animation: spidey-run 3.6s linear both; }
.spidey--run .spidey-thread { animation: spidey-snap .35s ease-in both; }
.spidey--run .spidey-body {
  animation: spidey-upright .45s ease-out both, spidey-bob .16s .45s ease-in-out infinite alternate;
}
@keyframes spidey-drop {
  from { transform: translateY(-100%); }
  70%  { transform: translateY(3%); }
  to   { transform: translateY(0); }
}
@keyframes spidey-sway {
  from { transform: rotate(173deg); }
  to   { transform: rotate(187deg); }
}
@keyframes spidey-snap {
  from { transform: scaleY(1); opacity: 1; }
  to   { transform: scaleY(0); opacity: 0; }
}
@keyframes spidey-run {
  0%   { transform: translate(0, 0); }
  10%  { transform: translate(-1vw, 14vh); }
  16%  { transform: translate(-2vw, 12vh); }
  100% { transform: translate(-108vw, 12vh); }
}
@keyframes spidey-upright {
  from { transform: rotate(180deg); }
  to   { transform: rotate(0deg); }
}
@keyframes spidey-bob {
  from { transform: translateY(0) skewX(-6deg); }
  to   { transform: translateY(-5px) skewX(-12deg); }
}
`;
