import { useEffect, useRef, useState, useCallback } from "react";
import { useArcadeSound } from "../../../hooks/useArcadeSound";
import { hapticMove, hapticMerge, hapticLose } from "../../../utils/haptics";
import { readGamePalette, shade, withAlpha } from "./arcadePalette";
import { levelFor, ramp, createCombo, pushPopup, updatePopups, drawPopups } from "./arcadeProgression";
import ArcadeHud from "./ArcadeHud";

const GAME_ID = "flappy";
const BASE_W = 340;
const BASE_H = 480;
const GROUND = 60;

const SLOW = "#22d3ee";
const SHIELD = "#ffc73a";
const MAGNET = "#ff6bcb";
const MINI = "#a3ff73";
const LIGHTNING = "#b48dff";
const STAR = "#ffd700";
const GHOST = "#8be9ff";

const POWERUP_DEFS = [
  { kind: "slow", color: SLOW, label: "SLO", duration: 180, chance: 0.13 },
  { kind: "shield", color: SHIELD, label: "SHD", duration: 0, chance: 0.13 },
  { kind: "magnet", color: MAGNET, label: "MAG", duration: 210, chance: 0.10 },
  { kind: "mini", color: MINI, label: "MIN", duration: 240, chance: 0.10 },
  { kind: "lightning", color: LIGHTNING, label: "ELC", duration: 0, chance: 0.10 },
  { kind: "star", color: STAR, label: "x3", duration: 180, chance: 0.10 },
  { kind: "ghost", color: GHOST, label: "GHO", duration: 150, chance: 0.08 },
];

// Gap theo tỷ lệ % chiều cao màn — cân xứng web vs điện thoại.
// Gravity rất nhẹ, tăng dần — chim lơ lửng tự nhiên.
const tuning = (level) => ({
  gapRatio: ramp(GAME_ID, level, 0.38, 0.28),
  speed: ramp(GAME_ID, level, 1.2, 1.7),
  interval: ramp(GAME_ID, level, 160, 110),
  drift: level >= 3 ? ramp(GAME_ID, level, 0, 30) : 0,
  pipeWidth: 42,
  gravity: ramp(GAME_ID, level, 0.10, 0.20),
  maxFall: ramp(GAME_ID, level, 3.0, 5.0),
});

function requestFullscreen(el) {
  try {
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  } catch {}
}

function exitFullscreen() {
  try {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      document.exitFullscreen?.() || document.webkitExitFullscreen?.();
    }
  } catch {}
}

