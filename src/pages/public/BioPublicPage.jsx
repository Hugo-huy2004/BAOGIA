import { useMemo, useEffect, useState, Suspense } from "react";
import VerifiedProfilePanel from "../../components/public/VerifiedProfilePanel";
import useSWR from "swr";
import { useParams } from "react-router-dom";
import dataApi from "../../services/dataApi";
import { useHeadMeta } from "../../hooks/useHeadMeta";

const apiBase = import.meta.env.VITE_API_URL || "/api";

// Universal Bio View: hỗ trợ 6 themes (Default, Frost, Graphite, Aurora, Brutalism, Flat) qua CSS
import UniversalBioView from "../../components/themes/UniversalBioView";

import { BioProfileSkeleton } from "../../components/ui/SkeletonLayouts";

export default function BioPublicPage() {
  const { slug } = useParams();
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isCustomDomainHost = Boolean(
    hostname &&
    !["localhost", "127.0.0.1"].includes(hostname) &&
    !hostname.endsWith("hugowishpax.studio") &&
    !hostname.endsWith("vercel.app")
  );

  const swrKey = isCustomDomainHost ? `bio_domain_${hostname}` : slug ? `bio_${slug}` : null;

  const { data: bio, error, isLoading } = useSWR(
    swrKey,
    async () => {
      if (isCustomDomainHost) {
        const response = await dataApi.getBioByDomain(hostname);
        return response.bio;
      }
      const response = await dataApi.getBioBySlug(slug);
      return response.bio;
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const expired = error?.message === "Bio not found";
  const loading = isLoading;

  const activeSlug = bio?.slug || slug;

  const [isOnline, setIsOnline] = useState(false);
  useEffect(() => {
    // Hỏi theo slug: trang công khai không còn cầm email của chủ Bio nữa.
    if (!activeSlug || !bio) return;

    const pollStatus = () => {
      fetch(`${apiBase}/presence/status-by-slug?slug=${encodeURIComponent(activeSlug)}`)
        .then(r => r.json())
        .then(data => setIsOnline(!!data.online))
        .catch(() => {});
    };

    pollStatus();
    const interval = setInterval(pollStatus, 15000);
    return () => clearInterval(interval);
  }, [activeSlug, bio]);

  // Initialize theme values early (hỗ trợ xem trước qua URL query ?theme=...)
  const template = useMemo(() => {
    try {
      const qTheme = new URLSearchParams(window.location.search).get("theme");
      if (qTheme) return qTheme;
    } catch (_) {}
    return bio?.theme?.template || "workspace";
  }, [bio]);
  const canonicalUrl = isCustomDomainHost
    ? `https://${hostname}`
    : `https://www.hugowishpax.studio/bio/${encodeURIComponent(activeSlug || "")}`;
  // Trang Bio của thành viên dưới 18 không được đưa lên công cụ tìm kiếm.
  const unavailable = Boolean(error || bio?.status === "locked" || bio?.status === "pending" || bio?.isMinor);

  // SEO Meta Tags - Dynamic based on bio data
  useHeadMeta({
    title: bio ? `${bio.displayName} | Hugo Studio` : 'Hugo Studio',
    description: bio?.bio || 'Trang Bio cá nhân trong hệ sinh thái Hugo Studio.',
    keywords: `${bio?.displayName || 'Hugo Studio'}, ${bio?.headline || 'Hồ sơ cá nhân'}, Bio page, hồ sơ năng lực`,
    ogTitle: bio ? `${bio.displayName} - Hugo Studio` : 'Hugo Studio',
    ogDescription: bio?.bio || 'Trang Bio cá nhân trong hệ sinh thái Hugo Studio.',
    ogImage: bio?.avatarUrl || 'https://www.hugowishpax.studio/og-image.png',
    ogUrl: canonicalUrl,
    canonicalUrl,
    ogType: "profile",
    robots: unavailable ? "noindex, nofollow, noarchive" : undefined,
    imageAlt: bio ? `Ảnh đại diện của ${bio.displayName}` : "Hugo Studio",
  });

  if (loading) {
    return <BioProfileSkeleton />;
  }

  if (!bio || expired || bio.status === 'locked' || bio.status === 'pending') {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl text-center space-y-4 shadow-xl">
          <span className={`material-symbols-outlined text-4xl ${bio?.status === 'pending' ? 'text-warning' : 'text-destructive'}`}>
            {bio?.status === 'pending' ? 'hourglass_empty' : 'lock'}
          </span>
          <h1 className="font-display text-2xl font-extrabold text-white">
            {bio?.status === 'locked' 
              ? 'Liên Kết Bị Tạm Khóa' 
              : bio?.status === 'pending' 
              ? 'Liên Kết Đang Chờ Duyệt' 
              : 'Bio Không Tồn Tại'}
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {bio?.status === 'locked' 
              ? 'Trang Bio này đã bị khóa tạm thời bởi quản trị viên hệ thống.' 
              : bio?.status === 'pending'
              ? 'Trang Bio này đang chờ quản trị viên phê duyệt.'
              : 'Liên kết này đã hết hạn sau 12 tháng sử dụng, bị gỡ bỏ hoặc chưa bao giờ được kích hoạt trên hệ thống.'}
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-bold transition-all"
          >
            Trở về trang chủ
          </a>
        </div>
      </main>
    );
  }

  // Bảng hồ sơ có kiểm chứng nằm NGOÀI giao diện: tự ẩn khi chưa bật công bố
  const themed = <UniversalBioView bio={bio} isOnline={isOnline} customTemplate={template} />;

  return (
    <Suspense fallback={<BioProfileSkeleton />}>
      {themed}
      <VerifiedProfilePanel slug={slug} />
    </Suspense>
  );
}
