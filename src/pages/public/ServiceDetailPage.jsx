import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarCheck } from "lucide-react";
import { servicePackages } from "../../data/servicePackages";
import { COMPARE_ROWS } from "../../data/serviceCompare";
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
// Gói nhận theo hồ sơ không có mức trần — chỉ in một con số, không in dấu gạch.
const priceRange = (price) => (price.to ? `${price.from} – ${price.to}` : price.from);

const NAV = [
  ["gioi-thieu", "intro"],
  ["danh-cho", "audience"],
  ["bao-gom", "includes"],
  ["chua-bao-gom", "excludes"],
  ["bao-hanh", "warranty"],
  ["chi-phi", "price"],
  ["so-sanh", "compare"],
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
/**
 * Bốn con số đầu trang: chi phí · thời gian bàn giao · số trang · bảo hành.
 *
 * Đặt ngay dưới mục lục vì đó là bốn thứ khách hỏi trước khi đọc bất cứ chữ
 * nào. Số lấy từ cùng nguồn với bảng so sánh, không chép lại lần nữa.
 */
function StatStrip({ stats, compare, pkg, price }) {
  const tiles = [
    { icon: "payments", label: stats.price, value: price },
    { icon: "schedule", label: stats.time, value: compare.cells?.time?.[pkg.id] },
    { icon: "description", label: stats.pages, value: compare.cells?.pages?.[pkg.id] },
    { icon: "build", label: stats.warranty, value: stats.warrantyValue?.[pkg.id] },
  ];
  return (
    <div className="border-b border-border bg-band px-5 py-8 sm:px-8">
      <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-[1.25rem] border border-border bg-border lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="bg-card p-5 sm:p-6">
            <span aria-hidden className="material-symbols-outlined grid size-10 place-items-center rounded-full bg-muted text-[21px] text-foreground">
              {tile.icon}
            </span>
            <dt className="mt-4 text-[0.72rem] tracking-[.02em] text-muted-foreground">{tile.label}</dt>
            <dd className="mt-1 text-[clamp(1.05rem,.8rem+.7vw,1.5rem)] leading-tight font-semibold tracking-[-.03em]">{tile.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function CardGrid({ items, icons, fallbackIcon, tone, pkgId }) {
  const fillSm = (2 - (items.length % 2)) % 2;
  const fillLg = (3 - (items.length % 3)) % 3;

  return (
    <div className="grid gap-px overflow-hidden rounded-[1.5rem] border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <article key={item.title} className="bg-card p-6">
          <span aria-hidden className={`material-symbols-outlined grid size-11 place-items-center rounded-full bg-muted text-[22px] ${tone}`}>
            {icons?.[i] || fallbackIcon}
          </span>
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
  const { connect, care, priceNotice, extraFees, studentDiscount, compare, stats } = useSharedServiceCopy();
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
      description: `${priceRange(pkg.price)} — báo giá chốt sau khi thống nhất phạm vi.`,
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
                {priceRange(pkg.price)}
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

      <StatStrip stats={stats} compare={compare} pkg={pkg} price={priceRange(pkg.price)} />

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
          {pkg.audience.map((item, i) => (
            <li key={item} className="flex items-center gap-3.5 border-b border-border py-5 text-sm leading-7 text-foreground/75">
              <span aria-hidden className="material-symbols-outlined grid size-10 shrink-0 place-items-center rounded-full bg-muted text-[21px] text-foreground">
                {pkg.icons.audience[i] || "person"}
              </span>
              {item}
            </li>
          ))}
        </ul>
      </Section>

      {/* ── Bao gồm ────────────────────────────────────────── */}
      <Section id="bao-gom" kicker={c("includesKicker")} title={c("includesTitle")} lede={c("includesLede")} muted>
        <CardGrid items={pkg.includes} icons={pkg.icons.includes} fallbackIcon="check" tone="text-foreground" pkgId={pkg.id} />
      </Section>

      {/* ── Chưa bao gồm ───────────────────────────────────── */}
      <Section id="chua-bao-gom" kicker={c("excludesKicker")} title={c("excludesTitle")} lede={c("excludesLede")}>
        <CardGrid items={pkg.excludes} icons={pkg.icons.excludes} fallbackIcon="remove" tone="text-muted-foreground" pkgId={pkg.id} />
        {pkg.connectIncluded ? null : (
          <div className="mt-8 grid gap-6 rounded-[1.5rem] border border-border bg-card p-6 sm:grid-cols-[1fr_1.4fr] sm:p-8">
            <div>
              <h3 className="text-lg font-semibold tracking-[-.02em]">{connect.name}</h3>
              <p className="mt-2 text-sm font-semibold text-hue-blue">{connect.price}</p>
            </div>
            <p className="text-sm leading-7 text-muted-foreground">{connect.body}</p>
          </div>
        )}
      </Section>

      {/* ── Bảo hành ───────────────────────────────────────── */}
      <Section id="bao-hanh" kicker={c("warrantyKicker")} title={c("warrantyTitle")} muted>
        <CardGrid items={pkg.warranty} icons={pkg.icons.warranty} fallbackIcon="check" tone="text-foreground" pkgId={pkg.id} />
        <div className="mt-8 grid gap-6 rounded-[1.5rem] border border-border bg-card p-6 sm:grid-cols-[1fr_1.4fr] sm:p-8">
          <div>
            <h3 className="text-lg font-semibold tracking-[-.02em]">{care.name}</h3>
            <p className="mt-2 text-sm font-semibold text-hue-blue">{care.price}</p>
          </div>
          <p className="text-sm leading-7 text-muted-foreground">{care.body}</p>
        </div>
      </Section>

      {/* ── Điều kiện dùng / chính sách ─────────────────────── */}
      <Section kicker={c("policyKicker")} title={c("policyTitle")}>
        <CardGrid items={pkg.policy} icons={pkg.icons.policy} fallbackIcon="gavel" tone="text-muted-foreground" pkgId={pkg.id} />
      </Section>

      {/* ── Chi phí ────────────────────────────────────────── */}
      <Section id="chi-phi" kicker={c("priceKicker")} title={c("priceTitle")} muted>
        <div className="grid gap-12 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            {/* Dấu gạch phải dính với con số sau, không được rơi lại cuối dòng. */}
            <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
              <strong className="text-[clamp(2.2rem,4.4vw,3.5rem)] font-semibold leading-none tracking-[-.055em]">{pkg.price.from}</strong>
              {pkg.price.to ? (
                <span className="whitespace-nowrap pb-[.15em] text-[clamp(1.5rem,2.6vw,2.1rem)] font-semibold leading-none tracking-[-.05em] text-muted-foreground">
                  – {pkg.price.to}
                </span>
              ) : null}
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
                {c("verifyCta")} <ArrowRight size={14} />
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

      {/* ── So sánh bốn gói ────────────────────────────────── */}
      <Section id="so-sanh" kicker={compare.kicker} title={compare.title} lede={compare.lede} muted>
        <CompareTable copy={compare} currentId={pkg.id} />
      </Section>

      {/* ── Kết ────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-background px-5 py-24 text-center sm:px-8 sm:py-32">
        <Aura />
        <div className="relative z-10 mx-auto max-w-4xl">
          <p className="kicker text-hue-blue">{c("closingKicker")}</p>
          <h2 className="headline-section mt-3">{c("closingTitle")}<span className="headline-quiet block">{c("closingTitleQuiet")}</span></h2>
          <ul className="mx-auto mt-9 flex max-w-3xl flex-col items-start gap-3 text-left sm:flex-row sm:justify-center sm:gap-7">
            {c("guarantees", { returnObjects: true }).map((text, i) => (
              <li key={text} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <span aria-hidden className="material-symbols-outlined grid size-9 shrink-0 place-items-center rounded-full bg-muted text-[19px] text-foreground">
                  {["code", "lock", "build"][i]}
                </span>
                {text}
              </li>
            ))}
          </ul>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/booking" className="btn-primary">{c("closingCta")} <CalendarCheck size={17} /></Link>
            <Link to={`/services/${next.slug}`} className="btn-secondary">{c("nextPackage")} <PackageName id={next.id} size="sm" dot={false} /> <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
