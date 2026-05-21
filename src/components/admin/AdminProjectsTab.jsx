import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminProjectsTab({ showNotification }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Project Form
  const [newProject, setNewProject] = useState({
    fullName: '',
    servicePackage: 'Signature Portfolio',
    phone: '',
    handlerName: '',
    handlerPhone: ''
  });

  // Removed state for Detail view because we navigate to a new page

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
        showNotification('Tạo dự án thành công!');
        setNewProject({ fullName: '', servicePackage: 'Signature Portfolio', phone: '', handlerName: '', handlerPhone: '' });
        fetchProjects();
      } else {
        const errorData = await res.json();
        showNotification(errorData.error || 'Lỗi khi tạo dự án', 'error');
      }
    } catch (err) {
      showNotification('Lỗi máy chủ', 'error');
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa dự án này?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/customer-projects/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        showNotification('Đã xóa dự án!');
        fetchProjects();
      }
    } catch (err) {
      showNotification('Lỗi khi xóa dự án', 'error');
    }
  };

  const getShareLink = (code) => {
    return `${window.location.origin}/login?portalCode=${code}`;
  };

  const handleCopyLink = (e, code) => {
    e.stopPropagation();
    navigator.clipboard.writeText(getShareLink(code));
    showNotification('Đã copy link Portal của khách!');
  };

  const handleOpenDetail = (project) => {
    navigate(`/admin/projects/${project._id}`);
  };

  return (
    <div className="animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Create Form */}
        <div className="bg-white dark:bg-[#12111a] rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-5">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">add_business</span>
            Thêm Khách Hàng Mới
          </h3>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">Họ và Tên Khách Hàng</label>
              <input type="text" required value={newProject.fullName} onChange={e => setNewProject({...newProject, fullName: e.target.value})} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">Gói Dịch Vụ</label>
              <select value={newProject.servicePackage} onChange={e => setNewProject({...newProject, servicePackage: e.target.value})} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold">
                <option value="Signature Portfolio">Signature Portfolio</option>
                <option value="Ultimate Web App">Ultimate Web App</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">Số Điện Thoại Khách</label>
              <input type="text" value={newProject.phone} onChange={e => setNewProject({...newProject, phone: e.target.value})} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">Người Xử Lý Dự Án</label>
              <input type="text" value={newProject.handlerName} onChange={e => setNewProject({...newProject, handlerName: e.target.value})} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">SĐT Người Xử Lý</label>
              <input type="text" value={newProject.handlerPhone} onChange={e => setNewProject({...newProject, handlerPhone: e.target.value})} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold" />
            </div>
            <button type="submit" className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-primary hover:bg-indigo-650 text-white font-bold text-xs shadow-sm transition-all">
              <span className="material-symbols-outlined text-sm">add</span> Tạo Dự Án
            </button>
          </form>
        </div>

        {/* Project List */}
        <div className="bg-white dark:bg-[#12111a] rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-5">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-500 text-base">view_list</span>
            Danh Sách Khách Hàng
          </h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {projects.map(p => (
              <div key={p._id} onClick={() => handleOpenDetail(p)} className="cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 p-4 rounded-2xl border border-slate-200 dark:border-white/5 transition-colors relative group">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-sm text-slate-850 dark:text-white">{p.fullName}</div>
                    <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">{p.servicePackage}</div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${p.status === 'Hoàn tất' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>
                      {p.status}
                    </span>
                    <div className="mt-2 flex items-center justify-end gap-1">
                      <div className="text-xs font-mono font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800/50 inline-block">
                        MÃ: {p.loginCode}
                      </div>
                      <button 
                        onClick={(e) => handleCopyLink(e, p.loginCode)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 transition-colors"
                        title="Copy link gửi khách hàng"
                      >
                        <span className="material-symbols-outlined text-[14px]">share</span>
                      </button>
                    </div>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(p._id); }} className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-rose-100 text-rose-500 dark:bg-rose-900/30 dark:text-rose-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            ))}
            {projects.length === 0 && !loading && (
              <div className="text-center text-xs text-slate-500 italic py-4">Chưa có dự án nào</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
