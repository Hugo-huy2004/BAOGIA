import { useEffect, useRef } from "react";

const FILM_CSS = `
  .code-hero-film {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
  }
  .code-hero-film canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
  .code-hero-film::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    opacity: 0.025;
    background: repeating-linear-gradient(0deg, rgba(255,255,255,0.7) 0 1px, transparent 1px 4px);
    mix-blend-mode: soft-light;
  }
  .code-hero-film::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 2;
    background: linear-gradient(90deg, hsl(var(--card) / 0.97) 0%, hsl(var(--card) / 0.9) 38%, hsl(var(--card) / 0.2) 68%, transparent 82%);
  }
  .dark .code-hero-film::after {
    background: linear-gradient(90deg, rgba(13,14,24,0.98) 0%, rgba(13,14,24,0.91) 38%, rgba(13,14,24,0.22) 68%, transparent 84%);
  }
  .code-film-content { position: relative; z-index: 3; }
  .code-film-stage-space { min-height: 25rem; }
  @media (max-width: 1023px) {
    .code-hero-film::after {
      background: linear-gradient(180deg, hsl(var(--card) / 0.98) 0%, hsl(var(--card) / 0.92) 52%, hsl(var(--card) / 0.22) 74%, transparent 90%);
    }
    .dark .code-hero-film::after {
      background: linear-gradient(180deg, rgba(13,14,24,0.98) 0%, rgba(13,14,24,0.93) 53%, rgba(13,14,24,0.22) 76%, transparent 91%);
    }
    .code-film-stage-space { min-height: 21rem; }
  }
  @media (max-width: 639px) {
    .code-film-stage-space { min-height: 18.5rem; }
  }
  @media (prefers-reduced-motion: reduce) {
    .code-hero-film::before { display: none; }
  }
`;

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function sparkle(ctx, x, y, radius, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.quadraticCurveTo(x + radius * 0.18, y - radius * 0.18, x + radius, y);
  ctx.quadraticCurveTo(x + radius * 0.18, y + radius * 0.18, x, y + radius);
  ctx.quadraticCurveTo(x - radius * 0.18, y + radius * 0.18, x - radius, y);
  ctx.quadraticCurveTo(x - radius * 0.18, y - radius * 0.18, x, y - radius);
  ctx.fill();
  ctx.restore();
}

