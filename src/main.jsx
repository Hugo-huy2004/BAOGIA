import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n/config.js'
import { initSecurityShield } from './utils/security.js'

// Kích hoạt khiên bảo mật chống F12/Hacker
initSecurityShield();

if ('serviceWorker' in navigator) {
  // Xóa toàn bộ Service Worker cũ để tránh lỗi bad-precaching-response
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister().catch(() => {});
    });
  });
  // Xóa luôn Cache Storage để ép trình duyệt tải file mới
  caches.keys().then((keyList) => {
    return Promise.all(keyList.map((key) => caches.delete(key)));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
