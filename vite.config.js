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
        ],
      },
      manifest: {
        name: 'Hugo Studio Portal',
        short_name: 'Hugo Studio',
        description: 'Nền tảng Biolink & Sức khỏe Tâm lý dành cho học sinh sinh viên',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'favicon/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'favicon/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
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
      // IoT WebSocket → Python server
      '/ws/iot': {
        target: 'ws://127.0.0.1:8000',
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
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          framer: ['framer-motion'],
          ui: ['lucide-react', 'react-quill'],
        }
      }
    }
  },
  esbuild: {
    drop: ['console', 'debugger'],
  }
})
