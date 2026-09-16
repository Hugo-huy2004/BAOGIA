import { useEffect, useRef } from "react";

/**
 * CinematicAtmosphere delivers 4-dimensional sensory immersion:
 * - Visual: 35mm film grain, edge vignette, lens framing
 * - Illusion (Ảo giác): Mouse-following projector spotlight & caustic lighting
 * - Transition: Soft top/bottom dissolve masks for invisible cuts
 */
export default function CinematicAtmosphere() {
  const spotlightRef = useRef(null);

  useEffect(() => {
    let rafId = null;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    const handlePointerMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const loop = () => {
      // Smooth lerp (0.08) for silky light motion
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      }
      rafId = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
    >
      {/* 1. 35mm Organic Film Grain Overlay */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.032] dark:opacity-[0.048] mix-blend-overlay">
        <filter id="cine-film-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#cine-film-grain)" />
      </svg>

      {/* 2. Interactive Projector Spotlight (Ảo giác ánh sáng rạp phim) */}
      <div
        ref={spotlightRef}
        className="absolute -top-[25rem] -left-[25rem] size-[50rem] rounded-full opacity-60 dark:opacity-80 transition-opacity duration-700"
        style={{
          background:
            "radial-gradient(circle, rgba(0, 240, 255, 0.08) 0%, rgba(41, 151, 255, 0.03) 40%, transparent 70%)",
          filter: "blur(40px)",
          willChange: "transform",
        }}
      />

      {/* 3. Soft Non-linear Edge Vignette for Invisible Cuts (Cú cắt vô hình) */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background via-background/60 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none" />

      {/* 4. Director's Viewfinder Frame & Corner Slates (Định hình bố cục) */}
      <div className="hidden lg:block absolute inset-4 border border-white/[0.03] pointer-events-none rounded-2xl">
        {/* Corner 1 (Top Left) */}
        <span className="absolute top-2 left-2 font-mono text-[9px] tracking-[0.2em] text-white/20 uppercase select-none">
          REC · 24FPS
        </span>
        {/* Corner 2 (Top Right) */}
        <span className="absolute top-2 right-2 font-mono text-[9px] tracking-[0.2em] text-white/20 uppercase select-none">
          432HZ · MASTER
        </span>
        {/* Corner 3 (Bottom Left) */}
        <span className="absolute bottom-2 left-2 font-mono text-[9px] tracking-[0.2em] text-white/20 uppercase select-none">
          HUGO STUDIO
        </span>
        {/* Corner 4 (Bottom Right) */}
        <span className="absolute bottom-2 right-2 font-mono text-[9px] tracking-[0.2em] text-[#00f0ff]/40 uppercase select-none">
          [ 1.85:1 ]
        </span>
      </div>
    </div>
  );
}
