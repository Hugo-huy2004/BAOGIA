import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarCheck } from "lucide-react";
import { priceCurrency, servicePackages } from "../../data/servicePackages";
import { COMPARE_ROWS } from "../../data/serviceCompare";
import { useServiceCopy, useSharedServiceCopy } from "../../hooks/useServiceCopy";
import { AddonTile, ServiceAddons } from "../../components/public/ServicePricing";
import { IconList, Section } from "../../components/public/ServiceBlocks";
import { SERVICE_ADDONS, findAddon } from "../../data/serviceAddons";
import { SHARED_ICONS } from "../../data/serviceIcons";
import { formatServicePrice } from "../../utils/servicePrice";
import PackageName from "../../components/brand/PackageName";
import Aura from "../../components/public/hwagfu/Aura";
import { PackageStill, PhoneFrame } from "../../components/public/hwagfu/ServicesStory";
import "../../components/public/hwagfu/hwagfu.css";
import "./service-detail.css";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useJsonLd } from "../../hooks/useJsonLd";
import { useServicesFonts } from "../../hooks/useServicesFonts";

/** Màu màn hình cho dải điện thoại "Bao gồm": xoay vòng bảng neon của trang Dịch vụ. */
const SCREENS = ["#00f5d4", "#ff2e93", "#c6ff00", "#2f6bff", "#ffe53b", "#b14bff", "#ff6a00"];

/** Mục điều khoản gập lại: tiêu đề + một dòng tóm tắt, mở ra mới thấy chữ. */
function Fold({ id, icon, label, hint, children }) {
  return (
    <details id={id} className="sd-fold scroll-mt-32">
      <summary>
        <span aria-hidden className="material-symbols-outlined sd-fold__icon">{icon}</span>
        <span className="min-w-0"><b>{label}</b><small>{hint}</small></span>
        <span aria-hidden className="material-symbols-outlined sd-fold__chev">expand_more</span>
      </summary>
      <div className="sd-fold__body">{children}</div>
    </details>
  );
}

/**
 * /services/:slug — một gói, một trang.
 *
 * Thứ tự các phần là thứ tự người ta thật sự hỏi khi cân nhắc thuê: gói này
 * là gì, hợp với tôi không, tôi nhận được gì, tôi KHÔNG nhận được gì, hỏng
 * thì sao, luật chơi ra sao, và cuối cùng mới tới tiền.
 *
 * Bố cục giữ một nhịp cố định: nhãn nhỏ → tiêu đề → nội dung. Danh sách cần
 * quét mắt thì dựng thành lưới thẻ, phần cần đọc liền mạch thì để hai cột
 * chữ. Nội dung lấy từ `apps/web/src/data/servicePackages.js`, trang này chỉ dựng hình.
 */

// Mốc neo giữ nguyên tiếng Việt (đường dẫn #gioi-thieu đã có người lưu lại),
// nhãn hiển thị lấy theo ngôn ngữ đang chọn.
// Gói nhận theo hồ sơ không có mức trần — chỉ in một con số, không in dấu gạch.
const priceRange = (price) => (price.to ? `${price.from} – ${price.to}` : price.from);

// ponytail: 2026-09-28 gọt trang — bỏ mục Giới thiệu (lặp lại lede) và gộp
// "Chưa bao gồm" vào dưới "Gói bao gồm"; khách đọc lướt, ít chặng hơn là hơn.
const NAV = [
  ["included", "includes"],
  ["not-included", "excludes"],
  ["warranty", "warranty"],
  ["feedback", "feedback"],
  ["add-ons", "price"],
  ["compare", "compare"],
];

