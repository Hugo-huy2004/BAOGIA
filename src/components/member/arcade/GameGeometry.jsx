import React, { useEffect, useRef, useState } from "react";

const GOALS = { easy: 30, medium: 60, hard: 100 };

export default function GameGeometry({ difficulty, onGameOver }) {
  const canvasRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(3);
  const [playing, setPlaying] = useState(false);
  const progressRef = useRef(0);
  const reqRef = useRef(null);

  const state = useRef({
    player: { x: 50, y: 0, size: 24, vy: 0, isJumping: false, rotation: 0 },
    obstacles: [],
    particles: [],
    speed: difficulty === "hard" ? 8 : difficulty === "medium" ? 6.5 : 5,
    distance: 0,
    maxDistance: 10000,
    groundY: 0
  });

  // Generate level
  useEffect(() => {
    const s = state.current;
    let cursor = 500;
    while (cursor < s.maxDistance) {
      const type = Math.random() > 0.6 ? "block" : "spike";
      if (type === "spike") {
        s.obstacles.push({ x: cursor, width: 20, height: 30, type: "spike" });
        cursor += 200 + Math.random() * 200;
      } else {
        s.obstacles.push({ x: cursor, width: 30, height: 30, type: "block" });
        // Sometimes a spike after a block
        if (Math.random() > 0.5) {
          s.obstacles.push({ x: cursor + 30, width: 20, height: 30, type: "spike" });
        }
        cursor += 250 + Math.random() * 200;
      }
    }
  }, [difficulty]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setPlaying(true);
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
    s.groundY = height - 50;
    s.player.y = s.groundY - s.player.size;

    const spawnParticles = (x, y, color) => {
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 1;
        s.particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color
        });
      }
    };

    const rectIntersect = (r1, r2) => {
      return !(r2.x > r1.x + r1.w || 
               r2.x + r2.w < r1.x || 
               r2.y > r1.y + r1.h ||
               r2.y + r2.h < r1.y);
    };

    const loop = () => {
      ctx.fillStyle = "rgba(10, 10, 15, 1)";
      ctx.fillRect(0, 0, width, height);

      // Draw Grid / Background
      const bgOffset = s.distance % 40;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i - bgOffset, 0);
        ctx.lineTo(i - bgOffset, height);
        ctx.stroke();
      }

      // Physics
      s.distance += s.speed;
      s.player.vy += 0.8; // Gravity
      s.player.y += s.player.vy;

      if (s.player.y >= s.groundY - s.player.size) {
        s.player.y = s.groundY - s.player.size;
        s.player.vy = 0;
        s.player.isJumping = false;
        const r = s.player.rotation % 90;
        if (r !== 0) {
          s.player.rotation += (90 - r > r ? -r : 90 - r) * 0.2; // snap to 90deg
        }
      } else {
        s.player.rotation += 5;
      }

      const pRect = { x: s.player.x, y: s.player.y, w: s.player.size, h: s.player.size };

      // Draw Player
      ctx.save();
      ctx.translate(s.player.x + s.player.size / 2, s.player.y + s.player.size / 2);
      ctx.rotate((s.player.rotation * Math.PI) / 180);
      ctx.fillStyle = "#f472b6"; // Pink
      ctx.shadowColor = "#f9a8d4";
      ctx.shadowBlur = 15;
      ctx.fillRect(-s.player.size / 2, -s.player.size / 2, s.player.size, s.player.size);
      
      ctx.fillStyle = "#fff";
      ctx.fillRect(-s.player.size / 4, -s.player.size / 4, s.player.size / 2, s.player.size / 2);
      ctx.restore();

      // Update & Draw Obstacles
      for (let i = 0; i < s.obstacles.length; i++) {
        const obs = s.obstacles[i];
        const screenX = obs.x - s.distance;

        // Skip if off screen right
        if (screenX > width) break;
        // Skip if off screen left
        if (screenX + obs.width < 0) continue;

        ctx.save();
        if (obs.type === "block") {
          ctx.fillStyle = "#38bdf8"; // Sky blue
          ctx.shadowColor = "#7dd3fc";
          ctx.shadowBlur = 10;
          ctx.fillRect(screenX, s.groundY - obs.height, obs.width, obs.height);
          
          const oRect = { x: screenX, y: s.groundY - obs.height, w: obs.width, h: obs.height };
          if (rectIntersect(pRect, oRect)) {
            // Collision from top or side?
            // Simplified: any collision = death
            spawnParticles(s.player.x + s.player.size/2, s.player.y + s.player.size/2, "#f472b6");
            setPlaying(false);
            setTimeout(() => onGameOver(progressRef.current, progressRef.current >= GOALS[difficulty] ? "win" : "lose"), 1000);
            return;
          }
        } else {
          // Spike
          ctx.beginPath();
          ctx.moveTo(screenX + obs.width / 2, s.groundY - obs.height);
          ctx.lineTo(screenX + obs.width, s.groundY);
          ctx.lineTo(screenX, s.groundY);
          ctx.closePath();
          ctx.fillStyle = "#fbbf24"; // Amber
          ctx.shadowColor = "#fcd34d";
          ctx.shadowBlur = 10;
          ctx.fill();

          // Approximate triangle collision using a smaller rect
          const oRect = { x: screenX + obs.width/4, y: s.groundY - obs.height + 10, w: obs.width/2, h: obs.height - 10 };
          if (rectIntersect(pRect, oRect)) {
            spawnParticles(s.player.x + s.player.size/2, s.player.y + s.player.size/2, "#f472b6");
            setPlaying(false);
            setTimeout(() => onGameOver(progressRef.current, progressRef.current >= GOALS[difficulty] ? "win" : "lose"), 1000);
            return;
          }
        }
        ctx.restore();
      }

      // Update & Draw Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3; // gravity
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

      // Draw Ground
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, s.groundY, width, height - s.groundY);
      
      // Ground glow line
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 4;
      ctx.shadowColor = "#cbd5e1";
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.moveTo(0, s.groundY);
      ctx.lineTo(width, s.groundY);
      ctx.stroke();

      // Progress HUD
      const progress = Math.min(100, Math.floor((s.distance / s.maxDistance) * 100));
      progressRef.current = progress;
      
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`PROGRESS: ${progress}%`, width / 2, 40);
      
      // Progress bar
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(width/2 - 100, 60, 200, 4);
      ctx.fillStyle = "#f472b6";
      ctx.fillRect(width/2 - 100, 60, progress * 2, 4);

      if (progress >= 100) {
        setPlaying(false);
        setTimeout(() => onGameOver(100, "win"), 1000);
        return;
      }

      if (playing) {
        reqRef.current = requestAnimationFrame(loop);
      }
    };

    reqRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqRef.current);
  }, [playing, difficulty, onGameOver]);

  const handleJump = () => {
    if (!playing) return;
    const s = state.current;
    if (!s.player.isJumping) {
      s.player.vy = -12;
      s.player.isJumping = true;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playing]);

  return (
    <div className="arcade-game-container relative w-full max-w-2xl aspect-video mx-auto bg-zinc-950 rounded-xl overflow-hidden shadow-2xl border border-white/10 touch-none">
      {!playing && timeLeft > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <span className="text-white text-6xl font-bold animate-ping">{timeLeft}</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer touch-none"
        onPointerDown={handleJump}
      />
    </div>
  );
}
