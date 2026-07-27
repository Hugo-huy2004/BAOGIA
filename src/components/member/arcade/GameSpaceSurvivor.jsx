import React, { useEffect, useRef, useState, useCallback } from "react";
import { useArcadeSound } from "../../../hooks/useArcadeSound";
import { hapticMove, hapticMerge, hapticLose } from "../../../utils/haptics";
import confetti from "canvas-confetti";
import { readGamePalette, shade, withAlpha } from "./arcadePalette";
import { levelFor, ramp, createCombo, pushPopup, updatePopups, drawPopups } from "./arcadeProgression";
import ArcadeHud from "./ArcadeHud";

// ── Luật chơi (mới) ───────────────────────────────────────────────
// · ĐỢT (wave) = cấp độ: mỗi đợt quái nhanh hơn, dày hơn, máu dày hơn.
// · CẤP SÚNG 1→5: nhặt lõi năng lượng để lên cấp; ăn đạn thì tụt 1 cấp thay vì
//   chết ngay (chỉ hết máu mới thua) — thua vì sơ sẩy một lần là quá phũ.
// · Trùm xuất hiện mỗi 5 đợt, máu theo đợt, bắn đạn toả.
// · Quái có hành vi riêng: drone lượn, seeker bám theo người chơi, heavy bắn trả.
// · Chuỗi hạ gục 2.2s nhân điểm tối đa x3.
const GAME_ID = "survivor";
const W = 360;
const H = 540;
const MAX_HP = 3;
const MAX_WEAPON = 5;

const CORE = "#ffc73a";
const SHIELD_C = "#38bdf8";
const ENEMY_SHOT = "#ff3b30";