/**
 * Bảng so sánh bốn gói — kiểu bảng "Compare" của Apple: mỗi hàng một hạng mục,
 * cột của gói đang xem được làm nổi, đọc ngang là thấy ngay hơn kém chỗ nào.
 *
 * Cấu trúc hàng (icon, ô có/không) nằm ở `apps/web/src/data/serviceCompare.js`; ở đây
 * chỉ ghép thêm chữ đã dịch. Xem tệp đó để biết vì sao hai thứ phải tách ra.
 *
 * Icon đơn sắc Material Symbols trên nền `bg-muted`, đúng quy ước trang public:
 * không emoji, không icon màu.
 */
function CompareTable({ copy, currentId }) {
  const { t, i18n } = useTranslation();

  // Ba trạng thái, ba ký hiệu: đã có · tính thêm · không có.
  const MARKS = {
    true: { icon: "check", label: copy.yes, tone: "text-foreground" },
    extra: { icon: "add", label: copy.extra, tone: "text-foreground/70" },
    false: { icon: "remove", label: copy.no, tone: "text-muted-foreground/40" },
  };

  const mark = (flag) => {
    const m = MARKS[String(flag)];
    return (
      <span className={`material-symbols-outlined shrink-0 text-[20px] leading-6 ${m.tone}`} role="img" aria-label={m.label}>
        {m.icon}
      </span>
    );
  };

  const priceInfo = (pkgId) => t(`servicePkg.items.${pkgId}.price`, { returnObjects: true });
  const priceOf = (pkgId) => formatServicePrice(priceInfo(pkgId), i18n.resolvedLanguage);
  const priceLabelOf = (pkgId) => {
    return t(priceInfo(pkgId).factors?.length ? "servicePkg.page.startingPriceLabel" : "servicePkg.page.fixedPriceLabel");
  };

  const cell = (row, pkgId) => {
    const flag = row.marks?.[pkgId];
    let text = copy.cells?.[row.id]?.[pkgId];
    // Hàng chi phí không có chữ riêng thì lấy thẳng số từ gói.
    const price = row.price ? priceInfo(pkgId) : null;
    if (!text && row.price) text = formatServicePrice(price, i18n.resolvedLanguage);
    if (flag === undefined && !text) return mark(false);
    return (
      <span className="flex gap-2">
        {flag === undefined ? null : mark(flag)}
        {text ? (
          <span className="text-[0.82rem] leading-6 text-foreground/80">
            {row.price ? (
              <>
                {priceLabelOf(pkgId) ? (
                  <span className="mb-1 block text-[0.7rem] font-medium text-muted-foreground">{priceLabelOf(pkgId)}</span>
                ) : null}
                {text}
              </>
            ) : text}
          </span>
        ) : null}
      </span>
    );
  };

  const rowIcon = (row) => (
    <span aria-hidden className="material-symbols-outlined grid size-9 shrink-0 place-items-center rounded-full bg-muted text-[20px] text-foreground">
      {row.icon}
    </span>
  );

  // Gói đang xem đứng đầu và mở sẵn; ba gói kia gập lại để trang không dài ra
  // bốn lần. `<details>` là của trình duyệt — không cần state, không cần thư viện.
  const ordered = [
    ...servicePackages.filter((p) => p.id === currentId),
    ...servicePackages.filter((p) => p.id !== currentId),
  ];

  return (
    <>
      {/* Điện thoại: một thẻ một gói. Bảng 60rem cuộn ngang trên màn 390px thì
          đọc không nổi, nên bảng chỉ xuất hiện từ khổ máy tính trở lên. */}
      <div className="space-y-3 lg:hidden">
        {ordered.map((p) => (
          <details
            key={p.id}
            open={p.id === currentId}
            className={`group overflow-hidden rounded-[1.25rem] border ${p.id === currentId ? "border-foreground/20 bg-muted/40" : "border-border bg-card"}`}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0">
                <PackageName id={p.id} size="sm" dot={false} />
                <span className="mt-1 block text-[0.72rem] text-muted-foreground">
                  {priceLabelOf(p.id) ? <span className="block">{priceLabelOf(p.id)}</span> : null}
                  <span className="mt-0.5 block text-[0.82rem]">{priceOf(p.id)}</span>
                </span>
              </span>
              <span aria-hidden className="material-symbols-outlined shrink-0 text-[22px] text-muted-foreground transition-transform group-open:rotate-180">
                expand_more
              </span>
            </summary>
            <dl className="border-t border-border px-5">
              {COMPARE_ROWS.map((row) => (
                <div key={row.id} className="flex gap-3 border-b border-border py-3.5 last:border-b-0">
                  {rowIcon(row)}
                  <div className="min-w-0">
                    <dt className="text-[0.72rem] leading-5 text-muted-foreground">{copy.labels?.[row.id]}</dt>
                    <dd className="mt-0.5">{cell(row, p.id)}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </details>
        ))}
      </div>

      {/* Máy tính: bảng thật, cột hạng mục dính lại bên trái. */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[60rem] border-collapse text-left">
          <caption className="sr-only">{copy.title}</caption>
          <thead>
            <tr>
              <td className="sticky left-0 z-10 w-[13rem] bg-band" />
              {servicePackages.map((p) => (
                <th key={p.id} scope="col" className={`px-4 pb-5 align-bottom ${p.id === currentId ? "bg-muted/50" : ""}`}>
                  <PackageName id={p.id} size="sm" dot={false} />
                  {p.id === currentId ? (
                    <span className="mt-1.5 block text-[0.68rem] font-medium text-muted-foreground">{copy.current}</span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <th scope="row" className="sticky left-0 z-10 bg-band py-4 pr-5 align-top font-normal">
                  <span className="flex items-center gap-2.5">
                    {rowIcon(row)}
                    <span className="text-[0.82rem] leading-5 text-foreground">{copy.labels?.[row.id]}</span>
                  </span>
                </th>
                {servicePackages.map((p) => (
                  <td key={p.id} className={`w-[min(22%,17rem)] px-4 py-4 align-top ${p.id === currentId ? "bg-muted/50" : ""}`}>
                    {cell(row, p.id)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
        {[true, "extra", false].map((flag) => (
          <span key={String(flag)} className="inline-flex items-center gap-1.5">
            {mark(flag)}
            {MARKS[String(flag)].label}
          </span>
        ))}
      </p>
    </>
  );
}

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const c = (key, fallback) => t(`servicePkg.detail.${key}`, fallback);
  const pkg = useServiceCopy(slug);
  const { priceNotice, studentDiscount, compare, stats, warrantyTerms, warrantyExclusions, feedback, addons } = useSharedServiceCopy();
  const index = servicePackages.findIndex((item) => item.slug === slug);
  useServicesFonts();

  useHeadMeta({
    // Tiêu đề/mô tả SEO viết riêng từng gói (servicePkg.items.<id>.seo), khớp bản HTML tĩnh.
    title: pkg ? pkg.seo?.title || `${pkg.name} — ${pkg.title} | Hugo Studio` : c("metaFallback"),
    description: pkg ? pkg.seo?.description || pkg.lede : "",
    keywords: pkg ? pkg.seo?.keywords || `${pkg.name}, ${t("servicesPage.meta.keywords")}` : "",
    canonicalUrl: pkg ? `https://www.hugowishpax.studio/services/${pkg.slug}` : "https://www.hugowishpax.studio/services",
  });

  useJsonLd("service-package-schema", useMemo(() => (pkg ? {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${pkg.name} — ${pkg.title}`,
    description: pkg.lede,
    provider: { "@type": "Organization", name: "Hugo Studio", url: "https://www.hugowishpax.studio" },
    url: `https://www.hugowishpax.studio/services/${pkg.slug}`,
    offers: {
      "@type": "Offer",
      priceCurrency: priceCurrency(i18n.resolvedLanguage || i18n.language),
      description: priceRange(pkg.price),
    },
    ...(pkg.faq?.length
      ? {
          subjectOf: {
            "@type": "FAQPage",
            mainEntity: pkg.faq.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          },
        }
      : {}),
  } : null), [pkg, i18n.resolvedLanguage, i18n.language]));

  if (!pkg) return <Navigate to="/services" replace />;

  const next = servicePackages[(index + 1) % servicePackages.length];
  const facts = [
    [stats.time, compare.cells?.time?.[pkg.id]],
    [stats.pages, compare.cells?.pages?.[pkg.id]],
    [stats.warranty, stats.warrantyValue?.[pkg.id]],
  ];

  return (
    <div className="sd hwagfu-copy text-foreground" data-pkg={pkg.id}>
      {/* ── Đầu trang: một tấm thẻ neon — sticker tên gói, một câu, điện thoại
          mẫu, giá dán đè lên máy như nhãn giá. Lời dẫn dài chỉ hiện từ sm. ── */}
      <section className="sd-hero">
        <div className="sd-hero__card">
          <div className="min-w-0">
            <Link to="/services" className="sd-back"><ArrowLeft size={16} /> {c("backToAll")}</Link>
            <PackageName id={pkg.id} as="h1" dot={false} className="sd-sticker" />
            <p className="sd-hero__title">{pkg.title}</p>
            <p className="sd-hero__lede">{pkg.lede}</p>
            <ul className="sd-facts">
              {facts.map(([label, value]) => (
                <li key={label}><small>{label}</small><b>{value}</b></li>
              ))}
            </ul>
            <div className="sd-buy">
              <p className="sd-price">
                <small>{t(pkg.price.factors?.length ? "servicePkg.page.startingPriceLabel" : "servicePkg.page.fixedPriceLabel")}</small>
                <b>{formatServicePrice(pkg.price, i18n.resolvedLanguage)}</b>
                {pkg.noDeposit ? <span>{pkg.policy[1]?.title?.replace(/[.。]$/, "")}</span> : null}
              </p>
              <Link to="/booking" className="sd-cta">{c("discussCta")} <CalendarCheck size={18} /></Link>
            </div>
          </div>
          <div className="sd-hero__art">
            <PackageStill index={index} label={`${c("sampleAlt")} ${pkg.name}`} />
          </div>
        </div>
      </section>

      {/* ── Mục lục ────────────────────────────────────────── */}
      <nav aria-label={c("navLabel")} className="sticky top-16 z-20 border-y border-border bg-background/85 px-5 backdrop-blur-md sm:px-8">
        <ul className="mx-auto flex max-w-6xl gap-6 overflow-x-auto py-3.5 text-sm text-muted-foreground [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV.map(([anchor, key]) => (
            <li key={anchor} className="shrink-0">
              <a href={`#${anchor}`} onClick={() => document.getElementById(anchor)?.setAttribute("open", "")} className="transition-colors hover:text-foreground">{c(`nav.${key}`)}</a>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Dành cho ai: ba nhãn dán, không đoạn văn ─────────── */}
      <Section id="audience" kicker={c("audienceKicker")} title={c("audienceTitle")} muted>
        <ul className="sd-who">
          {pkg.audience.map((item, i) => (
            <li key={item}>
              <span aria-hidden className="material-symbols-outlined">{pkg.icons.audience[i] || "person"}</span>
              {item}
            </li>
          ))}
        </ul>
      </Section>

      {/* ── Bao gồm: mỗi thứ khách nhận là một màn hình điện thoại. Vuốt ngang
          trên điện thoại, xếp lưới trên máy tính. Chữ trên màn là tên mục,
          lời giải thích nằm nhỏ dưới máy. ─────────────────────────────── */}
      <Section id="included" kicker={c("includesKicker")} title={c("includesTitle")}>
        <ol className="sd-rail">
          {pkg.includes.map((item, i) => (
            <li key={item.title} className="sd-shot">
              <PhoneFrame label={item.title}>
                <div className="sd-screen" style={{ "--screen": SCREENS[i % SCREENS.length] }}>
                  <span className="sd-screen__bar"><i />HUGO<em>{String(i + 1).padStart(2, "0")}</em></span>
                  <span aria-hidden className="material-symbols-outlined sd-screen__icon">{pkg.icons.includes[i] || "check"}</span>
                  <b className="sd-screen__title">{item.title}</b>
                </div>
              </PhoneFrame>
              <p>{item.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── Luật chơi: chưa bao gồm, bảo hành, góp ý, cách làm việc — gập lại,
          mỗi mục một dòng tóm tắt. Ai cần mới mở. ─────────────────────── */}
      <Section kicker={c("policyKicker")} title={c("policyTitle")} muted>
        <div className="sd-folds">
          <Fold id="not-included" icon="do_not_disturb_on" label={c("nav.excludes")} hint={c("excludesTitle")}>
            <ul className="grid gap-x-8 sm:grid-cols-2">
              {pkg.excludes.map((item, i) => (
                <li key={item.title} className="flex gap-3 border-b border-border py-3.5 last:border-b-0">
                  <span aria-hidden className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-muted-foreground">{pkg.icons.excludes[i] || "remove"}</span>
                  <span className="min-w-0">
                    <span className="block text-[0.95rem] font-semibold">{item.title}</span>
                    <span className="mt-0.5 block text-sm leading-6 text-muted-foreground">{item.body}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              {findAddon("link").appliesTo.includes(pkg.id) ? (
                <AddonTile addon={findAddon("link")} />
              ) : (
                <p className="text-sm leading-6 text-muted-foreground"><b className="text-foreground">{t("servicePkg.linkIncludedNote.title")}</b> {t("servicePkg.linkIncludedNote.body")}</p>
              )}
            </div>
          </Fold>

          <Fold id="warranty" icon="verified_user" label={c("nav.warranty")} hint={c("warrantyTitle")}>
            <IconList items={pkg.warranty} icons={pkg.icons.warranty} />
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold">{warrantyTerms.title}</h3>
                <ol className="mt-2 space-y-2">
                  {warrantyTerms.lines.map((line, i) => (
                    <li key={line} className="flex gap-3 text-sm leading-6 text-muted-foreground"><span className="w-4 shrink-0 font-semibold text-foreground">{i + 1}.</span>{line}</li>
                  ))}
                </ol>
              </div>
              <div>
                <h3 className="text-sm font-semibold">{warrantyExclusions.title}</h3>
                <ul className="mt-2 space-y-2">
                  {warrantyExclusions.lines.map((line) => (
                    <li key={line} className="flex gap-3 text-sm leading-6 text-muted-foreground"><span aria-hidden className="material-symbols-outlined mt-0.5 shrink-0 text-[18px]">close</span>{line}</li>
                  ))}
                </ul>
              </div>
            </div>
            {SERVICE_ADDONS.some((a) => a.group === "care" && a.appliesTo.includes(pkg.id)) ? (
              <div className="mt-6">
                <h3 className="text-sm font-semibold">{t("servicePkg.addonPage.careTitle")}</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {SERVICE_ADDONS.filter((a) => a.group === "care" && a.appliesTo.includes(pkg.id)).map((a) => <AddonTile key={a.id} addon={a} />)}
                </div>
              </div>
            ) : null}
          </Fold>

          <Fold id="feedback" icon="rate_review" label={c("nav.feedback")} hint={feedback.title}>
            <IconList items={feedback.rules} icons={SHARED_ICONS.feedback} />
          </Fold>

          <Fold id="policy" icon="handshake" label={c("policyKicker")} hint={pkg.policy.map((p) => p.title.replace(/[.。]$/, "")).slice(0, 2).join(" · ")}>
            <IconList items={pkg.policy} icons={pkg.icons.policy} fallbackIcon="gavel" />
          </Fold>
        </div>
      </Section>

      {/* ── Gói đính kèm + đơn giá lẻ ──────────────────────── */}
      <Section id="add-ons" kicker={c("priceKicker")} title={c("priceTitle")} lede={addons.lede}>
        {pkg.price.note ? <p className="mb-6 max-w-3xl text-sm leading-6 text-muted-foreground">{pkg.price.note}</p> : null}
        {pkg.price.factors?.length ? (
          <div className="mb-8 rounded-[1.25rem] border border-border bg-card p-5 sm:p-6">
            <p className="mt-4 text-sm font-semibold">{c("priceFactors")}</p>
            <ul className="mt-2 space-y-1.5">
              {pkg.price.factors.map((factor) => (
                <li key={factor} className="flex gap-2.5 text-sm leading-6 text-muted-foreground">
                  <span aria-hidden className="mt-[.65rem] size-1 shrink-0 rounded-full bg-muted-foreground/60" />
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <h3 className="mb-4 text-sm font-semibold tracking-[-.01em]">{c("extraFeesTitle")}</h3>
        <ServiceAddons currentId={pkg.id} skip={["link", "maintain"]} />

        <div className="mt-8 flex flex-col gap-3 rounded-[1.25rem] border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">{studentDiscount.title}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{studentDiscount.body}</p>
          </div>
          <Link to={studentDiscount.href} className="link-more inline-flex shrink-0 items-center gap-1.5 text-sm">
            {c("verifyCta")} <ArrowRight size={14} />
          </Link>
        </div>
        <p className="mt-5 text-xs leading-5 text-muted-foreground">
          {c("priceNoticeTitle")} ({priceNotice.updated}): {priceNotice.lines.join(" ")}
        </p>
      </Section>

      {/* ── Hỏi đáp ────────────────────────────────────────── */}
      {pkg.faq?.length ? (
        <Section kicker={c("faqKicker")} title={c("faqTitle")}>
          <div className="border-t border-border">
            {pkg.faq.map((item) => (
              <details key={item.question} className="group border-b border-border py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[0.95rem] font-semibold tracking-[-.01em] [&::-webkit-details-marker]:hidden">
                  <span>{item.question}</span>
                  <span className="text-2xl font-normal text-muted-foreground transition-transform group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="mt-3 max-w-3xl pr-8 text-sm leading-6 text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </Section>
      ) : null}

      {/* ── So sánh bốn gói ────────────────────────────────── */}
      <Section id="compare" kicker={compare.kicker} title={compare.title} lede={compare.lede} muted>
        <CompareTable copy={compare} currentId={pkg.id} />
      </Section>

      {/* ── Kết ────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-background px-5 py-16 text-center sm:px-8 sm:py-24">
        <Aura />
        <div className="relative z-10 mx-auto max-w-4xl">
          <p className="kicker text-hue-blue">{c("closingKicker")}</p>
          <h2 className="mt-2 text-[clamp(1.8rem,1.3rem+2vw,3rem)] leading-[1.08] font-semibold tracking-[-.045em]">
            {c("closingTitle")}<span className="headline-quiet block">{c("closingTitleQuiet")}</span>
          </h2>
          <ul className="mx-auto mt-7 flex max-w-3xl flex-col items-start gap-3 text-left sm:flex-row sm:justify-center sm:gap-7">
            {c("guarantees", { returnObjects: true }).map((text, i) => (
              <li key={text} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <span aria-hidden className="material-symbols-outlined grid size-9 shrink-0 place-items-center rounded-full bg-muted text-[19px] text-foreground">
                  {["code", "lock", "verified_user"][i]}
                </span>
                {text}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/booking" className="btn-primary">{c("closingCta")} <CalendarCheck size={17} /></Link>
            <Link to={`/services/${next.slug}`} className="btn-secondary">{c("nextPackage")} <PackageName id={next.id} size="sm" dot={false} /> <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
