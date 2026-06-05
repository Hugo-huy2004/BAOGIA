import React, { useEffect, useRef } from "react";

export default function BirthdaySurprise({ displayName, onClose }) {
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    // 1. Play Happy Birthday synth music
    let hasPlayed = false;
    const playMusic = () => {
      if (hasPlayed) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const runMelody = () => {
        const melody = [
          { note: 392.00, dur: 0.35 }, { note: 392.00, dur: 0.15 }, { note: 440.00, dur: 0.5 }, { note: 392.00, dur: 0.5 }, { note: 523.25, dur: 0.5 }, { note: 493.88, dur: 1.0 },
          { note: 392.00, dur: 0.35 }, { note: 392.00, dur: 0.15 }, { note: 440.00, dur: 0.5 }, { note: 392.00, dur: 0.5 }, { note: 587.33, dur: 0.5 }, { note: 523.25, dur: 1.0 },
          { note: 392.00, dur: 0.35 }, { note: 392.00, dur: 0.15 }, { note: 783.99, dur: 0.5 }, { note: 659.25, dur: 0.5 }, { note: 523.25, dur: 0.5 }, { note: 493.88, dur: 0.5 }, { note: 440.00, dur: 1.0 },
          { note: 698.46, dur: 0.35 }, { note: 698.46, dur: 0.15 }, { note: 659.25, dur: 0.5 }, { note: 523.25, dur: 0.5 }, { note: 587.33, dur: 0.5 }, { note: 523.25, dur: 1.0 }
        ];

        let time = ctx.currentTime;
        melody.forEach((item) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(item.note, time);
          
          gainNode.gain.setValueAtTime(0.12, time);
          gainNode.gain.exponentialRampToValueAtTime(0.001, time + item.dur - 0.05);
          
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          osc.start(time);
          osc.stop(time + item.dur - 0.02);
          time += item.dur + 0.08;
        });
      };

      if (ctx.state === 'suspended') {
        const handleGesture = () => {
          ctx.resume().then(() => {
            if (ctx.state === 'running') {
              runMelody();
              cleanup();
            }
          });
        };
        const cleanup = () => {
          window.removeEventListener('click', handleGesture);
          window.removeEventListener('touchstart', handleGesture);
        };
        window.addEventListener('click', handleGesture);
        window.addEventListener('touchstart', handleGesture);
      } else {
        runMelody();
      }
      hasPlayed = true;
    };

    playMusic();

    // 2. Confetti & Fireworks Canvas
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#FF2D55', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#5856D6', '#FF2D55'];

    class Particle {
      constructor(x, y, isFirework = false) {
        this.x = x;
        this.y = y;
        this.isFirework = isFirework;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        if (isFirework) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 4 + 2;
          this.vx = Math.cos(angle) * speed;
          this.vy = Math.sin(angle) * speed;
          this.radius = Math.random() * 2 + 1.5;
          this.alpha = 1;
          this.decay = Math.random() * 0.015 + 0.01;
        } else {
          this.vx = Math.random() * 2 - 1;
          this.vy = Math.random() * 3 + 1;
          this.radius = Math.random() * 3 + 2;
          this.rotation = Math.random() * 360;
          this.rotationSpeed = Math.random() * 4 - 2;
        }
      }

      update() {
        if (this.isFirework) {
          this.x += this.vx;
          this.y += this.vy;
          this.vy += 0.05;
          this.alpha -= this.decay;
        } else {
          this.x += this.vx;
          this.y += this.vy;
          this.rotation += this.rotationSpeed;
          if (this.y > canvas.height) {
            this.y = -10;
            this.x = Math.random() * canvas.width;
          }
        }
      }

      draw() {
        ctx.save();
        if (this.isFirework) {
          ctx.globalAlpha = this.alpha;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.fill();
        } else {
          ctx.translate(this.x, this.y);
          ctx.rotate((this.rotation * Math.PI) / 180);
          ctx.fillStyle = this.color;
          ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 1.5);
        }
        ctx.restore();
      }
    }

    for (let i = 0; i < 80; i++) {
      particles.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height));
    }

    const createExplosion = (x, y) => {
      for (let i = 0; i < 40; i++) {
        particles.push(new Particle(x, y, true));
      }
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let fireworkTimer = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      fireworkTimer++;
      if (fireworkTimer % 45 === 0) {
        createExplosion(Math.random() * canvas.width, Math.random() * (canvas.height * 0.6));
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        
        if (p.isFirework && p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md transition-all duration-300">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      
      <div className="relative max-w-sm w-full mx-4 p-8 rounded-xl bg-[#1c1c1e] border border-rose-500/30 text-center shadow-[0_0_50px_rgba(255,45,85,0.25)] space-y-6 animate-scaleUp z-10">
        
        {/* Animated Cake Icon */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-rose-500/10 rounded-full border border-rose-500/20 text-rose-500 animate-pulse">
          <span className="material-symbols-outlined text-4xl">cake</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 bg-clip-text text-transparent uppercase tracking-wider">
            Happy Birthday!
          </h2>
          <p className="text-white text-sm font-semibold">
            Chúc mừng sinh nhật, <span className="text-rose-500 font-bold">{displayName}</span>! 
          </p>
          <p className="text-xs text-zinc-400 leading-relaxed px-2">
            Hugo Studio mến chúc bạn tuổi mới ngập tràn niềm vui, sức khỏe dồi dào, luôn tươi trẻ và gặt hái được nhiều thắng lợi rực rỡ!
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-rose-500/20"
        >
          Nhận lời chúc
        </button>
      </div>
    </div>
  );
}
