"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import Image from "./Image";
import { motion, easeIn, easeInOut, easeOut, useInView, useMotionValueEvent, useSpring, useTransform, type MotionStyle, type MotionValue } from "motion/react";
import { ChevronRight } from "lucide-react";
import { Link } from "./RouterLink";
import { DropletBody, dropletPalettes } from "./FloatingOrbs";
import { useFilm } from "./useFilm";
import { useScrub } from "./useScrub";
import { useMounted } from "./useMounted";
import VoiceSpell from "./VoiceSpell";

export type FeaturedProject = {
  id: string;
  title: string;
  tagline: string;
  image: { src: string; alt?: string };
};

type WorkStoryProps = {
  label: string;
  heading: string;
  subtitle: string;
  viewAll: string;
  projects: FeaturedProject[];
};

/** Film wrapper height, in svh. */
const HEIGHT = 500;

/**
 * The storyboard, in scroll progress. One place to retime the film: every
 * scene reads its window from here.
 */
const T = {
  header: [0, 0.04, 0.72, 0.76],
  drops: [0, 0.2],
  vortex: [0, 0.14],
  push: [0.27, 0.35],
  split: [0.35, 0.395],
  burst: 0.395,
  hold: [0.44, 0.74],
  crack: [0.74, 0.79],
  shatter: 0.795,
  fall: 0.17,
} as const;

/** A shallow glass tilt keeps the light knot dimensional without becoming a funnel. */
const TILT = { rest: 8, pressed: 18 };

// Drops arrive from beyond the top and sides of the frame — the hero's drops,
// carrying on. Positions are on the assistant orb's plane, in units of its
// width (`--vs`), as an angle and a distance from its centre.
const filmDrops = [
  { angle: -90, radius: 2.5, size: "size-12 sm:size-16", palette: 0, lag: 0 },
  { angle: -122, radius: 2.7, size: "size-9 sm:size-12", palette: 1, lag: 0.012 },
  { angle: -58, radius: 2.6, size: "size-14 sm:size-20", palette: 3, lag: 0.006 },
  { angle: -152, radius: 2.4, size: "size-8 sm:size-10", palette: 2, lag: 0.02 },
  { angle: -26, radius: 2.45, size: "size-10 sm:size-14", palette: 4, lag: 0.016 },
];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
/** A length in units of the whirlpool's width. */
const vs = (units: number) => `calc(var(--vs) * ${units.toFixed(4)})`;

/**
 * Where something circling into the whirlpool is at phase `t`: an inward
 * spiral on the water's plane that dives down the funnel at the end.
 */
function orbit(angle: number, radius: number, t: number, turns: number) {
  const eased = easeInOut(t);
  const r = radius * (1 - eased) + 0.02;
  const a = (angle * Math.PI) / 180 + eased * turns * Math.PI * 2;
  return {
    x: r * Math.cos(a),
    y: r * Math.sin(a),
    z: -CORE_DEPTH * easeIn(clamp01((t - 0.6) / 0.4)),
  };
}

/**
 * The work, as a film between the hero and the services. The hero's colour
 * drops wake a quiet assistant orb. The orb then splits into three drops that burst open as
 * the three featured projects. Scroll on
 * and the tiles crack and fall away — still falling as the services film
 * fades in over them.
 *
 * The heading and the three tiles are real content and real links. Focusing a
 * tile scrolls the film to where the tiles are standing, and with reduced
 * motion the section is a plain heading and grid.
 */
