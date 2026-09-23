import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DIST = path.join(ROOT, "dist");
const ORIGIN = "https://www.hugowishpax.studio";
const errors = [];

const read = (file) => fs.readFileSync(file, "utf8");
const capture = (html, expression) => html.match(expression)?.[1]?.trim() || "";
const sitemap = read(path.join(DIST, "sitemap.xml"));
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const titles = new Map();
const descriptions = new Map();

if (!urls.length) errors.push("Sitemap không có URL.");
if (urls.some((url) => !url.startsWith(ORIGIN))) {
  errors.push("Sitemap chứa URL ngoài tên miền chính.");
}
if (urls.includes(`${ORIGIN}/`)) {
  errors.push("Không đưa URL / chuyển hướng vào sitemap; dùng /introduction.");
}

for (const url of urls) {
  const pathname = new URL(url).pathname;
  const file = path.join(DIST, pathname.replace(/^\//, ""), "index.html");
  if (!fs.existsSync(file)) {
    errors.push(`${pathname}: thiếu HTML tĩnh.`);
    continue;
  }

  const html = read(file);
  const title = capture(html, /<title>([\s\S]*?)<\/title>/);
  const description = capture(
    html,
    /<meta\s+name="description"\s+content="([\s\S]*?)"\s*\/>/,
  );
  const canonical = capture(html, /<link rel="canonical" href="([^"]+)" \/>/);
  const robots = capture(html, /<meta name="robots" content="([^"]+)" \/>/);
  const ogUrl = capture(html, /<meta property="og:url" content="([^"]+)" \/>/);
  const ogTitle = capture(html, /<meta property="og:title" content="([^"]+)" \/>/);
  const ogDescription = capture(
    html,
    /<meta property="og:description" content="([^"]+)" \/>/,
  );
  const ogImage = capture(html, /<meta property="og:image" content="([^"]+)" \/>/);
  const ogImageAlt = capture(
    html,
    /<meta property="og:image:alt" content="([^"]+)" \/>/,
  );
  const twitterCard = capture(html, /<meta name="twitter:card" content="([^"]+)" \/>/);
  const h1Count = (html.match(/<h1(?:\s|>)/g) || []).length;

  // Google cắt theo BỀ RỘNG hiển thị, không theo số ký tự — mà một chữ Hán
  // rộng gấp đôi một chữ cái. Đếm ký tự trần thì mọi tiêu đề tiếng Trung đúng
  // độ dài đều bị kêu là quá ngắn, nên đo bằng bề rộng cho cả ba ngôn ngữ.
  const width = (text) =>
    [...text].reduce((sum, ch) => sum + (/[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60]/.test(ch) ? 2 : 1), 0);

  if (!title || width(title) > 65) errors.push(`${pathname}: title thiếu hoặc rộng quá 65 (chữ Hán tính 2).`);
  const descWidth = width(description);
  if (descWidth < 70 || descWidth > 200) {
    errors.push(`${pathname}: description rộng ${descWidth}, cần trong khoảng 70–200 (chữ Hán tính 2).`);
  }
  if (canonical !== url) errors.push(`${pathname}: canonical không khớp URL sitemap.`);
  if (ogUrl !== url || ogTitle !== title || ogDescription !== description) {
    errors.push(`${pathname}: Open Graph không đồng bộ title/description/canonical.`);
  }
  if (!ogImage.startsWith("https://") || !ogImageAlt) {
    errors.push(`${pathname}: Open Graph cần ảnh HTTPS và nội dung thay thế.`);
  }
  if (twitterCard !== "summary_large_image") {
    errors.push(`${pathname}: thiếu Twitter summary_large_image.`);
  }
  if (!robots.includes("index") || robots.includes("noindex")) {
    errors.push(`${pathname}: route công khai không có robots index.`);
  }
  if (h1Count !== 1) errors.push(`${pathname}: HTML tĩnh cần đúng một H1.`);

  for (const script of html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  )) {
    try {
      JSON.parse(script[1]);
    } catch (error) {
      errors.push(`${pathname}: JSON-LD không hợp lệ (${error.message}).`);
    }
  }

  if (titles.has(title)) errors.push(`${pathname}: title trùng ${titles.get(title)}.`);
  if (descriptions.has(description)) {
    errors.push(`${pathname}: description trùng ${descriptions.get(description)}.`);
  }
  titles.set(title, pathname);
  descriptions.set(description, pathname);
}

const robotsTxt = read(path.join(DIST, "robots.txt"));
const sitemapLines = robotsTxt.match(/^Sitemap:/gm) || [];
if (
  sitemapLines.length !== 1 ||
  !robotsTxt.includes(`Sitemap: ${ORIGIN}/sitemap.xml`)
) {
  errors.push("robots.txt phải khai báo đúng một sitemap trên tên miền www.");
}

const vercel = JSON.parse(read(path.join(ROOT, "vercel.json")));
const rewrites = new Map(
  (vercel.rewrites || []).map(({ source, destination }) => [source, destination]),
);
for (const url of urls) {
  const pathname = new URL(url).pathname;
  if (rewrites.get(pathname) !== `${pathname}/index.html`) {
    errors.push(`${pathname}: thiếu rewrite Vercel tới HTML tĩnh.`);
  }
}

if (errors.length) {
  console.error(`SEO check thất bại (${errors.length} lỗi):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`SEO check đạt: ${urls.length} trang công khai, metadata và JSON-LD hợp lệ.`);
