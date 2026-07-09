import React, { useState, useEffect } from "react";
import { Search, CheckCircle, XCircle, Clock, ExternalLink, Award, RefreshCw, Send, ChevronRight } from "lucide-react";
import { notify } from "../../lib/notify";

export default function AdminCoderSubmissionsTab() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, pending, approved, rejected
  const [actionTarget, setActionTarget] = useState(null); // bio object for modal
  const [actionType, setActionType] = useState(""); // 'approve' | 'reject'
  const [adminNote, setAdminNote] = useState("");
  const [certificateUrl, setCertificateUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const apiBase = import.meta.env.VITE_API_URL || "/api";
      const res = await fetch(`${apiBase}/admin/coder-submissions`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tải dữ liệu.");
      setSubmissions(data.data || []);
    } catch (err) {
      console.error(err);
      notify.error(err.message || "Lỗi tải danh sách bài nộp.");
    } finally {
      setLoading(false);
    }
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!actionTarget) return;

    if (actionType === "approve" && !certificateUrl) {
      notify.error("Vui lòng nhập Link Google Drive chứng chỉ đã design!");
      return;
    }
    if (actionType === "reject" && !adminNote) {
      notify.error("Vui lòng nhập lý do từ chối để hướng dẫn học viên!");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token") || "";
      const apiBase = import.meta.env.VITE_API_URL || "/api";
      const res = await fetch(`${apiBase}/admin/verify-graduation-project`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          email: actionTarget.email,
          status: actionType === "approve" ? "approved" : "rejected",
          adminNote: adminNote,
          certificateUrl: actionType === "approve" ? certificateUrl : ""
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xử lý duyệt thất bại.");

      notify.success(
        actionType === "approve"
          ? "Đã duyệt đề án & cấp Chứng nhận tốt nghiệp thành công! 🎓"
          : "Đã gửi phản hồi từ chối dự án."
      );
      
      setActionTarget(null);
      setAdminNote("");
      setCertificateUrl("");
      fetchSubmissions();
    } catch (err) {
      console.error(err);
      notify.error(err.message || "Lỗi xử lý duyệt.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter submissions
  const filteredList = submissions.filter(sub => {
    const nameMatch = (sub.displayName || "").toLowerCase().includes(search.toLowerCase()) || 
                      (sub.email || "").toLowerCase().includes(search.toLowerCase());
    
    const status = sub.hugoCoderProjectStatus || "idle";
    const statusMatch = statusFilter === "all" || status === statusFilter;
    
    return nameMatch && statusMatch;
  });

  return (
    <div className="space-y-6 font-sans text-zinc-100 p-1 md:p-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-lg font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Duyệt Tốt Nghiệp HugoCoder
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Chỉ hiển thị những học viên đạt Chặng 6+ (Hoàn thành bài 62 kiểm tra).
          </p>
        </div>
        <button
          onClick={fetchSubmissions}
          disabled={loading}
          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all active:scale-95 border border-zinc-700/50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Tải lại danh sách
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên học viên, email..."
            className="w-full bg-zinc-950/60 border border-zinc-800 p-2.5 pl-10 rounded-xl text-xs placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div className="flex gap-1.5 bg-zinc-950/60 p-1 rounded-xl border border-zinc-800 self-start">
          {[
            { id: "all", label: "Tất cả" },
            { id: "pending", label: "Chờ duyệt" },
            { id: "approved", label: "Đã duyệt" },
            { id: "rejected", label: "Bị từ chối" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? "bg-amber-500 text-zinc-950"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List Container */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
          <p className="text-xs text-zinc-500">Đang tải danh sách học viên...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-zinc-800/80 rounded-2xl bg-zinc-950/20">
          <Award className="w-10 h-10 text-zinc-700 mx-auto mb-2.5" />
          <p className="text-xs text-zinc-400 font-bold">Không tìm thấy bài nộp nào phù hợp</p>
          <p className="text-[10px] text-zinc-500 mt-1">Học viên cần đạt bài 62 mới hiển thị tại đây.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredList.map(sub => {
            const status = sub.hugoCoderProjectStatus || "idle";
            const completedCount = sub.completedLessons?.length || 0;
            return (
              <div
                key={sub.email}
                className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-zinc-700/50"
              >
                <div className="space-y-3 flex-1 min-w-0">
                  {/* User Profile */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0 border border-zinc-700/30">
                      {sub.avatarUrl ? (
                        <img src={sub.avatarUrl} alt={sub.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-amber-500/10 text-amber-500 text-sm font-black uppercase">
                          {(sub.displayName || sub.email || "?").slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-zinc-200">{sub.displayName || "Lập trình viên"}</h4>
                      <p className="text-[10px] text-zinc-500 font-mono">{sub.email}</p>
                    </div>
                  </div>

                  {/* Progress Stats */}
                  <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                    <span className="bg-zinc-850 px-2 py-1 rounded border border-zinc-850">
                      Tiến độ: <strong className="text-amber-500">{completedCount}/100</strong> bài học
                    </span>
                    {sub.hugoCoderProjectSubmittedAt && (
                      <span className="text-zinc-500">
                        Nộp ngày: {new Date(sub.hugoCoderProjectSubmittedAt).toLocaleString("vi-VN")}
                      </span>
                    )}
                  </div>

                  {/* Project URL & Notes */}
                  {sub.hugoCoderProjectUrl ? (
                    <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-850 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Đề án nộp:</span>
                        <a
                          href={sub.hugoCoderProjectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 hover:underline"
                        >
                          Mở dự án live <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      {sub.hugoCoderProjectNote && (
                        <p className="text-[10.5px] text-zinc-300 leading-normal bg-zinc-900/30 p-2 rounded-lg border border-zinc-800/40">
                          {sub.hugoCoderProjectNote}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-500 italic">Chưa nộp link dự án tốt nghiệp.</p>
                  )}

                  {/* Admin feedback show */}
                  {status === "rejected" && sub.hugoCoderProjectAdminNote && (
                    <p className="text-[10px] text-red-400 bg-red-950/20 border border-red-900/30 p-2 rounded-lg">
                      Phản hồi từ chối: {sub.hugoCoderProjectAdminNote}
                    </p>
                  )}

                  {status === "approved" && sub.hugoCoderCertificateUrl && (
                    <a
                      href={sub.hugoCoderCertificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:underline font-bold"
                    >
                      Chứng chỉ đã cấp: Google Drive Link <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Right Actions & Status Badges */}
                <div className="flex flex-col sm:items-end gap-2.5 self-stretch sm:self-auto justify-center">
                  {/* Status Badge */}
                  <div>
                    {status === "approved" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        <CheckCircle className="w-3.5 h-3.5" /> Đã duyệt tốt nghiệp
                      </span>
                    )}
                    {status === "pending" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold animate-pulse">
                        <Clock className="w-3.5 h-3.5" /> Đang chờ duyệt
                      </span>
                    )}
                    {status === "rejected" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold">
                        <XCircle className="w-3.5 h-3.5" /> Đã từ chối
                      </span>
                    )}
                    {status === "idle" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-500 text-[10px] font-bold">
                        Học viên tự do
                      </span>
                    )}
                  </div>

                  {/* Actions Buttons */}
                  {sub.hugoCoderProjectUrl && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActionTarget(sub);
                          setActionType("reject");
                          setAdminNote(sub.hugoCoderProjectAdminNote || "");
                        }}
                        className="px-3 py-1.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-900/40 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Từ chối
                      </button>
                      <button
                        onClick={() => {
                          setActionTarget(sub);
                          setActionType("approve");
                          setCertificateUrl(sub.hugoCoderCertificateUrl || "");
                        }}
                        className="px-3 py-1.5 bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-400 border border-emerald-900/40 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Duyệt tốt nghiệp
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Actions Form */}
      {actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5 md:p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-extrabold text-amber-500 uppercase tracking-wider">
                {actionType === "approve" ? "Xác nhận tốt nghiệp" : "Từ chối đề án"}
              </h3>
              <button
                onClick={() => setActionTarget(null)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-bold"
              >
                Đóng
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <p className="text-zinc-400">Học viên: <strong className="text-zinc-200">{actionTarget.displayName || actionTarget.email}</strong></p>
              <p className="text-zinc-500 font-mono text-[10px]">{actionTarget.email}</p>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              {actionType === "approve" ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest block">Google Drive Link chứng nhận *</label>
                  <input
                    type="url"
                    required
                    value={certificateUrl}
                    onChange={(e) => setCertificateUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
                  />
                  <p className="text-[9px] text-zinc-500 leading-normal mt-1">
                    Cần thiết kế thủ công giấy chứng nhận và upload lên Google Drive ở chế độ công khai để học viên click xem được.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest block">Lý do từ chối *</label>
                  <textarea
                    rows={4}
                    required
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Ghi rõ lý do tại sao dự án chưa đạt, những điểm cần sửa đổi..."
                    className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 resize-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionTarget(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-lg text-xs font-bold transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider text-zinc-950 transition-all ${
                    actionType === "approve" 
                      ? "bg-emerald-500 hover:bg-emerald-600" 
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {submitting ? "Đang xử lý..." : "Xác nhận"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
