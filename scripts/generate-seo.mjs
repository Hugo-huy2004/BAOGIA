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
import { servicePackages } from "../src/data/servicePackages.js";
import { projects } from "../src/data/projects.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const ORIGIN = "https://www.hugowishpax.studio";

/** Bốn gói kèm giá, đọc từ cùng nguồn với trang thật. Gói báo giá riêng không
 *  có mức trần nên chỉ in một con số. */
const digitsOf = (display) => {
  const d = String(display || "").replace(/[^\d]/g, "");
  return d ? Number(d) : undefined;
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

const template = fs.readFileSync(path.join(DIST, "index.html"), "utf8");

function buildLocale(lang, prefix, { emit = true, only = null } = {}) {
  const t = JSON.parse(
      fs.readFileSync(path.join(ROOT, `src/i18n/locales/${lang}/translation.json`), "utf8"),
    );

  /** "Từ 1.490.000đ" → 1490000. Schema.org needs a number, not the display string. */
  /** Số tiền máy đọc cho một gói: 0 nếu miễn phí, mức sàn nếu là khoảng. */
  const vndAmount = (plan) => (plan.free ? 0 : plan.min);

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
        `<h2>${esc(t.intro.cine.work.title)}</h2><p>${esc(t.intro.cine.work.desc)}</p>`,
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
            areaServed: { "@type": "Country", name: "Việt Nam" },
            availableLanguage: ["vi", "en"],
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
        name: "Thiết kế website",
        provider: { "@type": "Organization", name: "Hugo Studio", url: ORIGIN },
        areaServed: { "@type": "Country", name: "Vietnam" },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Bảng giá dịch vụ website",
          itemListElement: plans.map((p) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: p.name },
            priceCurrency: "VND",
            description: p.price,
            priceSpecification: {
              "@type": "PriceSpecification",
              priceCurrency: "VND",
              price: vndAmount(p),
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
        author: { "@type": "Person", name: "Lê Gia Huy" },
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
  const NAV = `<nav style="margin-top:2.5rem;display:flex;flex-wrap:wrap;gap:1rem;font-size:0.9rem"><a href="/introduction">Giới thiệu</a><a href="/services">Dịch vụ &amp; báo giá</a><a href="/faq">Câu hỏi thường gặp</a><a href="/booking">Đặt lịch</a><a href="/student-benefits">Quyền lợi sinh viên</a><a href="/user-guide">Hướng dẫn</a></nav>`;

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
    const alternates = LOCALES
      .map(({ code, prefix: p }) => `<link rel="alternate" hreflang="${code}" href="${ORIGIN}${p}${r.path}" />`)
      .join("\n    ") + `\n    <link rel="alternate" hreflang="x-default" href="${ORIGIN}${r.path}" />`;

    html = replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(r.title)}</title>`);
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
          inLanguage: "vi",
          isPartOf: { "@id": `${ORIGIN}/#website` },
          about: { "@id": `${ORIGIN}/#organization` },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Hugo Studio",
              item: `${ORIGIN}/introduction`,
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
const viRoutes = buildLocale("vi", "");
const viCopy = new Map(viRoutes.map((r) => [r.path, `${r.title}|${r.description}`]));
const perLocale = [{ prefix: "", routes: viRoutes }];
for (const { code, prefix } of LOCALES.slice(1)) {
  const translated = buildLocale(code, prefix, { emit: false }).filter(
    (r) => viCopy.get(r.path) !== `${r.title}|${r.description}`,
  );
  // Dựng lại đúng những trang đã lọc để ghi ra đĩa.
  buildLocale(code, prefix, { only: new Set(translated.map((r) => r.path)) });
  perLocale.push({ prefix, routes: translated });
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
        LOCALES.map(({ code, prefix }) =>
          `    <xhtml:link rel="alternate" hreflang="${code}" href="${ORIGIN}${prefix}${u.base}"/>`).join("\n") +
        `\n  </url>`)
      .join("\n") +
    `\n</urlset>\n`,
);

// ── llms.txt ──────────────────────────────────────────────────────────────────
// Plain-text summary for AI answer engines. Same authored strings, no spin.
// llms.txt và phần đối chiếu giá viết bằng tiếng Việt — bản gốc của tác giả.
// `plans`/`faqs` sống trong buildLocale nên phải dựng lại ở đây.
const tVI = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/i18n/locales/vi/translation.json"), "utf8"),
);
const plans = planList(tVI);
const faqs = (tVI.faqPage.faqs || []).map(({ question, answer }) => ({ question, answer }));
fs.writeFileSync(
  path.join(DIST, "llms.txt"),
  `# Hugo Studio\n\n> ${tVI.servicesPage.meta.description}\n\n` +
    `## Bảng giá\n\n${plans.map((p) => `- ${p.name}: ${p.price}`).join("\n")}\n\n` +
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
