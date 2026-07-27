import React, { useEffect, useRef, useState, useCallback } from "react";
import { useArcadeSound } from "../../../hooks/useArcadeSound";
import { hapticMove, hapticMerge, hapticLose } from "../../../utils/haptics";
import { readGamePalette, shade, withAlpha } from "./arcadePalette";
import { levelFor, ramp, createCombo, pushPopup, updatePopups, drawPopups } from "./arcadeProgression";
import ArcadeHud from "./ArcadeHud";

// ── Luật chơi (mới) ───────────────────────────────────────────────
// · Qua cột: 5 điểm. Qua ĐÚNG GIỮA khe: 10 điểm ("PERFECT") và nối chuỗi.
// · Chuỗi liên hoàn (2.8s) nhân tối đa x2.5 — bay chuẩn ăn gấp năm bay ẩu.
// · Cầu XANH = slow-motion, cầu VÀNG = khiên đỡ một lần va chạm.
// · Từ cấp 4 các cột bắt đầu TRƯỢT LÊN XUỐNG; biên độ tăng theo cấp.
// · Trước đây game không hề tăng độ khó (tốc độ 2.6, khe 120 cố định từ đầu
//   tới cuối). Giờ tốc độ / khe hở / nhịp sinh cột đều lấy từ `ramp()`.
const GAME_ID = "flappy";
const W = 340;
const H = 480;
const GROUND = 60;

const SLOW = "#22d3ee";
const SHIELD = "#ffc73a";

// Ba tham số độ khó duy nhất của game, tất cả suy ra từ cấp độ.
const tuning = (level) => ({
  gap: ramp(GAME_ID, level, 152, 96),
  speed: ramp(GAME_ID, level, 2.4, 4.6),
  interval: ramp(GAME_ID, level, 105, 62),
  drift: level >= 4 ? ramp(GAME_ID, level, 0, 46) : 0,
});

