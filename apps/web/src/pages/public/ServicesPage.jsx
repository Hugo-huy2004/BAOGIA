import { useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowDown, ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { DocScroll, useStory, wipe } from "../../components/public/landing/Story";
import PackageName from "../../components/brand/PackageName";
import ServicesBookingForm from "../../components/public/ServicesBookingForm";
import { PackageStill } from "../../components/public/hwagfu/ServicesStory";
import { servicePackages } from "../../data/servicePackages";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useJsonLd } from "../../hooks/useJsonLd";
import { useServicesFonts } from "../../hooks/useServicesFonts";
import { formatServicePrice } from "../../utils/servicePrice";
import "../../components/public/hwagfu/hwagfu.css";
import "./services-editorial.css";

/**
 * Trang Dịch vụ (/services), 08/11/2026: chỉ phục vụ việc chọn gói — mở đầu
 * gọn, ba gói (trượt ngang trên màn rộng), quy trình, form đặt lịch. Hiệu ứng
 * cuộn ở components/public/landing/Story.jsx.
 * Chữ trên trang là chữ tác giả (servicePkg.page.*) — không sửa lời ở đây.
 */
const OBJ = { returnObjects: true };
function useServices() {
  const { t, i18n } = useTranslation();
  return servicePackages.map((pkg) => ({
    ...pkg,
    title: t(`servicePkg.items.${pkg.id}.title`),
    description: t(`servicePkg.items.${pkg.id}.lede`),
    features: t(`servicePkg.items.${pkg.id}.features`, OBJ),
    price: formatServicePrice(t(`servicePkg.items.${pkg.id}.price`, OBJ), i18n.resolvedLanguage),
  }));
}

/**
 * Hình gói trên điện thoại: phẳng, viền mực dày kiểu sticker, mỗi gói tự nói
 * nội dung của nó — One: một trang, một nút trúng đích · Story: nhiều trang
 * xoè như bộ bài · Flow+: lịch có ô khách vừa tự đặt. Không chữ, khỏi dịch.
 */
const INK = "#0c1230";
const ink = { stroke: INK, strokeWidth: 4, strokeLinejoin: "round", strokeLinecap: "round" };
const GLYPHS = {
  "hugo-one": (
    <>
      <rect x="92" y="18" width="104" height="166" rx="14" fill="#fff" {...ink} />
      <rect x="108" y="38" width="56" height="9" rx="4.5" fill={INK} />
      <rect x="108" y="56" width="72" height="6" rx="3" fill={INK} opacity=".25" />
      <rect x="108" y="68" width="60" height="6" rx="3" fill={INK} opacity=".25" />
      <rect x="108" y="88" width="72" height="34" rx="8" fill="#08a0ef" opacity=".25" />
      <rect x="108" y="140" width="72" height="26" rx="13" fill="#ffbf08" {...ink} />
      <path d="M186 150 C 222 146, 236 118, 244 96" fill="none" {...ink} strokeDasharray="2 10" />
      <circle cx="258" cy="78" r="34" fill="#f0445d" {...ink} />
      <circle cx="258" cy="78" r="21" fill="#fff" {...ink} />
      <circle cx="258" cy="78" r="8" fill={INK} />
    </>
  ),
  "hugo-story": (
    <g transform="translate(160 196)">
      {["#ffbf08", "#f0445d", "#08a0ef", "#fff"].map((fill, i) => (
        <g key={fill} transform={`rotate(${-27 + i * 18})`}>
          <rect x="-46" y="-176" width="92" height="132" rx="12" fill={fill} {...ink} />
          <circle cx="-26" cy="-152" r="8" fill={INK} />
          <rect x="-30" y="-128" width="60" height="7" rx="3.5" fill={INK} opacity=".35" />
          <rect x="-30" y="-114" width="44" height="7" rx="3.5" fill={INK} opacity=".35" />
        </g>
      ))}
    </g>
  ),
  "hugo-flow-plus": (
    <>
      <rect x="64" y="34" width="192" height="150" rx="18" fill="#fff" {...ink} />
      <path d="M64 70 H256 V52 a18 18 0 0 0 -18 -18 H82 a18 18 0 0 0 -18 18 Z" fill="#f0445d" {...ink} />
      <rect x="104" y="20" width="10" height="28" rx="5" fill={INK} />
      <rect x="206" y="20" width="10" height="28" rx="5" fill={INK} />
      {[0, 1, 2, 3].flatMap((c) => [0, 1, 2].map((r) => (
        c === 2 && r === 1 ? null : <rect key={`${c}${r}`} x={82 + c * 42} y={84 + r * 32} width="30" height="22" rx="6" fill={INK} opacity=".12" />
      )))}
      <rect x="160" y="110" width="44" height="34" rx="9" fill="#ffbf08" {...ink} />
      <path d="M172 127 l8 8 l14 -16" fill="none" {...ink} />
    </>
  ),
};

function PackageGlyph({ id }) {
  return <svg className="hs-pack__glyph" viewBox="0 0 320 200" aria-hidden="true">{GLYPHS[id]}</svg>;
}

