import { useEffect } from 'react';

/**
 * Custom hook để quản lý meta tags động cho SEO
 * @param {Object} options - Các tùy chọn meta
 * @param {string} options.title - Tiêu đề trang
 * @param {string} options.description - Meta description
 * @param {string} options.keywords - Meta keywords
 * @param {string} options.ogTitle - Open Graph title
 * @param {string} options.ogDescription - Open Graph description
 * @param {string} options.ogImage - Open Graph image URL
 * @param {string} options.ogUrl - Open Graph URL
 * @param {string} options.canonicalUrl - Canonical URL
 */
export const useHeadMeta = (options = {}) => {
  const {
    title = 'Hugo Studio',
    description = 'Hugo Studio - Nền tảng tạo bio cá nhân chuyên nghiệp',
    keywords = 'Hugo Studio, Bio page, Booking platform',
    ogTitle = title,
    ogDescription = description,
    ogImage = 'https://www.hugowishpax.studio/og-image.jpg',
    ogUrl = window.location.href,
    canonicalUrl = `https://www.hugowishpax.studio${window.location.pathname}`
  } = options;

  useEffect(() => {
    // Update title
    document.title = title;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }

    // Update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', keywords);
    }

    // Update Open Graph tags
    updateOrCreateMeta('og:title', ogTitle, 'property');
    updateOrCreateMeta('og:description', ogDescription, 'property');
    updateOrCreateMeta('og:image', ogImage, 'property');
    updateOrCreateMeta('og:url', ogUrl, 'property');

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', canonicalUrl);
    } else {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = canonicalUrl;
      document.head.appendChild(canonical);
    }

    // Update Twitter Card
    updateOrCreateMeta('twitter:title', ogTitle, 'name');
    updateOrCreateMeta('twitter:description', ogDescription, 'name');
    updateOrCreateMeta('twitter:image', ogImage, 'name');

    return () => {
      // Cleanup không cần thiết, nhưng có thể reset nếu component unmount
    };
  }, [title, description, keywords, ogTitle, ogDescription, ogImage, ogUrl, canonicalUrl]);
};

/**
 * Helper function để create hoặc update meta tags
 */
const updateOrCreateMeta = (name, content, attributeType = 'name') => {
  let meta = document.querySelector(`meta[${attributeType}="${name}"]`);
  if (meta) {
    meta.setAttribute('content', content);
  } else {
    meta = document.createElement('meta');
    meta.setAttribute(attributeType, name);
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
  }
};
