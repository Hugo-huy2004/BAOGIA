import React, { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import { logoutAuth } from "../services/authSession";

// Hugo Studio Brand Logo component to match styling exactly
const HugoStudioColoredBrandLogo = ({ className = "text-xl sm:text-2xl" }) => {
  const chars = [
    { char: "H", color: "#EF4444" },
    { char: "u", color: "#F97316" },
    { char: "g", color: "#EAB308" },
    { char: "o", color: "#22C55E" },
    { char: " ", color: "transparent" },
    { char: "S", color: "#3B82F6" },
    { char: "t", color: "#6366F1" },
    { char: "u", color: "#A855F7" },
    { char: "d", color: "#EC4899" },
    { char: "i", color: "#06B6D4" },
    { char: "o", color: "#0ea5e9" }
  ];
  return (
    <span className={`we-bare-bears select-none ${className}`}>
      {chars.map((item, idx) => (
        <span key={idx} style={{ color: item.color }}>
          {item.char}
        </span>
      ))}
    </span>
  );
};

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users"); // 'users', 'bookings', 'partners'
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");

  // Partner Form State
  const [partnerForm, setPartnerForm] = useState({ name: "", iframeUrl: "" });
  const [previewPartner, setPreviewPartner] = useState(null);
  const [exportPartner, setExportPartner] = useState(null);
  const [exportLinkPartner, setExportLinkPartner] = useState(null);

  // Search and Pagination for Partners
  const [partnerSearch, setPartnerSearch] = useState("");
  const [partnerPage, setPartnerPage] = useState(1);

  // Deletion Confirmation States
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const sha256 = async (message) => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const filteredPartners = partners.filter(p => 
    p.name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
    (p.iframeUrl || "").toLowerCase().includes(partnerSearch.toLowerCase())
  );

  const PARTNERS_PER_PAGE = 8;
  const totalPartnerPages = Math.ceil(filteredPartners.length / PARTNERS_PER_PAGE);
  const paginatedPartners = filteredPartners.slice(
    (partnerPage - 1) * PARTNERS_PER_PAGE,
    partnerPage * PARTNERS_PER_PAGE
  );

  const playPopSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio pop effect failed:", e);
    }
  };

  const showNotification = (msg, type = "success") => {
    playPopSound();
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const getPartnerBioEditorUrl = (partner, emailPlaceholder = "") => {
    const params = new URLSearchParams({
      partnerId: partner._id,
      token: partner.accessToken || ""
    });
    if (emailPlaceholder) params.set("email", emailPlaceholder);
    return `${window.location.origin}/partner/bio-editor?${params.toString()}`;
  };

  const getPartnerBioIframeCode = (partner) => {
    return `<iframe src="${getPartnerBioEditorUrl(partner)}" width="100%" height="820" style="border:0; border-radius:16px; box-shadow:0 12px 40px rgba(15,23,42,0.12);" allow="clipboard-write"></iframe>`;
  };

  // Fetch all admin data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [biosRes, bookingsRes, partnersRes] = await Promise.all([
          fetch(import.meta.env.VITE_API_URL + "/api/bios"),
          fetch(import.meta.env.VITE_API_URL + "/api/bookings"),
          fetch(import.meta.env.VITE_API_URL + "/api/partners")
        ]);

        if (biosRes.ok) setUsers(await biosRes.json());
        if (bookingsRes.ok) setBookings(await bookingsRes.json());
        if (partnersRes.ok) setPartners(await partnersRes.json());
      } catch (err) {
        console.error("Failed to load admin data:", err);
        showNotification("Có lỗi xảy ra khi tải dữ liệu từ máy chủ.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    logoutAuth();
    window.location.href = "/login";
  };

  // Delete Bio Action with Password Verification
  const handleExecuteDelete = async () => {
    setConfirmError("");
    if (!confirmPassword) {
      setConfirmError("Vui lòng nhập mật khẩu quản trị.");
      return;
    }

    const expectedPasswordHash = import.meta.env.VITE_ADMIN_PASSWORD_HASH || "ac5828f24a8a65e366395faa1d58abe1e2dda05853e45bdb0ae696712e3f1bb3";
    const inputHash = await sha256(confirmPassword);

    if (inputHash !== expectedPasswordHash) {
      setConfirmError("Mật khẩu quản trị không chính xác. Vui lòng nhập lại.");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bios/${deleteTarget._id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        showNotification(`Đã xóa vĩnh viễn tài khoản của ${deleteTarget.displayName}! 🗑️`);
        setUsers(prev => prev.filter(u => u._id !== deleteTarget._id));
        setDeleteTarget(null);
        setConfirmPassword("");
      } else {
        setConfirmError("Có lỗi xảy ra khi xóa tài khoản trên máy chủ.");
      }
    } catch (err) {
      console.error(err);
      setConfirmError("Lỗi kết nối đến máy chủ.");
    }
  };

  // 1. Bios Actions
  const handleToggleBioStatus = async (bioId, currentStatus) => {
    const nextStatus = currentStatus === 'locked' ? 'active' : 'locked';
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bios/${bioId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (response.ok) {
        showNotification(nextStatus === 'locked' ? "Đã khóa liên kết người dùng! 🔒" : "Đã mở khóa liên kết người dùng! 🔓");
        setUsers(prev => prev.map(u => u._id === bioId ? { ...u, status: nextStatus } : u));
      } else {
        showNotification("Có lỗi khi cập nhật trạng thái.", "error");
      }
    } catch (e) {
      console.error(e);
      showNotification("Lỗi kết nối.", "error");
    }
  };

  // 2. Booking Actions
  const handleToggleBookingContacted = async (bookingId, currentContacted) => {
    const nextContacted = !currentContacted;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/${bookingId}/contact`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacted: nextContacted })
      });
      if (response.ok) {
        const updated = await response.json();
        showNotification(nextContacted ? "Đã đánh dấu liên hệ! 📞" : "Đã bỏ đánh dấu liên hệ.");
        setBookings(prev => prev.map(b => b._id === bookingId ? updated : b));
      } else {
        showNotification("Có lỗi khi cập nhật trạng thái.", "error");
      }
    } catch (e) {
      console.error(e);
      showNotification("Lỗi kết nối.", "error");
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn yêu cầu đặt lịch này không?")) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/${bookingId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        showNotification("Đã xóa yêu cầu đặt lịch! 🗑️");
        setBookings(prev => prev.filter(b => b._id !== bookingId));
      } else {
        showNotification("Có lỗi khi xóa.", "error");
      }
    } catch (e) {
      console.error(e);
      showNotification("Lỗi kết nối.", "error");
    }
  };

  // 3. Partner Actions
  const handleAddPartner = async (e) => {
    e.preventDefault();
    const shouldExportIframe = e.nativeEvent?.submitter?.value === "export-iframe";
    if (!partnerForm.name || !partnerForm.iframeUrl) {
      showNotification("Vui lòng điền đầy đủ tên và đường dẫn/mã nhúng.", "error");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/partners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partnerForm)
      });
      if (response.ok) {
        const newPartner = await response.json();
        showNotification("Đã thêm đối tác thành công!");
        setPartners(prev => [newPartner, ...prev]);
        setPartnerForm({ name: "", iframeUrl: "" });
        if (shouldExportIframe) {
          setExportPartner(newPartner);
        }
      } else {
        showNotification("Có lỗi khi thêm đối tác.", "error");
      }
    } catch (e) {
      console.error(e);
      showNotification("Lỗi kết nối.", "error");
    }
  };

  const handleDeletePartner = async (partnerId) => {
    if (!window.confirm("Bạn có chắc chắn muốn kết thúc liên kết với đối tác này?")) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/partners/${partnerId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        showNotification("Đã xóa đối tác liên kết! 🗑️");
        setPartners(prev => prev.filter(p => p._id !== partnerId));
        if (previewPartner?._id === partnerId) setPreviewPartner(null);
        if (exportPartner?._id === partnerId) setExportPartner(null);
        if (exportLinkPartner?._id === partnerId) setExportLinkPartner(null);
      } else {
        showNotification("Có lỗi khi xóa đối tác.", "error");
      }
    } catch (e) {
      console.error(e);
      showNotification("Lỗi kết nối.", "error");
    }
  };

  // Utility helpers
  const getFaviconUrl = (iframeUrl) => {
    try {
      let url = iframeUrl;
      if (iframeUrl.includes('<iframe')) {
        const match = iframeUrl.match(/src=["']([^"']+)["']/);
        if (match) url = match[1];
      }
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
    } catch (e) {
      return "";
    }
  };

  const formatExpiration = (expiresAt) => {
    if (!expiresAt) return "Vĩnh viễn";
    const expDate = new Date(expiresAt);
    const diffTime = expDate.getTime() - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const formattedDate = expDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    if (diffDays <= 0) {
      return <span className="text-red-500 font-bold">Đã hết hạn ({formattedDate})</span>;
    }
    return (
      <div className="flex flex-col">
        <span className="text-slate-800 dark:text-slate-200 font-semibold">{formattedDate}</span>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Còn {diffDays} ngày</span>
      </div>
    );
  };

  const getAutoDeleteDays = (booking) => {
    if (!booking.contacted || !booking.expiresAt) return null;
    const expDate = new Date(booking.expiresAt);
    const diffTime = expDate.getTime() - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Đang tải bảng điều khiển...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-fadeIn relative">
      
      {/* SUCCESS/WARNING TOAST */}
      {toastMsg && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white dark:bg-[#161420] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.35)] max-w-md border-2 transition-all ${
          toastType === "success" 
            ? "border-emerald-500 dark:border-emerald-600" 
            : "border-red-500 dark:border-rose-500"
        }`}>
          <span className="material-symbols-outlined shrink-0 text-xl text-slate-800 dark:text-slate-200">
            {toastType === "success" ? "check_circle" : "error"}
          </span>
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">{toastMsg}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <span className="text-[9px] bg-primary/10 text-primary dark:bg-indigo-950/40 dark:text-[#a5b4fc] px-3.5 py-1.5 rounded-full font-bold uppercase tracking-widest border border-primary/25">
            Admin Workspace • Quản Trị Hệ Thống
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mt-2">
            Bảng Điều Khiển <HugoStudioColoredBrandLogo className="text-2xl sm:text-3xl font-black tracking-tight" />
          </h1>
          <p className="text-xs text-slate-450 mt-1">Giám sát tài khoản thành viên, quản lý lịch hẹn đặt thiết kế và dịch vụ liên kết đối tác.</p>
        </div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          Đăng Xuất Admin
        </button>
      </div>

      {/* TAB NAVIGATION */}
      <div className="bg-slate-100/70 dark:bg-[#161420] p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 max-w-md flex">
        <button
          onClick={() => { playPopSound(); setActiveTab("users"); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === "users"
              ? "bg-white dark:bg-[#251f30] text-primary dark:text-[#a5b4fc] shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <span className="material-symbols-outlined text-sm">group</span>
          QUẢN LÝ
        </button>
        <button
          onClick={() => { playPopSound(); setActiveTab("bookings"); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === "bookings"
              ? "bg-white dark:bg-[#251f30] text-primary dark:text-[#a5b4fc] shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <span className="material-symbols-outlined text-sm">calendar_month</span>
          LỊCH ĐẶT
        </button>
        <button
          onClick={() => { playPopSound(); setActiveTab("partners"); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === "partners"
              ? "bg-white dark:bg-[#251f30] text-primary dark:text-[#a5b4fc] shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <span className="material-symbols-outlined text-sm">handshake</span>
          ĐỐI TÁC
        </button>
      </div>

      {/* TAB 1: USER BIO ACCOUNT MANAGEMENT */}
      {activeTab === "users" && (
        <div className="bg-white dark:bg-[#12111a] rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden animate-fadeIn">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#181622]/40 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-base">group</span>
              Quản Lý Tài Khoản Thành Viên ({users.length})
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Chỉ xem thông tin & đóng/mở khoá liên kết</span>
          </div>

          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-900/40 text-slate-450 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/70 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="px-6 py-4">Thành viên</th>
                    <th className="px-6 py-4">Đường dẫn Bio Link</th>
                    <th className="px-6 py-4">Thời hạn gói</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60">
                  {users.map((user) => {
                    const bioUrl = `${window.location.origin}/bio/${user.slug}`;
                    return (
                      <tr key={user._id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition-colors">
                        {/* Member identity */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#221b2b] overflow-hidden border border-slate-200 dark:border-slate-750 flex items-center justify-center shrink-0">
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="material-symbols-outlined text-slate-400 text-sm">person</span>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-white text-xs">{user.displayName}</div>
                              <div className="text-[10px] text-slate-400">{user.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Bio link */}
                        <td className="px-6 py-4 font-mono text-[11px]">
                          <div className="flex items-center gap-2">
                            <a 
                              href={bioUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-primary dark:text-[#a5b4fc] hover:underline font-semibold"
                            >
                              /bio/{user.slug}
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(bioUrl);
                                showNotification("Đã sao chép liên kết! 📋");
                              }}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                              title="Sao chép liên kết"
                            >
                              <span className="material-symbols-outlined text-xs">content_copy</span>
                            </button>
                          </div>
                        </td>

                        {/* Package expiration */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatExpiration(user.expiresAt)}
                        </td>

                        {/* Status badge */}
                        <td className="px-6 py-4">
                          {user.status === 'locked' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Bị khóa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Hoạt động
                            </span>
                          )}
                        </td>

                        {/* Status Toggle Lock & Deletion */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleToggleBioStatus(user._id, user.status)}
                              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all duration-200 ${
                                user.status === 'locked'
                                  ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm hover:scale-102"
                                  : "bg-rose-550 hover:bg-rose-600 text-white shadow-sm hover:scale-102"
                              }`}
                            >
                              {user.status === 'locked' ? "Mở khóa Link" : "Khóa Link"}
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTarget(user);
                                setConfirmPassword("");
                                setConfirmError("");
                              }}
                              className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 hover:scale-105 transition-transform"
                              title="Xóa tài khoản vĩnh viễn"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 italic">
              Chưa có tài khoản Bio thành viên nào được đăng ký.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BOOKING SCHEDULES */}
      {activeTab === "bookings" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white dark:bg-[#12111a] rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#181622]/40 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-base">calendar_month</span>
                  Quản Lý Lịch Hẹn Đặt Thiết Kế ({bookings.length})
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Liên hệ khách hàng & theo dõi trạng thái. Đã liên hệ tự động xóa sau 60 ngày.</p>
              </div>
            </div>

            {bookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/50 dark:bg-slate-900/40 text-slate-450 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/70 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="px-6 py-4 w-12 text-center">Liên hệ?</th>
                      <th className="px-6 py-4">Khách hàng</th>
                      <th className="px-6 py-4">Lời nhắn yêu cầu</th>
                      <th className="px-6 py-4">Ngày gửi</th>
                      <th className="px-6 py-4 text-center">Xóa bỏ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60">
                    {bookings.map((booking) => {
                      const contactedDaysLeft = getAutoDeleteDays(booking);
                      return (
                        <tr 
                          key={booking._id} 
                          className={`transition-all duration-300 ${
                            booking.contacted 
                              ? "opacity-50 bg-slate-50/50 dark:bg-[#181622]/10" 
                              : "hover:bg-slate-50/30 dark:hover:bg-slate-900/10"
                          }`}
                        >
                          {/* Checkbox contacted */}
                          <td className="px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={booking.contacted || false}
                              onChange={() => handleToggleBookingContacted(booking._id, booking.contacted)}
                              className="w-4.5 h-4.5 rounded border-slate-350 dark:border-slate-800 text-primary focus:ring-primary focus:ring-2 cursor-pointer transition-colors"
                            />
                          </td>

                          {/* Contact Info */}
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="font-bold text-slate-850 dark:text-slate-100">{booking.fullName}</div>
                              <div className="font-semibold text-slate-600 dark:text-slate-300 select-all">{booking.phone}</div>
                              <div className="text-[10px] text-slate-400 select-all">{booking.email}</div>
                              
                              {/* Auto delete alert badge */}
                              {booking.contacted && contactedDaysLeft !== null && (
                                <div className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 px-2 py-0.5 rounded-full mt-1.5">
                                  <span className="material-symbols-outlined text-[10px] animate-pulse">auto_delete</span>
                                  Tự xóa sau {contactedDaysLeft} ngày
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Request Message */}
                          <td className="px-6 py-4 max-w-sm">
                            <p className="text-slate-650 dark:text-slate-300 leading-relaxed font-medium line-clamp-4 whitespace-pre-wrap select-text">
                              {booking.message || <span className="italic text-slate-400">Không có lời nhắn</span>}
                            </p>
                          </td>

                          {/* Submitted At */}
                          <td className="px-6 py-4 whitespace-nowrap text-slate-450 dark:text-slate-400">
                            {new Date(booking.createdAt).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>

                          {/* Delete Immediately */}
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleDeleteBooking(booking._id)}
                              className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 p-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                              title="Xóa ngay lập tức"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 italic">
                Không có khách hàng nào đặt lịch hẹn.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PARTNER MANAGER */}
      {activeTab === "partners" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
          
          {/* Left panel: Add partner form */}
          <div className="lg:col-span-4 bg-white dark:bg-[#12111a] rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-5">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-base">add_link</span>
              Thêm Đối Tác Mới
            </h3>
            
            <form onSubmit={handleAddPartner} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tên Đối Tác:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: VNPAY, Minh Oi Media..."
                  value={partnerForm.name}
                  onChange={(e) => setPartnerForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Website / Ghi Chú Đối Tác:</label>
                <textarea
                  rows="5"
                  required
                  placeholder="Ví dụ: https://doitac.vn hoặc ghi chú nơi đối tác sẽ nhúng iframe"
                  value={partnerForm.iframeUrl}
                  onChange={(e) => setPartnerForm(p => ({ ...p, iframeUrl: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-mono leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="submit"
                  value="save"
                  className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs py-3 rounded-xl transition-colors border border-slate-200 dark:border-slate-750"
                >
                  Liên Kết
                </button>
                <button
                  type="submit"
                  value="export-iframe"
                  className="w-full bg-primary hover:bg-indigo-650 text-white font-bold text-xs py-3 rounded-xl hover:scale-102 transition-transform shadow-md flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">iframe</span>
                  Tạo & Xuất Iframe
                </button>
              </div>
            </form>
          </div>

          {/* Right panel: Active partner list & iframe preview */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* List */}
            <div className="bg-white dark:bg-[#12111a] rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col justify-between min-h-[350px]">
              
              {/* Header with Search */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#181622]/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-base">handshake</span>
                  Danh Sách Đối Tác ({partners.length})
                </h3>
                
                {/* Real-time search */}
                <div className="w-full sm:w-56 relative shrink-0">
                  <input
                    type="text"
                    placeholder="Tìm đối tác..."
                    value={partnerSearch}
                    onChange={(e) => { setPartnerSearch(e.target.value); setPartnerPage(1); }}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#1c1626] text-[11px] py-1.5 pl-8 pr-3 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                  />
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">search</span>
                </div>
              </div>

              {/* Items List */}
              {paginatedPartners.length > 0 ? (
                <div className="divide-y divide-slate-150 dark:divide-slate-800/60 flex-grow">
                  {paginatedPartners.map((partner) => {
                    const iconUrl = getFaviconUrl(partner.iframeUrl);
                    return (
                      <div key={partner._id} className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Logo from Favicon */}
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1f1929] border border-slate-200/50 dark:border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                            {iconUrl ? (
                              <img 
                                src={iconUrl} 
                                alt="" 
                                onError={(e) => { e.target.style.display = 'none'; }}
                                className="w-5 h-5 object-contain" 
                              />
                            ) : (
                              <span className="material-symbols-outlined text-slate-400 text-lg">link</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-800 dark:text-white text-xs truncate">{partner.name}</h4>
                            <p className="text-[10px] text-slate-450 truncate max-w-sm font-mono mt-0.5">{partner.iframeUrl}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setExportPartner(partner)}
                            className="bg-primary hover:bg-indigo-650 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors"
                          >
                            Xuất Iframe
                          </button>
                          <button
                            onClick={() => setExportLinkPartner(partner)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors"
                          >
                            Xuất Link
                          </button>
                          <button
                            onClick={() => setPreviewPartner(partner)}
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px] px-3.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-750 transition-colors"
                          >
                            Xem Thử
                          </button>
                          <button
                            onClick={() => handleDeletePartner(partner._id)}
                            className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 p-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                            title="Xóa đối tác"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 flex-grow flex items-center justify-center">
                  {partnerSearch ? (
                    <p className="italic">Không tìm thấy đối tác phù hợp.</p>
                  ) : (
                    <div className="space-y-2 max-w-sm">
                      <p className="font-bold text-slate-500 dark:text-slate-350 not-italic">Chưa có đối tác liên kết dịch vụ nào.</p>
                      <p className="text-[11px] leading-relaxed">
                        Nhập thông tin ở khung bên trái rồi bấm <strong>Tạo & Xuất Iframe</strong> để lấy mã nhúng ngay.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination bar */}
              {totalPartnerPages > 1 && (
                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/10 border-t border-slate-150 dark:border-slate-800/60 flex items-center justify-between text-xs font-bold text-slate-500 shrink-0">
                  <span>Trang {partnerPage} / {totalPartnerPages}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPartnerPage(p => Math.max(p - 1, 1))}
                      disabled={partnerPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161420] text-slate-700 dark:text-slate-350 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      Trước
                    </button>
                    <button
                      onClick={() => setPartnerPage(p => Math.min(p + 1, totalPartnerPages))}
                      disabled={partnerPage === totalPartnerPages}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161420] text-slate-700 dark:text-slate-350 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Preview modal drawer */}
            {previewPartner && (
              <div className="bg-white dark:bg-[#12111a] rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-sm">visibility</span>
                    Xem trước Iframe: {previewPartner.name}
                  </h4>
                  <button 
                    onClick={() => setPreviewPartner(null)}
                    className="text-slate-400 hover:text-slate-650 dark:hover:text-white"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>

                <div className="w-full bg-slate-50 dark:bg-[#1f1929] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800/80 min-h-[350px] relative z-10 flex">
                  {previewPartner.iframeUrl.includes('<iframe') ? (
                    <div 
                      className="w-full h-full min-h-[350px] flex [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:min-h-[350px]"
                      dangerouslySetInnerHTML={{ __html: previewPartner.iframeUrl }}
                    />
                  ) : (
                    <iframe
                      src={previewPartner.iframeUrl}
                      className="w-full h-full min-h-[350px] flex-grow"
                      style={{ border: 'none' }}
                      allowFullScreen
                    />
                  )}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#12111a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-slate-850 dark:text-slate-200">
              <span className="material-symbols-outlined text-2xl animate-pulse text-slate-500 dark:text-slate-400">warning</span>
              <h3 className="font-extrabold text-sm uppercase tracking-wider">Xác Nhận Xóa Tài Khoản</h3>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Bạn đang yêu cầu xóa vĩnh viễn tài khoản của thành viên <strong>{deleteTarget.displayName}</strong> ({deleteTarget.email}) cùng trang Bio <code>/bio/{deleteTarget.slug}</code>.
            </p>
            <div className="text-xs text-red-650 bg-red-50 dark:bg-red-950/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
              ⚠️ Hành động này KHÔNG THỂ HOÀN TÁC và toàn bộ thông tin sẽ bị xóa sạch khỏi hệ thống.
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-[9px] font-bold text-slate-450 dark:text-slate-405 uppercase tracking-wider">Nhập Mật Khẩu Quản Trị:</label>
              <input
                type="password"
                placeholder="Nhập mật khẩu admin..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleExecuteDelete(); }}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
              />
              {confirmError && (
                <p className="text-[10px] text-rose-500 font-bold mt-1">{confirmError}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setDeleteTarget(null);
                  setConfirmPassword("");
                  setConfirmError("");
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs py-3 rounded-xl transition-all"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleExecuteDelete}
                className="flex-1 bg-red-600 hover:bg-red-550 text-white font-bold text-xs py-3 rounded-xl hover:scale-102 transition-transform shadow-md"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT DIRECT PARTNER LINK MODAL */}
      {exportLinkPartner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#12111a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <span className="material-symbols-outlined text-xl">link</span>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-white">Xuất Link Đối Tác: {exportLinkPartner.name}</h3>
              </div>
              <button 
                onClick={() => setExportLinkPartner(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                Link này dùng để đặt nút, menu hoặc đường dẫn trực tiếp trên website của đối tác. Khách hàng bấm vào là có thể nhập email và tạo Bio Link miễn phí ngay, không cần đăng nhập vào hệ thống Hugo Studio.
              </p>

              <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30 space-y-2">
                <span className="block text-[9px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Link dùng ngay cho khách hàng:</span>
                <textarea
                  readOnly
                  rows={3}
                  className="w-full bg-white dark:bg-black/40 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-3 text-[10px] font-mono text-slate-700 dark:text-emerald-200 focus:outline-none resize-none"
                  value={getPartnerBioEditorUrl(exportLinkPartner)}
                />
              </div>

              <div className="bg-slate-50 dark:bg-[#1f1929] p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Nếu website đối tác đã có email khách hàng, có thể tự động truyền thêm tham số: <code>{`${getPartnerBioEditorUrl(exportLinkPartner)}&email=EMAIL_KHACH_HANG`}</code>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setExportLinkPartner(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs py-3 rounded-xl transition-all"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  const link = getPartnerBioEditorUrl(exportLinkPartner);
                  navigator.clipboard.writeText(link);
                  showNotification(`Đã sao chép link đối tác ${exportLinkPartner.name}! 📋`);
                  setExportLinkPartner(null);
                }}
                className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl hover:scale-102 transition-transform shadow-md"
              >
                Sao Chép Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT IFRAME PARTNER MODAL */}
      {exportPartner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#12111a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <span className="material-symbols-outlined text-xl">share</span>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-white">Xuất Iframe Đối Tác: {exportPartner.name}</h3>
              </div>
              <button 
                onClick={() => setExportPartner(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                Nhúng trình thiết kế Bio miễn phí của <strong>Hugo Studio</strong> trực tiếp vào website của đối tác. Khi người dùng của đối tác truy cập, hệ thống sẽ sử dụng email được truyền qua tham số <code>email</code> để lưu và hiển thị thông tin mà không cần đăng nhập.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-indigo-50/70 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                  <span className="block text-[9px] font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-wider">Link iframe dùng ngay:</span>
                  <p className="mt-1 text-[10px] font-mono text-slate-600 dark:text-slate-300 break-all">
                    {getPartnerBioEditorUrl(exportPartner)}
                  </p>
                </div>
                <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                  <span className="block text-[9px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Tùy chọn tự động:</span>
                  <p className="mt-1 text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Có thể thêm <code>&email=EMAIL_KHACH_HANG</code> nếu đối tác muốn tự truyền email người dùng.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-[#1f1929] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2">
                <span className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">Mã nhúng Iframe đề xuất:</span>
                <textarea
                  readOnly
                  rows={4}
                  className="w-full bg-slate-100 dark:bg-black/40 border border-slate-250 dark:border-slate-800 rounded-xl p-3 text-[10px] font-mono text-indigo-600 dark:text-[#a5b4fc] focus:outline-none resize-none"
                  value={getPartnerBioIframeCode(exportPartner)}
                />
              </div>

              <div className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl space-y-1 leading-relaxed">
                <p className="font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">info</span>
                  Hướng dẫn nhúng cho đối tác:
                </p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Dán nguyên mã iframe vào website của đối tác để khách hàng dùng ngay.</li>
                  <li>Khi chưa truyền email, giao diện iframe sẽ yêu cầu khách hàng nhập email trước khi tạo Bio Link.</li>
                  <li>Nếu đối tác đã có email khách hàng, thêm <code>&email=EMAIL_KHACH_HANG</code> vào link iframe để vào thẳng trình tạo Bio.</li>
                </ol>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setExportPartner(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs py-3 rounded-xl transition-all"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  const code = getPartnerBioIframeCode(exportPartner);
                  navigator.clipboard.writeText(code);
                  showNotification(`Đã sao chép mã nhúng Iframe đối tác ${exportPartner.name}! 📋`);
                  setExportPartner(null);
                }}
                className="flex-grow bg-primary hover:bg-indigo-650 text-white font-bold text-xs py-3 rounded-xl hover:scale-102 transition-transform shadow-md"
              >
                Sao Chép Mã Nhúng
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
