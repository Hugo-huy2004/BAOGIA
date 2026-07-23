import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'
import { VitePWA } from 'vite-plugin-pwa'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
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
    VitePWA({
      registerType: 'autoUpdate',
      // Precache only favicons — image/** added ~2MB to every first visit;
      // images load on demand and land in the browser/runtime cache instead.
      includeAssets: ['favicon/**'],
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        importScripts: ['/push-sw.js'],
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
        // Don't precache member/admin-only route chunks (~2.5MB): public
        // visitors never need them, and logged-in users fetch them on
        // navigation like a normal SPA (browser HTTP cache still applies).
        // Offline members only lose tabs they've never opened.
        globIgnores: [
          '**/Admin*', '**/Member*', '**/Banhocduong*', '**/Therapy*',
          '**/Chess*', '**/Deco*', '**/HugoArcade*', '**/PartnerBio*',
          '**/decoAssets*', '**/gestures*',
        ],
        runtimeCaching: [
          // Arcade leaderboard — StaleWhileRevalidate so UI shows instantly
          // from cache while fresh data loads in background (matches 8s poll interval)
          {
            urlPattern: /\/api\/arcade\/leaderboard/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'arcade-leaderboard',
              expiration: { maxEntries: 20, maxAgeSeconds: 30 },
            },
          },
          // Arcade profile — NetworkFirst with short TTL so JOY/scores stay fresh
          {
            urlPattern: /\/api\/arcade\/profile/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'arcade-profile',
              expiration: { maxEntries: 10, maxAgeSeconds: 120 },
            },
          },
          {
            urlPattern: /^https:\/\/api\.hugowishpax\.studio\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
          // Cache Google Fonts stylesheets (Plus Jakarta Sans, Quicksand)
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          // Cache Google Fonts web font files (woff2) and Material Symbols font files
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          // Cache Sub-Utility JS Chunks (HugoPSY, HugoSkin, HugoCoder, Chess) for 0ms offline launch
          {
            urlPattern: /\/assets\/.*(Member|Banhocduong|Therapy|Chess|HugoArcade|HugoSkin).*\.js$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'sub-utility-chunks',
              expiration: { maxEntries: 40, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
      manifest: {
        name: 'Hugo Studio Portal',
        short_name: 'Hugo Studio',
        description: 'Nền tảng Biolink & Sức khỏe Tâm lý dành cho học sinh sinh viên',
        theme_color: '#0b0a0f',
        background_color: '#0b0a0f',
        display: 'standalone',
        display_override: ['standalone', 'window-controls-overlay', 'minimal-ui'],
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
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
            url: '/banhocduong',
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
  server: {
    port: 3000,
    host: true,
    // Match production (vercel.json): lets the Google Sign-In popup postMessage
    // back without the "Cross-Origin-Opener-Policy would block" console warning.
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
    proxy: {
      // AI endpoints → Python server (must be listed BEFORE generic /api rule)
      '/api/ai': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/api/iot': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      // Sleep AI analysis → Python server (must be before generic /api rule)
      '/api/sleep/analyze': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      // IoT WebSocket → Python server
      '/ws/iot': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
        changeOrigin: true,
      },
      // Chess WebSocket → Node.js backend
      '/ws/chess': {
        target: 'ws://127.0.0.1:8081',
        ws: true,
        changeOrigin: true,
      },
      // Member wallet/notification realtime channel → Node.js backend
      '/ws': {
        target: 'ws://127.0.0.1:8081',
        ws: true,
        changeOrigin: true,
      },
      // Everything else → Node.js backend
      '/api': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
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
})
