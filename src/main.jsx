import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n/config.js'
import { initSecurityShield } from './utils/security.js'

// Kích hoạt khiên bảo mật chống F12/Hacker
initSecurityShield();

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  // Dev should always load fresh Vite modules instead of any previously cached PWA assets.
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister().catch(() => {});
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
