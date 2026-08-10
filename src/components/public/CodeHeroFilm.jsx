import { useEffect, useRef } from "react";

const FILM_CSS = `
  .code-hero-film {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
    isolation: isolate;
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
    opacity: 0.18;
    background:
      radial-gradient(circle at 78% 22%, rgba(255,255,255,0.42) 0 1px, transparent 1.5px),
      radial-gradient(circle at 88% 68%, rgba(255,255,255,0.28) 0 1px, transparent 1.5px);
    background-size: 52px 52px, 74px 74px;
    mix-blend-mode: soft-light;
  }
  .code-hero-film::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 2;
    background: radial-gradient(ellipse 64% 78% at 20% 48%, hsl(var(--card) / 0.95) 0%, hsl(var(--card) / 0.84) 49%, hsl(var(--card) / 0.3) 72%, transparent 100%);
  }
  .dark .code-hero-film::after {
    background: radial-gradient(ellipse 64% 78% at 20% 48%, rgba(10,12,22,0.96) 0%, rgba(10,12,22,0.86) 49%, rgba(10,12,22,0.28) 72%, transparent 100%);
  }
  .code-film-content { position: relative; z-index: 3; }
  .code-film-stage-space { min-height: 25rem; }
  @media (max-width: 1023px) {
    .code-hero-film::after {
      background: linear-gradient(180deg, hsl(var(--card) / 0.96) 0%, hsl(var(--card) / 0.88) 49%, hsl(var(--card) / 0.3) 69%, transparent 88%);
    }
    .dark .code-hero-film::after {
      background: linear-gradient(180deg, rgba(10,12,22,0.96) 0%, rgba(10,12,22,0.9) 49%, rgba(10,12,22,0.3) 70%, transparent 89%);
    }
    .code-film-stage-space { min-height: 21rem; }
  }
  @media (max-width: 639px) {
    .code-film-stage-space { min-height: 18.5rem; }
  }
  @media (max-width: 639px) and (max-height: 740px) {
    .code-film-stage-space { min-height: 9rem; }
  }
  @media (max-height: 500px) and (pointer: coarse) {
    .code-film-stage-space { min-height: 0; height: 100%; }
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

function drawCueIcon(ctx, type, x, y, radius, dark, alpha = 1) {
  const ink = dark ? "rgba(224,238,255,0.9)" : "rgba(33,67,112,0.78)";
  const surface = dark ? "rgba(27,43,72,0.72)" : "rgba(255,255,255,0.7)";
  const accent = type === "school" || type === "spark" ? "#bf5af2" : "#64d2ff";

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = surface;
  ctx.strokeStyle = dark ? "rgba(150,194,255,0.22)" : "rgba(54,102,165,0.16)";
  ctx.lineWidth = Math.max(1, radius * 0.07);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = Math.max(1.3, radius * 0.1);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const unit = radius / 12;
  if (type === "browser") {
    roundedRect(ctx, -7 * unit, -5 * unit, 14 * unit, 10 * unit, 2 * unit);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-7 * unit, -1.8 * unit);
    ctx.lineTo(7 * unit, -1.8 * unit);
    ctx.stroke();
    [-4.7, -2.2, 0.3].forEach((dot) => {
      ctx.beginPath();
      ctx.arc(dot * unit, -3.4 * unit, 0.55 * unit, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (type === "phone") {
    roundedRect(ctx, -4.7 * unit, -7.4 * unit, 9.4 * unit, 14.8 * unit, 2.2 * unit);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-1.5 * unit, 4.7 * unit);
    ctx.lineTo(1.5 * unit, 4.7 * unit);
    ctx.stroke();
  } else if (type === "profile") {
    ctx.beginPath();
    ctx.arc(0, -3.2 * unit, 2.7 * unit, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 6.4 * unit, 6.2 * unit, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else if (type === "chat") {
    roundedRect(ctx, -7 * unit, -5.5 * unit, 14 * unit, 10 * unit, 3 * unit);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-4.8 * unit, 4 * unit);
    ctx.lineTo(-6.2 * unit, 7 * unit);
    ctx.lineTo(-1.7 * unit, 4.3 * unit);
    ctx.stroke();
    [-3, 0, 3].forEach((dot) => {
      ctx.beginPath();
      ctx.arc(dot * unit, -0.5 * unit, 0.7 * unit, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (type === "school") {
    ctx.beginPath();
    ctx.moveTo(-8 * unit, -2.5 * unit);
    ctx.lineTo(0, -7 * unit);
    ctx.lineTo(8 * unit, -2.5 * unit);
    ctx.lineTo(0, 2 * unit);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-4.5 * unit, 0);
    ctx.lineTo(-4.5 * unit, 4 * unit);
    ctx.quadraticCurveTo(0, 7 * unit, 4.5 * unit, 4 * unit);
    ctx.lineTo(4.5 * unit, 0);
    ctx.stroke();
  } else if (type === "store") {
    ctx.beginPath();
    ctx.moveTo(-7 * unit, -2 * unit);
    ctx.lineTo(-5.5 * unit, -7 * unit);
    ctx.lineTo(5.5 * unit, -7 * unit);
    ctx.lineTo(7 * unit, -2 * unit);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-6.5 * unit, 0);
    ctx.lineTo(-6.5 * unit, 7 * unit);
    ctx.lineTo(6.5 * unit, 7 * unit);
    ctx.lineTo(6.5 * unit, 0);
    ctx.moveTo(-7 * unit, -1.5 * unit);
    ctx.quadraticCurveTo(-3.5 * unit, 2 * unit, 0, -1.5 * unit);
    ctx.quadraticCurveTo(3.5 * unit, 2 * unit, 7 * unit, -1.5 * unit);
    ctx.stroke();
  } else if (type === "tools") {
    ctx.beginPath();
    ctx.moveTo(-6 * unit, -6 * unit);
    ctx.lineTo(6 * unit, 6 * unit);
    ctx.moveTo(5 * unit, -7 * unit);
    ctx.quadraticCurveTo(8 * unit, -4 * unit, 5 * unit, -1 * unit);
    ctx.lineTo(-5.5 * unit, 7 * unit);
    ctx.stroke();
  } else {
    sparkle(ctx, 0, 0, 7 * unit, accent, 1);
  }
  ctx.restore();
}

function drawArm(ctx, shoulderX, shoulderY, angle, shirt, skin, isThumb = false) {
  ctx.save();
  ctx.translate(shoulderX, shoulderY);
  ctx.rotate(angle);

  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(57,73,126,0.28)";
  ctx.lineWidth = 29;
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

  ctx.strokeStyle = "rgba(154,91,75,0.24)";
  ctx.lineWidth = 24;
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
  ctx.strokeStyle = "rgba(154,91,75,0.24)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 72, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (isThumb) {
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(154,91,75,0.24)";
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
  ctx.strokeStyle = "rgba(66,83,148,0.34)";
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
  ctx.strokeStyle = "rgba(154,91,75,0.22)";
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
  ctx.strokeStyle = "rgba(168,102,78,0.2)";
  ctx.lineWidth = 3;
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
  return Array.from({ length: 16 }, () => ({
    x: random(),
    y: random(),
    radius: 0.65 + random() * 1.35,
    speed: 0.0015 + random() * 0.0035,
    phase: random() * Math.PI * 2,
  }));
}

function cubicPoint(start, controlA, controlB, end, progress) {
  const inverse = 1 - progress;
  return {
    x: inverse ** 3 * start.x + 3 * inverse ** 2 * progress * controlA.x + 3 * inverse * progress ** 2 * controlB.x + progress ** 3 * end.x,
    y: inverse ** 3 * start.y + 3 * inverse ** 2 * progress * controlA.y + 3 * inverse * progress ** 2 * controlB.y + progress ** 3 * end.y,
  };
}

function smoothstep(start, end, value) {
  const range = end - start;
  const progress = Math.min(1, Math.max(0, range === 0 ? 1 : (value - start) / range));
  return progress * progress * (3 - 2 * progress);
}

function drawCloud(ctx, x, y, scale, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x - 25 * scale, y + 4 * scale, 34 * scale, 13 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x, y - 6 * scale, 39 * scale, 21 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 34 * scale, y + 5 * scale, 31 * scale, 13 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStudioWindow(ctx, width, height, time, variant, dark, mobile) {
  const x = mobile ? -width * 0.08 : width * 0.5;
  const y = mobile ? height * 0.5 : height * 0.065;
  const panelWidth = mobile ? width * 1.16 : width * 0.5;
  const panelHeight = mobile ? height * 0.39 : height * 0.6;
  const radius = mobile ? 42 : 68;
  const drift = Math.sin(time * Math.PI / 6) * (mobile ? 3 : 6);

  ctx.save();
  roundedRect(ctx, x, y, panelWidth, panelHeight, radius);
  ctx.clip();

  const sky = ctx.createLinearGradient(x, y, x + panelWidth, y + panelHeight);
  if (dark) {
    sky.addColorStop(0, "#101e37");
    sky.addColorStop(0.52, variant === "chat" ? "#282348" : "#193658");
    sky.addColorStop(1, "#563664");
  } else {
    sky.addColorStop(0, "#dff7ff");
    sky.addColorStop(0.52, variant === "chat" ? "#e7e9ff" : "#cfe8ff");
    sky.addColorStop(1, "#eadcff");
  }
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, panelWidth, panelHeight);

  const sunX = x + panelWidth * (0.7 + Math.sin(time * 0.12) * 0.02);
  const sunY = y + panelHeight * 0.28;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, panelWidth * 0.24);
  sunGlow.addColorStop(0, dark ? "rgba(100,210,255,0.28)" : "rgba(255,255,255,0.82)");
  sunGlow.addColorStop(1, "rgba(100,210,255,0)");
  ctx.fillStyle = sunGlow;
  ctx.fillRect(x, y, panelWidth, panelHeight);

  drawCloud(ctx, x + panelWidth * 0.22 + drift, y + panelHeight * 0.27, mobile ? 0.5 : 0.72, dark ? "#9fbbd8" : "#ffffff", dark ? 0.09 : 0.38);
  drawCloud(ctx, x + panelWidth * 0.74 - drift * 0.65, y + panelHeight * 0.18, mobile ? 0.38 : 0.56, dark ? "#c4b8e7" : "#ffffff", dark ? 0.08 : 0.3);

  const hillA = y + panelHeight * 0.7;
  ctx.fillStyle = dark ? "rgba(35,77,105,0.62)" : "rgba(133,205,207,0.46)";
  ctx.beginPath();
  ctx.moveTo(x, y + panelHeight);
  ctx.lineTo(x, hillA);
  ctx.bezierCurveTo(x + panelWidth * 0.2, hillA - 52, x + panelWidth * 0.36, hillA + 25, x + panelWidth * 0.55, hillA - 18);
  ctx.bezierCurveTo(x + panelWidth * 0.72, hillA - 58, x + panelWidth * 0.84, hillA + 8, x + panelWidth, hillA - 34);
  ctx.lineTo(x + panelWidth, y + panelHeight);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = dark ? "rgba(20,38,66,0.74)" : "rgba(111,157,193,0.34)";
  ctx.beginPath();
  ctx.moveTo(x, y + panelHeight);
  ctx.lineTo(x, y + panelHeight * 0.83);
  ctx.bezierCurveTo(x + panelWidth * 0.25, y + panelHeight * 0.72, x + panelWidth * 0.48, y + panelHeight * 0.92, x + panelWidth * 0.68, y + panelHeight * 0.77);
  ctx.bezierCurveTo(x + panelWidth * 0.82, y + panelHeight * 0.69, x + panelWidth * 0.93, y + panelHeight * 0.8, x + panelWidth, y + panelHeight * 0.73);
  ctx.lineTo(x + panelWidth, y + panelHeight);
  ctx.closePath();
  ctx.fill();

  const skylineY = y + panelHeight * 0.82;
  ctx.fillStyle = dark ? "rgba(8,17,31,0.44)" : "rgba(76,109,151,0.17)";
  for (let index = 0; index < 13; index += 1) {
    const buildingWidth = panelWidth / 14;
    const buildingHeight = panelHeight * (0.04 + ((index * 7) % 5) * 0.012);
    ctx.fillRect(x + index * buildingWidth + drift * 0.25, skylineY - buildingHeight, buildingWidth * 0.62, buildingHeight);
  }
  ctx.restore();

  ctx.save();
  roundedRect(ctx, x, y, panelWidth, panelHeight, radius);
  ctx.strokeStyle = dark ? "rgba(183,211,255,0.13)" : "rgba(97,137,188,0.17)";
  ctx.lineWidth = mobile ? 1.2 : 1.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + panelWidth * 0.5, y + 10);
  ctx.lineTo(x + panelWidth * 0.5, y + panelHeight - 10);
  ctx.strokeStyle = dark ? "rgba(183,211,255,0.07)" : "rgba(97,137,188,0.09)";
  ctx.stroke();
  ctx.restore();
}

function drawJourneyPath(ctx, width, height, time, variant, dark, mobile) {
  const start = mobile ? { x: width * 0.05, y: height * 0.7 } : { x: width * 0.29, y: height * 0.72 };
  const controlA = mobile ? { x: width * 0.3, y: height * 0.58 } : { x: width * 0.5, y: height * 0.7 };
  const controlB = mobile ? { x: width * 0.63, y: height * 0.77 } : { x: width * 0.7, y: height * 0.23 };
  const end = mobile ? { x: width * 1.02, y: height * 0.62 } : { x: width * 1.01, y: height * 0.31 };
  const accent = variant === "chat" ? "191,90,242" : "100,210,255";

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.bezierCurveTo(controlA.x, controlA.y, controlB.x, controlB.y, end.x, end.y);
  ctx.strokeStyle = `rgba(${accent},${dark ? 0.09 : 0.12})`;
  ctx.lineWidth = mobile ? 7 : 11;
  ctx.stroke();
  ctx.setLineDash([4, 12]);
  ctx.lineDashOffset = -time * 13;
  ctx.strokeStyle = `rgba(${accent},${dark ? 0.34 : 0.42})`;
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.setLineDash([]);

  const cueTypes = variant === "chat" ? ["chat", "tools", "store"] : ["profile", "browser", "phone"];
  const cueProgress = mobile ? [0.14, 0.53] : [0.12, 0.49, 0.84];
  cueProgress.forEach((progress, index) => {
    const point = cubicPoint(start, controlA, controlB, end, progress);
    const traveller = (time % 12) / 12;
    const distance = Math.min(Math.abs(traveller - progress), 1 - Math.abs(traveller - progress));
    const focus = 0.58 + smoothstep(0.16, 0, distance) * 0.34;
    drawCueIcon(ctx, cueTypes[index], point.x, point.y, mobile ? 13 : 16, dark, focus);
  });

  const traveller = cubicPoint(start, controlA, controlB, end, (time % 12) / 12);
  ctx.shadowBlur = 17;
  ctx.shadowColor = `rgb(${accent})`;
  ctx.fillStyle = `rgb(${accent})`;
  ctx.beginPath();
  ctx.arc(traveller.x, traveller.y, mobile ? 2.8 : 3.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawProfilePreview(ctx, x, y, width, height, accent, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(x + width * 0.22, y + height * 0.39, height * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.beginPath();
  ctx.arc(x + width * 0.22, y + height * 0.35, height * 0.048, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + width * 0.22, y + height * 0.48, height * 0.09, Math.PI * 1.08, Math.PI * 1.92);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.68)";
  roundedRect(ctx, x + width * 0.4, y + height * 0.27, width * 0.38, height * 0.055, 4);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  roundedRect(ctx, x + width * 0.4, y + height * 0.4, width * 0.26, height * 0.04, 3);
  ctx.fill();
  for (let index = 0; index < 3; index += 1) {
    roundedRect(ctx, x + width * (0.12 + index * 0.28), y + height * 0.68, width * 0.22, height * 0.13, 7);
    ctx.fill();
  }
  ctx.restore();
}

function drawCafePreview(ctx, x, y, width, height, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const warm = ctx.createLinearGradient(x, y, x + width, y + height);
  warm.addColorStop(0, "#ffb86b");
  warm.addColorStop(1, "#ff7f72");
  ctx.fillStyle = warm;
  roundedRect(ctx, x + width * 0.12, y + height * 0.24, width * 0.3, height * 0.38, height * 0.09);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = Math.max(1.2, height * 0.018);
  ctx.beginPath();
  ctx.arc(x + width * 0.43, y + height * 0.41, height * 0.1, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  roundedRect(ctx, x + width * 0.54, y + height * 0.25, width * 0.29, height * 0.06, 4);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.32)";
  for (let index = 0; index < 3; index += 1) {
    roundedRect(ctx, x + width * 0.54, y + height * (0.4 + index * 0.13), width * (0.2 + index * 0.035), height * 0.038, 3);
    ctx.fill();
  }
  ctx.restore();
}

function drawJoyPreview(ctx, x, y, width, height, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const wallet = ctx.createLinearGradient(x, y, x + width, y + height);
  wallet.addColorStop(0, "#56c7ff");
  wallet.addColorStop(1, "#6f66e8");
  ctx.fillStyle = wallet;
  roundedRect(ctx, x + width * 0.12, y + height * 0.21, width * 0.42, height * 0.48, height * 0.11);
  ctx.fill();
  sparkle(ctx, x + width * 0.33, y + height * 0.44, height * 0.11, "#ffffff", alpha * 0.9);
  ctx.fillStyle = "rgba(255,255,255,0.68)";
  roundedRect(ctx, x + width * 0.62, y + height * 0.24, width * 0.24, height * 0.06, 4);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.32)";
  roundedRect(ctx, x + width * 0.62, y + height * 0.39, width * 0.18, height * 0.04, 3);
  ctx.fill();
  roundedRect(ctx, x + width * 0.62, y + height * 0.55, width * 0.27, height * 0.11, height * 0.05);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.68)";
  ctx.lineWidth = Math.max(1.2, height * 0.018);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + width * 0.65, y + height * 0.61);
  ctx.lineTo(x + width * 0.78, y + height * 0.61);
  ctx.moveTo(x + width * 0.74, y + height * 0.57);
  ctx.lineTo(x + width * 0.78, y + height * 0.61);
  ctx.lineTo(x + width * 0.74, y + height * 0.65);
  ctx.stroke();
  ctx.restore();
}

function drawArcadePreview(ctx, x, y, width, height, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const field = ctx.createLinearGradient(x, y, x + width, y + height);
  field.addColorStop(0, "rgba(10,132,255,0.76)");
  field.addColorStop(1, "rgba(191,90,242,0.72)");
  ctx.fillStyle = field;
  roundedRect(ctx, x + width * 0.08, y + height * 0.18, width * 0.84, height * 0.56, height * 0.12);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.74)";
  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 5; column += 1) {
      roundedRect(ctx, x + width * (0.16 + column * 0.14), y + height * (0.27 + row * 0.11), width * 0.1, height * 0.055, 3);
      ctx.fill();
    }
  }
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.arc(x + width * 0.5, y + height * 0.59, height * 0.035, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.68)";
  roundedRect(ctx, x + width * 0.18, y + height * 0.56, width * 0.025, height * 0.12, 3);
  ctx.fill();
  roundedRect(ctx, x + width * 0.795, y + height * 0.56, width * 0.025, height * 0.12, 3);
  ctx.fill();
  ctx.restore();
}

function drawProductPreview(ctx, x, y, width, height, accent, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = accent;
  for (let index = 0; index < 3; index += 1) {
    const cardWidth = width * 0.23;
    const cardX = x + width * (0.1 + index * 0.29);
    roundedRect(ctx, cardX, y + height * 0.22, cardWidth, height * 0.5, 9);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.68)";
    ctx.beginPath();
    ctx.arc(cardX + cardWidth * 0.5, y + height * 0.39, height * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accent;
  }
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  roundedRect(ctx, x + width * 0.32, y + height * 0.81, width * 0.36, height * 0.055, 4);
  ctx.fill();
  ctx.restore();
}

function drawPreviewContent(ctx, x, y, width, height, scene, variant, dark, alpha) {
  const palette = variant === "chat"
    ? ["rgba(191,90,242,0.72)", "rgba(255,152,112,0.78)", "rgba(10,132,255,0.68)"]
    : ["rgba(10,132,255,0.72)", "rgba(100,210,255,0.7)", "rgba(191,90,242,0.68)"];
  if (scene === 0) drawProfilePreview(ctx, x, y, width, height, palette[0], alpha);
  else if (scene === 1 && variant === "chat") drawCafePreview(ctx, x, y, width, height, alpha);
  else if (scene === 1) drawJoyPreview(ctx, x, y, width, height, alpha);
  else if (variant === "code") drawArcadePreview(ctx, x, y, width, height, alpha);
  else drawProductPreview(ctx, x, y, width, height, palette[scene], alpha * (dark ? 0.92 : 1));
}

function drawBrowserPreview(ctx, width, height, time, variant, dark, mobile) {
  const browserWidth = mobile ? width * 0.5 : Math.min(width * 0.285, 340);
  const browserHeight = browserWidth * 0.59;
  const x = mobile ? width * 0.47 : width * 0.665;
  const y = mobile ? height * 0.555 : height * 0.14;
  const floatY = Math.sin(time * Math.PI / 5.8) * (mobile ? 2 : 5);
  const panelFill = dark ? "rgba(12,20,39,0.62)" : "rgba(255,255,255,0.64)";

  ctx.save();
  ctx.translate(x, y + floatY);
  ctx.rotate(-0.025 + Math.sin(time * 0.18) * 0.006);
  ctx.shadowBlur = mobile ? 16 : 28;
  ctx.shadowColor = dark ? "rgba(0,0,0,0.28)" : "rgba(69,101,159,0.16)";
  roundedRect(ctx, 0, 0, browserWidth, browserHeight, mobile ? 14 : 20);
  ctx.fillStyle = panelFill;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = dark ? "rgba(187,214,255,0.19)" : "rgba(74,116,173,0.2)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = dark ? "rgba(223,234,255,0.32)" : "rgba(49,78,122,0.28)";
  [16, 27, 38].forEach((dot) => {
    ctx.beginPath();
    ctx.arc(dot * (mobile ? 0.75 : 1), browserHeight * 0.105, mobile ? 1.7 : 2.2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.strokeStyle = dark ? "rgba(187,214,255,0.1)" : "rgba(74,116,173,0.12)";
  ctx.beginPath();
  ctx.moveTo(0, browserHeight * 0.2);
  ctx.lineTo(browserWidth, browserHeight * 0.2);
  ctx.stroke();

  const sceneProgress = (time % 12) / 4;
  const scene = Math.floor(sceneProgress) % 3;
  const local = sceneProgress - Math.floor(sceneProgress);
  const blend = smoothstep(0.72, 1, local);
  const contentX = browserWidth * 0.04;
  const contentY = browserHeight * 0.2;
  drawPreviewContent(ctx, contentX, contentY, browserWidth * 0.92, browserHeight * 0.76, scene, variant, dark, 1 - blend);
  drawPreviewContent(ctx, contentX, contentY, browserWidth * 0.92, browserHeight * 0.76, (scene + 1) % 3, variant, dark, blend);
  ctx.restore();
}

function drawPhonePreview(ctx, width, height, time, variant, dark, mobile) {
  if (mobile && width < 420) return;
  const phoneWidth = mobile ? 46 : Math.min(72, width * 0.058);
  const phoneHeight = phoneWidth * 1.85;
  const x = mobile ? width * 0.09 : width * 0.607;
  const y = mobile ? height * 0.68 : height * 0.36;
  const floatY = Math.sin(time * Math.PI / 5.8 + 1.2) * 4;
  ctx.save();
  ctx.translate(x, y + floatY);
  ctx.rotate(0.045);
  roundedRect(ctx, 0, 0, phoneWidth, phoneHeight, phoneWidth * 0.22);
  ctx.fillStyle = dark ? "rgba(9,17,35,0.7)" : "rgba(255,255,255,0.7)";
  ctx.fill();
  ctx.strokeStyle = dark ? "rgba(187,214,255,0.2)" : "rgba(74,116,173,0.22)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = variant === "chat" ? "rgba(191,90,242,0.64)" : "rgba(10,132,255,0.65)";
  roundedRect(ctx, phoneWidth * 0.13, phoneHeight * 0.14, phoneWidth * 0.74, phoneHeight * 0.27, phoneWidth * 0.12);
  ctx.fill();
  ctx.fillStyle = dark ? "rgba(223,234,255,0.3)" : "rgba(49,78,122,0.22)";
  for (let index = 0; index < 3; index += 1) {
    roundedRect(ctx, phoneWidth * 0.15, phoneHeight * (0.51 + index * 0.11), phoneWidth * (0.66 - index * 0.08), phoneHeight * 0.035, 3);
    ctx.fill();
  }
  ctx.restore();
}

function drawDeskScene(ctx, width, height, time, variant, dark, mobile) {
  const deskY = mobile ? height * 0.885 : height * 0.79;
  const top = ctx.createLinearGradient(0, deskY, 0, height);
  if (dark) {
    top.addColorStop(0, "rgba(34,45,70,0.86)");
    top.addColorStop(1, "rgba(9,14,27,0.96)");
  } else {
    top.addColorStop(0, "rgba(225,234,249,0.92)");
    top.addColorStop(1, "rgba(185,200,229,0.72)");
  }
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.moveTo(0, deskY + 13);
  ctx.lineTo(width, deskY - 5);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = dark ? "rgba(197,217,255,0.18)" : "rgba(76,108,156,0.18)";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(0, deskY + 13);
  ctx.lineTo(width, deskY - 5);
  ctx.stroke();

  if (!mobile) {
    const lampX = width * 0.55;
    const lampGlow = ctx.createRadialGradient(lampX, deskY - 90, 0, lampX, deskY - 90, 130);
    lampGlow.addColorStop(0, variant === "chat" ? "rgba(191,90,242,0.12)" : "rgba(100,210,255,0.13)");
    lampGlow.addColorStop(1, "rgba(100,210,255,0)");
    ctx.fillStyle = lampGlow;
    ctx.fillRect(lampX - 130, deskY - 220, 260, 230);
    ctx.strokeStyle = dark ? "rgba(181,205,244,0.36)" : "rgba(77,107,149,0.38)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(lampX - 22, deskY + 1);
    ctx.quadraticCurveTo(lampX - 12, deskY - 115, lampX + 64, deskY - 128);
    ctx.stroke();
    ctx.fillStyle = variant === "chat" ? "#bf5af2" : "#64d2ff";
    ctx.beginPath();
    ctx.moveTo(lampX + 42, deskY - 132);
    ctx.quadraticCurveTo(lampX + 83, deskY - 150, lampX + 101, deskY - 112);
    ctx.lineTo(lampX + 55, deskY - 99);
    ctx.closePath();
    ctx.globalAlpha = 0.66;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.save();
  ctx.translate(mobile ? width * 0.12 : width * 0.59, deskY + 11);
  ctx.rotate(-0.08 + Math.sin(time * 0.14) * 0.006);
  ctx.fillStyle = dark ? "rgba(224,234,255,0.54)" : "rgba(255,255,255,0.78)";
  roundedRect(ctx, -42, -15, 84, 29, 6);
  ctx.fill();
  ctx.strokeStyle = dark ? "rgba(100,210,255,0.46)" : "rgba(10,132,255,0.36)";
  ctx.lineWidth = 1.3;
  for (let index = 0; index < 3; index += 1) {
    ctx.beginPath();
    ctx.moveTo(-27, -6 + index * 7);
    ctx.lineTo(-4 + index * 9, -6 + index * 7);
    ctx.stroke();
  }
  ctx.restore();

  if (!mobile) {
    const cupX = width * 0.944;
    ctx.fillStyle = variant === "chat" ? "rgba(255,181,116,0.74)" : "rgba(100,210,255,0.64)";
    roundedRect(ctx, cupX - 18, deskY - 34, 36, 34, 10);
    ctx.fill();
    ctx.strokeStyle = dark ? "rgba(230,238,255,0.42)" : "rgba(70,99,144,0.28)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cupX + 18, deskY - 18, 11, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.strokeStyle = dark ? "rgba(230,238,255,0.2)" : "rgba(70,99,144,0.18)";
    ctx.lineWidth = 1.4;
    for (let index = 0; index < 2; index += 1) {
      const steam = Math.sin(time * 0.8 + index) * 3;
      ctx.beginPath();
      ctx.moveTo(cupX - 6 + index * 12, deskY - 42);
      ctx.quadraticCurveTo(cupX - 11 + index * 12 + steam, deskY - 56, cupX - 4 + index * 12, deskY - 67);
      ctx.stroke();
    }
  }
}

function drawFilm(ctx, width, height, time, variant, particles) {
  const dark = document.documentElement.classList.contains("dark");
  const mobile = width < 1024;
  const cycle = (time % 12) / 12;
  const cameraX = Math.sin(cycle * Math.PI * 2) * (mobile ? 1.5 : 4);
  ctx.clearRect(0, 0, width, height);

  const background = ctx.createLinearGradient(0, 0, width, height);
  if (dark) {
    background.addColorStop(0, "#090c16");
    background.addColorStop(0.5, "#111a2e");
    background.addColorStop(1, variant === "chat" ? "#281830" : "#16243d");
  } else {
    background.addColorStop(0, "#f8fcff");
    background.addColorStop(0.5, "#e9f5ff");
    background.addColorStop(1, variant === "chat" ? "#eee6ff" : "#e6edff");
  }
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const ambientX = width * (0.75 + Math.sin(time * 0.12) * 0.025);
  const ambientY = height * (0.36 + Math.cos(time * 0.1) * 0.02);
  const ambient = ctx.createRadialGradient(ambientX, ambientY, 0, ambientX, ambientY, Math.max(width, height) * 0.55);
  ambient.addColorStop(0, variant === "chat" ? (dark ? "rgba(191,90,242,0.19)" : "rgba(191,90,242,0.13)") : (dark ? "rgba(100,210,255,0.2)" : "rgba(100,210,255,0.16)"));
  ambient.addColorStop(1, "rgba(10,132,255,0)");
  ctx.fillStyle = ambient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(cameraX, 0);
  drawStudioWindow(ctx, width, height, time, variant, dark, mobile);
  drawJourneyPath(ctx, width, height, time, variant, dark, mobile);
  drawBrowserPreview(ctx, width, height, time, variant, dark, mobile);
  drawPhonePreview(ctx, width, height, time, variant, dark, mobile);
  drawDeskScene(ctx, width, height, time, variant, dark, mobile);

  const serviceMobile = variant === "chat" && width < 1024;
  const serviceScaleCap = width < 640 ? 0.54 : 0.62;
  const scale = mobile
    ? Math.min(serviceMobile ? serviceScaleCap : 0.68, width / 515, height / 930)
    : Math.min(width / 1160, height / 650) * 0.72;
  const centerX = mobile ? width * (serviceMobile ? 0.72 : 0.69) : width * 0.81;
  const centerY = mobile ? height * (serviceMobile ? 0.76 : 0.735) : height * 0.555;
  drawBoy(ctx, centerX, centerY, scale, time, variant, dark);
  ctx.restore();

  const particleLimit = mobile ? 7 : 12;
  particles.slice(0, particleLimit).forEach((particle) => {
    const x = ((particle.x + time * particle.speed) % 1) * width;
    const y = (particle.y + Math.sin(time * 0.3 + particle.phase) * 0.01) * height;
    const pulse = 0.12 + (Math.sin(time * 0.75 + particle.phase) + 1) * 0.1;
    ctx.globalAlpha = dark ? pulse : pulse * 0.68;
    ctx.fillStyle = particle.x > 0.56 ? (particle.y > 0.55 ? "#bf5af2" : "#64d2ff") : "#94a3b8";
    ctx.beginPath();
    ctx.arc(x, y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  const completion = smoothstep(0.64, 0.75, cycle) * (1 - smoothstep(0.87, 0.98, cycle));
  if (completion > 0.02) {
    const sparkleX = mobile ? width * 0.9 : width * 0.945;
    const sparkleY = mobile ? height * 0.61 : height * 0.27;
    sparkle(ctx, sparkleX, sparkleY, mobile ? 6 : 9, variant === "chat" ? "#bf5af2" : "#64d2ff", completion * 0.8);
  }
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
      drawFilm(ctx, width, height, motionQuery.matches ? 8.6 : timestamp / 1000, variant, particles);
    };

    const loop = (timestamp) => {
      if (!active || motionQuery.matches) return;
      if (timestamp - lastFrame >= 36) {
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
      dpr = Math.min(window.devicePixelRatio || 1, width < 1024 ? 1.5 : 1.75);
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
