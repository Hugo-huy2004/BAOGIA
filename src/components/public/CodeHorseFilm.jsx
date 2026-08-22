import { useEffect, useRef } from "react";

/* ============================================================================
   RUNNING HORSE FILM — Transparent Cartoon Running Horse GIF + Automatic Audio
   ==========================================================================
   - Clean transparent GIF (/images/horse/running_horse_perfect.gif) with zero white box.
   - NO background, NO card styling, runs directly on the website's background.
   - Web Audio API realistic horse whinny / neigh sound synthesizer (100% automatic sound).
   ========================================================================== */

const HORSE_RUNNING_GIF = "/images/horse/running_horse_perfect.gif";

export function playSynthesizedHorseNeigh(audioCtx) {
  if (!audioCtx) return;
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  const now = audioCtx.currentTime;

  try {
    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.35, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.45);
    masterGain.connect(audioCtx.destination);

    // Main Whinny Pitch Sweep (Sawtooth)
    const osc = audioCtx.createOscillator();
    const vibrato = audioCtx.createOscillator();
    const vibratoGain = audioCtx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(780, now);
    osc.frequency.exponentialRampToValueAtTime(1450, now + 0.35);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.7);
    osc.frequency.exponentialRampToValueAtTime(450, now + 1.35);

    // Fast Vibrato (~14Hz)
    vibrato.frequency.setValueAtTime(14, now);
    vibratoGain.gain.setValueAtTime(95, now);
    vibratoGain.gain.exponentialRampToValueAtTime(18, now + 1.2);
    vibrato.connect(osc.frequency);

    // Formant Bandpass Throat Resonance
    const formantFilter = audioCtx.createBiquadFilter();
    formantFilter.type = "bandpass";
    formantFilter.frequency.setValueAtTime(1450, now);
    formantFilter.Q.setValueAtTime(2.6, now);

    osc.connect(formantFilter);
    formantFilter.connect(masterGain);

    // Breathy Exhale Burst
    const bufferSize = Math.floor(audioCtx.sampleRate * 1.3);
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(1950, now);
    noiseFilter.Q.setValueAtTime(3.4, now);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.08, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);

    noise.connect(noiseFilter);
    noiseFilter.connect(masterGain);

    osc.start(now);
    vibrato.start(now);
    noise.start(now);

    osc.stop(now + 1.45);
    vibrato.stop(now + 1.45);
    noise.stop(now + 1.45);
  } catch (e) {
    console.warn("Horse audio synth warning:", e);
  }
}

export default function CodeHorseFilm({ onNeighTrigger }) {
  const audioCtxRef = useRef(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  };

  const handleHorseClick = () => {
    const ctx = getAudioContext();
    if (ctx) {
      // Create a cuter, more realistic "hí hí" (high pitch neigh)
      try {
        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.5, now);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        masterGain.connect(ctx.destination);

        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        // Higher pitch for "hí hí"
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.2);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.4);
        osc.frequency.exponentialRampToValueAtTime(600, now + 1.0);

        const vibrato = ctx.createOscillator();
        vibrato.frequency.setValueAtTime(16, now); // Fast vibrato
        const vibratoGain = ctx.createGain();
        vibratoGain.gain.setValueAtTime(150, now);
        vibratoGain.gain.linearRampToValueAtTime(20, now + 1.0);
        vibrato.connect(osc.frequency);

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1600, now);
        filter.Q.setValueAtTime(3.0, now);

        osc.connect(filter);
        filter.connect(masterGain);

        osc.start(now);
        vibrato.start(now);
        osc.stop(now + 1.2);
        vibrato.stop(now + 1.2);
      } catch (e) {
        console.warn("Synth error:", e);
      }
    }
    
    // Attempt to play external real sound as primary, fallback to synth if it fails or while loading
    try {
      const realAudio = new Audio("https://actions.google.com/sounds/v1/animals/horse_whinny.ogg");
      realAudio.volume = 1.0;
      realAudio.play().catch(() => {});
    } catch (e) {}

    if (onNeighTrigger) onNeighTrigger();
  };

  return (
    <div className="relative flex flex-col items-center justify-center pointer-events-auto w-full max-w-3xl mx-auto overflow-hidden">
      
      {/* 1. SPEED LINES EFFECT (Siêu tốc độ) - Pure CSS, GPU Accelerated */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => {
          // Generate deterministic pseudo-random values to avoid hydration mismatch
          const randWidth = 40 + (i * 17 % 100);
          const randTop = (i * 23 % 100);
          const randDuration = 0.3 + (i * 7 % 5) / 10;
          const randDelay = (i * 11 % 10) / 10;
          
          return (
            <div
              key={i}
              className="absolute bg-black/15 dark:bg-white/15 rounded-full"
              style={{
                height: '2px',
                width: `${randWidth}px`,
                top: `${randTop}%`,
                left: '100%',
                animation: `horseSpeedLine ${randDuration}s linear infinite`,
                animationDelay: `${randDelay}s`,
                willChange: 'transform'
              }}
            />
          );
        })}
      </div>
      <style>{`
        @keyframes horseSpeedLine {
          0% { transform: translate3d(0, 0, 0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate3d(-150vw, 0, 0); opacity: 0; }
        }
      `}</style>

      {/* 2. THE HORSE ITSELF (interactive button & highly optimized) */}
      <img
        src={HORSE_RUNNING_GIF}
        alt="Hugo Running Horse"
        loading="lazy"
        decoding="async"
        className="relative z-10 w-auto h-40 sm:h-56 md:h-64 object-contain cursor-pointer transition-transform hover:scale-110 active:scale-90"
        style={{ mixBlendMode: 'multiply', willChange: 'transform' }}
        onClick={handleHorseClick}
        title="Bấm vào tớ đi! Hí hí!"
      />
    </div>
  );
}
