import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BellRing, Check, ChevronRight, LocateFixed, MapPin, ShieldCheck, X } from "lucide-react";
import { pwaPermissionService } from "../../services/pwaPermissionService";
import "../../styles/pwaPermissionOnboarding.css";

const EMPTY_SNAPSHOT = {
  push: { supported: true, permission: "default", subscribed: false, ready: false },
  location: { supported: true, permission: "prompt", ready: false },
  complete: false,
  standalone: false,
};

export default function PWAPermissionOnboarding({ email, enabled = true }) {
  const { t } = useTranslation();
  const [snapshot, setSnapshot] = useState(EMPTY_SNAPSHOT);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  // localStorage, not sessionStorage: every PWA launch is a fresh session, so a
  // session-scoped key re-asked on each open. Answered once = answered for good;
  // a later change of mind goes through the browser's own site settings.
  const dismissKey = useMemo(
    () => `hugo:permission-primer:${String(email || "").toLowerCase()}`,
    [email],
  );

  const refresh = useCallback(async () => {
    const next = await pwaPermissionService.getSnapshot();
    setSnapshot(next);
    if (next.complete) {
      setVisible(false);
      localStorage.removeItem(dismissKey);
    }
    return next;
  }, [dismissKey]);

  useEffect(() => {
    if (!enabled || !email) return undefined;
    let cancelled = false;
    const stopWatching = pwaPermissionService.watch(() => refresh().catch(() => {}));
    const timer = window.setTimeout(async () => {
      const next = await refresh().catch(() => EMPTY_SNAPSHOT);
      if (cancelled || next.complete || localStorage.getItem(dismissKey) === "true") return;
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
  }, [dismissKey, email, enabled, refresh]);

  const dismiss = () => {
    localStorage.setItem(dismissKey, "true");
    setVisible(false);
  };

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

  return (
    <div className="pwa-permission-layer" role="presentation">
      <section
        className="pwa-permission-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-permission-title"
      >
        <button type="button" className="pwa-permission-close" onClick={dismiss} aria-label={t("memberPortal.permissions.close")}>
          <X aria-hidden="true" />
        </button>

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

        <button type="button" className="pwa-permission-later" onClick={dismiss}>
          {t("memberPortal.permissions.later")}
        </button>
      </section>
    </div>
  );
}
