import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { claimInfoBonus } from "../../services/joyApi";
import { useJoyStore } from "../../stores/joyStore";
import pkg from "../../../package.json";

const FEATURE_ICONS = {
  bio: "badge",
  helpdesk: "support_agent",
  handle: "handyman",
  psychology: "psychology",
  ide: "code",
  radio: "radio",
  arcade: "stadium",
  aura: "blur_on"
};
const FEATURE_IDS = Object.keys(FEATURE_ICONS);
const GUIDE_STEPS = ["step1", "step2", "step3", "step4"];

export default function MemberInfoVersionTab({ bio, onBioUpdate, showToast, onBack }) {
  const { t } = useTranslation();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(!!bio?.infoBonusClaimed);

  const handleClaim = async () => {
    if (claimed || claiming || !bio?.email) return;
    setClaiming(true);
    try {
      const res = await claimInfoBonus(bio.email);
      setClaimed(true);
      onBioUpdate?.({ infoBonusClaimed: true });
      if (!res.alreadyClaimed) {
        showToast?.(t("memberPortal.infoVersion.bonusSuccess"), "success");
        useJoyStore.getState().fetchBalance(bio.email);
      }
    } catch (_) {
      showToast?.(t("memberPortal.infoVersion.bonusError"), "error");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-fadeIn">
      <div className="flex items-center gap-2 px-1">
        {onBack && (
          <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
        )}
        <div className="space-y-1 text-left">
          <h2 className="text-sm font-black text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary">info</span>
            {t("memberPortal.infoVersion.title")}
          </h2>
          <p className="text-[10px] text-zinc-455 dark:text-zinc-400">{t("memberPortal.infoVersion.desc")}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-card rounded-lg border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm p-4 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>
          {t("memberPortal.infoVersion.aboutTitle")}
        </h3>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {t("memberPortal.infoVersion.aboutBody")}
        </p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {t("memberPortal.infoVersion.aboutBody2")}
        </p>
      </div>

      <div className="bg-white dark:bg-card rounded-lg border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">apps</span>
          {t("memberPortal.infoVersion.featuresTitle")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {FEATURE_IDS.map((id) => (
            <div key={id} className="flex items-start gap-2.5 p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50">
              <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">{FEATURE_ICONS[id]}</span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200">{t(`memberPortal.infoVersion.features.${id}.title`)}</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-snug">{t(`memberPortal.infoVersion.features.${id}.desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-card rounded-lg border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">checklist</span>
          {t("memberPortal.infoVersion.guideTitle")}
        </h3>
        <ol className="space-y-2.5">
          {GUIDE_STEPS.map((step, idx) => (
            <li key={step} className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200">{t(`memberPortal.infoVersion.guide.${step}.title`)}</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-snug">{t(`memberPortal.infoVersion.guide.${step}.desc`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-white dark:bg-card rounded-lg border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm p-4 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">new_releases</span>
          {t("memberPortal.infoVersion.versionLabel")}
        </h3>
        <p className="text-2xl font-black text-zinc-800 dark:text-white tracking-tight">v{pkg.version}</p>
        <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{t("memberPortal.infoVersion.versionNote")}</p>
      </div>

      <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 rounded-lg border border-amber-200/60 dark:border-amber-800/40 shadow-sm p-4 space-y-3">
        <span className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-amber-300/30 dark:bg-amber-500/10 blur-2xl pointer-events-none" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-2 relative z-10">
          <span className="material-symbols-outlined text-amber-500 text-lg">redeem</span>
          {t("memberPortal.infoVersion.bonusTitle")}
        </h3>
        <p className="text-[11px] text-amber-700/80 dark:text-amber-300/70 leading-relaxed relative z-10">
          {t("memberPortal.infoVersion.bonusDesc")}
        </p>
        <button
          onClick={handleClaim}
          disabled={claimed || claiming}
          className={`relative z-10 w-full py-2.5 rounded-md text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
            claimed
              ? "bg-amber-200/50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 cursor-default"
              : "bg-amber-500 hover:bg-amber-600 text-white shadow-md active:scale-[0.98]"
          }`}
        >
          <span className="material-symbols-outlined text-sm">{claimed ? "check_circle" : "card_giftcard"}</span>
          {claiming
            ? t("memberPortal.infoVersion.bonusClaiming")
            : claimed
            ? t("memberPortal.infoVersion.bonusClaimed")
            : t("memberPortal.infoVersion.bonusButton")}
        </button>
      </div>
    </div>
  );
}