export default function GameFlappyCyber({ paused = false, onGameOver }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [hud, setHud] = useState({ score: 0, pipes: 0, combo: 0, mult: 1, notice: "" });
  const { playBeep, playMove, playLose } = useArcadeSound();

  const state = useRef({
    bird: { x: 0, y: 0, radius: 14, baseRadius: 14, vy: 0, gravity: 0.10, jump: -4.0 },
    pipes: [],
    orbs: [],
    particles: [],
    popups: [],
    score: 0,
    passed: 0,
    level: 1,
    combo: createCombo({ windowMs: 2800, step: 0.25, max: 2.5 }),
    slowMoTimer: 0,
    magnetTimer: 0,
    miniTimer: 0,
    starTimer: 0,
    ghostTimer: 0,
    shield: false,
    invuln: 0,
    isGameOver: false,
    phase: "idle", // "idle" | "playing" | "dead"
    idleBob: 0,
    shakeX: 0, shakeY: 0, shakeMag: 0,
    groundOffset: 0,
    bgOffset: 0,
    midOffset: 0,
    fgOffset: 0,
    wingPhase: 0,
    flashAlpha: 0,
    W: BASE_W,
    H: BASE_H,
    scale: 1,
    bossActive: false,
    bossTimer: 0,
    starField: [],
    nebulae: [],
    buildings: [],
    nearBuildings: [],
    initialized: false,
  });

  const syncHud = useCallback((notice) => {
    const s = state.current;
    setHud((prev) => ({
      score: s.score,
      pipes: s.passed,
      combo: s.combo.chain + (s.combo.chain > 0 ? 1 : 0),
      mult: s.combo.mult,
      notice: notice !== undefined ? notice : prev.notice,
    }));
  }, []);

  const flash = useCallback((text) => {
    syncHud(text);
    setTimeout(() => setHud((h) => (h.notice === text ? { ...h, notice: "" } : h)), 1800);
  }, [syncHud]);

  const handleFlap = useCallback(() => {
    const s = state.current;
    if (s.isGameOver) return;

    // First tap: transition from idle to playing
    if (s.phase === "idle") {
      s.phase = "playing";
      s.bird.vy = s.bird.jump;
      playBeep();
      hapticMove();
      // Request fullscreen for immersive experience
      if (wrapRef.current) requestFullscreen(wrapRef.current);
      return;
    }

    s.bird.vy = s.bird.jump;
    playBeep();
    hapticMove();
  }, [playBeep]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || paused) return;
    const ctx = canvas.getContext("2d");

    const s = state.current;

    const resize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const aspect = BASE_H / BASE_W;
      let W, H;
      if (vw / vh > aspect) {
        H = vh;
        W = Math.round(vh / aspect);
      } else {
        W = vw;
        H = Math.round(vw * aspect);
      }
      const scale = W / BASE_W;
      s.W = W;
      s.H = H;
      s.scale = scale;
      canvas.width = W;
      canvas.height = H;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      s.bird.x = 80 * scale;
      s.bird.y = 200 * scale;
      s.bird.radius = s.bird.baseRadius * scale;
      if (!s.initialized) {
        s.starField = Array.from({ length: 50 }, () => ({
          x: Math.random() * W,
          y: Math.random() * H * 0.75,
          size: (0.5 + Math.random() * 2) * scale,
          speed: (0.15 + Math.random() * 0.6) * scale,
          alpha: 0.3 + Math.random() * 0.7,
          twinkle: Math.random() * Math.PI * 2,
        }));
        s.nebulae = Array.from({ length: 4 }, (_, i) => ({
          x: Math.random() * W,
          y: Math.random() * H * 0.5,
          r: (60 + Math.random() * 80) * scale,
          hue: 180 + i * 40,
          alpha: 0.06 + Math.random() * 0.04,
          speed: (0.08 + Math.random() * 0.12) * scale,
        }));
        s.buildings = Array.from({ length: 14 }, (_, i) => ({
          x: i * (W / 10),
          w: (14 + Math.random() * 16) * scale,
          h: (30 + Math.random() * 55) * scale,
          hue: 190 + Math.random() * 40,
        }));
        s.nearBuildings = Array.from({ length: 10 }, (_, i) => ({
          x: i * (W / 7),
          w: (20 + Math.random() * 22) * scale,
          h: (20 + Math.random() * 35) * scale,
          windows: Math.floor(2 + Math.random() * 4),
          hue: 200 + Math.random() * 30,
        }));
        s.initialized = true;
      }
    };
    resize();

    let stopped = false;
    let rafId;
    let spawnCounter = 0;

    const pal = readGamePalette(canvas);
    const pipeFill = shade(pal.accent, pal.isLight ? 0.42 : -0.05);
    const pipeEdge = shade(pal.accent, pal.isLight ? -0.25 : 0.45);
    const birdBody = pal.isLight ? "#ffd45c" : "#ffffff";
    const glow = (color, blur) => {
      ctx.shadowColor = pal.isLight ? "transparent" : color;
      ctx.shadowBlur = pal.isLight ? 0 : blur * s.scale;
    };

    const spawnPipe = (cfg) => {
      const gnd = GROUND * s.scale;
      const gap = cfg.gapRatio * s.H;
      const margin = 50 * s.scale;
      const gapY = margin + gap / 2 + Math.random() * (s.H - gnd - margin * 2 - gap);
      s.pipes.push({
        x: s.W + 30 * s.scale,
        width: cfg.pipeWidth * s.scale,
        gapY,
        baseY: gapY,
        gap,
        drift: cfg.drift,
        phase: Math.random() * Math.PI * 2,
        passed: false,
        glow: 0,
        neonHue: Math.random() * 60 + 180,
        neonPhase: Math.random() * Math.PI * 2,
      });
      if (Math.random() < 0.38) {
        const roll = Math.random();
        let cumul = 0;
        let chosen = POWERUP_DEFS[0];
        for (const def of POWERUP_DEFS) {
          cumul += def.chance;
          if (roll < cumul / 0.38) { chosen = def; break; }
        }
        if (chosen.kind === "shield" && s.shield) chosen = POWERUP_DEFS[0];
        if (chosen.kind === "ghost" && s.ghostTimer > 0) chosen = POWERUP_DEFS[0];
        s.orbs.push({
          x: s.W + 50 * s.scale,
          y: gapY,
          radius: 10 * s.scale,
          pulse: 0,
          kind: chosen.kind,
          color: chosen.color,
          label: chosen.label,
        });
      }
    };

    const render = () => {
      if (stopped) return;
      if (s.isGameOver) { stopped = true; return; }

      const cfg = tuning(s.level);
      const isIdle = s.phase === "idle";
      const speedMult = isIdle ? 0.3 : s.slowMoTimer > 0 ? 0.5 : 1.0;

      if (!isIdle) {
        if (s.slowMoTimer > 0) s.slowMoTimer -= 1;
        if (s.magnetTimer > 0) s.magnetTimer -= 1;
        if (s.miniTimer > 0) {
          s.miniTimer -= 1;
          s.bird.radius = s.bird.baseRadius * s.scale * 0.55;
        } else {
          s.bird.radius = s.bird.baseRadius * s.scale;
        }
        if (s.starTimer > 0) s.starTimer -= 1;
        if (s.ghostTimer > 0) s.ghostTimer -= 1;
        if (s.invuln > 0) s.invuln -= 1;
        s.combo.tick();
      }

      if (s.shakeMag > 0.2) {
        s.shakeX = (Math.random() - 0.5) * s.shakeMag * s.scale;
        s.shakeY = (Math.random() - 0.5) * s.shakeMag * s.scale;
        s.shakeMag *= 0.85;
      } else { s.shakeX = 0; s.shakeY = 0; s.shakeMag = 0; }
      if (s.flashAlpha > 0.01) s.flashAlpha *= 0.92;

      s.groundOffset = (s.groundOffset + cfg.speed * speedMult * s.scale) % (40 * s.scale);
      s.bgOffset = (s.bgOffset + 0.3 * speedMult * s.scale) % s.W;
      s.midOffset = (s.midOffset + 0.8 * speedMult * s.scale) % s.W;
      s.fgOffset = (s.fgOffset + 1.5 * speedMult * s.scale) % s.W;
      s.wingPhase = (s.wingPhase + 0.28) % (Math.PI * 2);

      ctx.save();
      ctx.translate(s.shakeX, s.shakeY);

      const gnd = GROUND * s.scale;

      // ── 3D Parallax Background ──
      ctx.fillStyle = pal.bg;
      ctx.fillRect(-5, -5, s.W + 10, s.H + 10);

      // Nebulae layer
      s.nebulae.forEach((n) => {
        const nx = ((n.x - s.bgOffset * 0.3 + s.W * 2) % (s.W * 2)) - n.r;
        ctx.globalAlpha = n.alpha * (s.slowMoTimer > 0 ? 0.6 : 1);
        const ng = ctx.createRadialGradient(nx, n.y, 0, nx, n.y, n.r);
        ng.addColorStop(0, `hsla(${n.hue}, 70%, 60%, 0.25)`);
        ng.addColorStop(0.5, `hsla(${n.hue}, 60%, 40%, 0.08)`);
        ng.addColorStop(1, "transparent");
        ctx.fillStyle = ng;
        ctx.fillRect(nx - n.r, n.y - n.r, n.r * 2, n.r * 2);
      });
      ctx.globalAlpha = 1;

      // Stars with twinkle
      s.starField.forEach((star) => {
        star.x -= star.speed * speedMult;
        star.twinkle += 0.04;
        if (star.x < -5) { star.x = s.W + 5; star.y = Math.random() * s.H * 0.75; }
        const twinkleAlpha = star.alpha * (0.6 + Math.sin(star.twinkle) * 0.4) * (s.slowMoTimer > 0 ? 0.5 : 1);
        ctx.globalAlpha = twinkleAlpha;
        ctx.fillStyle = s.slowMoTimer > 0 ? "#8be9ff" : "#ffffff";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Far buildings
      ctx.save();
      s.buildings.forEach((b) => {
        const bx = ((b.x - s.bgOffset + s.W * 2) % (s.W * 2)) - b.w;
        const by = s.H - gnd;
        const baseGrad = ctx.createLinearGradient(bx, by - b.h, bx, by);
        baseGrad.addColorStop(0, `hsla(${b.hue}, 40%, 18%, 0.6)`);
        baseGrad.addColorStop(1, `hsla(${b.hue}, 30%, 8%, 0.8)`);
        ctx.fillStyle = baseGrad;
        ctx.fillRect(bx, by - b.h, b.w, b.h);
        for (let wy = by - b.h + 3 * s.scale; wy < by - 2 * s.scale; wy += 6 * s.scale) {
          for (let wx = bx + 2 * s.scale; wx < bx + b.w - 2 * s.scale; wx += 5 * s.scale) {
            if (Math.sin(wx * 13.7 + wy * 7.3) > 0.1) {
              ctx.fillStyle = `hsla(${b.hue + 20}, 60%, 55%, ${0.15 + Math.sin(wx + wy) * 0.1})`;
              ctx.fillRect(wx, wy, 2 * s.scale, 3 * s.scale);
            }
          }
        }
      });
      ctx.restore();

      // Near buildings
      ctx.save();
      s.nearBuildings.forEach((b) => {
        const bx = ((b.x - s.midOffset + s.W * 2) % (s.W * 2)) - b.w;
        const by = s.H - gnd;
        const bGrad = ctx.createLinearGradient(bx, by - b.h, bx, by);
        bGrad.addColorStop(0, `hsla(${b.hue}, 50%, 22%, 0.7)`);
        bGrad.addColorStop(1, `hsla(${b.hue}, 40%, 10%, 0.9)`);
        ctx.fillStyle = bGrad;
        ctx.fillRect(bx, by - b.h, b.w, b.h);
        if (Math.sin(b.x * 3.7) > 0.3) {
          ctx.fillStyle = `hsla(${b.hue + 60}, 80%, 60%, 0.3)`;
          ctx.fillRect(bx + 2 * s.scale, by - b.h + 2 * s.scale, b.w - 4 * s.scale, 3 * s.scale);
        }
        for (let wy = by - b.h + 5 * s.scale; wy < by - 3 * s.scale; wy += 7 * s.scale) {
          for (let wx = bx + 3 * s.scale; wx < bx + b.w - 3 * s.scale; wx += 6 * s.scale) {
            const lit = Math.sin(wx * 11.3 + wy * 5.7) > 0;
            ctx.fillStyle = lit ? `hsla(${b.hue + 40}, 70%, 65%, 0.25)` : `hsla(${b.hue}, 30%, 15%, 0.4)`;
            ctx.fillRect(wx, wy, 3 * s.scale, 3 * s.scale);
          }
        }
      });
      ctx.restore();

      // ── Ground ──
      const groundY = s.H - gnd;
      const gndGrad = ctx.createLinearGradient(0, groundY, 0, s.H);
      gndGrad.addColorStop(0, withAlpha(pal.accent, 0.2));
      gndGrad.addColorStop(1, withAlpha(pal.accent, 0.08));
      ctx.fillStyle = gndGrad;
      ctx.fillRect(0, groundY, s.W, gnd);

      ctx.strokeStyle = withAlpha(pal.accent, 0.5);
      ctx.lineWidth = 2 * s.scale;
      ctx.shadowColor = pal.accent;
      ctx.shadowBlur = 8 * s.scale;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(s.W, groundY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = withAlpha(pal.accent, 0.06);
      ctx.lineWidth = 1;
      for (let gx = -s.groundOffset; gx < s.W; gx += 40 * s.scale) {
        ctx.beginPath();
        ctx.moveTo(gx, groundY);
        ctx.lineTo(gx - 18 * s.scale, s.H);
        ctx.stroke();
      }

      // ── Bird physics / idle bob ──
      if (isIdle) {
        s.idleBob += 0.04;
        s.bird.y = 200 * s.scale + Math.sin(s.idleBob) * 12 * s.scale;
        // Gentle trail in idle
        if (Math.random() < 0.3) {
          s.particles.push({
            x: s.bird.x - 14 * s.scale,
            y: s.bird.y + (Math.random() - 0.5) * 6 * s.scale,
            vx: (-1 - Math.random() * 1.5) * s.scale,
            vy: (Math.random() - 0.5) * 0.8 * s.scale,
            life: 1,
            size: (1.5 + Math.random() * 2) * s.scale,
            color: pal.accent,
            type: "trail",
          });
        }
      } else {
        s.bird.vy = Math.min(s.bird.vy + cfg.gravity * speedMult, cfg.maxFall);
        s.bird.y += s.bird.vy * speedMult;
        // Playing trail
        const trailColor = s.starTimer > 0 ? STAR : s.ghostTimer > 0 ? GHOST : s.slowMoTimer > 0 ? SLOW : s.shield ? SHIELD : pal.accent;
        const trailCount = s.starTimer > 0 ? 4 : s.slowMoTimer > 0 ? 3 : 2;
        for (let i = 0; i < trailCount; i++) {
          s.particles.push({
            x: s.bird.x - 14 * s.scale,
            y: s.bird.y + (Math.random() - 0.5) * 8 * s.scale,
            vx: (-1.5 - Math.random() * 2.5) * s.scale,
            vy: (Math.random() - 0.5) * 1.2 * s.scale,
            life: 1,
            size: (2 + Math.random() * 3) * s.scale,
            color: trailColor,
            type: "trail",
          });
        }
      }

      // ── Pipes (only when playing) ──
      if (!isIdle) {
        spawnCounter += 1 * speedMult;
        const isBossInterval = s.level >= 5 && s.score > 0 && s.score % (s.level * 12) < 6;
        if (isBossInterval && !s.bossActive) {
          s.bossActive = true;
          s.bossTimer = 360;
        }
        const currentInterval = s.bossActive ? cfg.interval * 0.6 : cfg.interval;
        if (spawnCounter > currentInterval) {
          spawnCounter = 0;
          spawnPipe(cfg);
        }
        if (s.bossTimer > 0) s.bossTimer -= 1;
        if (s.bossTimer <= 0) s.bossActive = false;
      }

      s.pipes.forEach((p) => {
        p.x -= cfg.speed * speedMult * s.scale;
        p.glow = (p.glow + 0.03) % (Math.PI * 2);
        p.neonPhase += 0.02 * speedMult;

        if (p.drift > 0) {
          p.phase += 0.018 * speedMult;
          const limit = Math.min(p.drift * s.scale, Math.min(p.baseY - 40 * s.scale - p.gap / 2, s.H - gnd - 40 * s.scale - p.gap / 2 - p.baseY));
          p.gapY = p.baseY + Math.sin(p.phase) * Math.max(0, limit);
        }

        const topH = p.gapY - p.gap / 2;
        const botY = p.gapY + p.gap / 2;

        const glowIntensity = 0.12 + Math.sin(p.glow) * 0.06;
        ctx.fillStyle = withAlpha(pal.accent, glowIntensity);
        ctx.fillRect(p.x - 4 * s.scale, 0, p.width + 8 * s.scale, topH);
        ctx.fillRect(p.x - 4 * s.scale, botY, p.width + 8 * s.scale, s.H - botY);

        const drawPipeBand = (y0, h) => {
          const g = ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
          g.addColorStop(0, shade(pipeFill, -0.25));
          g.addColorStop(0.3, shade(pipeFill, 0.2));
          g.addColorStop(0.7, shade(pipeFill, 0.12));
          g.addColorStop(1, shade(pipeFill, -0.35));
          ctx.fillStyle = g;
          ctx.fillRect(p.x, y0, p.width, h);
          ctx.fillStyle = `rgba(255,255,255,0.08)`;
          ctx.fillRect(p.x + 1 * s.scale, y0, 2 * s.scale, h);
          ctx.fillStyle = `rgba(0,0,0,0.15)`;
          ctx.fillRect(p.x + p.width - 2 * s.scale, y0, 2 * s.scale, h);
        };

        glow(pal.accent, 14);
        drawPipeBand(0, topH);
        drawPipeBand(botY, s.H - botY);
        ctx.shadowBlur = 0;

        const neonAlpha = 0.25 + Math.sin(p.neonPhase) * 0.15;
        ctx.fillStyle = `hsla(${p.neonHue}, 80%, 60%, ${neonAlpha})`;
        ctx.fillRect(p.x + p.width * 0.35, 0, p.width * 0.3, topH);
        ctx.fillRect(p.x + p.width * 0.35, botY, p.width * 0.3, s.H - botY);

        const capH = 6 * s.scale;
        const capG = ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
        capG.addColorStop(0, shade(pipeEdge, -0.15));
        capG.addColorStop(0.5, shade(pipeEdge, 0.25));
        capG.addColorStop(1, shade(pipeEdge, -0.2));
        ctx.fillStyle = capG;
        ctx.fillRect(p.x - 3 * s.scale, topH - capH, p.width + 6 * s.scale, capH);
        ctx.fillRect(p.x - 3 * s.scale, botY, p.width + 6 * s.scale, capH);

        ctx.strokeStyle = withAlpha(pal.accent, 0.3);
        ctx.setLineDash([3 * s.scale, 5 * s.scale]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.gapY);
        ctx.lineTo(p.x + p.width, p.gapY);
        ctx.stroke();
        ctx.setLineDash([]);

        if (!p.passed && p.x + p.width < s.bird.x) {
          p.passed = true;
          s.passed += 1;
          const perfect = Math.abs(s.bird.y - p.gapY) < p.gap * 0.18;
          let mult = 1;
          if (perfect) mult = s.combo.hit(); else s.combo.reset();
          const starMult = s.starTimer > 0 ? 3 : 1;
          const gained = Math.round((perfect ? 10 : 5) * mult * starMult);
          s.score += gained;

          pushPopup(s.popups, s.bird.x + 30 * s.scale, s.bird.y - 24 * s.scale, `+${gained}`, perfect ? STAR : "#ffffff", (perfect ? 20 : 15) * s.scale);
          if (perfect) pushPopup(s.popups, s.bird.x + 30 * s.scale, s.bird.y - 46 * s.scale, "PERFECT", STAR, 12 * s.scale);
          if (s.starTimer > 0) pushPopup(s.popups, s.bird.x + 30 * s.scale, s.bird.y - 62 * s.scale, "x3", STAR, 11 * s.scale);

          playMove();
          hapticMerge();
          s.flashAlpha = perfect ? 0.25 : 0.1;

          if (s.magnetTimer > 0) {
            s.orbs.forEach((o) => {
              const dx = s.bird.x - o.x;
              const dy = s.bird.y - o.y;
              const dist = Math.hypot(dx, dy);
              if (dist < 150 * s.scale) {
                o.x += dx * 0.15;
                o.y += dy * 0.15;
              }
            });
          }

          const level = levelFor(GAME_ID, s.score);
          if (level !== s.level) {
            s.level = level;
            s.shakeMag = 6;
            s.flashAlpha = 0.3;
            const extra = level >= 8 ? " · cột rộng" : level >= 4 ? " · cột trượt" : "";
            flash(`Cấp ${level} · khe hẹp hơn${extra}`);
          } else {
            syncHud();
          }
        }
      });
      s.pipes = s.pipes.filter((p) => p.x + p.width > -30 * s.scale);

      // ── Power-ups (only when playing) ──
      if (!isIdle) {
        s.orbs.forEach((o, idx) => {
          o.x -= cfg.speed * speedMult * s.scale;
          o.pulse = (o.pulse + 0.06) % (Math.PI * 2);
          const pulseR = o.radius * (1 + Math.sin(o.pulse) * 0.15);
          const t = Date.now() * 0.003;

          if (s.magnetTimer > 0 && s.bird.x < o.x) {
            const dx = s.bird.x - o.x;
            const dy = s.bird.y - o.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 120 * s.scale) {
              o.x += dx * 0.06;
              o.y += dy * 0.06;
            }
          }

          // Soft glow halo
          const haloR = pulseR * 2.5;
          const halo = ctx.createRadialGradient(o.x, o.y, pulseR * 0.3, o.x, o.y, haloR);
          halo.addColorStop(0, withAlpha(o.color, 0.25));
          halo.addColorStop(0.5, withAlpha(o.color, 0.08));
          halo.addColorStop(1, "transparent");
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(o.x, o.y, haloR, 0, Math.PI * 2);
          ctx.fill();

          // Rotating sparkle ring
          ctx.save();
          ctx.translate(o.x, o.y);
          ctx.rotate(t);
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const sx = Math.cos(a) * pulseR * 1.8;
            const sy = Math.sin(a) * pulseR * 1.8;
            const sparkle = 0.4 + Math.sin(t * 2 + i) * 0.3;
            ctx.globalAlpha = sparkle;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(sx, sy, 1.2 * s.scale, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
          ctx.restore();

          // Main body — gradient sphere
          glow(o.color, 22);
          const bodyG = ctx.createRadialGradient(
            o.x - pulseR * 0.25, o.y - pulseR * 0.3, pulseR * 0.1,
            o.x, o.y, pulseR
          );
          bodyG.addColorStop(0, "#ffffff");
          bodyG.addColorStop(0.25, o.color);
          bodyG.addColorStop(0.7, shade(o.color, -0.2));
          bodyG.addColorStop(1, shade(o.color, -0.5));
          ctx.fillStyle = bodyG;
          ctx.beginPath();
          ctx.arc(o.x, o.y, pulseR, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Glossy highlight
          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.beginPath();
          ctx.ellipse(o.x - pulseR * 0.2, o.y - pulseR * 0.3, pulseR * 0.45, pulseR * 0.25, -0.4, 0, Math.PI * 2);
          ctx.fill();

          // Icon per type (drawn as shapes, not text)
          ctx.save();
          ctx.translate(o.x, o.y);
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.strokeStyle = "rgba(0,0,0,0.25)";
          ctx.lineWidth = 1.2 * s.scale;
          const ic = pulseR * 0.45;
          ctx.beginPath();
          switch (o.kind) {
            case "shield":
              // Shield shape
              ctx.moveTo(0, -ic);
              ctx.lineTo(ic * 0.8, -ic * 0.5);
              ctx.lineTo(ic * 0.8, ic * 0.2);
              ctx.lineTo(0, ic);
              ctx.lineTo(-ic * 0.8, ic * 0.2);
              ctx.lineTo(-ic * 0.8, -ic * 0.5);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
              break;
            case "slow":
              // Droplet
              ctx.moveTo(0, -ic);
              ctx.quadraticCurveTo(ic * 0.8, ic * 0.2, 0, ic);
              ctx.quadraticCurveTo(-ic * 0.8, ic * 0.2, 0, -ic);
              ctx.fill();
              break;
            case "magnet":
              // Diamond
              ctx.moveTo(0, -ic);
              ctx.lineTo(ic * 0.7, 0);
              ctx.lineTo(0, ic);
              ctx.lineTo(-ic * 0.7, 0);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
              break;
            case "mini":
              // 4-point star
              for (let i = 0; i < 8; i++) {
                const r = i % 2 === 0 ? ic : ic * 0.4;
                const a2 = (i / 8) * Math.PI * 2 - Math.PI / 2;
                if (i === 0) ctx.moveTo(Math.cos(a2) * r, Math.sin(a2) * r);
                else ctx.lineTo(Math.cos(a2) * r, Math.sin(a2) * r);
              }
              ctx.closePath();
              ctx.fill();
              break;
            case "lightning":
              // Lightning bolt
              ctx.moveTo(-ic * 0.15, -ic);
              ctx.lineTo(ic * 0.5, -ic * 0.15);
              ctx.lineTo(ic * 0.05, -ic * 0.1);
              ctx.lineTo(ic * 0.2, ic);
              ctx.lineTo(-ic * 0.45, ic * 0.1);
              ctx.lineTo(ic * 0.0, ic * 0.05);
              ctx.closePath();
              ctx.fill();
              break;
            case "star":
              // 5-point star
              for (let i = 0; i < 10; i++) {
                const r = i % 2 === 0 ? ic : ic * 0.42;
                const a2 = (i / 10) * Math.PI * 2 - Math.PI / 2;
                if (i === 0) ctx.moveTo(Math.cos(a2) * r, Math.sin(a2) * r);
                else ctx.lineTo(Math.cos(a2) * r, Math.sin(a2) * r);
              }
              ctx.closePath();
              ctx.fill();
              break;
            case "ghost":
              // Ghost body
              ctx.moveTo(-ic * 0.6, ic * 0.7);
              ctx.quadraticCurveTo(-ic * 0.6, -ic * 0.6, 0, -ic * 0.8);
              ctx.quadraticCurveTo(ic * 0.6, -ic * 0.6, ic * 0.6, ic * 0.7);
              ctx.lineTo(ic * 0.35, ic * 0.35);
              ctx.lineTo(0, ic * 0.7);
              ctx.lineTo(-ic * 0.35, ic * 0.35);
              ctx.closePath();
              ctx.fill();
              // Eyes
              ctx.fillStyle = "rgba(0,0,0,0.4)";
              ctx.beginPath();
              ctx.arc(-ic * 0.2, -ic * 0.15, ic * 0.12, 0, Math.PI * 2);
              ctx.arc(ic * 0.2, -ic * 0.15, ic * 0.12, 0, Math.PI * 2);
              ctx.fill();
              break;
            default:
              ctx.arc(0, 0, ic * 0.5, 0, Math.PI * 2);
              ctx.fill();
          }
          ctx.restore();

          if (Math.hypot(s.bird.x - o.x, s.bird.y - o.y) < s.bird.radius + o.radius) {
            s.orbs.splice(idx, 1);
            s.flashAlpha = 0.35;
            playBeep();
            hapticMerge();

            switch (o.kind) {
              case "shield":
                s.shield = true;
                flash("Khiên đã sẵn sàng");
                break;
              case "slow":
                s.slowMoTimer = 180;
                flash("Slow-motion");
                break;
              case "magnet":
                s.magnetTimer = 210;
                flash("Nam châm điểm");
                break;
              case "mini":
                s.miniTimer = 240;
                flash("Mini Bird!");
                break;
              case "lightning": {
                const near = s.pipes.find((p) => p.x + p.width > s.bird.x && !p.passed);
                if (near) {
                  near.passed = true;
                  s.passed += 1;
                  s.score += 5;
                  s.shakeMag = 4;
                  for (let i = 0; i < 12; i++) {
                    const a = Math.random() * Math.PI * 2;
                    s.particles.push({
                      x: near.x + near.width / 2, y: near.gapY,
                      vx: Math.cos(a) * 4 * s.scale, vy: Math.sin(a) * 4 * s.scale,
                      life: 1, size: 3 * s.scale, color: LIGHTNING, type: "spark",
                    });
                  }
                  flash("Tường bị phá!");
                } else {
                  s.score += 3;
                  flash("+3 điểm");
                }
                break;
              }
              case "star":
                s.starTimer = 180;
                flash("x3 Điểm!");
                break;
              case "ghost":
                s.ghostTimer = 150;
                flash("Xuyên tường!");
                break;
              default:
                break;
            }
          }
        });
        s.orbs = s.orbs.filter((o) => o.x > -30 * s.scale);
      }

      // ── Particles ──
      s.particles.forEach((pt) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        if (pt.type === "spark") { pt.vy += 0.1 * s.scale; pt.life -= 0.025; }
        else if (pt.type === "trail") { pt.life -= 0.04; }
        else { pt.life -= 0.035; }
      });
      s.particles = s.particles.filter((pt) => pt.life > 0);
      s.particles.forEach((pt) => {
        ctx.globalAlpha = pt.life * 0.8;
        ctx.fillStyle = pt.color;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = pt.type === "spark" ? 10 * s.scale : 6 * s.scale;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * pt.life, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // ── Bird ──
      ctx.save();
      ctx.translate(s.bird.x, s.bird.y);
      const tilt = isIdle
        ? Math.sin(s.idleBob * 0.7) * 0.12
        : Math.min(Math.PI / 4, Math.max(-Math.PI / 4, s.bird.vy * 0.08));
      ctx.rotate(tilt);
      const accent = s.starTimer > 0 ? STAR : s.ghostTimer > 0 ? GHOST : s.slowMoTimer > 0 ? SLOW : pal.accent;

      if (s.ghostTimer > 0) {
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.15;
      }

      if (s.shield) {
        ctx.strokeStyle = SHIELD;
        ctx.shadowColor = SHIELD;
        ctx.shadowBlur = 18 * s.scale;
        ctx.lineWidth = 2 * s.scale;
        ctx.beginPath();
        ctx.arc(0, 0, s.bird.radius * 1.8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      if (s.starTimer > 0) {
        ctx.strokeStyle = STAR;
        ctx.shadowColor = STAR;
        ctx.shadowBlur = 22 * s.scale;
        ctx.lineWidth = 2.5 * s.scale;
        ctx.beginPath();
        ctx.arc(0, 0, s.bird.radius * 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      glow(accent, 24);
      ctx.strokeStyle = withAlpha(accent, 0.15);
      ctx.lineWidth = 2 * s.scale;
      ctx.beginPath();
      ctx.arc(0, 0, s.bird.radius * 1.45, 0, Math.PI * 2);
      ctx.stroke();

      glow(accent, 18);
      const bodyGrad = ctx.createRadialGradient(-s.bird.radius * 0.2, -s.bird.radius * 0.25, s.bird.radius * 0.15, 0, 0, s.bird.radius);
      bodyGrad.addColorStop(0, "#ffffff");
      bodyGrad.addColorStop(0.35, s.starTimer > 0 ? "#fff8c4" : s.ghostTimer > 0 ? "#c8f0ff" : s.slowMoTimer > 0 ? "#8be9ff" : birdBody);
      bodyGrad.addColorStop(1, shade(accent, -0.35));
      ctx.fillStyle = bodyGrad;
      ctx.globalAlpha = s.invuln > 0 && Math.floor(s.invuln / 4) % 2 === 0 ? 0.4 : (s.ghostTimer > 0 ? 0.6 : 1);
      ctx.beginPath();
      ctx.arc(0, 0, s.bird.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = s.ghostTimer > 0 ? 0.5 + Math.sin(Date.now() * 0.01) * 0.15 : 1;
      ctx.shadowBlur = 0;

      if (pal.isLight) {
        ctx.strokeStyle = withAlpha(pal.ink, 0.85);
        ctx.lineWidth = 2.5 * s.scale;
        ctx.stroke();
      }

      ctx.fillStyle = withAlpha(accent, 0.45);
      ctx.beginPath();
      ctx.ellipse(-s.bird.radius * 0.3, Math.sin(s.wingPhase) * 5 * s.scale, s.bird.radius * 0.6, s.bird.radius * 0.35, -0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = s.starTimer > 0 ? "#fff8c4" : "#ff2d55";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 7 * s.scale;
      ctx.fillRect(s.bird.radius * 0.2, -s.bird.radius * 0.35, s.bird.radius * 0.55, s.bird.radius * 0.3);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.fillRect(s.bird.radius * 0.25, -s.bird.radius * 0.3, s.bird.radius * 0.2, s.bird.radius * 0.12);

      ctx.restore();

      // ── Idle overlay ──
      if (isIdle) {
        // Dim overlay
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(0, 0, s.W, s.H);

        // "TAP TO START" pulsing text
        const pulse = 0.7 + Math.sin(Date.now() * 0.004) * 0.3;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = pal.accent;
        ctx.shadowBlur = 20 * s.scale;
        ctx.font = `900 ${22 * s.scale}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("TAP ĐỂ BẮT ĐẦU", s.W / 2, s.H * 0.65);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        // Arrow hint
        const arrowY = s.H * 0.72 + Math.sin(Date.now() * 0.005) * 6 * s.scale;
        ctx.fillStyle = withAlpha(pal.accent, 0.6);
        ctx.beginPath();
        ctx.moveTo(s.W / 2, arrowY);
        ctx.lineTo(s.W / 2 - 10 * s.scale, arrowY - 14 * s.scale);
        ctx.lineTo(s.W / 2 + 10 * s.scale, arrowY - 14 * s.scale);
        ctx.closePath();
        ctx.fill();
      }

      // ── Popups ──
      updatePopups(s.popups);
      drawPopups(ctx, s.popups);

      // ── Collision (only when playing) ──
      if (!isIdle) {
        const topLimit = s.miniTimer > 0 ? s.bird.radius : 2 * s.scale;
        const botLimit = s.H - gnd - (s.miniTimer > 0 ? s.bird.radius : 2 * s.scale);
        let crash = s.bird.y - s.bird.radius < topLimit || s.bird.y + s.bird.radius > botLimit;
        let crashPipe = null;

        if (s.ghostTimer <= 0) {
          s.pipes.forEach((p) => {
            if (s.bird.x + s.bird.radius > p.x && s.bird.x - s.bird.radius < p.x + p.width) {
              if (s.bird.y - s.bird.radius < p.gapY - p.gap / 2 || s.bird.y + s.bird.radius > p.gapY + p.gap / 2) {
                crash = true;
                crashPipe = p;
              }
            }
          });
        }

        if (crash && s.shield && s.invuln <= 0) {
          crash = false;
          s.shield = false;
          s.invuln = 45;
          s.bird.vy = 0;
          s.bird.y = crashPipe ? crashPipe.gapY : Math.min(Math.max(s.bird.y, 40 * s.scale), s.H - gnd - 40 * s.scale);
          s.shakeMag = 10;
          s.flashAlpha = 0.45;
          s.combo.reset();
          for (let i = 0; i < 20; i++) {
            const a = Math.random() * Math.PI * 2;
            s.particles.push({ x: s.bird.x, y: s.bird.y, vx: Math.cos(a) * 3 * s.scale, vy: Math.sin(a) * 3 * s.scale, life: 1, size: 3 * s.scale, color: SHIELD, type: "spark" });
          }
          playBeep();
          flash("Khiên đã vỡ");
        } else if (crash && s.invuln > 0) {
          crash = false;
        }

        if (crash) {
          s.isGameOver = true;
          s.phase = "dead";
          for (let i = 0; i < 24; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = (2 + Math.random() * 4) * s.scale;
            s.particles.push({ x: s.bird.x, y: s.bird.y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: 1, size: (2 + Math.random() * 4) * s.scale, color: pal.accent, type: "spark" });
          }
          for (let i = 0; i < 10; i++) {
            const a = Math.random() * Math.PI * 2;
            s.particles.push({ x: s.bird.x, y: s.bird.y, vx: Math.cos(a) * 2 * s.scale, vy: Math.sin(a) * 2 * s.scale, life: 1, size: 3 * s.scale, color: "#ffffff", type: "spark" });
          }
          s.shakeMag = 14;
          s.flashAlpha = 0.6;
          exitFullscreen();
          const deathRender = () => {
            ctx.fillStyle = pal.bg;
            ctx.fillRect(0, 0, s.W, s.H);
            s.particles.forEach((pt) => { pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.08 * s.scale; pt.life -= 0.018; });
            s.particles = s.particles.filter((pt) => pt.life > 0);
            s.particles.forEach((pt) => {
              ctx.globalAlpha = pt.life;
              ctx.fillStyle = pt.color;
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, pt.size * pt.life, 0, Math.PI * 2);
              ctx.fill();
            });
            ctx.globalAlpha = 1;
            if (s.flashAlpha > 0.01) {
              ctx.fillStyle = `rgba(255,255,255,${s.flashAlpha})`;
              ctx.fillRect(0, 0, s.W, s.H);
              s.flashAlpha *= 0.92;
            }
            if (s.particles.length > 0) requestAnimationFrame(deathRender);
          };
          deathRender();
          playLose();
          hapticLose();
          setTimeout(() => onGameOver?.(s.score, "lose"), 650);
          ctx.restore();
          return;
        }
      }

      // ── Flash overlay ──
      if (s.flashAlpha > 0.01) {
        ctx.fillStyle = `rgba(255,255,255,${s.flashAlpha})`;
        ctx.fillRect(0, 0, s.W, s.H);
      }

      ctx.restore();
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    return () => { stopped = true; cancelAnimationFrame(rafId); ro.disconnect(); };
  }, [playBeep, playMove, playLose, onGameOver, paused, syncHud, flash]);

  // HUD sync timer
  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => syncHud(), 200);
    return () => clearInterval(id);
  }, [paused, syncHud]);

  // Keyboard
  useEffect(() => {
    if (paused) return undefined;
    const onKey = (e) => {
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w") {
        e.preventDefault();
        handleFlap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleFlap, paused]);

  return (
    <div className="flappy-fullscreen">
      {/* HUD overlay — positioned on top of fullscreen canvas */}
      <div className="flappy-hud-overlay">
        <ArcadeHud
          gameId={GAME_ID}
          score={hud.score}
          combo={hud.combo}
          multiplier={hud.mult}
          notice={hud.notice}
          stats={[{ label: "Cột đã vượt", value: hud.pipes }]}
        />
      </div>

      {/* Fullscreen canvas */}
      <div
        ref={wrapRef}
        onPointerDown={handleFlap}
        className="flappy-canvas-wrap"
      >
        <canvas ref={canvasRef} className="flappy-canvas" />
      </div>

      {/* Hint bar at bottom */}
      <p className="flappy-hint">
        Chạm để bay · PERFECT = x2 + chuỗi · SHD khiên · SLO chậm · MAG hút · MINI nhỏ · ELC phá tường · x3 gấp 3 · GHO xuyên tường
      </p>
    </div>
  );
}
