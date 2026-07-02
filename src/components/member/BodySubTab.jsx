import React from "react";
import OptimizedInput from "../common/OptimizedInput";

export default function BodySubTab({
  formData,
  handleFieldChange,
  t
}) {
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Section D: Body Measurements & Location */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-4">{t("memberPortal.physical.title")}</h3>
        <div className="hg-glass rounded-lg overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {/* Height */}
          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
            <div className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0 bg-[#ff3b30]">
              <span className="material-symbols-outlined text-base">height</span>
            </div>
            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.physical.height")}</label>
            <OptimizedInput
              type="text"
              name="height"
              value={formData.height}
              onChange={handleFieldChange}
              placeholder={t("memberPortal.physical.placeholderHeight")}
              className="w-full bg-transparent text-foreground placeholder-zinc-400 focus:outline-none text-[13px] font-semibold"
            />
          </div>

          {/* Weight */}
          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
            <div className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0 bg-[#4cd964]">
              <span className="material-symbols-outlined text-base">monitor_weight</span>
            </div>
            <label className="text-[11px] font-semibold text-zinc-450 dark:text-zinc-550 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.physical.weight")}</label>
            <OptimizedInput
              type="text"
              name="weight"
              value={formData.weight}
              onChange={handleFieldChange}
              placeholder={t("memberPortal.physical.placeholderWeight")}
              className="w-full bg-transparent text-foreground placeholder-zinc-400 focus:outline-none text-[13px] font-semibold"
            />
          </div>

          {/* Measurements */}
          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
            <div className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0 bg-[#5856d6]">
              <span className="material-symbols-outlined text-base">straighten</span>
            </div>
            <label className="text-[11px] font-semibold text-[#8e8e93] dark:text-[#8e8e93] uppercase tracking-wider w-24 shrink-0">{t("memberPortal.physical.measurements")}</label>
            <OptimizedInput
              type="text"
              name="measurements"
              value={formData.measurements}
              onChange={handleFieldChange}
              placeholder={t("memberPortal.physical.placeholderMeasure")}
              className="w-full bg-transparent text-foreground placeholder-zinc-400 focus:outline-none text-[13px] font-semibold"
            />
          </div>

          {/* Address */}
          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
            <div className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0 bg-primary">
              <span className="material-symbols-outlined text-base">distance</span>
            </div>
            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.physical.location")}</label>
            <OptimizedInput
              type="text"
              name="address"
              value={formData.address}
              onChange={handleFieldChange}
              placeholder={t("memberPortal.physical.placeholderLocation")}
              className="w-full bg-transparent text-foreground placeholder-zinc-400 focus:outline-none text-[13px] font-semibold"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
