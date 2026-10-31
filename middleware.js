// Vercel Routing Middleware — chỉ phục vụ tên miền Education Hugo.
//
// education.hugowishpax.studio dùng chung bản build với www, nhưng Vercel trả file
// tĩnh TRƯỚC rewrite trong vercel.json: "/" luôn ra index.html (trang Dịch vụ của www),
// robots/sitemap cũng của www. Middleware chạy trước file tĩnh nên đổi được các đường
// dẫn đó sang bản Education do scripts/generate-seo.mjs dựng (edu*.html, edu-*.txt/xml).
// Đường dẫn khác (/learn…) không qua đây: SPA tự dựng theo hostname.
import { EDU_HOST } from "./packages/shared/eduSite.js";

export const config = { matcher: ["/", "/en", "/zh", "/robots.txt", "/sitemap.xml"] };

const EDU_FILES = {
  "/": "/edu.html",
  "/en": "/edu-en.html",
  "/zh": "/edu-zh.html",
  "/robots.txt": "/edu-robots.txt",
  "/sitemap.xml": "/edu-sitemap.xml",
};

export default function middleware(request) {
  const url = new URL(request.url);
  if (url.hostname !== EDU_HOST || !EDU_FILES[url.pathname]) return undefined; // www: đi tiếp như cũ
  // ponytail: đúng header mà rewrite() của @vercel/functions đặt — khỏi thêm một gói chỉ cho một dòng.
  return new Response(null, { headers: { "x-middleware-rewrite": new URL(EDU_FILES[url.pathname], url).href } });
}
