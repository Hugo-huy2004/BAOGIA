import { useTranslation } from "react-i18next";
import React, { useMemo, useState } from "react";

const COMMON_ICONS = [
  "code", "design_services", "brush", "campaign", "photo_camera",
  "edit_note", "storefront", "school", "support_agent", "rocket_launch"
];

const EMPTY_PROJECT = { title: "", description: "", link: "" };
const EMPTY_SERVICE = { name: "", description: "", price: "", icon: "design_services" };

// Merges the former "Dự án" + "Dịch vụ" sub-tabs into one "Thành tích" tab —
// one unified list (filterable by type) instead of two separate pages, plus
// a single "+ Thêm mới" form that adapts its fields to whichever type is active.
export default function AchievementsSubTab({ formData, setFormData, showToast, isGuestMode, bio }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("all"); // all | project | service
  const [addType, setAddType] = useState("project");
  const [showForm, setShowForm] = useState(false);
  const [newProject, setNewProject] = useState(EMPTY_PROJECT);
  const [newService, setNewService] = useState(EMPTY_SERVICE);

  const projects = formData.projects || [];
  const services = formData.services || [];

  const merged = useMemo(() => {
    const fromProjects = projects.map(p => ({ ...p, _type: "project" }));
    const fromServices = services.map(s => ({ ...s, _type: "service" }));
    return [...fromProjects, ...fromServices];
  }, [projects, services]);

  const filtered = filter === "all" ? merged : merged.filter(i => i._type === filter);

  const notifyAdded = () => {
    if (isGuestMode || !bio?._id) showToast(t("memberTabs.projects.toastAddedTemp"), "success");
    else showToast(t("memberTabs.projects.toastAddedTempInfo"), "success");
  };

  const handleAddProject = () => {
    if (!newProject.title.trim() || !newProject.description.trim()) {
      showToast(t("memberTabs.projects.toastEmpty"), "warning");
      return;
    }
    setFormData(prev => ({ ...prev, projects: [...(prev.projects || []), { ...newProject, id: "proj_" + Date.now() }] }));
    setNewProject(EMPTY_PROJECT);
    setShowForm(false);
    notifyAdded();
  };

  const handleAddService = () => {
    if (!newService.name.trim() || !newService.description.trim() || !newService.price.trim()) {
      showToast(t("memberTabs.services.toastEmpty"), "warning");
      return;
    }
    setFormData(prev => ({ ...prev, services: [...(prev.services || []), { ...newService, id: "srv_" + Date.now() }] }));
    setNewService(EMPTY_SERVICE);
    setShowForm(false);
    notifyAdded();
  };

  const handleRemove = (item) => {
    if (item._type === "project") {
      setFormData(prev => ({ ...prev, projects: (prev.projects || []).filter(p => p.id !== item.id) }));
      showToast(t("memberTabs.projects.toastDeleted"), "success");
    } else {
      setFormData(prev => ({ ...prev, services: (prev.services || []).filter(s => s.id !== item.id) }));
      showToast(t("memberTabs.services.toastDeleted"), "success");
    }
  };

  const FILTERS = [
    { id: "all",     label: "Tất cả",  icon: "apps",           count: merged.length },
    { id: "project", label: "Dự án",   icon: "folder_special", count: projects.length },
    { id: "service", label: "Dịch vụ", icon: "storefront",     count: services.length },
  ];

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-white dark:bg-background rounded-xl border border-slate-200 dark:border-slate-800/80 p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-black text-sm uppercase tracking-wider text-foreground flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">military_tech</span>Thành tích
          </h3>
          <button
            onClick={() => setShowForm(v => !v)}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">{showForm ? "close" : "add_circle"}</span>
            {showForm ? "Đóng" : "Thêm mới"}
          </button>
        </div>

        <p className="text-xs text-muted-foreground -mt-2">Liệt kê dự án bạn từng làm và dịch vụ bạn cung cấp — hiển thị công khai trên trang Bio của bạn.</p>

        {/* Filter pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all shrink-0 ${
                filter === f.id ? "bg-primary border-primary text-white shadow-sm" : "bg-white dark:bg-card/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
              }`}
            >
              <span className="material-symbols-outlined text-xs">{f.icon}</span>{f.label}
              <span className={`px-1.5 rounded-full ${filter === f.id ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800"}`}>{f.count}</span>
            </button>
          ))}
        </div>

        {/* Add form */}
        {showForm && (
          <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-lg border border-slate-100 dark:border-slate-800/60 space-y-4 animate-fadeIn">
            <div className="flex gap-1.5">
              {[{ id: "project", label: "Dự án" }, { id: "service", label: "Dịch vụ" }].map(o => (
                <button
                  key={o.id}
                  onClick={() => setAddType(o.id)}
                  className={`flex-1 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${
                    addType === o.id ? "bg-primary text-white" : "bg-white dark:bg-[#181622] text-slate-500 border border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {addType === "project" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" value={newProject.title} onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                    placeholder={t("memberTabs.projects.namePlaceholder")}
                    className="w-full px-4 py-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0c0b11] text-xs focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground" />
                  <input type="text" value={newProject.link} onChange={(e) => setNewProject(prev => ({ ...prev, link: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0c0b11] text-xs focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground" />
                </div>
                <textarea value={newProject.description} onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t("memberTabs.projects.descPlaceholder")} rows={3}
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0c0b11] text-xs focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground resize-none" />
                <button onClick={handleAddProject} className="px-5 py-2.5 rounded-md bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">add_circle</span>{t("memberTabs.projects.addButton")}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" value={newService.name} onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t("memberTabs.services.namePlaceholder")}
                    className="w-full px-4 py-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0c0b11] text-xs focus:ring-2 focus:ring-success focus:border-success transition-all text-foreground" />
                  <input type="text" value={newService.price} onChange={(e) => setNewService(prev => ({ ...prev, price: e.target.value }))}
                    placeholder={t("memberTabs.services.pricePlaceholder")}
                    className="w-full px-4 py-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0c0b11] text-xs focus:ring-2 focus:ring-success focus:border-success transition-all text-foreground" />
                </div>
                <input type="text" value={newService.description} onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t("memberTabs.services.descPlaceholder")}
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0c0b11] text-xs focus:ring-2 focus:ring-success focus:border-success transition-all text-foreground" />
                <div className="flex flex-wrap gap-2">
                  {COMMON_ICONS.map(icon => (
                    <button key={icon} onClick={() => setNewService(prev => ({ ...prev, icon }))}
                      className={`w-9 h-9 rounded-md flex items-center justify-center transition-all ${
                        newService.icon === icon ? "bg-success/10 text-success border-2 border-success" : "bg-white dark:bg-[#181622] text-slate-400 border border-slate-200 dark:border-slate-800"
                      }`}>
                      <span className="material-symbols-outlined text-[16px]">{icon}</span>
                    </button>
                  ))}
                </div>
                <button onClick={handleAddService} className="px-5 py-2.5 rounded-md bg-success hover:bg-success/90 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">add_circle</span>{t("memberTabs.services.addButton")}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Unified list */}
        {filtered.length === 0 ? (
          <div className="py-10 text-center bg-slate-50/50 dark:bg-[#0c0b11]/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800/60">
            <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-700 mb-2">military_tech</span>
            <p className="text-[10px] text-slate-400 font-medium">Chưa có thành tích nào — nhấn "Thêm mới" để bắt đầu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((item) => (
              <div key={`${item._type}-${item.id}`} className="group relative flex gap-3 p-3.5 bg-white dark:bg-[#181622] rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${
                  item._type === "project" ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
                }`}>
                  <span className="material-symbols-outlined text-[18px]">{item._type === "project" ? "folder_special" : item.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                      item._type === "project" ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
                    }`}>{item._type === "project" ? "Dự án" : "Dịch vụ"}</span>
                    {item._type === "service" && <span className="font-mono text-success font-bold text-[10px]">{item.price}</span>}
                  </div>
                  <h5 className="font-bold text-foreground text-xs truncate">{item._type === "project" ? item.title : item.name}</h5>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{item.description}</p>
                  {item._type === "project" && item.link && (
                    <a href={item.link} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-primary inline-flex items-center gap-1 hover:underline mt-1">
                      <span className="material-symbols-outlined text-[12px]">open_in_new</span>{t("memberTabs.projects.viewBtn")}
                    </a>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(item)}
                  className="w-7 h-7 rounded bg-destructive/10 text-destructive hover:bg-destructive hover:text-white flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-all absolute top-2.5 right-2.5"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
