import React from "react";
import { useTranslation } from "react-i18next";
import StandaloneInstallButton from "../ui/StandaloneInstallButton";

export default function SubUtilityHeader({ title, icon, colorClass, onBack, appId }) {
  const { t } = useTranslation();
  
  return (
    <div className="sticky top-0 z-40 bg-card/90 dark:bg-card/95 backdrop-blur-md py-2.5 px-3 flex justify-between items-center gap-3 border-b border-border/60 mb-6 rounded-2xl shadow-sm">
      {onBack ? (
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-full border border-border/60 bg-card hover:bg-muted text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-base font-bold">arrow_back</span>
          <span>Back</span>
        </button>
      ) : <span />}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined text-base ${colorClass}`}>{icon}</span>
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">{title}</h3>
        </div>

        {/* Smart Standalone App Download Button */}
        <StandaloneInstallButton appTitle={title} appId={appId} />
      </div>
    </div>
  );
}
