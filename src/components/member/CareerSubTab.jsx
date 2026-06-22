import React from "react";
import OptimizedInput from "../common/OptimizedInput";

export default function CareerSubTab({
  formData,
  handleFieldChange,
  t
}) {
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Section C: Portfolio & Education */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-4">{t("memberPortal.career.title")}</h3>
        <div className="bg-white dark:bg-card rounded-lg border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {/* Job Title */}
          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
            <div className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0 bg-[#af52de]">
              <span className="material-symbols-outlined text-base">work</span>
            </div>
            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.career.role")}</label>
            <OptimizedInput
              type="text"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleFieldChange}
              placeholder={t("memberPortal.career.placeholderRole")}
              className="w-full bg-transparent text-foreground placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
            />
          </div>

          {/* Education */}
          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
            <div className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0 bg-[#ff9500]">
              <span className="material-symbols-outlined text-base">school</span>
            </div>
            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.career.education")}</label>
            <OptimizedInput
              type="text"
              name="education"
              value={formData.education}
              onChange={handleFieldChange}
              placeholder={t("memberPortal.career.placeholderEdu")}
              className="w-full bg-transparent text-foreground placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
            />
          </div>

          {/* Skills */}
          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
            <div className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0 bg-[#34c759]">
              <span className="material-symbols-outlined text-base">psychology</span>
            </div>
            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.career.skills")}</label>
            <OptimizedInput
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleFieldChange}
              placeholder={t("memberPortal.career.placeholderSkills")}
              className="w-full bg-transparent text-foreground placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
