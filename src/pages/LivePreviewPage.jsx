import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";

// Lazy-load themes to reduce initial bundle size
const DefaultTheme = lazy(() => import("../components/themes/DefaultTheme"));
const BrutalismTheme = lazy(() => import("../components/themes/BrutalismTheme"));
const FlatTheme = lazy(() => import("../components/themes/FlatTheme"));

// MobilePreview removed as we now always render the actual responsive themes

export default function LivePreviewPage() {
  const [bio, setBio] = useState(null);

  useEffect(() => {
    const transformImageUrl = (url) => {
      if (!url || typeof url !== "string") return url;
      try {
        const u = new URL(url);
        const host = u.hostname;
        if (host.includes("images.unsplash.com")) {
          return url.split("?")[0] + "?w=800&fm=webp&q=80";
        }
        if (host.includes("cloudinary.com")) {
          return url.replace("/upload/", "/upload/c_scale,w_800/");
        }
        if (host.includes("imgix.net") || host.includes("cloudfront.net")) {
          return url.split("?")[0] + "?auto=format,compress&w=800";
        }
      } catch (e) {
      }
      return url;
    };

    const optimizeMedia = (obj) => {
      if (!obj || typeof obj !== "object") return obj;
      if (Array.isArray(obj)) return obj.map(optimizeMedia);
      const out = {};
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (key === "src" && typeof val === "string") {
          out["optimizedSrc"] = transformImageUrl(val);
          out[key] = val;
          out["loading"] = out["loading"] || "lazy";
        } else if (typeof val === "object") {
          out[key] = optimizeMedia(val);
        } else {
          out[key] = val;
        }
      }
      return out;
    };

    const handleMessage = (event) => {
      if (event.data && event.data.type === "UPDATE_PREVIEW") {
        try {
          const optimized = optimizeMedia(event.data.payload);
          setBio(optimized);
        } catch (e) {
          setBio(event.data.payload);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "PREVIEW_READY" }, "*");
    }

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const memoizedBio = useMemo(() => bio, [bio]);

  const loadingFallback = (
    <div className="h-full w-full flex items-center justify-center bg-transparent">
      <div className="w-8 h-8 sm:w-10 sm:h-10 border-3 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  );

  if (!bio) return loadingFallback;

  const template = bio?.theme?.template || "default";

  return (
    <div className="h-full w-full bg-transparent overflow-hidden">
      <Suspense fallback={loadingFallback}>
        {template === "flat" && <FlatTheme bio={memoizedBio} isPreview={true} />}
        {template === "brutalism" && <BrutalismTheme bio={memoizedBio} isPreview={true} />}
        {template !== "flat" && template !== "brutalism" && (
          <DefaultTheme bio={memoizedBio} isPreview={true} />
        )}
      </Suspense>
    </div>
  );
}
