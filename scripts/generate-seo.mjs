/**
 * Post-build SEO generator.
 *
 * Crawlers that do not execute JavaScript (Bing, Facebook/Zalo link preview,
 * GPTBot, PerplexityBot, ClaudeBot) only ever see dist/index.html, whose #root
 * contains nothing but the splash spinner. This writes a real static HTML file
 * per public route so those crawlers get a title, a description and actual
 * body copy. React's createRoot() wipes the static block on mount, so the
 * interactive app is unchanged.
 *
 * All copy comes from src/i18n/locales/vi/translation.json — the author's own
 * strings. Nothing here writes marketing copy or prices; prices are read from
 * servicePkg.items.*.price — the SAME source the live /services page renders —
 * so what a crawler is told can never drift from what a visitor is shown.
 *
 * (Trước 2026-09-23 phần này đọc `servicesPage.plans`, một bảng giá cũ không
 * còn hiển thị ở đâu. Google, xem trước liên kết Zalo/Facebook và các bot AI
 * vì thế quảng cáo "Website Một Trang 1.490.000đ" trong khi trang thật báo
 * 1.900.000 – 3.900.000₫. Đừng nối lại nguồn cũ đó.)
 *
 * Outputs: dist/<route>/index.html, dist/sitemap.xml, dist/llms.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PUBLIC_TOOLS } from "../src/config/publicTools.js";
import { priceCurrency, servicePackages } from "../src/data/servicePackages.js";
import { SERVICE_ADDONS, addonPath } from "../src/data/serviceAddons.js";
import { projects } from "../src/data/projects.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const ORIGIN = "https://www.hugowishpax.studio";

/** Bốn gói kèm giá, đọc từ cùng nguồn với trang thật. Gói báo giá riêng không
 *  có mức trần nên chỉ in một con số. */
// Chỉ đọc SỐ ĐẦU TIÊN: bản en/zh ghi "₫5,690,000 (≈ $219)" — gộp mọi chữ số sẽ ra 5690000219.
const digitsOf = (display) => {
  const m = String(display || "").match(/\d[\d.,\s]*\d|\d/);
  return m ? Number(m[0].replace(/[^\d]/g, "")) : undefined;
};

const planList = (tr) =>
  servicePackages.map((pkg) => {
    const price = tr.servicePkg.items[pkg.id].price;
    return {
      name: `${pkg.name} — ${tr.servicePkg.items[pkg.id].title}`,
      price: price.to ? `${price.from} – ${price.to}` : price.from,
      // Gói miễn phí có `to` là thời hạn ("365 ngày"), không phải tiền — đọc nó
      // như một con số sẽ kéo sập khoảng giá của cả trang.
      free: !!pkg.freeTier,
      // Một dòng phạm vi cho llms.txt: thời gian · số trang · bảo hành.
      scope: [
        tr.servicePkg.compare.cells.time?.[pkg.id],
        tr.servicePkg.compare.cells.pages?.[pkg.id],
        tr.servicePkg.stats.warrantyValue?.[pkg.id],
      ].filter(Boolean).join(" · "),
      min: pkg.freeTier ? 0 : digitsOf(price.from),
      max: pkg.freeTier ? 0 : digitsOf(price.to) || digitsOf(price.from),
    };
  });


/**
 * Dựng toàn bộ trang tĩnh cho MỘT ngôn ngữ.
 *
 * Tiếng Việt ở gốc (`/services`), hai thứ tiếng còn lại có tiền tố
 * (`/en/services`, `/zh/services`). Mỗi trang mang thẻ hreflang trỏ sang hai
 * bản kia để Google hiểu đó là cùng một nội dung ở ngôn ngữ khác, chứ không
 * phải ba trang trùng lặp.
 */
const LOCALES = [
  { code: "vi", prefix: "" },
  { code: "en", prefix: "/en" },
  { code: "zh", prefix: "/zh" },
];

const OG_LOCALE = { vi: "vi_VN", en: "en_US", zh: "zh_CN" };
// x-default là trang cho người đọc không khớp ngôn ngữ nào: khách quốc tế →
// bản tiếng Anh nếu trang đó có bản tiếng Anh, nếu không thì bản gốc tiếng Việt.
const xDefault = (p) => ((publishedLocalePaths.get(p) || LOCALES).some((l) => l.code === "en") ? `/en${p}` : p);

// Filled before writing pages. A locale with untranslated copy is deliberately
// not published, so it must not appear in any hreflang cluster either.
let publishedLocalePaths = new Map();

const template = fs.readFileSync(path.join(DIST, "index.html"), "utf8");

