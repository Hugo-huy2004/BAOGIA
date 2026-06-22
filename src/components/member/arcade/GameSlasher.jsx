import React, { useEffect, useRef, useState } from "react";

const GOALS = { easy: 50, medium: 150, hard: 300 };

export default function GameSlasher({ difficulty, onGameOver }) {
  const canvasRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(3);
  const [playing, setPlaying] = useState(false);
  const scoreRef = useRef(0);
  const reqRef = useRef(null);

  const state = useRef({
    targets: [],
    particles: [],
    trail: [],
    lastSpawn: 0,
    startTime: 0,
    isDragging: false,
    combo: 0,
    lastSlashTime: 0,
    lives: 3
  });

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setPlaying(true);
      state.current.startTime = Date.now();
      state.current.lastSpawn = Date.now();
    }
  }, [timeLeft]);

  useEffect(() => {
    if (!playing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    const s = state.current;

    const FRUITS = ["🍉", "🍊", "🍎", "🍍", "🥝", "🥥"];

    const spawnTarget = () => {
      const isBomb = difficulty === "easy" ? Math.random() > 0.9 : Math.random() > 0.7;
      const x = 50 + Math.random() * (width - 100);
      const y = height + 50;
      const vx = (Math.random() - 0.5) * 4;
      const vy = -(12 + Math.random() * 4 + (difficulty === "hard" ? 3 : 0));
      
      s.targets.push({
        x, y, vx, vy,
        radius: 80,
        type: isBomb ? "bomb" : "fruit",
        emoji: isBomb ? "💣" : FRUITS[Math.floor(Math.random() * FRUITS.length)],
        active: true,
        rotation: 0,
        vr: (Math.random() - 0.5) * 0.2
      });
    };

    const spawnParticles = (x, y, color) => {
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        s.particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color
        });
      }
    };

    const lineIntersectCircle = (x1, y1, x2, y2, cx, cy, r) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const l2 = dx * dx + dy * dy;
      if (l2 === 0) return (x1 - cx) * (x1 - cx) + (y1 - cy) * (y1 - cy) <= r * r;
      let t = ((cx - x1) * dx + (cy - y1) * dy) / l2;
      t = Math.max(0, Math.min(1, t));
      const px = x1 + t * dx;
      const py = y1 + t * dy;
      return (cx - px) * (cx - px) + (cy - py) * (cy - py) <= r * r;
    };

    const loop = () => {
      const now = Date.now();
      
      // Spawn logic
      if (now - s.lastSpawn > (difficulty === "hard" ? 800 : 1200)) {
        const count = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < count; i++) spawnTarget();
        s.lastSpawn = now;
      }

      ctx.fillStyle = "rgba(10, 10, 15, 1)";
      ctx.fillRect(0, 0, width, height);

      // Gravity
      const G = 0.3;

      // Update & Draw Targets
      for (let i = s.targets.length - 1; i >= 0; i--) {
        const t = s.targets[i];
        t.x += t.vx;
        t.y += t.vy;
        t.vy += G;
        t.rotation += t.vr;

        if (t.active) {
          ctx.save();
          ctx.translate(t.x, t.y);
          ctx.rotate(t.rotation);
          
          if (t.type === "fruit") {
            ctx.font = "100px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(t.emoji, 0, 0);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, t.radius - 20, 0, Math.PI * 2);
            ctx.fillStyle = "#ef4444"; // Red bg for bomb glow
            ctx.shadowColor = "#f87171";
            ctx.shadowBlur = 20;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.font = "100px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(t.emoji, 0, 0);
          }
          ctx.restore();
        }

        // Missed fruit -> minus life in hard/medium?
        if (t.y > height + 100 && t.active && t.type === "fruit") {
          s.combo = 0;
          if (difficulty !== "easy") {
             s.lives--;
             if (s.lives <= 0) {
               setPlaying(false);
               setTimeout(() => onGameOver(scoreRef.current, scoreRef.current >= GOALS[difficulty] ? "win" : "lose"), 1000);
               return;
             }
          }
          s.targets.splice(i, 1);
        } else if (t.y > height + 100) {
          s.targets.splice(i, 1);
        }
      }

      // Update & Draw Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += G * 0.5;
        p.life -= 0.02;

        if (p.life <= 0) {
          s.particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.restore();
      }

      // Draw Trail
      if (s.trail.length > 1) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(s.trail[0].x, s.trail[0].y);
        for (let i = 1; i < s.trail.length; i++) {
          ctx.lineTo(s.trail[i].x, s.trail[i].y);
        }
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 4;
        ctx.shadowColor = "#22d3ee"; // Cyan
        ctx.shadowBlur = 15;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.restore();
        
        // Slash logic
        for (let j = 0; j < s.trail.length - 1; j++) {
          const p1 = s.trail[j];
          const p2 = s.trail[j + 1];
          for (let i = 0; i < s.targets.length; i++) {
            const t = s.targets[i];
            if (t.active && lineIntersectCircle(p1.x, p1.y, p2.x, p2.y, t.x, t.y, t.radius + 15)) {
              t.active = false;
              if (t.type === "bomb") {
                spawnParticles(t.x, t.y, "#ef4444");
                s.combo = 0;
                s.lives--;
                if (s.lives <= 0) {
                  setPlaying(false);
                  setTimeout(() => onGameOver(scoreRef.current, scoreRef.current >= GOALS[difficulty] ? "win" : "lose"), 1000);
                  return;
                }
              } else {
                spawnParticles(t.x, t.y, "#34d399");
                if (now - s.lastSlashTime < 500) s.combo++;
                else s.combo = 1;
                s.lastSlashTime = now;
                scoreRef.current += 1 + Math.floor(s.combo / 3);
              }
            }
          }
        }
      }

      // Shrink trail
      if (s.trail.length > 0) {
        s.trail.shift();
      }

      // HUD
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.font = "bold 60px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(scoreRef.current.toString(), width / 2, Math.max(100, height / 2));
      
      // Lives
      ctx.fillStyle = "#ef4444";
      ctx.font = "24px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("❤️".repeat(s.lives), 20, 40);

      if (playing) {
        reqRef.current = requestAnimationFrame(loop);
      }
    };

    reqRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqRef.current);
  }, [playing, difficulty, onGameOver]);

  const getCoords = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  const handlePointerMove = (e) => {
    if (!playing) return;
    if (e.type.includes("mouse") && e.buttons === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { clientX, clientY } = getCoords(e);
    
    state.current.trail.push({
      x: clientX - rect.left,
      y: clientY - rect.top
    });
    if (state.current.trail.length > 10) state.current.trail.shift();
  };

  const handlePointerDown = (e) => {
    if (!playing) return;
    state.current.trail = [];
    handlePointerMove(e);
  };

  const handlePointerUp = () => {
    state.current.trail = [];
  };

  return (
    <div className="arcade-game-container relative w-full max-w-lg aspect-[3/4] mx-auto bg-zinc-950 rounded-xl overflow-hidden shadow-2xl border border-white/10 touch-none">
      {!playing && timeLeft > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <span className="text-white text-6xl font-bold animate-ping">{timeLeft}</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onTouchCancel={handlePointerUp}
      />
    </div>
  );
}
