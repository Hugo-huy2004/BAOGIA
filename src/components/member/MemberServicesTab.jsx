import { useTranslation } from "react-i18next";
import React, { useState } from "react";

const COMMON_ICONS = [
  "code", "design_services", "brush", "campaign", "photo_camera", 
  "edit_note", "storefront", "school", "support_agent", "rocket_launch"
];

export default function MemberServicesTab({ formData, setFormData, showToast, isGuestMode, bio }) {
  const { t } = useTranslation();

  const [newService, setNewService] = useState({
    name: "",
    description: "",
    price: "",
    icon: "design_services"
  });

  const handleAddService = () => {
    if (!newService.name.trim() || !newService.description.trim() || !newService.price.trim()) {
      showToast(t("memberTabs.services.toastEmpty"), "warning");
      return;
    }

    const serviceId = "srv_" + Date.now();
    const updatedServices = [...(formData.services || []), { ...newService, id: serviceId }];

    setFormData(prev => ({ ...prev, services: updatedServices }));
    setNewService({ name: "", description: "", price: "", icon: "design_services" });

    if (isGuestMode || !bio?._id) {
      showToast(t("memberTabs.services.toastAddedTemp"), "success");
    } else {
      showToast(t("memberTabs.services.toastAddedTempInfo"), "success");
    }
  };

  const handleRemoveService = (idToKill) => {
    const updatedServices = (formData.services || []).filter(s => s.id !== idToKill);
    setFormData(prev => ({ ...prev, services: updatedServices }));
    showToast(t("memberTabs.services.toastDeleted"), "success");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white dark:bg-[#12111a] rounded-xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm">
        <h3 className="font-black text-sm uppercase tracking-wider text-slate-850 dark:text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-500 text-lg">storefront</span>{t("memberTabs.services.title")}</h3>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{t("memberTabs.services.desc")}</p>

        {/* Thêm dịch vụ mới */}
        <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-lg border border-slate-100 dark:border-slate-800/60 mb-6 space-y-4">
          <h4 className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">{t("memberTabs.services.addNew")}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider ml-1">{t("memberTabs.services.nameLabel")}</label>
              <input
                type="text"
                value={newService.name}
                onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t("memberTabs.services.namePlaceholder")}
                className="w-full px-4 py-2.5 rounded-md border border-slate-200 dark:border-slate-750 bg-white dark:bg-[#0c0b11] text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-850 dark:text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider ml-1">{t("memberTabs.services.priceLabel")}</label>
              <input
                type="text"
                value={newService.price}
                onChange={(e) => setNewService(prev => ({ ...prev, price: e.target.value }))}
                placeholder={t("memberTabs.services.pricePlaceholder")}
                className="w-full px-4 py-2.5 rounded-md border border-slate-200 dark:border-slate-750 bg-white dark:bg-[#0c0b11] text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-850 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider ml-1">{t("memberTabs.services.descLabel")}</label>
            <input
              type="text"
              value={newService.description}
              onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t("memberTabs.services.descPlaceholder")}
              className="w-full px-4 py-2.5 rounded-md border border-slate-200 dark:border-slate-750 bg-white dark:bg-[#0c0b11] text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-850 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider ml-1">{t("memberTabs.services.iconLabel")}</label>
            <div className="flex flex-wrap gap-2">
              {COMMON_ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setNewService(prev => ({ ...prev, icon }))}
                  className={`w-10 h-10 rounded-md flex items-center justify-center transition-all ${
                    newService.icon === icon
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 border-2 border-emerald-500"
                      : "bg-white dark:bg-[#181622] text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{icon}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleAddService}
              className="px-5 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>{t("memberTabs.services.addButton")}</button>
          </div>
        </div>

        {/* Danh sách dịch vụ */}
        <div className="space-y-4">
          <h4 className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">{t("memberTabs.services.listTitle")} <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{(formData.services || []).length}</span>
          </h4>

          {(!formData.services || formData.services.length === 0) ? (
            <div className="py-8 text-center bg-slate-50/50 dark:bg-[#0c0b11]/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800/60">
              <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-700 mb-2">shopping_bag</span>
              <p className="text-[10px] text-slate-400 font-medium">{t("memberTabs.services.emptyList")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {formData.services.map((srv) => (
                <div key={srv.id} className="group relative flex items-center gap-3 p-3 bg-white dark:bg-[#181622] rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-sm">
                  <div className="w-10 h-10 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">{srv.icon}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h5 className="font-bold text-slate-850 dark:text-white text-xs truncate">{srv.name}</h5>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-[10px] whitespace-nowrap ml-2 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md">{srv.price}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{srv.description}</p>
                  </div>

                  <button
                    onClick={() => handleRemoveService(srv.id)}
                    className="w-7 h-7 rounded bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500 dark:hover:text-white flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-all absolute right-3"
                    title={t("memberTabs.services.deleteBtn")}
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
