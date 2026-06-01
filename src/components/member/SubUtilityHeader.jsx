import React from "react";
import { useTranslation } from "react-i18next";

export default function SubUtilityHeader({ title, icon, colorClass, onBack }) {
  const { t } = useTranslation();
  
  return (
    <div className="flex justify-between items-center gap-4 flex-wrap pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-6">
      <button 
        onClick={onBack}
        className="px-3.5 py-1.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
      >
        <span className="material-symbols-outlined text-xs">arrow_back_ios</span> {t("memberPortal.utilitiesPage.back")}
      </button>

      <div className="flex items-center gap-2">
        <span className={`material-symbols-outlined text-base ${colorClass}`}>{icon}</span>
        <h3 className="text-sm font-black uppercase tracking-wider text-zinc-800 dark:text-white">{title}</h3>
      </div>
    </div>
  );
}
