import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import PackageName from "../../components/brand/PackageName";
import ServicesStory from "../../components/public/hwagfu/ServicesStory";
import { servicePackages } from "../../data/servicePackages";
import { projects } from "../../data/projects";
import { PUBLIC_TOOLS } from "../../config/publicTools";
import { STUDIO_SOCIAL_LINKS } from "../../config/studioSocialLinks";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useJsonLd } from "../../hooks/useJsonLd";
import { formatServicePrice } from "../../utils/servicePrice";
import "../../components/public/hwagfu/hwagfu.css";
import "./services-editorial.css";

const OBJ = { returnObjects: true };

function useServices() {
  const { t, i18n } = useTranslation();
  return servicePackages.map((pkg) => {
    const price = t(`servicePkg.items.${pkg.id}.price`, OBJ);
    return {
      ...pkg,
      title: t(`servicePkg.items.${pkg.id}.title`),
      description: t(`servicePkg.items.${pkg.id}.lede`),
      features: t(`servicePkg.items.${pkg.id}.features`, OBJ),
      price: formatServicePrice(price, i18n.resolvedLanguage),
      priceLabel: pkg.freeTier ? "" : t("servicePkg.page.startingPriceLabel"),
      href: pkg.freeTier ? "/student-pricing" : `/services/${pkg.slug}`,
      actionLabel: pkg.freeTier ? t("servicePkg.page.eduAction") : t("servicePkg.page.detailCta"),
      ...(pkg.freeTier ? { demoHref: "/member", demoLabel: t("servicePkg.page.demoCta") } : {}),
    };
  });
}

function SectionMarker({ number, children, light = false }) {
  return (
    <p className={`services-marker${light ? " services-marker--light" : ""}`}>
      <span>{number}</span>
      {children}
    </p>
  );
}