export default function GameSpaceSurvivor({ paused = false, onGameOver }) {
  const canvasRef = useRef(null);
  const [hud, setHud] = useState({ score: 0, hp: MAX_HP, weapon: 1, wave: 1, combo: 0, mult: 1, notice: "", boss: null });

  const { playBeep, playLose } = useArcadeSound();

  const state = useRef({
    player: { x: W / 2, y: H - 90, speed: 6, hp: MAX_HP, weapon: 1, shield: false, invuln: 0 },
    bullets: [],
    foeShots: [],
    enemies: [],
    powerUps: [],
    particles: [],
    popups: [],
    boss: null,
    bossClearedAt: 0,
    score: 0,
    wave: 1,
    combo: createCombo({ windowMs: 2200, step: 0.25, max: 3 }),
    keys: {},
    lastShot: 0,
    spawnAcc: 0,
    isGameOver: false,
    shakeX: 0, shakeY: 0, shakeMag: 0,
    flashAlpha: 0,
    starLayers: [
      Array.from({ length: 50 }, () => ({ x: Math.random() * W, y: Math.random() * H, size: 0.5, speed: 0.5, alpha: 0.3 })),
      Array.from({ length: 30 }, () => ({ x: Math.random() * W, y: Math.random() * H, size: 1, speed: 1.2, alpha: 0.5 })),
      Array.from({ length: 15 }, () => ({ x: Math.random() * W, y: Math.random() * H, size: 2, speed: 2.5, alpha: 0.8 })),
    ],
    nebulaPhase: 0,
  });

  const syncHud = useCallback((notice) => {
    const s = state.current;
    setHud((prev) => ({
      score: s.score,
      hp: s.player.hp,
      weapon: s.player.weapon,
      wave: s.wave,
      combo: s.combo.chain + (s.combo.chain > 0 ? 1 : 0),
      mult: s.combo.mult,
      boss: s.boss ? Math.max(0, Math.round((s.boss.hp / s.boss.maxHp) * 100)) : null,
      notice: notice !== undefined ? notice : prev.notice,
    }));
  }, []);

  const notify = useCallback((text) => {
    syncHud(text);
    setTimeout(() => setHud((h) => (h.notice === text ? { ...h, notice: "" } : h)), 2000);
  }, [syncHud]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || paused) return;
    const ctx = canvas.getContext("2d");

    canvas.width = W;
    canvas.height = H;

    const pal = readGamePalette(canvas);
    const shipBody = pal.isLight ? shade(pal.ink, 0.15) : "#ffffff";

    let stopped = false;
    let rafId;

    const boom = (x, y, color, count = 12) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 4 + 1;
        state.current.particles.push({ x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, life: 1, size: 2 + Math.random() * 3, color });
      }
    };

    // Toàn bộ độ khó của game nằm ở đây, suy ra từ đợt.
    const tuning = (wave) => ({
      spawnRate: ramp(GAME_ID, wave, 0.030, 0.085),
      foeSpeed: ramp(GAME_ID, wave, 1.0, 2.1),
      hpBonus: Math.floor((wave - 1) / 3),
      shotChance: ramp(GAME_ID, wave, 0.002, 0.012),
    });

    const spawnEnemy = (cfg) => {
      const s = state.current;
      const type = ["drone", "seeker", "heavy"][Math.floor(Math.random() * 3)];
      s.enemies.push({
        x: Math.random() * (W - 48) + 24,
        y: -30,
        w: type === "heavy" ? 36 : 24,
        hp: (type === "heavy" ? 4 : 1) + cfg.hpBonus,
        speed: (type === "drone" ? 2.4 : type === "seeker" ? 3 : 1.6) * cfg.foeSpeed,
        type,
        color: type === "drone" ? "#ef4444" : type === "seeker" ? "#f97316" : "#a855f7",
        phase: Math.random() * Math.PI * 2,
      });
    };

    const spawnBoss = (wave) => {
      const s = state.current;
      const hp = 40 + wave * 14;
      s.boss = { x: W / 2 - 50, y: 40, w: 100, h: 60, hp, maxHp: hp, dirX: 2 + wave * 0.15, phase: 0 };
      s.flashAlpha = 0.6;
      s.shakeMag = 10;
      notify(`Trùm đợt ${wave} xuất hiện`);
    };

    // Cấp súng quyết định thế đạn — phần thưởng thấy được ngay chứ không chỉ là số.
    const fire = (s, ts) => {
      const tier = s.player.weapon;
      const cadence = 165 - tier * 12;
      if (ts - s.lastShot < cadence) return;
      s.lastShot = ts;
      playBeep();
      const shot = (dx, vx, vy, pierce = false) =>
        s.bullets.push({ x: s.player.x + dx, y: s.player.y - 16, vx, vy, pierce, color: pierce ? CORE : "#38bdf8", trail: [] });

      if (tier >= 1) shot(0, 0, -11);
      if (tier >= 2) { shot(-9, 0, -11); shot(9, 0, -11); }
      if (tier >= 3) { shot(-14, -1.9, -10); shot(14, 1.9, -10); }
      if (tier >= 4) { shot(-18, -3.4, -8.5); shot(18, 3.4, -8.5); }
      if (tier >= 5) shot(0, 0, -13, true);
    };

    // Một cửa duy nhất cho mọi sát thương lên người chơi — khiên, bất tử và
    // tụt cấp súng chỉ tồn tại ở đây nên không thể lệch giữa các loại va chạm.
    const damage = (s, x, y) => {
      if (s.player.invuln > 0) return;
      if (s.player.shield) {
        s.player.shield = false;
        s.player.invuln = 50;
        boom(x, y, SHIELD_C, 20);
        s.shakeMag = 8;
        notify("Khiên đã chắn đòn");
        return;
      }
      s.player.hp -= 1;
      s.player.weapon = Math.max(1, s.player.weapon - 1);
      s.player.invuln = 70;
      s.combo.reset();
      s.shakeMag = 12;
      s.flashAlpha = 0.45;
      boom(x, y, "#ef4444", 22);
      hapticLose();

      if (s.player.hp <= 0) {
        s.isGameOver = true;
        stopped = true;
        boom(s.player.x, s.player.y, "#ef4444", 30);
        boom(s.player.x, s.player.y, "#ffffff", 10);
        s.shakeMag = 18;
        s.flashAlpha = 0.7;
        playLose();
        const deathRender = () => {
          ctx.fillStyle = pal.bg;
          ctx.fillRect(0, 0, W, H);
          s.particles.forEach((pt) => { pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.05; pt.life -= 0.015; });
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
        setTimeout(() => onGameOver?.(s.score, "lose"), 600);
      } else {
        notify(`Trúng đạn · còn ${s.player.hp} máu`);
      }
    };

    const reward = (s, x, y, base) => {
      const mult = s.combo.hit();
      const gained = Math.round(base * (1 + (s.wave - 1) * 0.12) * mult);
      s.score += gained;
      pushPopup(s.popups, x, y, `+${gained}`, s.combo.chain >= 3 ? CORE : "#ffffff", s.combo.chain >= 3 ? 17 : 14);
      return gained;
    };

    const render = (ts) => {
      if (stopped) return;
      const s = state.current;
      if (s.isGameOver) { stopped = true; return; }

      const cfg = tuning(s.wave);
      s.combo.tick();
      if (s.player.invuln > 0) s.player.invuln -= 1;

      if (s.shakeMag > 0.2) {
        s.shakeX = (Math.random() - 0.5) * s.shakeMag;
        s.shakeY = (Math.random() - 0.5) * s.shakeMag;
        s.shakeMag *= 0.85;
      } else { s.shakeX = 0; s.shakeY = 0; s.shakeMag = 0; }
      if (s.flashAlpha > 0.01) s.flashAlpha *= 0.92;

      ctx.save();
      ctx.translate(s.shakeX, s.shakeY);

      // ── Nền vũ trụ ──
      ctx.fillStyle = pal.bg;
      ctx.fillRect(-5, -5, W + 10, H + 10);

      s.nebulaPhase += 0.005;
      const neb = (cx, cy, r, color, a) => {
        const g = ctx.createRadialGradient(cx, cy, 15, cx, cy, r);
        g.addColorStop(0, withAlpha(color, a));
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      };
      neb(W * 0.3 + Math.sin(s.nebulaPhase) * 30, H * 0.4, 180, pal.accent, 0.06);
      neb(W * 0.7 + Math.cos(s.nebulaPhase * 0.7) * 25, H * 0.6, 150, "#a855f7", 0.04);

      s.starLayers.forEach((layer) => layer.forEach((star) => {
        star.y += star.speed;
        if (star.y > H) { star.y = 0; star.x = Math.random() * W; }
        ctx.globalAlpha = star.alpha;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }));
      ctx.globalAlpha = 1;

      // ── Điều khiển ──
      if (s.keys.ArrowLeft || s.keys.a) s.player.x = Math.max(16, s.player.x - s.player.speed);
      if (s.keys.ArrowRight || s.keys.d) s.player.x = Math.min(W - 16, s.player.x + s.player.speed);
      if (s.keys.ArrowUp || s.keys.w) s.player.y = Math.max(30, s.player.y - s.player.speed);
      if (s.keys.ArrowDown || s.keys.s) s.player.y = Math.min(H - 40, s.player.y + s.player.speed);

      fire(s, ts);

      // ── Đạn ta ──
      s.bullets.forEach((b) => {
        b.trail.push({ x: b.x, y: b.y, life: 1 });
        if (b.trail.length > 6) b.trail.shift();
        b.x += b.vx;
        b.y += b.vy;

        b.trail.forEach((t) => {
          t.life -= 0.18;
          if (t.life > 0) {
            ctx.globalAlpha = t.life * 0.4;
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.arc(t.x, t.y, 2 * t.life, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        ctx.globalAlpha = 1;

        ctx.shadowColor = b.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, b.pierce ? 3.5 : 2, b.pierce ? 9 : 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      s.bullets = s.bullets.filter((b) => b.y > -20 && b.x > -20 && b.x < W + 20);

      // ── Sinh quái theo đợt ──
      if (!s.boss) {
        s.spawnAcc += cfg.spawnRate;
        while (s.spawnAcc >= 1) { s.spawnAcc -= 1; spawnEnemy(cfg); }
        // Trùm mỗi 5 đợt, chỉ một lần cho mỗi mốc.
        if (s.wave % 5 === 0 && s.bossClearedAt !== s.wave) spawnBoss(s.wave);
      }

      // ── Trùm ──
      if (s.boss) {
        const b = s.boss;
        b.x += b.dirX;
        b.phase += 0.05;
        if (b.x <= 20 || b.x + b.w >= W - 20) b.dirX *= -1;

        ctx.fillStyle = withAlpha("#ef4444", 0.08 + Math.sin(b.phase) * 0.03);
        ctx.beginPath();
        ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2, b.w * 0.7, b.h * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 25;
        const bossGrad = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
        bossGrad.addColorStop(0, "#7f1d1d");
        bossGrad.addColorStop(0.5, "#991b1b");
        bossGrad.addColorStop(1, "#450a0a");
        ctx.fillStyle = bossGrad;
        ctx.beginPath();
        ctx.moveTo(b.x + b.w / 2, b.y + b.h);
        ctx.lineTo(b.x + 10, b.y + 10);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(b.x + b.w, b.y);
        ctx.lineTo(b.x + b.w - 10, b.y + 10);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#f87171";
        ctx.shadowColor = "#f87171";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(b.x + b.w / 2, b.y + b.h / 2, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Đạn toả — càng đợt cao càng nhiều tia.
        if (Math.random() < 0.035) {
          const arms = 3 + Math.floor(s.wave / 5);
          for (let i = 0; i < arms; i++) {
            const a = Math.PI / 2 + (i - (arms - 1) / 2) * 0.32;
            s.foeShots.push({ x: b.x + b.w / 2, y: b.y + b.h, vx: Math.cos(a) * 3.2, vy: Math.sin(a) * 3.2 });
          }
        }
      }

      // ── Quái ──
      s.enemies.forEach((e) => {
        e.phase += 0.08;
        if (e.type === "seeker") {
          // Bám ngang theo người chơi — buộc phải né chứ không đứng yên bắn.
          e.x += Math.sign(s.player.x - e.x) * Math.min(1.6, Math.abs(s.player.x - e.x) * 0.06);
          e.y += e.speed;
        } else if (e.type === "heavy") {
          e.y += e.speed;
          if (Math.random() < cfg.shotChance * 6) {
            s.foeShots.push({ x: e.x, y: e.y + e.w / 2, vx: 0, vy: 4.2 });
          }
        } else {
          e.x += Math.sin(e.phase) * 1.4;
          e.y += e.speed;
        }

        ctx.fillStyle = withAlpha(e.color, 0.12);
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.w / 2 + 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = e.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = withAlpha("#ffffff", 0.3);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.w / 2 - 3, 0, Math.PI * 2);
        ctx.stroke();
      });
      s.enemies = s.enemies.filter((e) => e.y < H + 40);

      // ── Đạn địch ──
      s.foeShots.forEach((f) => {
        f.x += f.vx;
        f.y += f.vy;
        ctx.shadowColor = ENEMY_SHOT;
        ctx.shadowBlur = 10;
        ctx.fillStyle = ENEMY_SHOT;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      s.foeShots = s.foeShots.filter((f) => f.y < H + 20 && f.y > -20 && f.x > -20 && f.x < W + 20);

      // ── Vật phẩm ──
      s.powerUps.forEach((p) => {
        p.y += 2;
        p.phase += 0.06;
        const pulseR = 10 + Math.sin(p.phase) * 2;

        ctx.strokeStyle = withAlpha(p.color, 0.3);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pulseR + 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.shadowColor = p.color;
        ctx.shadowBlur = 14;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pulseR, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "rgba(0,0,0,.7)";
        ctx.font = "900 9px ui-sans-serif, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(p.label, p.x, p.y + 3);
      });
      s.powerUps = s.powerUps.filter((p) => p.y < H + 20);

      // ── Đạn ta ↔ trùm / quái ──
      for (let bIdx = s.bullets.length - 1; bIdx >= 0; bIdx--) {
        const b = s.bullets[bIdx];
        let consumed = false;

        if (s.boss) {
          const bo = s.boss;
          if (b.x >= bo.x && b.x <= bo.x + bo.w && b.y >= bo.y && b.y <= bo.y + bo.h) {
            bo.hp -= 1;
            boom(b.x, b.y, "#f87171", 4);
            hapticMove();
            if (!b.pierce) { s.bullets.splice(bIdx, 1); consumed = true; }
            if (bo.hp <= 0) {
              boom(bo.x + bo.w / 2, bo.y + bo.h / 2, CORE, 40);
              boom(bo.x + bo.w / 2, bo.y + bo.h / 2, "#ffffff", 15);
              reward(s, bo.x + bo.w / 2, bo.y + bo.h / 2, 1200);
              s.bossClearedAt = s.wave;
              s.boss = null;
              s.foeShots = [];
              s.shakeMag = 15;
              s.flashAlpha = 0.5;
              s.player.hp = Math.min(MAX_HP, s.player.hp + 1);
              confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
              notify("Hạ trùm · hồi 1 máu");
            }
          }
        }
        if (consumed) continue;

        for (let eIdx = s.enemies.length - 1; eIdx >= 0; eIdx--) {
          const e = s.enemies[eIdx];
          if (Math.hypot(b.x - e.x, b.y - e.y) < e.w / 2 + 6) {
            e.hp -= 1;
            boom(b.x, b.y, e.color, 6);
            if (!b.pierce) { s.bullets.splice(bIdx, 1); consumed = true; }
            if (e.hp <= 0) {
              s.enemies.splice(eIdx, 1);
              reward(s, e.x, e.y, e.type === "heavy" ? 150 : 50);
              hapticMerge();
              if (Math.random() < 0.2) {
                const kind = s.player.weapon < MAX_WEAPON && Math.random() < 0.6 ? "core" : "shield";
                s.powerUps.push({
                  x: e.x, y: e.y, phase: 0, type: kind,
                  label: kind === "core" ? "PWR" : "SHD",
                  color: kind === "core" ? CORE : SHIELD_C,
                });
              }
            }
            if (consumed) break;
          }
        }
      }

      // ── Người chơi ↔ vật phẩm ──
      for (let i = s.powerUps.length - 1; i >= 0; i--) {
        const p = s.powerUps[i];
        if (Math.hypot(s.player.x - p.x, s.player.y - p.y) < 24) {
          s.powerUps.splice(i, 1);
          playBeep();
          if (p.type === "core") {
            if (s.player.weapon < MAX_WEAPON) {
              s.player.weapon += 1;
              notify(`Súng cấp ${s.player.weapon}`);
            } else {
              reward(s, s.player.x, s.player.y - 24, 200);
              notify("Súng đã tối đa · +điểm");
            }
          } else {
            s.player.shield = true;
            notify("Khiên đã sẵn sàng");
          }
        }
      }

      // ── Va chạm lên người chơi ──
      for (let i = s.enemies.length - 1; i >= 0; i--) {
        const e = s.enemies[i];
        if (Math.hypot(s.player.x - e.x, s.player.y - e.y) < e.w / 2 + 14) {
          s.enemies.splice(i, 1);
          boom(e.x, e.y, e.color, 10);
          damage(s, s.player.x, s.player.y);
          if (s.isGameOver) { ctx.restore(); return; }
        }
      }
      for (let i = s.foeShots.length - 1; i >= 0; i--) {
        const f = s.foeShots[i];
        if (Math.hypot(s.player.x - f.x, s.player.y - f.y) < 16) {
          s.foeShots.splice(i, 1);
          damage(s, s.player.x, s.player.y);
          if (s.isGameOver) { ctx.restore(); return; }
        }
      }

      // ── Hạt ──
      s.particles.forEach((pt) => { pt.x += pt.vx; pt.y += pt.vy; pt.life -= 0.025; });
      s.particles = s.particles.filter((pt) => pt.life > 0);
      s.particles.forEach((pt) => {
        ctx.globalAlpha = pt.life * 0.9;
        ctx.fillStyle = pt.color;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, (pt.size || 2) * pt.life, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // ── Phi thuyền ──
      const px = s.player.x;
      const py = s.player.y;
      ctx.globalAlpha = s.player.invuln > 0 && Math.floor(s.player.invuln / 5) % 2 === 0 ? 0.4 : 1;

      if (s.player.shield) {
        ctx.strokeStyle = SHIELD_C;
        ctx.shadowColor = SHIELD_C;
        ctx.shadowBlur = 18;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(px, py, 28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = withAlpha(SHIELD_C, 0.08);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.shadowColor = pal.accent;
      ctx.shadowBlur = 18;
      const shipGrad = ctx.createLinearGradient(px, py - 18, px, py + 14);
      shipGrad.addColorStop(0, "#ffffff");
      shipGrad.addColorStop(0.4, shipBody);
      shipGrad.addColorStop(1, shade(pal.accent, -0.3));
      ctx.fillStyle = shipGrad;
      ctx.beginPath();
      ctx.moveTo(px, py - 20);
      ctx.lineTo(px - 16, py + 14);
      ctx.lineTo(px, py + 6);
      ctx.lineTo(px + 16, py + 14);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = withAlpha(pal.accent, 0.6);
      ctx.beginPath();
      ctx.ellipse(px, py - 6, 4, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      const flicker = 5 + Math.random() * 4;
      const thruster = ctx.createRadialGradient(px, py + 14, 2, px, py + 14, flicker);
      thruster.addColorStop(0, "#ffffff");
      thruster.addColorStop(0.4, "#FF2D55");
      thruster.addColorStop(1, "transparent");
      ctx.fillStyle = thruster;
      ctx.beginPath();
      ctx.arc(px, py + 14, flicker, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      updatePopups(s.popups);
      drawPopups(ctx, s.popups);

      if (s.flashAlpha > 0.01) {
        ctx.fillStyle = `rgba(255,255,255,${s.flashAlpha})`;
        ctx.fillRect(0, 0, W, H);
      }

      ctx.restore();

      // ── Đợt kế tiếp ──
      const wave = levelFor(GAME_ID, s.score);
      if (wave !== s.wave) {
        s.wave = wave;
        s.flashAlpha = 0.3;
        notify(`Đợt ${wave} · địch mạnh hơn`);
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => { stopped = true; cancelAnimationFrame(rafId); };
  }, [playBeep, playLose, onGameOver, paused, notify, syncHud]);

  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => syncHud(), 180);
    return () => clearInterval(id);
  }, [paused, syncHud]);

  useEffect(() => {
    const onKeyDown = (e) => { state.current.keys[e.key] = true; };
    const onKeyUp = (e) => { state.current.keys[e.key] = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const handleTouchMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * W;
    const y = ((touch.clientY - rect.top) / rect.height) * H;
    state.current.player.x = Math.max(16, Math.min(W - 16, x));
    state.current.player.y = Math.max(30, Math.min(H - 40, y));
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center">
      <ArcadeHud
        gameId={GAME_ID}
        score={hud.score}
        combo={hud.combo}
        multiplier={hud.mult}
        notice={hud.notice}
        stats={[
          { label: "Máu", value: "♥".repeat(hud.hp) || "—" },
          { label: "Súng", value: `Cấp ${hud.weapon}` },
        ]}
      />

      {hud.boss !== null && (
        <div className="svv-boss">
          <div className="svv-boss__top">
            <span>Trùm đợt {hud.wave}</span>
            <span>{hud.boss}%</span>
          </div>
          <div className="svv-boss__rail"><span style={{ width: `${hud.boss}%` }} /></div>
        </div>
      )}

      <div className="gpanel relative rounded-[26px] overflow-hidden p-1.5 touch-none">
        <canvas
          ref={canvasRef}
          onTouchMove={handleTouchMove}
          className="w-[280px] h-[420px] block rounded-[20px] cursor-crosshair"
        />
      </div>

      <p className="game-control-hint mt-3 text-center text-[11px]">
        Kéo ngón tay hoặc dùng W/A/S/D · Nhặt lõi vàng để lên cấp súng · Trúng đạn mất 1 máu và tụt 1 cấp súng
      </p>
    </div>
  );
}
