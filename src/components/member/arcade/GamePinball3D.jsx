import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useArcadeSound } from '../../../hooks/useArcadeSound';
import { submitScore } from '../../../services/arcadeApi';
import { triggerHaptic } from '../../../utils/haptics';

export default function GamePinball3D({ onScoreSubmit, onClose }) {
  const { t } = useTranslation();
  const sound = useArcadeSound();
  const canvasRef = useRef(null);

  const [score, setScore] = useState(0);
  const [earnedJoy, setEarnedJoy] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [ballsLeft, setBallsLeft] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [chargingPower, setChargingPower] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const chargeIntervalRef = useRef(null);

  // Clean Physics Engine State
  const stateRef = useRef({
    ball: { x: 325, y: 470, vx: 0, vy: 0, radius: 9, active: false, speed: 0 },
    flippers: {
      leftAngle: 0.3, rightAngle: -0.3,
      leftTarget: 0.3, rightTarget: -0.3,
      leftVel: 0, rightVel: 0
    },
    // 3 Sleek Metallic Glass Bumpers
    bumpers: [
      { x: 135, y: 140, r: 24, pts: 100, color: '#ec4899', hitTimer: 0 },
      { x: 205, y: 110, r: 26, pts: 250, color: '#06b6d4', hitTimer: 0 },
      { x: 100, y: 220, r: 22, pts: 150, color: '#f59e0b', hitTimer: 0 }
    ],
    // Clean Side Drop Targets
    targets: [
      { x: 45, y: 170, w: 10, h: 30, hit: false, color: '#a855f7' },
      { x: 275, y: 170, w: 10, h: 30, hit: false, color: '#a855f7' }
    ],
    particles: [],
    shockwaves: [],
    score: 0,
    mult: 1,
    ballsLeft: 3
  });

  // Plunger Charge Handler
  const startCharging = () => {
    if (stateRef.current.ball.active || stateRef.current.ballsLeft <= 0 || isCharging) return;
    setIsCharging(true);
    triggerHaptic('light');

    let p = 0;
    chargeIntervalRef.current = setInterval(() => {
      p += 5;
      if (p > 100) p = 100;
      setChargingPower(p);
    }, 20);
  };

  const releaseAndLaunch = () => {
    if (!isCharging) return;
    clearInterval(chargeIntervalRef.current);
    setIsCharging(false);

    const powerRatio = Math.max(0.2, chargingPower / 100);
    const launchVy = -(16 + powerRatio * 22); // Fast launch velocity from -16 to -38
    const launchVx = (Math.random() - 0.5) * 2;

    sound.playPowerup?.();
    triggerHaptic('medium');

    stateRef.current.ball = {
      x: 325,
      y: 460,
      vx: launchVx,
      vy: launchVy,
      radius: 9,
      active: true,
      speed: Math.hypot(launchVx, launchVy)
    };
    setChargingPower(0);
  };

  const setLeftFlipper = (down) => {
    stateRef.current.flippers.leftTarget = down ? -0.45 : 0.3;
    if (down) {
      sound.playClick?.();
      triggerHaptic('light');
    }
  };

  const setRightFlipper = (down) => {
    stateRef.current.flippers.rightTarget = down ? 0.45 : -0.3;
    if (down) {
      sound.playClick?.();
      triggerHaptic('light');
    }
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.repeat) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setLeftFlipper(true);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setRightFlipper(true);
      } else if (e.key === ' ' || e.key === 'ArrowUp') {
        startCharging();
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setLeftFlipper(false);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setRightFlipper(false);
      } else if (e.key === ' ' || e.key === 'ArrowUp') {
        releaseAndLaunch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(chargeIntervalRef.current);
    };
  }, [isCharging, chargingPower]);

  // Main 60FPS Clean Physics Engine Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const spawnImpactEffects = (x, y, color) => {
      stateRef.current.shockwaves.push({ x, y, r: 4, maxR: 28, alpha: 1, color });

      for (let i = 0; i < 12; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = Math.random() * 7 + 2;
        stateRef.current.particles.push({
          x, y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          size: Math.random() * 3 + 1.5,
          color,
          alpha: 1,
          life: 25
        });
      }
    };

    const gameLoop = () => {
      const state = stateRef.current;
      const b = state.ball;
      const f = state.flippers;

      // Update Flipper Rotational Velocities
      const prevLeft = f.leftAngle;
      const prevRight = f.rightAngle;
      f.leftAngle += (f.leftTarget - f.leftAngle) * 0.45;
      f.rightAngle += (f.rightTarget - f.rightAngle) * 0.45;
      f.leftVel = f.leftAngle - prevLeft;
      f.rightVel = f.rightAngle - prevRight;

      // 4 Sub-steps per frame for fast, ultra-precise physics (no tunneling)
      const SUB_STEPS = 4;
      if (b.active) {
        for (let step = 0; step < SUB_STEPS; step++) {
          b.vy += 0.22 / SUB_STEPS; // Strong realistic slope gravity pull
          b.x += b.vx / SUB_STEPS;
          b.y += b.vy / SUB_STEPS;

          b.vx *= Math.pow(0.994, 1 / SUB_STEPS);
          b.vy *= Math.pow(0.994, 1 / SUB_STEPS);
          b.speed = Math.hypot(b.vx, b.vy);

          // Left Outer Rail
          if (b.x - b.radius < 26) {
            b.x = 26 + b.radius;
            b.vx = Math.abs(b.vx) * 0.85;
            sound.playPop?.();
          }

          // Right Outer Rail (Left of Plunger Lane)
          if (b.x > 300 && b.y > 140 && b.vx > 0) {
            if (b.x - b.radius < 300) {
              b.x = 300 - b.radius;
              b.vx = -Math.abs(b.vx) * 0.85;
            }
          }

          // Top Arch Rail
          if (b.y - b.radius < 35) {
            b.y = 35 + b.radius;
            b.vy = Math.abs(b.vy) * 0.85;
            sound.playPop?.();
          }

          // Top Bumper Physics & Elastic Shock Impulse
          state.bumpers.forEach((bmp) => {
            if (bmp.hitTimer > 0) bmp.hitTimer--;
            const dx = b.x - bmp.x;
            const dy = b.y - bmp.y;
            const dist = Math.hypot(dx, dy);
            if (dist < b.radius + bmp.r) {
              const angle = Math.atan2(dy, dx);
              const kick = 15; // Fast active spring reflection
              b.vx = Math.cos(angle) * kick;
              b.vy = Math.sin(angle) * kick;
              bmp.hitTimer = 12;

              const addPts = bmp.pts * state.mult;
              state.score += addPts;
              setScore(state.score);
              setEarnedJoy(Math.floor(state.score / 50));

              spawnImpactEffects(bmp.x, bmp.y, bmp.color);
              sound.playBonus?.();
              triggerHaptic('medium');
            }
          });

          // Side Drop Target Collisions
          state.targets.forEach((tgt) => {
            if (b.x + b.radius > tgt.x && b.x - b.radius < tgt.x + tgt.w &&
                b.y + b.radius > tgt.y && b.y - b.radius < tgt.y + tgt.h) {
              b.vx = -b.vx * 1.1;
              tgt.hit = true;
              state.mult = 2;
              setMultiplier(2);
              spawnImpactEffects(tgt.x, tgt.y, tgt.color);
              sound.playPowerup?.();
              triggerHaptic('success');
            }
          });

          // Angular Flipper Physics Collision
          const handleFlipperPhysics = (hingeX, hingeY, angle, length, isLeft) => {
            const armDx = (isLeft ? 1 : -1) * Math.cos(angle) * length;
            const armDy = Math.sin(angle) * length;

            const l2 = armDx * armDx + armDy * armDy;
            let t = ((b.x - hingeX) * armDx + (b.y - hingeY) * armDy) / l2;
            t = Math.max(0, Math.min(1, t));

            const projX = hingeX + t * armDx;
            const projY = hingeY + t * armDy;
            const dist = Math.hypot(b.x - projX, b.y - projY);

            if (dist < b.radius + 6) {
              const flipperVel = (isLeft ? f.leftVel : f.rightVel) * t * length * 9;
              const normalX = (b.x - projX) / dist;
              const normalY = (b.y - projY) / dist;

              b.vx = normalX * (12 + Math.abs(flipperVel));
              b.vy = normalY * (12 + Math.abs(flipperVel)) - 10; // Upward impulse

              sound.playClick?.();
              triggerHaptic('light');
            }
          };

          handleFlipperPhysics(75, 460, f.leftAngle, 72, true);
          handleFlipperPhysics(255, 460, f.rightAngle, 72, false);

          // Drain Out of Bounds (Center Drain & Side Outlane Gutters)
          if (b.y > 540) {
            b.active = false;
            state.ballsLeft -= 1;
            setBallsLeft(state.ballsLeft);
            sound.playLose?.();
            triggerHaptic('warning');

            if (state.ballsLeft <= 0) {
              setGameOver(true);
            }
            break;
          }
        }
      }

      // Update Particles & Shockwaves
      state.particles = state.particles.filter(p => p.life > 0);
      state.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.alpha = p.life / 25;
      });

      state.shockwaves = state.shockwaves.filter(sw => sw.alpha > 0);
      state.shockwaves.forEach(sw => {
        sw.r += 1.8;
        sw.alpha -= 0.06;
      });

      // Canvas Rendering (Clean iOS 27 Liquid Glass Aesthetics)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dark Obsidian Glass Canvas Background
      const bg = ctx.createLinearGradient(0, 0, 0, 520);
      bg.addColorStop(0, '#060a12');
      bg.addColorStop(0.5, '#0b1322');
      bg.addColorStop(1, '#030710');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle Cyber Grid Overlay
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 340; x += 25) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 520); ctx.stroke();
      }
      for (let y = 0; y < 520; y += 25) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(340, y); ctx.stroke();
      }

      // Clean Outer Glass Rails
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(26, 510);
      ctx.lineTo(26, 75);
      ctx.arcTo(165, 25, 300, 75, 55);
      ctx.lineTo(300, 510);
      ctx.stroke();

      // Plunger Lane Separator
      ctx.strokeStyle = '#f59e0b';
      ctx.shadowColor = '#d97706';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(300, 520);
      ctx.lineTo(300, 140);
      ctx.stroke();

      // Render Clean Glass Bumpers
      state.bumpers.forEach((bmp) => {
        ctx.save();
        ctx.shadowColor = bmp.color;
        ctx.shadowBlur = bmp.hitTimer > 0 ? 30 : 15;

        // Metallic Glass Radial Fill
        const g = ctx.createRadialGradient(bmp.x - 4, bmp.y - 4, 1, bmp.x, bmp.y, bmp.r);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.4, bmp.color);
        g.addColorStop(1, '#090d16');

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(bmp.x, bmp.y, bmp.hitTimer > 0 ? bmp.r + 3 : bmp.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      });

      // Render Drop Targets
      state.targets.forEach((tgt) => {
        ctx.save();
        ctx.fillStyle = tgt.hit ? '#475569' : tgt.color;
        ctx.shadowColor = tgt.color;
        ctx.shadowBlur = 12;
        ctx.fillRect(tgt.x, tgt.y, tgt.w, tgt.h);
        ctx.restore();
      });

      // Render Shockwaves
      state.shockwaves.forEach(sw => {
        ctx.save();
        ctx.globalAlpha = sw.alpha;
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // Render Flippers
      ctx.save();
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#38bdf8';

      // Left Flipper
      ctx.beginPath();
      ctx.moveTo(75, 460);
      ctx.lineTo(75 + Math.cos(f.leftAngle) * 72, 460 + Math.sin(f.leftAngle) * 72);
      ctx.stroke();

      // Right Flipper
      ctx.beginPath();
      ctx.moveTo(255, 460);
      ctx.lineTo(255 - Math.cos(f.rightAngle) * 72, 460 + Math.sin(f.rightAngle) * 72);
      ctx.stroke();
      ctx.restore();

      // Render Particles
      state.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Chrome Ball with Speed Glow
      if (b.active) {
        ctx.save();
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 20;

        const ballGrad = ctx.createRadialGradient(b.x - 3, b.y - 3, 1, b.x, b.y, b.radius);
        ballGrad.addColorStop(0, '#ffffff');
        ballGrad.addColorStop(0.5, '#cbd5e1');
        ballGrad.addColorStop(1, '#1e293b');

        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleRestart = () => {
    stateRef.current = {
      ball: { x: 325, y: 470, vx: 0, vy: 0, radius: 9, active: false, speed: 0 },
      flippers: { leftAngle: 0.3, rightAngle: -0.3, leftTarget: 0.3, rightTarget: -0.3, leftVel: 0, rightVel: 0 },
      bumpers: [
        { x: 135, y: 140, r: 24, pts: 100, color: '#ec4899', hitTimer: 0 },
        { x: 205, y: 110, r: 26, pts: 250, color: '#06b6d4', hitTimer: 0 },
        { x: 100, y: 220, r: 22, pts: 150, color: '#f59e0b', hitTimer: 0 }
      ],
      targets: [
        { x: 45, y: 170, w: 10, h: 30, hit: false, color: '#a855f7' },
        { x: 275, y: 170, w: 10, h: 30, hit: false, color: '#a855f7' }
      ],
      particles: [],
      shockwaves: [],
      score: 0,
      mult: 1,
      ballsLeft: 3
    };
    setScore(0);
    setEarnedJoy(0);
    setMultiplier(1);
    setBallsLeft(3);
    setGameOver(false);
    setChargingPower(0);
  };

  const handleScoreSubmit = async () => {
    if (submitting || score <= 0) return;
    setSubmitting(true);
    try {
      await submitScore('pinball', score);
      sound.playWin?.();
      if (onScoreSubmit) onScoreSubmit(score);
    } catch (err) {
      console.error('Error submitting score:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto p-4 sm:p-5 rounded-[36px] bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-3xl text-white select-none space-y-3.5">
      {/* Sleek Minimalist HUD Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-cyan-400">sports_esports</span>
            <span>Hugo CyberPinball 3D</span>
          </div>
          <div className="text-xl font-black text-amber-400 font-mono flex items-center gap-2">
            <span>{score.toLocaleString()} PTS</span>
            <span className="text-[11px] font-extrabold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              +{earnedJoy} JOY 🎉
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <span
                key={i}
                className={`material-symbols-outlined text-base transition-colors ${
                  i < ballsLeft ? 'text-cyan-400' : 'text-slate-800'
                }`}
              >
                circle
              </span>
            ))}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Clean Plunger Meter */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
          <span>{t('arcadeGame.plungerPower', 'BẮN BI (Giữ BẮN / Spacebar)')}</span>
          <span className="font-mono text-amber-400 font-black">{chargingPower}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden p-0.5">
          <div
            className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500"
            style={{ width: `${chargingPower}%` }}
          />
        </div>
      </div>

      {/* Clean Obsidian Glass Canvas */}
      <div className="relative flex justify-center rounded-3xl overflow-hidden border border-slate-800 shadow-xl bg-black">
        <canvas ref={canvasRef} width={330} height={520} className="w-full max-w-[330px] h-[480px]" />

        {/* Game Over Screen */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-fadeIn space-y-4">
            <span className="material-symbols-outlined text-4xl text-amber-400">workspace_premium</span>
            <div>
              <h3 className="text-xl font-black text-white">{t('arcadeGame.gameOver', 'KẾT THÚC BÀN ĐẤU!')}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('arcadeGame.totalScoreAchieved', 'Tổng điểm và JOY đạt được trong trận Pinball')}</p>
            </div>

            <div className="space-y-0.5">
              <div className="text-2xl font-black text-amber-400 font-mono">{score.toLocaleString()} PTS</div>
              <div className="text-xs font-bold text-emerald-400">Nhận ngay +{earnedJoy} JOY vào ví!</div>
            </div>

            <div className="flex flex-col gap-2 w-full max-w-xs pt-2">
              <button
                onClick={handleScoreSubmit}
                disabled={submitting}
                className="w-full py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting && <span className="material-symbols-outlined animate-spin text-sm">sync</span>}
                <span>{submitting ? t('arcadeGame.submittingScore', 'Đang gửi điểm...') : t('arcadeGame.submitScoreForJoy', 'Nộp điểm nhận JOY thưởng')}</span>
              </button>

              <button
                onClick={handleRestart}
                className="w-full py-3 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold text-xs transition-all active:scale-95"
              >
                {t('arcadeGame.playAgain', 'Chơi bàn mới')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tactile Capsule Touch Controls */}
      <div className="grid grid-cols-3 gap-2 pt-0.5">
        <button
          type="button"
          onMouseDown={() => setLeftFlipper(true)}
          onMouseUp={() => setLeftFlipper(false)}
          onTouchStart={() => setLeftFlipper(true)}
          onTouchEnd={() => setLeftFlipper(false)}
          className="py-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 active:bg-cyan-600 text-cyan-400 font-black text-xs transition-all active:scale-95 flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">west</span> {t('arcadeGame.leftFlipper', 'Cần trái (A)')}
        </button>

        <button
          type="button"
          onMouseDown={startCharging}
          onMouseUp={releaseAndLaunch}
          onTouchStart={startCharging}
          onTouchEnd={releaseAndLaunch}
          disabled={stateRef.current.ball.active}
          className={`py-3 rounded-2xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-1 active:scale-95 disabled:opacity-50 ${
            isCharging ? 'bg-rose-500 text-white scale-105 shadow-rose-500/50' : 'bg-amber-500 hover:bg-amber-400 text-black'
          }`}
        >
          <span className="material-symbols-outlined text-sm">rocket_launch</span>
          <span>{isCharging ? 'THẢ ĐỂ BẮN!' : 'CĂN LỰC BẮN (Space)'}</span>
        </button>

        <button
          type="button"
          onMouseDown={() => setRightFlipper(true)}
          onMouseUp={() => setRightFlipper(false)}
          onTouchStart={() => setRightFlipper(true)}
          onTouchEnd={() => setRightFlipper(false)}
          className="py-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 active:bg-cyan-600 text-cyan-400 font-black text-xs transition-all active:scale-95 flex items-center justify-center gap-1"
        >
          {t('arcadeGame.rightFlipper', 'Cần phải (D)')} <span className="material-symbols-outlined text-sm">east</span>
        </button>
      </div>
    </div>
  );
}
