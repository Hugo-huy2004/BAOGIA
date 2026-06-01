import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import CustomerProfileTab from '../components/customer/CustomerProfileTab';
import CustomerServiceTab from '../components/customer/CustomerServiceTab';
import CustomerRequestsTab from '../components/customer/CustomerRequestsTab';

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
            headers: { 'Content-Type': 'application/json' }
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-800 dark:text-slate-100">
      <button onClick={toggleLanguage} className="fixed top-4 right-4 md:top-6 md:right-6 z-50 flex h-9 w-12 items-center justify-center rounded-full bg-slate-200/80 dark:bg-[#1f1929]/80 backdrop-blur shadow-sm text-[11px] font-bold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-[#2d253b] transition-all">{i18n.language.startsWith("en") ? "EN" : "VI"}</button>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
              {project.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-bold text-sm">{project.fullName}</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">{project.servicePackage}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold transition-colors"
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
            className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                : 'bg-white text-slate-500 hover:bg-slate-100 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
            {t("customerPortal.tabs.profile")}
          </button>
          <button
            onClick={() => setActiveTab('service')}
            className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'service'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                : 'bg-white text-slate-500 hover:bg-slate-100 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">view_timeline</span>
            {t("customerPortal.tabs.service")}
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 relative ${
              activeTab === 'requests'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                : 'bg-white text-slate-500 hover:bg-slate-100 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">forum</span>
            {t("customerPortal.tabs.requests")}
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-[#09090b] animate-pulse">
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
