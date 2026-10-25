import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { siC, siCss, siGithub, siHtml5, siPhp, siReact, siTypescript } from "simple-icons";
import PackageName from "../../components/brand/PackageName";
import ServicesBookingForm from "../../components/public/ServicesBookingForm";
import ArtJar from "../../components/public/ArtJar";
import { PackageStill } from "../../components/public/hwagfu/ServicesStory";
import { servicePackages } from "../../data/servicePackages";
import { STUDIO_SOCIAL_LINKS } from "../../config/studioSocialLinks";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useJsonLd } from "../../hooks/useJsonLd";
import { formatServicePrice } from "../../utils/servicePrice";
import "../../components/public/hwagfu/hwagfu.css";
import "./services-editorial.css";

const OBJ = { returnObjects: true };

// Baloo 2 (chữ tròn) + Xanh Mono (chữ đánh máy) chỉ dùng ở trang này, nên nạp
// tại đây thay vì nhét vào index.html cho mọi trang cùng gánh.
const SERVICES_FONTS_HREF = "https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Xanh+Mono:ital@0;1&display=swap";

// Logo nền: tám ngôn ngữ/công cụ user chọn, mỗi cái xuất hiện hai lần ở hai độ
// sâu khác nhau. Đơn sắc theo quy ước trang public — màu đến từ vệt xoáy.
// C# không có trong simple-icons (Microsoft đã yêu cầu gỡ) nên vẽ bằng chữ.
const siCsharpText = { slug: "csharp", text: "C#" };
const CODE_LOGOS = [
  [siHtml5, 6, 14, 46, 1.4], [siCss, 30, 8, 40, 0.8], [siPhp, 56, 6, 52, 1.2], [siReact, 86, 14, 50, 1.8],
  [siTypescript, 4, 50, 38, 0.9], [siGithub, 44, 40, 34, 0.6], [siC, 70, 46, 36, 1.3], [siCsharpText, 94, 52, 34, 1],
  [siReact, 18, 84, 40, 1.1], [siGithub, 36, 70, 30, 1.5], [siHtml5, 62, 86, 34, 0.7], [siPhp, 84, 82, 44, 1.4],
  [siCsharpText, 20, 34, 30, 0.7], [siTypescript, 50, 92, 30, 1], [siCss, 96, 92, 32, 1.2], [siC, 12, 66, 28, 0.8],
];

function useServicesFonts() {
  useEffect(() => {
    if (document.getElementById("services-fonts")) return;
    const link = document.createElement("link");
    link.id = "services-fonts";
    link.rel = "stylesheet";
    link.href = SERVICES_FONTS_HREF;
    document.head.appendChild(link);
  }, []);
}

/**
 * Cảnh mở màn: Hugo đứng giữa các vệt màu xoáy, logo ngôn ngữ lập trình trôi ở
 * nền. Con trỏ chỉ ghi biến CSS lên khung (không setState) nên rê chuột không
 * làm React vẽ lại cả cảnh.
 */
function ServicesHero() {
  const { t } = useTranslation();
  const ref = useRef(null);
  const [hops, setHops] = useState(0);

  const handlePointerMove = (event) => {
    if (event.pointerType !== "mouse") return;
    const node = ref.current;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    node.style.setProperty("--mx", (x * 2 - 1).toFixed(3));
    node.style.setProperty("--my", (y * 2 - 1).toFixed(3));
    node.style.setProperty("--sx", `${Math.round(x * 100)}%`);
    node.style.setProperty("--sy", `${Math.round(y * 100)}%`);
  };

  const resetPointer = () => {
    ref.current?.style.setProperty("--mx", "0");
    ref.current?.style.setProperty("--my", "0");
  };

  return (
    <section
      ref={ref}
      className="svc-hero"
      aria-labelledby="services-title"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
    >
      <div className="svc-hero__bg" aria-hidden="true">
        <i /><i /><i />
        <div className="svc-hero__spot" />
        {CODE_LOGOS.map(([icon, left, top, size, depth], index) => {
          const style = { left: `${left}%`, top: `${top}%`, width: size, height: size, "--d": depth, animationDelay: `${-index * 0.7}s` };
          return icon.text ? (
            <span key={index} className="svc-logo svc-logo--text" style={{ ...style, fontSize: size * 0.62 }}>{icon.text}</span>
          ) : (
            <svg key={index} className="svc-logo" viewBox="0 0 24 24" style={style}>
              <path d={icon.path} fill="currentColor" />
            </svg>
          );
        })}
      </div>

      <div className="services-shell svc-hero__inner">
        <div className="svc-hero__copy">
          <p className="svc-type svc-hero__eyebrow">{t("servicePkg.page.heroEyebrow")}</p>
          <h1 id="services-title" aria-label="Hugo Studio">
            <span aria-hidden="true">Hugo</span>
            {/* Chấm chữ i là giọt nước kính lỏng — logo Hugo Studio là giọt nước. */}
            <span aria-hidden="true">Stud<span className="svc-i">ı<i className="svc-drop" /></span>o</span>
          </h1>
        </div>

        <div className="svc-stage">
          <div className="svc-swirls" aria-hidden="true">
            <i className="svc-swirl svc-swirl--4" />
            <i className="svc-swirl svc-swirl--2" />
            <i className="svc-swirl svc-swirl--1" />
            <i className="svc-swirl svc-swirl--3" />
            <i className="svc-core" />
          </div>
          <span className="svc-shadow" aria-hidden="true" />
          <button
            type="button"
            className={`svc-mascot${hops ? ` svc-mascot--hop${hops % 2}` : ""}`}
            onClick={() => setHops((count) => count + 1)}
            aria-label="Hugo"
          >
            <img src="/image/avt1.png" alt="" width="447" height="558" />
          </button>
        </div>

        <div className="svc-hero__footer">
          <p className="svc-type">{t("servicePkg.page.studioIntro")}</p>
        </div>
      </div>
    </section>
  );
}

