import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function CustomerProfileTab({ project, setProject }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: project.fullName || '',
    phone: project.phone || '',
    birthday: project.customerProfile?.birthday || '',
    email: project.customerProfile?.email || '',
    address: project.customerProfile?.address || ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const isCompleted = project.status === 'Hoàn tất';

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isCompleted) return;
    
    setLoading(true);
    setSuccess(false);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/customer-projects/${project._id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const updatedProject = await res.json();
      setProject(updatedProject);
      sessionStorage.setItem('customerProject', JSON.stringify(updatedProject));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="brand-panel max-w-2xl mx-auto rounded-[28px] p-6 md:p-8">
      <div className="mb-6 space-y-1">
        <h2 className="text-lg font-bold text-foreground">{t("customerPortal.profile.title")}</h2>
        <p className="text-xs text-muted-foreground">{t("customerPortal.profile.subtitle")}</p>
        {isCompleted && (
          <div className="mt-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            {t("customerPortal.profile.completedWarn")}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.16em]">{t("customerPortal.profile.fullName")}</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              disabled={isCompleted}
              className="w-full rounded-2xl border border-border/60 bg-card/75 px-4 py-3 text-xs text-foreground shadow-inner-soft backdrop-blur-sm transition-all focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.16em]">{t("customerPortal.profile.phone")}</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={isCompleted}
              className="w-full rounded-2xl border border-border/60 bg-card/75 px-4 py-3 text-xs text-foreground shadow-inner-soft backdrop-blur-sm transition-all focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.16em]">{t("customerPortal.profile.email")}</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isCompleted}
              className="w-full rounded-2xl border border-border/60 bg-card/75 px-4 py-3 text-xs text-foreground shadow-inner-soft backdrop-blur-sm transition-all focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.16em]">{t("customerPortal.profile.birthday")}</label>
            <input
              type="date"
              name="birthday"
              value={formData.birthday}
              onChange={handleChange}
              disabled={isCompleted}
              className="w-full rounded-2xl border border-border/60 bg-card/75 px-4 py-3 text-xs text-foreground shadow-inner-soft backdrop-blur-sm transition-all focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.16em]">{t("customerPortal.profile.address")}</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            disabled={isCompleted}
            className="w-full rounded-2xl border border-border/60 bg-card/75 px-4 py-3 text-xs text-foreground shadow-inner-soft backdrop-blur-sm transition-all focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          />
        </div>

        {!isCompleted && (
          <div className="pt-4 flex items-center justify-between">
            {success && <span className="text-xs font-bold text-emerald-500">{t("customerPortal.profile.updateSuccess")}</span>}
            <button
              type="submit"
              disabled={loading}
              className="ml-auto flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-xs font-bold text-white shadow-[0_12px_30px_-16px_hsl(var(--primary)/0.75)] transition-all hover:bg-primary/90 active:scale-95 disabled:bg-primary/55"
            >
              {loading ? t("customerPortal.profile.savingBtn") : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  {t("customerPortal.profile.saveBtn")}
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
