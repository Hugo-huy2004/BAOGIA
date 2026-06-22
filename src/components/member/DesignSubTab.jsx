import React from "react";

export default function DesignSubTab({
  formData,
  setFormData,
  t
}) {
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Section: Select Template Style */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-4">
          {t("memberPortal.design.title")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, theme: { ...prev.theme, template: 'default' } }))}
            className={`p-3.5 rounded-lg border text-left transition-all ${
              (formData.theme?.template !== 'brutalism' && formData.theme?.template !== 'flat')
                ? 'bg-primary/10 border-primary text-black dark:text-white ring-1 ring-[#0071e3]'
                : 'bg-white dark:bg-card border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-350 dark:hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-lg">view_carousel</span>
              {(formData.theme?.template !== 'brutalism' && formData.theme?.template !== 'flat') && (
                <span className="material-symbols-outlined text-primary text-xs font-bold">check_circle</span>
              )}
            </div>
            <h4 className="text-[11px] font-bold mt-2">{t("memberPortal.design.classicTitle")}</h4>
            <p className="text-[8.5px] text-zinc-450 dark:text-zinc-500 mt-1 leading-relaxed">{t("memberPortal.design.classicDesc")}</p>
          </button>

          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, theme: { ...prev.theme, template: 'brutalism' } }))}
            className={`p-3.5 rounded-lg border text-left transition-all ${
              formData.theme?.template === 'brutalism'
                ? 'bg-primary/10 border-primary text-black dark:text-white ring-1 ring-[#0071e3]'
                : 'bg-white dark:bg-card border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-350 dark:hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-lg">token</span>
              {formData.theme?.template === 'brutalism' && (
                <span className="material-symbols-outlined text-primary text-xs font-bold">check_circle</span>
              )}
            </div>
            <h4 className="text-[11px] font-bold mt-2 text-red-500 dark:text-red-400">Brutalism</h4>
            <p className="text-[8.5px] text-zinc-450 dark:text-zinc-500 mt-1 leading-relaxed">{t("memberPortal.design.brutalismDesc")}</p>
          </button>

          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, theme: { ...prev.theme, template: 'flat' } }))}
            className={`p-3.5 rounded-lg border text-left transition-all ${
              formData.theme?.template === 'flat'
                ? 'bg-primary/10 border-primary text-black dark:text-white ring-1 ring-[#0071e3]'
                : 'bg-white dark:bg-card border-zinc-200 dark:border-zinc-850 text-zinc-500 dark:text-zinc-400 hover:border-zinc-350 dark:hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-lg">grid_view</span>
              {formData.theme?.template === 'flat' && (
                <span className="material-symbols-outlined text-primary text-xs font-bold">check_circle</span>
              )}
            </div>
            <h4 className="text-[11px] font-bold mt-2 text-teal-650 dark:text-teal-400">{t("memberPortal.design.flatTitle")}</h4>
            <p className="text-[8.5px] text-zinc-450 dark:text-zinc-500 mt-1 leading-relaxed">{t("memberPortal.design.flatDesc")}</p>
          </button>
        </div>
      </div>
    </div>
  );
}
