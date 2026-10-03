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
import PackageName from "../../components/brand/PackageName";
import Aura from "../../components/public/hwagfu/Aura";
import { PackageStill } from "../../components/public/hwagfu/ServicesStory";
import "../../components/public/hwagfu/hwagfu.css";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useJsonLd } from "../../hooks/useJsonLd";

/**
 * /services/:slug — một gói, một trang.
 *
 * Thứ tự các phần là thứ tự người ta thật sự hỏi khi cân nhắc thuê: gói này
 * là gì, hợp với tôi không, tôi nhận được gì, tôi KHÔNG nhận được gì, hỏng
 * thì sao, luật chơi ra sao, và cuối cùng mới tới tiền.
 *
 * Bố cục giữ một nhịp cố định: nhãn nhỏ → tiêu đề → nội dung. Danh sách cần
 * quét mắt thì dựng thành lưới thẻ, phần cần đọc liền mạch thì để hai cột
 * chữ. Nội dung lấy từ `src/data/servicePackages.js`, trang này chỉ dựng hình.
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
 * Cấu trúc hàng (icon, ô có/không) nằm ở `src/data/serviceCompare.js`; ở đây
 * chỉ ghép thêm chữ đã dịch. Xem tệp đó để biết vì sao hai thứ phải tách ra.
 *
 * Icon đơn sắc Material Symbols trên nền `bg-muted`, đúng quy ước trang public:
 * không emoji, không icon màu.
 */
