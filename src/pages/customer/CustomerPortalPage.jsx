import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import CustomerProfileTab from '../../components/customer/CustomerProfileTab';
import CustomerServiceTab from '../../components/customer/CustomerServiceTab';
import CustomerRequestsTab from '../../components/customer/CustomerRequestsTab';

export default function CustomerPortalPage() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith("vi") ? "en" : "vi";
    i18n.changeLanguage(newLang);
  };

  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const saved = sessionStorage.getItem('customerProject');
    if (!saved) {
      navigate('/login');
    } else {
      setProject(JSON.parse(saved));
    }
  }, [navigate]);

  useEffect(() => {
    let interval;
    if (project && project._id) {
      const fetchUnreadCount = async () => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/customer-projects/${project._id}/messages/unread-count`, {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          });
          if (res.ok) {
            const data = await res.json();
            setUnreadCount(data.count || 0);
          }
        } catch (err) {}
      };
      
      // Fetch immediately
      fetchUnreadCount();
      
      // Poll every 10 seconds
      interval = setInterval(fetchUnreadCount, 10000);
    }
    const handleMessagesRead = () => {
      setUnreadCount(0);
    };
    
    window.addEventListener('messagesRead', handleMessagesRead);

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('messagesRead', handleMessagesRead);
    };
  }, [project]);

  const handleLogout = () => {
    sessionStorage.removeItem('customerProject');
    navigate('/login');
  };

  if (!project) return null;

  return (
    <div className="brand-shell min-h-screen text-foreground">

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/72 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ef4444] via-[#6366f1] to-[#06b6d4] flex items-center justify-center text-white font-bold text-lg shadow-[0_14px_24px_-18px_rgba(59,130,246,0.55)]">
              {project.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-bold text-sm">{project.fullName}</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.16em]">{project.servicePackage}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-2xl border border-border/70 bg-card/80 px-4 py-2 text-xs font-bold transition-colors hover:bg-muted/80"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab('profile')}
            className="brand-tab flex items-center gap-2"
            data-active={activeTab === 'profile'}
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
            {t("customerPortal.tabs.profile")}
          </button>
          <button
            onClick={() => setActiveTab('service')}
            className="brand-tab flex items-center gap-2"
            data-active={activeTab === 'service'}
          >
            <span className="material-symbols-outlined text-[18px]">view_timeline</span>
            {t("customerPortal.tabs.service")}
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className="brand-tab relative flex items-center gap-2"
            data-active={activeTab === 'requests'}
          >
            <span className="material-symbols-outlined text-[18px]">forum</span>
            {t("customerPortal.tabs.requests")}
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-destructive text-[10px] font-bold text-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          {activeTab === 'profile' && <CustomerProfileTab project={project} setProject={setProject} />}
          {activeTab === 'service' && <CustomerServiceTab project={project} />}
          {activeTab === 'requests' && <CustomerRequestsTab project={project} />}
        </div>
      </main>
    </div>
  );
}
