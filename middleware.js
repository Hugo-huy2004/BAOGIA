// Vercel Routing Middleware — chỉ phục vụ tên miền partner.hugowishpax.studio.
//
// Vì sao không dùng `rewrites` trong vercel.json: Vercel trả file tĩnh TRƯỚC khi
// xét rewrite, mà `/`, `/sitemap.xml`, `/robots.txt` đều đã là file của www
// (trang Dịch vụ, sitemap www). Rewrite theo host cho mấy đường đó sẽ bị file
// che mất và bot đọc thư mời sẽ thấy trang Dịch vụ. Middleware chạy trước
// filesystem nên đổi đích được.
//
// Mọi đường khác trên tên miền partner (/member, /api, /assets…) đi tiếp như
// www — cùng một bản build, cùng phiên đăng nhập.
import { PARTNER_HOST, PARTNER_HOST_CAMPAIGN } from "./shared/partnerCampaigns.js";

export const config = { matcher: ["/", "/sitemap.xml", "/robots.txt"] };

const TARGETS = {
  "/": `/collab/${PARTNER_HOST_CAMPAIGN}/index.html`,
  "/sitemap.xml": "/partner-sitemap.xml",
  "/robots.txt": "/partner-robots.txt",
};

export default function middleware(request) {
  const url = new URL(request.url);
  if (url.hostname !== PARTNER_HOST) return undefined;
  const target = TARGETS[url.pathname];
  if (!target) return undefined;
  return new Response(null, { headers: { "x-middleware-rewrite": new URL(target, url).toString() } });
}
