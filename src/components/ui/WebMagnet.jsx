import { useCallback, useEffect, useRef, useState } from "react";

/* Nút bị "dính tơ": con trỏ lại gần thì nút nhích theo và có sợi tơ nối tới
   con trỏ; rời ra thì nút bật về bằng easing nảy. Chỉ chạy trên thiết bị có
   chuột thật và khi người dùng không yêu cầu giảm chuyển động. */

const PULL = 90; // px quanh mép nút, tính từ tâm nút ra
const STRENGTH = 0.26; // nút đi được bao nhiêu phần quãng đường tới con trỏ
const OVERHANG = PULL + 40; // SVG phải rộng hơn nút để vẽ sợi tơ ra ngoài

const canMagnet = () =>
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function WebMagnet({ children, className = "" }) {
  const wrapRef = useRef(null);
  const rectRef = useRef(null);
  const [pull, setPull] = useState(null);

  // ponytail: rect chỉ đọc lại khi scroll/resize, nên mỗi lần chuột di chuyển
  // chỉ là phép toán — không ép trình duyệt tính lại layout theo từng frame.
  const readRect = useCallback(() => {
    rectRef.current = wrapRef.current?.getBoundingClientRect() ?? null;
  }, []);

  useEffect(() => {
    if (!canMagnet()) return undefined;
    readRect();
    const onMove = (e) => {
      const r = rectRef.current;
      if (!r) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const reach = PULL + Math.max(r.width, r.height) / 2;
      setPull(
        Math.hypot(dx, dy) > reach
          ? null
          : { dx, dy, w: r.width, h: r.height },
      );
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", readRect, { passive: true });
    window.addEventListener("resize", readRect);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", readRect);
      window.removeEventListener("resize", readRect);
    };
  }, [readRect]);

  const size = pull ? { w: pull.w, h: pull.h } : null;
  const bx = size ? OVERHANG + size.w / 2 + pull.dx * STRENGTH : 0;
  const by = size ? OVERHANG + size.h / 2 + pull.dy * STRENGTH : 0;
  const px = size ? OVERHANG + size.w / 2 + pull.dx : 0;
  const py = size ? OVERHANG + size.h / 2 + pull.dy : 0;
  const sag = size ? Math.hypot(px - bx, py - by) * 0.12 : 0;

  return (
    <span ref={wrapRef} className={`relative inline-flex ${className}`}>
      {pull && (
        <svg
          className="pointer-events-none absolute text-foreground/35"
          style={{
            left: -OVERHANG,
            top: -OVERHANG,
            width: size.w + OVERHANG * 2,
            height: size.h + OVERHANG * 2,
          }}
          aria-hidden="true"
        >
          <path
            d={`M ${bx} ${by} Q ${(bx + px) / 2} ${(by + py) / 2 + sag} ${px} ${py}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
      )}
      <span
        className="inline-flex w-full will-change-transform"
        style={{
          transform: pull
            ? `translate(${pull.dx * STRENGTH}px, ${pull.dy * STRENGTH}px)`
            : "translate(0px, 0px)",
          transition: pull
            ? "transform 150ms ease-out"
            : "transform 550ms cubic-bezier(.2,1.6,.4,1)",
        }}
      >
        {children}
      </span>
    </span>
  );
}
