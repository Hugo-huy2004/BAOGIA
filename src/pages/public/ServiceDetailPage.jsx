import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarCheck, Check, Minus } from "lucide-react";
import { servicePackages } from "../../data/servicePackages";
import { useServiceCopy, useSharedServiceCopy } from "../../hooks/useServiceCopy";
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
const NAV = [
  ["gioi-thieu", "intro"],
  ["danh-cho", "audience"],
  ["bao-gom", "includes"],
  ["chua-bao-gom", "excludes"],
  ["bao-hanh", "warranty"],
  ["chi-phi", "price"],
];

function Section({ id, kicker, title, lede, children, muted = false }) {
  return (
    <section id={id} className={`scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24 ${muted ? "bg-band" : "bg-background"}`}>
      <div className="mx-auto max-w-6xl">
        <p className="kicker text-hue-blue">{kicker}</p>
        <h2 className="headline-section mt-3 max-w-3xl">{title}</h2>
        {lede ? <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground">{lede}</p> : null}
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

/**
 * Lưới thẻ — cho danh sách cần quét nhanh chứ không cần đọc liền mạch.
 *
 * Nền lưới là màu đường kẻ, các thẻ đè lên bằng `gap-px`, nên hàng cuối thiếu
 * thẻ sẽ lòi ra một mảng xám. Chỗ đó được lấp bằng MỘT ô mang tên gói, trải
 * hết số cột còn thiếu — hai ô giống nhau đứng cạnh nhau thì thà để trống.
 * Số cột thiếu ở bố cục 2 cột và 3 cột khác nhau nên đi qua biến CSS
 * (`.card-filler` trong hwagfu.css) thay vì lớp Tailwind động.
 */
function CardGrid({ items, icon: Icon, tone, pkgId }) {
  const fillSm = (2 - (items.length % 2)) % 2;
  const fillLg = (3 - (items.length % 3)) % 3;

  return (
    <div className="grid gap-px overflow-hidden rounded-[1.5rem] border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <article key={item.title} className="bg-card p-6">
          <Icon className={`size-4 ${tone}`} aria-hidden />
          <h3 className="mt-4 text-base font-semibold tracking-[-.02em]">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
        </article>
      ))}
      {fillSm || fillLg ? (
        <div
          aria-hidden
          className="card-filler place-items-center bg-card p-6"
          style={{
            "--fill-sm": fillSm,
            "--fill-lg": fillLg,
            "--fill-sm-display": fillSm ? "grid" : "none",
            "--fill-lg-display": fillLg ? "grid" : "none",
          }}
        >
          <PackageName id={pkgId} variant="lockup" className="text-4xl opacity-40" />
        </div>
      ) : null}
    </div>
  );
}

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const c = (key, fallback) => t(`servicePkg.detail.${key}`, fallback);
  const pkg = useServiceCopy(slug);
  const { connect, priceNotice, extraFees, studentDiscount } = useSharedServiceCopy();
  const index = servicePackages.findIndex((item) => item.slug === slug);

  useHeadMeta({
    title: pkg ? `${pkg.name} — ${pkg.title} | Hugo Studio` : c("metaFallback"),
    description: pkg?.lede || "",
    keywords: pkg ? `${pkg.name}, thiết kế website, ${pkg.title}, Hugo Studio` : "",
    canonicalUrl: pkg ? `https://www.hugowishpax.studio/services/${pkg.slug}` : "https://www.hugowishpax.studio/services",
  });

  useJsonLd("service-package-schema", useMemo(() => (pkg ? {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${pkg.name} — ${pkg.title}`,
    description: pkg.lede,
    provider: { "@type": "Organization", name: "Hugo Studio", url: "https://www.hugowishpax.studio" },
    areaServed: { "@type": "Country", name: "Vietnam" },
    url: `https://www.hugowishpax.studio/services/${pkg.slug}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "VND",
      description: `Khoảng ${pkg.price.from} – ${pkg.price.to}, báo giá chốt sau khi thống nhất phạm vi.`,
    },
  } : null), [pkg]));

  if (!pkg) return <Navigate to="/services" replace />;
  // Gói miễn phí được bán ở /student-pricing, không dựng lại một trang gói nữa.
  if (pkg.freeTier) return <Navigate to={pkg.verifyHref || "/student-pricing"} replace />;

  const next = servicePackages[(index + 1) % servicePackages.length];

  return (
    <div className="hwagfu-copy text-foreground">
      {/* ── Đầu trang: tên gói và ảnh máy đứng cạnh nhau ───── */}
      <section className="relative isolate overflow-hidden px-5 pb-16 pt-28 sm:px-8 sm:pb-20 sm:pt-32">
        <Aura />
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.02fr_.98fr] lg:gap-10">
          <div>
            <Link to="/services" className="link-more inline-flex items-center gap-2 text-sm">
              <ArrowLeft size={16} /> {c("backToAll")}
            </Link>
            <div className="mt-7">
              <PackageName id={pkg.id} prefix variant="badge" size="sm" />
            </div>
            <PackageName id={pkg.id} variant="lockup" as="h1" className="mt-6 block text-[clamp(3.2rem,7vw,6rem)]" />
            <p className="mt-6 max-w-xl text-[clamp(1.2rem,.95rem+.85vw,1.75rem)] leading-[1.18] font-medium tracking-[-.035em] text-foreground/80">
              {pkg.title}
            </p>
            <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">{pkg.lede}</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-border bg-background/70 px-5 py-3 text-sm font-semibold backdrop-blur-md">
                {`${pkg.price.from} – ${pkg.price.to}`}
              </span>
              <Link to="/booking" className="btn-primary">{c("discussCta")} <CalendarCheck size={17} /></Link>
            </div>
          </div>
          <div aria-hidden>
            <PackageStill index={index} label={`${c("sampleAlt")} ${pkg.name}`} />
          </div>
        </div>
      </section>

      {/* ── Mục lục ────────────────────────────────────────── */}
      <nav aria-label={c("navLabel")} className="border-y border-border bg-background/80 px-5 backdrop-blur-md sm:px-8">
        <ul className="mx-auto flex max-w-6xl gap-6 overflow-x-auto py-4 text-sm text-muted-foreground [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV.map(([anchor, key]) => (
            <li key={anchor} className="shrink-0">
              <a href={`#${anchor}`} className="transition-colors hover:text-foreground">{c(`nav.${key}`)}</a>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Giới thiệu ─────────────────────────────────────── */}
      <Section id="gioi-thieu" kicker={c("introKicker")} title={<PackageName id={pkg.id} variant="lockup" as="span" caption={c("introCaption")} className="block" />} muted>
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          {pkg.intro.map((paragraph) => (
            <p key={paragraph} className="text-base leading-8 text-muted-foreground">{paragraph}</p>
          ))}
        </div>
      </Section>

      {/* ── Kiểu hiển thị (chỉ gói Bio) ────────────────────── */}
      {/* ── Dành cho ai ────────────────────────────────────── */}
      <Section id="danh-cho" kicker={c("audienceKicker")} title={c("audienceTitle")}>
        <ul className="grid gap-x-12 border-t border-border sm:grid-cols-2">
          {pkg.audience.map((item) => (
            <li key={item} className="flex gap-3 border-b border-border py-5 text-sm leading-7 text-foreground/75">
              <Check className="mt-1.5 size-4 shrink-0 text-hue-blue" aria-hidden /> {item}
            </li>
          ))}
        </ul>
      </Section>

      {/* ── Bao gồm ────────────────────────────────────────── */}
      <Section id="bao-gom" kicker={c("includesKicker")} title={c("includesTitle")} lede={c("includesLede")} muted>
        <CardGrid items={pkg.includes} icon={Check} tone="text-hue-blue" pkgId={pkg.id} />
      </Section>

      {/* ── Chưa bao gồm ───────────────────────────────────── */}
      <Section id="chua-bao-gom" kicker={c("excludesKicker")} title={c("excludesTitle")} lede={c("excludesLede")}>
        <CardGrid items={pkg.excludes} icon={Minus} tone="text-muted-foreground" pkgId={pkg.id} />
        <div className="mt-8 grid gap-6 rounded-[1.5rem] border border-border bg-card p-6 sm:grid-cols-[1fr_1.4fr] sm:p-8">
          <div>
            <h3 className="text-lg font-semibold tracking-[-.02em]">{connect.name}</h3>
            <p className="mt-2 text-sm font-semibold text-hue-blue">{connect.price}</p>
          </div>
          <p className="text-sm leading-7 text-muted-foreground">{connect.body}</p>
        </div>
      </Section>

      {/* ── Bảo hành ───────────────────────────────────────── */}
      <Section id="bao-hanh" kicker={c("warrantyKicker")} title={c("warrantyTitle")} muted>
        <CardGrid items={pkg.warranty} icon={Check} tone="text-hue-blue" pkgId={pkg.id} />
      </Section>

      {/* ── Điều kiện dùng / chính sách ─────────────────────── */}
      <Section kicker={c("policyKicker")} title={c("policyTitle")}>
        <CardGrid items={pkg.policy} icon={Minus} tone="text-muted-foreground" pkgId={pkg.id} />
      </Section>

      {/* ── Chi phí ────────────────────────────────────────── */}
      <Section id="chi-phi" kicker={c("priceKicker")} title={c("priceTitle")} muted>
        <div className="grid gap-12 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            {/* Dấu gạch phải dính với con số sau, không được rơi lại cuối dòng. */}
            <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
              <strong className="text-[clamp(2.2rem,4.4vw,3.5rem)] font-semibold leading-none tracking-[-.055em]">{pkg.price.from}</strong>
              <span className="whitespace-nowrap pb-[.15em] text-[clamp(1.5rem,2.6vw,2.1rem)] font-semibold leading-none tracking-[-.05em] text-muted-foreground">
                – {pkg.price.to}
              </span>
            </div>
            <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">{pkg.price.note}</p>
            <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
              {c("priceScope")}
            </p>
            <Link to="/booking" className="btn-primary mt-8">{c("priceCta")} <ArrowRight size={17} /></Link>
            <div className="mt-8 rounded-[1.25rem] border border-border bg-card p-5">
              <p className="text-sm font-semibold tracking-[-.01em]">{studentDiscount.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{studentDiscount.body}</p>
              <Link to={studentDiscount.href} className="link-more mt-3 inline-flex items-center gap-1.5 text-sm">
                Xác minh người học <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[-.01em]">{c("priceFactors")}</p>
            <ul className="mt-5 border-t border-border">
              {pkg.price.factors.map((factor) => (
                <li key={factor} className="flex gap-3 border-b border-border py-4 text-sm leading-7 text-muted-foreground">
                  <span aria-hidden className="mt-[.7rem] size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12">
            <p className="text-sm font-semibold tracking-[-.01em]">{c("extraFeesTitle")}</p>
            <div className="mt-5 grid gap-px overflow-hidden rounded-[1.5rem] border border-border bg-border sm:grid-cols-2">
              {extraFees.map((fee) => (
                <article key={fee.title} className="bg-card p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h4 className="text-base font-semibold tracking-[-.02em]">{fee.title}</h4>
                    <span className="text-sm font-semibold text-hue-blue">{fee.price}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{fee.body}</p>
                </article>
              ))}
          </div>
        </div>

        <div className="mt-10 rounded-[1.5rem] border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold tracking-[-.01em]">{c("priceNoticeTitle")}</h3>
            <span className="text-xs text-muted-foreground">{priceNotice.updated}</span>
          </div>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 sm:gap-x-10">
            {priceNotice.lines.map((line) => (
              <li key={line} className="flex gap-2.5 text-xs leading-6 text-muted-foreground">
                <span aria-hidden className="mt-[.55rem] size-1 shrink-0 rounded-full bg-muted-foreground/60" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </Section>


      {/* ── Hỏi đáp ────────────────────────────────────────── */}
      {pkg.faq?.length ? (
        <Section kicker={c("faqKicker")} title={c("faqTitle")}>
          <div className="border-t border-border">
            {pkg.faq.map((item) => (
              <details key={item.question} className="group border-b border-border py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-semibold tracking-[-.02em]">
                  <span>{item.question}</span>
                  <span className="text-2xl font-normal text-muted-foreground transition-transform group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="mt-4 max-w-3xl pr-10 text-sm leading-7 text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </Section>
      ) : null}

      {/* ── Kết ────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-background px-5 py-24 text-center sm:px-8 sm:py-32">
        <Aura />
        <div className="relative z-10 mx-auto max-w-4xl">
          <p className="kicker text-hue-blue">{c("closingKicker")}</p>
          <h2 className="headline-section mt-3">{c("closingTitle")}<span className="headline-quiet block">{c("closingTitleQuiet")}</span></h2>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/booking" className="btn-primary">{c("closingCta")} <CalendarCheck size={17} /></Link>
            <Link to={`/services/${next.slug}`} className="btn-secondary">{c("nextPackage")} <PackageName id={next.id} size="sm" dot={false} /> <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
