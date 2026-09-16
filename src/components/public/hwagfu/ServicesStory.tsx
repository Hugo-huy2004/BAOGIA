"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { ChevronRight, Globe2, Layers3, MousePointer2, Search, Sparkles } from "lucide-react";
import BrutalismTheme from "../../themes/BrutalismTheme";
import { Link } from "./RouterLink";
import { useFilm } from "./useFilm";

type Chapter = {
  eyebrow: string;
  title: string;
  description: string;
  features?: string[];
  href?: string;
  demoHref?: string;
  demoLabel?: string;
  actionLabel?: string;
};

type ServicesStoryProps = {
  label: string;
  heading: string;
  chapters: Chapter[];
  progressLabels: string[];
  speedUnit: string;
  mergeLabel: string;
  seoBurst: [string, string];
  cta: string;
  ctaHref?: string;
  standalone?: boolean;
};

const spring = { stiffness: 145, damping: 20, mass: 0.58 };
const vivid = ["#17EAD9", "#35CFE1", "#4CB5E7", "#6078EA", "#7B8FF2", "#FFD166", "#FF6B8A"];
export const studentBioDemo = {
  displayName: "Minh Anh",
  headline: "Student · UI/UX & Frontend",
  avatarUrl: "/image/avt5.png",
  bio: "Mình là sinh viên thiết kế sản phẩm số, thích biến ý tưởng nhỏ thành trải nghiệm có thể dùng thật. Đây là nơi mình lưu hành trình học, dự án và những điều đang khám phá.",
  jobTitle: "Product Design Intern",
  education: "Sinh viên Thiết kế truyền thông · 2024–2028",
  skills: "UI/UX, React, Figma, Illustration, Design System",
  hobbies: "Vẽ minh hoạ, làm side project, chụp ảnh đường phố",
  birthday: "18 · 09 · 2006",
  address: "TP. Hồ Chí Minh",
  contactEmail: "minhanh.student@example.edu",
  theme: { template: "brutalism", bgColor: "#17EAD9", accentColor: "#6078EA", pattern: "dots" },
  projects: [
    { title: "Study Space", description: "Ứng dụng giúp sinh viên lên kế hoạch học và giữ nhịp tập trung.", imageUrl: "/project-screenshots/hugo-studio/tasks.webp", link: "/student-pricing" },
    { title: "Portfolio 2026", description: "Tuyển tập bài tập thương hiệu, UI và minh hoạ trong năm học.", imageUrl: "/project-screenshots/hugo-studio/apps.webp", link: "/project" },
    { title: "Hugo Kit", description: "Bộ công cụ web nhỏ phục vụ học tập và làm dự án nhóm.", imageUrl: "/project-screenshots/hugo-studio/arcade.webp", link: "/member" },
  ],
  services: [
    { name: "Thiết kế giao diện", description: "Landing page & mobile UI", icon: "draw", price: "Nhận dự án" },
    { name: "Minh hoạ", description: "Poster & social artwork", icon: "palette", price: "Trao đổi" },
  ],
  links: [
    { label: "Xem portfolio", url: "https://www.hugowishpax.studio/project" },
    { label: "Dự án tiêu biểu", url: "https://www.hugowishpax.studio/student-pricing" },
    { label: "Không gian học tập", url: "https://www.hugowishpax.studio/member" },
  ],
  tabs: [
    { title: "Mục tiêu năm nay", content: "Hoàn thiện ba sản phẩm có người dùng thật và chia sẻ lại toàn bộ quá trình." },
    { title: "Đang học", content: "Motion design · React · Thiết kế hệ thống · Tiếng Anh chuyên ngành" },
  ],
};

/**
 * One continuous, scroll-scrubbed product film: a MacBook turns into an
 * iPhone, and the phone's confetti draws a performance watch before the
 * final SEO burst.
 */
