import { useEffect } from "react";
import { languageCode, languageLabel, localeForLanguage } from "../i18n/languages";

const SITE_ORIGIN = "https://www.hugowishpax.studio";
const DEFAULT_IMAGE = `${SITE_ORIGIN}/og-image.png`;
const INDEX_ROBOTS =
  "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

const currentCanonical = () => {
  if (typeof window === "undefined") return SITE_ORIGIN;
  return `${SITE_ORIGIN}${window.location.pathname}`;
};

const updateOrCreateMeta = (name, content, attributeType = "name") => {
  if (content === undefined || content === null) return;

  let meta = document.querySelector(`meta[${attributeType}="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attributeType, name);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", String(content));
};

/**
 * Keeps route metadata consistent in the SPA. Public pages are indexable by
 * default; account, payment and internal routes opt into `noindex` explicitly.
 */
export const useHeadMeta = (options = {}) => {
  const canonicalUrl = options.canonicalUrl || currentCanonical();
  const title = options.title || "Hugo Studio";
  const description =
    options.description ||
    "Hugo Studio giới thiệu các sản phẩm số, trang Bio và dịch vụ thiết kế website của Hugo Lê.";
  const ogTitle = options.ogTitle || title;
  const ogDescription = options.ogDescription || description;
  const ogImage = options.ogImage || DEFAULT_IMAGE;
  const ogUrl = options.ogUrl || canonicalUrl;
  const language =
    options.language ||
    (typeof document !== "undefined" ? document.documentElement.lang : "vi") ||
    "vi";
  const normalizedLanguage = languageCode(language);
  const locale = options.locale || localeForLanguage(normalizedLanguage).replace("-", "_");
  const robots = options.robots || INDEX_ROBOTS;
  const imageAlt = options.imageAlt || ogTitle;

  useEffect(() => {
    document.title = title;

    updateOrCreateMeta("description", description);
    if (options.keywords) updateOrCreateMeta("keywords", options.keywords);
    updateOrCreateMeta("author", options.author || "Hugo Studio");
    updateOrCreateMeta("robots", robots);
    updateOrCreateMeta("googlebot", robots);
    updateOrCreateMeta("language", languageLabel(normalizedLanguage));

    updateOrCreateMeta("og:type", options.ogType || "website", "property");
    updateOrCreateMeta("og:site_name", "Hugo Studio", "property");
    updateOrCreateMeta("og:locale", locale, "property");
    updateOrCreateMeta("og:title", ogTitle, "property");
    updateOrCreateMeta("og:description", ogDescription, "property");
    updateOrCreateMeta("og:image", ogImage, "property");
    updateOrCreateMeta("og:image:secure_url", ogImage, "property");
    updateOrCreateMeta("og:image:alt", imageAlt, "property");
    updateOrCreateMeta("og:url", ogUrl, "property");

    const imageWidth = options.imageWidth || (ogImage === DEFAULT_IMAGE ? "1200" : "");
    const imageHeight = options.imageHeight || (ogImage === DEFAULT_IMAGE ? "630" : "");
    for (const [property, value] of [
      ["og:image:width", imageWidth],
      ["og:image:height", imageHeight],
    ]) {
      const element = document.querySelector(`meta[property="${property}"]`);
      if (value) updateOrCreateMeta(property, value, "property");
      else element?.remove();
    }

    updateOrCreateMeta("twitter:card", "summary_large_image");
    updateOrCreateMeta("twitter:title", ogTitle);
    updateOrCreateMeta("twitter:description", ogDescription);
    updateOrCreateMeta("twitter:image", ogImage);
    updateOrCreateMeta("twitter:image:alt", imageAlt);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalUrl);
  }, [
    canonicalUrl,
    description,
    imageAlt,
    language,
    normalizedLanguage,
    locale,
    ogDescription,
    ogImage,
    ogTitle,
    ogUrl,
    options.author,
    options.imageHeight,
    options.imageWidth,
    options.keywords,
    options.ogType,
    robots,
    title,
  ]);
};