function ServicesMarquee() {
  const { t } = useTranslation();
  const items = [
    "Hugo One", "Hugo Story", "Hugo Flow+", "Hugo Edu+",
    t("servicePkg.page.aboutTitle1"),
    t("servicePkg.page.aboutTitle2"),
  ];
  return (
    <div className="svc-marquee" aria-hidden="true">
      <div className="svc-marquee__track">
        {[...items, ...items].map((item, index) => <span key={index}><i />{item}</span>)}
      </div>
    </div>
  );
}

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

/** Một khung phim: chữ bên trái, cặp MacBook + iPhone bên phải. Các khung dính
 *  lần lượt và trượt đè lên nhau khi cuộn. Màu lấy từ `gradient` của gói. */
function FilmFrame({ service, index, total }) {
  const { t } = useTranslation();
  const [from, to] = service.gradient;
  return (
    <article className="svc-film" style={{ "--a": from, "--b": to, top: `${4.5 + index}rem` }}>
      <div className="svc-frame">
        <i className="svc-frame__glow" aria-hidden="true" />
        <div className="svc-frame__grid">
          <div className="svc-frame__copy">
            <p className="svc-type svc-frame__count">{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</p>
            <PackageName id={service.id} size="lg" dot={false} />
            <h3>{service.title}</h3>
            <p className="svc-type svc-frame__lede">{service.description}</p>
            <ul aria-label={t("servicePkg.page.catalogIncludes")}>
              {service.features.slice(0, 3).map((feature) => (
                <li key={feature}><Check aria-hidden="true" />{feature}</li>
              ))}
            </ul>
            <div className="svc-frame__foot">
              <div>
                {service.priceLabel ? <p className="svc-type svc-frame__label">{service.priceLabel}</p> : null}
                <p className="svc-frame__price">{service.price}</p>
              </div>
              <Link to={service.href} className="services-text-link">
                {service.actionLabel} <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="svc-frame__art">
            <PackageStill index={index} label={service.name} interactive />
          </div>
        </div>
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
  useServicesFonts();
  // Mảng mới mỗi lần render sẽ làm lọ thẻ dựng lại vật lý — giữ theo ngôn ngữ.
  const artCards = useMemo(() => t("servicePkg.page.artCards", OBJ), [t]);
  // /booking chuyển về đây kèm #dat-lich; trang cuộn trong khung riêng nên tự
  // nhảy tới form thay vì trông vào trình duyệt.
  useEffect(() => {
    if (location.hash !== "#dat-lich") return undefined;
    const timer = window.setTimeout(() => document.getElementById("dat-lich")?.scrollIntoView({ block: "start" }), 300);
    return () => window.clearTimeout(timer);
  }, [location.hash]);
  // "Bốn gói. Một tiêu chuẩn." → vế sau tô màu. Tách ở dấu chấm đầu tiên (cả "。").
  const [filmHead, filmTail = ""] = t("servicePkg.page.filmHeading").split(/(?<=[.。])\s*/, 2);

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
      <ServicesHero />
      <ServicesMarquee />

      <section className="services-about" aria-labelledby="services-about-title">
        <div className="services-shell services-about__grid">
          <SectionMarker number="01">Hugo Studio</SectionMarker>
          <div>
            <h2 id="services-about-title" className="svc-reveal">{t("servicePkg.page.aboutTitle1")}<br /><em>{t("servicePkg.page.aboutTitle2")}</em></h2>
            <ArtJar messages={artCards} />
          </div>
        </div>
      </section>

      <section id="services-packages" className="svc-films" aria-labelledby="services-film-title">
        <div className="services-shell">
          <p className="svc-type svc-kicker svc-reveal">{t("servicePkg.page.filmLabel")}</p>
          <h2 id="services-film-title" className="svc-big svc-reveal">
            {filmHead}<br /><em>{filmTail}</em>
          </h2>
          <div className="svc-films__list">
            {services.map((service, index) => (
              <FilmFrame key={service.id} service={service} index={index} total={services.length} />
            ))}
          </div>
        </div>
      </section>

      <section className="svc-process" aria-labelledby="services-process-title">
        <div className="services-shell">
          <p className="svc-type svc-kicker svc-reveal">{t("servicePkg.page.processKicker")}</p>
          <h2 id="services-process-title" className="svc-big svc-reveal">{t("servicePkg.page.processTitle")}</h2>
          <ol className="svc-steps">
            {t("servicePkg.page.process", OBJ).map((step, index) => (
              <li key={step.title} className="svc-step svc-reveal">
                <span className="svc-step__n" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p className="svc-type">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <SocialSection />

      <section id="dat-lich" className="services-closing" aria-labelledby="services-closing-title">
        <div className="services-shell services-closing__inner">
          <div>
            <SectionMarker number="05">{t("servicePkg.page.closingKicker")}</SectionMarker>
            <h2 id="services-closing-title" className="svc-reveal">
              {t("servicePkg.page.closingTitle1")}<br /><em>{t("servicePkg.page.closingTitle2")}</em>
            </h2>
            <p>{t("servicePkg.page.closingLede")}</p>
            <div className="services-closing__actions">
              <Link to="/project" state={{ from: `${location.pathname}${location.search}${location.hash}` }} className="services-text-link">
                {t("servicePkg.page.closingCtaAlt")} <ArrowUpRight aria-hidden="true" />
              </Link>
            </div>
          </div>
          <ServicesBookingForm />
        </div>
      </section>
    </div>
  );
}
