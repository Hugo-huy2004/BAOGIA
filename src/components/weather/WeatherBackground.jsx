import React, { useEffect, useMemo, useRef } from "react";

// Apple-Weather-style animated atmosphere, rendered as a non-interactive overlay
// (pointer-events: none) so it layers over ANY bio theme without touching it.
// CSS handles the sky wash / sun / moon / clouds / fog; a single canvas handles
// particle systems (rain, snow, stars) for smoothness. It pauses when the tab is
// hidden and honors prefers-reduced-motion.
//
// Props: condition (clear|partly-cloudy|cloudy|fog|rain|snow|thunder),
//        isDay (bool), intensity (0..1), zIndex, opacity.

const SKY = {
  clear:          { day: "#3a8bd6", night: "#0a1030" },
  "partly-cloudy":{ day: "#5b9bd6", night: "#141f3d" },
  cloudy:         { day: "#7f95ad", night: "#1b2436" },
  fog:            { day: "#b3bdc8", night: "#28313d" },
  rain:           { day: "#556a80", night: "#131b2b" },
  snow:           { day: "#a7bacb", night: "#223047" },
  thunder:        { day: "#3f4a5e", night: "#0e1420" },
};

const usesCanvas = (condition, isDay) =>
  condition === "rain" || condition === "snow" || condition === "thunder" ||
  (condition === "clear" && !isDay) || (condition === "partly-cloudy" && !isDay);

