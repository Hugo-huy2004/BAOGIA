import { useState, useEffect, useCallback } from "react";
import useVisiblePoll from "../../hooks/useVisiblePoll";
import { useTranslation } from "react-i18next";
import { userApi } from "../../services/api/UserApi";
import { useData } from "../../context/DataContext";
import { dataApi } from "../../services/dataApi";
import { getAdminSession, logoutAuth } from "../../services/authSession";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminCommandPalette from "../../components/admin/AdminCommandPalette";
import AdminDashboard, { SosOverlay } from "../../components/admin/AdminDashboard";
import AdminUsersTab from "../../components/admin/AdminUsersTab";
import AdminSystemTab from "../../components/admin/AdminSystemTab";
import AdminContactSupportTab from "../../components/admin/AdminContactSupportTab";
import AdminServicesTab from "../../components/admin/AdminServicesTab";
import AdminUtilityStoreTab from "../../components/admin/AdminUtilityStoreTab";
import AdminProjectsTab from "../../components/admin/AdminProjectsTab";
import AdminHugoTeamTab from "../../components/admin/AdminHugoTeamTab";
import AdminCoderSubmissionsTab from "../../components/admin/AdminCoderSubmissionsTab";
import AdminCoderResourcesTab from "../../components/admin/AdminCoderResourcesTab";
import AdminLearnersTab from "../../components/admin/AdminLearnersTab";
import AdminSettingsTab from "../../components/admin/AdminSettingsTab";
import AdminBrainTab from "../../components/admin/AdminBrainTab";
import AdminAuditLogTab from "../../components/admin/AdminAuditLogTab";
import AdminCinemaTab from "../../components/admin/AdminCinemaTab";
import AdminSecuritySentinelTab from "../../components/admin/AdminSecuritySentinelTab";
import AdminRobotTab from "../../components/admin/AdminRobotTab";
import AdminOAuthAppsTab from "../../components/admin/AdminOAuthAppsTab";
import AdminAIWorkforceTab from "../../components/admin/AdminAIWorkforceTab";
import AISupportBriefingModal from "../../components/admin/AISupportBriefingModal";

function HugoNoticeToast({ open, type, message, zIndex = 150 }) {
  if (!open) return null;
  return (
    <div
      className="fixed bottom-6 right-6 px-5 py-3 rounded-2xl bg-[#141633] text-white border border-white/20 shadow-2xl flex items-center gap-3 animate-fadeIn text-xs font-bold"
      style={{ zIndex }}
    >
      <span className="material-symbols-outlined text-emerald-400">check_circle</span>
      <span>{message}</span>
    </div>
  );
}

