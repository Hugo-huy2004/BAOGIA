import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

// --- BACKGROUND PATTERNS (SVG) ---
const SeigaihaPattern = () => (
  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="opacity-[0.04]">
    <defs>
      <pattern id="seigaiha" width="60" height="30" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
        <circle cx="30" cy="30" r="28" fill="none" stroke="currentColor" strokeWidth="1"/>
        <circle cx="30" cy="30" r="22" fill="none" stroke="currentColor" strokeWidth="1"/>
        <circle cx="30" cy="30" r="16" fill="none" stroke="currentColor" strokeWidth="1"/>
        <circle cx="30" cy="30" r="10" fill="none" stroke="currentColor" strokeWidth="1"/>
        <circle cx="0" cy="30" r="28" fill="none" stroke="currentColor" strokeWidth="1"/>
        <circle cx="0" cy="30" r="22" fill="none" stroke="currentColor" strokeWidth="1"/>
        <circle cx="0" cy="30" r="16" fill="none" stroke="currentColor" strokeWidth="1"/>
        <circle cx="0" cy="30" r="10" fill="none" stroke="currentColor" strokeWidth="1"/>
        <circle cx="60" cy="30" r="28" fill="none" stroke="currentColor" strokeWidth="1"/>
        <circle cx="60" cy="30" r="22" fill="none" stroke="currentColor" strokeWidth="1"/>
        <circle cx="60" cy="30" r="16" fill="none" stroke="currentColor" strokeWidth="1"/>
        <circle cx="60" cy="30" r="10" fill="none" stroke="currentColor" strokeWidth="1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#seigaiha)" />
  </svg>
);

const DongSonPattern = () => (
  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="opacity-[0.03]">
    <defs>
      <pattern id="dongson" width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="scale(1.5)">
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2"/>
        <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4"/>
        <polygon points="50,20 55,30 65,30 58,40 60,50 50,45 40,50 42,40 35,30 45,30" fill="none" stroke="currentColor" strokeWidth="1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dongson)" />
  </svg>
);

const WashiTexture = () => (
  <div className="absolute inset-0 opacity-[0.08] mix-blend-multiply dark:mix-blend-overlay pointer-events-none" style={{
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
  }} />
);

// --- PARTICLES ---
const SakuraParticles = () => {
  const petals = useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * -20,
    duration: 10 + Math.random() * 10,
    size: 10 + Math.random() * 15,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {petals.map((p) => (
        <motion.div
          key={p.id}
          className="absolute top-[-5%]"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            background: 'linear-gradient(135deg, #ffb7c5, #ff8da1)',
            borderRadius: '0 50% 50% 50%',
          }}
          animate={{
            y: ['0vh', '105vh'],
            x: ['0vw', `${(Math.random() - 0.5) * 20}vw`],
            rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

const FireflyParticles = () => {
  const flies = useMemo(() => Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 4 + Math.random() * 4,
    delay: Math.random() * -10,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {flies.map((f) => (
        <motion.div
          key={f.id}
          className="absolute rounded-full"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            width: f.size,
            height: f.size,
            background: 'hsl(var(--accent))',
            boxShadow: '0 0 10px 2px hsl(var(--accent))',
          }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.5, 0.5],
            x: [0, (Math.random() - 0.5) * 50],
            y: [0, (Math.random() - 0.5) * 50],
          }}
          transition={{
            duration: f.duration,
            delay: f.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

const InkParticles = () => {
  const drops = useMemo(() => Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * -10,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {drops.map((d) => (
        <motion.div
          key={d.id}
          className="absolute bg-foreground opacity-[0.03] dark:opacity-[0.08]"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
            filter: 'blur(20px)',
          }}
          animate={{
            width: ['0px', '400px', '600px'],
            height: ['0px', '400px', '600px'],
            opacity: [0, 0.05, 0],
          }}
          transition={{
            duration: 15,
            delay: d.delay,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
};

const GodRays = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-10 mix-blend-overlay">
    <motion.div
      className="absolute top-[-50%] left-[-20%] w-[150%] h-[200%] opacity-30"
      style={{
        background: 'conic-gradient(from 180deg at 50% 0%, transparent 0deg, hsl(var(--accent)) 45deg, transparent 90deg, hsl(var(--primary)) 135deg, transparent 180deg)',
      }}
      animate={{
        rotate: [0, 5, 0, -5, 0],
        opacity: [0.2, 0.4, 0.2],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  </div>
);

export default function CultureEffectsLayer() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.split('-')[0] || 'vi';

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* 1. Global Texture (Washi paper for Japan/Korea/China) */}
      {['ja', 'ko', 'zh'].includes(lang) && <WashiTexture />}

      {/* 2. Specific Background Patterns */}
      <div className="absolute inset-0 text-foreground mix-blend-multiply dark:mix-blend-screen">
        {lang === 'ja' && <SeigaihaPattern />}
        {lang === 'vi' && <DongSonPattern />}
      </div>

      {/* 3. Immersive Particles */}
      {lang === 'ja' && <SakuraParticles />}
      {lang === 'vi' && <FireflyParticles />}
      {lang === 'zh' && <InkParticles />}
      {lang === 'th' && <GodRays />}
      {lang === 'ko' && (
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-accent/10 blur-3xl opacity-50" />
      )}
    </div>
  );
}
