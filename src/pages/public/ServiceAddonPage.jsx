import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarCheck, Copy } from "lucide-react";
import Aura from "../../components/public/hwagfu/Aura";
import "../../components/public/hwagfu/hwagfu.css";
import AddonIllustration from "../../components/public/AddonIllustration";
import { IconList, Section } from "../../components/public/ServiceBlocks";
import { AddonTile } from "../../components/public/ServicePricing";
import { SERVICE_ADDONS, addonPath, findAddon } from "../../data/serviceAddons";
import { priceCurrency } from "../../data/servicePackages";
import { languageCode } from "../../i18n/languages";
import { notify } from "../../lib/notify";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useJsonLd } from "../../hooks/useJsonLd";

const ORIGIN = "https://www.hugowishpax.studio";
const OBJ = { returnObjects: true };

/**
 * Trang chính thức của một gói lẻ — /services/add-ons/<slug>.
 *
 * Đây là link Hugo copy gửi khách, nên mọi thứ khách cần để quyết định phải
 * nằm ở đây: gồm gì, không gồm gì, cách làm, giá, có thể thêm, bảo hành và
 * miễn trừ. Chữ ở `servicePkg.addonItems.<id>`, slug ở src/data/serviceAddons.js.
 */
export default function ServiceAddonPage() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const addon = findAddon(slug);
  const a = addon ? t(`servicePkg.addonItems.${addon.id}`, OBJ) : null;
  const p = t("servicePkg.addonPage", OBJ);
  const forLabel = t("servicePkg.addons.forLabel");
  const lang = languageCode(i18n.resolvedLanguage || i18n.language);
  const prefix = lang === "en" || lang === "zh" ? `/${lang}` : "";
  const shareUrl = addon ? `${ORIGIN}${prefix}${addonPath(addon)}` : `${ORIGIN}/services`;

  useHeadMeta({
    title: a ? a.seo?.title || `${a.name} — ${a.price} | Hugo Studio` : "Hugo Studio",
    description: a ? a.seo?.description || `${a.when} ${a.lede}` : "",
    keywords: a?.seo?.keywords || "",
    canonicalUrl: shareUrl,
  });
  useJsonLd("service-addon-schema", useMemo(() => (a ? {
    "@context": "https://schema.org",
    "@type": "Service",
    name: a.name,
    description: a.lede,
    provider: { "@type": "Organization", name: "Hugo Studio", url: ORIGIN },
    url: shareUrl,
    offers: { "@type": "Offer", priceCurrency: priceCurrency(lang), description: a.price },
  } : null), [a, shareUrl, lang]));

  if (!addon) return <Navigate to="/services#add-ons" replace />;

  const copyLink = () => {
    navigator.clipboard?.writeText(shareUrl).then(() => notify.success(p.copied), () => notify.info(shareUrl));
  };
  const facts = [[forLabel, a.for], [p.timeLabel, a.time], [p.periodLabel, a.warranty.period]];
  const related = SERVICE_ADDONS.filter((x) => x.id !== addon.id && x.group === addon.group)
    .concat(SERVICE_ADDONS.filter((x) => x.id !== addon.id && x.group !== addon.group))
    .slice(0, 3);

  return (
    <div className="hwagfu-copy text-foreground">
      {/* ── Đầu trang: tên, giá, link chia sẻ + hình minh hoạ ── */}
      <section className="relative isolate overflow-hidden px-5 pb-12 pt-24 sm:px-8 sm:pb-16 sm:pt-32">
        <Aura />
        <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-start gap-10 lg:grid-cols-2">
          <div className="min-w-0">
            <Link to="/services#add-ons" className="link-more inline-flex items-center gap-2 text-sm">
              <ArrowLeft size={16} /> {p.back}
            </Link>
            <h1 className="mt-6 text-[clamp(2.2rem,1.6rem+3vw,4rem)] leading-[1.02] font-semibold tracking-[-.05em]">{a.name}</h1>
            <p className="mt-4 text-[clamp(1.1rem,.95rem+.6vw,1.45rem)] leading-[1.3] font-medium tracking-[-.02em] text-foreground/85">{a.when}</p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{a.lede}</p>

            <div className="mt-7 max-w-xl rounded-[1.5rem] border border-border bg-card/90 p-5 backdrop-blur-md sm:p-6">
              <p className="text-xs text-muted-foreground">{p.priceLabel}</p>
              <p className="mt-1 text-[clamp(1.9rem,1.5rem+1.5vw,2.6rem)] leading-none font-semibold tracking-[-.05em]">{a.price}</p>
              {a.priceNote ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{a.priceNote}</p> : null}
              <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
                {facts.map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-[0.7rem] text-muted-foreground">{label}</dt>
                    <dd className="mt-0.5 text-sm leading-5 font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
              <Link to="/booking" className="btn-primary mt-5 w-full justify-center sm:w-auto">{p.cta} <CalendarCheck size={17} /></Link>
            </div>

            {/* Link chính thức để copy gửi qua Zalo/Messenger. */}
            <div className="mt-4 flex max-w-xl items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5">
              <span className="shrink-0 text-xs text-muted-foreground">{p.copyLabel}</span>
              <code className="min-w-0 flex-1 truncate text-xs">{shareUrl.replace("https://", "")}</code>
              <button type="button" onClick={copyLink} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-muted px-3 text-xs font-semibold">
                <Copy size={14} /> {p.copy}
              </button>
            </div>
          </div>
          <AddonIllustration id={addon.id} labels={a.illo || []} />
        </div>
      </section>

      <Section title={p.includesTitle} muted>
        <IconList items={a.includes} />
      </Section>

      <Section title={p.stepsTitle}>
        <ol className={`grid gap-3 sm:grid-cols-2 ${(a.steps || []).length > 3 ? "lg:grid-cols-5" : "lg:grid-cols-3"}`}>
          {(a.steps || []).map((step, i) => (
            <li key={step} className="rounded-[1.25rem] border border-border bg-card p-5">
              <span className="grid size-8 place-items-center rounded-full bg-muted text-sm font-semibold">{i + 1}</span>
              <p className="mt-3 text-sm leading-6">{step}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section title={p.excludesTitle} muted>
        <IconList items={a.excludes} fallbackIcon="remove" />
      </Section>

      <Section title={p.priceTitle}>
        <ul className="overflow-hidden rounded-[1.25rem] border border-border bg-card">
          {(a.priceRows || [{ title: a.priceNote || a.name, price: a.price }]).map((r) => (
            <li key={r.title} className="flex items-baseline justify-between gap-4 border-b border-border px-5 py-3.5 last:border-b-0">
              <span className="text-sm leading-6">{r.title}</span>
              <span className="shrink-0 text-right text-sm font-semibold">{r.price}</span>
            </li>
          ))}
        </ul>
        {a.extras?.length ? (
          <>
            <h3 className="mt-8 text-sm font-semibold">{p.extrasTitle}</h3>
            <ul className="mt-3 overflow-hidden rounded-[1.25rem] border border-border bg-card">
              {a.extras.map((r) => (
                <li key={r.title} className="flex items-baseline justify-between gap-4 border-b border-border px-5 py-3.5 last:border-b-0">
                  <span className="text-sm leading-6">{r.title}</span>
                  <span className="shrink-0 text-right text-sm font-semibold">{r.price}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <p className="mt-4 text-xs leading-5 text-muted-foreground">{p.note}</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{t("servicePkg.trademarkNote")}</p>
      </Section>

      <Section title={p.warrantyTitle} muted>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.25rem] border border-border bg-card p-5 sm:p-6">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <span aria-hidden className="material-symbols-outlined text-[19px]">verified_user</span>
              {p.periodLabel}: {a.warranty.period}
            </p>
            <ul className="mt-3 space-y-2.5">
              {a.warranty.lines.map((line) => (
                <li key={line} className="text-sm leading-6 text-muted-foreground">{line}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[1.25rem] border border-border bg-card p-5 sm:p-6">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <span aria-hidden className="material-symbols-outlined text-[19px]">block</span>
              {p.exclusionsTitle}
            </p>
            <ul className="mt-3 space-y-2.5">
              {a.exclusions.map((line) => (
                <li key={line} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                  <span aria-hidden className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-muted-foreground/70">close</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section title={p.relatedTitle}>
        <div className="grid gap-3 sm:grid-cols-3">
          {related.map((x) => <AddonTile key={x.id} addon={x} />)}
        </div>
      </Section>
    </div>
  );
}
