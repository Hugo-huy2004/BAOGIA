/**
 * Two hand-drawn SVG scenes for the Introduction page, replacing the two stock
 * MP4s it used to stream from CloudFront. Zero network requests, zero video
 * decoding, and they scale to any viewport without a second asset.
 *
 *   SkyCodeScene     — hero. Outdoors, daylight: hills, clouds, someone coding.
 *   StudioSpaceScene — feature card. Indoors: a desk by a window at night.
 *
 * The two are deliberately unrelated artwork, not one scene reskinned.
 *
 * Day/night is a palette swap driven by `.dark`, not a filter, so light mode is
 * a real afternoon and dark mode a real night. Every animation touches only
 * transform or opacity so the compositor can run it off the main thread;
 * `prefers-reduced-motion` parks all of it.
 */

const SCENE_CSS = `
.sky-scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
  /* ── Daylight ── */
  --sky-1: #5cc8f5;
  --sky-2: #bdefff;
  --sky-3: #ffe0b8;
  --sky-4: #ffc9c2;
  --orb: #fbbf24;
  --orb-glow: #fde68a;
  --cloud: #ffffff;
  --cloud-2: #f0f9ff;
  --ridge: #b9a8ff;
  --ridge-2: #f3b6f0;
  --hill-far: #9df5c8;
  --hill-far-2: #22c98d;
  --hill-near: #34d399;
  --hill-near-2: #047857;
  --bush: #059669;
  --haze: #ffffff;
  --balloon-1: #fb7185;
  --balloon-2: #fbbf24;
  --balloon-3: #38bdf8;
  --star: transparent;
  --bird: #475569;
  --desk: #f59e0b;
  --desk-edge: #d97706;
  --chair: #6366f1;
  --shirt: #8b5cf6;
  --shirt-shade: #7c3aed;
  --skin: #fcd9b6;
  --hair: #1f2937;
  --laptop: #f1f5f9;
  --laptop-edge: #94a3b8;
  --screen: #0ea5e9;
  --screen-2: #22d3ee;
  --code-a: #f472b6;
  --code-b: #fde047;
  --code-c: #86efac;
  --mug: #f43f5e;
  --steam: #94a3b8;
  --plant: #10b981;
  --pot: #fb7185;

  /* ── Interior ── */
  --room: #fef3c7;
  --room-2: #fde68a;
  --floor: #d97706;
  --frame: #78350f;
  --pane-1: #7dd3fc;
  --pane-2: #bfdbfe;
  --city: #6366f1;
  --lamp: #f43f5e;
  --lamp-light: #fde047;
  --book-1: #ef4444;
  --book-2: #3b82f6;
  --book-3: #10b981;
  --book-4: #f59e0b;
  --swatch-1: #ec4899;
  --swatch-2: #8b5cf6;
  --swatch-3: #06b6d4;
  /* Elements that belong to only one time of day switch themselves off by
     going transparent, so both scenes stay a single set of shapes. */
  --ray: #fde68a;
  --crater: transparent;
  --firefly: transparent;
  --tree: #047857;
  --grass: #059669;
  --shadow: #0f172a;
  --rug: #f472b6;
  --note-1: #fde047;
  --note-2: #86efac;
  --note-3: #f9a8d4;
  --cat: #1f2937;
  --wall-art: #a78bfa;
  --metal: #94a3b8;
  --surface: #ffffff;
}
.dark .sky-scene {
  /* ── Night ── */
  --sky-1: #070a24;
  --sky-2: #241a63;
  --sky-3: #4a1d7a;
  --sky-4: #6d1f5e;
  --orb: #e2e8f0;
  --orb-glow: #c7d2fe;
  --cloud: #4338ca;
  --cloud-2: #4f46e5;
  /* Darker than --sky-2, or the ridge vanishes into the sky it sits against. */
  --ridge: #120e3d;
  --ridge-2: #2a1152;
  --hill-far: #16706a;
  --hill-far-2: #0b3f45;
  --hill-near: #12857a;
  --hill-near-2: #073b3f;
  --bush: #115e59;
  --haze: #a78bfa;
  --balloon-1: #f43f5e;
  --balloon-2: #f59e0b;
  --balloon-3: #0ea5e9;
  --star: #fde68a;
  --bird: #a5b4fc;
  --desk: #b45309;
  --desk-edge: #78350f;
  --chair: #4338ca;
  --shirt: #a78bfa;
  --shirt-shade: #8b5cf6;
  --skin: #e8b98f;
  --hair: #0f172a;
  --laptop: #cbd5e1;
  --laptop-edge: #64748b;
  --screen: #0284c7;
  --screen-2: #67e8f9;
  --code-a: #f9a8d4;
  --code-b: #fef08a;
  --code-c: #bbf7d0;
  --mug: #fb7185;
  --steam: #cbd5e1;
  --plant: #059669;
  --pot: #f43f5e;

  --room: #1e1b4b;
  --room-2: #312e81;
  --floor: #4c1d95;
  --frame: #1f2937;
  --pane-1: #0f172a;
  --pane-2: #1e1b4b;
  --city: #4338ca;
  --lamp: #fb7185;
  --lamp-light: #fde047;
  --book-1: #f87171;
  --book-2: #60a5fa;
  --book-3: #34d399;
  --book-4: #fbbf24;
  --swatch-1: #f472b6;
  --swatch-2: #a78bfa;
  --swatch-3: #22d3ee;
  --ray: transparent;
  --crater: #cbd5e1;
  --firefly: #fde047;
  --tree: #064e3b;
  --grass: #065f46;
  --shadow: #000000;
  --rug: #9d174d;
  --note-1: #fbbf24;
  --note-2: #34d399;
  --note-3: #f472b6;
  --cat: #0f172a;
  --wall-art: #6366f1;
  --metal: #64748b;
  /* Lighter than the card behind it, or the chat bubbles disappear. */
  --surface: #322d6b;
}
.sky-scene svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.sky-scene * { animation-play-state: var(--scene-play-state, running); }

/* ── Shared ── */
@keyframes sky-twinkle { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
.sky-star { animation: sky-twinkle 3.4s ease-in-out infinite; }
.sky-star:nth-of-type(2n) { animation-duration: 2.6s; animation-delay: -1s; }
.sky-star:nth-of-type(3n) { animation-duration: 4.4s; animation-delay: -2s; }

@keyframes sky-steam {
  0%   { opacity: 0; transform: translateY(3px) scale(0.7); }
  35%  { opacity: 0.6; }
  100% { opacity: 0; transform: translateY(-20px) scale(1.2); }
}
.sky-steam { animation: sky-steam 4s ease-out infinite; transform-origin: center bottom; }
.sky-steam:nth-of-type(2) { animation-delay: 1.3s; }
.sky-steam:nth-of-type(3) { animation-delay: 2.6s; }

@keyframes sky-glow { 0%, 100% { opacity: 0.6; } 45% { opacity: 1; } }
.sky-glow { animation: sky-glow 4.5s ease-in-out infinite; }

/* ── Hero scene ── */
@keyframes sky-drift { from { transform: translateX(-14%); } to { transform: translateX(114%); } }
.sky-cloud-a { animation: sky-drift 52s linear infinite; }
.sky-cloud-b { animation: sky-drift 74s linear infinite; animation-delay: -30s; }
.sky-cloud-c { animation: sky-drift 92s linear infinite; animation-delay: -66s; }
.sky-birds   { animation: sky-drift 38s linear infinite; animation-delay: -8s; }

/* Balloon drifts on the right, where the hero scrim leaves the art visible. */
@keyframes sky-balloon {
  0%, 100% { transform: translate(0, 0); }
  50%      { transform: translate(-14px, -20px); }
}
.sky-balloon { animation: sky-balloon 17s ease-in-out infinite; }

@keyframes sky-flap { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.45); } }
.sky-bird { animation: sky-flap 0.7s ease-in-out infinite; transform-origin: center; }
.sky-bird:nth-of-type(2) { animation-delay: -0.25s; }
.sky-bird:nth-of-type(3) { animation-delay: -0.45s; }

@keyframes sky-type { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1.4px); } }
.sky-body { animation: sky-type 2.6s ease-in-out infinite; }
@keyframes sky-hand { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-4.5deg); } }
.sky-hand { animation: sky-hand 0.5s ease-in-out infinite; transform-origin: 640px 330px; }

/* Code lines type themselves in, then the screen repaints. */
@keyframes sky-code { 0%, 8% { transform: scaleX(0); } 22%, 88% { transform: scaleX(1); } 100% { transform: scaleX(0); } }
.sky-code { animation: sky-code 6s ease-in-out infinite; transform-origin: left center; }
.sky-code:nth-of-type(2) { animation-delay: 0.35s; }
.sky-code:nth-of-type(3) { animation-delay: 0.7s; }
.sky-code:nth-of-type(4) { animation-delay: 1.05s; }
.sky-code:nth-of-type(5) { animation-delay: 1.4s; }

/* ── Studio scene ── */
@keyframes st-lamp { 0%, 100% { opacity: 0.4; } 40% { opacity: 0.72; } 62% { opacity: 0.52; } }
.st-lamp-cone { animation: st-lamp 6.5s ease-in-out infinite; }

@keyframes st-float { 0%, 100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-9px) rotate(3deg); } }
.st-swatch { animation: st-float 7s ease-in-out infinite; transform-origin: center; }
.st-swatch:nth-of-type(2) { animation-duration: 9s; animation-delay: -2s; }
.st-swatch:nth-of-type(3) { animation-duration: 8s; animation-delay: -4s; }

@keyframes st-sway { 0%, 100% { transform: rotate(-2.5deg); } 50% { transform: rotate(2.5deg); } }
.st-leaf { animation: st-sway 5.5s ease-in-out infinite; }

/* The canvas on the monitor cycles through compositions. */
@keyframes st-canvas { 0%, 26% { opacity: 1; } 34%, 92% { opacity: 0; } 100% { opacity: 1; } }
.st-shape { animation: st-canvas 9s ease-in-out infinite; }
.st-shape:nth-of-type(2) { animation-delay: -3s; }
.st-shape:nth-of-type(3) { animation-delay: -6s; }

/* Sun rays turn; by night the same group holds still and is transparent. */
@keyframes sky-rays { to { transform: rotate(360deg); } }
.sky-rays { animation: sky-rays 120s linear infinite; transform-origin: 150px 96px; }

@keyframes sky-grass { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
.sky-grass { animation: sky-grass 4.5s ease-in-out infinite; }
.sky-grass:nth-of-type(2n) { animation-duration: 5.8s; animation-delay: -1.4s; }
.sky-grass:nth-of-type(3n) { animation-duration: 3.9s; animation-delay: -2.6s; }

/* Fireflies only exist at night — by day --firefly is transparent. */
@keyframes sky-firefly {
  0%, 100% { opacity: 0; transform: translate(0, 0); }
  25%      { opacity: 1; }
  50%      { opacity: 0.5; transform: translate(14px, -18px); }
  75%      { opacity: 1; transform: translate(-8px, -30px); }
}
.sky-firefly { animation: sky-firefly 9s ease-in-out infinite; }
.sky-firefly:nth-of-type(2) { animation-duration: 11s; animation-delay: -3s; }
.sky-firefly:nth-of-type(3) { animation-duration: 8s; animation-delay: -5s; }
.sky-firefly:nth-of-type(4) { animation-duration: 12s; animation-delay: -7s; }

@keyframes sky-blink { 0%, 45% { opacity: 1; } 50%, 95% { opacity: 0; } }
.sky-cursor { animation: sky-blink 1.1s steps(1, end) infinite; }

/* Dust drifting up through the lamp light. */
@keyframes st-mote {
  0%   { opacity: 0; transform: translate(0, 0) scale(0.6); }
  30%  { opacity: 0.9; }
  100% { opacity: 0; transform: translate(10px, -74px) scale(1); }
}
.st-mote { animation: st-mote 8s linear infinite; }
.st-mote:nth-of-type(2) { animation-duration: 10s; animation-delay: -2.5s; }
.st-mote:nth-of-type(3) { animation-duration: 9s; animation-delay: -5s; }
.st-mote:nth-of-type(4) { animation-duration: 11s; animation-delay: -7s; }

@keyframes st-tail { 0%, 100% { transform: rotate(-11deg); } 50% { transform: rotate(15deg); } }
.st-tail { animation: st-tail 3.2s ease-in-out infinite; }

@keyframes st-tick { to { transform: rotate(360deg); } }
.st-hand { animation: st-tick 60s steps(60, end) infinite; transform-origin: 330px 96px; }

@keyframes st-note { 0%, 100% { transform: rotate(-1.6deg); } 50% { transform: rotate(1.8deg); } }
.st-note { animation: st-note 6s ease-in-out infinite; }
.st-note:nth-of-type(2) { animation-duration: 7.5s; animation-delay: -2s; }
.st-note:nth-of-type(3) { animation-duration: 5.4s; animation-delay: -3.5s; }

/* ── Project card scenes ── */
@keyframes sc-pop {
  0%, 6%   { opacity: 0; transform: scale(0.4); }
  18%, 88% { opacity: 1; transform: scale(1); }
  100%     { opacity: 0; transform: scale(0.85); }
}
.sc-pop { animation: sc-pop 7s cubic-bezier(0.34, 1.56, 0.64, 1) infinite; transform-box: fill-box; transform-origin: center; }
.sc-pop:nth-of-type(2) { animation-delay: 0.18s; }
.sc-pop:nth-of-type(3) { animation-delay: 0.36s; }
.sc-pop:nth-of-type(4) { animation-delay: 0.54s; }
.sc-pop:nth-of-type(5) { animation-delay: 0.72s; }
.sc-pop:nth-of-type(6) { animation-delay: 0.9s; }

@keyframes sc-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
.sc-bob { animation: sc-bob 4.4s ease-in-out infinite; }
.sc-bob:nth-of-type(2) { animation-duration: 5.6s; animation-delay: -1.6s; }
.sc-bob:nth-of-type(3) { animation-duration: 5s; animation-delay: -3s; }

/* Chat: each bubble arrives, the thread holds, then it replays. */
@keyframes sc-bubble {
  0%, 8%    { opacity: 0; transform: translateY(7px) scale(0.94); }
  20%, 86%  { opacity: 1; transform: none; }
  100%      { opacity: 0; transform: translateY(-4px); }
}
.sc-bubble { animation: sc-bubble 8s ease-out infinite; transform-box: fill-box; transform-origin: center; }
.sc-bubble:nth-of-type(2) { animation-delay: 0.7s; }
.sc-bubble:nth-of-type(3) { animation-delay: 1.4s; }
.sc-bubble:nth-of-type(4) { animation-delay: 2.1s; }

@keyframes sc-dot { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3.5px); } }
.sc-dot { animation: sc-dot 1.1s ease-in-out infinite; }
.sc-dot:nth-of-type(2) { animation-delay: 0.15s; }
.sc-dot:nth-of-type(3) { animation-delay: 0.3s; }

@keyframes sc-heart { 0%, 100% { transform: scale(1); } 18% { transform: scale(1.22); } 36% { transform: scale(1); } 54% { transform: scale(1.14); } }
.sc-heart { animation: sc-heart 2.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }

/* scaleX rather than stroke-dashoffset: transforms stay off the main thread. */
@keyframes sc-draw { 0%, 10% { transform: scaleX(0); } 40%, 88% { transform: scaleX(1); } 100% { transform: scaleX(0); } }
.sc-draw { animation: sc-draw 8s ease-in-out infinite; transform-origin: left center; }

@keyframes sc-spin { to { transform: rotate(360deg); } }
.sc-ring { animation: sc-spin 14s linear infinite; transform-box: fill-box; transform-origin: center; }

@keyframes sc-flicker { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
.sc-qr { animation: sc-flicker 2.8s ease-in-out infinite; }
.sc-qr:nth-of-type(2n) { animation-duration: 2s; animation-delay: -0.7s; }
.sc-qr:nth-of-type(3n) { animation-duration: 3.6s; animation-delay: -1.5s; }

@media (prefers-reduced-motion: reduce) {
  .sky-scene * { animation: none !important; }
  .sc-pop, .sc-bubble { opacity: 1; transform: none; }
  .sc-draw { transform: none; }
  .sc-qr { opacity: 0.8; }
  .sky-glow, .st-lamp-cone { opacity: 0.85; }
  .sky-steam, .st-mote { opacity: 0.3; }
  .sky-code { transform: none; }
  .st-shape, .sky-cursor { opacity: 1; }
  .sky-firefly { opacity: 0.7; }
}
`;

