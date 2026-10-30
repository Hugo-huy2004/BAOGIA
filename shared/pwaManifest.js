// Manifest PWA — một nguồn cho vite-plugin-pwa (manifest.webmanifest lúc build)
// và cho /api/pwa-manifest ở server (bản có mã chuyển phiên, xem utils/appHandoff.js).
export const PWA_MANIFEST = {
  name: 'Hugo Studio Portal',
  short_name: 'Hugo Studio',
  description: 'Nền tảng học tập, cộng đồng và tiện ích dành cho học sinh sinh viên',
  id: '/member/',
  theme_color: '#0b0a0f',
  background_color: '#0b0a0f',
  // Chủ sở hữu yêu cầu app LUÔN full màn hình. `display_override` được
  // ưu tiên hơn `display`, nên Android ẩn cả status bar lẫn thanh điều
  // hướng; `display: 'standalone'` là bản dự phòng cho trình duyệt chưa
  // hiểu display_override. iOS bỏ qua cả hai và full màn bằng meta
  // apple-mobile-web-app-capable + status-bar-style=black-translucent
  // trong index.html, cộng viewport-fit=cover — đã có sẵn.
  //
  // Đánh đổi đã biết: fullscreen giấu đồng hồ/pin trên Android (vuốt từ
  // mép để gọi lại). Camera cutout vẫn được trình duyệt báo qua
  // env(safe-area-inset-*), và toàn bộ CSS ở đây đã dùng env() nên nút
  // không chui xuống dưới cutout.
  display_override: ['fullscreen', 'standalone'],
  display: 'standalone',
  orientation: 'any',
  scope: '/',
  start_url: '/member/today?source=pwa',
  icons: [
    { src: 'favicon/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: 'favicon/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
  shortcuts: [
    {
      name: 'HugoArcade',
      short_name: 'Arcade',
      description: 'Chơi game, chinh phục thử thách, nhận JOY',
      url: '/member/utilities/arcade',
      icons: [{ src: 'favicon/web-app-manifest-192x192.png', sizes: '192x192' }]
    },
    {
      name: 'Bạn Học Đường',
      short_name: 'Đồng Hành',
      description: 'Đồng hành chăm sóc sức khỏe tinh thần',
      url: '/member/utilities/psychology',
      icons: [{ src: 'favicon/web-app-manifest-192x192.png', sizes: '192x192' }]
    },
    {
      name: 'Hồ Sơ Bio',
      short_name: 'Bio',
      description: 'Quản lý thiết kế Bio cá nhân',
      url: '/member/utilities/bio',
      icons: [{ src: 'favicon/web-app-manifest-192x192.png', sizes: '192x192' }]
    }
  ],
  categories: ['health', 'education', 'productivity'],
  lang: 'vi',
};