export default function WeatherBackground({
  condition = "clear",
  isDay = true,
  intensity = 0.75,
  zIndex = 40,
  opacity = 0.9,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const reduceMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );
  const skyColor = (SKY[condition] || SKY.cloudy)[isDay ? "day" : "night"];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduceMotion || !usesCanvas(condition, isDay)) return;

    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles = [];
    let flash = 0;          // thunder flash [0..1]
    let nextFlash = 1500 + Math.random() * 4000;
    let last = performance.now();

    const kind =
      condition === "snow" ? "snow" :
      condition === "clear" || condition === "partly-cloudy" ? "stars" : "rain";

    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const seed = () => {
      const base = Math.max(w, 360);
      if (kind === "rain") {
        const n = Math.round(base * 0.16 * (0.5 + intensity));
        particles = Array.from({ length: n }, () => ({
          x: Math.random() * w, y: Math.random() * h,
          len: 8 + Math.random() * 14 * intensity, spd: 6 + Math.random() * 8,
        }));
      } else if (kind === "snow") {
        const n = Math.round(base * 0.11 * (0.5 + intensity));
        particles = Array.from({ length: n }, () => ({
          x: Math.random() * w, y: Math.random() * h,
          r: 1 + Math.random() * 2.5, spd: 0.5 + Math.random() * 1.2,
          sway: Math.random() * Math.PI * 2, swayR: 8 + Math.random() * 16,
        }));
      } else { // stars
        const n = Math.round(base * 0.14);
        particles = Array.from({ length: n }, () => ({
          x: Math.random() * w, y: Math.random() * h * 0.7,
          r: Math.random() * 1.4 + 0.3, ph: Math.random() * Math.PI * 2,
          tw: 0.6 + Math.random() * 1.6,
        }));
      }
    };

    const windSlant = condition === "thunder" ? 2.2 : 1.1;

    const draw = (now) => {
      const dt = Math.min(48, now - last); last = now;
      ctx.clearRect(0, 0, w, h);

      if (kind === "rain") {
        ctx.strokeStyle = `rgba(180,205,235,${0.35 + 0.3 * intensity})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        for (const p of particles) {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - windSlant * (p.len / 3), p.y + p.len);
          p.y += p.spd * (dt / 16); p.x -= windSlant * (p.spd / 6) * (dt / 16);
          if (p.y > h) { p.y = -p.len; p.x = Math.random() * w; }
          if (p.x < -10) p.x = w + 10;
        }
        ctx.stroke();

        if (condition === "thunder") {
          nextFlash -= dt;
          if (nextFlash <= 0) { flash = 1; nextFlash = 2500 + Math.random() * 6000; }
          if (flash > 0) {
            ctx.fillStyle = `rgba(255,255,255,${0.5 * flash})`;
            ctx.fillRect(0, 0, w, h);
            flash = Math.max(0, flash - dt / 220);
          }
        }
      } else if (kind === "snow") {
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        for (const p of particles) {
          p.sway += 0.01 * dt / 16;
          const dx = Math.sin(p.sway) * (p.swayR / 20);
          ctx.beginPath();
          ctx.arc(p.x + dx, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          p.y += p.spd * (dt / 16);
          if (p.y > h) { p.y = -4; p.x = Math.random() * w; }
        }
      } else { // stars
        for (const p of particles) {
          p.ph += (dt / 1000) * p.tw;
          const a = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(p.ph));
          ctx.fillStyle = `rgba(255,255,255,${a})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    const onVis = () => {
      cancelAnimationFrame(rafRef.current);
      if (document.visibilityState === "visible") { last = performance.now(); rafRef.current = requestAnimationFrame(draw); }
    };
    document.addEventListener("visibilitychange", onVis);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [condition, isDay, intensity, reduceMotion]);

  const showSun = condition === "clear" && isDay;
  const showMoon = (condition === "clear" || condition === "partly-cloudy") && !isDay;
  const showClouds = condition === "partly-cloudy" || condition === "cloudy" || condition === "rain" || condition === "thunder";
  const showFog = condition === "fog";

  return (
    <div
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex, opacity, pointerEvents: "none", overflow: "hidden" }}
    >
      <style>{`
        @keyframes wbCloud { from { transform: translateX(-30%); } to { transform: translateX(130%); } }
        @keyframes wbFog { 0%,100% { transform: translateX(-8%); } 50% { transform: translateX(8%); } }
        @keyframes wbSunPulse { 0%,100% { transform: scale(1); opacity: .95; } 50% { transform: scale(1.06); opacity: 1; } }
      `}</style>

      {/* Sky wash — edge-weighted so page content in the middle stays readable */}
      <div style={{
        position: "absolute", inset: 0,
        background:
          `linear-gradient(180deg, ${skyColor} 0%, ${hexA(skyColor, 0.55)} 18%, ${hexA(skyColor, 0)} 42%,` +
          ` ${hexA(skyColor, 0)} 78%, ${hexA(skyColor, 0.4)} 100%)`,
      }} />

      {/* Sun */}
      {showSun && (
        <div style={{
          position: "absolute", top: "6%", right: "10%", width: 160, height: 160, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,247,214,0.95) 0%, rgba(255,214,120,0.7) 30%, rgba(255,200,90,0) 70%)",
          filter: "blur(2px)", animation: reduceMotion ? "none" : "wbSunPulse 6s ease-in-out infinite",
        }} />
      )}

      {/* Crescent moon (carved with an offset shadow the color of the night sky) */}
      {showMoon && (
        <div style={{ position: "absolute", top: "8%", right: "12%", width: 84, height: 84 }}>
          <div style={{
            width: "100%", height: "100%", borderRadius: "50%",
            background: "radial-gradient(circle at 60% 40%, #fdf6d8, #e8e2c2)",
            boxShadow: `inset -22px 12px 0 0 ${skyColor}, 0 0 40px rgba(253,246,216,0.35)`,
          }} />
        </div>
      )}

      {/* Drifting clouds */}
      {showClouds && !reduceMotion && (
        <>
          {[
            { top: "8%", scale: 1.1, dur: 46, delay: 0, o: 0.55 },
            { top: "20%", scale: 0.8, dur: 62, delay: -18, o: 0.4 },
            { top: "3%", scale: 0.65, dur: 78, delay: -40, o: 0.3 },
          ].map((c, i) => (
            <div key={i} style={{
              position: "absolute", top: c.top, left: 0,
              width: 220 * c.scale, height: 70 * c.scale,
              background: "radial-gradient(60% 100% at 30% 60%, rgba(255,255,255,.9), rgba(255,255,255,0) 70%)," +
                          "radial-gradient(55% 100% at 65% 55%, rgba(255,255,255,.85), rgba(255,255,255,0) 72%)",
              filter: "blur(6px)", opacity: c.o,
              animation: `wbCloud ${c.dur}s linear ${c.delay}s infinite`,
            }} />
          ))}
        </>
      )}

      {/* Fog layers */}
      {showFog && (
        <>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: "absolute", left: "-10%", right: "-10%", top: `${15 + i * 22}%`, height: "26%",
              background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(230,236,242,0.5) 50%, rgba(255,255,255,0) 100%)",
              filter: "blur(10px)", animation: reduceMotion ? "none" : `wbFog ${18 + i * 6}s ease-in-out ${-i * 3}s infinite`,
            }} />
          ))}
        </>
      )}

      {/* Particle canvas (rain / snow / stars) */}
      {usesCanvas(condition, isDay) && !reduceMotion && (
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      )}
    </div>
  );
}

// #rrggbb -> rgba() with the given alpha (for building gradient stops).
function hexA(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