function ServiceCard({ service, index }) {
  const { t } = useTranslation();
  return (
    <article className="services-package">
      <div className="services-package__number" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </div>
      <div className="services-package__body">
        <PackageName id={service.id} size="lg" dot={false} />
        <h3>{service.title}</h3>
        <p>{service.description}</p>
        <ul aria-label={t("servicePkg.page.catalogIncludes")}>
          {service.features.slice(0, 3).map((feature) => (
            <li key={feature}><Check aria-hidden="true" />{feature}</li>
          ))}
        </ul>
      </div>
      <div className="services-package__action">
        <p className="services-package__price-label">
          {service.freeTier ? t("servicePkg.page.eduAction") : t("servicePkg.page.startingPriceLabel")}
        </p>
        <p className="services-package__price">{service.price}</p>
        <Link to={service.href}>
          {t("servicePkg.page.detailCta")} <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function SocialSection() {
  const { t } = useTranslation();
  return (
    <section className="services-social" aria-labelledby="services-social-title">
      <div className="services-shell services-social__inner">
        <div>
          <SectionMarker number="04" light>{t("servicePkg.page.socialLinks")}</SectionMarker>
          <h2 id="services-social-title">{t("servicePkg.page.socialTitle1")}<br />{t("servicePkg.page.socialTitle2")}</h2>
        </div>
        <nav aria-label={t("servicePkg.page.socialLinks")} className="services-social__links">
          {STUDIO_SOCIAL_LINKS.map(({ labelKey, fallbackLabel, href }) => (
            <a key={labelKey} href={href} target="_blank" rel="noopener noreferrer">
              <span>{t(`servicePkg.page.${labelKey}`, fallbackLabel)}</span>
              <ArrowUpRight aria-hidden="true" />
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
}

export default function ServicesPage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const services = useServices();

  useHeadMeta({
    title: t("servicesPage.meta.title"),
    description: t("servicesPage.meta.description"),
    keywords: t("servicesPage.meta.keywords"),
    canonicalUrl: "https://www.hugowishpax.studio/services",
  });

  useJsonLd("services-schema", useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "Service",
    name: t("servicePkg.page.schemaName"),
    provider: i18n.language === "en"
      ? { "@type": "Person", name: "Hugo Wishpax", jobTitle: "Freelance Web Developer", url: "https://www.hugowishpax.studio/en/introduction" }
      : { "@type": "Organization", name: "Hugo Studio", url: "https://www.hugowishpax.studio" },
    ...(i18n.language === "en" ? {} : { areaServed: { "@type": "Country", name: "Vietnam" } }),
    url: "https://www.hugowishpax.studio/services",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: t("servicePkg.page.catalogName"),
      itemListElement: services.map((service) => ({
        "@type": "Offer",
        name: service.name,
        description: service.description,
      })),
    },
  }), [i18n.language, services, t]));

  return (
    <div className="hwagfu-copy services-editorial">
      <section className="services-hero" aria-labelledby="services-title">
        <div className="services-shell services-hero__inner">
          <p className="services-hero__eyebrow">{t("servicePkg.page.heroEyebrow")}</p>
          <h1 id="services-title"><span>Hugo</span><span>Studio.</span></h1>
          <div className="services-hero__footer">
            <p>{t("servicePkg.page.heroLede")}</p>
            <a href="#services-list" className="services-text-link">
              {t("servicePkg.page.scrollHint")} <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section className="services-about" aria-labelledby="services-about-title">
        <div className="services-shell services-about__grid">
          <SectionMarker number="01">Hugo Studio</SectionMarker>
          <div>
            <h2 id="services-about-title">{t("servicePkg.page.aboutTitle1")}<br /><em>{t("servicePkg.page.aboutTitle2")}</em></h2>
            <p>{t("servicePkg.page.studioIntro")}</p>
            <dl className="services-proof">
              <div><dt>{projects.length}</dt><dd>{t("servicePkg.page.proof.0.label")}</dd></div>
              <div><dt>{Object.keys(PUBLIC_TOOLS).length}</dt><dd>{t("servicePkg.page.proof.1.label")}</dd></div>
              <div><dt>100%</dt><dd>{t("servicePkg.page.proof.2.label")}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <ServicesStory
        standalone
        label={t("servicePkg.page.filmLabel")}
        heading={t("servicePkg.page.filmHeading")}
        chapters={services}
        studioIntro={t("servicePkg.page.studioIntro")}
        progressLabels={["Hugo One", "Hugo Story", "Hugo Flow+", "Hugo Edu+"]}
        speedUnit={t("intro.story.services.speedUnit")}
        mergeLabel="Hugo Story"
        seoBurst={["HUGO", "FLOW"]}
        cta={t("servicePkg.page.filmCta")}
        ctaHref="/booking"
      />

      <section id="services-list" className="services-list" aria-labelledby="services-list-title">
        <div className="services-shell">
          <div className="services-list__heading">
            <SectionMarker number="03">{t("servicePkg.page.pricingKicker")}</SectionMarker>
            <h2 id="services-list-title">{t("servicePkg.page.pricingTitle")}</h2>
            <p>{t("servicePkg.page.pricingLede")}</p>
          </div>
          <div className="services-packages">
            {services.map((service, index) => <ServiceCard key={service.id} service={service} index={index} />)}
          </div>
        </div>
      </section>

      <SocialSection />

      <section className="services-closing" aria-labelledby="services-closing-title">
        <div className="services-shell services-closing__inner">
          <SectionMarker number="05">{t("servicePkg.page.closingKicker")}</SectionMarker>
          <h2 id="services-closing-title">
            {t("servicePkg.page.closingTitle1")}<br /><em>{t("servicePkg.page.closingTitle2")}</em>
          </h2>
          <p>{t("servicePkg.page.closingLede")}</p>
          <div className="services-closing__actions">
            <Link to="/booking" className="services-button services-button--dark">
              {t("servicePkg.page.closingCta")} <ArrowRight aria-hidden="true" />
            </Link>
            <Link to="/project" state={{ from: `${location.pathname}${location.search}${location.hash}` }} className="services-text-link">
              {t("servicePkg.page.closingCtaAlt")} <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
