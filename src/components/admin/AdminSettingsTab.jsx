import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import adminBrainApi from '../../services/api/AdminBrainApi';

const AdminSettingsTab = ({ data, updateSystemSettings, updateAdvertisement, showNotification, handleLogout, uploadingAd, handleAdImageUpload, handleAdDelete }) => {
  const { t } = useTranslation();

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPw, setChangingPw] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return showNotification(t('adminTabs.settings.passwordMismatch'), 'error');
    }
    setChangingPw(true);
    try {
      const res = await adminBrainApi.updateAdminAccountSettings({
        oldPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
      showNotification(res.message || t('adminTabs.settings.changePasswordSuccess'));
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-12">
      {/* Settings Grid Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Vacation & Maintenance Card */}
        <div className="bg-slate-900/70 dark:bg-[#12131e]/90 backdrop-blur-3xl rounded-[28px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6 sm:p-8 space-y-5 transition-all duration-300">
          <h3 className="font-extrabold text-xs uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-rose-500 text-xl">admin_panel_settings</span>
            {t("adminTabs.settings.onlineSys")}
          </h3>

          {/* Maintenance Mode */}
          <div className="flex items-center justify-between py-2">
            <div>
              <span className="font-bold text-sm text-white">{t("adminTabs.settings.maintenance")}</span>
              <p className="text-xs text-slate-400 mt-1">{t("adminTabs.settings.maintenanceDesc")}</p>
            </div>
            <button
              type="button"
              onClick={() => updateSystemSettings({ maintenanceMode: !data?.systemSettings?.maintenanceMode })}
              className={`relative inline-flex items-center w-[48px] min-w-[48px] h-[26px] shrink-0 cursor-pointer rounded-full border border-white/10 transition-all duration-300 ${
                data?.systemSettings?.maintenanceMode ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]" : "bg-slate-800"
              }`}
            >
              <span className={`inline-block w-[20px] h-[20px] transform rounded-full bg-white shadow-md transition-transform duration-300 ${data?.systemSettings?.maintenanceMode ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          {/* Block Utilities */}
          <div className="flex flex-col border-t border-white/10 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-white">Khóa Tiện Ích (Bảo trì)</span>
                <p className="text-xs text-slate-400 mt-1">Chặn truy cập một tiện ích trên domain hugowishpax.studio</p>
              </div>
              <button
                type="button"
                onClick={() => updateSystemSettings({ blockUtilities: data?.systemSettings?.blockUtilities ? false : "psychology" })}
                className={`relative inline-flex items-center w-[48px] min-w-[48px] h-[26px] shrink-0 cursor-pointer rounded-full border border-white/10 transition-all duration-300 ${
                  data?.systemSettings?.blockUtilities ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]" : "bg-slate-800"
                }`}
              >
                <span className={`inline-block w-[20px] h-[20px] transform rounded-full bg-white shadow-md transition-transform duration-300 ${data?.systemSettings?.blockUtilities ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            
            {data?.systemSettings?.blockUtilities && (
              <div className="mt-2 bg-slate-950/60 p-4 rounded-2xl border border-white/10 shadow-inner">
                <label className="block text-[11px] font-extrabold text-slate-400 mb-2 uppercase tracking-wider">Chọn tiện ích cần khóa:</label>
                <select
                  value={typeof data.systemSettings.blockUtilities === "string" ? data.systemSettings.blockUtilities : "psychology"}
                  onChange={(e) => updateSystemSettings({ blockUtilities: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                >
                  <option value="psychology">HugoPSY (Tâm lý & Giấc ngủ)</option>
                  <option value="ide">Study with Hugo (Phát triển Web)</option>
                  <option value="arcade">HugoArcade (Giải trí)</option>
                  <option value="handle">HugoKit (QR, chữ ký, link, tệp)</option>
                  <option value="radio">HugoRadio (Radio & Nhạc)</option>
                </select>
              </div>
            )}
          </div>

          {/* Vacation Mode */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <div>
              <span className="font-bold text-sm text-white">{t("adminTabs.settings.vacation")}</span>
              <p className="text-xs text-slate-400 mt-1">{t("adminTabs.settings.vacationDesc")}</p>
            </div>
            <button
              type="button"
              onClick={() => updateSystemSettings({ vacationMode: !data?.systemSettings?.vacationMode })}
              className={`relative inline-flex items-center w-[48px] min-w-[48px] h-[26px] shrink-0 cursor-pointer rounded-full border border-white/10 transition-all duration-300 ${
                data?.systemSettings?.vacationMode ? "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]" : "bg-slate-800"
              }`}
            >
              <span className={`inline-block w-[20px] h-[20px] transform rounded-full bg-white shadow-md transition-transform duration-300 ${data?.systemSettings?.vacationMode ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>

        {/* Feature Flags Card */}
        <div className="bg-slate-900/70 dark:bg-[#12131e]/90 backdrop-blur-3xl rounded-[28px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6 sm:p-8 space-y-5 transition-all duration-300">
          <h3 className="font-extrabold text-xs uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-blue-500 text-xl">toggle_on</span>
            {t("adminTabs.settings.advanced")}
          </h3>

          {/* Allow Registration */}
          <div className="flex items-center justify-between py-2">
            <div>
              <span className="font-bold text-sm text-white">{t("adminTabs.settings.allowReg")}</span>
              <p className="text-xs text-slate-400 mt-1">{t("adminTabs.settings.allowRegDesc")}</p>
            </div>
            <button
              type="button"
              onClick={() => updateSystemSettings({ allowRegistration: !data?.systemSettings?.allowRegistration })}
              className={`relative inline-flex items-center w-[48px] min-w-[48px] h-[26px] shrink-0 cursor-pointer rounded-full border border-white/10 transition-all duration-300 ${
                data?.systemSettings?.allowRegistration !== false ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]" : "bg-slate-800"
              }`}
            >
              <span className={`inline-block w-[20px] h-[20px] transform rounded-full bg-white shadow-md transition-transform duration-300 ${data?.systemSettings?.allowRegistration !== false ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          
          {/* Allow Booking */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <div>
              <span className="font-bold text-sm text-white">{t("adminTabs.settings.allowBooking")}</span>
              <p className="text-xs text-slate-400 mt-1">{t("adminTabs.settings.allowBookingDesc")}</p>
            </div>
            <button
              type="button"
              onClick={() => updateSystemSettings({ allowBooking: !data?.systemSettings?.allowBooking })}
              className={`relative inline-flex items-center w-[48px] min-w-[48px] h-[26px] shrink-0 cursor-pointer rounded-full border border-white/10 transition-all duration-300 ${
                data?.systemSettings?.allowBooking !== false ? "bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]" : "bg-slate-800"
              }`}
            >
              <span className={`inline-block w-[20px] h-[20px] transform rounded-full bg-white shadow-md transition-transform duration-300 ${data?.systemSettings?.allowBooking !== false ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* National Fiat Currency Exchange Rate Mapping Card */}
      <div className="bg-slate-900/70 dark:bg-[#12131e]/90 backdrop-blur-3xl rounded-[28px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6 sm:p-8 space-y-5 transition-all duration-300">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-xs uppercase tracking-widest text-amber-400 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-amber-400 text-xl">currency_exchange</span>
            Tỷ Giá Quy Đổi JOY Sang Tiền Tệ Quốc Gia (Fiat Conversion Rates)
          </h3>
          <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            Chuẩn Hóa Quốc Tế
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Hệ thống tự động quy đổi số dư JOY của thành viên sang đơn vị tiền tệ chính thức theo quốc gia tương ứng để Quản trị viên dễ dàng hỗ trợ và gửi tặng quà chính xác.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 pt-2">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5 backdrop-blur-md shadow-lg transition-all hover:border-amber-500/60">
            <div className="font-black text-amber-300 flex items-center gap-1">
              <span>🇻🇳</span> Việt Nam (VND)
            </div>
            <div className="text-sm font-black text-amber-400">1 JOY = 1,000 ₫</div>
            <div className="text-[10px] text-slate-400 font-mono">1kJOY = 1,000,000 ₫</div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs space-y-1.5 backdrop-blur-md shadow-lg transition-all hover:border-blue-500/60">
            <div className="font-black text-blue-300 flex items-center gap-1">
              <span>🇺🇸</span> Mỹ (USD)
            </div>
            <div className="text-sm font-black text-blue-400">1 JOY = $0.04</div>
            <div className="text-[10px] text-slate-400 font-mono">1kJOY = $40.00</div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-xs space-y-1.5 backdrop-blur-md shadow-lg transition-all hover:border-indigo-500/60">
            <div className="font-black text-indigo-300 flex items-center gap-1">
              <span>🇪🇺</span> Châu Âu (EUR)
            </div>
            <div className="text-sm font-black text-indigo-400">1 JOY = €0.037</div>
            <div className="text-[10px] text-slate-400 font-mono">1kJOY = €37.00</div>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-xs space-y-1.5 backdrop-blur-md shadow-lg transition-all hover:border-cyan-500/60">
            <div className="font-black text-cyan-300 flex items-center gap-1">
              <span>🇯🇵</span> Nhật Bản (JPY)
            </div>
            <div className="text-sm font-black text-cyan-400">1 JOY = ¥6.0</div>
            <div className="text-[10px] text-slate-400 font-mono">1kJOY = ¥6,000</div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-xs space-y-1.5 backdrop-blur-md shadow-lg transition-all hover:border-purple-500/60">
            <div className="font-black text-purple-300 flex items-center gap-1">
              <span>🇰🇷</span> Hàn Quốc (KRW)
            </div>
            <div className="text-sm font-black text-purple-400">1 JOY = ₩55</div>
            <div className="text-[10px] text-slate-400 font-mono">1kJOY = ₩55,000</div>
          </div>
        </div>
      </div>

      {/* Supreme Admin Authority Card */}
      <div className="bg-slate-900/70 dark:bg-[#12131e]/90 backdrop-blur-3xl rounded-[28px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6 sm:p-8 space-y-5 transition-all duration-300">
        <h3 className="font-extrabold text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-rose-500 text-xl">verified_user</span>
          {t("adminTabs.settings.supremeTitle")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 border-t border-white/10 pt-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-sm text-white">{t("adminTabs.settings.autoApprove")}</span>
              <p className="text-xs text-slate-400 mt-1">{t("adminTabs.settings.autoApproveDesc")}</p>
            </div>
            <button
              type="button"
              onClick={() => updateSystemSettings({ autoApproveNew: !data?.systemSettings?.autoApproveNew })}
              className={`relative inline-flex items-center w-[48px] min-w-[48px] h-[26px] shrink-0 cursor-pointer rounded-full border border-white/10 transition-all duration-300 ${
                data?.systemSettings?.autoApproveNew ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]" : "bg-slate-800"
              }`}
            >
              <span className={`inline-block w-[20px] h-[20px] transform rounded-full bg-white shadow-md transition-transform duration-300 ${data?.systemSettings?.autoApproveNew ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-sm text-white">{t("adminTabs.settings.autoLock")}</span>
              <p className="text-xs text-slate-400 mt-1">{t("adminTabs.settings.autoLockDesc")}</p>
            </div>
            <button
              type="button"
              onClick={() => updateSystemSettings({ autoLockInactive: !data?.systemSettings?.autoLockInactive })}
              className={`relative inline-flex items-center w-[48px] min-w-[48px] h-[26px] shrink-0 cursor-pointer rounded-full border border-white/10 transition-all duration-300 ${
                data?.systemSettings?.autoLockInactive ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]" : "bg-slate-800"
              }`}
            >
              <span className={`inline-block w-[20px] h-[20px] transform rounded-full bg-white shadow-md transition-transform duration-300 ${data?.systemSettings?.autoLockInactive ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-sm text-white">{t("adminTabs.settings.crisisAlert")}</span>
              <p className="text-xs text-slate-400 mt-1">{t("adminTabs.settings.crisisAlertDesc")}</p>
            </div>
            <button
              type="button"
              onClick={() => updateSystemSettings({ alertCrisis: !data?.systemSettings?.alertCrisis })}
              className={`relative inline-flex items-center w-[48px] min-w-[48px] h-[26px] shrink-0 cursor-pointer rounded-full border border-white/10 transition-all duration-300 ${
                data?.systemSettings?.alertCrisis !== false ? "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]" : "bg-slate-800"
              }`}
            >
              <span className={`inline-block w-[20px] h-[20px] transform rounded-full bg-white shadow-md transition-transform duration-300 ${data?.systemSettings?.alertCrisis !== false ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-sm text-white">{t("adminTabs.settings.primaryColor")}</span>
              <p className="text-xs text-slate-400 mt-1">{t("adminTabs.settings.primaryColorDesc")}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 bg-slate-950/60 p-2 rounded-2xl border border-white/10">
              <input
                type="color"
                value={data?.systemSettings?.primaryColor || "#3B82F6"}
                onChange={(e) => updateSystemSettings({ primaryColor: e.target.value })}
                className="w-8 h-8 rounded-xl border-0 cursor-pointer bg-transparent"
              />
              <span className="text-xs font-mono font-bold text-slate-300 uppercase pr-1">{data?.systemSettings?.primaryColor || "#3B82F6"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Account & Security Card */}
      <div className="bg-slate-900/70 dark:bg-[#12131e]/90 backdrop-blur-3xl rounded-[28px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6 sm:p-8 space-y-5 transition-all duration-300">
        <h3 className="font-extrabold text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-indigo-500 text-xl">lock_person</span>
          {t("adminTabs.settings.securityTitle")}
        </h3>

        <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-white/10 pt-5 items-end">
          <div className="space-y-2">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">{t("adminTabs.settings.currentPassword")}</label>
            <input
              type="password" required
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 text-xs p-3.5 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 text-white outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">{t("adminTabs.settings.newPassword")}</label>
            <input
              type="password" required minLength={6}
              value={pwForm.newPassword}
              onChange={(e) => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 text-xs p-3.5 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 text-white outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">{t("adminTabs.settings.confirmPassword")}</label>
            <input
              type="password" required minLength={6}
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 text-xs p-3.5 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 text-white outline-none transition-all"
            />
          </div>
          <div className="md:col-span-3 pt-2">
            <button type="submit" disabled={changingPw} className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-xs py-3.5 px-7 rounded-full transition-all duration-300 shadow-[0_4px_16px_rgba(99,102,241,0.35)] active:scale-95 disabled:opacity-50">
              <span className="material-symbols-outlined text-base">{changingPw ? 'progress_activity' : 'key'}</span>
              <span>{t("adminTabs.settings.changePasswordBtn")}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SEO Settings */}
      <div className="bg-slate-900/70 dark:bg-[#12131e]/90 backdrop-blur-3xl rounded-[28px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6 sm:p-8 space-y-5 transition-all duration-300">
        <h3 className="font-extrabold text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-blue-500 text-xl">search</span>
          {t("admin.texts.txt_1")}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">{t("adminTabs.settings.seoDesc")}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <div className="space-y-2">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Global Title</label>
            <input 
              type="text" 
              value={data?.systemSettings?.globalSeo?.title || ""}
              onChange={(e) => updateSystemSettings({ globalSeo: { ...data?.systemSettings?.globalSeo, title: e.target.value }})}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 text-xs p-3.5 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 text-white outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Global Keywords</label>
            <input 
              type="text" 
              value={data?.systemSettings?.globalSeo?.keywords || ""}
              onChange={(e) => updateSystemSettings({ globalSeo: { ...data?.systemSettings?.globalSeo, keywords: e.target.value }})}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 text-xs p-3.5 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 text-white outline-none transition-all"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Global Description</label>
            <textarea 
              value={data?.systemSettings?.globalSeo?.description || ""}
              onChange={(e) => updateSystemSettings({ globalSeo: { ...data?.systemSettings?.globalSeo, description: e.target.value }})}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 text-xs p-3.5 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 text-white outline-none transition-all h-24"
            />
          </div>
        </div>
      </div>

      {/* Advertisement Settings */}
      <div className="bg-slate-900/70 dark:bg-[#12131e]/90 backdrop-blur-3xl rounded-[28px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6 sm:p-8 space-y-6 transition-all duration-300">
        <h3 className="font-extrabold text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-blue-500 text-xl">campaign</span>
          {t("admin.texts.txt_2")}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start border-t border-white/10 pt-6">
          <div className="md:col-span-5 space-y-4">
            <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">{t("adminTabs.settings.adImage")}</span>
            
            {data?.advertisement?.imageUrl ? (
              <div className="relative group rounded-2xl overflow-hidden border border-white/10 p-2 bg-slate-950/60">
                <img 
                  src={data.advertisement.imageUrl} 
                  alt="Ad Banner Preview" 
                  className="w-full max-h-56 object-contain rounded-xl"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={handleAdDelete} className="p-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg active:scale-95 transition-all">
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/[0.03] transition-all">
                <span className="material-symbols-outlined text-4xl text-blue-500">upload_file</span>
                <span className="text-xs font-bold text-slate-300 mt-2">{t("adminTabs.settings.adUpload")}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAdImageUpload} disabled={uploadingAd} />
              </label>
            )}
            {uploadingAd && <div className="text-xs font-extrabold text-center text-blue-400 animate-pulse mt-2">{t("adminTabs.settings.adUploading")}</div>}
          </div>

          <div className="md:col-span-7 space-y-5">
            <div className="space-y-2">
              <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">{t("adminTabs.settings.adStatus")}</span>
              <div className="flex items-center justify-between bg-slate-950/60 p-4 rounded-2xl border border-white/10">
                <span className="font-bold text-xs text-white">{t("adminTabs.settings.adShow")}</span>
                <button
                  type="button"
                  disabled={!data?.advertisement?.imageUrl}
                  onClick={() => updateAdvertisement({ isActive: !data?.advertisement?.isActive })}
                  className={`relative inline-flex items-center w-[44px] min-w-[44px] h-[24px] shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors ${
                    data?.advertisement?.isActive ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]" : "bg-slate-800"
                  }`}
                >
                  <span className={`inline-block w-[18px] h-[18px] transform rounded-full bg-white shadow transition-transform duration-300 ${data?.advertisement?.isActive ? "translate-x-5" : "translate-x-1"}`} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Link URL:</span>
              <div className="flex gap-3">
                <input
                  type="url"
                  placeholder="https://hugostudio.vn"
                  value={data?.advertisement?.linkUrl || ""}
                  onChange={(e) => updateAdvertisement({ linkUrl: e.target.value })}
                  className="flex-1 rounded-2xl border border-white/10 bg-slate-950/60 text-xs p-3.5 focus:border-blue-500/50 text-white outline-none transition-all"
                />
                <button onClick={() => showNotification(t("admin.texts.txt_3"))} className="px-6 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-2xl transition-all shadow-md active:scale-95">{t("adminTabs.settings.adSave")}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button onClick={handleLogout} className="flex items-center gap-2.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-black text-xs py-3.5 px-7 rounded-full transition-all duration-300 shadow-[0_4px_16px_rgba(244,63,94,0.35)] active:scale-95">
          <span className="material-symbols-outlined text-lg">logout</span>
          <span>{t("adminTabs.settings.logout")}</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSettingsTab;