const HERO_STARS = [
  [60, 60], [140, 30], [250, 78], [330, 40], [420, 96], [500, 52],
  [590, 88], [680, 36], [780, 110], [860, 62], [200, 130], [380, 20],
  [640, 150], [90, 170], [470, 160], [950, 96], [1040, 44], [1010, 148],
];

/* Hero: outdoors, someone coding on a hillside. */
export function SkyCodeScene() {
  return (
    <div className="sky-scene" aria-hidden="true">
      <style>{SCENE_CSS}</style>
      <svg viewBox="0 0 1100 460" preserveAspectRatio="xMidYMax slice" role="presentation">
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--sky-1)" />
            <stop offset="42%" stopColor="var(--sky-2)" />
            <stop offset="78%" stopColor="var(--sky-3)" />
            <stop offset="100%" stopColor="var(--sky-4)" />
          </linearGradient>
          <linearGradient id="ridgeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--ridge)" />
            <stop offset="100%" stopColor="var(--ridge-2)" />
          </linearGradient>
          <linearGradient id="hillFarGrad" x1="0" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stopColor="var(--hill-far)" />
            <stop offset="100%" stopColor="var(--hill-far-2)" />
          </linearGradient>
          <linearGradient id="hillNearGrad" x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%" stopColor="var(--hill-near)" />
            <stop offset="100%" stopColor="var(--hill-near-2)" />
          </linearGradient>
          <linearGradient id="hazeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--haze)" stopOpacity="0" />
            <stop offset="70%" stopColor="var(--haze)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--haze)" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="orbGlow">
            <stop offset="0%" stopColor="var(--orb-glow)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--orb-glow)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="screenGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--screen)" />
            <stop offset="100%" stopColor="var(--screen-2)" />
          </linearGradient>
        </defs>

        <rect width="1100" height="460" fill="url(#skyGrad)" />

        {/* Sun by day, moon by night — one disc, two palettes. */}
        <circle cx="150" cy="96" r="92" fill="url(#orbGlow)" />
        <g className="sky-rays" opacity="0.6">
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x="147.5" y="30" width="5" height="17" rx="2.5" fill="var(--ray)" transform={`rotate(${i * 30} 150 96)`} />
          ))}
        </g>
        <circle cx="150" cy="96" r="34" fill="var(--orb)" />
        {/* Craters read as a moon at night; by day --crater is transparent. */}
        <g fill="var(--crater)" opacity="0.45">
          <circle cx="141" cy="87" r="7.5" />
          <circle cx="161" cy="103" r="5" />
          <circle cx="147" cy="111" r="3.2" />
        </g>

        {HERO_STARS.map(([cx, cy], i) => (
          <circle key={i} className="sky-star" cx={cx} cy={cy} r={i % 3 === 0 ? 2.4 : 1.6} fill="var(--star)" />
        ))}

        {/* Far ridge, for depth behind the hills. */}
        <path d="M0 268 L120 206 L206 258 L300 190 L410 262 L520 214 L640 268 L760 218 L880 264 L1000 222 L1100 260 L1100 300 L0 300 Z" fill="url(#ridgeGrad)" opacity="0.6" />

        <rect y="232" width="1100" height="86" fill="url(#hazeGrad)" opacity="0.6" />

        <g className="sky-cloud-a" opacity="0.9">
          <g transform="translate(-120 84)">
            <ellipse cx="44" cy="22" rx="46" ry="17" fill="var(--cloud)" />
            <ellipse cx="76" cy="16" rx="31" ry="22" fill="var(--cloud)" />
            <ellipse cx="18" cy="18" rx="24" ry="14" fill="var(--cloud-2)" />
          </g>
        </g>
        <g className="sky-cloud-b" opacity="0.72">
          <g transform="translate(-120 190)">
            <ellipse cx="34" cy="16" rx="35" ry="13" fill="var(--cloud)" />
            <ellipse cx="60" cy="12" rx="23" ry="18" fill="var(--cloud-2)" />
          </g>
        </g>
        <g className="sky-cloud-c" opacity="0.55">
          <g transform="translate(-120 40)">
            <ellipse cx="28" cy="14" rx="27" ry="11" fill="var(--cloud)" />
            <ellipse cx="50" cy="11" rx="19" ry="13" fill="var(--cloud)" />
          </g>
        </g>

        <g className="sky-birds" opacity="0.75">
          <g transform="translate(-120 132)">
            <path className="sky-bird" d="M0 0 q7 -7 14 0 q7 -7 14 0" stroke="var(--bird)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path className="sky-bird" d="M34 18 q6 -6 12 0 q6 -6 12 0" stroke="var(--bird)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <path className="sky-bird" d="M18 34 q5 -5 10 0 q5 -5 10 0" stroke="var(--bird)" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        </g>

        <g className="sky-balloon" opacity="0.95">
          <path d="M886 128 q-30 0 -30 -28 q0 -30 30 -46 q30 16 30 46 q0 28 -30 28 Z" fill="var(--balloon-1)" />
          <path d="M886 54 q-13 8 -20 26 q7 20 20 20 Z" fill="var(--balloon-2)" />
          <path d="M886 54 q13 8 20 26 q-7 20 -20 20 Z" fill="var(--balloon-3)" opacity="0.85" />
          <path d="M876 126 l4 14 M896 126 l-4 14" stroke="var(--frame)" strokeWidth="2" opacity="0.55" />
          <rect x="877" y="138" width="18" height="12" rx="3" fill="var(--desk)" />
        </g>

        <path d="M0 300 C 120 250, 250 292, 380 268 C 510 244, 700 292, 880 258 C 980 240, 1040 268, 1100 252 L1100 460 L0 460 Z" fill="url(#hillFarGrad)" />
        <g fill="var(--tree)" opacity="0.75">
          <path d="M188 302 l13 -32 l13 32 Z" />
          <path d="M226 304 l10 -24 l10 24 Z" />
          <path d="M298 300 l12 -28 l12 28 Z" />
          <path d="M974 296 l11 -26 l11 26 Z" />
          <path d="M1010 298 l9 -21 l9 21 Z" />
        </g>

        <path d="M0 344 C 140 306, 280 340, 430 318 C 580 296, 720 336, 880 310 C 990 292, 1050 320, 1100 304 L1100 460 L0 460 Z" fill="url(#hillNearGrad)" />

        {/* Bushes to break the horizon line. */}
        <g fill="var(--bush)" opacity="0.85">
          <ellipse cx="86" cy="366" rx="34" ry="17" />
          <ellipse cx="120" cy="372" rx="22" ry="12" />
          <ellipse cx="1042" cy="342" rx="30" ry="15" />
        </g>

        <g transform="translate(220 0)">
          <ellipse cx="500" cy="456" rx="230" ry="15" fill="var(--shadow)" opacity="0.11" />

          {/* Desk */}
          <rect x="404" y="352" width="420" height="15" rx="7" fill="var(--desk)" />
          <rect x="404" y="365" width="420" height="7" rx="3" fill="var(--desk-edge)" />
          <rect x="600" y="370" width="13" height="90" rx="5" fill="var(--desk-edge)" />

          {/* Chair back — only its rim shows past the body. */}
          <rect x="322" y="292" width="108" height="168" rx="26" fill="var(--chair)" />

          <g className="sky-body">
            <path d="M330 460 L336 322 C 340 296, 402 288, 416 314 L432 460 Z" fill="var(--shirt)" />
            <path d="M394 460 L416 314 C 424 300, 432 308, 432 322 L432 460 Z" fill="var(--shirt-shade)" />
            <path d="M417 316 L432 452" stroke="var(--orb-glow)" strokeWidth="3" opacity="0.3" fill="none" strokeLinecap="round" />
            <circle cx="382" cy="262" r="34" fill="var(--skin)" />
            <path d="M348 262 A34 34 0 0 1 416 262 Z" fill="var(--hair)" />
            <path d="M348 262 q0 16 5 24 q-9 -6 -9 -24 Z" fill="var(--hair)" />
            <path d="M346 258 A36 36 0 0 1 418 258" stroke="var(--mug)" strokeWidth="7" fill="none" strokeLinecap="round" />
            <rect x="340" y="252" width="13" height="24" rx="6" fill="var(--mug)" />
            <rect x="411" y="252" width="13" height="24" rx="6" fill="var(--mug)" />
          </g>

          <g className="sky-hand">
            <path d="M420 330 C 452 328, 476 350, 494 352" stroke="var(--skin)" strokeWidth="19" strokeLinecap="round" fill="none" />
          </g>

          {/* Laptop, with code typing itself in. */}
          <g>
            <path d="M470 352 L484 268 L594 268 L588 352 Z" fill="var(--laptop)" />
            <rect className="sky-glow" x="492" y="277" width="92" height="62" rx="4" fill="url(#screenGrad)" />
            <g>
              <rect className="sky-code" x="498" y="284" width="52" height="4" rx="2" fill="var(--code-a)" />
              <rect className="sky-code" x="502" y="294" width="66" height="4" rx="2" fill="var(--code-b)" />
              <rect className="sky-code" x="502" y="304" width="40" height="4" rx="2" fill="var(--code-c)" />
              <rect className="sky-code" x="498" y="314" width="58" height="4" rx="2" fill="var(--code-b)" />
              <rect className="sky-code" x="498" y="324" width="30" height="4" rx="2" fill="var(--code-a)" />
            </g>
            <rect className="sky-cursor" x="531" y="322" width="3.5" height="7" fill="var(--code-c)" />
            <rect x="462" y="348" width="136" height="9" rx="4" fill="var(--laptop-edge)" />
            <ellipse cx="624" cy="347" rx="11" ry="7" fill="var(--laptop)" />
          </g>

          <g>
            <path className="sky-steam" d="M652 340 q9 -13 0 -26" stroke="var(--steam)" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path className="sky-steam" d="M665 340 q9 -13 0 -26" stroke="var(--steam)" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path className="sky-steam" d="M678 340 q9 -13 0 -26" stroke="var(--steam)" strokeWidth="5" strokeLinecap="round" fill="none" />
            <rect x="648" y="326" width="36" height="27" rx="6" fill="var(--mug)" />
            <path d="M684 333 q13 5 0 13" stroke="var(--mug)" strokeWidth="6" fill="none" />
          </g>

          <g>
            <path d="M738 326 q-17 -30 -4 -47 q13 17 4 47 Z" fill="var(--plant)" />
            <path d="M742 326 q21 -21 34 -13 q-17 9 -34 13 Z" fill="var(--plant)" />
            <path d="M730 326 h34 l-6 27 h-22 Z" fill="var(--pot)" />
          </g>
        </g>
        <g>
          {[[300, 402], [428, 420], [896, 392], [1004, 414]].map(([cx, cy], i) => (
            <circle key={i} className="sky-firefly" cx={cx} cy={cy} r="3.2" fill="var(--firefly)" />
          ))}
        </g>

        <g>
          {[36, 88, 148, 206, 892, 952, 1016, 1068].map((x, i) => (
            <path
              key={i}
              className="sky-grass"
              d={`M${x} 462 q5 -22 -2 -35`}
              stroke="var(--grass)"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              style={{ transformOrigin: `${x}px 462px` }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

const ROOM_STARS = [
  [78, 92], [126, 62], [172, 108], [214, 74], [258, 118],
  [104, 138], [196, 150], [296, 88], [60, 172], [244, 44],
];

/* Feature card: indoors — a desk by a window, a design canvas on the monitor. */
export function StudioSpaceScene() {
  return (
    <div className="sky-scene" aria-hidden="true">
      <style>{SCENE_CSS}</style>
      <svg viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice" role="presentation">
        <defs>
          <linearGradient id="roomGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--room)" />
            <stop offset="100%" stopColor="var(--room-2)" />
          </linearGradient>
          <linearGradient id="paneGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--pane-1)" />
            <stop offset="100%" stopColor="var(--pane-2)" />
          </linearGradient>
          <linearGradient id="coneGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--lamp-light)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--lamp-light)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="monitorGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--screen)" />
            <stop offset="100%" stopColor="var(--screen-2)" />
          </linearGradient>
        </defs>

        {/* Wall + floor */}
        <rect width="400" height="700" fill="url(#roomGrad)" />
        <rect y="430" width="400" height="270" fill="var(--floor)" opacity="0.5" />

        {/* Window: sky, stars, a skyline */}
        <g>
          <rect x="46" y="40" width="272" height="200" rx="14" fill="var(--frame)" />
          <rect x="56" y="50" width="252" height="180" rx="9" fill="url(#paneGrad)" />
          <circle cx="268" cy="92" r="20" fill="var(--orb)" opacity="0.9" />
          {ROOM_STARS.map(([cx, cy], i) => (
            <circle key={i} className="sky-star" cx={cx} cy={cy} r={i % 3 === 0 ? 2.2 : 1.5} fill="var(--star)" />
          ))}
          <g fill="var(--city)" opacity="0.85">
            <rect x="60" y="176" width="26" height="54" />
            <rect x="90" y="150" width="20" height="80" />
            <rect x="114" y="188" width="30" height="42" />
            <rect x="148" y="162" width="22" height="68" />
            <rect x="174" y="196" width="26" height="34" />
            <rect x="204" y="170" width="24" height="60" />
            <rect x="232" y="186" width="30" height="44" />
            <rect x="266" y="158" width="20" height="72" />
            <rect x="290" y="192" width="18" height="38" />
          </g>
          <rect x="56" y="50" width="252" height="180" rx="9" fill="none" stroke="var(--frame)" strokeWidth="6" />
          <rect x="178" y="50" width="8" height="180" fill="var(--frame)" />
          <path d="M56 50 q26 8 20 40 q-8 34 4 60 q10 26 -2 48 q-8 20 2 32 L56 230 Z" fill="var(--wall-art)" opacity="0.45" />
        </g>
        <rect x="38" y="236" width="288" height="11" rx="4" fill="var(--frame)" />

        {/* Wall clock */}
        <g>
          <circle cx="330" cy="96" r="23" fill="var(--frame)" />
          <circle cx="330" cy="96" r="17" fill="var(--room)" />
          <rect className="st-hand" x="328.5" y="82" width="3" height="15" rx="1.5" fill="var(--frame)" />
          <circle cx="330" cy="96" r="2.6" fill="var(--lamp)" />
        </g>

        {/* Sticky notes on the wall */}
        <g>
          <rect className="st-note" x="332" y="150" width="30" height="30" rx="3" fill="var(--note-1)" transform="rotate(-5 347 165)" />
          <rect className="st-note" x="356" y="188" width="28" height="28" rx="3" fill="var(--note-2)" transform="rotate(6 370 202)" />
          <rect className="st-note" x="330" y="204" width="26" height="26" rx="3" fill="var(--note-3)" transform="rotate(-3 343 217)" />
        </g>

        {/* One drifting swatch, as a nod to the palette work. */}
        <g>
          <rect className="st-swatch" x="20" y="268" width="32" height="32" rx="9" fill="var(--swatch-1)" />
        </g>

        {/* Desk lamp, throwing a cone over the desk */}
        <g>
          <path className="st-lamp-cone" d="M96 316 L182 430 L34 430 Z" fill="url(#coneGrad)" />
          <rect x="86" y="330" width="8" height="86" rx="4" fill="var(--frame)" />
          <path d="M66 316 q24 -30 48 0 Z" fill="var(--lamp)" />
          <rect x="70" y="412" width="42" height="8" rx="4" fill="var(--frame)" />
          <g>
            {[[64, 414], [96, 420], [128, 412], [152, 424]].map(([cx, cy], i) => (
              <circle key={i} className="st-mote" cx={cx} cy={cy} r="2.2" fill="var(--lamp-light)" />
            ))}
          </g>
        </g>

        {/* Desk */}
        <rect x="10" y="416" width="380" height="16" rx="7" fill="var(--desk)" />
        <rect x="10" y="430" width="380" height="7" rx="3" fill="var(--desk-edge)" />

        {/* Monitor with a design canvas that keeps recomposing */}
        <g>
          <rect x="150" y="292" width="176" height="112" rx="10" fill="var(--frame)" />
          <rect className="sky-glow" x="158" y="300" width="160" height="96" rx="6" fill="url(#monitorGrad)" />
          <g>
            <g className="st-shape">
              <circle cx="206" cy="336" r="20" fill="var(--swatch-1)" />
              <rect x="238" y="320" width="60" height="12" rx="6" fill="var(--code-b)" />
              <rect x="238" y="342" width="42" height="12" rx="6" fill="var(--code-c)" />
            </g>
            <g className="st-shape">
              <rect x="176" y="316" width="52" height="52" rx="12" fill="var(--swatch-2)" />
              <rect x="240" y="330" width="62" height="12" rx="6" fill="var(--code-a)" />
              <rect x="240" y="352" width="34" height="12" rx="6" fill="var(--code-b)" />
            </g>
            <g className="st-shape">
              <path d="M182 366 L206 314 L230 366 Z" fill="var(--swatch-3)" />
              <rect x="242" y="324" width="56" height="12" rx="6" fill="var(--code-c)" />
              <rect x="242" y="346" width="48" height="12" rx="6" fill="var(--code-a)" />
            </g>
          </g>
          <rect x="222" y="404" width="32" height="12" fill="var(--frame)" />
          <rect x="200" y="412" width="76" height="8" rx="4" fill="var(--frame)" />
          <path d="M244 416 q18 22 44 20" stroke="var(--frame)" strokeWidth="3" fill="none" opacity="0.6" />
        </g>

        {/* Pencil cup */}
        <g>
          <path d="M360 388 l4 -22" stroke="var(--book-4)" strokeWidth="4" strokeLinecap="round" />
          <path d="M368 388 l1 -26" stroke="var(--swatch-3)" strokeWidth="4" strokeLinecap="round" />
          <path d="M376 388 l-3 -20" stroke="var(--note-3)" strokeWidth="4" strokeLinecap="round" />
          <rect x="354" y="386" width="28" height="30" rx="5" fill="var(--metal)" />
        </g>

        {/* Books, stacked and colour-coded */}
        <g>
          <rect x="286" y="396" width="70" height="10" rx="3" fill="var(--book-1)" />
          <rect x="292" y="384" width="62" height="10" rx="3" fill="var(--book-2)" />
          <rect x="288" y="372" width="58" height="10" rx="3" fill="var(--book-3)" />
          <rect x="298" y="360" width="46" height="10" rx="3" fill="var(--book-4)" />
        </g>

        {/* Mug */}
        <g>
          <path className="sky-steam" d="M42 396 q7 -11 0 -22" stroke="var(--steam)" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path className="sky-steam" d="M52 396 q7 -11 0 -22" stroke="var(--steam)" strokeWidth="4" strokeLinecap="round" fill="none" />
          <rect x="34" y="392" width="28" height="22" rx="5" fill="var(--mug)" />
          <path d="M62 397 q10 4 0 11" stroke="var(--mug)" strokeWidth="5" fill="none" />
        </g>

        {/* Rug */}
        <ellipse cx="212" cy="486" rx="152" ry="30" fill="var(--rug)" opacity="0.28" />

        {/* Cat, tail flicking */}
        <g>
          <path className="st-tail" d="M248 496 q30 -6 26 -30" stroke="var(--cat)" strokeWidth="9" fill="none" strokeLinecap="round" style={{ transformOrigin: "248px 496px" }} />
          <path d="M212 500 q0 -40 22 -40 q22 0 22 40 Z" fill="var(--cat)" />
          <circle cx="234" cy="452" r="17" fill="var(--cat)" />
          <path d="M221 440 l2 -13 l10 8 Z" fill="var(--cat)" />
          <path d="M247 440 l-2 -13 l-10 8 Z" fill="var(--cat)" />
          <circle cx="228" cy="450" r="2.4" fill="var(--lamp-light)" />
          <circle cx="240" cy="450" r="2.4" fill="var(--lamp-light)" />
        </g>

        {/* Plant on the floor */}
        <g>
          <g className="st-leaf" style={{ transformOrigin: "112px 500px" }}>
            <path d="M112 500 q-18 -36 -4 -58 q14 22 4 58 Z" fill="var(--plant)" />
            <path d="M116 500 q24 -26 40 -16 q-20 11 -40 16 Z" fill="var(--plant)" />
            <path d="M108 500 q-26 -20 -40 -8 q20 6 40 8 Z" fill="var(--plant)" />
          </g>
          <path d="M92 496 h44 l-7 24 h-30 Z" fill="var(--pot)" />
        </g>
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Project-card scenes. Each one depicts what that product actually does, so
   the card art carries the same claim as its copy. Wide and short to match the
   card's banner slot; palette comes from the same --sky-scene variables, so
   all three follow light/dark with everything else.
   ------------------------------------------------------------------------- */

/* 01 — Member OS: one app pulling the utilities, JOY and content together. */
export function MemberOsScene() {
  const apps = [
    ["var(--swatch-1)", 0], ["var(--swatch-3)", 1], ["var(--note-1)", 2],
    ["var(--plant)", 3], ["var(--swatch-2)", 4], ["var(--mug)", 5],
  ];
  return (
    <div className="sky-scene" aria-hidden="true">
      <style>{SCENE_CSS}</style>
      <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice" role="presentation">
        <defs>
          <linearGradient id="mosBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--screen)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--swatch-2)" stopOpacity="0.14" />
          </linearGradient>
        </defs>
        <rect width="320" height="140" fill="url(#mosBg)" />

        {/* Phone: the single app everything lives in. */}
        <rect x="112" y="14" width="76" height="126" rx="13" fill="var(--frame)" />
        <rect x="117" y="19" width="66" height="112" rx="9" fill="var(--surface)" />
        <rect x="140" y="23" width="20" height="3" rx="1.5" fill="var(--frame)" opacity="0.5" />
        <g>
          {apps.map(([fill, i]) => (
            <rect
              key={i}
              className="sc-pop"
              x={124 + (i % 3) * 21}
              y={34 + Math.floor(i / 3) * 21}
              width="16"
              height="16"
              rx="5"
              fill={fill}
            />
          ))}
        </g>
        {/* JOY balance ticking along inside the app */}
        <rect x="124" y="80" width="52" height="15" rx="5" fill="var(--note-1)" opacity="0.35" />
        <circle className="sc-heart" cx="132" cy="87.5" r="5" fill="var(--note-1)" />
        <rect x="141" y="85" width="28" height="5" rx="2.5" fill="var(--frame)" opacity="0.45" />
        {/* Tab bar */}
        <g>
          <rect x="121" y="118" width="58" height="9" rx="4.5" fill="var(--metal)" opacity="0.3" />
          <circle cx="132" cy="122.5" r="3" fill="var(--screen)" />
          <circle cx="146" cy="122.5" r="2.4" fill="var(--metal)" />
          <circle cx="160" cy="122.5" r="2.4" fill="var(--metal)" />
          <circle cx="172" cy="122.5" r="2.4" fill="var(--metal)" />
        </g>

        {/* Utilities orbiting in, wired back to the app. */}
        <g stroke="var(--screen)" strokeWidth="1.6" strokeDasharray="4 4" opacity="0.5" fill="none">
          <path d="M112 60 C 88 56, 74 44, 58 40" />
          <path d="M112 84 C 86 92, 72 104, 54 108" />
          <path d="M188 58 C 214 52, 232 42, 252 38" />
          <path d="M188 88 C 216 96, 236 106, 258 110" />
        </g>
        <g>
          <g className="sc-bob">
            <rect x="30" y="26" width="28" height="28" rx="9" fill="var(--swatch-3)" />
            <rect x="38" y="36" width="12" height="3" rx="1.5" fill="var(--surface)" />
            <rect x="38" y="42" width="8" height="3" rx="1.5" fill="var(--surface)" />
          </g>
          <g className="sc-bob">
            <rect x="26" y="94" width="28" height="28" rx="9" fill="var(--note-1)" />
            <circle cx="40" cy="108" r="6" fill="var(--surface)" opacity="0.75" />
          </g>
          <g className="sc-bob">
            <rect x="248" y="24" width="28" height="28" rx="9" fill="var(--swatch-1)" />
            <path d="M256 40 l6 6 l10 -12" stroke="var(--surface)" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        </g>
        <g className="sc-bob">
          <rect x="254" y="96" width="28" height="28" rx="9" fill="var(--plant)" />
          <rect x="262" y="105" width="12" height="10" rx="2" fill="var(--surface)" opacity="0.8" />
        </g>
      </svg>
    </div>
  );
}

/* 02 — HugoPSY: a conversation that feels safe, plus self-tracking. */
export function HugoPsyScene() {
  return (
    <div className="sky-scene" aria-hidden="true">
      <style>{SCENE_CSS}</style>
      <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice" role="presentation">
        <defs>
          <linearGradient id="psyBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--swatch-1)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--screen-2)" stopOpacity="0.14" />
          </linearGradient>
        </defs>
        <rect width="320" height="140" fill="url(#psyBg)" />

        {/* The thread */}
        <g>
          <g className="sc-bubble">
            <rect x="20" y="18" width="104" height="22" rx="11" fill="var(--surface)" />
            <rect x="30" y="26" width="58" height="4" rx="2" fill="var(--metal)" />
            <rect x="30" y="33" width="38" height="3" rx="1.5" fill="var(--metal)" opacity="0.6" />
          </g>
          <g className="sc-bubble">
            <rect x="92" y="48" width="112" height="22" rx="11" fill="var(--screen)" />
            <rect x="102" y="56" width="66" height="4" rx="2" fill="var(--surface)" opacity="0.9" />
            <rect x="102" y="63" width="44" height="3" rx="1.5" fill="var(--surface)" opacity="0.6" />
          </g>
          <g className="sc-bubble">
            <rect x="20" y="78" width="92" height="22" rx="11" fill="var(--surface)" />
            <rect x="30" y="86" width="48" height="4" rx="2" fill="var(--metal)" />
            <rect x="30" y="93" width="30" height="3" rx="1.5" fill="var(--metal)" opacity="0.6" />
          </g>
          {/* Still typing — the bot never rushes the user. */}
          <g className="sc-bubble">
            <rect x="20" y="108" width="46" height="20" rx="10" fill="var(--surface)" />
            <circle className="sc-dot" cx="32" cy="118" r="2.8" fill="var(--metal)" />
            <circle className="sc-dot" cx="43" cy="118" r="2.8" fill="var(--metal)" />
            <circle className="sc-dot" cx="54" cy="118" r="2.8" fill="var(--metal)" />
          </g>
        </g>

        {/* Mood tracked over time */}
        <g>
          <rect x="216" y="20" width="88" height="100" rx="12" fill="var(--surface)" opacity="0.85" />
          <path
            className="sc-heart"
            d="M260 44 c -5 -7 -16 -4 -16 5 c 0 8 10 13 16 18 c 6 -5 16 -10 16 -18 c 0 -9 -11 -12 -16 -5 Z"
            fill="var(--lamp)"
          />
          <g className="sc-draw">
            <path d="M228 100 L242 88 L256 94 L270 76 L292 68" stroke="var(--plant)" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <g fill="var(--metal)" opacity="0.45">
            <rect x="228" y="108" width="14" height="3.5" rx="1.75" />
            <rect x="248" y="108" width="14" height="3.5" rx="1.75" />
            <rect x="268" y="108" width="24" height="3.5" rx="1.75" />
          </g>
        </g>
      </svg>
    </div>
  );
}

/* 03 — Student Bio: one shareable page holding profile, projects and links. */
export function StudentBioScene() {
  return (
    <div className="sky-scene" aria-hidden="true">
      <style>{SCENE_CSS}</style>
      <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice" role="presentation">
        <defs>
          <linearGradient id="bioBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--note-1)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--swatch-2)" stopOpacity="0.14" />
          </linearGradient>
        </defs>
        <rect width="320" height="140" fill="url(#bioBg)" />

        {/* The bio page itself */}
        <rect x="88" y="12" width="144" height="128" rx="14" fill="var(--surface)" />
        <g>
          <circle className="sc-ring" cx="160" cy="40" r="19" fill="none" stroke="var(--swatch-2)" strokeWidth="2.6" strokeDasharray="7 5" />
          <circle cx="160" cy="40" r="13" fill="var(--skin)" />
          <path d="M147 40 A13 13 0 0 1 173 40 Z" fill="var(--hair)" />
        </g>
        <rect x="136" y="62" width="48" height="6" rx="3" fill="var(--frame)" opacity="0.6" />
        <rect x="146" y="72" width="28" height="4" rx="2" fill="var(--metal)" opacity="0.7" />
        {/* Links stacking in */}
        <g>
          <rect className="sc-pop" x="102" y="86" width="116" height="13" rx="6.5" fill="var(--swatch-3)" />
          <rect className="sc-pop" x="102" y="103" width="116" height="13" rx="6.5" fill="var(--swatch-1)" />
          <rect className="sc-pop" x="102" y="120" width="116" height="13" rx="6.5" fill="var(--plant)" />
        </g>

        {/* Same page on a phone — it is responsive by default. */}
        <g>
          <rect x="20" y="34" width="46" height="86" rx="9" fill="var(--frame)" />
          <rect x="24" y="38" width="38" height="78" rx="6" fill="var(--surface)" />
          <circle cx="43" cy="53" r="8" fill="var(--skin)" />
          <rect x="31" y="66" width="24" height="4" rx="2" fill="var(--metal)" opacity="0.7" />
          <rect className="sc-pop" x="29" y="76" width="28" height="8" rx="4" fill="var(--swatch-3)" />
          <rect className="sc-pop" x="29" y="88" width="28" height="8" rx="4" fill="var(--swatch-1)" />
          <rect className="sc-pop" x="29" y="100" width="28" height="8" rx="4" fill="var(--plant)" />
        </g>

        {/* Share code — the bit that goes on a CV. */}
        <g>
          <rect x="252" y="40" width="52" height="52" rx="9" fill="var(--surface)" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <rect
              key={i}
              className="sc-qr"
              x={260 + (i % 3) * 13}
              y={48 + Math.floor(i / 3) * 13}
              width="9"
              height="9"
              rx="2"
              fill="var(--frame)"
            />
          ))}
          <rect x="264" y="100" width="28" height="4" rx="2" fill="var(--metal)" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
}

/* JOY — a shared balance, rewards and transfers across Hugo Studio. */
export function JoyScene() {
  return (
    <div className="sky-scene" aria-hidden="true">
      <style>{SCENE_CSS}</style>
      <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice" role="presentation">
        <defs>
          <linearGradient id="joyBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2678ff" stopOpacity="0.2" />
            <stop offset="55%" stopColor="#7359e8" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#f0445e" stopOpacity="0.14" />
          </linearGradient>
          <linearGradient id="joyCard" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2678ff" />
            <stop offset="58%" stopColor="#7359e8" />
            <stop offset="100%" stopColor="#d45aa3" />
          </linearGradient>
        </defs>
        <rect width="320" height="140" fill="url(#joyBg)" />

        <g className="sc-bob">
          <rect x="18" y="18" width="174" height="104" rx="18" fill="url(#joyCard)" />
          <text x="34" y="43" fill="white" opacity="0.78" fontSize="8" fontWeight="700" letterSpacing="1.5">JOY BALANCE</text>
          <text x="34" y="72" fill="white" fontSize="25" fontWeight="900">2,480</text>
          <circle cx="164" cy="46" r="15" fill="white" opacity="0.2" />
          <path d="M158 46 l4 4 l8 -9" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="34" y="91" width="64" height="17" rx="8.5" fill="white" opacity="0.2" />
          <text x="48" y="102.5" fill="white" fontSize="7" fontWeight="800">TRANSFER</text>
        </g>

        <g>
          {[0, 1, 2].map((i) => (
            <g key={i} className="sc-pop">
              <rect x="210" y={20 + i * 36} width="92" height="28" rx="10" fill="var(--room)" opacity="0.9" />
              <circle cx="226" cy={34 + i * 36} r="7" fill={["#2678ff", "#7359e8", "#f0445e"][i]} />
              <rect x="240" y={29 + i * 36} width="34" height="4" rx="2" fill="var(--frame)" opacity="0.45" />
              <rect x="240" y={37 + i * 36} width="22" height="3" rx="1.5" fill="var(--metal)" opacity="0.55" />
              <text x="280" y={37 + i * 36} fill={i === 1 ? "#f0445e" : "#2678ff"} fontSize="7" fontWeight="900">
                {i === 1 ? "-20" : "+JOY"}
              </text>
            </g>
          ))}
        </g>

        {[0, 1, 2, 3].map((i) => (
          <g key={i} className="sc-bob">
            <circle cx={16 + i * 20} cy={128 - (i % 2) * 5} r="7" fill={i % 2 ? "#d45aa3" : "#0797ff"} />
            <text x={13.5 + i * 20} y={131 - (i % 2) * 5} fill="white" fontSize="7" fontWeight="900">J</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* Hugo Arcade — a lightweight full-screen game world with score and bosses. */
export function ArcadeScene() {
  return (
    <div className="sky-scene" aria-hidden="true">
      <style>{SCENE_CSS}</style>
      <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice" role="presentation">
        <defs>
          <linearGradient id="arcadeBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#071229" />
            <stop offset="52%" stopColor="#251250" />
            <stop offset="100%" stopColor="#4a153f" />
          </linearGradient>
          <linearGradient id="shipGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0797ff" />
            <stop offset="100%" stopColor="#d45aa3" />
          </linearGradient>
        </defs>
        <rect width="320" height="140" fill="url(#arcadeBg)" />

        {[18, 42, 66, 94, 122, 154, 188, 218, 250, 286, 306].map((x, i) => (
          <circle key={x} className="sky-star" cx={x} cy={18 + (i % 4) * 24} r={i % 3 === 0 ? 1.7 : 1} fill="#8eb7ff" />
        ))}

        <g opacity="0.24" stroke="#7359e8" strokeWidth="1">
          <path d="M0 116 H320" />
          <path d="M0 128 H320" />
          <path d="M50 100 L30 140 M110 100 L100 140 M210 100 L220 140 M270 100 L292 140" />
        </g>

        <g className="sc-bob">
          <path d="M70 74 L95 91 L70 108 L76 91 Z" fill="url(#shipGlow)" />
          <circle cx="76" cy="91" r="5" fill="white" />
          <path d="M61 84 L45 91 L61 98 Z" fill="#0797ff" opacity="0.75" />
        </g>
        <g className="sc-draw" stroke="#8eb7ff" strokeWidth="2.5" strokeLinecap="round">
          <path d="M100 84 H154" />
          <path d="M104 98 H138" />
        </g>

        <g className="sc-bob">
          <path d="M232 48 L266 62 L276 91 L257 112 L226 105 L213 78 Z" fill="#f0445e" opacity="0.92" />
          <circle cx="238" cy="77" r="5" fill="#071229" />
          <circle cx="260" cy="82" r="5" fill="#071229" />
          <path d="M235 98 Q247 106 260 96" stroke="#071229" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>

        <rect x="18" y="14" width="96" height="17" rx="8.5" fill="white" opacity="0.1" />
        <text x="29" y="25.5" fill="white" fontSize="7" fontWeight="800" letterSpacing="0.8">SCORE  20,481</text>
        <rect x="205" y="14" width="97" height="17" rx="8.5" fill="#f0445e" opacity="0.2" />
        <text x="222" y="25.5" fill="#ff9cac" fontSize="7" fontWeight="900" letterSpacing="0.8">BOSS  72%</text>
      </svg>
    </div>
  );
}
