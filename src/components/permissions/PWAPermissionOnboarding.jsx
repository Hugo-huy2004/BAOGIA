import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BellRing, Check, ChevronRight, LocateFixed, Mail, MapPin, ShieldCheck, X } from "lucide-react";
import { pwaPermissionService } from "../../services/pwaPermissionService";
import { getMemberToken } from "../../services/api/core/authSession";
import "../../styles/pwaPermissionOnboarding.css";

const EMPTY_SNAPSHOT = {
  push: { supported: true, permission: "default", subscribed: false, ready: false },
  location: { supported: true, permission: "prompt", ready: false },
  complete: false,
  standalone: false,
};

const apiBase = import.meta.env.VITE_API_URL || "/api";

// Email cập nhật nằm ở UserProfile.marketing — cùng endpoint với công tắc trong Cài đặt.
async function marketingRequest(method, body) {
  const res = await fetch(`${apiBase}/profile/me/marketing`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getMemberToken()}` },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`marketing ${method} failed`);
  return Boolean((await res.json()).enabled);
}

/**
 * Thông báo ứng dụng là BẮT BUỘC (chở tin bảo mật + biến động JOY): thiếu là tấm
 * này hiện mỗi lần mở portal, không có nút đóng. Bật lần đầu → server gửi push +
 * thư chào mừng (welcomeService).
 *
 * Email ưu đãi thì KHÔNG được ép: NĐ 13/2023 đòi đồng ý tự nguyện, NĐ 91/2020 cấm
 * gửi quảng cáo khi chưa đồng ý. Nên chỉ mời — tối đa EMAIL_ASKS lần, cách nhau
 * EMAIL_ASK_GAP — và luôn đóng được. Vị trí vẫn hỏi một lần như cũ.
 */
const EMAIL_ASKS = 3;
const EMAIL_ASK_GAP = 7 * 86_400_000;

function readEmailAsks(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || { count: 0, last: 0 };
  } catch {
    return { count: 0, last: 0 };
  }
}
export default function PWAPermissionOnboarding({ email, enabled = true }) {
  const { t } = useTranslation();
  const [snapshot, setSnapshot] = useState(EMPTY_SNAPSHOT);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [emailOn, setEmailOn] = useState(null);
  const emailOnRef = useRef(null);
  emailOnRef.current = emailOn;

  // localStorage, not sessionStorage: every PWA launch is a fresh session, so a
  // session-scoped key re-asked on each open. Đây là cờ ĐÃ HỎI, không phải cờ
  // đã từ chối — hỏi một lần rồi thôi, bất kể người dùng trả lời gì. Đổi ý thì
  // vào phần cài đặt quyền của trình duyệt.
  const askedKey = useMemo(
    () => `hugo:permission-primer:${String(email || "").toLowerCase()}`,
    [email],
  );
  const emailAskKey = `hugo:email-offer-asks:${String(email || "").toLowerCase()}`;

  const refresh = useCallback(async () => {
    const next = await pwaPermissionService.getSnapshot();
    setSnapshot(next);
    if (next.complete && emailOnRef.current !== false) setVisible(false);
    return next;
  }, []);

  useEffect(() => {
    if (!enabled || !email) return undefined;
    let cancelled = false;
    const stopWatching = pwaPermissionService.watch(() => refresh().catch(() => {}));
    const timer = window.setTimeout(async () => {
      const [next, mail] = await Promise.all([
        refresh().catch(() => EMPTY_SNAPSHOT),
        marketingRequest("GET").catch(() => null),
      ]);
      if (cancelled) return;
      setEmailOn(mail);
      const pushMissing = next.push.supported && !next.push.ready;
      const asks = readEmailAsks(emailAskKey);
      const offerEmail = mail === false && asks.count < EMAIL_ASKS && Date.now() - asks.last > EMAIL_ASK_GAP;
      if (offerEmail) {
        try {
          localStorage.setItem(emailAskKey, JSON.stringify({ count: asks.count + 1, last: Date.now() }));
        } catch { /* không lưu được thì lần sau hỏi lại — vẫn có trần ở phía người dùng đóng */ }
      }
      if (!pushMissing && !offerEmail && (next.complete || localStorage.getItem(askedKey) === "true")) return;
      // Đánh dấu ngay lúc hiện, không đợi tới lúc bấm nút: người dùng đóng bằng
      // cách nào — nút X, "Để sau", hay tắt app — cũng không bị hỏi lại.
      localStorage.setItem(askedKey, "true");
      setVisible(true);
      if (next.push.permission === "granted" && !next.push.subscribed) {
        pwaPermissionService.repairPushSubscription(email).then(refresh).catch(() => {});
      }
    }, 1600);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      stopWatching();
    };
  }, [askedKey, emailAskKey, email, enabled, refresh]);

  // Mở lại theo yêu cầu (hàng "Quyền truy cập" trong Cài đặt) — bỏ qua cờ đã hỏi
  // vì đây là hành động chủ động của người dùng.
  useEffect(() => {
    const open = () => {
      // KHÔNG dùng refresh() ở đây: refresh tự setVisible(false) khi quyền đã đủ,
      // nên với người đã cấp hết (complete), bấm nút sẽ nháy rồi tắt ngay = "nút
      // không phản ứng". Mở thủ công phải luôn hiện để xem/đổi trạng thái quyền.
      setVisible(true);
      pwaPermissionService.getSnapshot().then(setSnapshot).catch(() => {});
      marketingRequest("GET").then(setEmailOn).catch(() => {});
    };
    window.addEventListener("hugo:show-permission-primer", open);
    return () => window.removeEventListener("hugo:show-permission-primer", open);
  }, []);

  const dismiss = () => setVisible(false);

  const enablePush = async () => {
    if (!snapshot.push.supported) {
      window.dispatchEvent(new Event("show-pwa-install-guide"));
      return;
    }
    setBusy("push");
    setError("");
    try {
      await pwaPermissionService.enablePush(email);
      await refresh();
    } catch {
      setError(t("memberPortal.permissions.pushError"));
      await refresh();
    } finally {
      setBusy("");
    }
  };

  const enableEmail = async () => {
    setBusy("email");
    setError("");
    try {
      setEmailOn(await marketingRequest("PATCH", { enabled: true }));
    } catch {
      setError(t("memberPortal.permissions.emailError"));
    } finally {
      setBusy("");
    }
  };

  const enableLocation = async () => {
    setBusy("location");
    setError("");
    try {
      await pwaPermissionService.enableLocation();
      await refresh();
    } catch {
      setError(t("memberPortal.permissions.locationError"));
      await refresh();
    } finally {
      setBusy("");
    }
  };

  if (!visible || !enabled || !email) return null;

  const pushBlocked = snapshot.push.permission === "denied";
  const locationBlocked = snapshot.location.permission === "denied";
  const mandatoryMissing = snapshot.push.supported && !snapshot.push.ready;

  return (
    <div className="pwa-permission-layer" role="presentation">
      <section
        className="pwa-permission-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-permission-title"
      >
        {!mandatoryMissing && (
          <button type="button" className="pwa-permission-close" onClick={dismiss} aria-label={t("memberPortal.permissions.close")}>
            <X aria-hidden="true" />
          </button>
        )}

        <div className="pwa-permission-hero" aria-hidden="true">
          <span><BellRing /></span>
          <span><MapPin /></span>
          <span><ShieldCheck /></span>
        </div>

        <header className="pwa-permission-heading">
          <p>{t("memberPortal.permissions.eyebrow")}</p>
          <h2 id="pwa-permission-title">{t("memberPortal.permissions.title")}</h2>
          <span>{t("memberPortal.permissions.description")}</span>
        </header>

        <div className="pwa-permission-options">
          <article className={snapshot.push.ready ? "is-ready" : ""}>
            <div className="pwa-permission-option-icon is-push">
              <BellRing aria-hidden="true" />
            </div>
            <div className="pwa-permission-option-copy">
              <h3>{t("memberPortal.permissions.pushTitle")}</h3>
              <p>{t("memberPortal.permissions.pushDescription")}</p>
              {pushBlocked ? <small>{t("memberPortal.permissions.browserSettingsHint")}</small> : null}
            </div>
            {snapshot.push.ready ? (
              <span className="pwa-permission-ready"><Check aria-hidden="true" /></span>
            ) : (
              <button type="button" onClick={enablePush} disabled={Boolean(busy)}>
                {busy === "push"
                  ? t("memberPortal.permissions.enabling")
                  : !snapshot.push.supported
                    ? t("memberPortal.permissions.install")
                    : pushBlocked
                      ? t("memberPortal.permissions.viewGuide")
                      : t("memberPortal.permissions.enable")}
                <ChevronRight aria-hidden="true" />
              </button>
            )}
          </article>

          <article className={emailOn ? "is-ready" : ""}>
            <div className="pwa-permission-option-icon is-push">
              <Mail aria-hidden="true" />
            </div>
            <div className="pwa-permission-option-copy">
              <h3>{t("memberPortal.permissions.emailTitle")}</h3>
              <p>{t("memberPortal.permissions.emailDescription")}</p>
            </div>
            {emailOn ? (
              <span className="pwa-permission-ready"><Check aria-hidden="true" /></span>
            ) : (
              <button type="button" onClick={enableEmail} disabled={Boolean(busy)}>
                {busy === "email" ? t("memberPortal.permissions.enabling") : t("memberPortal.permissions.enable")}
                <ChevronRight aria-hidden="true" />
              </button>
            )}
          </article>

          <article className={snapshot.location.ready ? "is-ready" : ""}>
            <div className="pwa-permission-option-icon is-location">
              <LocateFixed aria-hidden="true" />
            </div>
            <div className="pwa-permission-option-copy">
              <h3>{t("memberPortal.permissions.locationTitle")}</h3>
              <p>{t("memberPortal.permissions.locationDescription")}</p>
              {locationBlocked ? <small>{t("memberPortal.permissions.browserSettingsHint")}</small> : null}
            </div>
            {snapshot.location.ready ? (
              <span className="pwa-permission-ready"><Check aria-hidden="true" /></span>
            ) : (
              <button type="button" onClick={enableLocation} disabled={Boolean(busy) || !snapshot.location.supported}>
                {busy === "location" ? t("memberPortal.permissions.enabling") : t("memberPortal.permissions.enable")}
                <ChevronRight aria-hidden="true" />
              </button>
            )}
          </article>
        </div>

        {error ? <p className="pwa-permission-error" role="alert">{error}</p> : null}

        <div className="pwa-permission-trust">
          <ShieldCheck aria-hidden="true" />
          <p>
            <strong>{t("memberPortal.permissions.privacyTitle")}</strong>
            <span>{t("memberPortal.permissions.privacyDescription")}</span>
          </p>
        </div>

        {mandatoryMissing ? (
          <p className="pwa-permission-error" role="status">{t("memberPortal.permissions.requiredHint")}</p>
        ) : (
          <button type="button" className="pwa-permission-later" onClick={dismiss}>
            {t("memberPortal.permissions.later")}
          </button>
        )}
      </section>
    </div>
  );
}