export default function AdminPanel() {
  const { t } = useTranslation();
  // Lấy thẳng từ DataContext. Trước đây nhận qua prop, nhưng App.jsx render
  // <AdminPanel /> không kèm prop nào — nên `data` là undefined và mọi công
  // tắc trong tab Cài đặt ném "updateSystemSettings is not a function".
  const { data = {}, updateSystemSettings = () => {}, updateAdvertisement = () => {} } = useData() || {};
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const initial = params.get("tab");
    if (!initial) return "dashboard";
    if (["brain", "workforce", "sentinel", "robot"].includes(initial)) return "ai_sentinel";
    if (["cinema", "coder"].includes(initial)) return "ecosystem";
    if (["oauth", "projects"].includes(initial)) return "system";
    if (["audit"].includes(initial)) return "dashboard";
    return initial;
  });
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Sub-view Tab States for Consolidated 5 Multi-Purpose Hubs
  const [dashSubView, setDashSubView]   = useState("overview");   // overview | audit
  const [aiSubView, setAiSubView]       = useState("brain");      // brain | workforce | sentinel | robot
  const [userSubView, setUserSubView]   = useState("roster");     // roster | support | hugoteam
  const [ecoSubView, setEcoSubView]     = useState("store");      // store | services | cinema | coder
  const [coderSubView, setCoderSubView] = useState("submissions");// submissions | resources | learners
  const [systemSubView, setSystemSubView] = useState("settings"); // settings | oauth | monitor | projects

  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Telegram deep-link: auto-activate robot tab + pass token
  const [robotDeepLinkToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("robotToken") || "";
  });
  const [loginLoading, setLoginLoading] = useState(false);

  // Counts & Stats
  const [counts, setCounts] = useState({
    users: 0,
    contactSupport: 0,
    utilityStore: 0,
    projects: 0,
    openTickets: 0,
    totalProjects: 0,
    packages: 0
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Crisis Alerts
  const [crisisAlerts, setCrisisAlerts] = useState([]);
  // Cảnh báo khủng hoảng là tính năng AN TOÀN — vẫn giữ nhịp 15 giây, chỉ bỏ
  // phần chạy lúc tab bị ẩn (admin có nhìn đâu mà cảnh báo). Quay lại tab là
  // nạp ngay, nên thời gian admin thực sự biết tin không chậm đi chút nào.
  const fetchCrisisAlerts = useCallback(() => {
    const apiBase = import.meta.env.VITE_API_URL || "/api";
    const headers = {};
    const session = getAdminSession();
    if (session && session.token) {
      headers["Authorization"] = `Bearer ${session.token}`;
    }
    fetch(`${apiBase}/companion/admin/crisis-alerts`, { headers, credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => setCrisisAlerts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useVisiblePoll(fetchCrisisAlerts, 15000);

  // Admin Super Security Armor: F12 / DevTools Inspection Trap
  useEffect(() => {
    if (import.meta.env.DEV) return;
    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' ||
        (e.metaKey && e.altKey && (e.key === 'i' || e.key === 'I' || e.key === 'j' || e.key === 'J' || e.key === 'c' || e.key === 'C')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResolveCrisisAlert = (alert) => {
    const apiBase = import.meta.env.VITE_API_URL || "/api";
    const headers = { "Content-Type": "application/json" };
    const session = getAdminSession();
    if (session && session.token) {
      headers["Authorization"] = `Bearer ${session.token}`;
    }
    fetch(`${apiBase}/companion/crisis/resolve`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ email: alert.email, flagId: alert.flagId })
    })
      .then(() => setCrisisAlerts(prev => prev.filter(a => a.flagId !== alert.flagId)))
      .catch(() => {});
  };

  // AI Support Proactive Briefing State
  const [aiBriefingModalOpen, setAiBriefingModalOpen] = useState(false);
  const [aiBriefingData, setAiBriefingData] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      const apiBase = import.meta.env.VITE_API_URL || "/api";
      fetch(`${apiBase}/admin/ai-support/briefing`, { credentials: "include" })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.success && data.hasBriefing) {
            setAiBriefingData(data);
            setAiBriefingModalOpen(true);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleCloseAiBriefing = () => {
    setAiBriefingModalOpen(false);
    const apiBase = import.meta.env.VITE_API_URL || "/api";
    fetch(`${apiBase}/admin/ai-support/mark-read`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" }
    }).catch(() => {});
  };

  // Users State
  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expirationFilter, setExpirationFilter] = useState("");
  const [userSortBy, setUserSortBy] = useState("createdAt");
  const [userSortOrder, setUserSortOrder] = useState("desc");
  const [userPage, setUserPage] = useState(1);
  const [userLimit, setUserLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMatchedUsers, setTotalMatchedUsers] = useState(0);
  const [userStats, setUserStats] = useState({ total: 0, active: 0, pending: 0, rejected: 0, locked: 0, lifetime: 0, locationAnomaly: 0 });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [copiedUserId, setCopiedUserId] = useState(null);

  // Toast State
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");
  const [uploadingAd, setUploadingAd] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: "", onConfirm: null });

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
    } catch {}
  };

  const showNotification = (msg, type = "success") => {
    playPopSound();
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // Ảnh banner quảng cáo. Hai hàm này trước giờ chỉ là tên prop rỗng — không có
  // định nghĩa ở bất kỳ đâu trong repo, nên ô chọn ảnh và nút xoá là nút chết.
  const handleAdImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingAd(true);
    try {
      const base64Str = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      // Truyền ảnh cũ để Cloudinary xoá bản cũ thay vì để lại rác.
      const { url } = await dataApi.uploadImage(base64Str, data?.advertisement?.imageUrl || null);
      await updateAdvertisement({ imageUrl: url });
      showNotification(t("adminTabs.settings.adUpload"));
    } catch {
      showNotification("Tải ảnh quảng cáo thất bại.", "error");
    } finally {
      setUploadingAd(false);
      event.target.value = "";
    }
  };

  const handleAdDelete = async () => {
    const url = data?.advertisement?.imageUrl;
    // Tắt luôn quảng cáo: giữ isActive khi đã mất ảnh là banner rỗng trên trang.
    await updateAdvertisement({ imageUrl: "", isActive: false });
    if (url) {
      try {
        await dataApi.delete("/api/data/delete-ad", { body: JSON.stringify({ url }) });
      } catch { /* ảnh đã rời khỏi trang; dọn Cloudinary lỗi thì bỏ qua */ }
    }
  };

  const triggerConfirm = (message, onConfirm) => {
    setConfirmModal({ isOpen: true, message, onConfirm });
  };

  const handleLogout = () => {
    logoutAuth();
    window.location.href = "/login";
  };

  // Fetch Overview Counts for Dashboard Stats
  const fetchOverviewCounts = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || "/api";
      const [ticketsRes, packagesRes, projectsRes] = await Promise.allSettled([
        fetch(`${apiBase}/support/tickets?status=pending`, { credentials: "include" }).then(r => r.ok ? r.json() : {}),
        fetch(`${apiBase}/packages`, { credentials: "include" }).then(r => r.ok ? r.json() : []),
        fetch(`${apiBase}/customer-projects`, { credentials: "include" }).then(r => r.ok ? r.json() : [])
      ]);

      const openTickets = ticketsRes.status === "fulfilled" ? (ticketsRes.value?.pendingCount ?? ticketsRes.value?.pagination?.total ?? 0) : 0;
      const packagesCount = packagesRes.status === "fulfilled" && Array.isArray(packagesRes.value) ? packagesRes.value.length : 0;
      const projectsCount = projectsRes.status === "fulfilled" && Array.isArray(projectsRes.value) ? projectsRes.value.length : 0;

      setCounts(prev => ({
        ...prev,
        openTickets,
        contactSupport: openTickets,
        packages: packagesCount,
        totalProjects: projectsCount,
        projects: projectsCount
      }));
    } catch {}
  };

  // Fetch Users
  const handleRefreshUsers = async () => {
    setLoading(true);
    try {
      const res = await userApi.getBios({
        search: searchQuery,
        status: statusFilter,
        expiration: expirationFilter,
        sortBy: userSortBy,
        sortOrder: userSortOrder,
        page: userPage,
        limit: userLimit
      });

      if (res && res.bios) {
        setUsers(res.bios);
        const pages = res.pagination?.pages || res.pagination?.totalPages || 1;
        const total = res.pagination?.totalMatched ?? res.pagination?.total ?? res.bios.length;
        setTotalPages(pages);
        setTotalMatchedUsers(total);
        if (res.stats) setUserStats(res.stats);
        setCounts(prev => ({ ...prev, users: res.stats?.total || total }));
      }
    } catch (e) {
      console.error("Error fetching users:", e);
    } finally {
      setLoading(false);
    }
  };

  // Debounce searchInput -> searchQuery
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setUserPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const session = getAdminSession();
    if (session) {
      setIsAuthenticated(true);
      if (session.token) {
        setAdminToken(session.token);
      }
    }
    setAuthChecking(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      handleRefreshUsers();
      fetchOverviewCounts();
    }
  }, [searchQuery, statusFilter, expirationFilter, userSortBy, userSortOrder, userPage, userLimit, isAuthenticated]);

  const handleExecuteDelete = async () => {
    setConfirmError("");
    if (!confirmPassword) return setConfirmError(t("admin.texts.txt_139", "Vui lòng nhập mật khẩu xác nhận"));

    try {
      await userApi.deleteBio(deleteTarget._id);
      showNotification(`Đã xóa vĩnh viễn tài khoản của ${deleteTarget.displayName}! 🗑️`);
      setUsers(prev => prev.filter(u => u._id !== deleteTarget._id));
      setDeleteTarget(null);
      setConfirmPassword("");
      handleRefreshUsers();
    } catch {
      setConfirmError(t("admin.texts.txt_142", "Mật khẩu Admin không đúng hoặc lỗi hệ thống"));
    }
  };

  const handleCopyText = (text, userId) => {
    navigator.clipboard.writeText(text);
    setCopiedUserId(userId);
    showNotification(t("admin.texts.txt_137", "Đã sao chép vào bộ nhớ tạm"));
    setTimeout(() => setCopiedUserId(null), 2000);
  };

  const getExpirationDaysOnly = (expiresAt) => {
    if (!expiresAt) return 0;
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const expDate = new Date(expiresAt);
    expDate.setHours(0, 0, 0, 0);
    return Math.ceil((expDate - todayMidnight) / (1000 * 60 * 60 * 24));
  };

  const formatExpiration = (expiresAt) => {
    if (!expiresAt) return "Vĩnh viễn";
    const days = getExpirationDaysOnly(expiresAt);
    if (days < 0) return "Đã hết hạn";
    if (days === 0) return "Hôm nay";
    return `Còn ${days} ngày`;
  };

  const loadMoreUsers = () => {
    if (userPage < totalPages) setUserPage(prev => prev + 1);
  };

  // Star-VIP là hạng danh dự do người quyết định; Star-14/Star-18 tự suy ra từ
  // ngày sinh nên không có nút nào sửa được.
  const handleToggleVip = async (bioId, currentVip) => {
    try {
      await userApi.setVip(bioId, !currentVip);
      setUsers(prev => prev.map(u => u._id === bioId ? { ...u, starVip: !currentVip } : u));
      showNotification(!currentVip ? "Đã gắn hạng Star-VIP!" : "Đã gỡ hạng Star-VIP.");
    } catch {
      showNotification("Lỗi cập nhật hạng thành viên", "error");
    }
  };

  const handleToggleBioStatus = async (bioId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "locked" : "active";
    try {
      await userApi.updateStatus(bioId, newStatus);
      setUsers(prev => prev.map(u => u._id === bioId ? { ...u, status: newStatus } : u));
      showNotification(`Đã ${newStatus === "active" ? "mở khóa" : "khóa"} thành viên!`);
    } catch {
      showNotification("Lỗi cập nhật trạng thái", "error");
    }
  };

  if (authChecking) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center text-foreground">
        <span className="material-symbols-outlined animate-spin text-3xl">refresh</span>
      </div>
    );
  }

  return (
    <div
      className="h-[100dvh] min-h-[100dvh] bg-background text-foreground flex flex-col md:flex-row overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <SosOverlay alerts={crisisAlerts} />
      <HugoNoticeToast open={Boolean(toastMsg)} type={toastType || "info"} message={toastMsg} zIndex={150} />

      {/* CONFIRM MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} />
          <div className="bg-card rounded-2xl p-6 w-full max-w-md relative z-10 shadow-2xl border border-border animate-toast-in">
            <h3 className="text-lg font-black text-foreground mb-3">{t("admin.texts.txt_226", "Xác nhận hành động")}</h3>
            <p className="text-sm text-muted-foreground mb-6 font-medium leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="px-5 py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-muted transition-colors active:scale-95"
              >
                {t("admin.texts.txt_227", "Hủy bỏ")}
              </button>
              <button 
                onClick={() => {
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                className="px-5 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                {t("admin.texts.txt_228", "Đồng ý")}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* DELETE USER MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setDeleteTarget(null); setConfirmError(""); setConfirmPassword(""); }} />
          <div className="bg-card rounded-2xl p-6 w-full max-w-md relative z-10 shadow-2xl border border-destructive/30 animate-toast-in">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <h3 className="text-lg font-black text-foreground mb-2">{t("admin.texts.txt_229", "Xóa vĩnh viễn tài khoản")}</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed font-medium">
              Bạn sắp xóa vĩnh viễn tài khoản <span className="text-foreground font-bold">{deleteTarget.email}</span>. Hành động này <strong className="text-destructive">không thể hoàn tác</strong>. Mọi dữ liệu của người dùng này sẽ bị xóa khỏi cơ sở dữ liệu.
            </p>
            <div className="mb-6 space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("admin.texts.txt_230", "Nhập mật khẩu Admin để xác nhận")}</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setConfirmError(""); }}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-destructive focus:ring-1 focus:ring-destructive transition-all"
                placeholder={t("admin.texts.txt_231", "Mật khẩu Admin...")}
              />
              {confirmError && <p className="text-xs text-destructive font-bold mt-1 animate-fadeIn">{confirmError}</p>}
            </div>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => { setDeleteTarget(null); setConfirmError(""); setConfirmPassword(""); }}
                className="px-5 py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-muted transition-colors active:scale-95"
              >
                {t("admin.texts.txt_227", "Hủy bỏ")}
              </button>
              <button 
                onClick={handleExecuteDelete}
                className="px-5 py-2.5 rounded-xl font-bold bg-destructive text-white hover:bg-destructive/90 shadow-[0_4px_12px_rgba(239,68,68,0.25)] transition-all active:scale-95"
              >
                {t("admin.texts.txt_232", "Xóa Vĩnh Viễn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
        counts={counts}
      />

      {/* MAIN WORKSPACE WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Top Header with ⌘K Command Search Bar */}
        <AdminHeader
          onOpenPalette={() => setIsPaletteOpen(true)}
          usersCount={totalMatchedUsers || users.length}
        />

        {/* ⌘K Command Palette Modal */}
        <AdminCommandPalette
          isOpen={isPaletteOpen}
          onOpen={() => setIsPaletteOpen(true)}
          onClose={() => setIsPaletteOpen(false)}
          users={users}
          onNavigateTab={(tab) => { setActiveTab(tab); setIsPaletteOpen(false); }}
        />

        {/* MAIN WORKSPACE CONTENT */}
        <section className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)] relative min-h-0">
        
        {/* ── HUB 1: DASHBOARD & COMMAND ANALYTICS ── */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 w-fit backdrop-blur-xl shadow-inner">
              <button
                onClick={() => setDashSubView("overview")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${dashSubView === "overview" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
              >
                <span className="material-symbols-outlined text-sm">dashboard</span>
                <span>Tổng quan</span>
              </button>
              <button
                onClick={() => setDashSubView("audit")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${dashSubView === "audit" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
              >
                <span className="material-symbols-outlined text-sm">history_edu</span>
                <span>Nhật ký Kiểm toán</span>
              </button>
            </div>

            {dashSubView === "overview" && (
              <AdminDashboard
                stats={userStats}
                bookings={recentBookings}
                totalProjects={counts.totalProjects}
                totalPackages={counts.packages}
                openTickets={counts.openTickets}
                loading={loading}
                crisisAlerts={crisisAlerts}
                onResolveCrisisAlert={handleResolveCrisisAlert}
              />
            )}
            {dashSubView === "audit" && <AdminAuditLogTab />}
          </div>
        )}

        {/* ── HUB 2: AI INTELLIGENCE & SECURITY SENTINEL ── */}
        {activeTab === "ai_sentinel" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 w-fit backdrop-blur-xl shadow-inner">
              <button
                onClick={() => setAiSubView("brain")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${aiSubView === "brain" ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 scale-[1.02]" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
              >
                <span className="material-symbols-outlined text-sm">psychology</span>
                <span>Bộ não AI</span>
              </button>
              <button
                onClick={() => setAiSubView("workforce")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${aiSubView === "workforce" ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 scale-[1.02]" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
              >
                <span className="material-symbols-outlined text-sm">groups</span>
                <span>Đội ngũ AI</span>
              </button>
              <button
                onClick={() => setAiSubView("sentinel")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${aiSubView === "sentinel" ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 scale-[1.02]" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
              >
                <span className="material-symbols-outlined text-sm">shield_person</span>
                <span>BOT Security Sentinel</span>
              </button>
              <button
                onClick={() => setAiSubView("robot")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${aiSubView === "robot" ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 scale-[1.02]" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
              >
                <span className="material-symbols-outlined text-sm">precision_manufacturing</span>
                <span>Robot &amp; Security Cam</span>
              </button>
            </div>

            {aiSubView === "brain" && <AdminBrainTab />}
            {aiSubView === "workforce" && <AdminAIWorkforceTab />}
            {aiSubView === "sentinel" && (
              <AdminSecuritySentinelTab
                token={adminToken}
                onShowToast={(msg) => showNotification(msg)}
              />
            )}
            {aiSubView === "robot" && <AdminRobotTab deepLinkToken={robotDeepLinkToken} />}
          </div>
        )}

        {/* ── HUB 3: SMART USER & SUPPORT HUB ── */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 w-fit backdrop-blur-xl shadow-inner">
              <button
                onClick={() => setUserSubView("roster")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${userSubView === "roster" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.02]" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
              >
                <span className="material-symbols-outlined text-sm">group</span>
                <span>Thành viên ({totalMatchedUsers.toLocaleString()})</span>
              </button>
              <button
                onClick={() => setUserSubView("support")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${userSubView === "support" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.02]" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
              >
                <span className="material-symbols-outlined text-sm">support_agent</span>
                <span>Hỗ trợ &amp; Tickets</span>
              </button>
              <button
                onClick={() => setUserSubView("hugoteam")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${userSubView === "hugoteam" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.02]" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
              >
                <span className="material-symbols-outlined text-sm">badge</span>
                <span>Tuyển Dụng Hugo Team</span>
              </button>
            </div>

            {userSubView === "roster" && (
              <AdminUsersTab
                userStats={userStats} searchInput={searchInput} setSearchInput={setSearchInput}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter} setUserPage={setUserPage}
                expirationFilter={expirationFilter} setExpirationFilter={setExpirationFilter}
                userSortBy={userSortBy} setUserSortBy={setUserSortBy} userSortOrder={userSortOrder}
                setUserSortOrder={setUserSortOrder} userLimit={userLimit} setUserLimit={setUserLimit}
                totalMatchedUsers={totalMatchedUsers} users={users} handleCopyText={handleCopyText}
                copiedUserId={copiedUserId} handleToggleBioStatus={handleToggleBioStatus}
                handleToggleVip={handleToggleVip}
                triggerConfirm={triggerConfirm} setDeleteTarget={setDeleteTarget}
                userPage={userPage} totalPages={totalPages} searchQuery={searchQuery}
                getExpirationDaysOnly={getExpirationDaysOnly} formatExpiration={formatExpiration}
                loadMoreUsers={loadMoreUsers} hasMoreUsers={userPage < totalPages}
              />
            )}
            {userSubView === "support" && (
              <AdminContactSupportTab showNotification={showNotification} triggerConfirm={triggerConfirm} />
            )}
            {userSubView === "hugoteam" && (
              <AdminHugoTeamTab />
            )}
          </div>
        )}

        {/* ── HUB 4: ECOSYSTEM & MEDIA STUDIO HUB ── */}
        {activeTab === "ecosystem" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 w-fit backdrop-blur-xl shadow-inner">
              <button
                onClick={() => setEcoSubView("store")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${ecoSubView === "store" ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-[1.02]" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
              >
                <span className="material-symbols-outlined text-sm">shopping_bag</span>
                <span>Cửa Hàng Utility</span>
              </button>
              <button
                onClick={() => setEcoSubView("services")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${ecoSubView === "services" ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-[1.02]" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
              >
                <span className="material-symbols-outlined text-sm">card_membership</span>
                <span>Dịch Vụ &amp; Gói VIP</span>
              </button>
              <button
                onClick={() => setEcoSubView("cinema")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${ecoSubView === "cinema" ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-[1.02]" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
              >
                <span className="material-symbols-outlined text-sm">movie</span>
                <span>Quản Trị Phim Cinema</span>
              </button>
              <button
                onClick={() => setEcoSubView("coder")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${ecoSubView === "coder" ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-[1.02]" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
              >
                <span className="material-symbols-outlined text-sm">school</span>
                <span>Study &amp; Coder Hub</span>
              </button>
            </div>

            {ecoSubView === "store" && <AdminUtilityStoreTab />}
            {ecoSubView === "services" && <AdminServicesTab triggerConfirm={triggerConfirm} />}
            {ecoSubView === "cinema" && <AdminCinemaTab showNotice={showNotification} />}
            {ecoSubView === "coder" && (
              <div className="space-y-6">
                <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 w-fit">
                  <button
                    onClick={() => setCoderSubView("submissions")}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${coderSubView === "submissions" ? "bg-amber-600 text-white" : "text-slate-500 dark:text-slate-400"}`}
                  >
                    Bài Nộp Đồ Án
                  </button>
                  <button
                    onClick={() => setCoderSubView("resources")}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${coderSubView === "resources" ? "bg-amber-600 text-white" : "text-slate-500 dark:text-slate-400"}`}
                  >
                    Học Liệu &amp; Video
                  </button>
                  <button
                    onClick={() => setCoderSubView("learners")}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${coderSubView === "learners" ? "bg-amber-600 text-white" : "text-slate-500 dark:text-slate-400"}`}
                  >
                    Người Học
                  </button>
                </div>
                {coderSubView === "submissions" && <AdminCoderSubmissionsTab />}
                {coderSubView === "resources" && <AdminCoderResourcesTab />}
                {coderSubView === "learners" && <AdminLearnersTab />}
              </div>
            )}
          </div>
        )}

        {/* ── HUB 5: SECURITY SENTINEL & SYSTEM CONFIG ── */}
        {activeTab === "system" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 w-fit backdrop-blur-xl shadow-inner">
              <button
                onClick={() => setSystemSubView("settings")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${systemSubView === "settings" ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-[1.02]" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
              >
                <span className="material-symbols-outlined text-sm">settings</span>
                <span>Cài Đặt Admin</span>
              </button>
              <button
                onClick={() => setSystemSubView("oauth")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${systemSubView === "oauth" ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-[1.02]" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
              >
                <span className="material-symbols-outlined text-sm">passkey</span>
                <span>OAuth Apps &amp; Passkey</span>
              </button>
              <button
                onClick={() => setSystemSubView("monitor")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${systemSubView === "monitor" ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-[1.02]" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
              >
                <span className="material-symbols-outlined text-sm">monitor_heart</span>
                <span>Giám Sát Cổng API 8099</span>
              </button>
              <button
                onClick={() => setSystemSubView("projects")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${systemSubView === "projects" ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-[1.02]" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
              >
                <span className="material-symbols-outlined text-sm">folder_open</span>
                <span>Quản Lý Dự Án</span>
              </button>
            </div>

            {systemSubView === "settings" && (
              <AdminSettingsTab
                data={data} updateSystemSettings={updateSystemSettings} updateAdvertisement={updateAdvertisement}
                showNotification={showNotification} handleLogout={handleLogout} uploadingAd={uploadingAd}
                handleAdImageUpload={handleAdImageUpload} handleAdDelete={handleAdDelete}
              />
            )}
            {systemSubView === "oauth" && <AdminOAuthAppsTab />}
            {systemSubView === "monitor" && <AdminSystemTab showNotification={showNotification} />}
            {systemSubView === "projects" && <AdminProjectsTab showNotification={showNotification} />}
          </div>
        )}

        </section>
      </div>

      <AISupportBriefingModal
        isOpen={aiBriefingModalOpen}
        briefingData={aiBriefingData}
        onClose={handleCloseAiBriefing}
      />
    </div>
  );
}
