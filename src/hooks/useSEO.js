import { useEffect } from "react";

/**
 * SEO Hook - Manages meta tags, Open Graph, and structured data for each page
 */
export function useSEO(config) {
  useEffect(() => {
    const {
      title = "Hugo Studio - Bio Link Designer & Web Design",
      description = "Create beautiful Bio Links and custom websites with Hugo Studio. Free Bio Edu service for students.",
      keywords = "bio link, web design, portfolio, bio page, hugo studio",
      image = "https://hugowishpax.studio/image/og-image.png",
      url = "https://hugowishpax.studio",
      type = "website",
      author = "Hugo Wishpax Lê",
      structuredData = null,
    } = config;

    // Update main title
    document.title = title;

    // Update or create meta tags
    const setMeta = (name, content, isProperty = false) => {
      let element = document.querySelector(
        isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`
      );
      if (!element) {
        element = document.createElement("meta");
        isProperty ? element.setAttribute("property", name) : element.setAttribute("name", name);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Standard Meta Tags
    setMeta("description", description);
    setMeta("keywords", keywords);
    setMeta("author", author);
    setMeta("viewport", "width=device-width, initial-scale=1.0");
    setMeta("theme-color", "#3B82F6");
    setMeta("apple-mobile-web-app-capable", "yes");
    setMeta("apple-mobile-web-app-status-bar-style", "black-translucent");

    // Open Graph Meta Tags
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:image", image, true);
    setMeta("og:url", url, true);
    setMeta("og:type", type, true);
    setMeta("og:site_name", "Hugo Studio", true);
    setMeta("og:locale", "vi_VN", true);

    // Twitter Card Meta Tags
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("twitter:image", image);
    setMeta("twitter:creator", "@hugowishpax");

    // LinkedIn Meta Tags
    setMeta("linkedin:title", title);
    setMeta("linkedin:description", description);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    // Structured Data (JSON-LD)
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]');
      if (!script) {
        script = document.createElement("script");
        script.setAttribute("type", "application/ld+json");
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }

    // Cleanup function
    return () => {
      // Keep meta tags persistent across navigation
    };
  }, [config]);
}

/**
 * Organization Structured Data
 */
export const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Hugo Studio",
  "url": "https://hugowishpax.studio",
  "logo": "https://hugowishpax.studio/image/logo.png",
  "description": "Create beautiful Bio Links and custom websites with Hugo Studio",
  "sameAs": [
    "https://facebook.com/hugowishpax",
    "https://instagram.com/hugowishpax",
    "https://tiktok.com/@hugowishpax",
    "https://github.com/hugowishpax"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Service",
    "email": "hello@hugowishpax.studio",
    "url": "https://hugowishpax.studio/booking"
  },
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "VN",
    "addressLocality": "Ho Chi Minh City"
  }
};

/**
 * Service Structured Data
 */
export const serviceStructuredData = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Bio Link & Web Design Service",
  "url": "https://hugowishpax.studio/services",
  "image": "https://hugowishpax.studio/image/services.png",
  "description": "Professional bio link design and custom website creation service",
  "provider": {
    "@type": "Organization",
    "name": "Hugo Studio",
    "url": "https://hugowishpax.studio"
  },
  "areaServed": {
    "@type": "Country",
    "name": "VN"
  },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "VND",
    "price": "0",
    "description": "Free Bio Link for students with .edu email"
  }
};

/**
 * FAQ Structured Data
 */
export const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What are Hugo Studio's working hours?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No fixed time - we offer flexible 1:1 service."
      }
    },
    {
      "@type": "Question",
      "name": "How many team members do you have?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "2 members: Hugo Wishpax Lê and Jason Phan"
      }
    },
    {
      "@type": "Question",
      "name": "Do you offer free trial service?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, free Bio Link with .edu email for students"
      }
    },
    {
      "@type": "Question",
      "name": "What's your pricing?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Very affordable with great results. Contact us for details."
      }
    },
    {
      "@type": "Question",
      "name": "Do you take holiday breaks?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, mostly traveling. We'll notify on the page."
      }
    }
  ]
};

/**
 * Product Structured Data (Bio Link Product)
 */
export const bioLinkProductStructuredData = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Free Bio Link",
  "description": "Beautiful, customizable bio link generator for students and professionals",
  "url": "https://hugowishpax.studio/services",
  "image": "https://hugowishpax.studio/image/bio-link.png",
  "brand": {
    "@type": "Brand",
    "name": "Hugo Studio"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://hugowishpax.studio/services",
    "priceCurrency": "VND",
    "price": "0",
    "availability": "https://schema.org/InStock",
    "eligibleCustomerType": "Students with .edu email"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "250"
  }
};

/**
 * LocalBusiness Structured Data
 */
export const localBusinessStructuredData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Hugo Studio",
  "image": "https://hugowishpax.studio/image/logo.png",
  "description": "Bio Link Designer & Web Design Service",
  "url": "https://hugowishpax.studio",
  "telephone": "+84XXXXXXXXX",
  "email": "hello@hugowishpax.studio",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "VN",
    "addressLocality": "Ho Chi Minh City",
    "addressRegion": "HCM"
  },
  "sameAs": [
    "https://facebook.com/hugowishpax",
    "https://instagram.com/hugowishpax",
    "https://tiktok.com/@hugowishpax"
  ],
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    "opens": "00:00",
    "closes": "23:59"
  }
};

export default useSEO;
