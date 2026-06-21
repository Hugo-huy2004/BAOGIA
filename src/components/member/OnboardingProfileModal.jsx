import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const apiBase = import.meta.env.VITE_API_URL || "/api";

export default function OnboardingProfileModal({ email, onDone }) {
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
      <div className="bg-white dark:bg-[#15141c] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center mx-auto text-2xl">🎁</div>
          <h2 className="font-black text-lg text-zinc-900 dark:text-white">{t("memberPortal.onboarding.title")}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("memberPortal.onboarding.subtitle")}</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ml-1">
              {t("memberPortal.onboarding.phoneLabel")}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder={t("memberPortal.onboarding.phonePlaceholder")}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#0c0b11] text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-zinc-900 dark:text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ml-1">
              {t("memberPortal.onboarding.referralLabel")}
            </label>
            <input
              type="text"
              value={referrerCode}
              onChange={e => setReferrerCode(e.target.value.toUpperCase())}
              placeholder={t("memberPortal.onboarding.referralPlaceholder")}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#0c0b11] text-sm font-mono tracking-widest focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-zinc-900 dark:text-white"
            />
            <p className="text-[10px] text-zinc-400 ml-1">{t("memberPortal.onboarding.referralHint")}</p>
          </div>
        </div>

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {submitting ? t("memberPortal.onboarding.submitting") : t("memberPortal.onboarding.submitButton")}
        </button>
      </div>
    </div>
  );
}