function buildLocale(lang, prefix, { emit = true, only = null } = {}) {
  const t = JSON.parse(
      fs.readFileSync(path.join(ROOT, `src/i18n/locales/${lang}/translation.json`), "utf8"),
    );

  /** "Từ 1.490.000đ" → 1490000. Schema.org needs a number, not the display string. */
  /** Số tiền máy đọc cho một gói: 0 nếu miễn phí, mức sàn nếu là khoảng. */
  const offerAmount = (plan) => (plan.free ? 0 : plan.min);

  const esc = (s) =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  /** Tên gói + giá, lấy đúng nguồn mà trang /services đang hiển thị. */
  const plans = planList(t);

  const faqs = (t.faqPage.faqs || []).map(({ question, answer }) => ({ question, answer }));
  // Gói người học nay MIỄN PHÍ, cộng ưu đãi 15% cho ba gói trả phí — không còn
  // bảng giá coursework riêng.
  const edu = t.servicePkg.items["hugo-edu-plus"];
  const studentPlans = [
    { name: `Hugo Edu+ — ${edu.title}`, price: edu.price.from },
    { name: t.servicePkg.studentDiscount.title, price: t.servicePkg.studentDiscount.body },
  ];

  // ── Routes ────────────────────────────────────────────────────────────────────
  // `body` returns the static block injected into #root. Keep it to real copy the
  // author already wrote plus internal links — thin templated filler is what gets
  // a site classified as doorway pages.
  const GATE_NOTE = {
    open: "Dùng tự do, không cần tài khoản.",
    level: "Chơi ngay không cần tài khoản. Mở màn mới cần tài khoản sinh viên Hugo Studio.",
    result: "Dùng thử không cần tài khoản. Để nhận và lưu kết quả, cần tài khoản đã xác minh email học sinh/sinh viên.",
  };

  const routes = [
    {
      path: "/introduction",
      title: t.intro.cine.meta.title,
      description: t.intro.cine.meta.description,
      keywords: t.intro.cine.meta.keywords,
      body: () =>
        `<h1>${esc(t.intro.cine.heroTitle1)} ${esc(t.intro.cine.heroTitle2)}</h1>` +
        `<p>${esc(t.intro.cine.heroDesc)}</p>` +
        `<h2>${esc(t.intro.cine.work.title)}</h2><p>${esc(t.intro.cine.work.desc)}</p>` +
        `<p><a href="${prefix}/project">${esc(t.projectsPage.title)}</a> · <a href="${prefix}/services">${esc(h1of(t.servicesPage.meta.title))}</a></p>`,
    },
    {
      path: "/services",
      title: t.servicesPage.meta.title,
      description: t.servicesPage.meta.description,
      keywords: t.servicesPage.meta.keywords,
      body: () =>
        `<h1>${esc(h1of(t.servicesPage.meta.title))}</h1>` +
        `<p>${esc(t.servicesPage.meta.description)}</p>` +
        `<ul>${plans.map((p) => `<li>${esc(p.name)} — ${esc(p.price)}</li>`).join("")}</ul>`,
      extraSchema: () => {
        // Khoảng giá của cả studio: sàn thấp nhất tới TRẦN cao nhất, bỏ gói miễn phí.
        const paid = plans.filter((p) => !p.free && p.min);
        const amounts = [...paid.map((p) => p.min), ...paid.map((p) => p.max)];
        return [
          {
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            "@id": `${ORIGIN}/#studio`,
            name: "Hugo Studio",
            url: `${ORIGIN}/services`,
            image: `${ORIGIN}/og-image.png`,
            description: t.servicesPage.meta.description,
            // Mọi bản đều niêm yết VNĐ; en/zh kèm "≈ $…" tham khảo cho khách nước ngoài.
            ...(lang === "vi" ? { areaServed: { "@type": "Country", name: "Việt Nam" } } : {}),
            availableLanguage: ["vi", "en", "zh"],
            priceRange: `${Math.min(...amounts).toLocaleString("vi-VN")}₫ – ${Math.max(...amounts).toLocaleString("vi-VN")}₫`,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Hugo Studio", item: `${ORIGIN}/introduction` },
              { "@type": "ListItem", position: 2, name: "Dịch vụ & báo giá", item: `${ORIGIN}/services` },
            ],
          },
        ];
      },
      schema: () => ({
        "@context": "https://schema.org",
        "@type": "Service",
        name: lang === "en" ? "Freelance website and landing page development" : "Thiết kế website",
        provider: lang === "en"
          ? { "@type": "Person", name: "Hugo Wishpax", jobTitle: "Freelance Web Developer", url: `${ORIGIN}/en/introduction` }
          : { "@type": "Organization", name: "Hugo Studio", url: ORIGIN },
        ...(lang === "en" ? {} : { areaServed: { "@type": "Country", name: "Vietnam" } }),
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Bảng giá dịch vụ website",
          itemListElement: plans.map((p) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: p.name },
            priceCurrency: priceCurrency(lang),
            description: p.price,
            priceSpecification: {
              "@type": "PriceSpecification",
              priceCurrency: priceCurrency(lang),
              price: offerAmount(p),
              valueAddedTaxIncluded: true,
            },
          })),
        },
      }),
    },
    {
      path: "/faq",
      title: t.faqPage.meta.title,
      description: t.faqPage.meta.description,
      body: () =>
        `<h1>${esc(t.faqPage.header.title1)} ${esc(t.faqPage.header.title2)}</h1>` +
        `<p>${esc(t.faqPage.header.desc)}</p>` +
        faqs.map((f) => `<h2>${esc(f.question)}</h2><p>${esc(f.answer)}</p>`).join(""),
      schema: () => ({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }),
    },
    {
      path: "/booking",
      title: t.bookingPage.meta.title,
      description: t.bookingPage.meta.description,
      body: () =>
        `<h1>${esc(t.bookingPage.header.title)}</h1><p>${esc(t.bookingPage.header.desc)}</p>`,
    },
    {
      // Quyền lợi HSSV (/student-benefits cũ) đã gộp vào trang này.
      path: "/student-pricing",
      title: t.studentBenefitsPage.metaTitle,
      description: t.studentBenefitsPage.metaDesc,
      keywords:
        "bảng giá sinh viên, quyền lợi HSSV, trang Bio sinh viên, email edu, liêm chính học thuật",
      body: () =>
        `<h1>${esc(h1of(t.studentBenefitsPage.metaTitle))}</h1>` +
        `<p>${esc(t.studentBenefitsPage.desc)}</p>` +
        `<p>${esc("Các gói dịch vụ được trình bày cùng điều kiện xác minh và phạm vi hỗ trợ rõ ràng.")}</p>` +
        `<ul>${studentPlans.map((p) => `<li>${esc(p.name)} — ${esc(p.price)}</li>`).join("")}</ul>`,
    },
    {
      path: "/privacy-policy",
      title: "Chính Sách Bảo Mật | Hugo Studio",
      description:
        "Tìm hiểu cách Hugo Studio thu thập, xử lý và bảo vệ dữ liệu cá nhân, cùng ranh giới trách nhiệm với các dịch vụ bên thứ ba.",
      body: () =>
        `<h1>Chính sách bảo mật</h1>` +
        `<p>${esc("Tài liệu trình bày dữ liệu được xử lý, quyền của người dùng và các biện pháp bảo vệ tài khoản.")}</p>`,
    },
    {
      path: "/terms",
      title: "Điều Khoản Sử Dụng | Hugo Studio",
      description:
        "Điều kiện sử dụng Hugo Studio: tài khoản và độ tuổi, nội dung bạn đăng, quy trình gỡ nội dung vi phạm bản quyền, điểm JOY, dịch vụ trả phí và giới hạn trách nhiệm.",
      body: () =>
        `<h1>Điều khoản sử dụng</h1>` +
        `<p>${esc("Phạm vi dịch vụ, quyền với nội dung người dùng đăng tải, quy trình báo cáo vi phạm bản quyền, quy định về JOY và thanh toán.")}</p>`,
    },
    {
      path: "/user-guide",
      title: "Hướng Dẫn Sử Dụng Hugo Studio | Bio, JOY Và Tiện Ích",
      description:
        "Tài liệu sử dụng Hugo Studio: tạo trang Bio, quản lý tài khoản, dùng JOY, đặt lịch, bảo mật dữ liệu và xử lý các sự cố thường gặp.",
      body: () =>
        `<h1>Hướng dẫn sử dụng Hugo Studio</h1>` +
        `<p>${esc("Tìm hiểu cách tạo trang Bio, quản lý tài khoản, dùng JOY, đặt lịch và xử lý các tình huống thường gặp.")}</p>`,
    },
  ];

  // Trang dự án: một trang chỉ mục + một trang cho mỗi dự án. Danh sách lấy
  // từ src/data/projects.js, cùng nguồn với trang React — thêm dự án ở đó là
  // đủ, tệp này không phải sửa.
  routes.push({
    path: "/project",
    title: t.projectsPage.metaTitle,
    description: t.projectsPage.metaDescription,
    priority: "0.8",
    body: () =>
      `<h1>${esc(t.projectsPage.title)}</h1>` +
      projects
        .map(
          (pr) =>
            `<h2><a href="${prefix}/project/${pr.id}">${esc(pr.title)}</a></h2><p>${esc(item(pr.id, "tagline", pr.tagline))}</p>`,
        )
        .join(""),
    schema: () => ({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: t.projectsPage.metaTitle,
      url: `${ORIGIN}${prefix}/project`,
      hasPart: projects.map((pr) => ({
        "@type": "CreativeWork",
        name: pr.title,
        abstract: item(pr.id, "tagline", pr.tagline),
        url: `${ORIGIN}${prefix}/project/${pr.id}`,
      })),
    }),
  });

  // `kind` là MÃ ("personal" | "client" | "live") và `period` chứa chỗ trống
  // `{now}` — cả hai chỉ thành chữ đọc được khi qua i18n. Trang tĩnh này không
  // chạy React nên phải tự dịch, nếu không Google đọc được đúng chữ "personal"
  // và "{now}" trong thẻ mô tả.
  // Thẻ mô tả bị Google cắt quanh mốc 200 — tóm tắt dự án dài hơn thế, nên
  // lấy trọn số câu vừa khít thay vì cắt cụt giữa câu bằng dấu ba chấm.
  const clampSentences = (text, max = 195) => {
    if (text.length <= max) return text;
    let out = "";
    for (const piece of text.split(/(?<=[.!?。！？])\s+/)) {
      if ((out + (out ? " " : "") + piece).length > max) break;
      out += (out ? " " : "") + piece;
    }
    // Một câu đầu quá ngắn thì thẻ mô tả rơi xuống dưới ngưỡng 70: thà cắt ở
    // ranh giới từ cho đủ dài, vì Google cũng cắt tiếp theo bề rộng.
    if (out.length >= 70) return out;
    return text.slice(0, max).replace(/\s+\S*$/, "");
  };
  const item = (id, key, fallback) => t.projectsPage?.items?.[id]?.[key] ?? fallback;
  const kindLabel = (code) => t.projectsPage?.kinds?.[code] || code;
  const periodText = (period) => String(period).replace("{now}", t.projectsPage?.periodNow || "nay");

  for (const pr of projects) {
    routes.push({
      path: `/project/${pr.id}`,
      title: `${pr.title} — ${t.projectsPage.kicker} · Hugo Studio`,
      description: clampSentences(item(pr.id, "summary", pr.summary)),
      priority: "0.6",
      body: () =>
        `<h1>${esc(pr.title)}</h1><p>${esc(item(pr.id, "summary", pr.summary))}</p>` +
        `<p>${esc(kindLabel(pr.kind))} · ${esc(item(pr.id, "role", pr.role))} · ${esc(periodText(pr.period))}</p>` +
        item(pr.id, "highlights", pr.highlights)
          .map((h) => `<h2>${esc(h.title)}</h2><p>${esc(h.body)}</p>`)
          .join(""),
      schema: () => ({
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: pr.title,
        abstract: item(pr.id, "tagline", pr.tagline),
        description: item(pr.id, "summary", pr.summary),
        url: `${ORIGIN}/project/${pr.id}`,
        ...(pr.url ? { sameAs: [pr.url] } : {}),
        author: { "@type": "Person", name: "Hugo Wishpax" },
      }),
    });
  }

  // Trang từng gói trả phí: trước đây chỉ có bản SPA, nên Google và bot AI đọc
  // được đúng cái khung rỗng. Chữ lấy từ cùng servicePkg.* mà trang thật render.
  for (const pkg of servicePackages.filter((p) => !p.freeTier)) {
    const it = t.servicePkg.items[pkg.id];
    const cells = t.servicePkg.compare.cells;
    const price = it.price.to ? `${it.price.from} – ${it.price.to}` : it.price.from;
    const facts = [
      [t.servicePkg.stats.price, price],
      [t.servicePkg.stats.time, cells.time[pkg.id]],
      [t.servicePkg.stats.pages, cells.pages[pkg.id]],
      [t.servicePkg.stats.warranty, t.servicePkg.stats.warrantyValue[pkg.id]],
    ];
    const includes = [t.servicePkg.handCoded, ...it.includes, ...t.servicePkg.includesTail];
    routes.push({
      path: `/services/${pkg.slug}`,
      title: it.seo?.title || `${pkg.name} — ${it.title} | Hugo Studio`,
      description: it.seo?.description || `${it.lede} ${price}.`,
      keywords: it.seo?.keywords || `${pkg.name}, ${t.servicesPage.meta.keywords}`,
      body: () =>
        `<h1>${esc(pkg.name)} — ${esc(it.title)}</h1><p>${esc(it.lede)}</p>` +
        `<ul>${facts.map(([k, v]) => `<li>${esc(k)}: ${esc(v)}</li>`).join("")}</ul>` +
        `<h2>${esc(t.servicePkg.detail.includesTitle)}</h2>` +
        `<ul>${includes.map((x) => `<li><strong>${esc(x.title)}</strong> ${esc(x.body)}</li>`).join("")}</ul>` +
        `<h2>${esc(t.servicePkg.detail.priceTitle)}</h2><p>${esc(it.price.note)}</p>` +
        `<h2>${esc(t.servicePkg.detail.extraFeesTitle)}</h2>` +
        `<ul>${SERVICE_ADDONS.map((ad) => { const b = t.servicePkg.addonItems[ad.id]; return `<li><a href="${prefix}${addonPath(ad)}">${esc(b.name)}</a> (${esc(b.for)}): ${esc(b.price)}</li>`; }).join("")}</ul>` +
        `<h2>${esc(t.servicePkg.detail.unitsTitle)}</h2>` +
        `<ul>${t.servicePkg.addons.units.map((u) => `<li>${esc(u.title)}: ${esc(u.price)}</li>`).join("")}</ul>` +
        `<h2>${esc(t.servicePkg.detail.excludesTitle)}</h2>` +
        `<ul>${t.servicePkg.excludes.map((x) => `<li><strong>${esc(x.title)}</strong> ${esc(x.body)}</li>`).join("")}</ul>` +
        `<h2>${esc(t.servicePkg.warrantyTerms.title)}</h2>` +
        `<ul>${t.servicePkg.warrantyTerms.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` +
        `<h2>${esc(t.servicePkg.warrantyExclusions.title)}</h2>` +
        `<ul>${t.servicePkg.warrantyExclusions.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` +
        `<h2>${esc(t.servicePkg.feedback.title)}</h2>` +
        `<ul>${t.servicePkg.feedback.rules.map((r) => `<li><strong>${esc(r.title)}</strong> ${esc(r.body)}</li>`).join("")}</ul>` +
        (it.faq || []).map((f) => `<h2>${esc(f.question)}</h2><p>${esc(f.answer)}</p>`).join("") +
        `<p><a href="${prefix}/booking">${esc(t.servicePkg.detail.closingCta)}</a> · <a href="${prefix}/services">${esc(t.servicePkg.detail.backToAll)}</a></p>`,
      schema: () => ({
        "@context": "https://schema.org",
        "@type": "Service",
        name: `${pkg.name} — ${it.title}`,
        description: it.lede,
        provider: { "@id": `${ORIGIN}/#studio` },
        url: `${ORIGIN}${prefix}/services/${pkg.slug}`,
        offers: {
          "@type": "Offer",
          priceCurrency: priceCurrency(lang),
          description: price,
          ...(digitsOf(it.price.from) ? { price: digitsOf(it.price.from) } : {}),
        },
      }),
      extraSchema: () => (it.faq?.length
        ? [{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: it.faq.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          }]
        : []),
    });
  }

  // Trang từng gói lẻ /services/add-ons/<slug>: link Hugo copy gửi khách, nên bot và
  // xem trước liên kết Zalo/Facebook phải đọc được đủ giá và điều khoản.
  for (const ad of SERVICE_ADDONS) {
    const b = t.servicePkg.addonItems[ad.id];
    const pg = t.servicePkg.addonPage;
    const li = (arr) => `<ul>${arr.map((x) => `<li>${typeof x === "string" ? esc(x) : `<strong>${esc(x.title)}</strong> ${esc(x.body || x.price || "")}`}</li>`).join("")}</ul>`;
    routes.push({
      path: addonPath(ad),
      title: b.seo?.title || `${b.name} — ${b.price} | Hugo Studio`,
      keywords: b.seo?.keywords,
      // Mô tả đầy đủ quá 200 (chữ Hán tính 2) thì rút về câu "cần khi nào" + giá.
      description: b.seo?.description || ([...`${b.when} ${b.lede}`].reduce((n, ch) => n + (/[\u3000-\u9fff\uff00-\uffef]/.test(ch) ? 2 : 1), 0) <= 200
        ? `${b.when} ${b.lede}`
        : `${b.when} ${pg.priceLabel}: ${b.price}.`),
      body: () =>
        `<h1>${esc(b.name)}</h1><p>${esc(b.when)}</p><p>${esc(b.lede)}</p>` +
        `<p>${esc(pg.priceLabel)}: ${esc(b.price)}${b.priceNote ? ` — ${esc(b.priceNote)}` : ""} · ${esc(pg.timeLabel)}: ${esc(b.time)} · ${esc(pg.periodLabel)}: ${esc(b.warranty.period)}</p>` +
        `<h2>${esc(pg.includesTitle)}</h2>${li(b.includes)}` +
        `<h2>${esc(pg.stepsTitle)}</h2>${li(b.steps || [])}` +
        `<h2>${esc(pg.excludesTitle)}</h2>${li(b.excludes)}` +
        `<h2>${esc(pg.priceTitle)}</h2>${li(b.priceRows || [{ title: b.name, price: b.price }])}` +
        (b.extras?.length ? `<h2>${esc(pg.extrasTitle)}</h2>${li(b.extras)}` : "") +
        `<h2>${esc(pg.warrantyTitle)}</h2>${li(b.warranty.lines)}` +
        `<h2>${esc(pg.exclusionsTitle)}</h2>${li(b.exclusions)}` +
        `<p><a href="${prefix}/booking">${esc(pg.cta)}</a> · <a href="${prefix}/services">${esc(pg.back)}</a></p>`,
      schema: () => ({
        "@context": "https://schema.org",
        "@type": "Service",
        name: b.name,
        description: b.lede,
        provider: { "@id": `${ORIGIN}/#studio` },
        url: `${ORIGIN}${prefix}${addonPath(ad)}`,
        offers: { "@type": "Offer", priceCurrency: priceCurrency(lang), description: b.price, ...(digitsOf(b.price) && !/%/.test(b.price) ? { price: digitsOf(b.price) } : {}) },
      }),
    });
  }

  // Every standalone app gets its own indexable page. Adding a tool to the
  // registry in src/config/publicTools.js is enough — nothing here needs editing.
  for (const [slug, tool] of Object.entries(PUBLIC_TOOLS)) {
    routes.push({
      path: `/${slug}`,
      title: tool.title,
      description: tool.description,
      priority: "0.7",
      body: () =>
        `<h1>${esc(tool.heading)}</h1><p>${esc(tool.summary)}</p>` +
        `<p>${esc(GATE_NOTE[tool.gate])}</p>`,
      schema: () => ({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: tool.heading,
        url: `${ORIGIN}/${slug}`,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web",
        browserRequirements: "Requires JavaScript",
        description: tool.description,
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: 0, priceCurrency: "VND" },
        publisher: { "@id": `${ORIGIN}/#studio` },
      }),
    });
  }

  // ── Per-route static HTML ─────────────────────────────────────────────────────
  const navLabels = {
    vi: ["Giới thiệu", "Dịch vụ & báo giá", "Câu hỏi thường gặp", "Đặt lịch", "Quyền lợi sinh viên", "Hướng dẫn"],
    en: ["About", "Services & pricing", "FAQ", "Start a conversation", "Student benefits", "User guide"],
    zh: ["介绍", "服务与价格", "常见问题", "开始沟通", "学生权益", "使用指南"],
  }[lang];
  const NAV = `<nav style="margin-top:2.5rem;display:flex;flex-wrap:wrap;gap:1rem;font-size:0.9rem"><a href="${prefix}/introduction">${navLabels[0]}</a><a href="${prefix}/services">${navLabels[1]}</a><a href="${prefix}/faq">${navLabels[2]}</a><a href="${prefix}/booking">${navLabels[3]}</a><a href="${prefix}/student-pricing">${navLabels[4]}</a><a href="${prefix}/user-guide">${navLabels[5]}</a></nav>`;

  // Scoped so it cannot leak into the React tree that replaces this block.
  const BLOCK_CSS =
    `<style>#seo-static h1{font-size:clamp(1.75rem,5vw,2.75rem);font-weight:800;letter-spacing:-.02em;margin:0 0 1rem}` +
    `#seo-static h2{font-size:1.1rem;font-weight:700;margin:1.75rem 0 .5rem}` +
    `#seo-static p{margin:0 0 1rem;opacity:.85}` +
    `#seo-static ul{margin:1rem 0;padding-left:1.25rem}#seo-static li{margin:.35rem 0}` +
    `#seo-static a{color:inherit;text-decoration:underline;text-underline-offset:3px}</style>`;

  /** Page titles carry a " | Hugo Studio" suffix for SERPs; an <h1> should not. */
  const h1of = (title) => title.split("|")[0].trim();

  const replaceTag = (html, re, next) => {
    if (!re.test(html)) throw new Error(`SEO template no longer contains ${re}`);
    return html.replace(re, next);
  };

  for (const r of (emit ? routes : []).filter((r) => !only || only.has(r.path))) {
    const url = ORIGIN + prefix + r.path;
    let html = template.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`);

    // hreflang: ba bản của cùng một trang chỉ vào nhau, bản tiếng Việt là mặc
    // định. Thiếu khối này, Google coi ba trang là nội dung trùng lặp và chỉ
    // giữ lại một.
    const alternates = (publishedLocalePaths.get(r.path) || LOCALES)
      .map(({ code, prefix: p }) => `<link rel="alternate" hreflang="${code}" href="${ORIGIN}${p}${r.path}" />`)
      .join("\n    ") + `\n    <link rel="alternate" hreflang="x-default" href="${ORIGIN}${xDefault(r.path)}" />`;

    html = replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(r.title)}</title>`);
    // og:locale theo đúng ngôn ngữ trang — trước đây mọi bản đều khai vi_VN.
    html = replaceTag(html, /<meta property="og:locale" content="[^"]*" \/>/, `<meta property="og:locale" content="${OG_LOCALE[lang]}" />`);
    html = replaceTag(
      html,
      /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/>/,
      `<meta name="description" content="${esc(r.description)}" />`,
    );
    if (r.keywords) {
      html = replaceTag(
        html,
        /<meta\s+name="keywords"\s+content="[\s\S]*?"\s*\/>/,
        `<meta name="keywords" content="${esc(r.keywords)}" />`,
      );
    }
    html = replaceTag(
      html,
      /<link rel="canonical" href="[^"]*" \/>/,
      `<link rel="canonical" href="${url}" />\n    ${alternates}`,
    );
    for (const [prop, val] of [
      ["og:title", r.title],
      ["og:description", r.description],
      ["og:url", url],
      ["og:image:alt", r.title],
    ]) {
      html = replaceTag(
        html,
        new RegExp(`<meta property="${prop}" content="[\\s\\S]*?" />`),
        `<meta property="${prop}" content="${esc(val)}" />`,
      );
    }
    for (const [name, val] of [
      ["twitter:title", r.title],
      ["twitter:description", r.description],
      ["twitter:image:alt", r.title],
    ]) {
      html = replaceTag(
        html,
        new RegExp(`<meta name="${name}" content="[\\s\\S]*?" />`),
        `<meta name="${name}" content="${esc(val)}" />`,
      );
    }
    const pageSchema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": `${url}#webpage`,
          url,
          name: r.title,
          description: r.description,
          inLanguage: lang,
          isPartOf: { "@id": `${ORIGIN}/#website` },
          about: { "@id": `${ORIGIN}/#organization` },
          author: {
            "@type": "Person",
            "@id": `${ORIGIN}/#hugo`,
            name: "Hugo Wishpax",
            ...(lang === "en" ? { jobTitle: "Freelance Web Developer" } : {}),
          },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Hugo Studio",
              item: `${ORIGIN}${prefix}/introduction`,
            },
            ...(r.path === "/introduction"
              ? []
              : [
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: h1of(r.title),
                    item: url,
                  },
                ]),
          ],
        },
      ],
    };
    html = html.replace(
      "</head>",
      `<script type="application/ld+json">${JSON.stringify(pageSchema)}</script>\n</head>`,
    );
    for (const schema of [r.schema?.(), ...(r.extraSchema?.() ?? [])].filter(Boolean)) {
      html = html.replace(
        "</head>",
        `<script type="application/ld+json">${JSON.stringify(schema)}</script>\n</head>`,
      );
    }

    // Replace the splash spinner with visible static copy. The splash paints fast
    // but is not content, so LCP waited ~4.3s for React to mount and render the
    // then swaps in the interactive version via createRoot(). Crawlers that never
    // run JS get the same copy. dist/index.html keeps the splash — it is the SPA
    // fallback for /member/*, where there is no static copy to show.
    const block =
      `<div id="seo-static" style="max-width:52rem;margin:0 auto;padding:clamp(1.5rem,6vw,4rem) 1.25rem;font-family:'Plus Jakarta Sans',system-ui,sans-serif;line-height:1.6">` +
      `${r.body()}${NAV}</div>${BLOCK_CSS}`;
    html = replaceTag(
      html,
      /<div id="root">[\s\S]*?<!-- Main Module script entry point -->/,
      `<div id="root">${block}</div>\n\n    <!-- Main Module script entry point -->`,
    );

    const out = path.join(DIST, (prefix + r.path).replace(/^\//, ""));
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, "index.html"), html);
  }

  return routes;
}

