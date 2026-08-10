import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ORIGIN = "https://www.hugowishpax.studio";
const INDEX_ROBOTS =
  "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
const PRIVATE_ROBOTS = "noindex, nofollow, noarchive";

const PUBLIC_PATHS = new Set([
  "/introduction",
  "/services",
  "/student-pricing",
  "/faq",
  "/booking",
  "/privacy-policy",
  "/user-guide",
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
    const isPublicBio = pathname.startsWith("/bio/");
    const isPublic = pathname === "/" || PUBLIC_PATHS.has(pathname) || isPublicBio;
    const robots = isPublic ? INDEX_ROBOTS : PRIVATE_ROBOTS;

    setMeta("robots", robots);
    setMeta("googlebot", robots);

    const canonicalUrl = `${ORIGIN}${pathname === "/" ? "/introduction" : pathname}`;
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
