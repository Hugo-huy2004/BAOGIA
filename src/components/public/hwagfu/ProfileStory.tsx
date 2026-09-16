"use client";

import { useId, useRef, type ReactNode } from "react";
import {
  motion,
  easeIn,
  easeInOut,
  easeOut,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { ChevronRight, Eye, MessagesSquare, ShieldCheck, type LucideIcon } from "lucide-react";
import { Link } from "./RouterLink";
import { cn } from "./utils";
import { techStack, type Tech, type TechCategory } from "./tech-stack";
import Icon from "./Icon";
import { useFilm } from "./useFilm";
import { useScrub } from "./useScrub";
import { playHapticTick } from "../../../utils/CinematicSoundEngine";

export type EducationEntry = {
  period: string;
  school: string;
  degree: string;
  description: string;
  /** The year stamped on the note. */
  year: string;
};

export type PromiseEntry = { title: string; desc: string };

type ProfileStoryProps = {
  kicker: string;
  heading: string;
  summary: string;
  educationHeading: string;
  education: EducationEntry[];
  /** Timeline labels while the notes play: start years, then "now". */
  milestones: string[];
  techHeading: string;
  techNote: string;
  categories: Record<TechCategory["id"], string>;
  promiseLabel: string;
  promiseHeading: string;
  promises: PromiseEntry[];
  cvLabel: string;
};

const vivid = ["#17EAD9", "#35CFE1", "#4CB5E7", "#6078EA", "#7B8FF2", "#FFD166", "#FF6B8A"];
const spring = { stiffness: 150, damping: 22, mass: 0.6 };

/**
 * The storyboard, in scroll progress. One place to retime the film: every
 * scene reads its window from here.
 */
const T = {
  intro: [0.01, 0.04, 0.15, 0.18],
  rightRibbon: [0.03, 0.1],
  leftRibbon: [0.045, 0.115],
  tailLag: 0.028,
  stem: [0.1, 0.125],
  hook: [0.115, 0.14],
  inflate: [0.12, 0.15],
  drop: [0.13, 0.165],
  face: [0.155, 0.18, 0.655, 0.67],
  lift: [0.2, 0.235, 0.64, 0.665],
  rays: 0.215,
  glow: [0.265, 0.3, 0.42, 0.445],
  statement: [0.285, 0.305, 0.425, 0.445],
  likeWords: [0.3, 0.365],
  likeRest: [0.355, 0.38, 0.425, 0.445],
  happy: [0.27, 0.29, 0.43, 0.45],
  edu: [0.43, 0.45, 0.635, 0.655],
  dim: [0.445, 0.465, 0.64, 0.66],
  timeline: [0.44, 0.46, 0.645, 0.665],
  note: 0.45,
  noteGap: 0.1,
  launch: 0.672,
  sky: [0.69, 0.72],
  rise: [0.7, 0.75],
  tech: [0.73, 0.75, 0.8, 0.815],
  fire: 0.806,
  fireworks: 0.807,
  fireworksGap: 0.003,
  flight: 0.022,
  stars: [0.905, 0.935],
  sink: [0.9, 0.935],
  promise: [0.905, 0.93],
  promiseItem: 0.925,
  promiseGap: 0.018,
  seamOut: [0.975, 1],
} as const;

/**
 * The profile as a second product film, straight after the services one.
 * Two ribbons sweep in from either side and form Hugo's official drop, which
 * becomes Hugo's glass prism. Light pours in and it says what Hugo
 * likes; archive notes rise out of the drop and sink back. Then the drop
 * unwinds and shoots up into a bright Ho Chi Minh City skyline. Bitexco
 * launches the tech stack as fireworks and the logos settle as stars above
 * the promises.
 *
 * Everything drawn is decorative (`aria-hidden`). The same content lives once
 * as real markup below the film — read by screen readers and crawlers, and
 * shown instead of the film to visitors who ask for reduced motion.
 */
export default function ProfileStory({
  kicker,
  heading,
  summary,
  educationHeading,
  education,
  milestones,
  techHeading,
  techNote,
  categories,
  promiseLabel,
  promiseHeading,
  promises,
  cvLabel,
}: ProfileStoryProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Fades in while the services film's "SEO" is still on screen, so the
  // ribbons are already flying as it goes.
  const { progress, frame } = useFilm(ref, 880, { enters: true });

  // The first sentence is Jot's; the rest runs as a caption.
  const [lead, ...rest] = summary.split(/(?<=\.)\s+/);
  const shake = useScrub(progress, [T.fire - 0.002, T.fire + 0.001, T.fire + 0.005, T.fire + 0.012], [0, 6, -4, 0]);
  const controlsOpacity = useScrub(progress, [0.1, 0.15, 0.98, 1], [0, 1, 1, 0]);

  return (
    <section data-anchor="skills" className="relative -mt-[100svh] text-foreground motion-reduce:mt-0">
      <div ref={ref} className="relative h-[880svh] motion-reduce:hidden">
        <motion.div style={frame} className="sticky top-0 h-svh min-h-[35rem] overflow-hidden bg-background">
          <div aria-hidden className="absolute inset-0">
            <Atmosphere progress={progress} />

            <motion.div style={{ y: shake }} className="absolute inset-0">
              <TechFireworks progress={progress} />
              <CitySkyline progress={progress} />
            </motion.div>

            <RibbonDrop progress={progress} />

            <div className="absolute inset-x-0 top-[18svh] bottom-[14svh] z-30 flex items-center justify-center">
              {education.map((item, index) => (
                <ArchiveNote
                  key={item.school}
                  progress={progress}
                  item={item}
                  index={index}
                  start={T.note + index * T.noteGap}
                />
              ))}
            </div>

            <Statement progress={progress} sentence={lead} />
            <Timeline progress={progress} milestones={milestones} />

            <FilmHeader progress={progress} range={T.intro}>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.68rem] font-mono font-semibold tracking-[0.22em] text-[#00f0ff] uppercase backdrop-blur-md dark:bg-black/30 mb-2">
                <span className="size-1.5 rounded-full bg-[#00f0ff]" />
                <span>SCENE 04 · {kicker}</span>
              </div>
              <p className="headline-section mt-1">{heading}</p>
            </FilmHeader>
            <FilmHeader progress={progress} range={T.edu}>
              <p className="headline-section">{educationHeading}</p>
            </FilmHeader>
            <FilmHeader progress={progress} range={T.tech}>
              <p className="headline-section">{techHeading}</p>
              <p className="mx-auto mt-2 max-w-xl text-[0.95rem] leading-relaxed text-foreground/60 sm:text-lg">
                {techNote}
              </p>
            </FilmHeader>

            <PromiseFinale progress={progress} label={promiseLabel} heading={promiseHeading} promises={promises} />

            <Caption progress={progress} range={T.likeRest}>
              {rest.join(" ")}
            </Caption>
          </div>

          <motion.div style={{ opacity: controlsOpacity }} className="absolute inset-x-5 bottom-[calc(4.9rem+env(safe-area-inset-bottom))] z-50 flex items-end gap-4 md:inset-x-8 md:bottom-7">
            <div aria-hidden className="min-w-0 flex-1">
              <ProgressRail labels={[kicker, educationHeading, techHeading, promiseLabel]} progress={progress} />
            </div>
            <Link
              href="/cv"
              onClick={() => playHapticTick()}
              className="group ml-auto inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#00f0ff] px-5 text-sm font-bold text-black shadow-[0_0_24px_rgba(0,240,255,0.35)] transition-all hover:scale-[1.04] hover:shadow-[0_0_36px_rgba(0,240,255,0.6)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
            >
              <span className="uppercase tracking-wider text-xs">{cvLabel}</span>
              <ChevronRight className="ml-1 size-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      <div className="sr-only motion-reduce:not-sr-only">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-32">
          <p className="kicker text-hue-orange">{kicker}</p>
          <h2 className="headline-section mt-2 text-foreground">{heading}</h2>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">{summary}</p>

          <div className="mt-14 grid gap-14 lg:grid-cols-2">
            <div>
              <h3 className="headline-card text-foreground">{educationHeading}</h3>
              <ol className="mt-6 space-y-7">
                {education.map((item) => (
                  <li key={item.school} className="border-t border-border pt-5">
                    <p className="text-sm text-muted-foreground tabular-nums">{item.period}</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{item.school}</p>
                    <p className="mt-1 text-foreground/80">{item.degree}</p>
                    <p className="mt-2 leading-relaxed text-muted-foreground">{item.description}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="headline-card text-foreground">{techHeading}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{techNote}</p>
              <dl className="mt-6 space-y-5">
                {techStack.map((category) => (
                  <div key={category.id} className="border-t border-border pt-4">
                    <dt className="text-sm font-semibold text-muted-foreground">{categories[category.id]}</dt>
                    <dd className="mt-1 text-foreground">{category.items.map((tech) => tech.name).join(" · ")}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <p className="kicker mt-20 text-hue-green">{promiseLabel}</p>
          <h3 className="headline-section mt-2 text-foreground">{promiseHeading}</h3>
          <ul className="mt-8 grid gap-10 sm:grid-cols-3">
            {promises.map((item) => (
              <li key={item.title}>
                <h4 className="headline-card text-foreground">{item.title}</h4>
                <p className="mt-2 leading-relaxed text-muted-foreground">{item.desc}</p>
              </li>
            ))}
          </ul>

          <Link href="/cv" className="link-more mt-14 hidden text-lg motion-reduce:inline-flex">
            {cvLabel}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>

      {/* Contact sits on the band colour; fade the film into it. */}
      <div aria-hidden className="h-[clamp(7rem,24svh,14rem)] bg-linear-to-b from-background to-band" />
    </section>
  );
}

/* ───────────────────────── frame ───────────────────────── */

// Star field for the night sky, from a fixed seed so server and client agree.
const starField = (() => {
  let seed = 20513;
  const next = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const layer = (count: number, size: number) =>
    Array.from({ length: count }, () => {
      const x = (next() * 100).toFixed(1);
      const y = (next() * 78).toFixed(1);
      const alpha = (0.35 + next() * 0.65).toFixed(2);
      return `radial-gradient(${size}px ${size}px at ${x}% ${y}%, rgba(255,255,255,${alpha}), transparent)`;
    }).join(",");
  return { small: layer(70, 1.5), large: layer(18, 2.5) };
})();

function Atmosphere({ progress }: { progress: MotionValue<number> }) {
  const warm = useScrub(progress, [0, 0.2, 0.45, 0.66], [0.2, 0.42, 0.26, 0.12]);
  const cool = useScrub(progress, [0, 0.3, 0.55, 0.66], [0.18, 0.3, 0.36, 0.12]);
  // The camera follows the ribbon up: the sky slides down into place.
  const sky = useScrub(progress, T.sky, [0, 1]);
  const skyY = useScrub(progress, [T.sky[0], T.rise[1]], ["-14svh", "0svh"], { ease: easeOut });
  // As the frame scrolls out, its lower edge settles to the plain page
  // background, so the fade into Contact below meets it without a line.
  const bottomSeam = useScrub(progress, T.seamOut, [0, 1]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        style={{ opacity: warm }}
        className="absolute -top-[25%] -left-[10%] h-[70%] w-[70%] rounded-full bg-[#17EAD9] blur-[150px] dark:bg-[#17EAD9]"
      />
      <motion.div
        style={{ opacity: cool }}
        className="absolute top-[30%] -right-[15%] h-[70%] w-[65%] rounded-full bg-[#6078EA] blur-[150px] dark:bg-[#6078EA]"
      />
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_center,rgba(0,0,0,.25)_0.7px,transparent_0.8px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,transparent,black_22%,black_78%,transparent)] dark:[background-image:radial-gradient(circle_at_center,rgba(255,255,255,.2)_0.7px,transparent_0.8px)]" />

      <motion.div style={{ opacity: sky, y: skyY }} className="absolute inset-x-0 -top-[14svh] bottom-0">
        <SkyBackdrop />
      </motion.div>

      <motion.div
        style={{ opacity: bottomSeam }}
        className="absolute inset-x-0 bottom-0 z-30 h-[45%] bg-linear-to-t from-background to-transparent"
      />
    </div>
  );
}

/** Day sky in light mode, night sky in dark mode. */
function SkyBackdrop() {
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#4f9dff_0%,#95c8ff_38%,#d3e9ff_66%,#ffe3c6_100%)] dark:bg-[linear-gradient(to_bottom,#02030a_0%,#060a22_42%,#151238_74%,#2c1840_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[62%] bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,196,120,.75),rgba(255,160,120,.2)_42%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,128,80,.3),rgba(191,90,242,.12)_45%,transparent_72%)]" />

      <div className="absolute inset-0 hidden dark:block" style={{ backgroundImage: starField.small }} />
      <div className="animate-twinkle absolute inset-0 hidden dark:block" style={{ backgroundImage: starField.large }} />
      <div className="absolute inset-x-[-10%] top-[8%] hidden h-[40%] rotate-[-8deg] bg-[radial-gradient(ellipse_at_center,rgba(140,120,255,.14),transparent_70%)] blur-2xl dark:block" />

      <div className="dark:hidden">
        <span className="absolute top-[16%] left-[6%] h-[9%] w-[24%] rounded-[50%] bg-white/75 blur-xl" />
        <span className="absolute top-[12%] left-[14%] h-[8%] w-[12%] rounded-[50%] bg-white/80 blur-lg" />
        <span className="absolute top-[26%] right-[4%] h-[10%] w-[28%] rounded-[50%] bg-white/70 blur-xl" />
        <span className="absolute top-[22%] right-[16%] h-[8%] w-[11%] rounded-[50%] bg-white/80 blur-lg" />
        <span className="absolute top-[44%] left-[38%] h-[6%] w-[20%] rounded-[50%] bg-white/50 blur-xl" />
      </div>
    </>
  );
}

function FilmHeader({
  progress,
  range,
  children,
}: {
  progress: MotionValue<number>;
  range: readonly [number, number, number, number];
  children: ReactNode;
}) {
  const opacity = useScrub(progress, range, [0, 1, 1, 0]);
  const y = useScrub(progress, range, [18, 0, 0, -14]);

  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-x-5 top-[clamp(4.75rem,9svh,7rem)] z-40 mx-auto max-w-4xl text-center text-foreground sm:inset-x-8"
    >
      {children}
    </motion.div>
  );
}

function Caption({
  progress,
  range,
  children,
}: {
  progress: MotionValue<number>;
  range: readonly [number, number, number, number];
  children: string;
}) {
  const opacity = useScrub(progress, range, [0, 1, 1, 0]);
  const y = useScrub(progress, range, [28, 0, 0, -16]);
  const words = children.split(" ");

  return (
    <motion.p
      style={{ opacity, y }}
      className="absolute inset-x-5 top-[62svh] z-40 mx-auto max-w-3xl text-center text-[clamp(1.05rem,1.5vw,1.4rem)] font-medium leading-[1.45] text-balance text-foreground/65 [perspective:700px] sm:inset-x-8"
    >
      {words.map((word, index) => (
        <LitWord key={index} progress={progress} index={index} count={words.length} range={[range[0], range[1] + 0.025]}>
          {word}
        </LitWord>
      ))}
    </motion.p>
  );
}

function ProgressRail({ labels, progress }: { labels: string[]; progress: MotionValue<number> }) {
  const width = useScrub(progress, [0, 1], ["0%", "100%"]);

  return (
    <div className="w-full max-w-[34rem] sm:w-[min(52vw,34rem)]">
      <div className="relative h-px overflow-hidden bg-foreground/15">
        <motion.span
          style={{ width }}
          className="absolute inset-y-0 left-0 bg-linear-to-r from-[#17EAD9] via-[#4CB5E7] to-[#6078EA]"
        />
      </div>
      <div className="mt-2 hidden grid-cols-4 gap-3 text-[0.68rem] font-medium text-foreground/50 sm:grid">
        {labels.map((label, index) => (
          <span key={label} className={cn("truncate", index === 3 && "text-right")}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── ribbon drop ───────────────────────── */

// Exact path from Hugo Studio's official mark, enlarged inside the film.
const DROP_OUTLINE = "M47.43 8.25 A3 3 0 0 1 52.57 8.25 L75.68 46.48 A30 30 0 1 1 24.32 46.48 Z";
const DROP_TRANSFORM = "translate(155 92) scale(2.2)";
const RIGHT_RIBBON = "M 1250 420 C 1000 560 760 520 640 330 C 560 200 470 -10 380 20 C 325 36 285 70 265 110";
const LEFT_RIBBON = "M -700 560 C -420 640 -260 180 -60 250 C 65 294 145 312 205 245";
const LAUNCH_RIBBON = "M 265 110 C 265 -20 50 -100 180 -330 C 330 -520 520 -620 360 -1500";
const STAGE = { cx: 800, cy: 500, jx: 265, jy: 245, scale: 1.1 };
const rayAngles = [200, 243, 287, 330, 15, 58, 102, 145];
const INK = "#15213b";

function RibbonDrop({ progress }: { progress: MotionValue<number> }) {
  const id = useId();
  const body = `${id}-body`;
  // The drop rises and shrinks to make room for the sentence, dims behind the
  // notes, then comes back to centre before launching.
  const scale = useScrub(progress, T.lift, [1, 0.62, 0.62, 1]);
  const y = useScrub(progress, T.lift, ["0svh", "-17svh", "-17svh", "0svh"]);
  const opacity = useScrub(progress, T.dim, [1, 0.28, 0.28, 1]);
  const outlineWidth = useScrub(progress, T.inflate, [10, 24]);
  const fillOpacity = useScrub(progress, [T.inflate[0], T.inflate[1], T.launch, T.launch + 0.018], [0, 1, 1, 0]);
  const prismOpacity = useScrub(progress, [T.inflate[0], T.inflate[1] + 0.02, T.launch, T.launch + 0.018], [0, 1, 1, 0]);
  const faceOpacity = useScrub(progress, T.face, [0, 1, 1, 0]);
  const idleOpacity = useScrub(progress, T.happy, [1, 0, 0, 1]);
  const happyOpacity = useScrub(progress, T.happy, [0, 1, 1, 0]);
  const blink = useScrub(progress, [0.18, 0.235, 0.24, 0.245, 0.36, 0.365, 0.37, 0.655], [1, 1, 0.12, 1, 1, 0.12, 1, 1]);
  const glowOpacity = useScrub(progress, T.glow, [0, 0.75, 0.3, 0]);
  const glowScale = useScrub(progress, [T.glow[0], T.glow[1]], [0.3, 1.2]);
  const launchWidth = useScrub(progress, [T.launch, T.launch + 0.04], [104, 44]);
  const lag = T.tailLag;
  const grid = `translate(${STAGE.cx - STAGE.jx * STAGE.scale} ${STAGE.cy - STAGE.jy * STAGE.scale}) scale(${STAGE.scale}) translate(-8 6)`;

  return (
    <motion.svg
      viewBox="0 0 1600 1000"
      preserveAspectRatio="xMidYMid slice"
      style={{ scale, y, opacity }}
      className="absolute inset-0 z-20 size-full overflow-visible"
    >
      <defs>
        <linearGradient id={body} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#17EAD9" />
          <stop offset="0.48" stopColor="#4CB5E7" />
          <stop offset="1" stopColor="#6078EA" />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="#17EAD9" stopOpacity="0.5" />
          <stop offset="0.5" stopColor="#6078EA" stopOpacity="0.26" />
          <stop offset="1" stopColor="#6078EA" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-prism`} cx="32%" cy="22%" r="78%">
          <stop offset="0" stopColor="#fff" stopOpacity=".82" />
          <stop offset=".26" stopColor="#bcfff8" stopOpacity=".35" />
          <stop offset=".7" stopColor="#6078EA" stopOpacity=".12" />
          <stop offset="1" stopColor="#182965" stopOpacity=".38" />
        </radialGradient>
        <clipPath id={`${id}-drop-clip`}><path d={DROP_OUTLINE} /></clipPath>
      </defs>

      <motion.circle
        cx={STAGE.cx}
        cy={STAGE.cy}
        r="420"
        fill={`url(#${id}-glow)`}
        style={{ opacity: glowOpacity, scale: glowScale }}
      />
      {rayAngles.map((angle, index) => (
        <LightRay key={angle} progress={progress} angle={angle} index={index} />
      ))}

      <g transform={grid}>
        <Ribbon
          progress={progress}
          d={RIGHT_RIBBON}
          stroke={`url(#${body})`}
          head={T.rightRibbon}
          tail={[T.rightRibbon[0] + lag, T.rightRibbon[1] + lag]}
          width={58}
          sheen
        />
        <Ribbon
          progress={progress}
          d={LEFT_RIBBON}
          stroke={`url(#${body})`}
          head={T.leftRibbon}
          tail={[T.leftRibbon[0] + lag, T.leftRibbon[1] + lag]}
          width={58}
          sheen
        />
        <g transform={DROP_TRANSFORM}>
          <Ribbon progress={progress} d={DROP_OUTLINE} stroke={`url(#${body})`} head={T.stem} until={T.launch} width={outlineWidth} />
          <motion.ellipse cx="50" cy="91" rx="25" ry="5" fill="#6078EA" style={{ opacity: fillOpacity }} className="blur-[3px]" />
          <motion.path d={DROP_OUTLINE} fill={`url(#${body})`} style={{ opacity: fillOpacity, filter: "drop-shadow(0 8px 8px rgba(42,79,177,.32))" }} />
          <motion.g style={{ opacity: prismOpacity }} clipPath={`url(#${id}-drop-clip)`}>
            <path d={DROP_OUTLINE} fill={`url(#${id}-prism)`} />
            <ellipse cx="39" cy="32" rx="9" ry="5" fill="#fff" opacity=".58" transform="rotate(-24 39 32)" />
            <ellipse cx="31" cy="67" rx="7" ry="4" fill="#ff75a7" opacity=".38" />
            <ellipse cx="69" cy="67" rx="7" ry="4" fill="#ff75a7" opacity=".38" />
            <motion.g style={{ opacity: faceOpacity }}>
              <motion.g style={{ opacity: idleOpacity, scaleY: blink, transformOrigin: "50px 54px" }}>
                <ellipse cx="40" cy="54" rx="5" ry="7" fill={INK} />
                <ellipse cx="60" cy="54" rx="5" ry="7" fill={INK} />
                <circle cx="41.8" cy="51.5" r="1.7" fill="#fff" />
                <circle cx="61.8" cy="51.5" r="1.7" fill="#fff" />
              </motion.g>
              <motion.path style={{ opacity: idleOpacity }} d="M41 67 Q50 77 59 67" stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />
              <motion.g style={{ opacity: happyOpacity }}>
                <path d="M35 56 Q40 49 45 56 M55 56 Q60 49 65 56" stroke={INK} strokeWidth="3.6" strokeLinecap="round" fill="none" />
                <path d="M40 67 Q50 80 60 67" stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />
              </motion.g>
            </motion.g>
          </motion.g>
          <motion.path d={DROP_OUTLINE} fill="none" stroke="#fff" strokeWidth="1.2" strokeOpacity=".38" style={{ opacity: prismOpacity }} />
          <Ribbon progress={progress} d={DROP_OUTLINE} stroke={`url(#${body})`} from={T.launch} tail={[T.launch, T.launch + 0.018]} width={24} />
        </g>

        <Ribbon
          progress={progress}
          d={LAUNCH_RIBBON}
          stroke={`url(#${body})`}
          head={[T.launch, T.launch + 0.026]}
          tail={[T.launch + 0.018, T.launch + 0.04]}
          ease={easeIn}
          width={launchWidth}
          sheen
        />

      </g>
    </motion.svg>
  );
}

/**
 * One stroke of ribbon, drawn as a moving window along its path: the head
 * runs to the end over `head`, the tail follows over `tail`. Without a head
 * it starts fully drawn at `from`; without a tail it stays drawn until `until`.
 */
function Ribbon({
  progress,
  d,
  stroke,
  head,
  tail,
  from,
  until,
  width,
  ease = easeInOut,
  sheen = false,
}: {
  progress: MotionValue<number>;
  d: string;
  stroke: string;
  head?: readonly [number, number];
  tail?: readonly [number, number];
  from?: number;
  until?: number;
  width: number | MotionValue<number>;
  ease?: (value: number) => number;
  sheen?: boolean;
}) {
  const end = useScrub(progress, head ?? [0, 1], head ? [0, 1] : [1, 1], { ease });
  const start = useScrub(progress, tail ?? [0, 1], tail ? [0, 1] : [0, 0], { ease });
  const length = useTransform(() => Math.max(0, end.get() - start.get()));
  const on = head?.[0] ?? from ?? 0;
  const off = tail?.[1] ?? until ?? 1;
  // A zero-length dash still paints its round cap, so hide the stroke
  // outside its window rather than relying on the dash alone.
  const opacity = useScrub(progress, off < 1 ? [on, on + 0.001, off - 0.001, off] : [on, on + 0.001], off < 1 ? [0, 1, 1, 0] : [0, 1]);

  return (
    <motion.g style={{ opacity }}>
      <motion.path
        d={d}
        fill="none"
        stroke={stroke}
        strokeLinecap="round"
        style={{ strokeWidth: width, pathLength: length, pathOffset: start }}
      />
      {sheen && (
        <motion.path
          d={d}
          fill="none"
          stroke="#fff"
          strokeOpacity="0.4"
          strokeWidth="8"
          strokeLinecap="round"
          transform="translate(-10 -12)"
          style={{ pathLength: length, pathOffset: start }}
        />
      )}
    </motion.g>
  );
}

function LightRay({ progress, angle, index }: { progress: MotionValue<number>; angle: number; index: number }) {
  const start = T.rays + index * 0.006;
  const radians = (angle * Math.PI) / 180;
  const d = `M ${Math.round(STAGE.cx + Math.cos(radians) * 1500)} ${Math.round(STAGE.cy + Math.sin(radians) * 1500)} L ${STAGE.cx} ${STAGE.cy}`;
  const color = vivid[index % vivid.length];

  return (
    <>
      <Ribbon progress={progress} d={d} stroke={color} head={[start, start + 0.045]} tail={[start + 0.012, start + 0.055]} ease={easeIn} width={26} />
      <Ribbon progress={progress} d={d} stroke="#fff" head={[start, start + 0.045]} tail={[start + 0.012, start + 0.055]} ease={easeIn} width={5} />
    </>
  );
}

function Statement({ progress, sentence }: { progress: MotionValue<number>; sentence: string }) {
  const opacity = useScrub(progress, T.statement, [0, 1, 1, 0]);
  const y = useScrub(progress, T.statement, [24, 0, 0, -16]);
  const words = sentence.split(" ");

  return (
    <motion.p
      style={{ opacity, y }}
      className="absolute inset-x-5 top-[47svh] z-40 mx-auto max-w-5xl text-center text-[clamp(1.65rem,3.6vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.045em] text-balance text-foreground [perspective:700px] sm:inset-x-8"
    >
      {words.map((word, index) => (
        <LitWord key={index} progress={progress} index={index} count={words.length} range={T.likeWords}>
          {word}
        </LitWord>
      ))}
    </motion.p>
  );
}

function LitWord({
  progress,
  index,
  count,
  range,
  children,
}: {
  progress: MotionValue<number>;
  index: number;
  count: number;
  range: readonly [number, number];
  children: string;
}) {
  const [from, to] = range;
  const span = to - from;
  const start = from + (index / count) * span * 0.85;
  const end = start + Math.max(span * 0.18, 0.008);
  const opacity = useScrub(progress, [start, end], [0, 1]);
  const y = useScrub(progress, [start, end], [22, 0], { ease: easeOut });
  const scale = useScrub(progress, [start, end], [0.78, 1], { ease: easeOut });
  const rotateX = useScrub(progress, [start, end], [-65, 0], { ease: easeOut });
  const filter = useScrub(progress, [start, end], ["blur(7px)", "blur(0px)"], { ease: easeOut });

  return (
    <>
      <motion.span className="inline-block origin-bottom" style={{ opacity, y, scale, rotateX, filter }}>
        {children}
      </motion.span>{" "}
    </>
  );
}

function Timeline({ progress, milestones }: { progress: MotionValue<number>; milestones: string[] }) {
  const opacity = useScrub(progress, T.timeline, [0, 1, 1, 0]);
  const fillFrom = T.note;
  const fillTo = T.note + (milestones.length - 1) * T.noteGap;
  const fill = useScrub(progress, [fillFrom, fillTo], [0, 1]);

  return (
    <motion.div
      style={{ opacity }}
      className="absolute inset-x-10 bottom-[calc(9.5rem+env(safe-area-inset-bottom))] z-40 mx-auto h-1 max-w-lg md:bottom-28"
    >
      <span className="absolute inset-0 rounded-full bg-foreground/12" />
      <motion.span
        style={{ scaleX: fill }}
        className="absolute inset-0 origin-left rounded-full bg-linear-to-r from-[#17EAD9] via-[#4CB5E7] to-[#6078EA]"
      />
      {milestones.map((label, index) => (
        <Milestone
          key={label}
          progress={progress}
          label={label}
          at={milestones.length > 1 ? index / (milestones.length - 1) : 0}
          reachedAt={fillFrom + index * T.noteGap}
        />
      ))}
    </motion.div>
  );
}

function Milestone({
  progress,
  label,
  at,
  reachedAt,
}: {
  progress: MotionValue<number>;
  label: string;
  at: number;
  reachedAt: number;
}) {
  const lit = useScrub(progress, [reachedAt - 0.006, reachedAt + 0.004], [0, 1]);
  const text = useScrub(progress, [reachedAt - 0.006, reachedAt + 0.004], [0.45, 1]);

  return (
    <div className="absolute top-1/2" style={{ left: `${at * 100}%` }}>
      <span className="absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground/25 bg-background" />
      <motion.span
        style={{ opacity: lit }}
        className="absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4CB5E7] shadow-[0_0_14px_#4CB5E7]"
      />
      <motion.span
        style={{ opacity: text }}
        // The end labels align inward so they never run off a narrow screen.
        className={cn(
          "absolute top-4 text-sm font-semibold whitespace-nowrap text-foreground tabular-nums",
          at === 0 ? "-translate-x-1.5" : at === 1 ? "-translate-x-[calc(100%-0.375rem)]" : "-translate-x-1/2",
        )}
      >
        {label}
      </motion.span>
    </div>
  );
}

/* ───────────────────────── archive ───────────────────────── */

function ArchiveNote({
  progress,
  item,
  index,
  start: s,
}: {
  progress: MotionValue<number>;
  item: EducationEntry;
  index: number;
  start: number;
}) {
  const lean = index % 2 ? 1 : -1;
  const keys = [s, s + 0.038, s + 0.078, s + 0.105];
  const scale = useSpring(useScrub(progress, keys, [0.12, 1, 1, 0.08]), spring);
  const rotate = useScrub(progress, keys, [12 * lean, 2.5 * lean, 2.5 * lean, -9 * lean]);
  // Out of Jot, who is waiting higher up the frame, and back into him.
  const y = useScrub(progress, keys, ["-14svh", "-2svh", "-2svh", "-14svh"]);
  const opacity = useScrub(progress, [s, s + 0.012, s + 0.09, s + 0.105], [0, 1, 1, 0]);

  // Written in order, like a hand filling the card in.
  const w = s + 0.028;
  const period = useScrub(progress, [w, w + 0.008], ["inset(-20% 100% -20% 0)", "inset(-20% 0% -20% 0)"]);
  const school = useScrub(progress, [w + 0.006, w + 0.02], ["inset(-25% 100% -25% 0)", "inset(-25% 0% -25% 0)"]);
  const underline = useScrub(progress, [w + 0.018, w + 0.028], [0, 1]);
  const degree = useScrub(progress, [w + 0.022, w + 0.032], ["inset(-20% 100% -20% 0)", "inset(-20% 0% -20% 0)"]);
  const description = useScrub(progress, [w + 0.03, w + 0.046], ["inset(-5% 0 100% 0)", "inset(-5% 0 -5% 0)"]);
  const stampScale = useScrub(progress, [s + 0.07, s + 0.076], [2.2, 1]);
  const stampOpacity = useScrub(progress, [s + 0.07, s + 0.073], [0, 1]);

  return (
    <motion.article
      style={{ scale, rotate, y, opacity }}
      className="absolute z-30 w-[min(88vw,32rem)] rounded-[6px] bg-[#f4efe2] px-7 pt-9 pb-8 text-[#2b241b] shadow-[0_50px_100px_-25px_rgb(0_0_0/.45)] sm:px-11 sm:pt-11 sm:pb-10 dark:shadow-[0_50px_100px_-25px_rgb(0_0_0/.85)]"
    >
      <div className="pointer-events-none absolute inset-0 rounded-[6px] bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_calc(1.75rem-1px),rgba(70,100,170,.14)_calc(1.75rem-1px),rgba(70,100,170,.14)_1.75rem)] bg-[length:100%_1.75rem] bg-[position:0_1.1rem]" />
      <span className="absolute inset-y-0 left-4 w-px bg-[#e36a6a]/45 sm:left-7" />
      <span className="absolute -top-3 left-1/2 h-7 w-28 -translate-x-1/2 -rotate-3 bg-[#f6d27a]/75 shadow-sm" />
      <motion.span
        style={{ scale: stampScale, opacity: stampOpacity }}
        className="absolute top-5 right-5 flex size-16 -rotate-12 items-center justify-center rounded-full border-[3px] border-double border-[#cc3b3b]/80 text-[0.95rem] font-bold text-[#cc3b3b]/85 tabular-nums sm:size-20 sm:text-lg"
      >
        {item.year}
      </motion.span>

      <motion.p style={{ clipPath: period }} className="relative font-mono text-[0.7rem] tracking-[0.14em] text-[#6b5d49] tabular-nums sm:text-xs">
        {String(index + 1).padStart(2, "0")} · {item.period}
      </motion.p>
      <motion.p
        style={{ clipPath: school }}
        className="relative mt-3 pr-16 text-[clamp(1.35rem,1rem+1.8vw,2rem)] leading-[1.2] font-semibold tracking-[-0.02em] sm:pr-20"
      >
        {item.school}
      </motion.p>
      <svg viewBox="0 0 220 12" className="relative mt-1 h-3 w-40 overflow-visible sm:w-52" aria-hidden>
        <motion.path
          d="M2 8 C 40 2, 70 11, 110 6 S 180 3, 218 7"
          fill="none"
          stroke="#ff9f0a"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ pathLength: underline }}
        />
      </svg>
      <motion.p style={{ clipPath: degree }} className="relative mt-3 font-medium text-[#3d3326]">
        {item.degree}
      </motion.p>
      <motion.p style={{ clipPath: description }} className="relative mt-3 text-[0.95rem] leading-7 text-[#4e4436]">
        {item.description}
      </motion.p>
    </motion.article>
  );
}

/* ───────────────────────── Ho Chi Minh City ───────────────────────── */

const farBuildings = [
  [0, 104, 150], [96, 78, 215], [168, 130, 168], [286, 86, 246], [360, 132, 188],
  [474, 74, 278], [534, 112, 205], [794, 96, 236], [878, 124, 184], [990, 82, 265],
  [1062, 116, 206], [1168, 74, 294], [1230, 126, 182], [1342, 98, 232],
] as const;

const nearBuildings = [
  [0, 126, 205], [116, 112, 286], [216, 146, 224], [352, 105, 318], [444, 118, 248],
  [878, 118, 264], [984, 144, 330], [1114, 96, 246], [1198, 138, 302], [1324, 116, 224],
] as const;

// Màu đi qua biến CSS để cảnh lật theo light/dark — xem --city-* trong hwagfu.css.
const cityColors = ["var(--city-1)", "var(--city-2)", "var(--city-3)", "var(--city-4)", "var(--city-5)", "var(--city-6)"];
const treeXs = [28, 92, 154, 225, 304, 382, 470, 555, 635, 805, 886, 970, 1055, 1140, 1228, 1312, 1390];

const LAUNCH_TOP = 51.5;
const launchPoint = "left-1/2 top-[51.5svh]";

function CitySkyline({ progress }: { progress: MotionValue<number> }) {
  const opacity = useScrub(progress, T.sky, [0, 1]);
  const y = useScrub(progress, [T.rise[0], T.rise[1], T.sink[0], T.sink[1]], ["30svh", "0svh", "0svh", "8svh"], { ease: easeOut });
  const farX = useScrub(progress, [T.sky[0], T.sink[1]], ["-1.2vw", "0.8vw"]);
  const nearX = useScrub(progress, [T.sky[0], T.sink[1]], ["1.4vw", "-1vw"]);
  const lights = useScrub(progress, [T.rise[0], T.rise[1] + 0.035], [0.12, 0.82]);
  const towerScale = useSpring(useScrub(progress, [T.rise[0], T.rise[1]], [0.72, 1]), spring);
  const flashScale = useScrub(progress, [T.fire - 0.001, T.fire + 0.004, T.fire + 0.02], [0.2, 1.6, 0.55]);
  const flashOpacity = useScrub(progress, [T.fire - 0.001, T.fire + 0.003, T.fire + 0.02], [0, 1, 0]);

  return (
    <motion.div style={{ opacity, y }} className="absolute inset-0 z-10 overflow-hidden bg-[linear-gradient(180deg,var(--city-sky-1)_0%,var(--city-sky-2)_58%,var(--city-sky-3)_100%)]">
      <motion.div style={{ x: farX }} className="absolute -left-20 top-[10svh] h-24 w-[28rem] rounded-full bg-[var(--city-cloud)] before:absolute before:-top-16 before:left-20 before:size-40 before:rounded-full before:bg-[var(--city-cloud)] after:absolute after:-top-9 after:left-52 after:size-32 after:rounded-full after:bg-[var(--city-cloud)]" />
      <motion.div style={{ x: nearX }} className="absolute -right-28 top-[16svh] h-28 w-[38rem] rounded-full bg-[var(--city-cloud)] before:absolute before:-top-20 before:left-24 before:size-48 before:rounded-full before:bg-[var(--city-cloud)] after:absolute after:-top-12 after:left-72 after:size-44 after:rounded-full after:bg-[var(--city-cloud)]" />
      <div className="absolute left-[38%] top-[31svh] h-5 w-32 rounded-full bg-[var(--city-cloud-soft)] before:absolute before:-top-4 before:left-7 before:size-12 before:rounded-full before:bg-[var(--city-cloud)] after:absolute after:-top-2 after:right-6 after:size-9 after:rounded-full after:bg-[var(--city-cloud)]" />
      <svg viewBox="0 0 1440 520" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-[64svh] w-full overflow-visible sm:h-[49svh]">
        <defs>
          <linearGradient id="bitexco-glass" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="var(--city-glass-1)" /><stop offset=".28" stopColor="var(--city-glass-2)" /><stop offset=".68" stopColor="var(--city-glass-3)" /><stop offset="1" stopColor="var(--city-glass-4)" />
          </linearGradient>
          <linearGradient id="bitexco-edge" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#17EAD9" /><stop offset=".62" stopColor="#4CB5E7" /><stop offset="1" stopColor="#6078EA" />
          </linearGradient>
          <linearGradient id="river" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="var(--city-river-1)" /><stop offset="1" stopColor="var(--city-river-2)" />
          </linearGradient>
          <pattern id="city-windows" width="24" height="22" patternUnits="userSpaceOnUse">
            <rect x="5" y="5" width="7" height="4" rx="1" fill="var(--city-window)" opacity=".9" />
            <rect x="16" y="5" width="4" height="4" rx="1" fill="var(--city-window-off)" opacity=".48" />
          </pattern>
          <filter id="bitexco-shadow" x="-80%" y="-30%" width="260%" height="160%">
            <feDropShadow dx="0" dy="12" stdDeviation="8" floodColor="#075479" floodOpacity=".25" />
          </filter>
        </defs>

        <motion.g style={{ x: farX }} opacity=".72">
          {farBuildings.map(([x, width, height], index) => (
            <g key={x}>
              <rect x={x} y={490 - height} width={width} height={height} fill={index % 2 ? "var(--city-far-b)" : "var(--city-far-a)"} />
              <rect x={x + 6} y={500 - height} width={width - 12} height={height - 18} fill="url(#city-windows)" opacity=".42" />
            </g>
          ))}
        </motion.g>

        <motion.g style={{ x: nearX }}>
          {nearBuildings.map(([x, width, height], index) => (
            <g key={x}>
              <path d={`M${x} ${490 - height} L${x + width} ${490 - height} L${x + width} 490 L${x} 490 Z`} fill={cityColors[index % cityColors.length]} />
              <path d={`M${x + width} ${490 - height} L${x + width + 12} ${480 - height} L${x + width + 12} 480 L${x + width} 490 Z`} fill="var(--city-side)" opacity=".45" />
              <path d={`M${x} ${490 - height} L${x + 12} ${480 - height} L${x + width + 12} ${480 - height} L${x + width} ${490 - height} Z`} fill="var(--city-roof)" opacity="var(--city-roof-opacity)" />
              <motion.rect className="city-window" style={{ opacity: lights }} x={x + 8} y={500 - height} width={width - 16} height={height - 20} fill="url(#city-windows)" />
            </g>
          ))}
        </motion.g>

        <motion.g style={{ scale: towerScale, transformOrigin: "720px 490px" }} filter="url(#bitexco-shadow)">
          <path d="M636 490 L654 113 L669 42 L720 42 L746 134 L790 490 Z" fill="url(#bitexco-glass)" />
          <path d="M636 490 L654 113 L669 42 L686 42 L698 451 L669 490 Z" fill="#07577A" />
          <path d="M669 42 H720 L746 134 L790 490 H698 L686 42 Z" fill="#21B9E8" opacity=".9" />
          <path d="M698 451 L706 111 L720 42 L746 134 L790 490 Z" fill="#079BD1" opacity=".78" />
          <path d="M669 42 H720 L724 56 H666 Z" fill="#082A4D" />
          <path d="M636 490 H790" stroke="#082A4D" strokeWidth="10" />
          <path d="M698 451 L669 490" fill="none" stroke="#082A4D" strokeWidth="10" />
          <path d="M686 42 C684 135 690 260 698 451" fill="none" stroke="#061E3D" strokeWidth="8" />
          <path d="M698 451 C714 446 752 447 778 457" fill="none" stroke="#083A63" strokeWidth="2.5" />
          <path d="M691 82 C713 76 727 80 731 84 M690 96 H735 M690 110 H738 M690 124 H741 M690 138 H744 M691 152 H747 M691 166 H750 M692 180 H753" fill="none" stroke="#073657" strokeWidth="2.5" />
          <path d="M715 326 C741 322 766 326 780 332 M715 340 C741 336 769 341 782 347 M716 354 C743 350 771 355 784 362 M716 369 C744 365 773 370 786 377 M717 384 C745 380 775 385 787 392 M717 399 C746 395 777 400 788 408 M718 414 C747 410 778 415 789 423" fill="none" stroke="#07577A" strokeWidth="2.5" />
          <path d="M724 185 C770 176 821 177 854 188 C827 209 779 216 728 207 Z" fill="#0A2343" />
          <path d="M728 185 C774 179 816 181 842 189 C810 196 770 199 729 201 Z" fill="#D7F4F8" />
          <path d="M728 201 C771 199 813 195 842 189 L854 188 C827 209 779 216 728 207 Z" fill="#123D65" />
          <ellipse cx="714" cy="156" rx="6" ry="70" fill="#E8FFFF" opacity=".35" transform="rotate(-2 714 156)" />
        </motion.g>

        <rect x="0" y="466" width="1440" height="25" fill="var(--city-ground)" />
        <g>
          {treeXs.map((x, index) => <g key={x}><rect x={x - 2} y="449" width="4" height="20" fill="var(--city-trunk)" /><circle cx={x} cy={index % 3 ? 447 : 441} r={index % 3 ? 13 : 17} fill={index % 2 ? "var(--city-tree-a)" : "var(--city-tree-b)"} /></g>)}
        </g>
        <rect x="0" y="491" width="1440" height="29" fill="url(#river)" />
        <g fill="#C7EEFA" opacity=".68"><rect x="52" y="503" width="110" height="4" rx="2" /><rect x="310" y="511" width="150" height="3" rx="2" /><rect x="884" y="501" width="124" height="4" rx="2" /><rect x="1180" y="512" width="178" height="3" rx="2" /></g>
        <g transform="translate(170 477)"><path d="M0 16 H102 L90 28 H15 Z" fill="#FFF8E7" /><path d="M30 15 L42 3 H72 L85 15 Z" fill="#FDFBF4" /><path d="M44 6 H69 L77 14 H37 Z" fill="#174E69" /></g>
        <g transform="translate(1120 482)"><path d="M0 12 H118 L104 25 H12 Z" fill="#07577A" /><path d="M28 11 L40 0 H73 L88 11 Z" fill="#FFF8E7" /><path d="M42 3 H70 L79 10 H35 Z" fill="#2B7596" /></g>
      </svg>

      <motion.span style={{ scale: flashScale, opacity: flashOpacity }} className={`absolute size-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#fff_0%,#17EAD9_20%,rgba(96,120,234,.45)_48%,transparent_72%)] ${launchPoint}`} />
      <motion.span style={{ opacity: flashOpacity }} className={`absolute h-[35svh] w-px -translate-x-1/2 -translate-y-full bg-linear-to-t from-[#17EAD9] to-transparent shadow-[0_0_12px_#17EAD9] ${launchPoint}`} />
      <p className="absolute inset-x-0 bottom-2 text-center font-mono text-[0.55rem] tracking-[0.22em] text-[var(--city-caption)] uppercase sm:bottom-[4.7rem] sm:text-[0.62rem]">
        Thành phố Hồ Chí Minh · 10°46′N
      </p>
    </motion.div>
  );
}

/* ───────────────────────── fireworks ───────────────────────── */

// Where each logo bursts, in % of the frame — clear of the skyline below.
const skyTargets: [number, number][] = [
  [10, 27], [30, 23], [50, 26], [70, 22], [90, 28],
  [20, 37], [40, 34], [60, 36], [80, 33],
  [7, 47], [25, 46], [43, 49], [57, 44], [75, 48], [93, 43],
  [15, 57], [33, 56], [67, 57], [85, 55],
];
// Launch order hops around the sky so one category never bunches up.
const launchOrder = [2, 7, 12, 0, 16, 5, 10, 18, 3, 14, 8, 1, 17, 11, 6, 15, 4, 13, 9];

// Each logo glows in its own brand colour; black-and-white marks borrow one.
const brandGlow: Record<string, string> = {
  "Next.js": "#bf5af2",
  React: "#61dafb",
  TypeScript: "#3178c6",
  "Tailwind CSS": "#38bdf8",
  "React Native": "#61dafb",
  "Node.js": "#5fa04e",
  NestJS: "#e0234e",
  Express: "#ffd60a",
  "Socket.IO": "#30d158",
  PHP: "#777bb4",
  PostgreSQL: "#4169e1",
  MySQL: "#f29111",
  MongoDB: "#47a248",
  SQLite: "#0f80cc",
  Docker: "#2496ed",
  GitHub: "#ff375f",
  Git: "#f05032",
  Vercel: "#64d2ff",
  Render: "#46e3b7",
};

const fireworks = techStack.flatMap((category) =>
  category.items.map((tech) => ({ ...tech, key: `${category.id}-${tech.name}` })),
);

function TechFireworks({ progress }: { progress: MotionValue<number> }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {fireworks.map((tech, index) => (
        <TechStar
          key={tech.key}
          progress={progress}
          tech={tech}
          index={index}
          target={skyTargets[launchOrder[index % launchOrder.length] % skyTargets.length]}
        />
      ))}
    </div>
  );
}

const sparkle = "M12 0C12.6 6.6 17.4 11.4 24 12C17.4 12.6 12.6 17.4 12 24C11.4 17.4 6.6 12.6 0 12C6.6 11.4 11.4 6.6 12 0Z";

function TechStar({
  progress,
  tech,
  index,
  target: [tx, ty],
}: {
  progress: MotionValue<number>;
  tech: Tech;
  index: number;
  target: [number, number];
}) {
  const s = T.fireworks + index * T.fireworksGap;
  const arrive = s + T.flight;
  const [star0, star1] = T.stars;
  // The logos launch from Bitexco's spire, then settle across the skyline.
  const x = useScrub(progress, [s, arrive, star0, star1], ["0vw", `${tx - 50}vw`, `${tx - 50}vw`, `${(tx - 50) * 1.12}vw`]);
  const y = useScrub(progress, [s, arrive], ["0svh", `${ty - LAUNCH_TOP}svh`], { ease: easeOut });
  const shell = useScrub(progress, [s, s + 0.003, arrive - 0.003, arrive], [0, 1, 1, 0]);
  const burstScale = useScrub(progress, [arrive - 0.002, arrive + 0.02], [0.3, 2.4]);
  const burstOpacity = useScrub(progress, [arrive - 0.002, arrive + 0.002, arrive + 0.02], [0, 0.95, 0]);
  const chipScale = useScrub(progress, [arrive - 0.003, arrive + 0.005, arrive + 0.014, star0, star1], [0.2, 1.3, 1, 1, 0.46]);
  const chipOpacity = useScrub(progress, [arrive - 0.003, arrive + 0.003, star0, star1], [0, 1, 1, 0.4]);
  const plate = useScrub(progress, T.stars, [1, 0]);
  const glow = brandGlow[tech.name] ?? vivid[index % vivid.length];
  const delay = `${(index * 0.37) % 3}s`;

  return (
    <motion.div style={{ x, y }} className={cn("absolute size-0", launchPoint)}>
      <motion.span
        style={{ opacity: shell, background: glow, boxShadow: `0 0 18px 6px ${glow}` }}
        className="absolute -top-2 -left-2 size-4 rounded-full ring-2 ring-white/80"
      />
      <motion.span
        style={{ scale: burstScale, opacity: burstOpacity, borderColor: glow }}
        className="absolute -top-7 -left-7 size-14 rounded-full border-2 sm:-top-10 sm:-left-10 sm:size-20 sm:border-[3px]"
      />
      <motion.span
        style={{
          scale: burstScale,
          opacity: burstOpacity,
          background: `repeating-conic-gradient(${glow} 0deg 6deg, transparent 6deg 36deg)`,
        }}
        className="absolute -top-12 -left-12 size-24 rounded-full [mask-image:radial-gradient(circle,transparent_38%,black_40%,black_66%,transparent_68%)] sm:-top-18 sm:-left-18 sm:size-36"
      />
      <motion.div
        style={{ scale: chipScale, opacity: chipOpacity }}
        className="absolute -top-5 -left-5 size-10 sm:-top-9 sm:-left-9 sm:size-18"
      >
        <span
          className="animate-twinkle absolute -inset-5 rounded-full blur-xl"
          style={{ background: glow, animationDelay: delay }}
        />
        <motion.span
          style={{ opacity: plate }}
          className="absolute inset-0 rounded-[30%] bg-white shadow-[0_12px_30px_-10px_rgba(0,0,0,.35)] ring-1 ring-black/5 dark:bg-white/12 dark:shadow-none dark:ring-white/30 dark:backdrop-blur-sm"
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <Icon
            icon={tech.icon}
            className={cn(
              "size-6 sm:size-10",
              tech.mono && "dark:invert",
              tech.tint && "text-[#1d1d1f] dark:text-white",
            )}
            style={{ filter: `drop-shadow(0 0 10px ${glow})` }}
          />
        </span>
        <svg
          viewBox="0 0 24 24"
          className="animate-twinkle absolute -top-2.5 -right-2.5 size-4 sm:size-5"
          style={{ color: glow, animationDelay: delay }}
        >
          <path d={sparkle} fill="currentColor" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

/* ───────────────────────── promises ───────────────────────── */

const promiseIcons: LucideIcon[] = [MessagesSquare, Eye, ShieldCheck];
const promiseTones = [
  { text: "text-hue-blue", glow: "bg-hue-blue/30" },
  { text: "text-hue-purple", glow: "bg-hue-purple/30" },
  { text: "text-hue-green", glow: "bg-hue-green/30" },
];

function PromiseFinale({
  progress,
  label,
  heading,
  promises,
}: {
  progress: MotionValue<number>;
  label: string;
  heading: string;
  promises: PromiseEntry[];
}) {
  const opacity = useScrub(progress, T.promise, [0, 1]);
  const y = useScrub(progress, T.promise, [22, 0]);

  return (
    <div className="absolute inset-x-5 top-[clamp(4.75rem,9svh,7rem)] z-40 mx-auto max-w-5xl text-foreground sm:inset-x-8">
      <motion.div style={{ opacity, y }} className="text-center">
        <p className="kicker text-hue-green">{label}</p>
        <p className="headline-section mt-2">{heading}</p>
      </motion.div>
      <ul className="mt-6 grid gap-4 sm:mt-12 sm:grid-cols-3 sm:gap-8">
        {promises.map((item, index) => (
          <PromiseStar key={item.title} progress={progress} item={item} index={index} />
        ))}
      </ul>
    </div>
  );
}

function PromiseStar({ progress, item, index }: { progress: MotionValue<number>; item: PromiseEntry; index: number }) {
  const s = T.promiseItem + index * T.promiseGap;
  const opacity = useScrub(progress, [s, s + 0.022], [0, 1]);
  const y = useScrub(progress, [s, s + 0.022], [22, 0]);
  const glow = useScrub(progress, [s + 0.008, s + 0.026], [0, 1]);
  const PromiseIcon = promiseIcons[index % promiseIcons.length];
  const tone = promiseTones[index % promiseTones.length];

  return (
    <motion.li style={{ opacity, y }} className="flex gap-3.5 sm:flex-col sm:gap-0">
      <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-white/70 ring-1 ring-black/5 sm:size-12 dark:bg-white/8 dark:ring-white/20">
        <motion.span style={{ opacity: glow }} className={cn("absolute -inset-3 rounded-full blur-lg", tone.glow)} />
        <PromiseIcon className={cn("relative size-5", tone.text)} />
      </span>
      <div className="min-w-0 sm:mt-4">
        <p className="text-[1.02rem] leading-snug font-semibold sm:headline-card">{item.title}</p>
        <p className="mt-1 text-[0.82rem] leading-relaxed text-foreground/65 sm:mt-2 sm:text-[0.95rem]">{item.desc}</p>
      </div>
    </motion.li>
  );
}
