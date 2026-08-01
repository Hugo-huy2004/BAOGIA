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
 * servicesPage.plans.*.price so meta can never drift from the pricing page.
 *
 * Outputs: dist/<route>/index.html, dist/sitemap.xml, dist/llms.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PUBLIC_TOOLS } from "../src/config/publicTools.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const ORIGIN = "https://www.hugowishpax.studio";

const t = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/i18n/locales/vi/translation.json"), "utf8"),
);

/** "Từ 1.490.000đ" → 1490000. Schema.org needs a number, not the display string. */
const vndAmount = (display) => {
  const digits = String(display || "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : undefined;
};

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Plan name + price pairs, straight from the author's pricing table. */
const plans = Object.values(t.servicesPage.plans)
  .filter((p) => p && p.name && p.price)
  .map((p) => ({ name: p.name, price: p.price }));

const faqs = (t.faqPage.faqs || []).map(({ question, answer }) => ({ question, answer }));
const studentPlans = Object.values(t.servicesPage.studentPlans || {})
  .filter((p) => p && p.name && p.price)
  .map((p) => ({ name: p.name, price: p.price }));

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
      const amounts = plans.map((p) => vndAmount(p.price)).filter(Boolean);
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
            price: vndAmount(p.price),
            valueAddedTaxIncluded: true,
          },
        })),
      },
    }),
  },
  {
    path: "/faq",
    title: "Câu Hỏi Thường Gặp Về Hugo Studio",
    description:
      "Giải đáp về dịch vụ thiết kế website, trang Bio dành cho người học, chi phí, thời gian thực hiện và cách Hugo Studio đồng hành cùng từng dự án.",
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
    title: "Đặt Lịch Tư Vấn Thiết Kế Website | Hugo Studio",
    description:
      "Chia sẻ nhu cầu và đặt lịch trao đổi trực tiếp với Hugo Studio về website, landing page, trang Bio hoặc hệ thống web.",
    body: () =>
      `<h1>${esc(t.bookingPage.header.title)}</h1><p>${esc(t.bookingPage.header.desc)}</p>`,
  },
  {
    path: "/student-benefits",
    title: t.studentBenefitsPage.metaTitle,
    description: t.studentBenefitsPage.metaDesc,
    body: () =>
      `<h1>${esc(t.studentBenefitsPage.title)}</h1>` +
      `<p>${esc(t.studentBenefitsPage.desc)}</p>`,
  },
  {
    path: "/student-pricing",
    title: "Bảng Giá Dành Cho Học Sinh, Sinh Viên | Hugo Studio",
    description:
      "Các gói trang Bio, hồ sơ năng lực và hỗ trợ kỹ thuật dành cho học sinh, sinh viên, kèm điều kiện xác minh và nguyên tắc liêm chính học thuật.",
    keywords:
      "bảng giá sinh viên, trang Bio sinh viên, hồ sơ năng lực, hỗ trợ kỹ thuật, liêm chính học thuật",
    body: () =>
      `<h1>Bảng giá dành cho học sinh, sinh viên</h1>` +
      `<p>${esc("Các gói dịch vụ được trình bày cùng điều kiện xác minh và phạm vi hỗ trợ rõ ràng.")}</p>` +
      `<ul>${studentPlans.map((p) => `<li>${esc(p.name)} — ${esc(p.price)}</li>`).join("")}</ul>`,
  },
  {
    path: "/privacy-policy",
    title: "Điều Khoản Sử Dụng Và Chính Sách Bảo Mật | Hugo Studio",
    description:
      "Tìm hiểu cách Hugo Studio cung cấp dịch vụ, xử lý dữ liệu cá nhân, vận hành JOY, thanh toán và bảo vệ quyền riêng tư của người dùng.",
    body: () =>
      `<h1>Điều khoản sử dụng và chính sách bảo mật</h1>` +
      `<p>${esc("Tài liệu trình bày phạm vi dịch vụ, dữ liệu được xử lý, quyền của người dùng, thanh toán và các biện pháp bảo vệ tài khoản.")}</p>`,
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
const template = fs.readFileSync(path.join(DIST, "index.html"), "utf8");

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

for (const r of routes) {
  const url = ORIGIN + r.path;
  let html = template;

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
    `<link rel="canonical" href="${url}" />`,
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

  const out = path.join(DIST, r.path.replace(/^\//, ""));
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "index.html"), html);
}

// ── sitemap.xml ───────────────────────────────────────────────────────────────
const urls = [...routes].sort((a, b) => a.path.localeCompare(b.path));
fs.writeFileSync(
  path.join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map((u) => `  <url>\n    <loc>${ORIGIN}${u.path}</loc>\n  </url>`)
      .join("\n") +
    `\n</urlset>\n`,
);

// ── llms.txt ──────────────────────────────────────────────────────────────────
// Plain-text summary for AI answer engines. Same authored strings, no spin.
fs.writeFileSync(
  path.join(DIST, "llms.txt"),
  `# Hugo Studio\n\n> ${t.servicesPage.meta.description}\n\n` +
    `## Bảng giá\n\n${plans.map((p) => `- ${p.name}: ${p.price}`).join("\n")}\n\n` +
    `## Trang\n\n${routes.map((r) => `- [${r.title}](${ORIGIN}${r.path}): ${r.description}`).join("\n")}\n\n` +
    `## Câu hỏi thường gặp\n\n${faqs.map((f) => `### ${f.question}\n${f.answer}`).join("\n\n")}\n`,
);

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
  `SEO: ${routes.length} static pages, ${urls.length} sitemap URLs, llms.txt written.`,
);
if (stale.length) {
  console.warn(
    `SEO WARNING: index.html meta quotes ${[...new Set(stale)].join(", ")} ` +
      `but servicesPage.plans has ${plans.map((p) => p.price).join(", ")}. ` +
      `Update the meta description in index.html.`,
  );
}
