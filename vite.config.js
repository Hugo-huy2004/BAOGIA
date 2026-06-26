import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon/**', 'image/**'],
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        importScripts: ['/push-sw.js'],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
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
        ],
      },
      manifest: {
        name: 'Hugo Studio Portal',
        short_name: 'Hugo Studio',
        description: 'Nền tảng Biolink & Sức khỏe Tâm lý dành cho học sinh sinh viên',
        theme_color: '#0b0a0f',
        background_color: '#0b0a0f',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'favicon/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'favicon/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        shortcuts: [
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
            url: '/?tab=account',
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
            if (id.includes('framer-motion')) return 'framer';
            if (id.includes('react-quill') || id.includes('/quill/')) return 'quill';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('@radix-ui')) return 'radix';
            if (id.includes('i18next') || id.includes('react-i18next')) return 'i18n';
            if (id.includes('zustand') || id.includes('swr')) return 'state';
            if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('/react/')) return 'vendor';
          }
          if (id.includes('src/components/demos/')) return 'demos';
          if (id.includes('src/components/member/banhocduong/')) return 'banhocduong';
        }
      }
    }
  }
})
