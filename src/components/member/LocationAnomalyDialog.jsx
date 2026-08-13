import { useState } from "react";
import { useTranslation } from "react-i18next";
import { logoutAuth } from "../../services/authSession";

const apiBase = import.meta.env.VITE_API_URL || "/api";

export default function LocationAnomalyDialog({ email, distanceKm, lat, lng, onDismiss }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const handleTrustNewLocation = async () => {
    setBusy(true);
    try {
      await fetch(`${apiBase}/bios/me/reset-trusted-location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, lat, lng }),
      });
    } catch {
      // fail open — dismiss anyway
    } finally {
      setBusy(false);
      onDismiss();
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    await logoutAuth();
    window.location.href = "/login?reason=location_anomaly";
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-background rounded-3xl shadow-2xl border border-border/50 p-6 space-y-5 animate-scaleIn">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-warning text-3xl shrink-0 mt-0.5">location_off</span>
          <div>
            <h2 className="font-bold text-base text-foreground leading-tight">{t("memberPortal.locationAnomaly.title")}</h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {t("memberPortal.locationAnomaly.description", { distance: distanceKm })}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            disabled={busy}
            onClick={handleTrustNewLocation}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">check_circle</span>
            {t("memberPortal.locationAnomaly.trust")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleLogout}
            className="w-full py-3 border border-destructive/50 text-destructive hover:bg-destructive/5 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            {t("memberPortal.locationAnomaly.logout")}
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
          {t("memberPortal.locationAnomaly.guidance")}
        </p>
      </div>
    </div>
  );
}
