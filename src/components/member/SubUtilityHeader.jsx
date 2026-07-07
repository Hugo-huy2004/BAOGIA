import React from "react";
import { useTranslation } from "react-i18next";

export default function SubUtilityHeader({ title, icon, colorClass, onBack }) {
  const { t } = useTranslation();
  
  return (
    <div className="flex justify-between items-center gap-4 flex-wrap pb-4 border-b border-border/60 mb-6">
      {onBack ? (
        <button
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-md border border-border/60 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
        >
          <span className="material-symbols-outlined text-xs">arrow_back_ios</span> {t("memberPortal.utilitiesPage.back")}
        </button>
      ) : <span />}

      <div className="flex items-center gap-2">
        <span className={`material-symbols-outlined text-base ${colorClass}`}>{icon}</span>
        <h3 className="text-sm font-black uppercase tracking-wider text-foreground">{title}</h3>
      </div>
    </div>
  );
}
