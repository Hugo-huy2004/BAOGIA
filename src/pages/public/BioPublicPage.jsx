import React, { useMemo, useEffect, useState } from "react";
import useSWR from "swr";
import { useParams } from "react-router-dom";
import dataApi from "../../services/dataApi";
import { useHeadMeta } from "../../hooks/useHeadMeta";

const apiBase = import.meta.env.VITE_API_URL || "/api";

// Themes
import DefaultTheme from "../../components/themes/DefaultTheme";
import BrutalismTheme from "../../components/themes/BrutalismTheme";
import FlatTheme from "../../components/themes/FlatTheme";
import WeatherLayer from "../../components/weather/WeatherLayer";
import { isWeatherBgEnabled } from "../../utils/weatherPrefs";

export default function BioPublicPage() {
  const { slug } = useParams();
  const { data: bio, error, isLoading } = useSWR(
    slug ? `bio_${slug}` : null,
    async () => {
      const response = await dataApi.getBioBySlug(slug);
      return response.bio;
    },
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const expired = error?.message === "Bio not found";
  const loading = isLoading;

  const [isOnline, setIsOnline] = useState(false);
  useEffect(() => {
    if (!bio?.email) return;

    const pollStatus = () => {
      fetch(`${apiBase}/presence/status?email=${encodeURIComponent(bio.email)}`)
        .then(r => r.json())
        .then(data => setIsOnline(!!data[bio.email]))
        .catch(() => {});
    };

    pollStatus();
    const interval = setInterval(pollStatus, 15000);
    return () => clearInterval(interval);
  }, [bio?.email]);

  // Initialize theme values early
  const template = useMemo(() => bio?.theme?.template || "default", [bio]);

  // SEO Meta Tags - Dynamic based on bio data
  useHeadMeta({
    title: bio ? `${bio.displayName} | Hugo Studio` : 'Hugo Studio',
    description: bio?.bio || 'Khám phá profile độc bản trên Hugo Studio - Nền tảng quản lý bio, booking và portfolio chuyên nghiệp.',
    keywords: `${bio?.displayName || 'Hugo Studio'}, ${bio?.headline || 'Professional Bio'}, Bio page, Portfolio, Booking`,
    ogTitle: bio ? `${bio.displayName} - Hugo Studio` : 'Hugo Studio',
    ogDescription: bio?.bio || 'Tạo bio độc bản với Hugo Studio',
    ogImage: bio?.avatarUrl || 'https://hugo.studio/og-image.jpg',
    ogUrl: window.location.href,
    canonicalUrl: window.location.href
  });

  if (loading) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Loading...</p>
        </div>
      </main>
    );
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

  // Render chosen template
  const themeEl =
    template === "flat" ? <FlatTheme bio={bio} isOnline={isOnline} /> :
    template === "brutalism" ? <BrutalismTheme bio={bio} isOnline={isOnline} /> :
    <DefaultTheme bio={bio} isOnline={isOnline} />;

  // Live, location-aware weather atmosphere over the bio — on by default, unless
  // the bio opts out (theme.weatherBackground === false) or the viewer turned it
  // off on their device. Uses silent IP-level location (no GPS prompt).
  const weatherEnabled = isWeatherBgEnabled() && bio?.theme?.weatherBackground !== false;

  return (
    <>
      {themeEl}
      <WeatherLayer enabled={weatherEnabled} opacity={0.9} />
    </>
  );
}
