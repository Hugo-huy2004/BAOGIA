import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { userApi } from "../../services/api/UserApi";
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
import AdminSettingsTab from "../../components/admin/AdminSettingsTab";

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

export default function AdminPanel({ data, updateSystemSettings, updateAdvertisement, handleAdImageUpload, handleAdDelete }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Sub-view Tab States for Consolidated Core Hubs
  const [userSubView, setUserSubView]   = useState("roster");     // roster | support | hugoteam
  const [ecoSubView, setEcoSubView]     = useState("store");      // store | services | community
  const [coderSubView, setCoderSubView] = useState("submissions");// submissions | resources
  const [systemSubView, setSystemSubView] = useState("monitor");  // monitor | projects | settings

  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
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
  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || "/api";
    const fetchAlerts = () => {
      fetch(`${apiBase}/companion/admin/crisis-alerts`, { credentials: "include" })
        .then(r => r.ok ? r.json() : [])
        .then(data => setCrisisAlerts(Array.isArray(data) ? data : []))
        .catch(() => {});
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleResolveCrisisAlert = (alert) => {
    const apiBase = import.meta.env.VITE_API_URL || "/api";
    fetch(`${apiBase}/companion/crisis/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: alert.email, flagId: alert.flagId })
    })
      .then(() => setCrisisAlerts(prev => prev.filter(a => a.flagId !== alert.flagId)))
      .catch(() => {});
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
    } catch (e) {}
  };

  const showNotification = (msg, type = "success") => {
    playPopSound();
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 3500);
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
    } catch (e) {}
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
    } catch (err) {
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
    } catch (e) {
      showNotification("Lỗi cập nhật hạng thành viên", "error");
    }
  };

  const handleToggleBioStatus = async (bioId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "locked" : "active";
    try {
      await userApi.updateStatus(bioId, newStatus);
      setUsers(prev => prev.map(u => u._id === bioId ? { ...u, status: newStatus } : u));
      showNotification(`Đã ${newStatus === "active" ? "mở khóa" : "khóa"} thành viên!`);
    } catch (e) {
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
        
        {/* ── CORE HUB 1: CONTROL HUB & AI TERMINAL ── */}
        {activeTab === "dashboard" && (
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

        {/* ── CORE HUB 2: USER & SUPPORT HUB ── */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Sub-view Nav Header */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-muted/60 w-fit">
              <button
                onClick={() => setUserSubView("roster")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${userSubView === "roster" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <span className="material-symbols-outlined text-sm">group</span>
                <span>Thành viên ({totalMatchedUsers})</span>
              </button>
              <button
                onClick={() => setUserSubView("support")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${userSubView === "support" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <span className="material-symbols-outlined text-sm">support_agent</span>
                <span>Hỗ trợ &amp; Tickets</span>
              </button>
              <button
                onClick={() => setUserSubView("hugoteam")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${userSubView === "hugoteam" ? "bg-white dark:bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
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

        {/* ── CORE HUB 3: ECOSYSTEM & STORE HUB ── */}
        {activeTab === "ecosystem" && (
          <div className="space-y-6">
            {/* Sub-view Nav Header */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit">
              <button
                onClick={() => setEcoSubView("store")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${ecoSubView === "store" ? "bg-white dark:bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                <span className="material-symbols-outlined text-sm">shopping_bag</span>
                <span>Cửa Hàng Utility</span>
              </button>
              <button
                onClick={() => setEcoSubView("services")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${ecoSubView === "services" ? "bg-white dark:bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                <span className="material-symbols-outlined text-sm">card_membership</span>
                <span>Dịch Vụ & Gói Cước VIP</span>
              </button>
            </div>

            {ecoSubView === "store" && <AdminUtilityStoreTab />}
            {ecoSubView === "services" && <AdminServicesTab triggerConfirm={triggerConfirm} />}
          </div>
        )}

        {/* ── CORE HUB 4: HUGOCODER PORTAL ── */}
        {activeTab === "coder" && (
          <div className="space-y-6">
            {/* Sub-view Nav Header */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit">
              <button
                onClick={() => setCoderSubView("submissions")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${coderSubView === "submissions" ? "bg-white dark:bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                <span>Duyệt Bài Nộp Đồ Án</span>
              </button>
              <button
                onClick={() => setCoderSubView("resources")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${coderSubView === "resources" ? "bg-white dark:bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                <span className="material-symbols-outlined text-sm">video_library</span>
                <span>Quản Lý Học Liệu & Video</span>
              </button>
            </div>

            {coderSubView === "submissions" && <AdminCoderSubmissionsTab />}
            {coderSubView === "resources" && <AdminCoderResourcesTab />}
          </div>
        )}

        {/* ── CORE HUB 5: SYSTEM COMMAND & CONFIG ── */}
        {activeTab === "system" && (
          <div className="space-y-6">
            {/* Sub-view Nav Header */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit">
              <button
                onClick={() => setSystemSubView("monitor")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${systemSubView === "monitor" ? "bg-white dark:bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                <span className="material-symbols-outlined text-sm">monitor_heart</span>
                <span>Giám Sát & Logs Hệ Thống</span>
              </button>
              <button
                onClick={() => setSystemSubView("projects")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${systemSubView === "projects" ? "bg-white dark:bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                <span className="material-symbols-outlined text-sm">folder_open</span>
                <span>Quản Lý Dự Án</span>
              </button>
              <button
                onClick={() => setSystemSubView("settings")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${systemSubView === "settings" ? "bg-white dark:bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                <span className="material-symbols-outlined text-sm">settings</span>
                <span>Cài Đặt Admin</span>
              </button>
            </div>

            {systemSubView === "monitor" && <AdminSystemTab showNotification={showNotification} />}
            {systemSubView === "projects" && <AdminProjectsTab showNotification={showNotification} />}
            {systemSubView === "settings" && (
              <AdminSettingsTab
                data={data} updateSystemSettings={updateSystemSettings} updateAdvertisement={updateAdvertisement}
                showNotification={showNotification} handleLogout={handleLogout} uploadingAd={uploadingAd}
                handleAdImageUpload={handleAdImageUpload} handleAdDelete={handleAdDelete}
              />
            )}
          </div>
        )}

        </section>
      </div>
    </div>
  );
}
