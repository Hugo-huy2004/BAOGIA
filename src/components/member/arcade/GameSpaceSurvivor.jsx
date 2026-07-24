import React, { useEffect, useRef, useState, useCallback } from "react";
import { useJoyStore } from "../../../stores/joyStore";
import { useArcadeSound } from "../../../hooks/useArcadeSound";
import { hapticMove, hapticMerge, hapticWin, hapticLose } from "../../../utils/haptics";
import confetti from "canvas-confetti";

export default function GameSpaceSurvivor({ difficulty = "medium", onGameOver }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [bossHealth, setBossHealth] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [powerUpText, setPowerUpText] = useState("");

  const { playBeep, playMove, playWin, playLose } = useArcadeSound();

  // Mutable Game State for 60fps RAF Loop
  const state = useRef({
    player: { x: 180, y: 440, w: 32, h: 36, speed: 6, shield: false, triple: false, tripleTimer: 0, shieldTimer: 0 },
    bullets: [],
    enemies: [],
    powerUps: [],
    particles: [],
    boss: null, // { x, y, w, h, hp, maxHp, dirX }
    score: 0,
    keys: {},
    lastSpawn: 0,
    isGameOver: false,
  });

  // ── Spawn Enemy ──────────────────────────────────────────────────────────
  const spawnEnemy = useCallback((canvasWidth) => {
    const s = state.current;
    if (s.boss) return; // Don't spawn normal minion swarms during Boss battle

    const types = ["drone", "seeker", "heavy"];
    const type = types[Math.floor(Math.random() * types.length)];
    const x = Math.random() * (canvasWidth - 40) + 20;

    s.enemies.push({
      x,
      y: -30,
      w: type === "heavy" ? 36 : 24,
      h: type === "heavy" ? 36 : 24,
      hp: type === "heavy" ? 4 : 1,
      speed: type === "drone" ? 3 : type === "seeker" ? 4 : 2,
      type,
      color: type === "drone" ? "#ef4444" : type === "seeker" ? "#f97316" : "#a855f7",
    });
  }, []);

  // ── Spawn Boss ───────────────────────────────────────────────────────────
  const spawnBoss = useCallback((canvasWidth) => {
    state.current.boss = {
      x: canvasWidth / 2 - 50,
      y: 40,
      w: 100,
      h: 60,
      hp: 60,
      maxHp: 60,
      dirX: 3,
    };
    setBossHealth(100);
    setPowerUpText("⚠️ TRÙM CUỐI PHI THUYỀN XUẤT HIỆN!");
    setTimeout(() => setPowerUpText(""), 2500);
  }, []);

  // ── Spawn Particle Explosion ─────────────────────────────────────────────
  const addExplosion = (x, y, color, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 4 + 1;
      state.current.particles.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 1,
        color,
      });
    }
  };

  // ── Main Game Loop ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    canvas.width = 360;
    canvas.height = 540;

    let rafId;

    const render = (ts) => {
      const s = state.current;
      if (s.isGameOver) return;

      // 1. Clear Canvas (Cosmic Deep Space)
      ctx.fillStyle = "#05060d";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Starfield Background
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      for (let i = 0; i < 20; i++) {
        const sx = (Math.sin(i * 99 + ts * 0.001) * 0.5 + 0.5) * canvas.width;
        const sy = (i * 30 + ts * 0.1) % canvas.height;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // 2. Player Movement Input
      if (s.keys.ArrowLeft || s.keys.a) s.player.x = Math.max(16, s.player.x - s.player.speed);
      if (s.keys.ArrowRight || s.keys.d) s.player.x = Math.min(canvas.width - 16, s.player.x + s.player.speed);
      if (s.keys.ArrowUp || s.keys.w) s.player.y = Math.max(30, s.player.y - s.player.speed);
      if (s.keys.ArrowDown || s.keys.s) s.player.y = Math.min(canvas.height - 40, s.player.y + s.player.speed);

      // Automatic Shooting Cannon
      if (ts - s.lastSpawn > 140) {
        s.lastSpawn = ts;
        playBeep();
        if (s.player.triple) {
          s.bullets.push({ x: s.player.x - 10, y: s.player.y - 15, vx: -1.5, vy: -10, color: "#06b6d4" });
          s.bullets.push({ x: s.player.x, y: s.player.y - 20, vx: 0, vy: -11, color: "#06b6d4" });
          s.bullets.push({ x: s.player.x + 10, y: s.player.y - 15, vx: 1.5, vy: -10, color: "#06b6d4" });
        } else {
          s.bullets.push({ x: s.player.x, y: s.player.y - 18, vx: 0, vy: -11, color: "#38bdf8" });
        }
      }

      // 3. Update & Draw Bullets
      s.bullets.forEach((b, idx) => {
        b.x += b.vx;
        b.y += b.vy;

        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x - 2, b.y - 8, 4, 12);
        ctx.shadowBlur = 0;
      });
      s.bullets = s.bullets.filter((b) => b.y > -20);

      // 4. Enemy Spawning Logic
      if (Math.random() < 0.04 && !s.boss) {
        spawnEnemy(canvas.width);
      }

      // Check Boss Spawn Condition (At Score >= 500)
      if (s.score >= 500 && !s.boss) {
        spawnBoss(canvas.width);
      }

      // 5. Update & Draw Boss
      if (s.boss) {
        const b = s.boss;
        b.x += b.dirX;
        if (b.x <= 20 || b.x + b.w >= canvas.width - 20) b.dirX *= -1;

        // Draw Boss Battleship
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 20;
        ctx.fillStyle = "#991b1b";
        ctx.beginPath();
        ctx.moveTo(b.x + b.w / 2, b.y + b.h);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(b.x + b.w, b.y);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Boss Turret Glow
        ctx.fillStyle = "#f87171";
        ctx.beginPath();
        ctx.arc(b.x + b.w / 2, b.y + b.h / 2, 14, 0, Math.PI * 2);
        ctx.fill();

        // Boss Shooting
        if (Math.random() < 0.05) {
          s.enemies.push({
            x: b.x + b.w / 2,
            y: b.y + b.h,
            w: 12, h: 12,
            hp: 1, speed: 5,
            type: "boss_bullet",
            color: "#ff3b30",
          });
        }
      }

      // 6. Update & Draw Enemies
      s.enemies.forEach((e) => {
        e.y += e.speed;

        ctx.shadowColor = e.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      s.enemies = s.enemies.filter((e) => e.y < canvas.height + 40);

      // 7. Update & Draw Power-ups
      s.powerUps.forEach((p) => {
        p.y += 2;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(p.label, p.x, p.y + 3);
      });
      s.powerUps = s.powerUps.filter((p) => p.y < canvas.height + 20);

      // 8. Bullet <-> Enemy / Boss Collision
      s.bullets.forEach((b, bIdx) => {
        // Bullet <-> Boss
        if (s.boss) {
          const boss = s.boss;
          if (b.x >= boss.x && b.x <= boss.x + boss.w && b.y >= boss.y && b.y <= boss.y + boss.h) {
            s.bullets.splice(bIdx, 1);
            boss.hp -= 1;
            setBossHealth(Math.round((boss.hp / boss.maxHp) * 100));
            addExplosion(b.x, b.y, "#f87171", 4);
            hapticMove();

            if (boss.hp <= 0) {
              addExplosion(boss.x + boss.w / 2, boss.y + boss.h / 2, "#fbbf24", 40);
              s.score += 2000;
              setScore(s.score);
              s.boss = null;
              setBossHealth(null);
              confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
              setPowerUpText("🎉 TIÊU DIỆT TRÙM CUỐI THÀNH CÔNG!");
              setTimeout(() => setPowerUpText(""), 3000);
            }
            return;
          }
        }

        // Bullet <-> Normal Enemy
        s.enemies.forEach((e, eIdx) => {
          const dist = Math.hypot(b.x - e.x, b.y - e.y);
          if (dist < e.w / 2 + 6) {
            s.bullets.splice(bIdx, 1);
            e.hp -= 1;
            addExplosion(e.x, e.y, e.color, 6);

            if (e.hp <= 0) {
              s.enemies.splice(eIdx, 1);
              s.score += e.type === "heavy" ? 150 : 50;
              setScore(s.score);
              hapticMerge();

              // Drop Power-up Item (20% chance)
              if (Math.random() < 0.22) {
                const isShield = Math.random() < 0.5;
                s.powerUps.push({
                  x: e.x, y: e.y,
                  type: isShield ? "shield" : "triple",
                  label: isShield ? "SHD" : "3X",
                  color: isShield ? "#38bdf8" : "#fbbf24",
                });
              }
            }
          }
        });
      });

      // 9. Player <-> Power-up Collision
      s.powerUps.forEach((p, pIdx) => {
        const dist = Math.hypot(s.player.x - p.x, s.player.y - p.y);
        if (dist < 24) {
          s.powerUps.splice(pIdx, 1);
          playWin();
          if (p.type === "triple") {
            s.player.triple = true;
            setPowerUpText("⚡ KÍCH HOẠT ĐẠN TRIPLE CANNON!");
          } else {
            s.player.shield = true;
            setPowerUpText("🛡️ KÍCH HOẠT KHÍ CẦU BẢO VỆ!");
          }
          setTimeout(() => setPowerUpText(""), 2000);
        }
      });

      // 10. Player <-> Enemy Collision (Damage & Game Over)
      s.enemies.forEach((e) => {
        const dist = Math.hypot(s.player.x - e.x, s.player.y - e.y);
        if (dist < e.w / 2 + 14) {
          if (s.player.shield) {
            s.player.shield = false;
            addExplosion(s.player.x, s.player.y, "#38bdf8", 20);
            e.hp = 0;
            setPowerUpText("🛡️ KHIÊN ĐÃ KÍCH NỔ VỠ!");
            setTimeout(() => setPowerUpText(""), 1500);
          } else {
            // Game Over
            s.isGameOver = true;
            setIsGameOver(true);
            addExplosion(s.player.x, s.player.y, "#ef4444", 30);
            playLose();
            hapticLose();

            const earnedJoy = Math.floor(s.score / 25);
            if (earnedJoy > 0) {
              useJoyStore.getState().setBalance(useJoyStore.getState().balance + earnedJoy);
            }
            onGameOver?.(s.score, s.score >= 500 ? "win" : "lose");
          }
        }
      });

      // 11. Update Particles
      s.particles.forEach((pt) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= 0.03;

        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.fillRect(pt.x, pt.y, 3, 3);
      });
      ctx.globalAlpha = 1;
      s.particles = s.particles.filter((pt) => pt.life > 0);

      // 12. Draw Player Cyber Jet
      const px = s.player.x;
      const py = s.player.y;

      // Shield Bubble
      if (s.player.shield) {
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 15;
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Cyber Jet Body
      ctx.shadowColor = "#06b6d4";
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(px, py - 18);
      ctx.lineTo(px - 14, py + 14);
      ctx.lineTo(px, py + 6);
      ctx.lineTo(px + 14, py + 14);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Thruster Flame Glow
      ctx.fillStyle = "#FF2D55";
      ctx.beginPath();
      ctx.arc(px, py + 12, 5 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [spawnEnemy, spawnBoss, playBeep, playWin, playLose, onGameOver]);

  // ── Keyboard Controls ───────────────────────────────────────────────────
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

  // ── Touch Movement Drag ─────────────────────────────────────────────────
  const handleTouchMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((touch.clientY - rect.top) / rect.height) * canvas.height;
    state.current.player.x = Math.max(16, Math.min(canvas.width - 16, x));
    state.current.player.y = Math.max(30, Math.min(canvas.height - 40, y));
  };

  return (
    <div className="flex flex-col items-center justify-center p-5 bg-[#080a14] text-white rounded-[32px] border border-rose-500/30 shadow-[0_0_50px_rgba(255,45,85,0.2)] max-w-sm mx-auto backdrop-blur-2xl">
      {/* Header Info */}
      <div className="flex items-center justify-between w-full mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shadow-[0_0_12px_#ff2d55]" />
          <div>
            <h2 className="text-base font-black tracking-wider bg-gradient-to-r from-rose-400 to-amber-300 bg-clip-text text-transparent uppercase font-sans">
              Space Survivor 3D
            </h2>
            <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block">Top-Down Laser Combat</span>
          </div>
        </div>

        <div className="bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-2xl text-right">
          <span className="text-[8px] font-bold text-rose-300 block uppercase tracking-wider">Điểm Số</span>
          <span className="text-lg font-black text-white font-mono">{score.toLocaleString("vi-VN")}</span>
        </div>
      </div>

      {/* Boss Health Bar (Only active during Boss Battle) */}
      {bossHealth !== null && (
        <div className="w-full mb-3 bg-red-950/80 border border-red-500/50 p-2 rounded-2xl backdrop-blur-md">
          <div className="flex items-center justify-between text-[10px] font-black text-rose-300 mb-1 px-1 uppercase tracking-wider">
            <span>🔴 TRÙM CUỐI PHI THUYỀN</span>
            <span>{bossHealth}% HP</span>
          </div>
          <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-rose-500/40">
            <div className="h-full bg-gradient-to-r from-rose-600 via-red-500 to-amber-400 transition-all duration-150" style={{ width: `${bossHealth}%` }} />
          </div>
        </div>
      )}

      {/* Dynamic Power-up Notification Text */}
      {powerUpText && (
        <div className="mb-2 text-[11px] font-black text-amber-300 bg-amber-500/20 border border-amber-400/40 px-3 py-1 rounded-full text-center animate-bounce shadow-md">
          {powerUpText}
        </div>
      )}

      {/* Main Canvas Grid */}
      <div className="relative border-2 border-rose-500/40 rounded-2xl overflow-hidden bg-[#05060d] p-1 shadow-[0_10px_30px_rgba(0,0,0,0.6)] touch-none">
        <canvas
          ref={canvasRef}
          onTouchMove={handleTouchMove}
          className="w-[280px] h-[420px] block rounded-xl cursor-crosshair"
        />
      </div>

      <p className="text-[10px] text-zinc-400 mt-3 font-mono text-center">
        💡 Kéo ngón tay trên màn hình hoặc dùng phím A/W/S/D để điều khiển phi thuyền.
      </p>
    </div>
  );
}
