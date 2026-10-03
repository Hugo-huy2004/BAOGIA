import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import CustomerProfileTab from '../../components/customer/CustomerProfileTab';
import CustomerServiceTab from '../../components/customer/CustomerServiceTab';
import CustomerRequestsTab from '../../components/customer/CustomerRequestsTab';
import RequirementForm from '../../components/customer/RequirementForm';
import CustomerContractTab from '../../components/customer/CustomerContractTab';
import { API_BASE } from '../../config/apiBase';
import { findServicePackage } from '../../data/servicePackages';
import useVisiblePoll from '../../hooks/useVisiblePoll';

/**
 * Cổng dự án của khách.
 *
 * Khách vào bằng LINK RIÊNG `/customer-portal/<mã truy cập>` admin gửi — bấm là
 * vào, không phải nhập gì. Trang đổi mã lấy cookie phiên (HttpOnly) rồi xoá mã
 * khỏi thanh địa chỉ, để mã không nằm lại trong lịch sử trình duyệt hay ảnh chụp
 * màn hình. Từ đó mọi dữ liệu đọc qua GET /customer-projects/me bằng cookie.
 */

// Các tab cũ còn đọc tên trường trước đợt đổi cấu trúc — nối lại ở một chỗ.
const withLegacyFields = (p) => ({
  ...p,
  fullName: p.customer?.fullName || p.name || '',
  phone: p.customer?.phone || '',
  servicePackage: findServicePackage(p.packageId)?.name || p.packageId || '',
});

export default function CustomerPortalPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { code } = useParams();
  const [project, setProject] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | invalid
  const [activeTab, setActiveTab] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    try {
      if (code) {
        const auth = await fetch(`${API_BASE}/customer-projects/auth`, {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ loginCode: code }),
        });
        if (!auth.ok) { setState('invalid'); return; }
        navigate('/customer-portal', { replace: true });
        return;
      }
      const res = await fetch(`${API_BASE}/customer-projects/me`, { credentials: 'include' });
      if (!res.ok) { setState('invalid'); return; }
      const data = await res.json();
      setProject(withLegacyFields(data));
      setActiveTab((tab) => tab || (data.status === 'awaiting_requirements' ? 'brief' : 'service'));
      setState('ready');
    } catch {
      setState('invalid');
    }
  }, [code, navigate]);

  useEffect(() => { load(); }, [load]);

  const projectId = project?._id;

  // Đếm tin chưa đọc: 60 giây, chỉ khi tab đang hiện.
  const fetchUnreadCount = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`${API_BASE}/customer-projects/${projectId}/messages/unread-count`, { credentials: 'include' });
      if (res.ok) setUnreadCount((await res.json()).count || 0);
    } catch { /* bỏ qua, lần sau đếm lại */ }
  }, [projectId]);

  useVisiblePoll(fetchUnreadCount, 60000, Boolean(projectId));

  useEffect(() => {
    const handleMessagesRead = () => setUnreadCount(0);
    window.addEventListener('messagesRead', handleMessagesRead);
    return () => window.removeEventListener('messagesRead', handleMessagesRead);
  }, []);

  if (state === 'invalid') {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-5 text-center text-foreground">
        <div className="max-w-sm">
          <span aria-hidden className="material-symbols-outlined text-[40px] text-muted-foreground">link_off</span>
          <h1 className="mt-3 text-xl font-semibold">{t('customerPortal.invalidTitle', 'Link dự án không mở được')}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t('customerPortal.invalidBody', 'Link có thể đã sai hoặc hết hạn. Bạn nhắn Hugo Studio để nhận link mới.')}
          </p>
        </div>
      </div>
    );
  }
  if (!project) return null;

  const tabs = [
    { id: 'brief', label: t('customerPortal.tabs.brief', 'Yêu cầu dự án') },
    { id: 'contract', label: t('customerPortal.tabs.contract', 'Hợp đồng'), badge: project.contract?.version > (project.contract?.acceptedVersion || 0) ? '!' : 0 },
    { id: 'service', label: t('customerPortal.tabs.service') },
    { id: 'requests', label: t('customerPortal.tabs.requests'), badge: unreadCount },
    { id: 'profile', label: t('customerPortal.tabs.profile') },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-5 sm:px-8">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold">
            {(project.fullName || '?').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-[-.01em]">{project.fullName}</h1>
            <p className="truncate text-xs text-muted-foreground">{project.projectId} · {project.servicePackage}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <div className="mb-10 flex gap-7 overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`-mb-px shrink-0 border-b-2 pb-3 text-sm transition-colors ${activeTab === tab.id ? 'border-foreground font-semibold text-foreground' : 'border-transparent font-medium text-muted-foreground hover:text-foreground'}`}>
              {tab.label}
              {tab.badge === '!' || tab.badge > 0 ? (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[11px] font-semibold text-background">{tab.badge}</span>
              ) : null}
            </button>
          ))}
        </div>

        {activeTab === 'brief' && <RequirementForm project={project} onSaved={(p) => setProject(withLegacyFields(p))} />}
        {activeTab === 'contract' && <CustomerContractTab project={project} onChange={(p) => setProject(withLegacyFields(p))} />}
        {activeTab === 'service' && <CustomerServiceTab project={project} />}
        {activeTab === 'requests' && <CustomerRequestsTab project={project} />}
        {activeTab === 'profile' && <CustomerProfileTab project={project} setProject={setProject} />}
      </main>
    </div>
  );
}