function CompareTable({ copy, currentId }) {
  const { t } = useTranslation();

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

  const priceOf = (pkgId) => priceRange(t(`servicePkg.items.${pkgId}.price`, { returnObjects: true }));

  const cell = (row, pkgId) => {
    const flag = row.marks?.[pkgId];
    let text = copy.cells?.[row.id]?.[pkgId];
    // Hàng chi phí không có chữ riêng thì lấy thẳng số từ gói.
    if (!text && row.price) text = priceOf(pkgId);
    if (flag === undefined && !text) return mark(false);
    return (
      <span className="flex gap-2">
        {flag === undefined ? null : mark(flag)}
        {text ? <span className="text-[0.82rem] leading-6 text-foreground/80">{text}</span> : null}
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
                <span className="mt-1 block text-[0.82rem] text-muted-foreground">{priceOf(p.id)}</span>
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
  // Gói miễn phí được bán ở /student-pricing, không dựng lại một trang gói nữa.
  if (pkg.freeTier) return <Navigate to={pkg.verifyHref || "/student-pricing"} replace />;

  const next = servicePackages[(index + 1) % servicePackages.length];
  const facts = [
    [stats.time, compare.cells?.time?.[pkg.id]],
    [stats.pages, compare.cells?.pages?.[pkg.id]],
    [stats.warranty, stats.warrantyValue?.[pkg.id]],
  ];

  return (
    <div className="hwagfu-copy text-foreground">
      {/* ── Đầu trang: tên gói + thẻ giá. Ảnh máy chỉ hiện từ lg — trên điện
          thoại nó đẩy giá xuống dưới màn hình đầu. ─────────────────────── */}
      <section className="relative isolate overflow-hidden px-5 pb-10 pt-24 sm:px-8 sm:pb-16 sm:pt-32">
        <Aura />
        <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-[1.02fr_.98fr]">
          <div className="min-w-0">
            <Link to="/services" className="link-more inline-flex items-center gap-2 text-sm">
              <ArrowLeft size={16} /> {c("backToAll")}
            </Link>
            <PackageName id={pkg.id} variant="lockup" as="h1" className="mt-6 block text-[clamp(2.6rem,7vw,5.5rem)]" />
            <p className="mt-4 max-w-xl text-[clamp(1.15rem,.95rem+.8vw,1.6rem)] leading-[1.2] font-medium tracking-[-.03em] text-foreground/85">
              {pkg.title}
            </p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{pkg.lede}</p>

            <div className="mt-7 max-w-xl rounded-[1.5rem] border border-border bg-card/90 p-5 backdrop-blur-md sm:p-6">
              <p className="text-xs text-muted-foreground">{c("priceLabel")}</p>
              <p className="mt-1 text-[clamp(2rem,1.6rem+1.6vw,2.8rem)] leading-none font-semibold tracking-[-.05em]">{priceRange(pkg.price)}</p>
              {pkg.noDeposit ? (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold">
                  <span aria-hidden className="material-symbols-outlined text-[16px]">verified</span>
                  {pkg.policy[1]?.title?.replace(/[.。]$/, "")}
                </p>
              ) : null}
              <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
                {facts.map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-[0.7rem] text-muted-foreground">{label}</dt>
                    <dd className="mt-0.5 text-sm leading-5 font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
              <Link to="/booking" className="btn-primary mt-5 w-full justify-center sm:w-auto">{c("discussCta")} <CalendarCheck size={17} /></Link>
            </div>
          </div>
          <div aria-hidden className="hidden lg:block">
            <PackageStill index={index} label={`${c("sampleAlt")} ${pkg.name}`} />
          </div>
        </div>
      </section>

      {/* ── Mục lục ────────────────────────────────────────── */}
      <nav aria-label={c("navLabel")} className="sticky top-16 z-20 border-y border-border bg-background/85 px-5 backdrop-blur-md sm:px-8">
        <ul className="mx-auto flex max-w-6xl gap-6 overflow-x-auto py-3.5 text-sm text-muted-foreground [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV.map(([anchor, key]) => (
            <li key={anchor} className="shrink-0">
              <a href={`#${anchor}`} className="transition-colors hover:text-foreground">{c(`nav.${key}`)}</a>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Dành cho ai ────────────────────────────────────── */}
      <Section id="audience" kicker={c("audienceKicker")} title={c("audienceTitle")} muted>
        <ul className="grid gap-3 sm:grid-cols-3">
          {pkg.audience.map((item, i) => (
            <li key={item} className="flex items-center gap-3 rounded-[1.25rem] border border-border bg-card p-4 text-sm leading-6 text-foreground/80">
              <span aria-hidden className="material-symbols-outlined grid size-9 shrink-0 place-items-center rounded-full bg-muted text-[19px] text-foreground">
                {pkg.icons.audience[i] || "person"}
              </span>
              {item}
            </li>
          ))}
        </ul>
      </Section>

      {/* ── Bao gồm ────────────────────────────────────────── */}
      <Section id="included" kicker={c("includesKicker")} title={c("includesTitle")} lede={c("includesLede")}>
        <IconList items={pkg.includes} icons={pkg.icons.includes} />
      </Section>

      {/* ── Chưa bao gồm: dịch vụ bên thứ ba khách tự trang bị + Gói Liên kết ── */}
      <Section id="not-included" kicker={c("excludesKicker")} title={c("excludesTitle")} lede={c("excludesLede")} muted>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <ul className="grid gap-x-8 border-t border-border sm:grid-cols-2">
            {pkg.excludes.map((item, i) => (
              <li key={item.title} className="flex gap-3 border-b border-border py-4">
                <span aria-hidden className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-muted-foreground">
                  {pkg.icons.excludes[i] || "remove"}
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.95rem] font-semibold tracking-[-.01em]">{item.title}</span>
                  <span className="mt-0.5 block text-sm leading-6 text-muted-foreground">{item.body}</span>
                </span>
              </li>
            ))}
          </ul>
          {findAddon("link").appliesTo.includes(pkg.id) ? (
            <AddonTile addon={findAddon("link")} />
          ) : (
            <div className="rounded-[1.25rem] border border-border bg-card p-5">
              <p className="flex items-center gap-2 text-[0.95rem] font-semibold">
                <span aria-hidden className="material-symbols-outlined text-[20px]">link</span>
                {t("servicePkg.linkIncludedNote.title")}
              </p>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{t("servicePkg.linkIncludedNote.body")}</p>
            </div>
          )}
        </div>
      </Section>

      {/* ── Bảo hành trọn đời: điều kiện + miễn trừ ───────── */}
      <Section id="warranty" kicker={c("warrantyKicker")} title={c("warrantyTitle")}>
        <IconList items={pkg.warranty} icons={pkg.icons.warranty} />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.25rem] border border-border bg-card p-5 sm:p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <span aria-hidden className="material-symbols-outlined text-[19px]">verified_user</span>
              {warrantyTerms.title}
            </h3>
            <ol className="mt-3 space-y-2.5">
              {warrantyTerms.lines.map((line, i) => (
                <li key={line} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                  <span className="w-4 shrink-0 font-semibold text-foreground">{i + 1}.</span>
                  {line}
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-[1.25rem] border border-border bg-card p-5 sm:p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <span aria-hidden className="material-symbols-outlined text-[19px]">block</span>
              {warrantyExclusions.title}
            </h3>
            <ul className="mt-3 space-y-2.5">
              {warrantyExclusions.lines.map((line) => (
                <li key={line} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                  <span aria-hidden className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-muted-foreground/70">close</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {SERVICE_ADDONS.some((a) => a.group === "care" && a.appliesTo.includes(pkg.id)) ? (
        <section className="bg-background px-5 pb-12 sm:px-8 sm:pb-20">
          <div className="mx-auto max-w-6xl">
            <h3 className="text-sm font-semibold">{t("servicePkg.addonPage.careTitle")}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICE_ADDONS.filter((a) => a.group === "care" && a.appliesTo.includes(pkg.id)).map((a) => <AddonTile key={a.id} addon={a} />)}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Góp ý và chỉnh sửa: luật nói trước để không phải từ chối lúc làm ── */}
      <Section id="feedback" kicker={feedback.kicker} title={feedback.title} lede={feedback.lede} muted>
        <IconList items={feedback.rules} icons={SHARED_ICONS.feedback} />
      </Section>

      {/* ── Cách làm việc ──────────────────────────────────── */}
      <Section kicker={c("policyKicker")} title={c("policyTitle")}>
        <IconList items={pkg.policy} icons={pkg.icons.policy} fallbackIcon="gavel" />
      </Section>

      {/* ── Gói đính kèm + đơn giá lẻ ──────────────────────── */}
      <Section id="add-ons" kicker={c("priceKicker")} title={c("priceTitle")} lede={addons.lede} muted>
        {pkg.price.factors?.length ? (
          <div className="mb-8 rounded-[1.25rem] border border-border bg-card p-5 sm:p-6">
            <p className="text-sm leading-6 text-muted-foreground">{pkg.price.note}</p>
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
