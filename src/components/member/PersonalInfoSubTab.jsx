import React from "react";
import { optimizeCloudinaryUrl } from "../../utils/imageOptimizer";
import OptimizedInput from "../common/OptimizedInput";
import BiometricLoginCard from "./BiometricLoginCard";

// Merges the former Cá nhân (Profile) + Sự nghiệp (Career) + Hình thể (Body)
// sub-tabs into one "Thông tin cá nhân" tab — same row-style fields, just
// stacked under one umbrella so members don't have to hop across 3 tabs.
export default function PersonalInfoSubTab({
  formData,
  handleFieldChange,
  saving,
  isDragOver,
  setIsDragOver,
  processFile,
  avatarInputRef,
  handleAvatarChange,
  handleRemoveAvatar,
  memberSession,
  showToast,
  t
}) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <BiometricLoginCard memberSession={memberSession} showToast={showToast} />
      {/* Section: Avatar Editor */}
      <div className="space-y-2 text-center py-4 bg-white dark:bg-card rounded-lg border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm">
        <div
          className={`relative w-20 h-20 rounded-full border shadow-md bg-zinc-100 dark:bg-zinc-900 mx-auto flex items-center justify-center overflow-hidden group cursor-pointer transition-all duration-200 ${
            isDragOver
              ? "border-2 border-dashed border-primary scale-105 bg-blue-50/10 dark:bg-blue-900/10"
              : "border-zinc-200 dark:border-zinc-800"
          }`}
          onClick={() => !saving && avatarInputRef.current.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            const file = e.dataTransfer.files[0];
            processFile(file);
          }}
        >
          {formData.avatarUrl ? (
            <img src={optimizeCloudinaryUrl(formData.avatarUrl, 300)} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-850 text-zinc-400 dark:text-zinc-500">
              <span className="material-symbols-outlined text-3xl">add_a_photo</span>
            </div>
          )}
          {saving ? (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-20">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[7px] mt-1 font-bold tracking-wider">UPLOADING...</span>
            </div>
          ) : (
            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-bold z-20">
              <span className="material-symbols-outlined text-sm">photo_camera</span>
              <span>{t("memberPortal.bio.changeAvatar")}</span>
            </div>
          )}
        </div>
        <input
          type="file"
          ref={avatarInputRef}
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
          disabled={saving}
        />
        <div className="space-y-1">
          <p className="text-[10px] text-zinc-450 dark:text-zinc-400 font-bold uppercase tracking-wider">{t("memberPortal.bio.avatarTitle")}</p>
          <p className="text-[8px] text-zinc-400">{t("memberPortal.bio.avatarDesc")}</p>
          {formData.avatarUrl && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              disabled={saving}
              className="text-[9px] font-bold text-red-500 hover:text-red-650 transition-colors disabled:opacity-50"
            >{t("memberPortal.bio.removeAvatar")}</button>
          )}
        </div>
      </div>

      {/* Section A: Basic settings */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-4">{t("memberPortal.bio.basicInfo")}</h3>
        <div className="bg-white dark:bg-card rounded-lg border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50">
          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
            <div className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0 bg-primary">
              <span className="material-symbols-outlined text-base">person</span>
            </div>
            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.bio.fullName")}</label>
            <OptimizedInput type="text" name="displayName" value={formData.displayName} onChange={handleFieldChange} required placeholder={t("memberPortal.bio.placeholderName")} className="w-full bg-transparent text-foreground placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
            <div className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0 bg-[#30b0c7]">
              <span className="material-symbols-outlined text-base">badge</span>
            </div>
            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.bio.nickname")}</label>
            <OptimizedInput type="text" name="headline" value={formData.headline} onChange={handleFieldChange} placeholder="Designer, Web Architect, Developer..." className="w-full bg-transparent text-foreground placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
            <div className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0 bg-[#ff2d55]">
              <span className="material-symbols-outlined text-base">cake</span>
            </div>
            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.bio.birthday")}</label>
            <OptimizedInput type="text" name="birthday" value={formData.birthday} onChange={handleFieldChange} placeholder={t("memberPortal.bio.placeholderBirthday")} className="w-full bg-transparent text-foreground placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold" />
          </div>
        </div>
      </div>

      {/* Section B: Contact settings */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-4">{t("memberPortal.bio.contactInfo")}</h3>
        <div className="bg-white dark:bg-card rounded-lg border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50">
          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px] bg-zinc-50/50 dark:bg-zinc-900/10">
            <div className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0 bg-[#34c759]">
              <span className="material-symbols-outlined text-base">mail</span>
            </div>
            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">Gmail</label>
            <div className="flex-1 flex flex-wrap justify-between items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500">{memberSession?.email || "-"}</span>
              <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#34c759]/10 border border-[#34c759]/20 text-[9px] font-bold text-emerald-500 shrink-0">
                <span className="material-symbols-outlined text-[10px]">verified</span>
                Student verified
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
            <div className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0 bg-[#34c759]">
              <span className="material-symbols-outlined text-base">phone</span>
            </div>
            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.bio.phone")}</label>
            <OptimizedInput type="tel" name="phone" value={formData.phone} onChange={handleFieldChange} placeholder={t("memberPortal.bio.placeholderPhone")} className="w-full bg-transparent text-foreground placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
            <div className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0 bg-primary">
              <span className="material-symbols-outlined text-base">alternate_email</span>
            </div>
            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.bio.email")}</label>
            <OptimizedInput type="email" name="contactEmail" value={formData.contactEmail} onChange={handleFieldChange} placeholder={t("memberPortal.bio.placeholderEmail")} className="w-full bg-transparent text-foreground placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold" />
          </div>
        </div>
      </div>

      {/* Section C: Career */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-4">{t("memberPortal.career.title")}</h3>
        <div className="bg-white dark:bg-card rounded-lg border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50">
          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
            <div className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0 bg-[#af52de]">
              <span className="material-symbols-outlined text-base">work</span>
            </div>
            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.career.role")}</label>
            <OptimizedInput type="text" name="jobTitle" value={formData.jobTitle} onChange={handleFieldChange} placeholder={t("memberPortal.career.placeholderRole")} className="w-full bg-transparent text-foreground placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
            <div className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0 bg-[#ff9500]">
              <span className="material-symbols-outlined text-base">school</span>
            </div>
            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.career.education")}</label>
            <OptimizedInput type="text" name="education" value={formData.education} onChange={handleFieldChange} placeholder={t("memberPortal.career.placeholderEdu")} className="w-full bg-transparent text-foreground placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
            <div className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0 bg-[#34c759]">
              <span className="material-symbols-outlined text-base">psychology</span>
            </div>
            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.career.skills")}</label>
            <OptimizedInput type="text" name="skills" value={formData.skills} onChange={handleFieldChange} placeholder={t("memberPortal.career.placeholderSkills")} className="w-full bg-transparent text-foreground placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold" />
          </div>
        </div>
      </div>

      {/* Section D: Body Measurements & Location */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-4">{t("memberPortal.physical.title")}</h3>
        <div className="bg-white dark:bg-card rounded-lg border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50">
          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
            <div className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0 bg-[#ff3b30]">
              <span className="material-symbols-outlined text-base">height</span>
            </div>
            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.physical.height")}</label>
            <OptimizedInput type="text" name="height" value={formData.height} onChange={handleFieldChange} placeholder={t("memberPortal.physical.placeholderHeight")} className="w-full bg-transparent text-foreground placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
            <div className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0 bg-[#4cd964]">
              <span className="material-symbols-outlined text-base">monitor_weight</span>
            </div>
            <label className="text-[11px] font-semibold text-zinc-450 dark:text-zinc-550 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.physical.weight")}</label>
            <OptimizedInput type="text" name="weight" value={formData.weight} onChange={handleFieldChange} placeholder={t("memberPortal.physical.placeholderWeight")} className="w-full bg-transparent text-foreground placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
            <div className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0 bg-[#5856d6]">
              <span className="material-symbols-outlined text-base">straighten</span>
            </div>
            <label className="text-[11px] font-semibold text-[#8e8e93] dark:text-[#8e8e93] uppercase tracking-wider w-24 shrink-0">{t("memberPortal.physical.measurements")}</label>
            <OptimizedInput type="text" name="measurements" value={formData.measurements} onChange={handleFieldChange} placeholder={t("memberPortal.physical.placeholderMeasure")} className="w-full bg-transparent text-foreground placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold" />
          </div>
          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
            <div className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0 bg-primary">
              <span className="material-symbols-outlined text-base">distance</span>
            </div>
            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.physical.location")}</label>
            <OptimizedInput type="text" name="address" value={formData.address} onChange={handleFieldChange} placeholder={t("memberPortal.physical.placeholderLocation")} className="w-full bg-transparent text-foreground placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold" />
          </div>
        </div>
      </div>
    </div>
  );
}
