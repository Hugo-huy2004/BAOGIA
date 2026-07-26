/**
 * StandaloneInstallButton.jsx
 * Nút tải ứng dụng độc lập hiển thị thông minh (Smart Display Standalone App Downloader).
 * Tự động ẩn khi đã chạy ở dạng PWA Standalone Mode, giúp giao diện chuẩn Apple tối giản.
 */

import { useState, useEffect } from "react";
import { triggerPWAInstallDirectly } from "../../utils/pwaInstallTrigger";

export default function StandaloneInstallButton({ appTitle, appId, className = "" }) {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    setIsStandalone(standalone);
  }, []);

  // Hiển thị thông minh: Nếu đã chạy PWA Standalone thì ẨN nút để giữ giao diện chuẩn Apple
  if (isStandalone) return null;

  const handleInstallClick = (e) => {
    e?.stopPropagation?.();
    triggerPWAInstallDirectly().catch(() => {});
  };

  return (
    <button
      type="button"
      onClick={handleInstallClick}
      title={`Cài đặt ${appTitle || 'ứng dụng'} thành app độc lập trên màn hình chính`}
      className={`px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-medium text-xs transition-all duration-200 active:scale-95 flex items-center gap-1 shrink-0 ${className}`}
    >
      <span className="material-symbols-outlined text-[16px]">download_for_offline</span>
      <span>Tải app</span>
    </button>
  );
}