// ── sitemap.xml ───────────────────────────────────────────────────────────────
// Chỉ xuất bản một trang ở ngôn ngữ khác khi nội dung THẬT SỰ khác bản tiếng
// Việt. Trang chưa dịch mà vẫn đẻ ra /en/... thì đó là nội dung trùng lặp:
// Google gộp lại và có khi bỏ qua cả hai, còn người đọc bấm vào "English" lại
// thấy tiếng Việt.
const drafts = LOCALES.map(({ code, prefix }) => ({
  code,
  prefix,
  routes: buildLocale(code, prefix, { emit: false }),
}));
const viRoutes = drafts.find(({ code }) => code === "vi").routes;
const viCopy = new Map(viRoutes.map((r) => [r.path, `${r.title}|${r.description}`]));
const perLocale = drafts.map(({ code, prefix, routes: localeRoutes }) => ({
  code,
  prefix,
  routes: code === "vi"
    ? localeRoutes
    : localeRoutes.filter((r) => viCopy.get(r.path) !== `${r.title}|${r.description}`),
}));
publishedLocalePaths = new Map(
  viRoutes.map((r) => [
    r.path,
    perLocale.filter(({ routes: localeRoutes }) => localeRoutes.some((candidate) => candidate.path === r.path)),
  ]),
);
for (const { code, prefix, routes: localeRoutes } of perLocale) {
  buildLocale(code, prefix, { only: new Set(localeRoutes.map((r) => r.path)) });
}
const routes = perLocale[0].routes;
// Sitemap liệt kê cả ba bản; mỗi mục kèm hreflang để Google nhóm chúng lại.
const urls = perLocale
  .flatMap(({ prefix, routes: rs }) => rs.map((r) => ({ ...r, path: prefix + r.path, base: r.path })))
  .sort((a, b) => a.path.localeCompare(b.path));
