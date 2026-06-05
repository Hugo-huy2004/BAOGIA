import React from "react";
import OptimizedInput from "../common/OptimizedInput";
import OptimizedTextarea from "../common/OptimizedTextarea";

// Social Brand Style detector
const getSocialBrandStyle = (label = "") => {
  const lowercase = label.toLowerCase();
  if (lowercase.includes("facebook") || lowercase.includes("fb")) {
    return { bgColor: "#e2e8f0", textColor: "#0f172a", icon: "facebook" };
  }
  if (lowercase.includes("zalo")) {
    return { bgColor: "#e2e8f0", textColor: "#0f172a", icon: "chat" };
  }
  if (lowercase.includes("instagram") || lowercase.includes("ig")) {
    return { bgColor: "#e2e8f0", textColor: "#0f172a", icon: "photo_camera" };
  }
  if (lowercase.includes("tiktok")) {
    return { bgColor: "#e2e8f0", textColor: "#0f172a", icon: "music_note" };
  }
  if (lowercase.includes("github") || lowercase.includes("git")) {
    return { bgColor: "#e2e8f0", textColor: "#0f172a", icon: "code" };
  }
  if (lowercase.includes("youtube") || lowercase.includes("yt")) {
    return { bgColor: "#e2e8f0", textColor: "#0f172a", icon: "play_circle" };
  }
  return { bgColor: "#e2e8f0", textColor: "#0f172a", icon: "language" };
};

export default function LinksSubTab({
  formData,
  newLinkLabel,
  setNewLinkLabel,
  newLinkUrl,
  setNewLinkUrl,
  handleLinkInputKeyDown,
  addSocialLink,
  removeSocialLink,
  handleFieldChange,
  bioTextareaRef,
  t
}) {
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Section D: Social Network Links */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-4">
          <h3 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest">{t("memberPortal.links.title")}</h3>
          <span className="text-[8px] font-semibold text-zinc-400">{t("memberPortal.links.autoSave")}</span>
        </div>

        <div className="bg-white dark:bg-[#1c1c1e] rounded-lg border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm p-4 space-y-4">
          {formData.links && formData.links.length > 0 ? (
            <div className="space-y-2">
              {formData.links.map((link, idx) => {
                const brand = getSocialBrandStyle(link.label);
                return (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-md bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/40 dark:border-zinc-800/40 text-xs transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className={`material-symbols-outlined text-base shrink-0 ${brand ? "text-[#0071e3]" : "text-zinc-450"}`}>
                        {brand ? brand.icon : "link"}
                      </span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 shrink-0">{link.label}:</span>
                      <span className="text-zinc-450 truncate text-[11px] font-medium">{link.url}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSocialLink(idx)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[#ff3b30] hover:bg-[#ff3b30]/10 transition-colors shrink-0"
                    >
                      <span className="material-symbols-outlined text-base">remove_circle</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-md">
              <span className="material-symbols-outlined text-2xl text-zinc-300">link_off</span>
              <p className="text-[11px] italic text-zinc-400 mt-1">{t("memberPortal.links.empty")}</p>
            </div>
          )}

          {/* Add new link input rows */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/50 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-450 uppercase pl-1">{t("memberPortal.links.label")}</label>
                <OptimizedInput
                  type="text"
                  value={newLinkLabel}
                  onKeyDown={handleLinkInputKeyDown}
                  onChange={(e) => setNewLinkLabel(e.target.value)}
                  placeholder={t("memberPortal.links.placeholderLabel")}
                  className="w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-[#1d1d1f] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071e3] text-xs font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-450 uppercase pl-1">{t("memberPortal.links.url")}</label>
                <OptimizedInput
                  type="text"
                  value={newLinkUrl}
                  onKeyDown={handleLinkInputKeyDown}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder={t("memberPortal.links.placeholderUrl")}
                  className="w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-[#1d1d1f] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071e3] text-xs font-semibold"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={addSocialLink}
              className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold py-2.5 rounded-md transition-colors flex items-center justify-center gap-1 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">add</span>{t("memberPortal.links.addLink")}
            </button>
          </div>
        </div>
      </div>

      {/* Section E: Biography and Hobbies */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-4">{t("memberPortal.other.title")}</h3>
        <div className="bg-white dark:bg-[#1c1c1e] rounded-lg border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {/* Hobbies */}
          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
            <div className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0 bg-[#5856d6]">
              <span className="material-symbols-outlined text-base">star</span>
            </div>
            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.other.hobbies")}</label>
            <OptimizedInput
              type="text"
              name="hobbies"
              value={formData.hobbies}
              onChange={handleFieldChange}
              placeholder={t("memberPortal.other.placeholderHobbies")}
              className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
            />
          </div>

          {/* Bio text */}
          <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-3 px-4 py-3 min-h-[70px]">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-7 h-7 rounded flex items-center justify-center text-white shrink-0 bg-[#8e8e93]">
                <span className="material-symbols-outlined text-base">edit_note</span>
              </div>
              <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.other.desc")}</label>
            </div>
            <div className="flex-grow flex flex-col w-full">
              <OptimizedTextarea
                ref={bioTextareaRef}
                name="bio"
                value={formData.bio}
                onChange={handleFieldChange}
                placeholder={t("memberPortal.other.placeholderDesc")}
                className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold resize-none leading-relaxed mt-1 md:mt-0 overflow-hidden"
              />
              <div className="flex justify-end text-[9px] font-bold text-zinc-400 dark:text-zinc-500 mt-1 select-none pr-2">
                {formData.bio ? formData.bio.trim().split(/\s+/).filter(Boolean).length : 0} / 110 chữ
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
