import { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarCheck, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useScroll, useMotionValueEvent } from "motion/react";
import Aura from "../../components/public/hwagfu/Aura";
import FloatingOrbs from "../../components/public/hwagfu/FloatingOrbs";
import HeroScrollFx from "../../components/public/hwagfu/HeroScrollFx";
import RainbowText from "../../components/public/hwagfu/RainbowText";
import ServicesStory from "../../components/public/hwagfu/ServicesStory";
import CinematicAtmosphere from "../../components/public/cine/CinematicAtmosphere";
import { syncScrollFilmBeat, playHapticTick } from "../../utils/CinematicSoundEngine";
import "../../components/public/hwagfu/hwagfu.css";
import { servicePackages } from "../../data/servicePackages";
import { projects } from "../../data/projects";
import { PUBLIC_TOOLS } from "../../config/publicTools";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useJsonLd } from "../../hooks/useJsonLd";

/**
 * Chữ nghĩa của cả trang nằm trong `servicePkg.page.*` và `servicePkg.items.*`
 * (vi/en/zh). Trang này chỉ dựng hình — thêm ngôn ngữ là thêm một tệp locale,
 * không phải sửa JSX.
 */
function useChapters() {
  const { t } = useTranslation();
  return servicePackages.map((pkg) => ({
    eyebrow: pkg.eyebrow,
    title: t(`servicePkg.items.${pkg.id}.title`),
    description: t(`servicePkg.items.${pkg.id}.lede`),
    features: t(`servicePkg.items.${pkg.id}.features`, { returnObjects: true }),
    href: pkg.freeTier ? "/student-pricing" : `/services/${pkg.slug}`,
    actionLabel: t("servicePkg.page.detailCta"),
    price: (() => {
      const p = t(`servicePkg.items.${pkg.id}.price`, { returnObjects: true });
      return p.to ? `${p.from} – ${p.to}` : p.from;
    })(),
    ...(pkg.freeTier
      ? { demoHref: "/member", demoLabel: t("servicePkg.page.demoCta"), actionLabel: t("servicePkg.page.eduAction") }
      : {}),
  }));
}

/**
 * Nhãn nhỏ đầu mỗi phần. Chữ lấy từ i18n — trang bán hàng không dán nhãn hậu
 * trường kiểu số hiệu cảnh quay: khách không đọc thứ đó, và chữ cứng tiếng
 * Anh thì chín ngôn ngữ còn lại không dịch được.
 */
function Kicker({ children, className = "" }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-[0.72rem] font-semibold tracking-[0.14em] text-[#00f0ff] backdrop-blur-md dark:bg-black/30 ${className}`}>
      <span className="size-1.5 rounded-full bg-[#00f0ff]" />
      <span>{children}</span>
    </div>
  );
}

function Hero() {
  const { t } = useTranslation();
  return (
    <section className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden px-5 py-24 sm:px-8 sm:py-32">
      <Aura />
      <FloatingOrbs />
      <HeroScrollFx className="relative z-10 mx-auto flex max-w-6xl flex-col items-center text-center">
        <Kicker className="animate-rise mb-6">{t("servicePkg.page.heroKicker")}</Kicker>

        <h1 className="headline-hero text-foreground">
          <span className="animate-rise block">{t("servicePkg.page.heroLine1")}</span>
          <span className="animate-rise block" style={{ animationDelay: "110ms" }}>{t("servicePkg.page.heroLine2")}</span>
          <span className="animate-rise block" style={{ animationDelay: "220ms" }}><RainbowText>{t("servicePkg.page.heroLine3")}</RainbowText></span>
        </h1>
        <p className="animate-rise lede mt-7 max-w-3xl" style={{ animationDelay: "360ms" }}>
          {t("servicePkg.page.heroLede")}
        </p>
        <div className="animate-rise mt-10 flex flex-col items-center gap-3 sm:flex-row" style={{ animationDelay: "470ms" }}>
          <Link
            to="/booking"
            onClick={() => playHapticTick()}
            className="btn-primary"
          >
            {t("servicePkg.page.heroCta")} <CalendarCheck size={17} />
          </Link>
          <Link
            to="/project"
            onClick={() => playHapticTick()}
            className="btn-secondary"
          >
            {t("servicePkg.page.heroCtaAlt")} <ArrowRight size={17} className="text-[#00f0ff]" />
          </Link>
        </div>
        <span className="animate-rise mt-14 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[.18em] text-muted-foreground/70" style={{ animationDelay: "580ms" }}>
          {t("servicePkg.page.scrollHint")} <span className="material-symbols-outlined text-base text-[#00f0ff]">south</span>
        </span>
      </HeroScrollFx>
    </section>
  );
}

/**
 * Dải bằng chứng, đặt ngay dưới màn hình đầu.
 *
 * Hai con số ĐẾM TỪ MÃ NGUỒN (`projects`, `PUBLIC_TOOLS`) chứ không gõ tay:
 * thêm một dự án là trang tự cập nhật, và không bao giờ có chuyện quảng cáo
 * một con số không còn đúng. Đây là toàn bộ bằng chứng thật đang có — không
 * bịa lời chứng thực, không bịa số khách hàng.
 */
const PROOF_ICONS = ["folder_open", "apps", "code_blocks"];