export default function GameFlappyCyber({ paused = false, onGameOver }) {
  const canvasRef = useRef(null);
  const [hud, setHud] = useState({ score: 0, pipes: 0, combo: 0, mult: 1, notice: "" });

  const { playBeep, playMove, playLose } = useArcadeSound();

  const state = useRef({
    bird: { x: 80, y: 220, radius: 14, vy: 0, gravity: 0.45, jump: -7.5 },
    pipes: [],
    orbs: [],
    particles: [],
    popups: [],
    score: 0,
    passed: 0,
    level: 1,
    combo: createCombo({ windowMs: 2800, step: 0.25, max: 2.5 }),
    slowMoTimer: 0,
    shield: false,
    invuln: 0,
    isGameOver: false,
    shakeX: 0, shakeY: 0, shakeMag: 0,
    groundOffset: 0,
    bgOffset: 0,
    midOffset: 0,
    wingPhase: 0,
    flashAlpha: 0,
    starField: Array.from({ length: 40 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      size: 0.5 + Math.random() * 1.5,
      speed: 0.2 + Math.random() * 0.5,
      alpha: 0.3 + Math.random() * 0.7,
    })),
    mountains: Array.from({ length: 8 }, (_, i) => ({ x: i * 50, h: 40 + Math.random() * 60 })),
    buildings: Array.from({ length: 12 }, (_, i) => ({ x: i * 32, w: 18 + Math.random() * 14, h: 25 + Math.random() * 50 })),
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
    setTimeout(() => setHud((h) => (h.notice === text ? { ...h, notice: "" } : h)), 1600);
  }, [syncHud]);

  const handleFlap = useCallback(() => {
    if (state.current.isGameOver) return;
    state.current.bird.vy = state.current.bird.jump;
    playBeep();
    hapticMove();
  }, [playBeep]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || paused) return;
    const ctx = canvas.getContext("2d");

    canvas.width = W;
    canvas.height = H;

    const pal = readGamePalette(canvas);
    const pipeFill = shade(pal.accent, pal.isLight ? 0.42 : -0.05);
    const pipeEdge = shade(pal.accent, pal.isLight ? -0.25 : 0.45);
    const birdBody = pal.isLight ? "#ffd45c" : "#ffffff";
    const glow = (color, blur) => {
      ctx.shadowColor = pal.isLight ? "transparent" : color;
      ctx.shadowBlur = pal.isLight ? 0 : blur;
    };

    let stopped = false;
    let rafId;
    let spawnCounter = 0;

    const spawnPipe = (cfg) => {
      const s = state.current;
      const margin = 54;
      const gapY = margin + cfg.gap / 2 + Math.random() * (H - GROUND - margin * 2 - cfg.gap);
      s.pipes.push({
        x: W + 30,
        width: 44,
        gapY,
        baseY: gapY,
        gap: cfg.gap,
        drift: cfg.drift,
        phase: Math.random() * Math.PI * 2,
        passed: false,
        glow: 0,
      });

      // Cầu thưởng: xanh = slow-mo, vàng = khiên (chỉ khi chưa có khiên).
      if (Math.random() < 0.28) {
        const kind = !s.shield && Math.random() < 0.45 ? "shield" : "slow";
        s.orbs.push({ x: W + 50, y: gapY, radius: 10, pulse: 0, kind });
      }
    };

    const render = () => {
      if (stopped) return;
      const s = state.current;
      if (s.isGameOver) { stopped = true; return; }

      const cfg = tuning(s.level);
      const speedMult = s.slowMoTimer > 0 ? 0.5 : 1.0;
      if (s.slowMoTimer > 0) s.slowMoTimer -= 1;
      if (s.invuln > 0) s.invuln -= 1;
      s.combo.tick();

      if (s.shakeMag > 0.2) {
        s.shakeX = (Math.random() - 0.5) * s.shakeMag;
        s.shakeY = (Math.random() - 0.5) * s.shakeMag;
        s.shakeMag *= 0.85;
      } else { s.shakeX = 0; s.shakeY = 0; s.shakeMag = 0; }

      if (s.flashAlpha > 0.01) s.flashAlpha *= 0.9;

      s.groundOffset = (s.groundOffset + cfg.speed * speedMult) % 40;
      s.bgOffset = (s.bgOffset + 0.3 * speedMult) % W;
      s.midOffset = (s.midOffset + 1.0 * speedMult) % W;
      s.wingPhase = (s.wingPhase + 0.25) % (Math.PI * 2);

      ctx.save();
      ctx.translate(s.shakeX, s.shakeY);

      // ── Background ──
      ctx.fillStyle = pal.bg;
      ctx.fillRect(-5, -5, W + 10, H + 10);

      s.starField.forEach((star) => {
        star.x -= star.speed * speedMult;
        if (star.x < 0) { star.x = W; star.y = Math.random() * H; }
        ctx.globalAlpha = star.alpha * (s.slowMoTimer > 0 ? 0.5 : 1);
        ctx.fillStyle = s.slowMoTimer > 0 ? "#8be9ff" : "#ffffff";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      ctx.fillStyle = withAlpha(pal.accent, 0.08);
      s.mountains.forEach((m) => {
        const mx = ((m.x - s.bgOffset + 400) % 400) - 50;
        ctx.beginPath();
        ctx.moveTo(mx, H - GROUND);
        ctx.lineTo(mx + 25, H - GROUND - m.h);
        ctx.lineTo(mx + 50, H - GROUND);
        ctx.fill();
      });

      ctx.fillStyle = withAlpha(pal.accent, 0.12);
      s.buildings.forEach((b) => {
        const bx = ((b.x - s.midOffset + 400) % 400) - 30;
        ctx.fillRect(bx, H - GROUND - b.h, b.w, b.h);
        ctx.fillStyle = withAlpha(pal.accent, 0.2);
        for (let wy = H - GROUND - b.h + 4; wy < H - GROUND - 4; wy += 8) {
          for (let wx = bx + 3; wx < bx + b.w - 3; wx += 6) {
            if (Math.random() > 0.3) ctx.fillRect(wx, wy, 2, 3);
          }
        }
        ctx.fillStyle = withAlpha(pal.accent, 0.12);
      });

      ctx.fillStyle = withAlpha(pal.accent, 0.15);
      ctx.fillRect(0, H - GROUND, W, GROUND);
      ctx.strokeStyle = withAlpha(pal.accent, 0.3);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, H - GROUND);
      ctx.lineTo(W, H - GROUND);
      ctx.stroke();
      ctx.strokeStyle = withAlpha(pal.accent, 0.08);
      ctx.lineWidth = 1;
      for (let gx = -s.groundOffset; gx < W; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, H - GROUND); ctx.lineTo(gx - 15, H); ctx.stroke();
      }

      // ── Physics ──
      s.bird.vy += s.bird.gravity * speedMult;
      s.bird.y += s.bird.vy * speedMult;

      const trailColor = s.slowMoTimer > 0 ? SLOW : s.shield ? SHIELD : pal.accent;
      for (let i = 0; i < (s.slowMoTimer > 0 ? 3 : 1); i++) {
        s.particles.push({
          x: s.bird.x - 12,
          y: s.bird.y + (Math.random() - 0.5) * 6,
          vx: -1.5 - Math.random() * 2,
          vy: (Math.random() - 0.5) * 1.5,
          life: 1,
          size: 2 + Math.random() * 3,
          color: trailColor,
        });
      }

      // ── Pipes ──
      spawnCounter += 1 * speedMult;
      if (spawnCounter > cfg.interval) { spawnCounter = 0; spawnPipe(cfg); }

      s.pipes.forEach((p) => {
        p.x -= cfg.speed * speedMult;
        p.glow = (p.glow + 0.03) % (Math.PI * 2);
        // Cột trượt: chỉ bật từ cấp 4, biên độ kẹp trong sân để khe không lọt đất.
        if (p.drift > 0) {
          p.phase += 0.018 * speedMult;
          const limit = Math.min(p.drift, Math.min(p.baseY - 40 - p.gap / 2, H - GROUND - 40 - p.gap / 2 - p.baseY));
          p.gapY = p.baseY + Math.sin(p.phase) * Math.max(0, limit);
        }

        const topH = p.gapY - p.gap / 2;
        const botY = p.gapY + p.gap / 2;

        const glowIntensity = 0.15 + Math.sin(p.glow) * 0.08;
        ctx.fillStyle = withAlpha(pal.accent, glowIntensity);
        ctx.fillRect(p.x - 3, 0, p.width + 6, topH);
        ctx.fillRect(p.x - 3, botY, p.width + 6, H - botY);

        const band = (y0, h) => {
          const g = ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
          g.addColorStop(0, shade(pipeFill, -0.2));
          g.addColorStop(0.5, shade(pipeFill, 0.18));
          g.addColorStop(1, shade(pipeFill, -0.3));
          ctx.fillStyle = g;
          ctx.fillRect(p.x, y0, p.width, h);
        };
        glow(pal.accent, 12);
        band(0, topH);
        band(botY, H - botY);
        ctx.shadowBlur = 0;

        ctx.strokeStyle = pipeEdge;
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, topH - 6, p.width, 6);
        ctx.strokeRect(p.x, botY, p.width, 6);

        // Vạch ngắm giữa khe — dạy người chơi nhắm "perfect" mà không cần chữ.
        ctx.strokeStyle = withAlpha(pal.accent, 0.35);
        ctx.setLineDash([3, 5]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.gapY);
        ctx.lineTo(p.x + p.width, p.gapY);
        ctx.stroke();
        ctx.setLineDash([]);

        if (!p.passed && p.x + p.width < s.bird.x) {
          p.passed = true;
          s.passed += 1;
          // Chỉ cú "perfect" mới nối chuỗi; qua lệch tâm là đứt chuỗi ngay.
          const perfect = Math.abs(s.bird.y - p.gapY) < p.gap * 0.18;
          let mult = 1;
          if (perfect) mult = s.combo.hit(); else s.combo.reset();
          const gained = Math.round((perfect ? 10 : 5) * mult);
          s.score += gained;

          pushPopup(s.popups, s.bird.x + 30, s.bird.y - 22, `+${gained}`, perfect ? SHIELD : "#ffffff", perfect ? 19 : 15);
          if (perfect) pushPopup(s.popups, s.bird.x + 30, s.bird.y - 42, "PERFECT", SHIELD, 12);

          playMove();
          hapticMerge();
          s.flashAlpha = perfect ? 0.28 : 0.12;

          const level = levelFor(GAME_ID, s.score);
          if (level !== s.level) {
            s.level = level;
            s.shakeMag = 6;
            s.flashAlpha = 0.35;
            flash(`Cấp ${level} · khe hẹp hơn${level >= 4 ? " · cột trượt" : ""}`);
          } else {
            syncHud();
          }
        }
      });
      s.pipes = s.pipes.filter((p) => p.x + p.width > -20);

      // ── Cầu thưởng ──
      s.orbs.forEach((o, idx) => {
        o.x -= cfg.speed * speedMult;
        o.pulse = (o.pulse + 0.06) % (Math.PI * 2);
        const color = o.kind === "shield" ? SHIELD : SLOW;
        const pulseR = o.radius * (1 + Math.sin(o.pulse) * 0.2);

        ctx.strokeStyle = withAlpha(color, 0.35);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(o.x, o.y, pulseR * 1.5, 0, Math.PI * 2);
        ctx.stroke();

        glow(color, 18);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(o.x, o.y, pulseR, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "rgba(0,0,0,.65)";
        ctx.font = "900 9px ui-sans-serif, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(o.kind === "shield" ? "SHD" : "SLO", o.x, o.y + 3);

        if (Math.hypot(s.bird.x - o.x, s.bird.y - o.y) < s.bird.radius + o.radius) {
          s.orbs.splice(idx, 1);
          s.flashAlpha = 0.4;
          playBeep();
          if (o.kind === "shield") { s.shield = true; flash("Khiên đã sẵn sàng"); }
          else { s.slowMoTimer = 180; flash("Slow-motion"); }
        }
      });
      s.orbs = s.orbs.filter((o) => o.x > -20);

      // ── Particles ──
      s.particles.forEach((pt) => { pt.x += pt.vx; pt.y += pt.vy; pt.life -= 0.035; });
      s.particles = s.particles.filter((pt) => pt.life > 0);
      s.particles.forEach((pt) => {
        ctx.globalAlpha = pt.life * 0.8;
        ctx.fillStyle = pt.color;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size * pt.life, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // ── Bird ──
      ctx.save();
      ctx.translate(s.bird.x, s.bird.y);
      ctx.rotate(Math.min(Math.PI / 4, Math.max(-Math.PI / 4, s.bird.vy * 0.08)));
      const accent = s.slowMoTimer > 0 ? SLOW : pal.accent;

      if (s.shield) {
        ctx.strokeStyle = SHIELD;
        ctx.shadowColor = SHIELD;
        ctx.shadowBlur = 16;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, s.bird.radius * 1.75, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      glow(accent, 22);
      ctx.strokeStyle = withAlpha(accent, 0.2);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, s.bird.radius * 1.4, 0, Math.PI * 2);
      ctx.stroke();

      glow(accent, 16);
      const bodyGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, s.bird.radius);
      bodyGrad.addColorStop(0, "#ffffff");
      bodyGrad.addColorStop(0.4, s.slowMoTimer > 0 ? "#8be9ff" : birdBody);
      bodyGrad.addColorStop(1, shade(accent, -0.3));
      ctx.fillStyle = bodyGrad;
      ctx.globalAlpha = s.invuln > 0 && Math.floor(s.invuln / 4) % 2 === 0 ? 0.45 : 1;
      ctx.beginPath();
      ctx.arc(0, 0, s.bird.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      if (pal.isLight) {
        ctx.strokeStyle = withAlpha(pal.ink, 0.9);
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      ctx.fillStyle = withAlpha(accent, 0.5);
      ctx.beginPath();
      ctx.ellipse(-4, Math.sin(s.wingPhase) * 4, 8, 5, -0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = s.slowMoTimer > 0 ? SLOW : "#ff2d55";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 6;
      ctx.fillRect(3, -5, 9, 5);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillRect(4, -4, 3, 1.5);
      ctx.restore();

      updatePopups(s.popups);
      drawPopups(ctx, s.popups);

      // ── Collision ──
      let crash = s.bird.y - s.bird.radius < 0 || s.bird.y + s.bird.radius > H - GROUND;
      let crashPipe = null;
      s.pipes.forEach((p) => {
        if (s.bird.x + s.bird.radius > p.x && s.bird.x - s.bird.radius < p.x + p.width) {
          if (s.bird.y - s.bird.radius < p.gapY - p.gap / 2 || s.bird.y + s.bird.radius > p.gapY + p.gap / 2) {
            crash = true;
            crashPipe = p;
          }
        }
      });

      // Khiên nuốt một lần va chạm: đẩy chim về giữa khe + bất tử ngắn.
      if (crash && s.shield && s.invuln <= 0) {
        crash = false;
        s.shield = false;
        s.invuln = 45;
        s.bird.vy = 0;
        s.bird.y = crashPipe ? crashPipe.gapY : Math.min(Math.max(s.bird.y, 40), H - GROUND - 40);
        s.shakeMag = 10;
        s.flashAlpha = 0.5;
        s.combo.reset();
        for (let i = 0; i < 18; i++) {
          const a = Math.random() * Math.PI * 2;
          s.particles.push({ x: s.bird.x, y: s.bird.y, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, life: 1, size: 3, color: SHIELD });
        }
        playBeep();
        flash("Khiên đã vỡ");
      } else if (crash && s.invuln > 0) {
        crash = false;
      }

      if (crash) {
        s.isGameOver = true;
        for (let i = 0; i < 20; i++) {
          const a = Math.random() * Math.PI * 2;
          const spd = 2 + Math.random() * 4;
          s.particles.push({ x: s.bird.x, y: s.bird.y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: 1, size: 2 + Math.random() * 4, color: pal.accent });
        }
        for (let i = 0; i < 8; i++) {
          const a = Math.random() * Math.PI * 2;
          s.particles.push({ x: s.bird.x, y: s.bird.y, vx: Math.cos(a) * 2, vy: Math.sin(a) * 2, life: 1, size: 3, color: "#ffffff" });
        }
        s.shakeMag = 12;
        s.flashAlpha = 0.6;
        const deathRender = () => {
          ctx.fillStyle = pal.bg;
          ctx.fillRect(0, 0, W, H);
          s.particles.forEach((pt) => { pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.08; pt.life -= 0.02; });
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
            ctx.fillRect(0, 0, W, H);
            s.flashAlpha *= 0.9;
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

      if (s.flashAlpha > 0.01) {
        ctx.fillStyle = `rgba(255,255,255,${s.flashAlpha})`;
        ctx.fillRect(0, 0, W, H);
      }

      ctx.restore();
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => { stopped = true; cancelAnimationFrame(rafId); };
  }, [playBeep, playMove, playLose, onGameOver, paused, syncHud, flash]);

  // Chuỗi combo rơi theo thời gian nên HUD nhịp riêng thay vì setState mỗi khung.
  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => syncHud(), 200);
    return () => clearInterval(id);
  }, [paused, syncHud]);

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
    <div className="w-full max-w-sm mx-auto flex flex-col items-center">
      <ArcadeHud
        gameId={GAME_ID}
        score={hud.score}
        combo={hud.combo}
        multiplier={hud.mult}
        notice={hud.notice}
        stats={[{ label: "Cột đã vượt", value: hud.pipes }]}
      />

      <div
        onPointerDown={handleFlap}
        className="gpanel relative rounded-[26px] overflow-hidden p-1.5 cursor-pointer touch-none"
      >
        <canvas ref={canvasRef} className="w-[280px] h-[400px] block rounded-[20px]" />
      </div>

      <button
        onPointerDown={handleFlap}
        className="w-full mt-4 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider active:scale-95 transition-transform flex items-center justify-center gap-2"
        style={{ background: "var(--intro-accent)", color: "var(--intro-bg)" }}
      >
        <span className="material-symbols-outlined text-lg">flight_takeoff</span> Chạm để bay
      </button>

      <p className="game-control-hint mt-3 text-center text-[11px]">
        Bay đúng vạch giữa khe = PERFECT (x2 điểm + chuỗi) · Cầu vàng cho khiên, cầu xanh làm chậm thời gian
      </p>
    </div>
  );
}
