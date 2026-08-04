/**
 * StandaloneInstallButton.jsx
 * Nút tải ứng dụng độc lập hiển thị thông minh (Smart Display Standalone App Downloader).
 * Tự động ẩn khi đã chạy ở dạng PWA Standalone Mode, giúp giao diện chuẩn Apple tối giản.
 */

import { useState, useEffect } from "react";
import { triggerPWAInstallDirectly } from "../../utils/pwaInstallTrigger";
import { isStandalone as isAppMode } from "../../config/platform";

export default function StandaloneInstallButton({ appTitle, appId, className = "" }) {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(isAppMode());
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
      className={`flex h-11 shrink-0 items-center gap-1 rounded-xl pl-2 pr-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted ${className}`}
    >
      <span className="material-symbols-outlined text-[20px]">install_mobile</span>
      <span className="text-[14px] font-medium">Tải app</span>
    </button>
  );
}
