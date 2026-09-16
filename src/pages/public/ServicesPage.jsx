import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarCheck, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import Aura from "../../components/public/hwagfu/Aura";
import FloatingOrbs from "../../components/public/hwagfu/FloatingOrbs";
import HeroScrollFx from "../../components/public/hwagfu/HeroScrollFx";
import RainbowText from "../../components/public/hwagfu/RainbowText";
import ServicesStory from "../../components/public/hwagfu/ServicesStory";
import "../../components/public/hwagfu/hwagfu.css";
import { servicePackages } from "../../data/servicePackages";
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
    ...(pkg.freeTier
      ? { demoHref: "/member", demoLabel: t("servicePkg.page.demoCta"), actionLabel: t("servicePkg.page.eduAction") }
      : {}),
  }));
}

function Hero() {
  const { t } = useTranslation();
  return (
    <section className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden px-5 py-24 sm:px-8 sm:py-32">
      <Aura />
      <FloatingOrbs />
      <HeroScrollFx className="relative z-10 mx-auto flex max-w-6xl flex-col items-center text-center">
        <p className="animate-rise kicker text-hue-blue">{t("servicePkg.page.heroKicker")}</p>
        <h1 className="headline-hero mt-4 text-foreground">
          <span className="animate-rise block">{t("servicePkg.page.heroLine1")}</span>
          <span className="animate-rise block" style={{ animationDelay: "110ms" }}>{t("servicePkg.page.heroLine2")}</span>
          <span className="animate-rise block" style={{ animationDelay: "220ms" }}><RainbowText>{t("servicePkg.page.heroLine3")}</RainbowText></span>
        </h1>
        <p className="animate-rise lede mt-7 max-w-3xl" style={{ animationDelay: "360ms" }}>
          {t("servicePkg.page.heroLede")}
        </p>
        <div className="animate-rise mt-10 flex flex-col items-center gap-3 sm:flex-row" style={{ animationDelay: "470ms" }}>
          <Link to="/booking" className="btn-primary">{t("servicePkg.page.heroCta")} <CalendarCheck size={17} /></Link>
          <Link to="/project" className="btn-secondary">{t("servicePkg.page.heroCtaAlt")} <ArrowRight size={17} /></Link>
        </div>
        <span className="animate-rise mt-14 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[.16em] text-muted-foreground" style={{ animationDelay: "580ms" }}>
          {t("servicePkg.page.scrollHint")} <span className="material-symbols-outlined text-base">south</span>
        </span>
      </HeroScrollFx>
    </section>
  );
}

function LandingFocus() {
  const { t } = useTranslation();
  const points = t("servicePkg.page.landingPoints", { returnObjects: true });

  return (
    <section className="bg-background px-5 py-24 sm:px-8 sm:py-36">
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
        <div>
          <p className="kicker text-hue-blue">{t("servicePkg.page.landingKicker")}</p>
          <h2 className="headline-section mt-3 max-w-4xl">
            {t("servicePkg.page.landingTitle1")}
            <span className="headline-quiet block">{t("servicePkg.page.landingTitle2")}</span>
          </h2>
          <p className="lede mt-7 max-w-2xl">
            {t("servicePkg.page.landingLede")}
          </p>
        </div>
        <ul className="border-t border-border">
          {points.map((point) => (
            <li key={point} className="flex gap-3 border-b border-border py-5 text-sm leading-6 text-foreground/75">
              <Check className="mt-1 size-4 shrink-0 text-hue-blue" /> {point}
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
    <section className="bg-band px-5 py-24 sm:px-8 sm:py-36">
      <div className="mx-auto max-w-6xl">
        <p className="kicker text-hue-blue">{t("servicePkg.page.processKicker")}</p>
        <h2 className="headline-section mt-3 max-w-3xl">{t("servicePkg.page.processTitle")}</h2>
        <div className="mt-14 border-t border-border">
          {steps.map(({ title, body }, i) => (
            <div key={title} className="grid gap-4 border-b border-border py-7 sm:grid-cols-[4rem_1fr_1.2fr] sm:items-start sm:gap-8">
              <span className="font-mono text-xs tracking-[.16em] text-hue-blue">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="text-xl font-semibold tracking-[-.02em]">{title}</h3>
              <p className="text-sm leading-7 text-muted-foreground">{body}</p>
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
    <section className="relative isolate overflow-hidden bg-background px-5 py-28 text-center sm:px-8 sm:py-40">
      <Aura />
      <div className="relative z-10 mx-auto max-w-5xl">
        <p className="kicker text-hue-blue">{t("servicePkg.page.closingKicker")}</p>
        <h2 className="headline-hero mt-3">{t("servicePkg.page.closingTitle1")}<span className="block"><RainbowText>{t("servicePkg.page.closingTitle2")}</RainbowText></span></h2>
        <p className="lede mx-auto mt-7 max-w-2xl">{t("servicePkg.page.closingLede")}</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/booking" className="btn-primary">{t("servicePkg.page.closingCta")} <ArrowRight size={17} /></Link>
          <Link to="/project" className="btn-secondary">{t("servicePkg.page.closingCtaAlt")}</Link>
        </div>
      </div>
    </section>
  );
}

export default function ServicesPage() {
  const { t } = useTranslation();
  const chapters = useChapters();
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
    <div className="hwagfu-copy">
      <Hero />
      <ServicesStory
        standalone
        label={t("servicePkg.page.filmLabel")}
        heading={t("servicePkg.page.filmHeading")}
        chapters={chapters}
        progressLabels={["Hugo One", "Hugo Story", "Hugo Flow+", "Hugo Edu+"]}
        // Chuỗi này là CỜ NHẬN DẠNG NGÔN NGỮ bên trong ServicesStory
        // (`isVietnamese = speedUnit === "điểm hiệu năng"`), chỉ có tác dụng ở
        // các cảnh của trang giới thiệu. Dịch nó ra là tắt nhầm một nhánh.
        speedUnit="điểm hiệu năng"
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
