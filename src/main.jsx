import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import i18n, { ensureTranslations } from './i18n/config.js'
import { languageCode } from './i18n/languages.js'
import { initSecurityShield } from './utils/security.js'
import { installApiAuthInterceptor } from './services/apiAuthInterceptor.js'
import { installClientMonitoring } from './utils/clientMonitoring.js'
import { initSentryMonitoring } from './utils/sentryMonitoring.js'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient.js'

// Dynamic import 404 auto-healing: when a new build deployment replaces hashed JS chunks,
// Vite fires 'vite:preload-error'. Automatically reload the window to fetch new manifest.
window.addEventListener('vite:preload-error', (event) => {
  event.preventDefault();
  const lastReload = sessionStorage.getItem('hugo_chunk_404_reload');
  const now = Date.now();
  if (!lastReload || now - parseInt(lastReload, 10) > 8000) {
    sessionStorage.setItem('hugo_chunk_404_reload', String(now));
    window.location.reload();
  }
});

// Kích hoạt khiên bảo mật chống F12/Hacker
initSecurityShield();

// Gắn member token vào mọi request API — phải chạy trước khi App render
// để không có fetch nào lọt qua trước lúc patch.
installApiAuthInterceptor();
initSentryMonitoring();
installClientMonitoring();

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  // Dev should always load fresh Vite modules instead of any previously cached PWA assets.
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister().catch(() => {});
    });
  });
}

const renderApp = () => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>,
  )
}

// The eager VI/EN bundle only covers the public shell. Account and Member
// Portal keys live in the full pack, so every language must be ready before
// mounting React; otherwise the first account frame can leak an English
// fallback (for example “Hugo Bio profile”).
const initialLanguage = languageCode(i18n.resolvedLanguage || i18n.language)
ensureTranslations(initialLanguage).finally(renderApp)
