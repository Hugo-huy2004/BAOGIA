import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const STATUS_OPTIONS = ['Đang liên hệ', 'Đang lên thiết kế', 'Đang thực hiện', 'Đang Kiểm tra', 'Hoàn tất'];

const STATUS_COLORS = {
  'Đang liên hệ': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'Đang lên thiết kế': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Đang thực hiện': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Đang Kiểm tra': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Hoàn tất': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
};

export default function AdminProjectsTab({ showNotification }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // New Project Form
  const [newProject, setNewProject] = useState({
    fullName: '',
    servicePackage: 'Signature Portfolio',
    phone: '',
    handlerName: '',
    handlerPhone: ''
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/customer-projects`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Removed fetchMessages

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/customer-projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newProject)
      });
      if (res.ok) {
        showNotification(t("admin.texts.txt_77"));
        setNewProject({ fullName: '', servicePackage: 'Signature Portfolio', phone: '', handlerName: '', handlerPhone: '' });
        fetchProjects();
      } else {
        const errorData = await res.json();
        showNotification(errorData.error || t("admin.texts.txt_78"), 'error');
      }
    } catch (err) {
      showNotification(t("admin.texts.txt_79"), 'error');
    }
  };

  const handleDeleteClick = (e, project) => {
    e.stopPropagation();
    setDeleteTarget(project);
    setDeletePassword('');
    setDeleteError('');
  };

  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    if (!deletePassword) {
      setDeleteError(t("admin.texts.txt_80"));
      return;
    }
    
    setDeleteError('');
    setIsDeleting(true);
    
    try {
      // Verify admin password
      const verifyRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/admin/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: deletePassword })
      });
      
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setDeleteError(verifyData.error || t("admin.texts.txt_81"));
        setIsDeleting(false);
        return;
      }
      
      // Proceed to delete
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/customer-projects/${deleteTarget._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (res.ok) {
        showNotification(t("admin.texts.txt_82"));
        fetchProjects();
        setDeleteTarget(null);
        setDeletePassword('');
      } else {
        showNotification(t("admin.texts.txt_83"), 'error');
      }
    } catch (err) {
      setDeleteError(t("admin.texts.txt_84"));
    } finally {
      setIsDeleting(false);
    }
  };

  const getShareLink = (code) => {
    return `${window.location.origin}/login?portalCode=${code}`;
  };

  const handleCopyLink = (e, code) => {
    e.stopPropagation();
    navigator.clipboard.writeText(getShareLink(code));
    showNotification(t("admin.texts.txt_85"));
  };

  const handleOpenDetail = (project) => {
    navigate(`/admin/projects/${project._id}`);
  };

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter(p => {
      const matchesQuery = !q ||
        p.fullName?.toLowerCase().includes(q) ||
        p.phone?.toLowerCase().includes(q) ||
        p.loginCode?.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || p.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / ITEMS_PER_PAGE));
  const currentProjects = filteredProjects.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Create Form */}
        <div className="bg-white dark:bg-background rounded-md p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-5">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">add_business</span>
            Thêm Khách Hàng Mới
          </h3>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t("admin.texts.txt_72")}</label>
              <input type="text" required value={newProject.fullName} onChange={e => setNewProject({...newProject, fullName: e.target.value})} className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t("admin.texts.txt_73")}</label>
              <select value={newProject.servicePackage} onChange={e => setNewProject({...newProject, servicePackage: e.target.value})} className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold">
                <option value="Signature Portfolio">Signature Portfolio</option>
                <option value="Premium Web">Premium Web</option>
                <option value="Signature Web">Signature Web</option>
                <option value="Student Bio">Student Bio</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t("admin.texts.txt_74")}</label>
              <input type="text" value={newProject.phone} onChange={e => setNewProject({...newProject, phone: e.target.value})} className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t("admin.texts.txt_75")}</label>
              <input type="text" value={newProject.handlerName} onChange={e => setNewProject({...newProject, handlerName: e.target.value})} className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t("admin.texts.txt_76")}</label>
              <input type="text" value={newProject.handlerPhone} onChange={e => setNewProject({...newProject, handlerPhone: e.target.value})} className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold" />
            </div>
            <button type="submit" className="w-full flex items-center justify-center gap-1.5 py-3 rounded-md bg-primary hover:bg-indigo-650 text-white font-bold text-xs shadow-sm transition-all">
              <span className="material-symbols-outlined text-sm">add</span> Tạo Dự Án
            </button>
          </form>
        </div>

        {/* Project List */}
        <div className="bg-white dark:bg-background rounded-md p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col h-full min-h-[600px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2 shrink-0">
              <span className="material-symbols-outlined text-emerald-500 text-base">view_list</span>
              Danh Sách Khách Hàng ({filteredProjects.length})
            </h3>
          </div>

          {/* Search + Status filter */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4 shrink-0">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("adminProjects.tab.searchPlaceholder")}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs py-3 pl-9 pr-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs py-3 px-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold shrink-0"
            >
              <option value="">{t("adminProjects.tab.statusAll")}</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-2">
            {currentProjects.map(p => (
              <div key={p._id} onClick={() => handleOpenDetail(p)} className="cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 p-4 rounded-xl border border-border/50 transition-colors">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-foreground flex items-center gap-2 flex-wrap">
                      <span className="truncate">{p.fullName}</span>
                      {p.unreadCount > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shrink-0">
                          {p.unreadCount} {t("adminProjects.tab.newMsg")}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold truncate">{p.servicePackage}</div>
                    <div className="text-xs font-mono font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-800/50 inline-block mt-2">
                      MÃ: {p.loginCode}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-md font-bold shrink-0 text-center ${STATUS_COLORS[p.status] || STATUS_COLORS['Đang liên hệ']}`}>
                    {p.status}
                  </span>
                </div>

                {/* Always-visible action row — no hover-only controls so this works on touch devices */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
                  <button
                    onClick={(e) => handleCopyLink(e, p.loginCode)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">share</span>
                    {t("admin.texts.txt_87")}
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(e, p)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-rose-500 dark:text-rose-400 text-[10px] font-bold uppercase transition-colors"
                    title={t("admin.texts.txt_88")}
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
            {currentProjects.length === 0 && !loading && (
              <div className="text-center text-xs text-slate-500 italic py-4">{t("adminProjects.tab.empty")}</div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/50 flex justify-center items-center gap-2 shrink-0">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-8 h-8 flex items-center justify-center rounded-md border text-xs font-bold transition-colors ${
                    currentPage === idx + 1 
                      ? 'border-indigo-600 bg-indigo-600 text-white' 
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-background w-full max-w-sm rounded-md p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transform transition-all scale-100">
            <div className="flex flex-col items-center text-center space-y-3 mb-6">
              <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 rounded-full flex items-center justify-center mb-1">
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <h3 className="text-lg font-black text-foreground">{t("adminProjects.tab.deleteTitle")}</h3>
              <p className="text-xs text-muted-foreground px-2 leading-relaxed">
                {t("adminProjects.tab.deleteDesc")} <strong className="text-slate-700 dark:text-slate-300">{deleteTarget.fullName}</strong>. Bao gồm dự án, mã đăng nhập và toàn bộ tin nhắn. 
                <span className="block mt-1 text-rose-500 font-semibold">{t("adminProjects.tab.deleteWarn")}</span>
              </p>
            </div>
            
            <form onSubmit={handleConfirmDelete} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">{t("adminProjects.tab.deletePassLabel")}</label>
                <input 
                  type="password" 
                  autoFocus
                  required
                  placeholder={t("adminProjects.tab.deletePassPlaceholder")}
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-black/20 border border-border/50 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all dark:text-white placeholder-slate-400"
                />
                {deleteError && (
                  <p className="text-[11px] text-rose-500 font-medium pl-1 animate-fadeIn">{deleteError}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="py-3 rounded-md font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 transition-colors text-xs"
                >
                  {t("adminProjects.tab.deleteCancel")}
                </button>
                <button 
                  type="submit" 
                  disabled={isDeleting}
                  className="py-3 rounded-md font-bold text-white bg-rose-500 hover:bg-rose-600 flex items-center justify-center gap-2 transition-colors text-xs disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-rose-500/20"
                >
                  {isDeleting ? (
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-sm">delete_forever</span>
                  )}
                  {isDeleting ? t("adminProjects.tab.deleting") : t("adminProjects.tab.deleteConfirm")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
