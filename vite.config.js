import { defineConfig, createLogger } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'
import { VitePWA } from 'vite-plugin-pwa'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { visualizer } from 'rollup-plugin-visualizer'

/* Dev thường chỉ chạy mỗi Vite (một cổng), backend 8081 không bật — mỗi request
   /api đổ ra một stack trace "http proxy error" làm trôi hết log thật. Nuốt đúng
   trường hợp ECONNREFUSED; lỗi proxy khác vẫn in đầy đủ. */
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

  // A native WebView has no shared origin with the API, so a relative "/api"
  // would resolve against capacitor://localhost. Fail the build rather than
  // ship an app whose every request 404s on the device.
  if (isNative && !/^https?:\/\//i.test(process.env.VITE_API_URL || "")) {
    throw new Error(
      "Native build needs an absolute VITE_API_URL (e.g. https://api.hugowishpax.studio/api)",
    );
  }

  return {
  resolve: {
    // The virtual module ships with the PWA plugin; without it the import in
    // PWAUpdatePrompt cannot resolve, so point it at an inert stub.
    alias: isNative
      ? { "virtual:pwa-register/react": "/src/config/pwaRegisterStub.js" }
      : {},
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
        importScripts: ['/push-sw.js'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/ws\//],
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2,png}'],
        // Heavy member applications are cached on first use by the runtime
        // app-assets rule below. Keeping them out of install-time precache
        // avoids downloading several megabytes before the member opens them.
        globIgnores: [
          '**/Admin*',
          '**/DiscoveryMap-*',
          '**/MemberRadioTab-*',
          '**/MemberIdeTab-*',
          '**/BanhocduongTab-*',
          '**/lessons-*',
          '**/hls-*',
        ],
        runtimeCaching: [
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
        display: 'standalone',
        display_override: ['standalone'],
        orientation: 'any',
        scope: '/',
        start_url: '/member/today?source=pwa',
        icons: [
          { src: 'favicon/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'favicon/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        share_target: {
          action: '/hugoskin',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            files: [
              {
                name: 'image',
                accept: ['image/*']
              }
            ]
          }
        },
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
  ],
  customLogger: quietLogger,
  server: {
    port: 3000,
    host: true,
    // COOP header intentionally omitted — same-origin-allow-popups blocks
    // Google Sign-In's cross-origin postMessage between its iframe/popup and
    // the parent page.  See vercel.json for the production decision.
    proxy: {
      // AI endpoints → Python server (Vercel production or local 8000)
      '/api/ai': {
        target: process.env.VITE_AI_SERVER_URL || 'https://hugostudio-ai.vercel.app',
        changeOrigin: true,
        secure: false,
      },
      '/api/iot': {
        target: process.env.VITE_AI_SERVER_URL || 'https://hugostudio-ai.vercel.app',
        changeOrigin: true,
        secure: false,
      },
      // Sleep AI analysis → Python server
      '/api/sleep/analyze': {
        target: process.env.VITE_AI_SERVER_URL || 'https://hugostudio-ai.vercel.app',
        changeOrigin: true,
        secure: false,
      },
      // IoT WebSocket → Python server
      '/ws/iot': {
        target: process.env.VITE_AI_WS_URL || 'wss://hugostudio-ai.vercel.app',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      // Chess WebSocket → Node.js backend
      '/ws/chess': {
        target: process.env.VITE_WS_URL || 'wss://baogia-x9lk.onrender.com',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      // Member wallet/notification realtime channel → Node.js backend
      '/ws': {
        target: process.env.VITE_WS_URL || 'wss://baogia-x9lk.onrender.com',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      // Everything else → Render Node.js production backend (or local 8081 if VITE_DEV_BACKEND_URL is set)
      '/api': {
        target: process.env.VITE_DEV_BACKEND_URL || 'https://baogia-x9lk.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    minify: 'oxc',
    cssMinify: 'lightningcss',
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
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
