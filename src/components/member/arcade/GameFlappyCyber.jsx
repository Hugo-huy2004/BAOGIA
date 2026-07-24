import React, { useEffect, useRef, useState, useCallback } from "react";
import { useJoyStore } from "../../../stores/joyStore";
import { useArcadeSound } from "../../../hooks/useArcadeSound";
import { hapticMove, hapticMerge, hapticWin, hapticLose } from "../../../utils/haptics";
import confetti from "canvas-confetti";

export default function GameFlappyCyber({ difficulty = "medium", onGameOver }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isSlowMo, setIsSlowMo] = useState(false);

  const { playBeep, playMove, playWin, playLose } = useArcadeSound();

  const state = useRef({
    bird: { x: 80, y: 220, radius: 14, vy: 0, gravity: 0.45, jump: -7.5 },
    pipes: [],
    slowOrbs: [],
    particles: [],
    score: 0,
    slowMoTimer: 0,
    isGameOver: false,
  });

  // ── Spawn Electromagnetic Energy Pipe ──────────────────────────────────
  const spawnPipe = useCallback((canvasWidth, canvasHeight) => {
    const gapHeight = 120;
    const minHeight = 50;
    const maxHeight = canvasHeight - gapHeight - minHeight;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;

    state.current.pipes.push({
      x: canvasWidth + 30,
      width: 44,
      topHeight,
      bottomY: topHeight + gapHeight,
      passed: false,
    });

    // 15% Chance to spawn Slow-Mo Chrono Orb in the gap
    if (Math.random() < 0.25) {
      state.current.slowOrbs.push({
        x: canvasWidth + 50,
        y: topHeight + gapHeight / 2,
        radius: 10,
      });
    }
  }, []);

  // ── Flap Action ──────────────────────────────────────────────────────────
  const handleFlap = useCallback(() => {
    if (state.current.isGameOver) return;
    state.current.bird.vy = state.current.bird.jump;
    playBeep();
    hapticMove();
  }, [playBeep]);

  // ── Main Canvas Engine Loop ──────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    canvas.width = 340;
    canvas.height = 480;

    let rafId;
    let spawnCounter = 0;

    const renderFrame = () => {
      const s = state.current;
      if (s.isGameOver) return;

      const speedMult = s.slowMoTimer > 0 ? 0.5 : 1.0;
      if (s.slowMoTimer > 0) s.slowMoTimer -= 1;
      setIsSlowMo(s.slowMoTimer > 0);

      // 1. Background
      ctx.fillStyle = "#05060f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid Perspective Lines
      ctx.strokeStyle = "rgba(168, 85, 247, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.height; i += 30) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
      }

      // 2. Physics Update
      s.bird.vy += s.bird.gravity * speedMult;
      s.bird.y += s.bird.vy * speedMult;

      // Add Jet Engine Particle Trail
      s.particles.push({
        x: s.bird.x - 10,
        y: s.bird.y,
        vx: -Math.random() * 2 - 1,
        vy: (Math.random() - 0.5) * 1.5,
        life: 1,
        color: s.slowMoTimer > 0 ? "#06b6d4" : "#a855f7",
      });

      // 3. Pipe Spawning & Movement
      spawnCounter += 1 * speedMult;
      if (spawnCounter > 90) {
        spawnCounter = 0;
        spawnPipe(canvas.width, canvas.height);
      }

      s.pipes.forEach((p) => {
        p.x -= 2.6 * speedMult;

        // Draw Top Energy Column
        ctx.shadowColor = "#a855f7";
        ctx.shadowBlur = 12;
        const topGrad = ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
        topGrad.addColorStop(0, "#7e22ce");
        topGrad.addColorStop(0.5, "#c084fc");
        topGrad.addColorStop(1, "#581c87");

        ctx.fillStyle = topGrad;
        ctx.fillRect(p.x, 0, p.width, p.topHeight);

        // Draw Bottom Energy Column
        ctx.fillRect(p.x, p.bottomY, p.width, canvas.height - p.bottomY);
        ctx.shadowBlur = 0;

        // Draw Electric Arc Highlight Borders
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, p.topHeight - 6, p.width, 6);
        ctx.strokeRect(p.x, p.bottomY, p.width, 6);

        // Score Check
        if (!p.passed && p.x + p.width < s.bird.x) {
          p.passed = true;
          s.score += 1;
          setScore(s.score);
          playMove();
          hapticMerge();
        }
      });
      s.pipes = s.pipes.filter((p) => p.x + p.width > -20);

      // 4. Slow-Mo Chrono Orbs
      s.slowOrbs.forEach((o, oIdx) => {
        o.x -= 2.6 * speedMult;

        ctx.shadowColor = "#06b6d4";
        ctx.shadowBlur = 15;
        ctx.fillStyle = "#06b6d4";
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Orb Picked Up
        const dist = Math.hypot(s.bird.x - o.x, s.bird.y - o.y);
        if (dist < s.bird.radius + o.radius) {
          s.slowOrbs.splice(oIdx, 1);
          s.slowMoTimer = 180; // 3 Seconds Slow-Mo
          playWin();
        }
      });
      s.slowOrbs = s.slowOrbs.filter((o) => o.x > -20);

      // 5. Update Jet Trail Particles
      s.particles.forEach((pt) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= 0.04;

        ctx.fillStyle = pt.color;
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.fillRect(pt.x, pt.y, 3, 3);
      });
      ctx.globalAlpha = 1;
      s.particles = s.particles.filter((pt) => pt.life > 0);

      // 6. Draw Cyber Bird
      ctx.save();
      ctx.translate(s.bird.x, s.bird.y);
      const angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, s.bird.vy * 0.08));
      ctx.rotate(angle);

      ctx.shadowColor = s.slowMoTimer > 0 ? "#06b6d4" : "#a855f7";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, s.bird.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Cyber Visor Eye
      ctx.fillStyle = s.slowMoTimer > 0 ? "#06b6d4" : "#ff2d55";
      ctx.fillRect(2, -4, 8, 4);
      ctx.restore();

      // 7. Collision Check (Ceiling/Floor/Pipes)
      if (s.bird.y - s.bird.radius < 0 || s.bird.y + s.bird.radius > canvas.height) {
        s.isGameOver = true;
      }
      s.pipes.forEach((p) => {
        if (s.bird.x + s.bird.radius > p.x && s.bird.x - s.bird.radius < p.x + p.width) {
          if (s.bird.y - s.bird.radius < p.topHeight || s.bird.y + s.bird.radius > p.bottomY) {
            s.isGameOver = true;
          }
        }
      });

      if (s.isGameOver) {
        setIsGameOver(true);
        playLose();
        hapticLose();
        const earnedJoy = Math.floor(s.score * 5);
        if (earnedJoy > 0) {
          useJoyStore.getState().setBalance(useJoyStore.getState().balance + earnedJoy);
        }
        onGameOver?.(s.score, s.score >= 10 ? "win" : "lose");
        return;
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, [spawnPipe, playBeep, playMove, playWin, playLose, onGameOver]);

  // Keyboard Spacebar / Up Arrow Flap
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w") {
        e.preventDefault();
        handleFlap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleFlap]);

  return (
    <div className="flex flex-col items-center justify-center p-5 bg-[#080a14] text-white rounded-[32px] border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.2)] max-w-sm mx-auto backdrop-blur-2xl">
      {/* Header Info */}
      <div className="flex items-center justify-between w-full mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse shadow-[0_0_12px_#a855f7]" />
          <div>
            <h2 className="text-base font-black tracking-wider bg-gradient-to-r from-purple-400 to-cyan-300 bg-clip-text text-transparent uppercase font-sans">
              Flappy Cyber
            </h2>
            <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block">Electromagnetic Flight</span>
          </div>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-2xl text-right">
          <span className="text-[8px] font-bold text-purple-300 block uppercase tracking-wider">Cột Đã Vượt</span>
          <span className="text-lg font-black text-white font-mono">{score}</span>
        </div>
      </div>

      {/* Slow-Mo Active Indicator */}
      {isSlowMo && (
        <div className="mb-2 text-[10px] font-black text-cyan-300 bg-cyan-500/20 border border-cyan-400/40 px-3 py-1 rounded-full text-center animate-pulse">
          ⚡ SLOW-MOTION TIME DILATION ACTIVE!
        </div>
      )}

      {/* Main Canvas Grid */}
      <div
        onClick={handleFlap}
        className="relative border-2 border-purple-500/40 rounded-2xl overflow-hidden bg-[#05060f] p-1 shadow-[0_10px_30px_rgba(0,0,0,0.6)] cursor-pointer touch-none"
      >
        <canvas ref={canvasRef} className="w-[280px] h-[400px] block rounded-xl" />
      </div>

      <button
        onClick={handleFlap}
        className="w-full mt-4 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-white/20 rounded-2xl font-black text-xs uppercase tracking-wider active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-lg">flight_takeoff</span> CHẠM MÀN HÌNH ĐỂ BAY
      </button>
    </div>
  );
}