export default function WorkStory({ label, heading, subtitle, viewAll, projects }: WorkStoryProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "0px 0px -16px 0px" });
  const [spellOn, setSpellOn] = useState(false);
  const { progress, frame } = useFilm(ref, HEIGHT, { leaves: true });

  // Keyboard users land on a tile that may still be a drop or already dust:
  // bring the film to the moment the tiles are standing.
  function revealTiles() {
    const film = ref.current;
    if (!film || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const current = progress.get();
    if (current > T.burst + 0.03 && current < T.crack[0]) return;
    const top = film.getBoundingClientRect().top + window.scrollY;
    const travel = film.offsetHeight - window.innerHeight;
    // `progress` finishes half an overlap before the wrapper does.
    const share = 1 - 50 / (HEIGHT - 100);
    window.scrollTo({ top: top + (T.hold[0] + 0.04) * share * travel, behavior: "instant" });
  }

  // Cảnh nhận lệnh kéo dài từ lúc giọt bị hút hết tới trước lúc quả cầu tách ra.
  useMotionValueEvent(progress, "change", (value) => {
    setSpellOn(value > T.drops[1] && value < T.split[0]);
  });
  const linkOpacity = useScrub(progress, [T.burst + 0.02, T.burst + 0.035, T.crack[0], T.crack[0] + 0.012], [0, 1, 1, 0]);
  const linkPointer = useTransform(progress, (value) => (value > T.burst + 0.02 && value < T.crack[0] ? "auto" : "none"));
  if (!useMounted()) {
    return null;
  }

  return (
    <section data-anchor="projects" className="relative bg-background text-foreground">
      <div ref={ref} className="relative h-[500svh] motion-reduce:h-auto">
        <motion.div
          style={frame}
          className="sticky top-0 h-svh min-h-[35rem] overflow-hidden [--vs:min(88vw,66svh)] motion-reduce:static motion-reduce:h-auto motion-reduce:overflow-visible motion-reduce:px-4 motion-reduce:py-20"
        >
          <div aria-hidden className="absolute inset-0 motion-reduce:hidden">
            {inView && <LightKnot progress={progress} />}
          </div>

          <Header progress={progress} label={label} heading={heading} subtitle={subtitle} />

          {/* Giọt đã bị hút hết vào lõi: trợ lý thành hình và nghe được câu lệnh. */}
          <VoiceSpell prompt={spellOn} />

          <div className="absolute top-[56svh] left-1/2 z-30 w-[min(72rem,calc(100vw-2.5rem),150svh)] -translate-x-1/2 -translate-y-1/2 [--cw:calc((min(72rem,100vw-2.5rem,150svh)-3rem)/3)] motion-reduce:static motion-reduce:mx-auto motion-reduce:mt-12 motion-reduce:translate-x-0 motion-reduce:translate-y-0">
            <ul className="grid gap-3 sm:grid-cols-3 sm:gap-6">
              {projects.map((project, index) => (
                <TileSlot key={project.id} progress={progress} project={project} index={index} onFocus={revealTiles} />
              ))}
            </ul>
            <motion.div
              style={{ opacity: linkOpacity, pointerEvents: linkPointer }}
              className="scroll-fx absolute top-full left-0 mt-6 w-full text-center motion-reduce:static motion-reduce:mt-10"
            >
              <Link href="/project" onFocus={revealTiles} className="link-more text-lg">
                {viewAll}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Header({
  progress,
  label,
  heading,
  subtitle,
}: {
  progress: MotionValue<number>;
  label: string;
  heading: string;
  subtitle: string;
}) {
  const opacity = useScrub(progress, T.header, [0, 1, 1, 0]);
  const y = useScrub(progress, T.header, [20, 0, 0, -16]);

  return (
    <motion.div
      style={{ opacity, y }}
      className="scroll-fx absolute inset-x-5 top-[clamp(4.75rem,9svh,7rem)] z-40 mx-auto max-w-4xl text-center sm:inset-x-8 motion-reduce:static"
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.68rem] font-mono font-semibold tracking-[0.22em] text-[#00f0ff] uppercase backdrop-blur-md dark:bg-black/30 mb-3">
        <span className="size-1.5 rounded-full bg-[#00f0ff]" />
        <span>SCENE 02 · {label}</span>
      </div>
      <h2 className="headline-section mt-1 text-foreground">{heading}</h2>
      <p className="lede mx-auto mt-3 hidden max-w-2xl lg:block motion-reduce:block">{subtitle}</p>
    </motion.div>
  );
}

/* ───────────────────────── assistant orb ───────────────────────── */

const CORE_DEPTH = 0.18;
const ORB_LOOP_A = "M42 105 C42 54 78 25 113 43 C148 61 168 68 158 108 C148 148 117 166 83 157 C49 148 30 132 42 105Z";
const ORB_LOOP_B = "M53 69 C82 35 132 31 157 63 C182 95 157 132 128 153 C99 174 60 155 45 126 C30 97 34 91 53 69Z";
const ORB_LOOP_C = "M38 88 C57 43 103 30 139 48 C175 66 177 110 151 139 C125 168 77 174 48 142 C19 110 21 128 38 88Z";

function LightKnot({ progress }: { progress: MotionValue<number> }) {
  const [split0, split1] = T.split;
  const form = useScrub(progress, [0, T.vortex[1], split0, split1], [0.3, 1, 1, 0], { ease: easeInOut });
  const trail = useScrub(progress, [0, T.vortex[1], split0, split1], [0.12, 1, 1, 0], { ease: easeInOut });
  const y = useScrub(progress, T.push, ["-50%", "calc(-50% + 8svh)"], { ease: easeInOut });
  const tilt = useScrub(progress, [T.push[0], T.push[1]], [TILT.rest, TILT.pressed], { ease: easeInOut });
  const glint = useScrub(progress, [0, split1], [0, -2]);
  const orbit = useScrub(progress, [0, split1], [0, 130]);
  const auraOpacity = useScrub(progress, [0, 0.06, split0, split1 + 0.02], [0.45, 1, 1, 0]);
  const flash = useScrub(progress, [split0 - 0.01, split0 + 0.012, split1 + 0.01], [0, 1, 0]);

  return (
    <motion.div
        style={{ x: "-50%", y }}
        className="absolute top-[55svh] left-1/2 size-(--vs) [perspective:calc(var(--vs)*3)]"
      >
      <motion.div
        style={{ opacity: auraOpacity, scale: form }}
        className="absolute inset-[-22%] rounded-full bg-[radial-gradient(circle_at_42%_43%,rgba(23,234,217,.55),transparent_45%),radial-gradient(circle_at_62%_58%,rgba(96,120,234,.46),transparent_52%)] blur-3xl"
      />

      <motion.div
        style={{ rotateX: tilt, transformStyle: "preserve-3d" }}
        animate={{ y: [-5, 5, -5], rotateZ: [-1.2, 1.2, -1.2] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0"
      >
        <motion.span style={{ opacity: auraOpacity }} className="absolute right-[24%] bottom-[17%] left-[24%] h-[8%] rounded-full bg-[#6078EA]/35 blur-xl" />
        <motion.svg viewBox="0 0 200 200" style={{ scale: form }} className="absolute inset-0 size-full overflow-visible drop-shadow-[0_24px_28px_rgba(44,101,200,.26)]">
          <defs>
            <linearGradient id="assistant-ring" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#17EAD9" /><stop offset=".52" stopColor="#4CB5E7" /><stop offset="1" stopColor="#6078EA" /></linearGradient>
            <radialGradient id="assistant-core" cx="38%" cy="32%" r="72%"><stop stopColor="#fff" /><stop offset=".18" stopColor="#d9fffb" /><stop offset=".48" stopColor="#66e4df" /><stop offset=".76" stopColor="#6d93ed" /><stop offset="1" stopColor="#6078EA" stopOpacity=".72" /></radialGradient>
            <radialGradient id="assistant-glass" cx="35%" cy="28%" r="75%"><stop stopColor="#fff" stopOpacity=".9" /><stop offset=".32" stopColor="#c9fbff" stopOpacity=".4" /><stop offset="1" stopColor="#6078EA" stopOpacity=".08" /></radialGradient>
            <radialGradient id="assistant-shell" cx="34%" cy="26%" r="80%"><stop stopColor="#fff" stopOpacity=".8" /><stop offset=".32" stopColor="#bffdf6" stopOpacity=".42" /><stop offset=".68" stopColor="#72bce9" stopOpacity=".28" /><stop offset="1" stopColor="#6078EA" stopOpacity=".48" /></radialGradient>
          </defs>
          <circle cx="100" cy="100" r="65" fill="url(#assistant-shell)" stroke="rgba(255,255,255,.72)" strokeWidth="1.4" />
          <ellipse cx="80" cy="69" rx="28" ry="15" fill="white" opacity=".2" transform="rotate(-24 80 69)" />
          <circle cx="100" cy="100" r="54" fill="none" stroke="url(#assistant-ring)" strokeWidth="1.2" opacity=".36" />

          <motion.g style={{ rotate: orbit, transformOrigin: "100px 100px" }}>
            <motion.path d={ORB_LOOP_A} fill="none" stroke="#6078EA" strokeOpacity=".22" strokeWidth="20" strokeLinecap="round" style={{ pathLength: trail }} className="blur-md" />
            <motion.path d={ORB_LOOP_A} fill="none" stroke="url(#assistant-ring)" strokeWidth="7" strokeLinecap="round" style={{ pathLength: trail }} />
            <motion.path d={ORB_LOOP_B} fill="none" stroke="url(#assistant-ring)" strokeWidth="3.5" strokeLinecap="round" strokeOpacity=".75" style={{ pathLength: trail }} />
            <motion.path d={ORB_LOOP_C} fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2 11" style={{ pathLength: trail, pathOffset: glint }} />
          </motion.g>

          <circle cx="100" cy="100" r="34" fill="url(#assistant-core)" stroke="rgba(255,255,255,.82)" strokeWidth="1.2" />
          <circle cx="100" cy="100" r="28" fill="url(#assistant-glass)" />
          <ellipse cx="90" cy="87" rx="9" ry="5" fill="white" opacity=".62" transform="rotate(-24 90 87)" />
          <motion.g animate={{ rotate: 360 }} transition={{ duration: 7, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "100px 100px" }}>
            <circle cx="100" cy="52" r="2.2" fill="#17EAD9" />
            <circle cx="142" cy="121" r="1.7" fill="#6078EA" />
          </motion.g>
          {[83, 90, 97, 104, 111, 118].map((x, index) => (
            <motion.rect key={x} x={x} y="96" width="3" height="8" rx="1.5" fill={index < 3 ? "#17EAD9" : "#6078EA"} animate={{ scaleY: [0.45, 1.8 + (index % 3) * 0.35, 0.45] }} transition={{ duration: 1.35, delay: index * 0.11, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: `${x + 1.5}px 100px` }} />
          ))}
        </motion.svg>

        {filmDrops.map((drop, index) => (
          <DiveDrop key={index} progress={progress} drop={drop} index={index} />
        ))}
        <motion.div
          style={{ z: vs(-CORE_DEPTH + 0.02), opacity: flash, scale: form }}
          className="absolute inset-[28%] rounded-full bg-[radial-gradient(closest-side,#fff,rgba(217,251,255,.9)_28%,rgba(94,92,230,.52)_58%,transparent)] blur-md"
        />
      </motion.div>
    </motion.div>
  );
}

function DiveDrop({
  progress,
  drop,
  index,
}: {
  progress: MotionValue<number>;
  drop: (typeof filmDrops)[number];
  index: number;
}) {
  const start = T.drops[0] + drop.lag;
  const end = T.drops[1] + drop.lag * 2;
  const phase = (value: number) => clamp01((value - start) / (end - start));
  const x = useTransform(progress, (value) => vs(orbit(drop.angle, drop.radius, phase(value), 1.15).x));
  const y = useTransform(progress, (value) => vs(orbit(drop.angle, drop.radius, phase(value), 1.15).y));
  const z = useTransform(progress, (value) => vs(orbit(drop.angle, drop.radius, phase(value), 1.15).z));
  const scale = useTransform(progress, (value) => 1 - 0.65 * easeIn(phase(value)));
  const opacity = useScrub(progress, [end - 0.02, end], [1, 0]);
  const palette = dropletPalettes[drop.palette];

  return (
    <motion.div style={{ x, y, z, scale, transformStyle: "preserve-3d" }} className="absolute top-1/2 left-1/2">
        {/* Stood upright again, so a drop stays round on the tilted water. */}
        <motion.div
          style={{ opacity, rotateX: -TILT.rest }}
          className={`relative -translate-x-1/2 -translate-y-full ${drop.size}`}
        >
          <DropletBody palette={palette} delay={index * 0.7} />
        </motion.div>
    </motion.div>
  );
}

/* ───────────────────────── tiles ───────────────────────── */

// Seven wedges meeting at an impact point (58%, 42%): how a pane breaks.
const IMPACT = { x: 58, y: 42 };
const shards = [
  { points: "0% 0%, 45% 0%, 58% 42%, 0% 30%", cx: 26, cy: 18 },
  { points: "45% 0%, 100% 0%, 100% 20%, 58% 42%", cx: 76, cy: 15 },
  { points: "100% 20%, 100% 65%, 58% 42%", cx: 86, cy: 42 },
  { points: "100% 65%, 100% 100%, 70% 100%, 58% 42%", cx: 82, cy: 77 },
  { points: "70% 100%, 35% 100%, 58% 42%", cx: 54, cy: 80 },
  { points: "35% 100%, 0% 100%, 0% 70%, 58% 42%", cx: 23, cy: 78 },
  { points: "0% 70%, 0% 30%, 58% 42%", cx: 19, cy: 47 },
];
// The same seams, drawn as jagged cracks first, with a few short branches.
const cracks = [
  "M58 42 L50 19 L45 0",
  "M58 42 L80 29 L100 20",
  "M58 42 L81 55 L100 65",
  "M58 42 L67 71 L70 100",
  "M58 42 L45 70 L35 100",
  "M58 42 L29 57 L0 70",
  "M58 42 L31 37 L0 30",
  "M50 19 L38 13",
  "M81 55 L91 47",
  "M45 70 L54 83",
];
// Tile order → drop colours: blue-green, pink-violet, orange-pink.
const tilePalettes = [0, 2, 1];

function TileSlot({
  progress,
  project,
  index,
  onFocus,
}: {
  progress: MotionValue<number>;
  project: FeaturedProject;
  index: number;
  onFocus: () => void;
}) {
  const burst = T.burst + index * 0.006;
  const shatter = T.shatter + index * 0.012;
  const [crack0, crack1] = T.crack;
  const palette = dropletPalettes[tilePalettes[index % tilePalettes.length]];

  // The drop rises out of the whirlpool's core to this tile's place, then bursts.
  const split = useScrub(progress, T.split, [0, 1], { ease: easeOut });
  const blobScale = useScrub(progress, [T.split[0], T.split[1], burst, burst + 0.008], [0.3, 0.9, 1.2, 1.7]);
  const blobOpacity = useScrub(progress, [T.split[0], T.split[0] + 0.008, burst, burst + 0.008], [0, 1, 1, 0]);
  const ringScale = useScrub(progress, [burst, burst + 0.03], [0.4, 3.4], { ease: easeOut });
  const ringOpacity = useScrub(progress, [burst - 0.001, burst + 0.003, burst + 0.03], [0, 0.85, 0]);

  const tileScale = useSpring(useScrub(progress, [burst, burst + 0.022], [0.35, 1]), { stiffness: 220, damping: 15, mass: 0.6 });
  const tileOpacity = useScrub(progress, [burst, burst + 0.006, shatter - 0.001, shatter], [0, 1, 1, 0]);
  const float = useScrub(progress, T.hold, [10 + index * 4, -10 - index * 4]);
  const shake = useScrub(progress, [crack0, crack0 + 0.004, crack0 + 0.008, crack0 + 0.012, crack0 + 0.016, crack1], [0, -4, 4, -3, 2, 0]);
  const pointerEvents = useTransform(progress, (value) => (value > burst + 0.01 && value < shatter ? "auto" : "none"));
  const crackOpacity = useScrub(progress, [crack0, crack0 + 0.002, shatter - 0.001, shatter], [0, 1, 1, 0]);

  return (
    <li
      className="relative h-[7.5rem] [--sx:0px] [--sy:calc(var(--k)*8.25rem)] sm:h-auto sm:[--sx:calc(var(--k)*(var(--cw)+1.5rem))] sm:[--sy:0px] motion-reduce:h-auto"
      style={{ "--k": index - 1 } as CSSProperties}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center motion-reduce:hidden">
        <motion.div
          style={{ "--split": split } as MotionStyle}
          className="relative size-16 [transform:translate(calc(var(--sx)*(var(--split)-1)),calc(var(--sy)*(var(--split)-1)+(1-var(--split))*(4svh+var(--vs)*0.3)))] sm:size-24"
        >
          <motion.div style={{ scale: blobScale, opacity: blobOpacity }} className="absolute inset-0">
            <DropletBody palette={palette} delay={index} />
          </motion.div>
          <motion.span
            style={{ scale: ringScale, opacity: ringOpacity, borderColor: palette.colors[0], boxShadow: `0 0 40px ${palette.shadow}` }}
            className="absolute inset-0 rounded-full border-4"
          />
          {Array.from({ length: 10 }, (_, spark) => (
            <Spark key={spark} progress={progress} index={spark} burst={burst} color={palette.colors[spark % 2]} />
          ))}
        </motion.div>
      </div>

      <motion.div style={{ scale: tileScale, opacity: tileOpacity, y: float, x: shake, pointerEvents }} className="scroll-fx relative h-full">
        <Link
          href={`/project/${project.id}`}
          onFocus={onFocus}
          className="group flex h-full gap-3 rounded-[1.4rem] bg-band p-2 shadow-[0_24px_60px_-24px_rgb(0_0_0/0.35)] ring-1 ring-foreground/5 transition-shadow focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground sm:block sm:rounded-[1.75rem] sm:p-2.5"
        >
          <TileFace project={project} />
        </Link>
        <motion.svg
          aria-hidden
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ opacity: crackOpacity }}
          className="pointer-events-none absolute inset-0 size-full overflow-visible motion-reduce:hidden"
        >
          {cracks.map((d, crack) => (
            <Crack key={crack} progress={progress} d={d} index={crack} />
          ))}
        </motion.svg>
      </motion.div>

      <div aria-hidden className="pointer-events-none absolute inset-0 motion-reduce:hidden">
        {shards.map((shard, piece) => (
          <Shard key={piece} progress={progress} shard={shard} index={piece} start={shatter}>
            <TileFace project={project} decorative />
          </Shard>
        ))}
      </div>
    </li>
  );
}

function TileFace({ project, decorative = false }: { project: FeaturedProject; decorative?: boolean }) {
  const Title = decorative ? "p" : "h3";

  return (
    <>
      <div className="relative aspect-16/10 h-full shrink-0 overflow-hidden rounded-[1rem] bg-background sm:h-auto sm:w-full sm:rounded-[1.25rem]">
        <Image
          src={project.image.src}
          alt={decorative ? "" : project.image.alt || project.title}
          fill
          sizes="(max-width: 640px) 40vw, 30vw"
          className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
        />
      </div>
      <div className="min-w-0 self-center pr-2 sm:px-3.5 sm:pt-5 sm:pb-4">
        <Title className="text-[1.02rem] leading-snug font-semibold text-foreground sm:headline-card">{project.title}</Title>
        <p className="mt-1 text-[0.82rem] leading-relaxed text-muted-foreground sm:mt-1.5 sm:text-base">{project.tagline}</p>
      </div>
    </>
  );
}

function Spark({ progress, index, burst, color }: { progress: MotionValue<number>; index: number; burst: number; color: string }) {
  const angle = (index / 10) * Math.PI * 2;
  const distance = 70 + (index % 3) * 26;
  const x = useScrub(progress, [burst, burst + 0.03], [0, Math.round(Math.cos(angle) * distance)], { ease: easeOut });
  const y = useScrub(progress, [burst, burst + 0.03], [0, Math.round(Math.sin(angle) * distance)], { ease: easeOut });
  const opacity = useScrub(progress, [burst - 0.001, burst + 0.002, burst + 0.03], [0, 1, 0]);

  return (
    <motion.span
      style={{ x, y, opacity, background: color, boxShadow: `0 0 12px ${color}` }}
      className="absolute top-1/2 left-1/2 -mt-1 -ml-1 size-2 rounded-full"
    />
  );
}

function Crack({ progress, d, index }: { progress: MotionValue<number>; d: string; index: number }) {
  const start = T.crack[0] + (index < 7 ? index * 0.004 : 0.03 + (index - 7) * 0.003);
  const length = useScrub(progress, [start, start + 0.016], [0, 1], { ease: easeOut });

  return (
    <>
      <motion.path d={d} fill="none" stroke="#000" strokeOpacity="0.35" strokeWidth="3" vectorEffect="non-scaling-stroke" style={{ pathLength: length }} />
      <motion.path d={d} fill="none" stroke="#fff" strokeWidth="1.5" vectorEffect="non-scaling-stroke" style={{ pathLength: length }} />
    </>
  );
}

function Shard({
  progress,
  shard,
  index,
  start,
  children,
}: {
  progress: MotionValue<number>;
  shard: (typeof shards)[number];
  index: number;
  start: number;
  children: ReactNode;
}) {
  // Pieces near the impact go first; each one parts a little, then drops.
  const distance = Math.hypot(shard.cx - IMPACT.x, shard.cy - IMPACT.y);
  const delay = start + distance * 0.0002 + index * 0.003;
  const end = delay + T.fall;
  const drift = ((shard.cx - IMPACT.x) * 0.14).toFixed(2);
  const x = useScrub(progress, [delay, delay + 0.008, end], ["0vw", `${(Number(drift) * 0.25).toFixed(2)}vw`, `${drift}vw`]);
  const y = useScrub(progress, [delay, delay + 0.008, end], ["0svh", `${((shard.cy - IMPACT.y) * 0.04).toFixed(2)}svh`, `${75 + ((index * 17) % 35)}svh`], {
    ease: easeIn,
  });
  const rotate = useScrub(progress, [delay, end], [0, (index % 2 ? 1 : -1) * (25 + index * 11)]);
  const opacity = useScrub(progress, [start - 0.001, start, end - 0.03, end], [0, 1, 1, 0]);

  return (
    <motion.div
      style={{
        x,
        y,
        rotate,
        opacity,
        clipPath: `polygon(${shard.points})`,
        transformOrigin: `${shard.cx}% ${shard.cy}%`,
      }}
      className="absolute inset-0 flex gap-3 rounded-[1.4rem] bg-band p-2 sm:block sm:rounded-[1.75rem] sm:p-2.5"
    >
      {children}
      <span className="absolute inset-0 rounded-[inherit] ring-1 ring-white/50 ring-inset" />
    </motion.div>
  );
}
