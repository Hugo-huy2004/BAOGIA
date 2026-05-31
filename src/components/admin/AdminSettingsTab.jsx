import React from 'react';
import { useTranslation } from 'react-i18next';

const AdminSettingsTab = ({ data, updateSystemSettings, updateAdvertisement, showNotification, handleLogout, uploadingAd, handleAdImageUpload, handleAdDelete }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Vacation & Maintenance Card */}
        <div className="bg-white dark:bg-[#12111a] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-500 text-lg">admin_panel_settings</span>
            {t("adminTabs.settings.onlineSys")}
          </h3>

          {/* Maintenance Mode */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-sm text-slate-850 dark:text-slate-350">{t("adminTabs.settings.maintenance")}</span>
              <p className="text-[10px] text-slate-400 mt-1">{t("adminTabs.settings.maintenanceDesc")}</p>
            </div>
            <button
              type="button"
              onClick={() => updateSystemSettings({ maintenanceMode: !data?.systemSettings?.maintenanceMode })}
              className={`relative inline-flex items-center w-[44px] min-w-[44px] h-[24px] min-h-[24px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                data?.systemSettings?.maintenanceMode ? "bg-rose-500" : "bg-slate-200 dark:bg-slate-800"
              }`}
            >
              <span className={`inline-block w-[20px] h-[20px] transform rounded-full bg-white shadow-sm transition ${data?.systemSettings?.maintenanceMode ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          {/* Vacation Mode */}
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-4">
            <div>
              <span className="font-semibold text-sm text-slate-850 dark:text-slate-350">{t("adminTabs.settings.vacation")}</span>
              <p className="text-[10px] text-slate-400 mt-1">{t("adminTabs.settings.vacationDesc")}</p>
            </div>
            <button
              type="button"
              onClick={() => updateSystemSettings({ vacationMode: !data?.systemSettings?.vacationMode })}
              className={`relative inline-flex items-center w-[44px] min-w-[44px] h-[24px] min-h-[24px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                data?.systemSettings?.vacationMode ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-800"
              }`}
            >
              <span className={`inline-block w-[20px] h-[20px] transform rounded-full bg-white shadow-sm transition ${data?.systemSettings?.vacationMode ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        </div>

        {/* Feature Flags Card */}
        <div className="bg-white dark:bg-[#12111a] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">toggle_on</span>
            {t("adminTabs.settings.advanced")}
          </h3>

          {/* HBot */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-sm text-slate-850 dark:text-slate-350">{t("adminTabs.settings.aiBot")}</span>
              <p className="text-[10px] text-slate-400 mt-1">{t("adminTabs.settings.aiBotDesc")}</p>
            </div>
            <button
              type="button"
              onClick={() => updateSystemSettings({ enableHBot: !data?.systemSettings?.enableHBot })}
              className={`relative inline-flex items-center w-[44px] min-w-[44px] h-[24px] min-h-[24px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                data?.systemSettings?.enableHBot !== false ? "bg-primary" : "bg-slate-200 dark:bg-slate-800"
              }`}
            >
              <span className={`inline-block w-[20px] h-[20px] transform rounded-full bg-white shadow-sm transition ${data?.systemSettings?.enableHBot !== false ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          {/* Allow Registration */}
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-4">
            <div>
              <span className="font-semibold text-sm text-slate-850 dark:text-slate-350">{t("adminTabs.settings.allowReg")}</span>
              <p className="text-[10px] text-slate-400 mt-1">{t("adminTabs.settings.allowRegDesc")}</p>
            </div>
            <button
              type="button"
              onClick={() => updateSystemSettings({ allowRegistration: !data?.systemSettings?.allowRegistration })}
              className={`relative inline-flex items-center w-[44px] min-w-[44px] h-[24px] min-h-[24px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                data?.systemSettings?.allowRegistration !== false ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
              }`}
            >
              <span className={`inline-block w-[20px] h-[20px] transform rounded-full bg-white shadow-sm transition ${data?.systemSettings?.allowRegistration !== false ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
          
          {/* Allow Booking */}
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-4">
            <div>
              <span className="font-semibold text-sm text-slate-850 dark:text-slate-350">{t("adminTabs.settings.allowBooking")}</span>
              <p className="text-[10px] text-slate-400 mt-1">{t("adminTabs.settings.allowBookingDesc")}</p>
            </div>
            <button
              type="button"
              onClick={() => updateSystemSettings({ allowBooking: !data?.systemSettings?.allowBooking })}
              className={`relative inline-flex items-center w-[44px] min-w-[44px] h-[24px] min-h-[24px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                data?.systemSettings?.allowBooking !== false ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-800"
              }`}
            >
              <span className={`inline-block w-[20px] h-[20px] transform rounded-full bg-white shadow-sm transition ${data?.systemSettings?.allowBooking !== false ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* SEO Settings */}
      <div className="bg-white dark:bg-[#12111a] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 sm:p-8 space-y-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-500 text-lg">search</span>
          {t("admin.texts.txt_1")}
        </h3>
        <p className="text-[10px] text-slate-450 mb-4">{t("adminTabs.settings.seoDesc")}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Global Title</label>
            <input 
              type="text" 
              value={data?.systemSettings?.globalSeo?.title || ""}
              onChange={(e) => updateSystemSettings({ globalSeo: { ...data?.systemSettings?.globalSeo, title: e.target.value }})}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Global Keywords</label>
            <input 
              type="text" 
              value={data?.systemSettings?.globalSeo?.keywords || ""}
              onChange={(e) => updateSystemSettings({ globalSeo: { ...data?.systemSettings?.globalSeo, keywords: e.target.value }})}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Global Description</label>
            <textarea 
              value={data?.systemSettings?.globalSeo?.description || ""}
              onChange={(e) => updateSystemSettings({ globalSeo: { ...data?.systemSettings?.globalSeo, description: e.target.value }})}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 focus:ring-1 focus:ring-primary h-20"
            />
          </div>
        </div>
      </div>

      {/* Advertisement Settings */}
      <div className="bg-white dark:bg-[#12111a] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 sm:p-8 space-y-6">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">campaign</span>
          {t("admin.texts.txt_2")}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start border-t border-slate-100 dark:border-slate-800/60 pt-6">
          <div className="md:col-span-5 space-y-4">
            <span className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">{t("adminTabs.settings.adImage")}</span>
            
            {data?.advertisement?.imageUrl ? (
              <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800/80 p-2">
                <img 
                  src={data.advertisement.imageUrl} 
                  alt="Ad Banner Preview" 
                  className="w-full max-h-56 object-contain rounded-xl"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={handleAdDelete} className="p-2.5 rounded-full bg-red-650 hover:bg-red-700 text-white">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/10">
                <span className="material-symbols-outlined text-3xl">upload_file</span>
                <span className="text-[10px] font-semibold mt-2">{t("adminTabs.settings.adUpload")}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAdImageUpload} disabled={uploadingAd} />
              </label>
            )}
            {uploadingAd && <div className="text-xs font-bold text-center text-primary mt-2">{t("adminTabs.settings.adUploading")}</div>}
          </div>

          <div className="md:col-span-7 space-y-5">
            <div className="space-y-1">
              <span className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">{t("adminTabs.settings.adStatus")}</span>
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
                <span className="font-semibold text-xs text-slate-855 dark:text-slate-350">{t("adminTabs.settings.adShow")}</span>
                <button
                  type="button"
                  disabled={!data?.advertisement?.imageUrl}
                  onClick={() => updateAdvertisement({ isActive: !data?.advertisement?.isActive })}
                  className={`relative inline-flex items-center w-[36px] min-w-[36px] h-[20px] min-h-[20px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    data?.advertisement?.isActive ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                  }`}
                >
                  <span className={`inline-block w-[16px] h-[16px] transform rounded-full bg-white shadow transition ${data?.advertisement?.isActive ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <span className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">Link URL:</span>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://hugostudio.vn"
                  value={data?.advertisement?.linkUrl || ""}
                  onChange={(e) => updateAdvertisement({ linkUrl: e.target.value })}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 focus:ring-1 focus:ring-primary"
                />
                <button onClick={() => showNotification(t("admin.texts.txt_3"))} className="px-5 bg-primary text-white text-xs font-bold rounded-xl">{t("adminTabs.settings.adSave")}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button onClick={handleLogout} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-95">
          <span className="material-symbols-outlined text-base">logout</span>
          <span>
              {t("adminTabs.settings.logout")}
            </span>
        </button>
      </div>
    </div>
  );
};

export default AdminSettingsTab;
