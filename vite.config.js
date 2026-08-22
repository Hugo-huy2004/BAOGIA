import { defineConfig, createLogger } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'
import { VitePWA } from 'vite-plugin-pwa'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { visualizer } from 'rollup-plugin-visualizer'
import { sentryVitePlugin } from '@sentry/vite-plugin'

/* Cổng backend cục bộ. KHÔNG dùng 8081: đó là cổng mặc định của Metro/Expo, nên
   bất cứ dự án React Native nào đang mở cũng chiếm mất — và Metro trả về HTML
   kèm status 200 cho mọi đường dẫn, nên `/api/*` "thành công" với một trang web
   thay vì JSON. Lỗi đó trông y hệt lỗi backend, mất hàng giờ mới lần ra. */
const DEV_BACKEND = process.env.VITE_DEV_BACKEND_URL || 'http://localhost:8099'
const DEV_WS = process.env.VITE_WS_URL || DEV_BACKEND.replace(/^http/, 'ws')

/* Backend chưa bật thì mỗi request /api đổ ra một stack trace "http proxy error"
   làm trôi hết log thật. Nuốt đúng trường hợp ECONNREFUSED; lỗi proxy khác vẫn
   in đầy đủ. */
const quietLogger = createLogger()
const logError = quietLogger.error.bind(quietLogger)
quietLogger.error = (msg, opts) => {
  if (opts?.error?.code === 'ECONNREFUSED' && String(msg).includes('proxy error')) return
  logError(msg, opts)
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Native builds ship without the PWA layer: a service worker inside a
  // Capacitor WebView pins the app to a cached shell, so store updates never
  // reach the device. The web build keeps it.
  const isNative = process.env.VITE_BUILD_TARGET === "native";
  const sentryBuildEnabled = Boolean(
    process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
  );

  // A native WebView has no shared origin with the API, so a relative "/api"
  // would resolve against capacitor://localhost. Fail the build rather than
  // ship an app whose every request 404s on the device.
  if (isNative && !/^https?:\/\//i.test(process.env.VITE_API_URL || "")) {
    throw new Error(
      "Native build needs an absolute VITE_API_URL (e.g. https://api.hugowishpax.studio/api)",
    );
  }

  return {
  // Vite only inlines VITE_* keys that are actually set, and the web build
  // never sets this one — so it stayed a runtime lookup, IS_NATIVE was never a
  // build-time constant, and Rollup kept every native-only branch. Result:
  // browser visitors precached ~32K of Capacitor plugin chunks they can't run.
  // Defining it here folds the constant no matter how the build is invoked.
  define: {
    "import.meta.env.VITE_BUILD_TARGET": JSON.stringify(isNative ? "native" : "web"),
  },
  resolve: {
    // The virtual module ships with the PWA plugin; without it the import in
    // PWAUpdatePrompt cannot resolve, so point it at an inert stub.
    alias: isNative
      ? { "virtual:pwa-register/react": "/src/config/pwaRegisterStub.js" }
      // Every @capacitor/* import in src/ is behind IS_NATIVE, so none of it is
      // reachable here — but the plugins registerPlugin() at module scope, and
      // a side-effectful module survives tree-shaking, so Rollup emitted an
      // orphan chunk each and the PWA precached them all. Alias them away and
      // there is nothing left to emit. See src/config/capacitorStub.js.
      // The regex must swallow the whole specifier, not just the scope: a
      // partial match would leave the plugin name behind and give each one a
      // distinct module id again.
      // @capgo/* is a Capacitor plugin too (native Google sign-in) and is
      // imported the same guarded way, so it gets the same treatment.
      : [{ find: /^@(capacitor|capgo)\/.*/, replacement: "/src/config/capacitorStub.js" }],
  },
  plugins: [
    react(),
    // npm run build:analyze → dist/stats.html (treemap of bundle composition)
    process.env.ANALYZE ? visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true }) : null,
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 80 },
      jpg: { quality: 80 },
      webp: { lossless: true },
      avif: { lossless: true },
    }),
    isNative ? null : VitePWA({
      registerType: 'autoUpdate',
      // Assets are automatically matched by workbox globPatterns (**/*.{js,css,html,ico,svg,woff2,png})
      includeAssets: [],
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        dontCacheBustURLsMatching: /\.[0-9a-f]{8,10}\./,
        importScripts: ['/push-sw.js'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/ws\//],
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2,png}'],
        // Heavy member applications are cached on first use by the runtime
        // app-assets rule below. Keeping them out of install-time precache
        // avoids downloading several megabytes before the member opens them.
        globIgnores: [
          '**/Admin*',
          '**/MemberRadioTab-*',
          '**/MemberIdeTab-*',
          '**/BanhocduongTab-*',
          '**/lessons-*',
          '**/hls-*',
          '**/favicon/**',
          '**/image/**',
          '**/splash/**',
        ],
        runtimeCaching: [
          // Authorization codes, tokens, consent context and userinfo are
          // security credentials/personal data. They must never enter the
          // service-worker cache, even briefly.
          {
            urlPattern: /\/api\/oauth\//,
            handler: 'NetworkOnly',
          },
          // Arcade leaderboard — StaleWhileRevalidate for instant UI render
          {
            urlPattern: /\/api\/arcade\/leaderboard/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'arcade-leaderboard',
              expiration: { maxEntries: 20, maxAgeSeconds: 30 },
            },
          },
          // Eager Bootstrap & User APIs — NetworkFirst with 1.5s FAST TIMEOUT (Instant fallback to local cache if network hangs)
          {
            urlPattern: /\/api\/bios\/me/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'user-bootstrap-cache',
              networkTimeoutSeconds: 1.5,
              expiration: { maxEntries: 20, maxAgeSeconds: 600 },
            },
          },
          // TODAY đã có cache theo ấn bản/ngôn ngữ ở Node và cache riêng của
          // Eco Mode. Không để service worker trả một ấn bản cũ sau khi người
          // dùng đổi ngôn ngữ (ví dụ UI tiếng Thái nhưng cache tin Việt Nam).
          {
            urlPattern: /\/api\/today\//,
            handler: 'NetworkOnly',
          },
          // Generic API Cache — NetworkFirst with 2.0s FAST TIMEOUT
          {
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 2.0,
              expiration: { maxEntries: 100, maxAgeSeconds: 300 },
            },
          },
          // Cache Google Fonts stylesheets
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          // Cache Google Fonts web font files
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 40,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          // Cache All JS & CSS Chunks (Member, Banhocduong, Therapy, etc.) for instant offline/online launch
          {
            urlPattern: /\/assets\/.*\.(js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'app-assets-chunks',
              expiration: { maxEntries: 120, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
      manifest: {
        name: 'Hugo Studio Portal',
        short_name: 'Hugo Studio',
        description: 'Nền tảng học tập, cộng đồng và tiện ích dành cho học sinh sinh viên',
        id: '/member/',
        theme_color: '#0b0a0f',
        background_color: '#0b0a0f',
        // Chuẩn PWA dùng `standalone`: hệ điều hành vẫn sở hữu status bar /
        // Dynamic Island, còn nội dung ứng dụng dùng CSS safe-area. `fullscreen`
        // làm mất vùng hệ thống trên Android và dễ đặt nút dưới camera cutout.
        // iOS quyết định thêm bằng meta
        // apple-mobile-web-app-capable + status-bar-style=black-translucent
        // trong index.html, cộng viewport-fit=cover — đã có sẵn.
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
      },
    }),
    sentryBuildEnabled ? sentryVitePlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      release: process.env.SENTRY_RELEASE
        ? { name: process.env.SENTRY_RELEASE }
        : undefined,
      sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
      telemetry: false,
    }) : null,
  ],
  customLogger: quietLogger,
  server: {
    port: 3000,
    host: true,
    // COOP header intentionally omitted — same-origin-allow-popups blocks
    // Google Sign-In's cross-origin postMessage between its iframe/popup and
    // the parent page.  See vercel.json for the production decision.
    // Dev phải phản chiếu đúng production: vercel.json rewrite MỌI `/api/*` sang
    // Node, và chỉ Node mới nói chuyện với Python (aiProxyRoutes/sleepRoutes tự
    // gắn `X-Internal-Key` từ biến môi trường server). Trước đây dev bắn thẳng
    // `/api/ai`, `/api/iot`, `/api/sleep/analyze` sang Python — trình duyệt không
    // có (và không được phép có) internal key nên luôn ăn 401, còn
    // `/api/iot/devices|vitals` thì 404 vì mấy route đó chỉ có ở Node.
    //
    // MỘT cổng cho trình duyệt: mọi thứ đi qua http://localhost:3000. Mặc định
    // proxy về backend CỤC BỘ — muốn chạy với backend production thì nói rõ:
    //   VITE_DEV_BACKEND_URL=https://baogia-x9lk.onrender.com npm run dev
    // (Trước đây mặc định là ngược lại, nên sửa xong code server ở máy mà trình
    //  duyệt vẫn nói chuyện với Render — code cũ trả 400, trông như lỗi mình.)
    proxy: {
      // Chess WebSocket → Node.js backend
      '/ws/chess': { target: DEV_WS, ws: true, changeOrigin: true, secure: false },
      // Member wallet/notification realtime channel → Node.js backend
      '/ws': { target: DEV_WS, ws: true, changeOrigin: true, secure: false },
      // Everything else → Node.js backend
      '/api': { target: DEV_BACKEND, changeOrigin: true, secure: false },
    },
  },
  build: {
    minify: 'oxc',
    cssMinify: 'lightningcss',
    chunkSizeWarningLimit: 1000,
    sourcemap: sentryBuildEnabled ? 'hidden' : false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Only manually chunk libraries used ACROSS many routes (shared —
            // deduping them helps). Route-SPECIFIC heavy libs (react-quill =
            // admin editor only, canvas-confetti = arcade/member only) are left
            // to auto-split INTO their lazy route chunk — naming them forced
            // rolldown to preload them on the landing page.
            // Truly-global libs only. @radix-ui and lucide-react are NOT
            // grouped: grouping @radix-ui dragged Dialog/Dropdown/Tabs (lazy
            // routes) onto the landing page just because Tooltip is eager.
            // Per-component auto-split keeps only what each route needs.
            if (id.includes('i18next') || id.includes('react-i18next')) return 'i18n';
            if (id.includes('zustand') || id.includes('swr')) return 'state';
            if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('/react/')) return 'vendor';
          }
          // Do NOT manually chunk app-source folders (demos, banhocduong):
          // forcing a whole folder into one named chunk made rolldown hoist it
          // into the ENTRY's static graph, so the landing page preloaded
          // ~600KB of HugoPSY it never needed. Letting Vite auto-split keeps
          // each lazy route's code in its own on-demand chunk.
        }
      }
    }
  }
  };
})