export default function ServicesStory({
  label,
  heading,
  chapters,
  progressLabels,
  speedUnit,
  mergeLabel,
  seoBurst,
  cta,
  ctaHref = "/services",
  standalone = false,
}: ServicesStoryProps) {
  const ref = useRef<HTMLDivElement>(null);
  const storyChapterCount = standalone ? Math.min(chapters.length, 4) : 3;
  // Fades in over the work film's falling shards; hands over to the profile
  // film while "SEO" is still on screen.
  const { progress: rawProgress, frame } = useFilm(ref, standalone ? 700 : 560, { enters: !standalone, leaves: !standalone });
  // Apple product film: con lăn chuột nhảy từng nấc, nên cảnh phải bám vào
  // một lò xo thay vì bám thẳng vào scroll — mọi chuyển cảnh nhờ đó trôi
  // tiếp một nhịp sau khi ngón tay dừng thay vì khựng lại.
  const smoothProgress = useSpring(rawProgress, { stiffness: 210, damping: 36, mass: 0.32, restDelta: 0.0008 });
  const scrollYProgress = standalone ? smoothProgress : rawProgress;

  const isVietnamese = speedUnit === "điểm hiệu năng";
  // Motion hands these `opacity` scrubs to a browser ViewTimeline animation.
  // When an input range stops short of 1, the browser fills the tail with the
  // element's first-render value — a layer that ends at a different opacity
  // than it starts at must pin that value at 1, or it fades back in.
  const introOpacity = useTransform(
    scrollYProgress,
    standalone ? [0, 0.07, 0.105] : [0, 0.035, 0.105, 0.135],
    standalone ? [1, 1, 0] : [0, 1, 1, 0],
  );
  const macOpacity = useTransform(
    scrollYProgress,
    standalone ? [0, 0.05, 0.255, 0.325] : [0.07, 0.145, 0.255, 0.325],
    standalone ? [0.5, 1, 1, 0] : [0, 1, 1, 0],
  );
  const macScale = useSpring(
    useTransform(
      scrollYProgress,
      standalone ? [0, 0.08, 0.255, 0.325] : [0.08, 0.18, 0.255, 0.325],
      standalone ? [0.8, 1, 1, 0.72] : [0.66, 1, 1, 0.72],
    ),
    spring,
  );
  const macRotateY = useTransform(scrollYProgress, [0.245, 0.325], [0, 92]);
  const phoneOpacity = useTransform(scrollYProgress, [0.265, 0.335, 0.6, 0.69, 1], [0, 1, 1, 0, 0]);
  const phoneScale = useSpring(
    useTransform(scrollYProgress, [0.265, 0.34, 0.58, 0.68], [0.72, 1, 1, 0.56]),
    spring,
  );
  const phoneY = useTransform(scrollYProgress, [0.265, 0.34, 0.58, 0.68], [54, 0, 0, 34]);
  const phoneRotateY = useTransform(scrollYProgress, [0.265, 0.34], [-92, 0]);
  const phoneShakeX = useTransform(scrollYProgress, [0.545, 0.56, 0.57, 0.58, 0.59, 0.6, 0.615], [0, 0, -7, 7, -5, 5, 0]);
  const phoneShake = useTransform(scrollYProgress, [0.545, 0.56, 0.57, 0.58, 0.59, 0.6, 0.615], [0, 0, -2, 2, -1.5, 1.5, 0]);
  const watchOpacity = useTransform(scrollYProgress, [0.615, 0.69, 0.84, 0.875], [0, 1, 1, 0]);
  const watchScale = useSpring(
    useTransform(scrollYProgress, [0.61, 0.7, 0.83, 0.88], [0.18, 1, 1.03, 1.24]),
    { stiffness: 190, damping: 18, mass: 0.52 },
  );

  return (
    <section id="services" data-standalone={standalone} className={`relative text-foreground motion-reduce:mt-0 ${standalone ? "" : "-mt-[100svh]"}`}>
      <div className="hidden bg-background px-5 py-20 motion-reduce:block">
        <div className="mx-auto max-w-lg">
          <p className="kicker text-[var(--hw-hue-blue)]">{label}</p>
          <h2 className="headline-section mt-2">{heading}</h2>
          <ol className="mt-10 border-t border-border">
            {chapters.slice(0, storyChapterCount).map((chapter, index) => (
              <li key={chapter.title} className="border-b border-border py-7">
                <p className="font-mono text-[0.68rem] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                  {standalone && index === 2 ? <>03 · Hugo <span className="bg-linear-to-r from-[#17EAD9] via-[#4CB5E7] to-[#6078EA] bg-clip-text text-transparent">Flow+</span></> : chapter.eyebrow}
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">{chapter.title}</h3>
                <p className="mt-3 text-[0.95rem] leading-7 text-muted-foreground">{chapter.description}</p>
                {standalone ? (
                  <div aria-hidden className="mt-8 flex justify-center py-2">
                    <IPhone15 compact showLabel={false} label={`Bản điện thoại · ${chapter.title}`}>
                      <ServiceWebsiteScreen index={index} mobile />
                    </IPhone15>
                  </div>
                ) : null}
                {chapter.features?.length ? (
                  <ul className="mt-5 grid gap-x-5 gap-y-2 sm:grid-cols-2">
                    {chapter.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm leading-6 text-foreground/75">
                        <span aria-hidden className="mt-[0.55rem] size-1.5 shrink-0 rounded-full bg-[var(--hw-hue-blue)]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {chapter.href ? (
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Link href={chapter.href} className="rounded-full bg-foreground px-4 py-2.5 text-xs font-semibold text-background">{chapter.actionLabel || "Xem chi tiết"}</Link>
                    {chapter.demoHref ? <Link href={chapter.demoHref} className="rounded-full border border-border px-4 py-2.5 text-xs font-semibold">{chapter.demoLabel || "Mở Bio của bạn"}</Link> : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
          <Link href={ctaHref} className="btn-primary mt-8 w-full">
            {cta}<ChevronRight className="size-5" aria-hidden />
          </Link>
        </div>
      </div>
      <div ref={ref} data-services-film className={`relative motion-reduce:hidden ${standalone ? "h-[700svh]" : "h-[560svh]"}`}>
        <motion.div style={frame} className="sticky top-0 h-svh min-h-[35rem] overflow-hidden bg-background">
          <FilmAtmosphere progress={scrollYProgress} />

          <motion.header
            style={{ opacity: introOpacity }}
            className="absolute inset-x-5 top-[clamp(4.75rem,9svh,7rem)] z-30 text-center sm:inset-x-8"
          >
            <p className="font-mono text-[0.65rem] font-medium tracking-[0.18em] text-foreground/50 uppercase sm:text-xs">
              {label} · Hugo Studio
            </p>
            <h2 className="mx-auto mt-3 max-w-4xl text-[clamp(1.85rem,1.2rem+2.7vw,4rem)] leading-[1.02] font-semibold tracking-[-0.055em] text-foreground">
              {heading}
            </h2>
          </motion.header>

          <div
            aria-hidden
            /* Đáy sân khấu phải dừng đúng chỗ khối lời thoại bắt đầu. Trước đây
               đáy tính bằng svh (23svh ≈ 207px ở màn cao 900) còn lời thoại cao
               cố định 11.25rem đặt cách đáy 5rem — tức mép trên của nó ở 16.25rem
               ≈ 260px. Hai con số đo bằng hai đơn vị khác nhau nên luôn chồng
               nhau khoảng 70px: chữ đè lên nửa dưới màn hình máy tính. */
            className="hw-services-stage absolute inset-x-0 top-[18svh] bottom-[16.75rem] z-10 flex items-center justify-center motion-reduce:hidden sm:top-[20svh]"
          >
            {standalone ? (
              <ServicePackageFilm progress={scrollYProgress} chapters={chapters} />
            ) : (
              <>
                <motion.div
                  style={{ opacity: macOpacity, scale: macScale, rotateY: macRotateY }}
                  className="absolute z-20 [perspective:1200px]"
                >
                  <MacBookProM4 label={isVietnamese ? "MacBook Pro M4 của Hugo" : "Hugo’s MacBook Pro M4"}>
                    <ManyPagesScene progress={scrollYProgress} isVietnamese={isVietnamese} />
                  </MacBookProM4>
                </motion.div>

                <motion.div
                  style={{ opacity: phoneOpacity, scale: phoneScale, y: phoneY, x: phoneShakeX, rotateY: phoneRotateY, rotateZ: phoneShake }}
                  className="absolute z-20 [perspective:1200px]"
                >
                  <IPhone15 label={isVietnamese ? "iPhone 15 của Hugo" : "Hugo’s iPhone 15"}>
                    <LandingScene progress={scrollYProgress} mergeLabel={mergeLabel} isVietnamese={isVietnamese} />
                  </IPhone15>
                </motion.div>

                <MorphFragments progress={scrollYProgress} />

                <motion.div
                  style={{ opacity: watchOpacity, scale: watchScale }}
                  className="absolute z-30"
                >
                  <PerformanceWatch progress={scrollYProgress} speedUnit={speedUnit} />
                </motion.div>

                <SeoBurstParticles progress={scrollYProgress} />
                <SeoFinale progress={scrollYProgress} lines={seoBurst} />
              </>
            )}
          </div>

          <div
            aria-hidden
            className="absolute inset-x-5 top-[22svh] bottom-[24svh] hidden items-center justify-center motion-reduce:flex"
          >
            <div className="grid w-full max-w-3xl grid-cols-[1fr_auto_1fr] items-center gap-5">
              <div className="mx-auto h-48 w-24 rounded-[2rem] border-2 border-foreground/40 bg-[#101014] p-2">
                <div className="flex h-full flex-col gap-2 rounded-[1.45rem] bg-white p-3">
                  <span className="h-14 rounded-xl bg-linear-to-br from-[#7857ff] to-[#ff467e]" />
                  <span className="h-5 rounded-lg bg-[#22c990]" />
                  <span className="h-10 rounded-lg bg-[#ff9f0a]" />
                </div>
              </div>
              <span className="text-xl text-foreground/35">→</span>
              <div className="mx-auto flex size-40 items-center justify-center rounded-[2.8rem] border-4 border-foreground/40 bg-[#111116] text-5xl font-semibold text-white tabular-nums shadow-2xl">
                100
              </div>
            </div>
          </div>

          <div
            aria-hidden
            className={"hw-services-copy " + (standalone
              ? "absolute right-[4vw] top-[20svh] bottom-[7.5rem] z-40 w-[35vw] max-w-[31rem] text-left motion-reduce:hidden"
              : "absolute inset-x-5 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-40 mx-auto h-[11.25rem] max-w-5xl text-center motion-reduce:hidden md:bottom-20")}
          >
            {chapters.slice(0, storyChapterCount).map((chapter, index) => (
              <ChapterCopy key={chapter.eyebrow} chapter={chapter} index={index} progress={scrollYProgress} early={standalone} total={storyChapterCount} />
            ))}
          </div>

          <div className="absolute inset-x-5 bottom-[calc(1.2rem+env(safe-area-inset-bottom))] z-50 flex items-end gap-4 md:inset-x-8 md:bottom-7">
            <div aria-hidden className="min-w-0 flex-1 motion-reduce:hidden">
              <ProgressRail labels={progressLabels} progress={scrollYProgress} />
            </div>
            <Link
              href={ctaHref}
              className="group ml-auto inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background shadow-[0_8px_30px_rgb(0_0_0/0.2)] transition-transform hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground sm:h-auto dark:shadow-[0_8px_30px_rgb(0_0_0/0.35)] sm:w-auto sm:px-5 sm:py-3"
            >
              <span className="sr-only sm:not-sr-only">{cta}</span>
              <ChevronRight className="size-5 transition-transform group-hover:translate-x-0.5 sm:ml-1" aria-hidden />
            </Link>
          </div>

          <div className="sr-only">
            <ol>
              {chapters.slice(0, storyChapterCount).map((chapter) => (
                <li key={chapter.eyebrow}>
                  <h3>{chapter.title}</h3>
                  <p>{chapter.description}</p>
                  {chapter.features?.length ? <p>Bao gồm: {chapter.features.join(", ")}.</p> : null}
                </li>
              ))}
            </ol>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FilmAtmosphere({ progress }: { progress: MotionValue<number> }) {
  const purple = useTransform(progress, [0, 0.25, 0.5, 0.8, 1], [0.18, 0.42, 0.16, 0.3, 0.08]);
  const blue = useTransform(progress, [0, 0.3, 0.55, 0.82, 1], [0.24, 0.1, 0.38, 0.18, 0.06]);
  const flareScale = useTransform(progress, [0.82, 1], [0.35, 2.4]);
  const flareOpacity = useTransform(progress, [0.82, 0.92, 1], [0, 0.22, 0.05]);

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <motion.div
        style={{ opacity: purple }}
        className="absolute -top-[30%] left-[5%] h-[70%] w-[75%] rounded-full bg-[#6078EA] blur-[140px] dark:bg-[#6078EA]"
      />
      <motion.div
        style={{ opacity: blue }}
        className="absolute -right-[15%] top-[18%] h-[72%] w-[65%] rounded-full bg-[#17EAD9] blur-[150px] dark:bg-[#17EAD9]"
      />
      <motion.div
        style={{ scale: flareScale, opacity: flareOpacity }}
        className="absolute left-1/2 top-1/2 size-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4CB5E7] blur-[120px] dark:bg-[#6078EA]"
      />
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_center,rgba(0,0,0,.22)_0.7px,transparent_0.8px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,transparent,black_22%,black_78%,transparent)] dark:[background-image:radial-gradient(circle_at_center,rgba(255,255,255,.2)_0.7px,transparent_0.8px)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--background)_20%,transparent),transparent_18%,transparent_74%,color-mix(in_oklab,var(--background)_92%,transparent))]" />
    </div>
  );
}

function MacBookProM4({ label, children, still = false }: { label: string; children: ReactNode; still?: boolean }) {
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const glareX = useMotionValue("34%");
  const glareY = useMotionValue("12%");
  const rotateX = useSpring(rawRotateX, { stiffness: 220, damping: 24, mass: 0.55 });
  const rotateY = useSpring(rawRotateY, { stiffness: 220, damping: 24, mass: 0.55 });
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,.46), rgba(255,255,255,.08) 22%, transparent 48%)`;

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    rawRotateY.set((x - 0.5) * 9);
    rawRotateX.set((0.5 - y) * 6);
    glareX.set(`${Math.round(x * 100)}%`);
    glareY.set(`${Math.round(y * 100)}%`);
  }

  function resetTilt() {
    rawRotateX.set(0);
    rawRotateY.set(0);
  }

  return (
    <div className="hw-mac relative w-[min(91vw,52rem)] [perspective:1400px]">
      <motion.div
        role="img"
        aria-label={label}
        onPointerMove={still ? undefined : handlePointerMove}
        onPointerLeave={still ? undefined : resetTilt}
        onPointerCancel={still ? undefined : resetTilt}
        whileHover={still ? undefined : { scale: 1.012 }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="group relative cursor-grab active:cursor-grabbing"
      >
        <div className="relative aspect-[16/10] origin-bottom rounded-t-[1rem] rounded-b-[0.2rem] bg-linear-to-br from-[#fbfbfd] via-[#aeb0b6] to-[#494b50] p-[4px] shadow-[0_50px_95px_-30px_rgb(0_0_0/.62),0_0_0_1px_rgb(255_255_255/.65),inset_2px_2px_3px_rgb(255_255_255/.95)] [transform:translateZ(22px)_rotateX(-2deg)] sm:rounded-t-[1.35rem] sm:rounded-b-[0.25rem] sm:p-[6px]">
          <span className="absolute inset-x-[4%] top-[1px] z-40 h-px bg-linear-to-r from-transparent via-white to-transparent" />
          <span className="absolute -right-[5px] inset-y-[5%] w-[5px] rounded-r-lg bg-linear-to-b from-[#d9dade] via-[#777980] to-[#393b40]" />
          <div className="relative size-full overflow-hidden rounded-[0.78rem] bg-[#050507] p-[5px] shadow-[inset_0_0_0_1px_rgb(0_0_0/.9)] sm:rounded-[1.05rem]">
            <div className="relative size-full overflow-hidden rounded-[0.58rem] bg-[#09090c] sm:rounded-[0.82rem]">
              <span className="absolute left-1/2 top-0 z-50 h-[4.5%] w-[13%] -translate-x-1/2 rounded-b-xl bg-black shadow-[0_1px_0_rgb(255_255_255/.08)]" />
              {children}
              <motion.span style={{ background: glare }} className="pointer-events-none absolute inset-0 z-[60] opacity-25 mix-blend-screen transition-opacity duration-300 group-hover:opacity-70" />
            </div>
          </div>
        </div>
        <div className="relative left-1/2 h-16 w-[112%] -translate-x-1/2 [perspective:900px] sm:h-24">
          <div className="absolute inset-0 origin-top bg-linear-to-b from-[#eef0f3] via-[#a9abb0] to-[#55575d] shadow-[0_32px_38px_-16px_rgb(0_0_0/.58)] [clip-path:polygon(4%_0,96%_0,100%_90%,99%_96%,96.5%_100%,3.5%_100%,1%_96%,0_90%)] [transform:translateZ(8px)_rotateX(62deg)]">
            <span className="absolute left-[9%] top-[9%] h-[47%] w-[82%] rounded-[0.35rem] border border-black/30 bg-[#202126] shadow-[inset_0_0_0_2px_rgb(255_255_255/.08)] [background-image:repeating-linear-gradient(90deg,transparent_0_7%,rgba(255,255,255,.24)_7.3%_7.6%),repeating-linear-gradient(0deg,transparent_0_22%,rgba(255,255,255,.2)_22.5%_23%)]" />
            <span className="absolute left-1/2 bottom-[7%] h-[30%] w-[31%] -translate-x-1/2 rounded-[0.35rem] border border-black/20 bg-linear-to-b from-[#c9cbd0] to-[#9a9ca2] shadow-[inset_0_1px_1px_rgb(255_255_255/.7)]" />
            <span className="absolute left-1/2 top-0 h-[5%] w-[18%] -translate-x-1/2 rounded-b-lg bg-[#6f7177] shadow-[inset_0_1px_1px_rgb(0_0_0/.4)]" />
          </div>
          {/* Bề dày nhôm ở mép trước. Mặt bàn phím nằm nghiêng 62° nên mép trước
              của nó rơi đúng 46.5% chiều cao khối này và rộng ra ~111% (mép
              trước ngả về phía người xem nên phối cảnh phóng to nó). Dải này
              đứng đúng đó, thẳng mặt người xem, để máy có bề dày thay vì là một
              tấm phẳng cắt ngang. */}
          <span className="absolute left-1/2 top-[46.5%] h-[6px] w-[108%] -translate-x-1/2 rounded-b-[0.45rem] sm:h-[9px] sm:w-[111.5%] bg-linear-to-b from-[#e9ebef] via-[#9b9da3] to-[#3f4146] shadow-[0_12px_20px_-10px_rgb(0_0_0/.65)]" />
        </div>
        <span className="absolute left-1/2 top-[calc(100%_-_4rem)] z-20 h-1.5 w-[24%] -translate-x-1/2 rounded-full bg-linear-to-b from-[#34363a] to-[#111216] shadow-lg sm:top-[calc(100%_-_6rem)]" />
      </motion.div>
    </div>
  );
}

function IPhone15({ label, children, compact = false, showLabel = true, still = false }: { label: string; children: ReactNode; compact?: boolean; showLabel?: boolean; still?: boolean }) {
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const glareX = useMotionValue("50%");
  const glareY = useMotionValue("18%");
  const rotateX = useSpring(rawRotateX, { stiffness: 250, damping: 25, mass: 0.55 });
  const rotateY = useSpring(rawRotateY, { stiffness: 250, damping: 25, mass: 0.55 });
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,.5), rgba(255,255,255,.08) 24%, transparent 52%)`;

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    rawRotateY.set((x - 0.5) * 11);
    rawRotateX.set((0.5 - y) * 8);
    glareX.set(`${Math.round(x * 100)}%`);
    glareY.set(`${Math.round(y * 100)}%`);
  }

  function resetTilt() {
    rawRotateX.set(0);
    rawRotateY.set(0);
  }

  return (
    <div className="hw-phone relative [perspective:1100px]">
      {showLabel ? <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[0.58rem] font-medium tracking-[0.16em] text-foreground/50 uppercase">{label}</span> : null}
      <motion.div
        role="img"
        aria-label={label}
        onPointerMove={still ? undefined : handlePointerMove}
        onPointerLeave={still ? undefined : resetTilt}
        onPointerCancel={still ? undefined : resetTilt}
        whileHover={still ? undefined : { scale: 1.015 }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d", aspectRatio: "71.5 / 149.6" }}
        className={`group relative cursor-grab bg-linear-to-br from-[#fafafa] via-[#c7c8cc] to-[#63656a] p-[3px] shadow-[0_45px_100px_-24px_rgb(0_0_0/.5),0_0_0_1px_rgb(255_255_255/.28),inset_1px_1px_2px_rgb(255_255_255/.95)] active:cursor-grabbing dark:shadow-[0_45px_100px_-24px_rgb(0_0_0/.85),0_0_0_1px_rgb(255_255_255/.28),inset_1px_1px_2px_rgb(255_255_255/.95)] ${compact ? "h-[22rem] rounded-[2.35rem]" : "h-[min(51svh,32rem)] rounded-[2.8rem] sm:rounded-[3.25rem]"}`}
      >
        <div className={`relative size-full bg-[#08080a] p-[5px] shadow-[inset_0_0_0_1px_rgb(0_0_0/.85)] sm:p-[6px] ${compact ? "rounded-[2.18rem]" : "rounded-[2.62rem] sm:rounded-[3.05rem]"}`}>
          <div className={`relative size-full overflow-hidden bg-[#09090c] ${compact ? "rounded-[1.88rem]" : "rounded-[2.32rem] sm:rounded-[2.7rem]"}`}>
            <div className="absolute top-[1.65%] left-1/2 z-50 flex h-[4.8%] w-[31%] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-[8%] shadow-[inset_0_1px_1px_rgb(255_255_255/.12)]">
              <span className="size-[0.28rem] rounded-full bg-[#151a28] ring-1 ring-[#2a3550]" />
            </div>
            {children}
            <span className="absolute bottom-[1.2%] left-1/2 z-50 h-[0.75%] w-[34%] -translate-x-1/2 rounded-full bg-white/85" />
          </div>
        </div>
        <motion.span
          style={{ background: glare, translateZ: 18 }}
          className={`pointer-events-none absolute inset-[3px] z-[60] opacity-0 mix-blend-screen transition-opacity duration-300 group-hover:opacity-60 ${compact ? "rounded-[2.25rem]" : "rounded-[2.7rem] sm:rounded-[3.1rem]"}`}
        />
        <span className="absolute -right-[3px] top-[25%] h-[14%] w-[3px] rounded-r-full bg-linear-to-b from-white to-[#83858a]" />
        <span className="absolute -left-[3px] top-[20%] h-[8%] w-[3px] rounded-l-full bg-linear-to-b from-white to-[#83858a]" />
        <span className="absolute -left-[3px] top-[32%] h-[13%] w-[3px] rounded-l-full bg-linear-to-b from-white to-[#83858a]" />
        <span className="absolute -left-[3px] top-[48%] h-[13%] w-[3px] rounded-l-full bg-linear-to-b from-white to-[#83858a]" />
      </motion.div>
    </div>
  );
}

/** Khung điện thoại dùng lại ngoài phim (bộ chọn giao diện Bio, ảnh minh hoạ…). */
export function PhoneFrame({ label, children, compact = true }: { label: string; children: ReactNode; compact?: boolean }) {
  return (
    <IPhone15 compact={compact} still showLabel={false} label={label}>
      {children}
    </IPhone15>
  );
}

/**
 * Ảnh minh hoạ tĩnh cho trang chi tiết gói: đúng bộ máy và đúng giao diện mẫu
 * đang chạy trong phim cuộn, nên hai nơi không bao giờ lệch nhau. Không có
 * chuyển động — trang chi tiết là chỗ để đọc, không phải chỗ để diễn.
 *
 * Màn hình nhỏ chỉ hiện điện thoại: thu nhỏ cả cái máy tính xuống bề ngang
 * điện thoại thì không ai nhìn ra cái gì.
 */
export function PackageStill({ index, label }: { index: number; label: string }) {
  return (
    <div className="relative aspect-[3/4] w-full [perspective:1600px] sm:aspect-[16/11]">
      <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 scale-[.5] sm:block lg:scale-[.58]">
        <MacBookProM4 still label={label}>
          <ServiceWebsiteScreen index={index} />
        </MacBookProM4>
      </div>
      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 scale-[.92] sm:left-[79%] sm:scale-[.68] lg:scale-[.76]">
        <IPhone15 compact still showLabel={false} label={label}>
          <ServiceWebsiteScreen index={index} mobile />
        </IPhone15>
      </div>
    </div>
  );
}

function ServicePackageFilm({ progress, chapters }: { progress: MotionValue<number>; chapters: Chapter[] }) {
  return (
    <div className="absolute inset-0">
      {chapters.slice(0, 4).map((chapter, index) => (
        <ServiceDevicePair key={chapter.eyebrow} chapter={chapter} index={index} progress={progress} />
      ))}
    </div>
  );
}

/**
 * Mỗi gói có một lối vào riêng, đọc từ trên xuống: lao từ xa tới, lật mở như
 * trang giấy, dựng lên từ mặt bàn, rồi trượt ngang trao tay. Cùng một cặp máy
 * nhưng người xem không đoán được cảnh sau — đó là chỗ "bất ngờ", không phải
 * mấy mảnh giấy màu bay quanh.
 */
const entrances = [
  { mac: { x: 0, y: 40, scale: 0.46, rotateY: 0, rotateX: 0 }, phone: { x: 0, y: 70, scale: 0.3, rotateY: 0, rotateZ: 0 } },
  { mac: { x: -70, y: 0, scale: 0.95, rotateY: -74, rotateX: 0 }, phone: { x: 120, y: 0, scale: 0.95, rotateY: 74, rotateZ: 0 } },
  { mac: { x: 0, y: 150, scale: 0.98, rotateY: 0, rotateX: 62 }, phone: { x: 0, y: 220, scale: 0.98, rotateY: 0, rotateZ: -22 } },
  { mac: { x: -180, y: 0, scale: 1, rotateY: 26, rotateX: 0 }, phone: { x: 260, y: 40, scale: 1.04, rotateY: -30, rotateZ: 12 } },
];

function ServiceDevicePair({ chapter, index, progress }: { chapter: Chapter; index: number; progress: MotionValue<number> }) {
  const ranges = [
    [0, 0.055, 0.205, 0.245],
    [0.225, 0.275, 0.43, 0.475],
    [0.455, 0.51, 0.69, 0.735],
    [0.715, 0.77, 0.99, 1],
  ];
  const [a, b, c, d] = ranges[index];
  const last = index === 3;
  const opacity = useTransform(progress, [a, b, c, d], last ? [0, 1, 1, 1] : [index === 0 ? 0.18 : 0, 1, 1, 0]);
  const sceneProgress = useTransform(progress, [a, d], [0, 1]);
  // Bất ngờ nằm ở chính cái máy, không ở đồ trang trí quanh nó: mỗi gói bước
  // vào sân khấu bằng một kiểu khác hẳn, rồi cùng đứng yên ở giữa lúc đọc chữ.
  const entry = entrances[index];
  const macY = useTransform(sceneProgress, [0, 0.24, 0.82, 1], [entry.mac.y, 0, 0, last ? 0 : -58]);
  const macScale = useTransform(sceneProgress, [0, 0.24, 0.82, 1], [entry.mac.scale, 1, 1, last ? 1 : 1.06]);
  const macRotateY = useTransform(sceneProgress, [0, 0.24, 0.82, 1], [entry.mac.rotateY, 0, 0, last ? 0 : -7]);
  const macRotateX = useTransform(sceneProgress, [0, 0.24, 0.82, 1], [entry.mac.rotateX, 0, 0, 0]);
  const macX = useTransform(sceneProgress, [0, 0.24, 0.82, 1], [entry.mac.x, 0, 0, 0]);
  // Điện thoại vào trễ hơn một nhịp và đi xa hơn, để hai lớp tách nhau ra.
  const phoneY = useTransform(sceneProgress, [0, 0.3, 0.82, 1], [entry.phone.y, 0, 0, last ? 0 : -92]);
  const phoneScale = useTransform(sceneProgress, [0, 0.3, 0.82, 1], [entry.phone.scale, 1, 1, last ? 1 : 1.1]);
  const phoneRotateY = useTransform(sceneProgress, [0, 0.3, 0.82, 1], [entry.phone.rotateY, 0, 0, last ? 0 : -11]);
  const phoneRotateZ = useTransform(sceneProgress, [0, 0.3, 0.82, 1], [entry.phone.rotateZ, 0, 0, 0]);
  const phoneX = useTransform(sceneProgress, [0, 0.3, 0.82, 1], [entry.phone.x, 0, 0, 0]);
  // Một vệt sáng quét ngang đúng lúc máy vừa đứng yên — thay cho đám hoa giấy cũ.
  const glintX = useTransform(sceneProgress, [0.12, 0.46], ["-40%", "140%"]);
  const glintOpacity = useTransform(sceneProgress, [0.12, 0.22, 0.4, 0.46], [0, 1, 1, 0]);

  const visibility = useTransform(opacity, (value) => (value < 0.02 ? "hidden" : "visible"));

  return (
    <motion.div style={{ opacity, visibility }} className="hw-service-pair absolute inset-y-0 left-[1vw] right-[45%] flex items-center justify-center [perspective:1500px] [transform-style:preserve-3d]">
      <div className="shrink-0 scale-[.82] md:scale-[.56] lg:scale-[.62] xl:scale-[.68]">
        <motion.div style={{ x: macX, y: macY, scale: macScale, rotateY: macRotateY, rotateX: macRotateX }} className="[transform-style:preserve-3d]">
          <MacBookProM4 still label={`MacBook · ${chapter.title}`}>
            <ServiceWebsiteScreen index={index} progress={progress} />
          </MacBookProM4>
        </motion.div>
      </div>
      <motion.span
        aria-hidden
        style={{ x: glintX, opacity: glintOpacity }}
        className="pointer-events-none absolute inset-y-[12%] left-0 z-40 w-[22%] bg-linear-to-r from-transparent via-white/25 to-transparent blur-2xl mix-blend-screen"
      />
      <div className="absolute left-[80%] top-[50%] z-50 -translate-x-1/2 -translate-y-1/2 scale-[.8] xl:scale-[.9]">
        <motion.div style={{ x: phoneX, y: phoneY, scale: phoneScale, rotateY: phoneRotateY, rotateZ: phoneRotateZ }} className="[transform-style:preserve-3d]">
          <IPhone15 compact still showLabel={false} label={`iPhone · ${chapter.title}`}>
            <ServiceWebsiteScreen index={index} mobile progress={progress} />
          </IPhone15>
        </motion.div>
      </div>
    </motion.div>
  );
}

/**
 * Giao diện web giả chạy trong máy.
 *
 * Khung màn hình điện thoại chỉ rộng ~150px thật. Dựng giao diện thẳng vào đó
 * thì chữ phải tụt xuống 5-6px, nhãn đè lên giá trị, chữ bị cắt — nên bản
 * `mobile` được dựng ở khổ điện thoại thật (~320px) rồi thu nhỏ nguyên khối:
 * chữ, khoảng cách và bo góc co đều theo. 213.2% × 0.469 = vừa khít khung.
 */
function ServiceWebsiteScreen({ index, mobile = false, progress }: { index: number; mobile?: boolean; progress?: MotionValue<number> }) {
  const screen = (
    <div className="hw-service-website absolute inset-0 overflow-hidden bg-[#f7fbff] font-sans text-[#101828]">
      <div className={`flex h-[11%] items-center border-b border-[#dce8f2] bg-white/95 ${mobile ? "justify-between px-[7%]" : "px-[6%]"}`}>
        <span className="flex items-center gap-1.5 font-bold tracking-[-0.04em]">
          <span className={`${mobile ? "size-[9px]" : "size-2"} rounded-full bg-linear-to-br from-[#17EAD9] to-[#6078EA]`} />
          <span className={mobile ? "text-[14px]" : "text-[0.65rem]"}>HUGO</span>
        </span>
        {mobile ? (
          <span className="flex flex-col gap-[5px]"><i className="h-[2px] w-[20px] rounded-full bg-[#101828]" /><i className="h-[2px] w-[20px] rounded-full bg-[#101828]" /></span>
        ) : (
          <div className="ml-auto flex items-center gap-5 text-[0.48rem] font-medium text-[#667085]">
            <span>Giới thiệu</span><span>Dịch vụ</span><span>Dự án</span><span>Liên hệ</span>
            <span className="rounded-full bg-[#101828] px-3 py-1.5 text-white">Bắt đầu</span>
          </div>
        )}
      </div>

      {index === 0 ? (
        <div className={`relative h-[89%] ${mobile ? "px-[7%] pt-[28px]" : "px-[7%] pt-[7%]"}`}>
          <div className={mobile ? "relative z-10" : "relative z-10 w-[52%]"}>
            <p className={`${mobile ? "text-[11px]" : "text-[0.52rem]"} font-bold tracking-[0.16em] text-[#2b91d3] uppercase`}>Landing page</p>
            <p className={`${mobile ? "mt-[12px] text-[32px]" : "mt-[3%] text-[2rem]"} leading-[0.98] font-bold tracking-[-0.06em]`}>Một trang.<br />Một mục tiêu.</p>
            <p className={`${mobile ? "mt-[16px] max-w-[84%] text-[13px] leading-[1.55]" : "mt-[4%] max-w-[78%] text-[0.58rem] leading-relaxed"} text-[#667085]`}>Giới thiệu ngắn gọn, tạo niềm tin và đưa khách đến hành động chính.</p>
            <span className={`${mobile ? "mt-[22px] px-[18px] py-[10px] text-[13px]" : "mt-[5%] px-4 py-2 text-[0.48rem]"} inline-block rounded-full bg-[#101828] font-semibold text-white`}>Khám phá ngay</span>
          </div>
          <motion.div initial={{ y: -180, rotate: -10, opacity: 0 }} animate={{ y: [0, -5, 0], rotate: [0, 2, 0], opacity: 1, rotateY: [-5, 6, -5] }} transition={{ y: { duration: 4, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 4, repeat: Infinity }, opacity: { duration: .5 }, rotateY: { duration: 4, repeat: Infinity } }} className={`${mobile ? "right-[-10%] top-[40%] size-[46%]" : "right-[8%] top-[9%] size-[42%]"} absolute rounded-[38%] border border-white/80 bg-linear-to-br from-[#dffffb] via-[#b8deff] to-[#a9b7ff] shadow-[0_25px_70px_rgb(76_181_231/.35),inset_8px_8px_20px_rgb(255_255_255/.7)] [transform-style:preserve-3d]`}>
            <img src="/image/avt1.png" alt="" className="absolute inset-x-[12%] bottom-0 h-[94%] w-[76%] object-contain drop-shadow-[0_12px_14px_rgb(30_55_110/.22)]" />
          </motion.div>
          {mobile ? null : [0, 1, 2, 3].map((piece) => <motion.span key={piece} animate={{ y: [0, 10, 0], rotate: [piece * 15, piece * 15 + 16, piece * 15] }} transition={{ duration: 2.2 + piece * .3, repeat: Infinity }} className="absolute h-[8%] w-[4%] rounded-full shadow-[inset_2px_2px_4px_rgb(255_255_255/.7)]" style={{ right: `${7 + piece * 9}%`, top: `${10 + (piece % 2) * 8}%`, background: vivid[piece] }} />)}
          <div className={`${mobile ? "inset-x-[7%] bottom-[26px] grid-cols-1 gap-[10px]" : "inset-x-[7%] bottom-[7%] grid-cols-3 gap-[3%]"} absolute grid`}>
            {["Lợi ích rõ ràng", "Bằng chứng thật", "Liên hệ tức thì"].map((item, itemIndex) => (
              <div key={item} className={`${mobile && itemIndex > 0 ? "hidden" : ""} ${mobile ? "rounded-2xl p-[16px]" : "rounded-lg p-[6%]"} border border-[#dce8f2] bg-white shadow-sm`}>
                <span className={`${mobile ? "h-[5px] w-[34px]" : "h-1.5 w-[28%]"} block rounded-full bg-[#35CFE1]`} />
                <span className={`${mobile ? "mt-[10px] text-[13px]" : "mt-[7%] text-[0.48rem]"} block font-semibold`}>{item}</span>
                <span className={`${mobile ? "mt-[8px] h-[4px] w-[70%]" : "mt-[5%] h-1 w-[72%]"} block rounded-full bg-[#d7e0e8]`} />
              </div>
            ))}
          </div>
        </div>
      ) : index === 1 ? (
        <div className={`h-[89%] ${mobile ? "px-[7%] pt-[24px]" : "px-[6%] pt-[5%]"}`}>
          <div className={mobile ? "" : "grid grid-cols-[.82fr_1.18fr] items-center gap-[7%]"}>
            <div>
              <p className={`${mobile ? "text-[11px]" : "text-[0.52rem]"} font-bold tracking-[0.16em] text-[#596fd7] uppercase`}>Website nhiều trang</p>
              <p className={`${mobile ? "mt-[12px] text-[28px]" : "mt-[4%] text-[1.7rem]"} leading-[1.04] font-bold tracking-[-0.055em]`}>Kể trọn câu chuyện thương hiệu.</p>
              <p className={`${mobile ? "mt-[14px] text-[13px] leading-[1.55]" : "mt-[5%] text-[0.56rem] leading-relaxed"} text-[#667085]`}>Mỗi trang đảm nhận một vai trò, cùng dẫn khách đến quyết định.</p>
            </div>
            <div className={`${mobile ? "mt-[20px] h-[140px] rounded-2xl p-[18px]" : "h-48 rounded-xl p-[6%]"} relative overflow-hidden bg-linear-to-br from-[#d9fbf7] via-[#ddecff] to-[#cfd5ff]`}>
              <span className="absolute -right-[8%] -bottom-[35%] size-[70%] rounded-full bg-[#6078EA]/75" />
              <span className="absolute right-[20%] top-[12%] size-[38%] rounded-full bg-[#17EAD9]/80" />
              <div className={`${mobile ? "inset-x-[7%] bottom-[12px] rounded-xl p-[14px]" : "inset-x-[8%] bottom-[10%] rounded-lg p-[6%]"} absolute bg-white/90 shadow-lg`}>
                <span className={`${mobile ? "h-[6px] w-[38%]" : "h-1.5 w-[36%]"} block rounded-full bg-[#101828]`} /><span className={`${mobile ? "mt-[8px] h-[4px] w-[70%]" : "mt-[5%] h-1 w-[72%]"} block rounded-full bg-[#b8c4d0]`} />
              </div>
            </div>
          </div>
          <div className={`${mobile ? "mt-[20px] grid-cols-2 gap-[10px]" : "mt-[5%] grid-cols-4 gap-[3%]"} grid`}>
            {["Giới thiệu", "Dịch vụ", "Dự án", "Liên hệ"].map((item) => (
              <div key={item} className={`${mobile ? "rounded-2xl p-[12px]" : "rounded-lg p-[8%]"} border border-[#dce8f2] bg-white shadow-sm`}>
                <span className="block aspect-[2/1] rounded-md bg-linear-to-br from-[#17EAD9]/50 to-[#6078EA]/55" />
                <span className={`${mobile ? "mt-[10px] text-[12px]" : "mt-[7%] text-[0.45rem]"} block font-semibold`}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      ) : index === 2 ? (
        <div className={`h-[89%] bg-[#f6f8fc] ${mobile ? "px-[7%] pt-[24px]" : "px-[6%] pt-[4%]"}`}>
          {mobile ? (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold tracking-[.12em] text-[#667085] uppercase">Hugo Flow+</p>
                <span className="rounded-full bg-[#101828] px-[14px] py-[7px] text-[12px] font-bold text-white">Giỏ · 2</span>
              </div>
              <p className="mt-[12px] text-[28px] leading-[1.04] font-bold tracking-[-0.055em]">Cửa hàng sẵn sàng bán.</p>
            </div>
          ) : (
            <div className="flex items-end justify-between">
              <div><p className="text-[0.48rem] font-semibold tracking-[.12em] text-[#667085] uppercase">Hugo Flow+</p><p className="text-[1.45rem] font-bold tracking-[-0.05em]">Cửa hàng sẵn sàng bán.</p></div>
              <span className="rounded-full bg-[#101828] px-3 py-2 text-[.72rem] font-bold text-white">Giỏ · 2</span>
            </div>
          )}
          <div className={`${mobile ? "mt-[20px] grid-cols-2 gap-[10px]" : "mt-[4%] grid-cols-[1fr_1fr_.85fr] gap-[3%]"} grid`}>
            {["Studio Tee", "Everyday Bag"].map((item, itemIndex) => (
              <div key={item} className={`${mobile ? "rounded-2xl p-[12px]" : "rounded-xl p-[5%]"} overflow-hidden border border-[#dce8f2] bg-white shadow-[0_12px_28px_rgb(38_68_120/.12)]`}>
                <span className={`block aspect-[1.5/1] rounded-lg ${itemIndex ? "bg-linear-to-br from-[#aebcff] to-[#6078EA]" : "bg-linear-to-br from-[#b8fff4] to-[#35CFE1]"}`} />
                <span className={`${mobile ? "mt-[10px] text-[13px]" : "mt-[6%] text-[.58rem]"} block font-bold`}>{item}</span>
                <span className={`${mobile ? "mt-[2px] block text-[11px]" : "text-[.44rem]"} text-[#667085]`}>Thêm vào giỏ</span>
              </div>
            ))}
            <div className={`${mobile ? "col-span-2 mt-[2px] rounded-2xl p-[16px]" : "rounded-xl p-[7%]"} bg-[#101828] text-white shadow-[0_16px_35px_rgb(16_24_40/.25)]`}>
              <p className={`${mobile ? "text-[14px]" : "text-[.62rem]"} font-bold`}>Thanh toán an toàn</p>
              <div className={`${mobile ? "mt-[12px] gap-[8px]" : "mt-[9%] gap-2"} flex`}>{["VISA", "QR", "PAY"].map((pay) => <span key={pay} className={`${mobile ? "rounded-md px-[10px] py-[5px] text-[10px]" : "rounded px-2 py-1 text-[.36rem]"} bg-white/12 font-bold`}>{pay}</span>)}</div>
              <span className={`${mobile ? "mt-[14px] py-[11px] text-[13px]" : "mt-[10%] py-[6%] text-[.42rem]"} block rounded-full bg-linear-to-r from-[#17EAD9] to-[#6078EA] text-center font-bold text-[#101828]`}>Hoàn tất đơn hàng</span>
            </div>
          </div>
        </div>
      ) : (
        progress ? <BioEduPreview progress={progress} /> : <div className="h-[89%] overflow-hidden"><BrutalismTheme bio={studentBioDemo} isPreview isOnline /></div>
      )}
    </div>
  );

  if (!mobile) return screen;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="relative h-[213.2%] w-[213.2%] origin-top-left scale-[0.469]">{screen}</div>
    </div>
  );
}

function BioEduPreview({ progress }: { progress: MotionValue<number> }) {
  const previewRef = useRef<HTMLDivElement>(null);

  useMotionValueEvent(progress, "change", (latest) => {
    const preview = previewRef.current?.querySelector("main");
    if (!preview) return;
    const localProgress = Math.min(1, Math.max(0, (latest - 0.77) / 0.2));
    preview.scrollTop = (preview.scrollHeight - preview.clientHeight) * localProgress;
  });

  return (
    <div ref={previewRef} className="h-[89%] overflow-hidden">
      <BrutalismTheme bio={studentBioDemo} isPreview isOnline />
    </div>
  );
}

function ManyPagesScene({ progress, isVietnamese, packageTitle }: { progress: MotionValue<number>; isVietnamese: boolean; packageTitle?: string }) {
  const opacity = useTransform(
    progress,
    packageTitle ? [0, 0.04, 0.245, 0.3] : [0.035, 0.085, 0.245, 0.3],
    packageTitle ? [0.55, 1, 1, 0] : [0, 1, 1, 0],
  );
  const titleY = useTransform(progress, [0.07, 0.14], [24, 0]);
  const titleScale = useTransform(progress, [0.07, 0.14], [0.78, 1]);

  return (
    <motion.div
      style={{ opacity }}
      className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_50%_5%,#34305f_0%,#11111a_43%,#07070a_100%)] [perspective:700px] [transform-style:preserve-3d]"
    >
      <div className="absolute inset-x-[10%] top-[10%] flex items-center justify-between text-[0.42rem] font-semibold tracking-[0.08em] text-white/55 uppercase">
        <svg viewBox="0 0 100 100" className="size-3 text-white/65" fill="currentColor">
          <path d="M47.43 8.25 A3 3 0 0 1 52.57 8.25 L75.68 46.48 A30 30 0 1 1 24.32 46.48 Z" />
        </svg>
        <span className="h-px w-[42%] bg-white/15" />
        <Globe2 className="size-3" />
      </div>
      <div className="absolute inset-x-0 top-[18%] h-[49%]">
        <PageCard progress={progress} index={0} className="left-[8%] top-[24%] -rotate-9" tone="bg-[#17EAD9]" />
        <PageCard progress={progress} index={1} className="right-[7%] top-[15%] rotate-8" tone="bg-[#6078EA]" />
        <PageCard progress={progress} index={2} className="left-[25%] top-[3%] rotate-1" tone="bg-[#4CB5E7]" featured />
        <PageCard progress={progress} index={3} className="left-[5%] top-[58%] rotate-6" tone="bg-[#35CFE1]" />
        <PageCard progress={progress} index={4} className="right-[5%] top-[56%] -rotate-7" tone="bg-[#7B8FF2]" />
      </div>
      <motion.div style={{ y: titleY, scale: titleScale }} className="absolute inset-x-[8%] bottom-[9%] text-center">
        <span className="mx-auto mb-2 flex size-8 items-center justify-center rounded-full bg-white text-black">
          <Layers3 className="size-4" />
        </span>
        <p className="text-[clamp(0.96rem,2.5vw,1.25rem)] leading-[1.02] font-semibold tracking-[-0.055em] text-white">
          {packageTitle || (isVietnamese ? "Website với nhiều trang." : "A website with many pages.")}
        </p>
        <p className="mt-1 text-[0.48rem] tracking-[0.08em] text-white/45 uppercase">
          About · Work · Services · Contact
        </p>
      </motion.div>
    </motion.div>
  );
}

function PageCard({
  progress,
  index,
  className,
  tone,
  featured = false,
}: {
  progress: MotionValue<number>;
  index: number;
  className: string;
  tone: string;
  featured?: boolean;
}) {
  const start = 0.045 + index * 0.012;
  const y = useSpring(useTransform(progress, [start, start + 0.09], [120 + index * 14, 0]), spring);
  const scale = useSpring(useTransform(progress, [start, start + 0.09], [0.42, 1]), spring);
  const rotateY = useTransform(progress, [start, start + 0.1], [46, 0]);

  return (
    <motion.div
      style={{ y, scale, rotateY, z: featured ? 44 : 18 + (index % 2) * 10, rotateX: featured ? -2 : index % 2 ? 4 : -4 }}
      className={`absolute h-[43%] w-[38%] rounded-[0.8rem] border border-white/20 bg-[#f7f7f8] p-[5%] shadow-[0_22px_48px_rgb(0_0_0/.58)] [transform-style:preserve-3d] ${className} ${featured ? "z-10" : ""}`}
    >
      <span className={`block h-[34%] rounded-[0.4rem] ${tone}`} />
      <span className="mt-[10%] block h-[5%] w-[78%] rounded-full bg-[#16161a]" />
      <span className="mt-[7%] block h-[4%] w-[55%] rounded-full bg-[#c8c8cc]" />
      <span className="mt-[14%] block h-[15%] rounded-[0.35rem] bg-[#e7e7ea]" />
    </motion.div>
  );
}

function LandingScene({
  progress,
  mergeLabel,
  isVietnamese,
  packageTitle,
}: {
  progress: MotionValue<number>;
  mergeLabel: string;
  isVietnamese: boolean;
  packageTitle?: string;
}) {
  const opacity = useTransform(progress, [0.26, 0.3, 0.59, 0.65], [0, 1, 1, 0]);
  const screenFlash = useTransform(progress, [0.28, 0.34, 1], [0.6, 0, 0]);

  return (
    <motion.div style={{ opacity }} className="absolute inset-0 overflow-hidden bg-[#f3f1eb] text-[#111114] [perspective:600px] [transform-style:preserve-3d]">
      <motion.div style={{ opacity: screenFlash }} className="absolute inset-0 z-40 bg-white" />
      <LandingPiece progress={progress} index={0} className="inset-x-[8%] top-[10%] h-[8%] rounded-full bg-white px-[8%] shadow-sm">
        <span className="h-[14%] w-[22%] rounded-full bg-black" />
        <Search className="size-[14%] text-black/55" />
      </LandingPiece>
      <LandingPiece progress={progress} index={1} className="inset-x-[7%] top-[21%] h-[31%] overflow-hidden rounded-[1.2rem] bg-[#6078EA] p-[9%] text-white">
        <div className="absolute -right-[18%] -bottom-[34%] size-[82%] rounded-full bg-[#17EAD9]" />
        <div className="absolute -right-[9%] top-[8%] size-[43%] rounded-full bg-[#4CB5E7] blur-sm" />
        <div className="relative z-10">
          <span className="block h-2 w-[28%] rounded-full bg-white/55" />
          <p className="mt-[12%] whitespace-pre-line text-[clamp(0.75rem,2vw,1rem)] leading-[0.98] font-bold tracking-[-0.055em]">
            {packageTitle || (isVietnamese ? "Một trang.\nĐủ nổi bật." : "One page.\nImpossible to miss.")}
          </p>
        </div>
      </LandingPiece>
      <LandingPiece progress={progress} index={2} className="left-[7%] top-[55%] h-[15%] w-[41%] rounded-[1rem] bg-[#35CFE1] p-[8%]">
        <Sparkles className="size-[36%] text-black" />
      </LandingPiece>
      <LandingPiece progress={progress} index={3} className="right-[7%] top-[55%] h-[15%] w-[41%] rounded-[1rem] bg-[#7B8FF2] p-[8%]">
        <span className="block h-[14%] w-[58%] rounded-full bg-black/80" />
        <span className="mt-[12%] block h-[10%] w-[78%] rounded-full bg-black/25" />
      </LandingPiece>
      <LandingPiece progress={progress} index={4} className="inset-x-[7%] top-[73%] h-[8%] rounded-full bg-black px-[9%] text-white shadow-lg">
        <span className="text-[0.48rem] font-semibold tracking-[0.05em] uppercase">{mergeLabel}</span>
        <MousePointer2 className="size-[13%] text-[#17EAD9]" fill="currentColor" />
      </LandingPiece>
      <LandingPiece progress={progress} index={5} className="left-[7%] top-[84%] h-[3%] w-[55%] rounded-full bg-black/12" />
      <LandingPiece progress={progress} index={6} className="right-[7%] top-[84%] h-[3%] w-[23%] rounded-full bg-[#6078EA]" />
    </motion.div>
  );
}

function LandingPiece({
  progress,
  index,
  className,
  children,
}: {
  progress: MotionValue<number>;
  index: number;
  className: string;
  children?: ReactNode;
}) {
  const start = 0.265 + index * 0.009;
  const y = useSpring(useTransform(progress, [start, start + 0.06, 0.57, 0.645], [-260 - index * 36, 0, 0, 170 + index * 42]), {
    stiffness: 185,
    damping: 20,
    mass: 0.5,
  });
  const rotate = useTransform(progress, [start, start + 0.06, 0.57, 0.645], [index % 2 ? 12 : -11, 0, 0, index % 2 ? 24 : -22]);
  const scale = useTransform(progress, [start, start + 0.055, 0.59, 0.65], [0.72, 1, 1, 0.65]);
  const opacity = useTransform(progress, [start, start + 0.018, 0.6, 0.65], [0, 1, 1, 0]);

  return (
    <motion.div
      style={{ y, rotate, scale, opacity, z: 12 + index * 5, rotateX: index % 2 ? 2 : -2 }}
      className={`absolute flex items-center justify-between shadow-[0_12px_30px_rgb(0_0_0/.12)] [transform-style:preserve-3d] ${className}`}
    >
      {children}
    </motion.div>
  );
}

const fragmentData = Array.from({ length: 14 }, (_, index) => {
  const angle = (index / 14) * Math.PI * 2 - Math.PI / 2;
  const radius = index % 2 === 0 ? 180 : 150;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    rotate: (index / 14) * 360,
  };
});

function MorphFragments({ progress }: { progress: MotionValue<number> }) {
  const flashOpacity = useTransform(progress, [0.59, 0.625, 0.69], [0, 0.5, 0]);
  const flashScale = useTransform(progress, [0.59, 0.68], [0.1, 2.4]);

  return (
    <div className="pointer-events-none absolute inset-0 z-25">
      <motion.span
        style={{ opacity: flashOpacity, scale: flashScale }}
        className="absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4CB5E7] blur-3xl dark:bg-[#6078EA]"
      />
      {fragmentData.map((item, index) => (
        <MorphFragment key={index} progress={progress} index={index} {...item} />
      ))}
    </div>
  );
}

function MorphFragment({
  progress,
  index,
  x: targetX,
  y: targetY,
  rotate: targetRotate,
}: {
  progress: MotionValue<number>;
  index: number;
  x: number;
  y: number;
  rotate: number;
}) {
  const delay = (index % 4) * 0.006;
  const x = useSpring(useTransform(progress, [0.585 + delay, 0.69, 0.755], [0, targetX, targetX * 1.03]), spring);
  const y = useSpring(useTransform(progress, [0.585 + delay, 0.69, 0.755], [0, targetY, targetY * 1.03]), spring);
  const rotate = useTransform(progress, [0.585 + delay, 0.7], [0, targetRotate + 90]);
  const scale = useTransform(progress, [0.58 + delay, 0.62, 0.71, 0.78], [0, 1, 0.5, 0]);
  const opacity = useTransform(progress, [0.58 + delay, 0.615, 0.72, 0.78], [0, 1, 0.8, 0]);

  return (
    <motion.span
      style={{ x, y, rotate, scale, opacity, background: vivid[index % vivid.length] }}
      className="absolute left-1/2 top-1/2 h-14 w-8 -translate-x-1/2 -translate-y-1/2 rounded-xl shadow-[0_12px_32px_rgb(0_0_0/.35),inset_0_1px_1px_rgb(255_255_255/.35)] sm:h-16 sm:w-9"
    />
  );
}

function PerformanceWatch({ progress, speedUnit }: { progress: MotionValue<number>; speedUnit: string }) {
  const [score, setScore] = useState(0);
  const ringLength = useTransform(progress, [0.65, 0.82], [0, 1]);
  const glowOpacity = useTransform(progress, [0.65, 0.77, 0.85, 1], [0.1, 0.55, 0.9, 0.9]);
  const scoreScale = useSpring(useTransform(progress, [0.65, 0.82], [0.65, 1]), {
    stiffness: 220,
    damping: 18,
    mass: 0.45,
  });

  useMotionValueEvent(progress, "change", (latest) => {
    const normalized = Math.min(Math.max((latest - 0.655) / 0.17, 0), 1);
    setScore(Math.round(normalized * 100));
  });

  return (
    <div className="relative size-[min(67vw,25rem)] [transform:perspective(1100px)_rotateX(3deg)_rotateY(-4deg)] [transform-style:preserve-3d]">
      <motion.div
        style={{ opacity: glowOpacity }}
        className="absolute -inset-[12%] rounded-full bg-[conic-gradient(from_45deg,#17EAD9,#35CFE1,#4CB5E7,#6078EA,#7B8FF2,#6078EA,#17EAD9)] blur-[65px]"
      />
      <div className="absolute inset-0 rounded-[30%] bg-linear-to-br from-white via-[#b9bbc0] to-[#55575c] p-[5px] shadow-[0_55px_100px_-35px_rgb(0_0_0/.55),inset_2px_2px_3px_rgb(255_255_255/.95)] dark:shadow-[0_55px_100px_-35px_rgb(0_0_0/.9),inset_2px_2px_3px_rgb(255_255_255/.95)]">
        <div className="relative size-full overflow-hidden rounded-[28%] bg-[#08080a] shadow-[inset_0_0_0_1px_rgb(255_255_255/.1)]">
          <span className="pointer-events-none absolute inset-[2%] z-40 rounded-[27%] bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,.2),transparent_32%)]" />
          <svg viewBox="0 0 240 240" className="absolute inset-[8%] size-[84%] -rotate-90 overflow-visible">
            <circle cx="120" cy="120" r="96" fill="none" stroke="rgba(255,255,255,.09)" strokeWidth="12" />
            <motion.circle
              cx="120"
              cy="120"
              r="96"
              fill="none"
              stroke="url(#watch-ring)"
              strokeWidth="12"
              strokeLinecap="round"
              pathLength="1"
              style={{ pathLength: ringLength }}
            />
            <defs>
              <linearGradient id="watch-ring" x1="0" y1="0" x2="240" y2="240">
                <stop stopColor="#17EAD9" />
                <stop offset="0.5" stopColor="#4CB5E7" />
                <stop offset="1" stopColor="#6078EA" />
              </linearGradient>
            </defs>
          </svg>
          {Array.from({ length: 12 }, (_, index) => (
            <span
              key={index}
              className="absolute inset-[4%]"
              style={{ transform: `rotate(${index * 30}deg)` }}
            >
              <span
                className="absolute left-1/2 top-0 h-[4%] w-[2px] -translate-x-1/2 rounded-full"
                style={{ background: vivid[index % vivid.length] }}
              />
            </span>
          ))}
          <motion.div style={{ scale: scoreScale }} className="absolute inset-0 flex flex-col items-center justify-center pt-[2%]">
            <span className="text-[clamp(3rem,12vw,6rem)] leading-none font-semibold tracking-[-0.085em] text-white tabular-nums">
              {score}
            </span>
            <span className="mt-2 max-w-[62%] text-center font-mono text-[clamp(0.5rem,1.4vw,0.72rem)] font-medium tracking-[0.12em] text-white/45 uppercase">
              {speedUnit}
            </span>
          </motion.div>
        </div>
      </div>
      <span className="absolute -right-[3.6%] top-[28%] h-[17%] w-[4%] rounded-r-lg bg-linear-to-b from-white to-[#74767a] shadow-lg" />
    </div>
  );
}

const seoParticles = Array.from({ length: 20 }, (_, index) => {
  const angle = (index / 20) * Math.PI * 2;
  const radius = 165 + (index % 4) * 42;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, rotate: index * 39 };
});

function SeoBurstParticles({ progress }: { progress: MotionValue<number> }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-35">
      {seoParticles.map((particle, index) => <SeoParticle key={index} progress={progress} particle={particle} index={index} />)}
    </div>
  );
}

function SeoParticle({ progress, particle, index }: { progress: MotionValue<number>; particle: (typeof seoParticles)[number]; index: number }) {
  const delay = (index % 5) * 0.003;
  const x = useSpring(useTransform(progress, [0.835 + delay, 0.925], [0, particle.x]), spring);
  const y = useSpring(useTransform(progress, [0.835 + delay, 0.925], [0, particle.y]), spring);
  const rotate = useTransform(progress, [0.835 + delay, 0.925], [0, particle.rotate]);
  const scale = useTransform(progress, [0.83 + delay, 0.865, 0.94, 0.98], [0, 1, 0.75, 0]);
  const opacity = useTransform(progress, [0.83 + delay, 0.855, 0.945, 0.98], [0, 1, 0.82, 0]);

  return (
    <motion.span
      style={{ x, y, rotate, scale, opacity, background: vivid[index % vivid.length] }}
      className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${index % 4 === 0 ? "size-3 rounded-full" : "h-8 w-2.5 rounded-full"}`}
    />
  );
}

function SeoFinale({ progress, lines }: { progress: MotionValue<number>; lines: [string, string] }) {
  const opacity = useTransform(progress, [0.89, 0.94, 1], [0, 1, 1]);
  const y = useTransform(progress, [0.89, 0.95], [42, 0]);
  const tracking = useTransform(progress, [0.89, 0.95], ["0.08em", "-0.075em"]);

  return (
    <div className="absolute inset-x-4 top-[45%] z-40 -translate-y-1/2 text-center font-semibold">
      <motion.div style={{ opacity, y, letterSpacing: tracking }}>
        <span className="block text-[clamp(2.6rem,7vw,5.5rem)] leading-[1.05] text-foreground">{lines[0]}</span>
        <span className="mt-2 block bg-[linear-gradient(105deg,#17EAD9_0%,#35CFE1_35%,#4CB5E7_62%,#6078EA_100%)] bg-clip-text text-[clamp(5.75rem,20vw,14rem)] leading-[0.74] text-transparent">
          {lines[1]}
        </span>
        <span className="mx-auto mt-7 flex w-fit items-center gap-2 font-mono text-[0.62rem] tracking-[0.16em] text-foreground/50 uppercase">
          <span className="size-1.5 animate-pulse rounded-full bg-[#17EAD9]" />
          Search ready
        </span>
      </motion.div>
    </div>
  );
}

function ChapterCopy({
  chapter,
  index,
  progress,
  early,
  total,
}: {
  chapter: Chapter;
  index: number;
  progress: MotionValue<number>;
  early: boolean;
  total: number;
}) {
  const ranges = early && total === 4 ? [
    [0.07, 0.105, 0.205, 0.245],
    [0.225, 0.275, 0.43, 0.475],
    [0.455, 0.51, 0.69, 0.735],
    [0.715, 0.77, 0.99, 1],
  ] : [
    early ? [0, 0.02, 0.245, 0.29] : [0.13, 0.18, 0.245, 0.29],
    [0.29, 0.335, 0.57, 0.625],
    early ? [0.64, 0.69, 0.99, 1] : [0.64, 0.69, 0.82, 0.865],
  ];
  const [a, b, c, d] = ranges[index];
  const staysVisible = early && index === total - 1;
  const opacity = useTransform(progress, [a, b, c, d], staysVisible ? [0, 1, 1, 1] : [0, 1, 1, 0]);
  const y = useTransform(progress, [a, b, c, d], staysVisible ? [16, 0, 0, 0] : [16, 0, 0, -14]);
  const pointerEvents = useTransform(opacity, (value) => (value > 0.02 ? "auto" : "none"));

  return (
    <motion.div style={{ opacity, y, pointerEvents }} className={`absolute inset-0 ${early ? "flex flex-col justify-center" : ""}`}>
      <p className="font-mono text-[0.66rem] font-medium tracking-[0.16em] text-foreground/50 uppercase sm:text-xs">
        {early && index === 2 ? <>03 · Hugo <span className="bg-linear-to-r from-[#17EAD9] via-[#4CB5E7] to-[#6078EA] bg-clip-text text-transparent">Flow+</span></> : chapter.eyebrow}
      </p>
      <h3 className={`${early ? "mt-3 text-[clamp(1.75rem,2.65vw,3.15rem)] leading-[1.02] tracking-[-0.055em]" : "mt-1.5 text-[clamp(1.08rem,0.9rem+0.85vw,1.65rem)] leading-tight tracking-[-0.035em]"} font-semibold text-foreground`}>
        {chapter.title}
      </h3>
      <p className={`${early ? "mt-5 max-w-md text-base leading-7" : "mx-auto mt-1.5 max-w-xl text-sm leading-relaxed"} hidden text-foreground/60 sm:block`}>
        {chapter.description}
      </p>
      {chapter.features?.length ? (
        <ul className={`${early ? "mt-6 grid-cols-2 gap-x-4 gap-y-3 rounded-[1.5rem] px-5 py-4" : "mx-auto mt-3 max-w-4xl grid-cols-3 gap-x-5 gap-y-1.5 rounded-2xl px-5 py-2.5"} grid border border-foreground/10 bg-background/55 text-left backdrop-blur-md`}>
          {chapter.features.map((feature) => (
            <li key={feature} className={`${early ? "text-[0.78rem] leading-5" : "text-[0.72rem]"} flex items-center gap-2 font-medium text-foreground/60`}>
              <span className="size-1.5 rounded-full bg-[#35CFE1]" />
              {feature}
            </li>
          ))}
        </ul>
      ) : null}
      {chapter.href ? (
        <div className={`${early ? "mt-5 justify-start" : "mt-2 justify-center"} flex gap-2`}>
          <Link href={chapter.href} className="rounded-full bg-foreground px-3.5 py-2 text-[0.68rem] font-semibold text-background">{chapter.actionLabel || "Xem chi tiết"}</Link>
          {chapter.demoHref ? <Link href={chapter.demoHref} className="rounded-full border border-foreground/15 bg-background/70 px-3.5 py-2 text-[0.68rem] font-semibold backdrop-blur-md">{chapter.demoLabel || "Mở Bio của bạn"}</Link> : null}
        </div>
      ) : null}
    </motion.div>
  );
}

function ProgressRail({ labels, progress }: { labels: string[]; progress: MotionValue<number> }) {
  const width = useTransform(progress, [0, 1], ["0%", "100%"]);
  const visibleLabels = labels.slice(0, 4);

  return (
    <div className="w-full max-w-[30rem] sm:w-[min(50vw,30rem)]">
      <div className="relative h-px overflow-hidden bg-foreground/15">
        <motion.span
          style={{ width }}
          className="absolute inset-y-0 left-0 bg-linear-to-r from-[#17EAD9] via-[#4CB5E7] to-[#6078EA]"
        />
      </div>
      <div className="mt-2 grid gap-3 text-[0.6rem] font-medium text-foreground/50 sm:text-[0.68rem]" style={{ gridTemplateColumns: `repeat(${visibleLabels.length}, minmax(0, 1fr))` }}>
        {visibleLabels.map((label, index) => (
          <span key={label} className={index === 0 ? "" : index === visibleLabels.length - 1 ? "text-right" : "text-center"}>
            {index === 2 ? <span className="bg-linear-to-r from-[#17EAD9] to-[#6078EA] bg-clip-text text-transparent">{label}</span> : label}
          </span>
        ))}
      </div>
    </div>
  );
}