fs.writeFileSync(
  path.join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    urls
      .map((u) =>
        `  <url>\n    <loc>${ORIGIN}${u.path}</loc>\n` +
        (publishedLocalePaths.get(u.base) || LOCALES).map(({ code, prefix }) =>
          `    <xhtml:link rel="alternate" hreflang="${code}" href="${ORIGIN}${prefix}${u.base}"/>`).join("\n") +
        `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${xDefault(u.base)}"/>` +
        `\n  </url>`)
      .join("\n") +
    `\n</urlset>\n`,
);

// ── llms.txt ──────────────────────────────────────────────────────────────────
// Plain-text summary for AI answer engines. Same authored strings, no spin.
// Keep the personal portfolio and Hugo Studio explicitly connected: one is the
// engineer; the other is the product lab and portfolio behind the work.
// `plans`/`faqs` sống trong buildLocale nên phải dựng lại ở đây.
const tVI = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/i18n/locales/vi/translation.json"), "utf8"),
);
const plans = planList(tVI);
const faqs = (tVI.faqPage.faqs || []).map(({ question, answer }) => ({ question, answer }));
// Bản tiếng Anh cho trợ lý AI khi khách quốc tế hỏi — cùng nguồn trang /en (VNĐ, kèm USD tham khảo).
const tEN = JSON.parse(fs.readFileSync(path.join(ROOT, "src/i18n/locales/en/translation.json"), "utf8"));
const enPricing =
  `## Pricing in English (for clients outside Vietnam; prices in VND, US$ figures approximate)\n\n` +
  servicePackages.filter((p) => !p.freeTier).map((p) => {
    const it = tEN.servicePkg.items[p.id];
    const price = it.price.to ? `${it.price.from} – ${it.price.to}` : it.price.from;
    return `- [${p.name}](${ORIGIN}/en/services/${p.slug}): ${price} — ${it.seo?.description || it.lede}`;
  }).join("\n") + "\n\n" +
  `### Add-ons\n\n` +
  SERVICE_ADDONS.map((ad) => {
    const b = tEN.servicePkg.addonItems[ad.id];
    return `- [${b.name}](${ORIGIN}/en${addonPath(ad)}) (${b.for}): ${b.price} — ${b.when} Warranty: ${b.warranty.period}.`;
  }).join("\n") + "\n\n" +
  `### ${tEN.servicePkg.warrantyTerms.title}\n\n${tEN.servicePkg.warrantyTerms.lines.map((l) => `- ${l}`).join("\n")}\n\n` +
  `### ${tEN.servicePkg.warrantyExclusions.title}\n\n${tEN.servicePkg.warrantyExclusions.lines.map((l) => `- ${l}`).join("\n")}\n\n`;
