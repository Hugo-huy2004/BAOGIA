import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { PARTNER_HOST } from "../../shared/partnerCampaigns";

const ORIGIN = "https://www.hugowishpax.studio";
const INDEX_ROBOTS =
  "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
const PRIVATE_ROBOTS = "noindex, nofollow, noarchive";

const MEMBER_TITLES = {
  today: "Hôm nay",
  apps: "Ứng dụng",
  utilities: "Ứng dụng",
  activity: "Hoạt động",
  history: "Hoạt động",
  account: "Tài khoản",
};

const PUBLIC_PATHS = new Set([
  "/introduction",
  "/services",
  "/student-pricing",
  "/faq",
  "/privacy-policy",
  "/terms",
  "/user-guide",
  "/terms-and-guide",
  "/banhocduong",
  "/therapy",
  "/radio",
  "/aura",
]);

const setMeta = (name, content) => {
  let element = document.querySelector(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.name = name;
    document.head.appendChild(element);
  }
  element.content = content;
};

/**
 * Prevents metadata from an indexable marketing page leaking into private SPA
 * routes after client-side navigation.
 */
export default function RouteSeoPolicy() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Trang chiến dịch tự đặt canonical về tên miền partner (PartnerCollabPage).
    if (pathname.startsWith("/collab/") || (window.location.hostname === PARTNER_HOST && pathname === "/")) return;
    const isPublicBio = pathname.startsWith("/bio/");
    const isPublic = pathname === "/" || PUBLIC_PATHS.has(pathname) || pathname.startsWith("/project") || isPublicBio;
    const robots = isPublic ? INDEX_ROBOTS : PRIVATE_ROBOTS;

    setMeta("robots", robots);
    setMeta("googlebot", robots);

    if (pathname.startsWith("/member")) {
      const section = pathname.split("/")[2] || "today";
      const title = pathname.startsWith("/member/utilities/joy_wallet")
        ? "Ví JOY"
        : (MEMBER_TITLES[section] || "Thành viên");
      document.title = `${title} | Hugo Studio`;
    }

    // `useLocation()` is relative to BrowserRouter.basename. On `/en/services`
    // it reports `/services`; use the browser URL so the English and Chinese
    // static editions keep their own canonical after React hydrates.
    const currentPath = window.location.pathname;
    const canonicalUrl = `${ORIGIN}${currentPath}`;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalUrl);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    ogUrl?.setAttribute("content", canonicalUrl);
  }, [pathname]);

  return null;
}
