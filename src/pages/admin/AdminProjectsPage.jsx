import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import AdminProjectsTab from '../../components/admin/AdminProjectsTab';
import { logoutAuth } from '../../services/authSession';
import { HugoNoticeToast } from '../../components/shared/HugoNotice';

export default function AdminProjectsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  // Verify auth on mount for extra safety
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/data/admin`, {
          credentials: 'include'
        });
        if (res.status === 401 || res.status === 403) {
          await logoutAuth();
          navigate('/login');
        }
      } catch (err) {
        // network error, let it be
      }
    };
    checkAuth();
  }, [navigate]);

  const showNotification = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 animate-fadeIn">
      <HugoNoticeToast open={Boolean(toastMsg)} type={toastType || "info"} message={toastMsg} />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="w-10 h-10 flex items-center justify-center rounded-md bg-white dark:bg-background border border-border text-muted-foreground hover:text-primary transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-primary/20">
                {t("adminProjects.page.workspace")}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-foreground mt-1">{t("adminProjects.page.title")}</h1>
            <p className="text-xs text-muted-foreground mt-1">{t("adminProjects.page.subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        <AdminProjectsTab showNotification={showNotification} />
      </div>
    </div>
  );
}
