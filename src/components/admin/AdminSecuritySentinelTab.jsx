import { useState, useEffect, useCallback } from "react";
import useVisiblePoll from "../../hooks/useVisiblePoll";
import { userApi } from "../../services/api/UserApi";

export default function AdminSecuritySentinelTab({ token, onShowToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingCaseId, setProcessingCaseId] = useState(null);

  const fetchSentinelData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await userApi.adminGetSecuritySentinel(token);
      if (res && res.success) {
        setData(res);
      } else {
        setError(res?.error || "Không thể tải dữ liệu BOT Security Sentinel");
      }
    } catch (err) {
      setError(err.message || "Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Dashboard admin hay bị để mở qua đêm. setInterval trần vẫn chạy lúc tab
  // ẩn: 15 giây = 5.760 request/ngày cho màn hình không ai nhìn — đúng dạng
  // đã từng đốt bandwidth Render. Ẩn thì dừng, quay lại thì nạp ngay.
  useVisiblePoll(fetchSentinelData, 15000);

  const handleResolve = async (caseId, action) => {
    try {
      setProcessingCaseId(caseId);
      const res = await userApi.adminResolveSecurityModeration(token, { caseId, action });
      if (res && res.success) {
        onShowToast?.(res.message || "Đã xử lý ca vi phạm thành công");
        await fetchSentinelData();
      } else {
        alert(res?.error || "Thao tác thất bại");
      }
    } catch (err) {
      alert("Lỗi: " + err.message);
    } finally {
      setProcessingCaseId(null);
    }
  };

  const handleUnblock = async (blockId, actorKey) => {
    if (!confirm("Bạn có chắc chắn muốn giải khóa cho đối tượng này?")) return;
    try {
      const res = await userApi.adminUnblockSecurityActor(token, { blockId, actorKey });
      if (res && res.success) {
        onShowToast?.("Đã giải khóa thành công");
        await fetchSentinelData();
      } else {
        alert(res?.error || "Thao tác thất bại");
      }
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-12 text-center text-slate-400">
        <span className="material-symbols-outlined animate-spin text-4xl mb-3 text-cyan-400">sync</span>
        <p className="text-sm font-semibold">Đang kết nối với BOT Security Sentinel...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-center">
        <p className="font-bold">{error}</p>
        <button onClick={fetchSentinelData} className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold">
          Thử lại
        </button>
      </div>
    );
  }

  const { pendingCount = 0, activeBlocksCount = 0, events24hCount = 0, pendingModerations = [], activeBlocks = [], recentEvents = [] } = data || {};

  return (
    <div className="space-y-8 animate-fadeIn text-slate-100">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <span className="material-symbols-outlined text-3xl">shield_person</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-xs font-black tracking-widest text-indigo-400 uppercase">BOT Security Sentinel</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white mt-1">Bảng Điều Khiển An Ninh Trực Quan</h2>
            </div>
          </div>
          <button
            onClick={fetchSentinelData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/30 text-xs font-bold transition-all cursor-pointer"
          >
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
            Cập nhật ngay
          </button>
        </div>

        {/* Stats Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-slate-900/80 border border-amber-500/20 p-5">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Nghi vấn chờ duyệt Telegram</p>
            <p className="text-3xl font-black text-white mt-2">{pendingCount} <span className="text-xs font-normal text-slate-400">ca</span></p>
            <p className="text-[11px] text-slate-400 mt-1">Không tự động khóa, chờ Boss chỉ thị</p>
          </div>
          <div className="rounded-2xl bg-slate-900/80 border border-rose-500/20 p-5">
            <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">Số bản ghi đang khóa</p>
            <p className="text-3xl font-black text-white mt-2">{activeBlocksCount} <span className="text-xs font-normal text-slate-400">địa chỉ</span></p>
            <p className="text-[11px] text-slate-400 mt-1">Thành viên đã đăng nhập được miễn kiểm tra</p>
          </div>
          <div className="rounded-2xl bg-slate-900/80 border border-cyan-500/20 p-5">
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Nhật ký an ninh 24h</p>
            <p className="text-3xl font-black text-white mt-2">{events24hCount} <span className="text-xs font-normal text-slate-400">sự kiện</span></p>
            <p className="text-[11px] text-slate-400 mt-1">Giám sát liên tục thời gian thực</p>
          </div>
        </div>
      </div>

      {/* Pending Moderation Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold flex items-center gap-2 text-white">
            <span className="material-symbols-outlined text-amber-400">pending_actions</span>
            Hàng Chờ Duyệt An Ninh ({pendingModerations.length})
          </h3>
          <span className="text-xs text-slate-400">Chế độ 0-Auto-Block: Cần có nút bấm chấp thuận từ Boss</span>
        </div>

        {pendingModerations.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-slate-400 text-xs">
            <span className="material-symbols-outlined text-3xl mb-2 text-emerald-400">verified</span>
            <p className="font-bold text-slate-200">Không có vi phạm nghi vấn nào đang chờ duyệt</p>
            <p className="mt-1">Hệ thống đang ở trạng thái an toàn tuyệt đối.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingModerations.map((mod) => (
              <div key={mod.caseId} className="rounded-2xl bg-slate-900 border border-amber-500/30 p-5 space-y-4 shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase">
                      {mod.category} ({mod.severity})
                    </span>
                    <h4 className="text-sm font-bold text-white mt-2 font-mono">{mod.subjectValue}</h4>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">#{mod.caseId}</span>
                </div>

                <div className="text-xs space-y-1 text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p><span className="text-slate-500">Đường dẫn:</span> <code className="text-cyan-300">{mod.path || "N/A"}</code></p>
                  <p><span className="text-slate-500">Luật vi phạm:</span> <span className="text-amber-300">{mod.ruleId}</span></p>
                  {mod.ip && <p><span className="text-slate-500">IP address:</span> <code>{mod.ip}</code></p>}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    disabled={processingCaseId === mod.caseId}
                    onClick={() => handleResolve(mod.caseId, 'approve')}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">block</span>
                    Đồng ý Khóa 24h
                  </button>
                  <button
                    disabled={processingCaseId === mod.caseId}
                    onClick={() => handleResolve(mod.caseId, 'dismiss')}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-emerald-500/30 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Bỏ qua & Cho phép
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Blocks Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-extrabold flex items-center gap-2 text-white">
          <span className="material-symbols-outlined text-rose-400">gavel</span>
          Danh Sách Đang Bị Khóa Truy Cập ({activeBlocks.length})
        </h3>

        {activeBlocks.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-slate-400 text-xs">
            Hiện không có địa chỉ IP hoặc tài khoản nào bị khóa.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Đối tượng</th>
                  <th className="p-4">Lý do</th>
                  <th className="p-4">Thời gian tạo</th>
                  <th className="p-4">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {activeBlocks.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-800/40">
                    <td className="p-4 font-mono font-bold text-white">{b.actorKey}</td>
                    <td className="p-4"><span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">{b.reasonCode}</span></td>
                    <td className="p-4 text-slate-400">{new Date(b.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleUnblock(b._id, b.actorKey)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-xs">lock_open</span>
                        Mở khóa ngay
                      </button>
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