function drawArm(ctx, shoulderX, shoulderY, angle, shirt, skin, isThumb = false) {
  ctx.save();
  ctx.translate(shoulderX, shoulderY);
  ctx.rotate(angle);

  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 30;
  ctx.beginPath();
  ctx.moveTo(0, 3);
  ctx.lineTo(0, 27);
  ctx.stroke();
  ctx.strokeStyle = shirt;
  ctx.lineWidth = 25;
  ctx.beginPath();
  ctx.moveTo(0, 3);
  ctx.lineTo(0, 28);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.48)";
  ctx.lineWidth = 25;
  ctx.beginPath();
  ctx.moveTo(0, 28);
  ctx.lineTo(0, 70);
  ctx.stroke();
  ctx.strokeStyle = skin;
  ctx.lineWidth = 21;
  ctx.beginPath();
  ctx.moveTo(0, 27);
  ctx.lineTo(0, 70);
  ctx.stroke();

  ctx.fillStyle = skin;
  ctx.strokeStyle = "rgba(255,255,255,0.62)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 72, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (isThumb) {
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(8, 68);
    ctx.lineTo(15, 54);
    ctx.stroke();
    ctx.strokeStyle = skin;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(8, 68);
    ctx.lineTo(15, 54);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBoy(ctx, centerX, centerY, scale, time, variant, dark) {
  const bob = Math.sin(time * 1.45) * 6;
  const shirt = dark ? "#718cff" : "#7790e5";
  const shirtLight = dark ? "#afbeff" : "#b9c6ff";
  const skin = "#ffc895";
  const hair = "#11131a";

  ctx.save();
  ctx.translate(centerX, centerY + bob);
  ctx.scale(scale, scale);

  const shadow = ctx.createRadialGradient(0, 166, 4, 0, 166, 112);
  shadow.addColorStop(0, "rgba(7,15,38,0.28)");
  shadow.addColorStop(1, "rgba(7,15,38,0)");
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(0, 166, 112, 17, 0, 0, Math.PI * 2);
  ctx.fill();

  if (variant === "chat") {
    drawArm(ctx, -62, 47, 0.48, shirt, skin);
    drawArm(ctx, 62, 45, -2.22 + Math.sin(time * 3.1) * 0.16, shirt, skin, true);
  } else {
    drawArm(ctx, -62, 50, 0.53 + Math.sin(time * 4) * 0.018, shirt, skin);
    drawArm(ctx, 62, 50, -0.53 - Math.sin(time * 4 + 0.8) * 0.018, shirt, skin);
  }

  const bodyGradient = ctx.createLinearGradient(-75, 35, 75, 152);
  bodyGradient.addColorStop(0, shirtLight);
  bodyGradient.addColorStop(0.55, shirt);
  bodyGradient.addColorStop(1, "#5568c0");
  roundedRect(ctx, -69, 29, 138, 132, 48);
  ctx.fillStyle = bodyGradient;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.save();
  roundedRect(ctx, -69, 29, 138, 132, 48);
  ctx.clip();
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 2;
  for (let x = -58; x <= 58; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x, 34);
    ctx.lineTo(x, 160);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(40,53,118,0.34)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 55);
  ctx.lineTo(0, 161);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#cbd5ff";
  ctx.beginPath();
  ctx.moveTo(-48, 32);
  ctx.lineTo(-5, 43);
  ctx.lineTo(-28, 74);
  ctx.lineTo(-57, 49);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(48, 32);
  ctx.lineTo(5, 43);
  ctx.lineTo(28, 74);
  ctx.lineTo(57, 49);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(43,55,120,0.34)";
  roundedRect(ctx, 27, 86, 27, 24, 5);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "800 13px 'Plus Jakarta Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("H", 40.5, 98);

  ctx.fillStyle = skin;
  ctx.strokeStyle = "rgba(255,255,255,0.52)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(-91, -36, 16, 24, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(91, -36, 16, 24, 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(203,102,72,0.52)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-90, -35, 7, -1.3, 1.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(90, -35, 7, 1.85, 4.42);
  ctx.stroke();

  const faceGradient = ctx.createLinearGradient(-70, -112, 65, 24);
  faceGradient.addColorStop(0, "#ffe0b5");
  faceGradient.addColorStop(0.58, skin);
  faceGradient.addColorStop(1, "#f0a172");
  ctx.fillStyle = faceGradient;
  ctx.beginPath();
  ctx.ellipse(0, -42, 94, 85, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.62)";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.ellipse(49, -88, 19, 11, -0.55, 0, Math.PI * 2);
  ctx.fill();

  const hairGradient = ctx.createLinearGradient(-70, -142, 70, -65);
  hairGradient.addColorStop(0, "#33333b");
  hairGradient.addColorStop(0.45, hair);
  hairGradient.addColorStop(1, "#07080c");
  ctx.fillStyle = hairGradient;
  ctx.beginPath();
  ctx.moveTo(-89, -69);
  ctx.bezierCurveTo(-94, -116, -64, -145, -20, -148);
  ctx.bezierCurveTo(2, -166, 39, -160, 52, -145);
  ctx.bezierCurveTo(91, -147, 108, -110, 91, -66);
  ctx.bezierCurveTo(72, -72, 61, -86, 45, -99);
  ctx.bezierCurveTo(25, -79, 7, -92, -16, -71);
  ctx.bezierCurveTo(-39, -88, -61, -64, -89, -69);
  ctx.closePath();
  ctx.fill();

  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-61, -111);
  ctx.bezierCurveTo(-28, -148, 12, -151, 39, -136);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-60, -91);
  ctx.bezierCurveTo(-26, -119, 0, -125, 22, -116);
  ctx.stroke();

  const glassesY = -69 + Math.sin(time * 1.45) * 0.8;
  ctx.save();
  ctx.translate(0, glassesY);
  ctx.rotate(Math.sin(time * 1.45) * 0.008);
  const lensGradient = ctx.createLinearGradient(0, 0, 0, 48);
  lensGradient.addColorStop(0, "#213b65");
  lensGradient.addColorStop(1, "#050a16");
  for (const x of [-76, 8]) {
    roundedRect(ctx, x, 0, 68, 49, 20);
    ctx.fillStyle = lensGradient;
    ctx.fill();
    ctx.strokeStyle = hair;
    ctx.lineWidth = 6;
    ctx.stroke();
  }
  ctx.strokeStyle = hair;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-8, 17);
  ctx.quadraticCurveTo(0, 12, 8, 17);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-76, 15);
  ctx.lineTo(-91, 9);
  ctx.moveTo(76, 15);
  ctx.lineTo(91, 9);
  ctx.stroke();

  const glint = ((time * 34) % 210) - 95;
  ctx.save();
  roundedRect(ctx, -76, 0, 152, 49, 20);
  ctx.clip();
  const shine = ctx.createLinearGradient(glint, 0, glint + 32, 0);
  shine.addColorStop(0, "rgba(255,255,255,0)");
  shine.addColorStop(0.5, "rgba(255,255,255,0.48)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = shine;
  ctx.fillRect(glint, -16, 34, 82);
  ctx.restore();
  ctx.restore();

  ctx.fillStyle = "rgba(244,111,139,0.63)";
  ctx.beginPath();
  ctx.ellipse(-59, -8, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(59, -8, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#6e2e2c";
  ctx.beginPath();
  ctx.moveTo(-21, -3);
  ctx.quadraticCurveTo(0, 12, 21, -3);
  ctx.quadraticCurveTo(19, 30, 0, 33);
  ctx.quadraticCurveTo(-19, 30, -21, -3);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.moveTo(-17, 0);
  ctx.quadraticCurveTo(0, 8, 17, 0);
  ctx.lineTo(16, 7);
  ctx.quadraticCurveTo(0, 13, -16, 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ff786d";
  ctx.beginPath();
  ctx.ellipse(5, 25, 12, 6, -0.15, 0, Math.PI * 2);
  ctx.fill();

  if (variant === "code") {
    const laptopGradient = ctx.createLinearGradient(-92, 76, 92, 166);
    laptopGradient.addColorStop(0, "#26314e");
    laptopGradient.addColorStop(1, "#090e20");
    roundedRect(ctx, -94, 74, 188, 96, 14);
    ctx.fillStyle = laptopGradient;
    ctx.fill();
    ctx.strokeStyle = "rgba(206,221,255,0.64)";
    ctx.lineWidth = 4;
    ctx.stroke();

    const lineColors = ["#64d2ff", "#ffd60a", "#30d158", "#bf5af2", "#64d2ff"];
    const widths = [120, 72, 94, 52, 106];
    lineColors.forEach((color, index) => {
      const pulse = 0.72 + Math.sin(time * 2.4 + index * 0.7) * 0.15;
      ctx.fillStyle = color;
      roundedRect(ctx, -62, 94 + index * 12, widths[index] * pulse, 4, 2);
      ctx.fill();
    });
    const baseGradient = ctx.createLinearGradient(-108, 0, 108, 0);
    baseGradient.addColorStop(0, "#69758e");
    baseGradient.addColorStop(0.5, "#e8efff");
    baseGradient.addColorStop(1, "#69758e");
    ctx.fillStyle = baseGradient;
    roundedRect(ctx, -108, 166, 216, 12, 6);
    ctx.fill();
  } else {
    const bubbleY = -139 + Math.sin(time * 1.8) * 5;
    const bubbleGradient = ctx.createLinearGradient(72, bubbleY, 158, bubbleY + 60);
    bubbleGradient.addColorStop(0, "#bf5af2");
    bubbleGradient.addColorStop(1, "#0a84ff");
    roundedRect(ctx, 70, bubbleY, 92, 58, 24);
    ctx.fillStyle = bubbleGradient;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(87, bubbleY + 51);
    ctx.lineTo(76, bubbleY + 69);
    ctx.lineTo(107, bubbleY + 55);
    ctx.closePath();
    ctx.fillStyle = bubbleGradient;
    ctx.fill();
    [99, 116, 133].forEach((x, index) => {
      ctx.globalAlpha = 0.55 + Math.sin(time * 3.8 + index * 0.8) * 0.35;
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(x, bubbleY + 29, 4.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function createParticles() {
  let seed = 1931;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  return Array.from({ length: 48 }, () => ({
    x: random(),
    y: random(),
    radius: 0.7 + random() * 1.8,
    speed: 0.003 + random() * 0.008,
    phase: random() * Math.PI * 2,
  }));
}

function drawFilm(ctx, width, height, time, variant, particles) {
  const dark = document.documentElement.classList.contains("dark");
  ctx.clearRect(0, 0, width, height);

  const background = ctx.createLinearGradient(0, 0, width, height);
  if (dark) {
    background.addColorStop(0, "#0d0e18");
    background.addColorStop(0.55, "#101a2c");
    background.addColorStop(1, variant === "chat" ? "#25142f" : "#151c38");
  } else {
    background.addColorStop(0, "#fbfcff");
    background.addColorStop(0.55, "#edf7ff");
    background.addColorStop(1, variant === "chat" ? "#f4eaff" : "#eaf0ff");
  }
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const glows = [
    { x: 0.78 + Math.sin(time * 0.22) * 0.025, y: 0.28, r: 0.36, color: "100,210,255", alpha: dark ? 0.28 : 0.3 },
    { x: 0.9, y: 0.82 + Math.cos(time * 0.18) * 0.03, r: 0.42, color: "191,90,242", alpha: dark ? 0.24 : 0.2 },
    { x: 0.48, y: 1.06, r: 0.46, color: "10,132,255", alpha: dark ? 0.16 : 0.13 },
  ];
  glows.forEach((glow) => {
    const x = glow.x * width;
    const y = glow.y * height;
    const radius = glow.r * Math.max(width, height);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(${glow.color},${glow.alpha})`);
    gradient.addColorStop(1, `rgba(${glow.color},0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  });

  particles.forEach((particle) => {
    const x = ((particle.x + time * particle.speed) % 1) * width;
    const y = (particle.y + Math.sin(time * 0.45 + particle.phase) * 0.018) * height;
    const pulse = 0.22 + (Math.sin(time * 1.3 + particle.phase) + 1) * 0.2;
    ctx.globalAlpha = dark ? pulse : pulse * 0.55;
    ctx.fillStyle = particle.x > 0.58 ? (particle.y > 0.55 ? "#bf5af2" : "#64d2ff") : "#94a3b8";
    ctx.beginPath();
    ctx.arc(x, y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  const mobile = width < 760;
  const scale = mobile ? Math.min(0.88, width / 430) : Math.min(width / 1160, height / 650) * 0.98;
  const centerX = mobile ? width * 0.5 : width * 0.79;
  const centerY = mobile ? height - 220 : height * 0.52;
  const orbitRadiusX = 190 * scale;
  const orbitRadiusY = 154 * scale;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(-0.16);
  ctx.strokeStyle = dark ? "rgba(164,190,235,0.13)" : "rgba(62,96,150,0.12)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, orbitRadiusX, orbitRadiusY, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.rotate(0.5);
  ctx.beginPath();
  ctx.ellipse(0, 0, orbitRadiusX * 0.86, orbitRadiusY * 1.1, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  const orbitAngle = time * 0.55;
  const dotX = centerX + Math.cos(orbitAngle) * orbitRadiusX;
  const dotY = centerY + Math.sin(orbitAngle) * orbitRadiusY;
  ctx.shadowBlur = 18;
  ctx.shadowColor = "#64d2ff";
  ctx.fillStyle = "#64d2ff";
  ctx.beginPath();
  ctx.arc(dotX, dotY, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  drawBoy(ctx, centerX, centerY, scale, time, variant, dark);

  const sparklePulse = 0.65 + Math.sin(time * 2.2) * 0.25;
  sparkle(ctx, centerX - 168 * scale, centerY - 123 * scale, 8 * scale, "#64d2ff", sparklePulse);
  sparkle(ctx, centerX + 175 * scale, centerY + 92 * scale, 6 * scale, "#bf5af2", 0.8);
  ctx.fillStyle = dark ? "rgba(190,211,245,0.58)" : "rgba(42,72,122,0.52)";
  ctx.font = `${Math.max(11, 14 * scale)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textAlign = "center";
  ctx.fillText("</>", centerX - 205 * scale, centerY - 18 * scale);
  ctx.fillText("{  }", centerX + 207 * scale, centerY - 42 * scale);
}

export default function CodeHeroFilm({ variant = "code" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return undefined;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return undefined;

    const particles = createParticles();
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 1;
    let height = 1;
    let dpr = 1;
    let frameId = 0;
    let active = true;
    let lastFrame = 0;

    const paint = (timestamp = 0) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawFilm(ctx, width, height, motionQuery.matches ? 2.8 : timestamp / 1000, variant, particles);
    };

    const loop = (timestamp) => {
      if (!active || motionQuery.matches) return;
      if (timestamp - lastFrame >= 30) {
        paint(timestamp);
        lastFrame = timestamp;
      }
      frameId = window.requestAnimationFrame(loop);
    };

    const start = () => {
      window.cancelAnimationFrame(frameId);
      if (active && !motionQuery.matches) frameId = window.requestAnimationFrame(loop);
      else paint(performance.now());
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      paint(performance.now());
    };

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting && document.visibilityState === "visible";
      start();
    }, { rootMargin: "120px" });
    const themeObserver = new MutationObserver(() => paint(performance.now()));
    const handleVisibility = () => {
      const rect = canvas.getBoundingClientRect();
      active = document.visibilityState === "visible" && rect.bottom > -120 && rect.top < window.innerHeight + 120;
      start();
    };
    const handleMotion = () => start();

    resizeObserver.observe(canvas);
    intersectionObserver.observe(canvas);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    document.addEventListener("visibilitychange", handleVisibility);
    motionQuery.addEventListener?.("change", handleMotion);
    resize();
    start();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      motionQuery.removeEventListener?.("change", handleMotion);
    };
  }, [variant]);

  return (
    <div className="code-hero-film" aria-hidden="true">
      <style>{FILM_CSS}</style>
      <canvas ref={canvasRef} />
    </div>
  );
}
