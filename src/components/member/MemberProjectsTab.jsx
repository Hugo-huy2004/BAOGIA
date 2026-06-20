import { useTranslation } from "react-i18next";
import React, { useState } from "react";

export default function MemberProjectsTab({ formData, setFormData, showToast, isGuestMode, bio }) {
  const { t } = useTranslation();

  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    link: ""
  });

  const handleAddProject = () => {
    if (!newProject.title.trim() || !newProject.description.trim()) {
      showToast(t("memberTabs.projects.toastEmpty"), "warning");
      return;
    }

    const projectId = "proj_" + Date.now();
    const updatedProjects = [...formData.projects, { ...newProject, id: projectId }];

    setFormData(prev => ({ ...prev, projects: updatedProjects }));
    setNewProject({ title: "", description: "", link: "", imageUrl: "" });

    // Auto-save notification
    if (isGuestMode || !bio?._id) {
      showToast(t("memberTabs.projects.toastAddedTemp"), "success");
    } else {
      showToast(t("memberTabs.projects.toastAddedTempInfo"), "success");
    }
  };

  const handleRemoveProject = (idToKill) => {
    const updatedProjects = formData.projects.filter(p => p.id !== idToKill);
    setFormData(prev => ({ ...prev, projects: updatedProjects }));
    showToast(t("memberTabs.projects.toastDeleted"), "success");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white dark:bg-[#12111a] rounded-xl border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm">
        <h3 className="font-black text-sm uppercase tracking-wider text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-500 text-lg">folder_special</span>{t("memberTabs.projects.title")}</h3>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{t("memberTabs.projects.desc")}</p>

        {/* Thêm dự án mới */}
        <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-lg border border-slate-100 dark:border-slate-800/60 mb-6">
          <h4 className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4">{t("memberTabs.projects.addNew")}</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">{t("memberTabs.projects.nameLabel")}</label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={t("memberTabs.projects.namePlaceholder")}
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0c0b11] text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">{t("memberTabs.projects.urlLabel")}</label>
                <input
                  type="text"
                  value={newProject.link}
                  onChange={(e) => setNewProject(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0c0b11] text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">{t("memberTabs.projects.descLabel")}</label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t("memberTabs.projects.descPlaceholder")}
                rows={3}
                className="w-full px-4 py-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0c0b11] text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800 dark:text-white resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleAddProject}
                className="px-5 py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span>{t("memberTabs.projects.addButton")}</button>
            </div>
          </div>
        </div>

        {/* Danh sách dự án hiện tại */}
        <div className="space-y-4">
          <h4 className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">{t("memberTabs.projects.listTitle")} <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{(formData.projects || []).length}</span>
          </h4>

          {(!formData.projects || formData.projects.length === 0) ? (
            <div className="py-8 text-center bg-slate-50/50 dark:bg-[#0c0b11]/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800/60">
              <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-700 mb-2">folder_off</span>
              <p className="text-[10px] text-slate-400 font-medium">Chưa có dự án nào được thêm.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {formData.projects.map((proj) => (
                <div key={proj.id} className="group relative flex flex-col bg-white dark:bg-[#181622] rounded-lg border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4 flex-1 flex flex-col">
                    <h5 className="font-bold text-slate-800 dark:text-white text-sm mb-1 line-clamp-1">{proj.title}</h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed flex-1">{proj.description}</p>
                    
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/60">
                      {proj.link ? (
                        <a href={proj.link} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline">
                          <span className="material-symbols-outlined text-[12px]">open_in_new</span>{t("memberTabs.projects.viewBtn")}</a>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Không có link</span>
                      )}
                      
                      <button
                        onClick={() => handleRemoveProject(proj.id)}
                        className="w-7 h-7 rounded bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500 dark:hover:text-white flex items-center justify-center transition-colors"
                        title={t("memberTabs.projects.deleteBtn")}
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