fs.writeFileSync(
  path.join(DIST, "llms.txt"),
  `# Hugo Wishpax / Hugo Studio\n\n` +
    `> Hugo Wishpax is a software engineer and product builder. Hugo Studio is the product lab and portfolio behind the work. He is open to software engineering internships, junior roles and freelance web projects.\n\n` +
    `## Start here\n\n- [Portfolio and CV](${ORIGIN}/en/introduction)\n- [English freelance services](${ORIGIN}/en/services)\n- [Selected projects](${ORIGIN}/en/project)\n\n` +
    `## Hugo Studio services\n\n> ${tVI.servicesPage.meta.description}\n\n` +
    enPricing +
    `## Bảng giá\n\n${plans.map((p) => `- ${p.name}: ${p.price}${p.scope ? ` — ${p.scope}` : ""}`).join("\n")}\n\n` +
    `## Gói lẻ\n\n${SERVICE_ADDONS.map((ad) => { const b = tVI.servicePkg.addonItems[ad.id]; return `- [${b.name}](${ORIGIN}${addonPath(ad)}) (${b.for}): ${b.price} — ${b.when} Bảo hành: ${b.warranty.period}.`; }).join("\n")}\n\n` +
    `## Đơn giá lẻ\n\n${tVI.servicePkg.addons.units.map((u) => `- ${u.title}: ${u.price}`).join("\n")}\n\n` +
    `## ${tVI.servicePkg.warrantyTerms.title}\n\n${tVI.servicePkg.warrantyTerms.lines.map((l) => `- ${l}`).join("\n")}\n\n` +
    `## ${tVI.servicePkg.warrantyExclusions.title}\n\n${tVI.servicePkg.warrantyExclusions.lines.map((l) => `- ${l}`).join("\n")}\n\n` +
    `Giá niêm yết bằng VNĐ ở mọi ngôn ngữ; bản tiếng Anh/Trung (${ORIGIN}/en/services) là giá cho khách nước ngoài, kèm số USD quy đổi chỉ để tham khảo.\n\n` +
    `## Trang\n\n${routes.map((r) => `- [${r.title}](${ORIGIN}${r.path}): ${r.description}`).join("\n")}\n\n` +
    `## Câu hỏi thường gặp\n\n${faqs.map((f) => `### ${f.question}\n${f.answer}`).join("\n\n")}\n`,
);

