import { useState, useEffect } from 'react';
import adminBrainApi from '../../services/api/AdminBrainApi';
import { notify } from '../../lib/notify';

export default function AdminAuditLogTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await adminBrainApi.getAuditLogs(100);
      setLogs(res.logs || []);
    } catch (err) {
      notify.error(err.message || 'Không thể tải nhật ký kiểm toán');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((item) => {
    const matchesAction = filterAction === 'ALL' || item.action === filterAction;
    const matchesSearch =
      !searchTerm.trim() ||
      (item.details && item.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.targetUserEmail && item.targetUserEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.adminEmail && item.adminEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.action && item.action.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesAction && matchesSearch;
  });

  const getActionBadge = (action) => {
    switch (action) {
      case 'ADJUST_JOY':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">Điều chỉnh JOY</span>;
      case 'RECONCILE_JOY':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">Đối soát JOY</span>;
      case 'REVOKE_SESSION':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/30">Thu hồi phiên</span>;
      case 'SEND_EMAIL':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-500/30">Gửi Email</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-500/30">{action}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="p-6 rounded-3xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-500">history_edu</span>
            <span>Nhật ký Kiểm toán Thao tác Quản trị (Admin Audit Log)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Truy vết 100% các hành động điều chỉnh JOY, đăng xuất cưỡng chế và thay đổi cấu hình bảo mật.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Action Filter */}
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-4 py-2 rounded-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả hành động</option>
            <option value="ADJUST_JOY">Điều chỉnh JOY</option>
            <option value="RECONCILE_JOY">Đối soát JOY</option>
            <option value="REVOKE_SESSION">Thu hồi phiên</option>
            <option value="SEND_EMAIL">Gửi Email</option>
          </select>

          {/* Search Box */}
          <input
            type="text"
            placeholder="Tìm theo email, chi tiết..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 rounded-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
          />

          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>sync</span>
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-3xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 dark:text-slate-400 gap-3">
            <span className="material-symbols-outlined animate-spin text-2xl">sync</span>
            <span>Đang tải nhật ký kiểm toán...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400 text-xs">
            Chưa có nhật ký kiểm toán phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/60 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-b border-slate-200/60 dark:border-white/10 font-black uppercase tracking-widest text-[9px]">
                  <th className="px-6 py-4">Thời gian</th>
                  <th className="px-6 py-4">Quản trị viên</th>
                  <th className="px-6 py-4">Hành động</th>
                  <th className="px-6 py-4">Đối tượng tác động</th>
                  <th className="px-6 py-4">Chi tiết thao tác</th>
                  <th className="px-6 py-4 text-right">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-medium">
                {filteredLogs.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {new Date(item.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {item.adminEmail || item.adminId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getActionBadge(item.action)}
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {item.targetUserEmail || item.targetUserId || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-white font-semibold">
                      {item.details}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-[10px] text-slate-400">
                      {item.ipAddress || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