function Proof() {
  const { t } = useTranslation();
  const items = t("servicePkg.page.proof", {
    returnObjects: true,
    projects: projects.length,
    tools: Object.keys(PUBLIC_TOOLS).length,
  });

  return (
    <section className="relative isolate bg-band px-5 py-16 sm:px-8 sm:py-20 border-t border-border/40">
      <div className="mx-auto max-w-6xl">
        <h2 className="sr-only">{t("servicePkg.page.proofTitle")}</h2>
        <dl className="grid gap-px overflow-hidden rounded-[1.5rem] border border-border bg-border sm:grid-cols-3">
          {items.map((item, i) => (
            <div key={item.value} className="bg-card p-6 sm:p-7">
              <span aria-hidden className="material-symbols-outlined grid size-11 place-items-center rounded-full bg-muted text-[22px] text-foreground">
                {PROOF_ICONS[i]}
              </span>
              <dt className="mt-4 text-[clamp(1.15rem,.9rem+.8vw,1.6rem)] leading-tight font-semibold tracking-[-.03em]">{item.value}</dt>
              <dd className="mt-2 text-sm leading-6 text-muted-foreground">{item.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function LandingFocus() {
  const { t } = useTranslation();
  const points = t("servicePkg.page.landingPoints", { returnObjects: true });

  return (
    <section className="relative isolate bg-background px-5 py-24 sm:px-8 sm:py-36 border-t border-border/40">
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
        <div>
          <Kicker className="mb-4">{t("servicePkg.page.landingKicker")}</Kicker>
          <h2 className="headline-section mt-3 max-w-4xl">
            {t("servicePkg.page.landingTitle1")}
            <span className="headline-quiet block mt-1">{t("servicePkg.page.landingTitle2")}</span>
          </h2>
          <p className="lede mt-7 max-w-2xl">
            {t("servicePkg.page.landingLede")}
          </p>
        </div>
        <ul className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-lg p-6 shadow-xl space-y-2">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-3 py-3 text-sm leading-6 text-foreground/80 border-b border-border/40 last:border-b-0">
              <Check className="mt-1 size-4 shrink-0 text-[#00f0ff]" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Process() {
  const { t } = useTranslation();
  const steps = t("servicePkg.page.process", { returnObjects: true });
  return (
    <section className="relative isolate bg-band px-5 py-24 sm:px-8 sm:py-36 border-t border-border/40">
      <div className="mx-auto max-w-6xl">
        <Kicker className="mb-4">{t("servicePkg.page.processKicker")}</Kicker>
        <h2 className="headline-section mt-3 max-w-3xl">{t("servicePkg.page.processTitle")}</h2>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {steps.map(({ title, body }, i) => (
            <div
              key={title}
              className="group relative rounded-2xl border border-border/60 bg-card/40 p-7 backdrop-blur-md transition-all duration-300 hover:border-[#00f0ff]/40 hover:shadow-[0_0_30px_rgba(0,240,255,0.08)]"
            >
              <span className="text-xs font-bold tracking-[0.16em] text-[#00f0ff]">
                {t("servicePkg.page.stepLabel", { n: i + 1 })}
              </span>
              <h3 className="mt-4 text-xl font-bold tracking-tight text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Closing() {
  const { t } = useTranslation();
  return (
    <section className="relative isolate overflow-hidden bg-background px-5 py-28 text-center sm:px-8 sm:py-40 border-t border-border/40">
      <Aura />
      <div className="relative z-10 mx-auto max-w-5xl">
        <Kicker className="mb-6">{t("servicePkg.page.closingKicker")}</Kicker>
        <h2 className="headline-hero mt-3">
          {t("servicePkg.page.closingTitle1")}
          <span className="block text-[#00f0ff] [text-shadow:0_0_24px_rgba(0,240,255,0.45)]">
            {t("servicePkg.page.closingTitle2")}
          </span>
        </h2>
        <p className="lede mx-auto mt-7 max-w-2xl">{t("servicePkg.page.closingLede")}</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/booking"
            onClick={() => playHapticTick()}
            className="btn-primary"
          >
            {t("servicePkg.page.closingCta")} <ArrowRight size={17} />
          </Link>
          <Link
            to="/project"
            onClick={() => playHapticTick()}
            className="btn-secondary"
          >
            {t("servicePkg.page.closingCtaAlt")}
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function ServicesPage() {
  const { t } = useTranslation();
  const chapters = useChapters();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    syncScrollFilmBeat(latest, [0.15, 0.45, 0.72, 0.9]);
  });

  useHeadMeta({ title: t("servicesPage.meta.title"), description: t("servicesPage.meta.description"), keywords: t("servicesPage.meta.keywords"), canonicalUrl: "https://www.hugowishpax.studio/services" });
  useJsonLd("services-schema", useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "Service",
    name: t("servicePkg.page.schemaName"),
    provider: { "@type": "Organization", name: "Hugo Studio", url: "https://www.hugowishpax.studio" },
    areaServed: { "@type": "Country", name: "Vietnam" },
    url: "https://www.hugowishpax.studio/services",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: t("servicePkg.page.catalogName"),
      itemListElement: chapters.map((chapter) => ({
        "@type": "Offer",
        name: chapter.title,
        description: `${chapter.description} ${t("servicePkg.page.catalogIncludes")}: ${chapter.features.join(", ")}.`,
      })),
    },
  }), [chapters, t]));

  return (
    <div ref={containerRef} className="hwagfu-copy relative">
      <CinematicAtmosphere />
      <Hero />
      <Proof />
      <ServicesStory
        standalone
        label={t("servicePkg.page.filmLabel")}
        heading={t("servicePkg.page.filmHeading")}
        chapters={chapters}
        progressLabels={["Hugo One", "Hugo Story", "Hugo Flow+", "Hugo Edu+"]}
        speedUnit={t("intro.story.services.speedUnit")}
        mergeLabel="Hugo Story"
        seoBurst={["HUGO", "FLOW"]}
        cta={t("servicePkg.page.filmCta")}
        ctaHref="/booking"
      />
      <LandingFocus />
      <Process />
      <Closing />
    </div>
  );
}
