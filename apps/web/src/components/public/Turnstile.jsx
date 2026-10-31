import { useEffect, useRef } from "react";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let loading;
const loadScript = () => (loading ??= new Promise((resolve, reject) => {
  const s = document.createElement("script");
  s.src = SCRIPT;
  s.async = true;
  s.onload = () => resolve(window.turnstile);
  s.onerror = reject;
  document.head.appendChild(s);
}));

export const turnstileEnabled = Boolean(SITE_KEY);

/**
 * Ô xác minh Cloudflare Turnstile (miễn phí). Không có VITE_TURNSTILE_SITE_KEY
 * thì không vẽ gì — server cũng chỉ bắt buộc khi có TURNSTILE_SECRET.
 * Token chỉ dùng một lần: đổi `resetKey` sau mỗi lần gửi để lấy token mới.
 */
export default function Turnstile({ action, onToken, resetKey = 0 }) {
  const box = useRef(null);
  const widget = useRef(null);

  useEffect(() => {
    if (!SITE_KEY) return undefined;
    let cancelled = false;
    loadScript().then((ts) => {
      if (cancelled || !box.current) return;
      widget.current = ts.render(box.current, {
        sitekey: SITE_KEY,
        action,
        theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
        callback: onToken,
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
    }).catch(() => onToken(""));
    return () => {
      cancelled = true;
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
    // onToken là setter ổn định; vẽ lại chỉ khi action đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  useEffect(() => {
    if (resetKey && widget.current) { window.turnstile?.reset(widget.current); onToken(""); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  return SITE_KEY ? <div ref={box} className="min-h-[65px]" /> : null;
}
