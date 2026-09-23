import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useVisiblePoll from "../../hooks/useVisiblePoll";
import { useTranslation } from "react-i18next";
import { userApi } from "../../services/api/modules/userApi";
import { useData } from "../../context/DataContext";
import { dataApi } from "../../services/api/modules/dataApi";
import { getAdminSession, logoutAuth } from "../../services/api/core/authSession";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminCommandPalette from "../../components/admin/AdminCommandPalette";
import AdminDashboard, { SosOverlay } from "../../components/admin/AdminDashboard";
import AdminUsersTab from "../../components/admin/AdminUsersTab";
import AdminWorkQueueTab from "../../components/admin/AdminWorkQueueTab";
import AdminJoyLendingTab from "../../components/admin/AdminJoyLendingTab";
import { DEFAULT_DESTINATION, LEGACY_TAB_ALIASES, isValidDestination } from "../../components/admin/adminDestinations";
import { adminBrainApi } from "../../services/api/modules/adminBrainApi";
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
  // Hàng đợi bấm "Mở hồ sơ" thì chuyển sang tab Thành viên và bật sẵn modal
  // của đúng người đó. Dọn về null sau khi đã mở để lần sau còn mở lại được.
  const [queueUserId, setQueueUserId] = useState(null);
  /**
   * Điểm đến nằm trong ĐƯỜNG DẪN: `/admin/queue`, `/admin/users`…
   *
   * Trước đây nó là `?tab=` trong state của component, nên hai thứ hỏng: mở một
   * màn hình ở tab mới thì mất, và nút Lùi của trình duyệt nhảy ra khỏi cả bảng
   * điều khiển thay vì lùi một màn. Nay `activeTab` là DẪN XUẤT của URL, không
   * phải một bản sao — không có bản sao thì không có chuyện lệch nhau.
   */
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = useMemo(() => {
    const seg = location.pathname.replace(/^\/admin\/?/, "").split("/")[0];
    const legacy = new URLSearchParams(location.search).get("tab");
    const wanted = seg || legacy || "";
    const resolved = LEGACY_TAB_ALIASES[wanted] || wanted;
    return isValidDestination(resolved) ? resolved : DEFAULT_DESTINATION;
  }, [location.pathname, location.search]);

  const setActiveTab = useCallback(
    (id) => navigate(`/admin/${id}`, { replace: false }),
    [navigate],
  );

  // `/admin` trần và `?tab=` kiểu cũ đều chuẩn hoá về đường dẫn thật, để địa chỉ
  // trên thanh URL luôn khớp thứ đang hiện.
  useEffect(() => {
    const seg = location.pathname.replace(/^\/admin\/?/, "").split("/")[0];
    if (!isValidDestination(seg)) navigate(`/admin/${activeTab}`, { replace: true });
  }, [location.pathname, activeTab, navigate]);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState("");

  // Telegram deep-link: auto-activate robot tab + pass token
  const [robotDeepLinkToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("robotToken") || "";
  });

  // Counts & Stats
  const [counts, setCounts] = useState({
    users: 0,
    contactSupport: 0,
    utilityStore: 0,
    projects: 0,
    openTickets: 0,
    totalProjects: 0,
    packages: 0,
    queue: 0
  });

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

      // Số việc chờ duyệt đi kèm luôn: nhãn ở thanh bên phải nói được còn bao
      // nhiêu việc treo, nếu không thì phải bấm vào mới biết.
      let queueTotal = 0;
      try {
        queueTotal = (await adminBrainApi.getWorkQueue(200))?.counts?.total || 0;
      } catch { /* hàng đợi lỗi thì các số khác vẫn phải cập nhật */ }

      setCounts(prev => ({
        ...prev,
        openTickets,
        contactSupport: openTickets,
        packages: packagesCount,
        totalProjects: projectsCount,
        projects: projectsCount,
        queue: queueTotal
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


  /**
   * Chọn màn hình theo điểm đến. Trước đây việc này nằm rải trong JSX thành 36
   * nhánh điều kiện lồng nhau cùng 5 dải nút phụ có markup gần như giống hệt —
   * muốn tới màn chấm bài phải bấm ba lần. Danh sách điểm đến ở
   * `src/components/admin/adminDestinations.js`; thêm màn hình mới thì thêm một
   * nhánh ở đây, ĐỪNG dựng lại tầng phụ.
   */
  const renderTab = () => {
    switch (activeTab) {
      case "queue":
        return (
          <AdminWorkQueueTab
            onOpenUser={(userId) => {
              // Xử một việc trong hàng đợi thường cần nhìn cả bối cảnh, nên mở
              // thẳng hồ sơ 360° của đúng người đó.
              setQueueUserId(userId);
              setActiveTab("users");
            }}
          />
        );
      case "dashboard":
        return (
          <AdminDashboard
            stats={userStats}
            totalProjects={counts.totalProjects}
            totalPackages={counts.packages}
            openTickets={counts.openTickets}
            loading={loading}
            crisisAlerts={crisisAlerts}
            onResolveCrisisAlert={handleResolveCrisisAlert}
          />
        );
      case "audit":
        return <AdminAuditLogTab />;

      case "users":
        return (
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
            openUserId={queueUserId} onOpenedUser={() => setQueueUserId(null)}
          />
        );
      case "support":
        return <AdminContactSupportTab showNotification={showNotification} triggerConfirm={triggerConfirm} />;
      case "hugoteam":
        return <AdminHugoTeamTab />;

      case "projects":
        return <AdminProjectsTab showNotification={showNotification} />;
      case "services":
        return <AdminServicesTab triggerConfirm={triggerConfirm} />;
      case "store":
        return <AdminUtilityStoreTab />;
      case "joylater":
        return <AdminJoyLendingTab />;

      case "submissions":
        return <AdminCoderSubmissionsTab />;
      case "resources":
        return <AdminCoderResourcesTab />;
      case "learners":
        return <AdminLearnersTab />;

      case "sentinel":
        return <AdminSecuritySentinelTab token={adminToken} onShowToast={(msg) => showNotification(msg)} />;
      case "brain":
        return <AdminBrainTab />;
      case "workforce":
        return <AdminAIWorkforceTab />;
      case "robot":
        return <AdminRobotTab deepLinkToken={robotDeepLinkToken} />;

      case "monitor":
        return <AdminSystemTab showNotification={showNotification} />;
      case "oauth":
        return <AdminOAuthAppsTab />;
      case "settings":
        return (
          <AdminSettingsTab
            data={data} updateSystemSettings={updateSystemSettings} updateAdvertisement={updateAdvertisement}
            showNotification={showNotification} handleLogout={handleLogout} uploadingAd={uploadingAd}
            handleAdImageUpload={handleAdImageUpload} handleAdDelete={handleAdDelete} triggerConfirm={triggerConfirm}
          />
        );
      default:
        return null;
    }
  };

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
          {renderTab()}

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
