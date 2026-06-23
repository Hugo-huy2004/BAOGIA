import React, { useEffect, useRef, useState } from "react";

const GOALS = { easy: 30, medium: 60, hard: 90 };

export default function GameSurvivor({ difficulty, onGameOver }) {
  const canvasRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(3);
  const [playing, setPlaying] = useState(false);
  const scoreRef = useRef(0);
  const reqRef = useRef(null);
  // Virtual D-pad state for touch — buttons nudge the same `target` point
  // that pointer-drag already steers toward, so both input methods just work.
  const controlsRef = useRef({ up: false, down: false, left: false, right: false });

  // Engine state
  const state = useRef({
    player: { x: 200, y: 200, radius: 8, vx: 0, vy: 0 },
    target: { x: 200, y: 200 },
    bullets: [],
    particles: [],
    startTime: 0,
    lastSpawn: 0,
    spawnRate: difficulty === "hard" ? 100 : difficulty === "medium" ? 200 : 300,
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

    state.current.player.x = width / 2;
    state.current.player.y = height / 2;
    state.current.target.x = width / 2;
    state.current.target.y = height / 2;

    const s = state.current;

    const spawnBullet = () => {
      const edge = Math.floor(Math.random() * 4);
      let x, y, vx, vy;
      const speed = difficulty === "hard" ? 5 : difficulty === "medium" ? 3.5 : 2.5;

      if (edge === 0) { x = Math.random() * width; y = -10; vx = (Math.random() - 0.5) * speed; vy = speed; }
      else if (edge === 1) { x = width + 10; y = Math.random() * height; vx = -speed; vy = (Math.random() - 0.5) * speed; }
      else if (edge === 2) { x = Math.random() * width; y = height + 10; vx = (Math.random() - 0.5) * speed; vy = -speed; }
      else { x = -10; y = Math.random() * height; vx = speed; vy = (Math.random() - 0.5) * speed; }

      // "Homing" logic for hard mode
      if (difficulty === "hard" && Math.random() > 0.5) {
        const dx = s.player.x - x;
        const dy = s.player.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        vx = (dx / dist) * speed;
        vy = (dy / dist) * speed;
      }

      s.bullets.push({ x, y, vx, vy, radius: 4 + Math.random() * 3, color: `hsl(${Math.random() * 360}, 100%, 60%)` });
    };

    const spawnParticles = (cx, cy, color) => {
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        s.particles.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color
        });
      }
    };

    const loop = () => {
      const now = Date.now();
      const elapsed = (now - s.startTime) / 1000;
      scoreRef.current = Math.floor(elapsed);

      // Spawn
      if (now - s.lastSpawn > s.spawnRate) {
        spawnBullet();
        s.lastSpawn = now;
        // Increase difficulty over time
        if (s.spawnRate > 50) s.spawnRate -= 1;
      }

      // Clear with trail effect
      ctx.fillStyle = "rgba(10, 10, 15, 0.3)";
      ctx.fillRect(0, 0, width, height);

      // Virtual D-pad — nudges the target point continuously while held
      const dpad = controlsRef.current;
      const padSpeed = 5.5;
      if (dpad.up) s.target.y -= padSpeed;
      if (dpad.down) s.target.y += padSpeed;
      if (dpad.left) s.target.x -= padSpeed;
      if (dpad.right) s.target.x += padSpeed;
      s.target.x = Math.max(0, Math.min(width, s.target.x));
      s.target.y = Math.max(0, Math.min(height, s.target.y));

      // Player Movement (lerp towards target)
      s.player.x += (s.target.x - s.player.x) * 0.15;
      s.player.y += (s.target.y - s.player.y) * 0.15;

      // Bound player
      s.player.x = Math.max(s.player.radius, Math.min(width - s.player.radius, s.player.x));
      s.player.y = Math.max(s.player.radius, Math.min(height - s.player.radius, s.player.y));

      // Draw Player
      ctx.save();
      ctx.beginPath();
      ctx.arc(s.player.x, s.player.y, s.player.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "#0ea5e9";
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.closePath();
      ctx.restore();

      // Update & Draw Bullets
      for (let i = s.bullets.length - 1; i >= 0; i--) {
        const b = s.bullets[i];
        b.x += b.vx;
        b.y += b.vy;

        ctx.save();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.closePath();
        ctx.restore();

        // Collision
        const dx = b.x - s.player.x;
        const dy = b.y - s.player.y;
        if (Math.sqrt(dx * dx + dy * dy) < b.radius + s.player.radius - 2) { // 2px forgiveness
          // Game Over
          spawnParticles(s.player.x, s.player.y, "#fff");
          setPlaying(false);
          const score = scoreRef.current;
          setTimeout(() => {
            onGameOver(score, score >= GOALS[difficulty] ? "win" : "lose");
          }, 1000);
          return;
        }

        if (b.x < -50 || b.x > width + 50 || b.y < -50 || b.y > height + 50) {
          s.bullets.splice(i, 1);
        }
      }

      // Update & Draw Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;

        if (p.life <= 0) {
          s.particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.closePath();
        ctx.restore();
      }

      // Draw Score
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.font = "bold 120px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(scoreRef.current.toString(), width / 2, height / 2);

      if (playing) {
        reqRef.current = requestAnimationFrame(loop);
      }
    };

    reqRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqRef.current);
  }, [playing, difficulty, onGameOver]);

  const handlePointerMove = (e) => {
    if (!playing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    state.current.target.x = e.clientX - rect.left;
    state.current.target.y = e.clientY - rect.top;
  };

  const press = (dir, val) => (e) => { e.preventDefault(); controlsRef.current[dir] = val; };

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      <div className="arcade-game-container relative w-full aspect-square bg-zinc-950 rounded-xl overflow-hidden shadow-2xl border border-white/10 touch-none">
        {!playing && timeLeft > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <span className="text-white text-6xl font-bold animate-ping">{timeLeft}</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair touch-none"
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerMove}
        />
      </div>

      {/* Virtual D-pad — the canvas alone needs a precise drag to steer, which
          is fiddly on a phone; these give a thumb-friendly alternative. */}
      <div className="arcade-dpad">
        <div />
        <button className="arcade-dpad-btn" onPointerDown={press("up", true)} onPointerUp={press("up", false)} onPointerLeave={press("up", false)}>
          ▲
        </button>
        <div />
        <button className="arcade-dpad-btn" onPointerDown={press("left", true)} onPointerUp={press("left", false)} onPointerLeave={press("left", false)}>
          ◀
        </button>
        <div className="arcade-dpad-center" />
        <button className="arcade-dpad-btn" onPointerDown={press("right", true)} onPointerUp={press("right", false)} onPointerLeave={press("right", false)}>
          ▶
        </button>
        <div />
        <button className="arcade-dpad-btn" onPointerDown={press("down", true)} onPointerUp={press("down", false)} onPointerLeave={press("down", false)}>
          ▼
        </button>
        <div />
      </div>
    </div>
  );
}
