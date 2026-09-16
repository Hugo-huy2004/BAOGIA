import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import CustomerProfileTab from '../../components/customer/CustomerProfileTab';
import CustomerServiceTab from '../../components/customer/CustomerServiceTab';
import CustomerRequestsTab from '../../components/customer/CustomerRequestsTab';
import { API_BASE } from '../../config/apiBase';
import useVisiblePoll from '../../hooks/useVisiblePoll';

export default function CustomerPortalPage() {
  const { t } = useTranslation();

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

  const projectId = project?._id;

  // Đếm tin chưa đọc: 60 giây, chỉ khi tab đang hiện.
  //
  // Bản cũ poll 10 giây kể cả lúc tab bị ẩn — một khách để cổng mở suốt buổi
  // làm là 360 request/giờ cho một CON SỐ nhỏ trên badge. Khách quay lại tab
  // thì gọi ngay, nên vẫn thấy số đúng lúc họ thực sự nhìn.
  const fetchUnreadCount = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`${API_BASE}/customer-projects/${projectId}/messages/unread-count`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch {}
  }, [projectId]);

  useVisiblePoll(fetchUnreadCount, 60000, Boolean(projectId));

  useEffect(() => {
    const handleMessagesRead = () => setUnreadCount(0);
    window.addEventListener('messagesRead', handleMessagesRead);
    return () => window.removeEventListener('messagesRead', handleMessagesRead);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('customerProject');
    navigate('/login');
  };

  if (!project) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Đầu trang: tên khách và gói, không trang trí thêm. */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold">
              {project.fullName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold tracking-[-.01em]">{project.fullName}</h1>
              <p className="truncate text-xs text-muted-foreground">{project.servicePackage}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold transition-colors hover:bg-muted"
          >
            {t("customerPortal.logout", "Đăng xuất")}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        {/* Navigation Tabs */}
        <div className="mb-10 flex gap-7 overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setActiveTab('profile')}
            className={`-mb-px shrink-0 border-b-2 pb-3 text-sm transition-colors ${
              activeTab === 'profile' ? "border-foreground font-semibold text-foreground" : "border-transparent font-medium text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("customerPortal.tabs.profile")}
          </button>
          <button
            onClick={() => setActiveTab('service')}
            className={`-mb-px shrink-0 border-b-2 pb-3 text-sm transition-colors ${
              activeTab === 'service' ? "border-foreground font-semibold text-foreground" : "border-transparent font-medium text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("customerPortal.tabs.service")}
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`-mb-px relative shrink-0 border-b-2 pb-3 text-sm transition-colors ${
              activeTab === 'requests' ? "border-foreground font-semibold text-foreground" : "border-transparent font-medium text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("customerPortal.tabs.requests")}
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[11px] font-semibold text-background">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'profile' && <CustomerProfileTab project={project} setProject={setProject} />}
          {activeTab === 'service' && <CustomerServiceTab project={project} />}
          {activeTab === 'requests' && <CustomerRequestsTab project={project} />}
        </div>
      </main>
    </div>
  );
}
