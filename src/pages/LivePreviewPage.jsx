import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";

// Lazy-load themes to reduce initial bundle size
const DefaultTheme = lazy(() => import("../components/themes/DefaultTheme"));
const BrutalismTheme = lazy(() => import("../components/themes/BrutalismTheme"));
const FlatTheme = lazy(() => import("../components/themes/FlatTheme"));

function MobilePreview({ bio }) {
  const getImage = (bio) => {
    if (!bio) return null;
    const candidates = [bio.profile, bio.avatar, bio.image, bio.photo];
    for (const c of candidates) {
      if (!c) continue;
      if (typeof c === "string") return c;
      if (c.optimizedSrc) return c.optimizedSrc;
      if (c.src) return c.src;
    }
    return null;
  };

  const img = getImage(bio);

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-[#0b0b0b] rounded-lg shadow-md p-4">
      {img && (
        <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-3">
          <img src={img} alt={bio?.name || "avatar"} className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}
      <h2 className="text-center text-lg font-semibold">{bio?.name || bio?.fullName || "Preview"}</h2>
      {bio?.title && <p className="text-center text-sm text-gray-600 dark:text-gray-300">{bio.title}</p>}
      {bio?.summary && <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{bio.summary}</p>}
    </div>
  );
}

export default function LivePreviewPage() {
  const [bio, setBio] = useState(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e) => setIsMobile(e.matches);
    try {
      mq.addEventListener?.("change", handler);
    } catch (e) {
      mq.addListener?.(handler);
    }
    return () => {
      try {
        mq.removeEventListener?.("change", handler);
      } catch (e) {
        mq.removeListener?.(handler);
      }
    };
  }, []);

  // On desktop allow switching between desktop and mobile preview
  const [previewMode, setPreviewMode] = useState("desktop");

  useEffect(() => {
    const transformImageUrl = (url) => {
      if (!url || typeof url !== "string") return url;
      try {
        const u = new URL(url);
        const host = u.hostname;
        // Common CDN optimizations (best-effort)
        if (host.includes("images.unsplash.com")) {
          return url.split("?")[0] + "?w=800&fm=webp&q=80";
        }
        if (host.includes("cloudinary.com")) {
          // insert transformation after /upload/
          return url.replace("/upload/", "/upload/c_scale,w_800/");
        }
        if (host.includes("imgix.net") || host.includes("cloudfront.net")) {
          return url.split("?")[0] + "?auto=format,compress&w=800";
        }
      } catch (e) {
        // not a valid URL, return original
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

    // Let the parent know we're ready to receive data
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "PREVIEW_READY" }, "*");
    }

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const loadingFallback = (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#f5f5f7] dark:bg-[#000000]">
      <div className="w-8 h-8 sm:w-10 sm:h-10 border-3 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  );

  if (!bio) return loadingFallback;

  // On small screens render a lightweight mobile preview and avoid loading desktop themes
  if (isMobile) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#f5f5f7] dark:bg-[#000000] p-4">
        <MobilePreview bio={bio} />
      </div>
    );
  }

  const template = bio?.theme?.template || "default";

  const containerClass =
    "min-h-[100dvh] bg-[#f5f5f7] dark:bg-[#000000] flex items-start justify-center py-6 px-4 sm:px-8";

  const memoizedBio = useMemo(() => bio, [bio]);

  return (
    <div className={containerClass}>
      <div className="w-full max-w-[1100px]">
        {!isMobile && (
          <div className="mb-4 flex items-center justify-end gap-2">
            <button
              onClick={() => { console.log('setPreviewMode desktop'); setPreviewMode("desktop"); }}
              className={`px-3 py-1 rounded-md border ${previewMode === "desktop" ? "bg-white dark:bg-gray-800" : "bg-transparent"}`}
            >
              Desktop
            </button>
            <button
              onClick={() => { console.log('setPreviewMode mobile'); setPreviewMode("mobile"); }}
              className={`px-3 py-1 rounded-md border ${previewMode === "mobile" ? "bg-white dark:bg-gray-800" : "bg-transparent"}`}
            >
              Mobile
            </button>
          </div>
        )}

        {!isMobile && (
          <div className="mb-4 text-sm text-gray-500">Current mode: <strong>{previewMode}</strong></div>
        )}

        {previewMode === "mobile" ? (
          <div className="flex items-center justify-center">
            <MobilePreview bio={memoizedBio} />
          </div>
        ) : (
          <Suspense fallback={loadingFallback}>
            {template === "flat" && <FlatTheme bio={memoizedBio} isPreview={true} />}
            {template === "brutalism" && <BrutalismTheme bio={memoizedBio} isPreview={true} />}
            {template !== "flat" && template !== "brutalism" && (
              <DefaultTheme bio={memoizedBio} isPreview={true} />
            )}
          </Suspense>
        )}
      </div>
    </div>
  );
}