function Packages({ services }) {
  const { t } = useTranslation();
  const [head, tail = ""] = t("servicePkg.page.filmHeading").split(/(?<=[.。])\s*/, 2);
  return (
    <section id="services-packages" className="hs-packs" aria-labelledby="hs-packs-title">
      <div className="hs-packs__track">
        <header className="hs-packs__intro">
          <p className="hs-kicker">{t("servicePkg.page.filmLabel")}</p>
          <h2 id="hs-packs-title">{head}<br /><em>{tail}</em></h2>
          <p className="hs-packs__hint"><ArrowDown aria-hidden="true" />{t("servicePkg.page.scrollHint")}</p>
        </header>
        {services.map((s, i) => (
          <article key={s.id} className="hs-pack" style={{ "--a": s.gradient[0], "--b": s.gradient[1] }}>
            <div className="hs-pack__copy">
              <p className="hs-pack__count">{String(i + 1).padStart(2, "0")} / {String(services.length).padStart(2, "0")}</p>
              <PackageName id={s.id} size="lg" dot={false} />
              <h3>{s.title}</h3>
              <p className="hs-pack__lede">{s.description}</p>
              <ul aria-label={t("servicePkg.page.catalogIncludes")}>
                {s.features.slice(0, 3).map((f) => <li key={f}><Check aria-hidden="true" />{f}</li>)}
              </ul>
              <div className="hs-pack__foot">
                <p className="hs-pack__price">{t("servicePkg.page.startingPriceLabel")} <b>{s.price}</b></p>
                <Link to={`/services/${s.slug}`} className="hs-link">{t("servicePkg.page.detailCta")} <ArrowRight aria-hidden="true" /></Link>
              </div>
            </div>
            <div className="hs-pack__art"><PackageStill index={i} label={s.name} interactive /></div>
            <PackageGlyph id={s.id} />
          </article>
        ))}
      </div>
      <div className="hs-packs__bar" aria-hidden="true"><i /></div>
    </section>
  );
}

function Process() {
  const { t } = useTranslation();
  return (
    <section className="hs-process" aria-labelledby="hs-process-title">
      <div className="hs-shell">
        <p className="hs-kicker">{t("servicePkg.page.processKicker")}</p>
        <h2 id="hs-process-title" className="hs-rise">{t("servicePkg.page.processTitle")}</h2>
        <div className="hs-process__body">
          <svg className="hs-process__thread" viewBox="0 0 40 1000" preserveAspectRatio="none" aria-hidden="true">
            <path d="M20 0 C 38 125, 2 250, 20 375 S 38 625, 20 750 S 2 875, 20 1000" pathLength="1" />
          </svg>
          <ol>
            {t("servicePkg.page.process", OBJ).map((step, i) => (
              <li key={step.title} className="hs-step">
                <span className="hs-step__n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <div><h3>{step.title}</h3><p>{step.body}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Closing() {
  const { t } = useTranslation();
  const location = useLocation();
  return (
    <section id="dat-lich" className="hs-closing" aria-labelledby="hs-closing-title">
      <div className="hs-shell hs-closing__grid">
        <div>
          <p className="hs-kicker">{t("servicePkg.page.closingKicker")}</p>
          <motion.h2 id="hs-closing-title" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.5 }}>
            <motion.span custom={0} variants={wipe}>{t("servicePkg.page.closingTitle1")}</motion.span>
            <motion.em custom={1} variants={wipe}>{t("servicePkg.page.closingTitle2")}</motion.em>
          </motion.h2>
          <p className="hs-closing__lede">{t("servicePkg.page.closingLede")}</p>
          <Link to="/project" state={{ from: `${location.pathname}${location.search}${location.hash}` }} className="hs-link">
            {t("servicePkg.page.closingCtaAlt")} <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
        <ServicesBookingForm />
      </div>
    </section>
  );
}

export default function ServicesPage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const services = useServices();
  const rootRef = useRef(null);
  useServicesFonts();
  useStory(rootRef);
  // /booking chuyển về đây kèm #dat-lich: đợi cảnh ghim dựng xong khoảng đệm rồi mới nhảy.
  useEffect(() => {
    if (location.hash !== "#dat-lich") return undefined;
    const timer = window.setTimeout(() => document.getElementById("dat-lich")?.scrollIntoView({ block: "start" }), 400);
    return () => window.clearTimeout(timer);
  }, [location.hash]);

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
      ? { "@type": "Person", name: "Hugo Wishpax", jobTitle: "Freelance Web Developer", url: "https://portfolio.hugowishpax.studio/en/" }
      : { "@type": "Organization", name: "Hugo Studio", url: "https://www.hugowishpax.studio" },
    ...(i18n.language === "en" ? {} : { areaServed: { "@type": "Country", name: "Vietnam" } }),
    url: "https://www.hugowishpax.studio/services",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: t("servicePkg.page.catalogName"),
      itemListElement: services.map((s) => ({ "@type": "Offer", name: s.name, description: s.description })),
    },
  }), [i18n.language, services, t]));

  return (
    <div ref={rootRef} className="hs-land">
      <DocScroll />
      <section className="hs-top" aria-labelledby="hs-top-title">
        <div className="hs-shell">
          <p className="hs-kicker">{t("servicePkg.page.heroEyebrow")}</p>
          <h1 id="hs-top-title">{t("servicePkg.page.heroLine1")} <em>{t("servicePkg.page.heroLine2")}</em></h1>
          <p className="hs-top__lede">{t("servicePkg.page.studioIntro")}</p>
          <div className="hs-top__actions">
            <a href="#dat-lich" className="hs-cta">{t("servicePkg.page.heroCta")}</a>
            <Link to="/project" className="hs-cta hs-cta--quiet">{t("servicePkg.page.heroCtaAlt")}</Link>
          </div>
        </div>
      </section>

      <Packages services={services} />
      <Process />
      <Closing />
    </div>
  );
}
