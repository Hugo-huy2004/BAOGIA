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

// Rich, full-screen Apple-style skies for the "immersive" mode (weather sits
// BEHIND the glass cards, so it can be vivid and detailed).
const IMMERSIVE_SKY = {
  clear:           { day: "linear-gradient(180deg,#2b7fd4 0%,#4f9fe6 32%,#89c2ee 64%,#c6e2f6 100%)", night: "linear-gradient(180deg,#04081a 0%,#0c1836 42%,#182a58 78%,#243a6e 100%)" },
  "partly-cloudy": { day: "linear-gradient(180deg,#3f83c9 0%,#6aa6de 42%,#a9cceb 100%)",              night: "linear-gradient(180deg,#0a1330 0%,#152246 52%,#263864 100%)" },
  cloudy:          { day: "linear-gradient(180deg,#69809b 0%,#8ba0b6 46%,#b8c6d3 100%)",              night: "linear-gradient(180deg,#141b28 0%,#222c3c 56%,#343f52 100%)" },
  fog:             { day: "linear-gradient(180deg,#9fabb7 0%,#c1cad3 50%,#dfe4e9 100%)",              night: "linear-gradient(180deg,#1f2630 0%,#333b46 60%,#49525e 100%)" },
  rain:            { day: "linear-gradient(180deg,#3f5064 0%,#5a6d82 46%,#7f92a4 100%)",              night: "linear-gradient(180deg,#080f1b 0%,#141f30 56%,#23313f 100%)" },
  snow:            { day: "linear-gradient(180deg,#8ea6bd 0%,#aec1d2 46%,#d6e0e8 100%)",              night: "linear-gradient(180deg,#1a2740 0%,#2a3b58 56%,#3e5276 100%)" },
  thunder:         { day: "linear-gradient(180deg,#2e3947 0%,#44515f 50%,#5d6b79 100%)",              night: "linear-gradient(180deg,#070c15 0%,#111a28 56%,#1e2836 100%)" },
};

const usesCanvas = (condition, isDay) =>
  condition === "rain" || condition === "snow" || condition === "thunder" ||
  (condition === "clear" && !isDay) || (condition === "partly-cloudy" && !isDay);

export default function WeatherBackground({
  condition = "clear",
  isDay = true,
  intensity = 0.9,
  zIndex = 40,
  opacity = 0.9,
  immersive = false,
  mode = "fixed", // "fixed" = full-screen overlay; "hero" = top band that fades into the page
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
    // Render at up to 3× device pixels so rain/snow/stars stay crisp & detailed.
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 3);
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
        const n = Math.round(base * 0.26 * (0.5 + intensity));
        particles = Array.from({ length: n }, () => ({
          x: Math.random() * w, y: Math.random() * h,
          len: 10 + Math.random() * 18 * intensity, spd: 7 + Math.random() * 9,
        }));
      } else if (kind === "snow") {
        const n = Math.round(base * 0.18 * (0.5 + intensity));
        particles = Array.from({ length: n }, () => ({
          x: Math.random() * w, y: Math.random() * h,
          r: 1 + Math.random() * 3, spd: 0.5 + Math.random() * 1.3,
          sway: Math.random() * Math.PI * 2, swayR: 8 + Math.random() * 18,
        }));
      } else { // stars
        const n = Math.round(base * 0.22);
        particles = Array.from({ length: n }, () => ({
          x: Math.random() * w, y: Math.random() * h * 0.72,
          r: Math.random() * 1.6 + 0.3, ph: Math.random() * Math.PI * 2,
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

  const heroMode = mode === "hero";
  const fade = "linear-gradient(180deg,#000 0%,#000 58%,rgba(0,0,0,0) 100%)";
  const rootStyle = heroMode
    ? {
        position: "absolute", top: 0, left: 0, right: 0, height: "min(72vh, 640px)",
        zIndex: -1, opacity, pointerEvents: "none", overflow: "hidden",
        WebkitMaskImage: fade, maskImage: fade,
      }
    : { position: "fixed", inset: 0, zIndex, opacity, pointerEvents: "none", overflow: "hidden" };

  return (
    <div aria-hidden="true" style={rootStyle}>
      <style>{`
        @keyframes wbCloud { from { transform: translateX(-30%); } to { transform: translateX(130%); } }
        @keyframes wbFog { 0%,100% { transform: translateX(-8%); } 50% { transform: translateX(8%); } }
        @keyframes wbSunPulse { 0%,100% { transform: scale(1); opacity: .95; } 50% { transform: scale(1.06); opacity: 1; } }
      `}</style>

      {/* Sky: immersive = full vivid gradient (weather is BEHIND glass cards);
          otherwise an edge-weighted wash so overlaid content stays readable. */}
      {immersive ? (
        <>
          <div style={{ position: "absolute", inset: 0, background: (IMMERSIVE_SKY[condition] || IMMERSIVE_SKY.cloudy)[isDay ? "day" : "night"] }} />
          {/* Depth vignette */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 90% at 50% 10%, rgba(255,255,255,0.08), rgba(0,0,0,0) 45%), radial-gradient(140% 100% at 50% 100%, rgba(0,0,0,0.22), rgba(0,0,0,0) 55%)" }} />
        </>
      ) : (
        <div style={{
          position: "absolute", inset: 0,
          background:
            `linear-gradient(180deg, ${skyColor} 0%, ${hexA(skyColor, 0.55)} 18%, ${hexA(skyColor, 0)} 42%,` +
            ` ${hexA(skyColor, 0)} 78%, ${hexA(skyColor, 0.4)} 100%)`,
        }} />
      )}

      {/* Sun */}
      {showSun && (
        <div style={{
          position: "absolute", top: "6%", right: "10%",
          width: immersive ? 240 : 160, height: immersive ? 240 : 160, borderRadius: "50%",
          background: "radial-gradient(circle, #fffdf2 0%, rgba(255,247,214,0.98) 14%, rgba(255,216,120,0.75) 34%, rgba(255,200,90,0) 72%)",
          filter: "blur(1px)", animation: reduceMotion ? "none" : "wbSunPulse 6s ease-in-out infinite",
        }} />
      )}

      {/* Crescent moon (carved with an offset shadow the color of the night sky) */}
      {showMoon && (
        <div style={{ position: "absolute", top: "8%", right: "12%", width: immersive ? 116 : 84, height: immersive ? 116 : 84 }}>
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
