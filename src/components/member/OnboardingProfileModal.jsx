import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const apiBase = import.meta.env.VITE_API_URL || "/api";

export default function OnboardingProfileModal({ email, onDone, onSkip }) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [referrerCode, setReferrerCode] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return (params.get("ref") || "").toUpperCase();
    } catch (_) {
      return "";
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const r = await fetch(`${apiBase}/bios/me/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, phone, referrerCode }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Có lỗi xảy ra.");
      onDone?.(data);
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#15141c] border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-warning/15 dark:bg-warning/10 flex items-center justify-center mx-auto text-2xl">🎁</div>
          <h2 className="font-black text-lg text-foreground">{t("memberPortal.onboarding.title")}</h2>
          <p className="text-xs text-muted-foreground">{t("memberPortal.onboarding.subtitle")}</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">
              {t("memberPortal.onboarding.phoneLabel")}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder={t("memberPortal.onboarding.phonePlaceholder")}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white dark:bg-[#0c0b11] text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">
              {t("memberPortal.onboarding.referralLabel")}
            </label>
            <input
              type="text"
              value={referrerCode}
              onChange={e => setReferrerCode(e.target.value.toUpperCase())}
              placeholder={t("memberPortal.onboarding.referralPlaceholder")}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white dark:bg-[#0c0b11] text-sm font-mono tracking-widest focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground"
            />
            <p className="text-[10px] text-zinc-400 ml-1">{t("memberPortal.onboarding.referralHint")}</p>
          </div>
        </div>

        {error && <p className="text-xs text-destructive text-center">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-foreground text-background text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {submitting ? t("memberPortal.onboarding.submitting") : t("memberPortal.onboarding.submitButton")}
        </button>

        {onSkip && (
          <button
            onClick={onSkip}
            disabled={submitting}
            className="w-full -mt-1 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {t("memberPortal.onboarding.skipButton", "Để sau")}
          </button>
        )}
      </div>
    </div>
  );
}