// ── vercel.json: mỗi trang tĩnh cần một rewrite trỏ tới HTML của nó ──────────
// Trước đây phải thêm tay, nên thêm một dự án là quên một rewrite và trang mới
// rơi vào bản SPA rỗng (Google đọc được đúng cái khung). Giờ danh sách này sinh
// ra từ chính các trang vừa dựng; những rewrite khác (/api, /pay…) giữ nguyên.
const vercelPath = path.join(ROOT, "vercel.json");
const vercel = JSON.parse(fs.readFileSync(vercelPath, "utf8"));
const generated = perLocale.flatMap(({ prefix, routes: list }) =>
  list.map((r) => ({ source: `${prefix}${r.path}`, destination: `${prefix}${r.path}/index.html` })),
);
const generatedSources = new Set(generated.map((r) => r.source));
// Bỏ các quy tắc trang tĩnh do CHÍNH script này sinh ra ở lần chạy trước — nhận
// ra chúng bằng dấu hiệu `destination === source + "/index.html"`.
//
// LỖI ĐÃ SỬA 2026-09-23: bộ lọc cũ bỏ MỌI quy tắc có destination kết thúc bằng
// "/index.html", nên nó nuốt luôn quy tắc DỰ PHÒNG SPA (`→ /index.html`). Mỗi
// lần build là quy tắc đó biến mất, và mọi đường dẫn phía client — /admin/…,
// /member/… — mở trực tiếp hoặc tải lại trang sẽ không khớp quy tắc nào.
const isGeneratedPageRule = (r) => r.destination === `${r.source}/index.html`;
const kept = vercel.rewrites.filter(
  (r) => !generatedSources.has(r.source) && !isGeneratedPageRule(r),
);
// Vercel lấy quy tắc KHỚP ĐẦU TIÊN, nên chèn trước quy tắc bắt-tất-cả.
const catchAll = kept.findIndex((r) => r.destination === "/index.html" || r.source.includes("(?!assets/"));
const at = catchAll === -1 ? kept.length : catchAll;
const next = [...kept.slice(0, at), ...generated, ...kept.slice(at)];
if (JSON.stringify(vercel.rewrites) !== JSON.stringify(next)) {
  vercel.rewrites = next;
  fs.writeFileSync(vercelPath, JSON.stringify(vercel, null, 2) + "\n");
  console.log(`SEO: vercel.json cập nhật ${generated.length} rewrite trang tĩnh.`);
}

// ── Guard: meta must not advertise a price the pricing page no longer offers ──
// index.html's description is hand-written, so it silently goes stale whenever
// the author re-prices. Fail loudly instead of shipping a wrong price to Google.
const priceTokens = template.match(/\b\d{2,3}k\b/gi) || [];
const livePrices = plans.map((p) => p.price).join(" ").replace(/[.\s]/g, "");
const stale = priceTokens.filter((tok) => {
  const digits = tok.toLowerCase().replace("k", "");
  return !livePrices.includes(digits + "000");
});

console.log(
  `SEO: ${routes.length} trang × ${LOCALES.length} ngôn ngữ = ${urls.length} URL trong sitemap, llms.txt đã ghi.`,
);
if (stale.length) {
  console.warn(
    `SEO WARNING: index.html meta quotes ${[...new Set(stale)].join(", ")} ` +
      `but servicePkg.items.*.price has ${plans.map((p) => p.price).join(", ")}. ` +
      `Update the meta description in index.html.`,
  );
}
