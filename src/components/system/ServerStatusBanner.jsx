import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import HugoDrop from "./HugoDrop";
import { API_BASE } from "../../config/apiBase";

/**
 * Dải nổi khi máy chủ không trả lời (502/503/504) hoặc mất mạng (thay OfflineBanner cũ) — KHÔNG chặn
 * thao tác: phần đã tải vẫn dùng được. Request kế tiếp thành công là dải tự đổi
 * sang "Đã kết nối lại" rồi tắt. Nguồn tín hiệu: lib/serverHealth (interceptor).
 */
export default function ServerStatusBanner() {
  const { t } = useTranslation();
  const [state, setState] = useState(() => (navigator.onLine === false ? "offline" : null)); // null | "server" | "offline" | "back"

  useEffect(() => {
    let hideTimer;
    const onHealth = (event) => {
      window.clearTimeout(hideTimer);
      if (event.detail.ok) {
        setState((prev) => (prev ? "back" : null));
        hideTimer = window.setTimeout(() => setState(null), 2200);
      } else {
        setState(navigator.onLine === false ? "offline" : "server");
      }
    };
    const offline = () => setState("offline");
    const online = () => onHealth({ detail: { ok: true } });
    window.addEventListener("hugo:server-health", onHealth);
    window.addEventListener("offline", offline);
    window.addEventListener("online", online);
    return () => {
      window.clearTimeout(hideTimer);
      window.removeEventListener("hugo:server-health", onHealth);
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", online);
    };
  }, []);

  // Đang chờ máy chủ thức dậy: tự gõ cửa /health mỗi 10 giây. Request đi qua
  // interceptor, nên trả lời được là serverHealth tự phát "ok" và dải tự tắt —
  // không phụ thuộc người dùng phải bấm gì.
  useEffect(() => {
    if (state !== "server") return undefined;
    const timer = window.setInterval(() => { fetch(`${API_BASE}/health`, { cache: "no-store" }).catch(() => {}); }, 10_000);
    return () => window.clearInterval(timer);
  }, [state]);

  if (!state) return null;
  const text = {
    server: t("system.banner.server", { defaultValue: "Máy chủ đang khởi động · tự thử lại" }),
    offline: t("system.banner.offline", { defaultValue: "Mất kết nối mạng" }),
    back: t("system.banner.back", { defaultValue: "Đã kết nối lại" }),
  }[state];

  return (
    <div className="hs-banner" role="status" aria-live="polite">
      {state === "back"
        ? <span className="material-symbols-outlined text-[22px]" aria-hidden="true">check_circle</span>
        : <HugoDrop mode={state === "offline" ? "rest" : "fill"} className="h-6 w-6" label="" />}
      <span>{text}</span>
    </div>
  );
}
