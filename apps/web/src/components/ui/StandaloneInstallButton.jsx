/**
 * StandaloneInstallButton.jsx
 * Nút tải ứng dụng độc lập hiển thị thông minh (Smart Display Standalone App Downloader).
 * Tự động ẩn khi đã chạy ở dạng PWA Standalone Mode, giúp giao diện chuẩn Apple tối giản.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { triggerPWAInstallDirectly } from "../../utils/pwaInstallTrigger";
import { isStandalone as isAppMode } from "../../config/platform";

export default function StandaloneInstallButton({ appTitle, appId, className = "" }) {
  const { t } = useTranslation();
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
      title={t("pwa.installApp", "Tải app")}
      aria-label={t("pwa.installApp", "Tải app")}
      /* `whitespace-nowrap` + ẩn chữ dưới `sm`: khe actions của thanh tiêu đề hẹp,
         để chữ tự xuống dòng thì "Tải app" vỡ thành hai dòng lệch hẳn thanh nav
         (thấy thật trên HugoAura). Màn hẹp chỉ còn icon — vẫn đủ nghĩa nhờ
         aria-label và tooltip. */
      className={`flex h-11 shrink-0 items-center gap-1 whitespace-nowrap rounded-xl px-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted sm:pl-2 sm:pr-3 ${className}`}
    >
      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">install_mobile</span>
      <span className="hidden text-[14px] font-medium sm:inline">{t("pwa.installApp", "Tải app")}</span>
    </button>
  );
}
