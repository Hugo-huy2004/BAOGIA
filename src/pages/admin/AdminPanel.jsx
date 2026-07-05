import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from "../../context/DataContext";
import { logoutAuth } from "../../services/authSession";
import { BaseApi } from "../../services/api/BaseApi";
import { userApi } from "../../services/api/UserApi";

// Components
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminDashboard, { SosOverlay } from "../../components/admin/AdminDashboard";
import AdminAutomationTab from "../../components/admin/AdminAutomationTab";
import AdminSettingsTab from "../../components/admin/AdminSettingsTab";
import AdminUsersTab from "../../components/admin/AdminUsersTab";
import AdminServicesTab from "../../components/admin/AdminServicesTab";
import AdminUtilityStoreTab from "../../components/admin/AdminUtilityStoreTab";
import AdminProjectsTab from "../../components/admin/AdminProjectsTab";
import { HugoNoticeToast } from "../../components/shared/HugoNotice";

import AdminContactSupportTab from "../../components/admin/AdminContactSupportTab";
import AdminCommunityTab from "../../components/admin/AdminCommunityTab";

const api = new BaseApi();

export default function AdminPanel() {
  const { t, i18n } = useTranslation();
  const { data, updateAdvertisement, updateSystemSettings } = useData();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  // Global counts for Sidebar
  const [counts, setCounts] = useState({
    users: 0,
    contactSupport: 0,
    packages: 0,
    projects: 0,
    pendingBookings: 0,
    openTickets: 0,
    totalProjects: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);

  // Polled globally (not just on the dashboard tab) so the SOS overlay fires
  // no matter which admin tab is currently open — a 15s window is the
  // practical ceiling for "ngay lập tức" without standing up push delivery.
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

  // Users State (Kept in AdminPanel to pass to Dashboard & AdminUsersTab)
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
  const isScrollAppendRef = useRef(false);
  const [userStats, setUserStats] = useState({ total: 0, active: 0, pending: 0, rejected: 0, locked: 0, lifetime: 0 });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [copiedUserId, setCopiedUserId] = useState(null);

  // General App States
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");
  const [uploadingAd, setUploadingAd] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: "", onConfirm: null });

  // 1. Utilities
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

  const triggerConfirm = (message, onConfirm) => {
    setConfirmModal({ isOpen: true, message, onConfirm });
  };

  const handleLogout = () => {
    logoutAuth();
    window.location.href = "/login";
  };

  // 2. Fetch Users
  const handleRefreshUsers = async () => {
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

      if (res && res.bios && res.pagination && res.stats) {
        setUsers(prev => isScrollAppendRef.current ? [...prev, ...res.bios] : (res.bios || []));
        isScrollAppendRef.current = false;
        setTotalPages(res.pagination.pages || 1);
        setTotalMatchedUsers(res.pagination.totalMatched || 0);
        setUserStats(res.stats || { total: 0, active: 0, pending: 0, rejected: 0, locked: 0, lifetime: 0 });

        setCounts(prev => ({ ...prev, users: res.stats.total || 0 }));
      } else if (Array.isArray(res)) {
        setUsers(res);
        isScrollAppendRef.current = false;
        setTotalPages(1);
        setTotalMatchedUsers(res.length);
        const stats = {
          total: res.length,
          active: res.filter(u => u.status === 'active').length,
          pending: res.filter(u => u.status === 'pending').length,
          rejected: res.filter(u => u.status === 'rejected').length,
          locked: res.filter(u => u.status === 'locked').length,
          lifetime: res.filter(u => !u.expiresAt).length
        };
        setUserStats(stats);
        setCounts(prev => ({ ...prev, users: stats.total }));
      }
    } catch (e) {
      console.error("Error fetching users:", e);
    }
  };

  useEffect(() => {
    handleRefreshUsers();
  }, [searchQuery, statusFilter, expirationFilter, userSortBy, userSortOrder, userPage, userLimit]);

  // Reset append mode whenever a filter/sort changes (not a scroll-triggered page increment)
   
  useEffect(() => {
    isScrollAppendRef.current = false;
    setUserPage(1);
  }, [statusFilter, expirationFilter, userSortBy, userSortOrder, userLimit]);

  const loadMoreUsers = () => {
    if (userPage < totalPages) {
      isScrollAppendRef.current = true;
      setUserPage(prev => prev + 1);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      isScrollAppendRef.current = false;
      setSearchQuery(searchInput);
      setUserPage(1);
    }, 450);
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  // 3. Initial Dashboard Data Fetching (For Counts)
  useEffect(() => {
    const fetchDashboardCounts = async () => {
      setLoading(true);
      try {
        const [bookingsRes, packagesRes, ticketsRes, unreadProjectsRes, projectsRes] = await Promise.all([
          api.fetchWithAuth("/bookings"),
          api.fetchWithAuth("/packages"),
          api.fetchWithAuth("/support/tickets?limit=1"),
          api.fetchWithAuth("/customer-projects/unread-total"),
          api.fetchWithAuth("/customer-projects")
        ]);

        let newCounts = { ...counts };

        if (bookingsRes.ok && ticketsRes.ok) {
          const b = await bookingsRes.json();
          const tData = await ticketsRes.json();
          const pendingBookingsCount = b.filter(x => !x.contacted).length;
          newCounts.pendingBookings = pendingBookingsCount;
          newCounts.openTickets = tData.pendingCount || 0;
          newCounts.contactSupport = pendingBookingsCount + (tData.pendingCount || 0);
          setRecentBookings(b);
        }
        if (packagesRes.ok) {
          const pkg = await packagesRes.json();
          newCounts.packages = pkg.length;
        }
        if (unreadProjectsRes.ok) {
          const uData = await unreadProjectsRes.json();
          newCounts.projects = uData.total || 0;
        }
        if (projectsRes.ok) {
          const pData = await projectsRes.json();
          newCounts.totalProjects = Array.isArray(pData) ? pData.length : 0;
        }
        setCounts(newCounts);
      } catch (err) {
        console.error("Failed to load dashboard counts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardCounts();
  }, [activeTab]); // Refresh counts when tab changes

  // 4. Shared Handlers
  const handleToggleBioStatus = async (bioId, currentStatus, targetStatus = null) => {
    let nextStatus = targetStatus;
    if (!nextStatus) {
      nextStatus = 'active';
      if (currentStatus === 'active') nextStatus = 'locked';
      else if (currentStatus === 'locked' || currentStatus === 'pending') nextStatus = 'active';
    }

    try {
      await userApi.updateStatus(bioId, nextStatus);
      showNotification(nextStatus === 'locked' ? t("admin.texts.txt_143") : t("admin.texts.txt_144"));
      setUsers(prev => prev.map(u => u._id === bioId ? { ...u, status: nextStatus } : u));
      handleRefreshUsers();
    } catch (e) {
      showNotification(t("admin.texts.txt_146"), "error");
    }
  };

  const handleExecuteDelete = async () => {
    setConfirmError("");
    if (!confirmPassword) return setConfirmError(t("admin.texts.txt_139"));

    const sha256 = async (message) => {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const expectedPasswordHash = import.meta.env.VITE_ADMIN_PASSWORD_HASH || "ac5828f24a8a65e366395faa1d58abe1e2dda05853e45bdb0ae696712e3f1bb3";
    const inputHash = await sha256(confirmPassword);

    if (inputHash !== expectedPasswordHash) return setConfirmError(t("admin.texts.txt_140"));

    try {
      await userApi.deleteBio(deleteTarget._id);
      showNotification(`Đã xóa vĩnh viễn tài khoản của ${deleteTarget.displayName}! 🗑️`);
      setUsers(prev => prev.filter(u => u._id !== deleteTarget._id));
      setDeleteTarget(null);
      setConfirmPassword("");
      handleRefreshUsers();
    } catch (err) {
      setConfirmError(t("admin.texts.txt_142"));
    }
  };

  const handleCopyText = (text, userId) => {
    navigator.clipboard.writeText(text);
    setCopiedUserId(userId);
    showNotification(t("admin.texts.txt_137"));
    setTimeout(() => setCopiedUserId(null), 2000);
  };

  const getExpirationDaysOnly = (expiresAt) => {
    if (!expiresAt) return 0;
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const expMidnight = new Date(expiresAt);
    expMidnight.setHours(0, 0, 0, 0);
    return Math.round((expMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatExpiration = (expiresAt) => {
    if (!expiresAt) return <span className="font-bold text-success">{t("admin.texts.txt_120")}</span>;
    const expDate = new Date(expiresAt);
    const diffDays = getExpirationDaysOnly(expiresAt);
    const formattedDate = expDate.toLocaleDateString('vi-VN');
    
    if (diffDays <= 0) return <span className="text-destructive font-bold">Đã hết hạn ({formattedDate})</span>;
    return (
      <div className="flex flex-col leading-tight">
        <span className="text-foreground font-bold">{formattedDate}</span>
        <span className="text-[10px] text-success font-extrabold mt-0.5">Còn {diffDays} ngày</span>
      </div>
    );
  };

  const handleAdImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return showNotification(t("admin.texts.txt_130"), "error");

    setUploadingAd(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await api.post("/data/upload-ad", {
          base64Str: reader.result,
          oldUrl: data?.advertisement?.imageUrl || ""
        });
        if (res.url) {
          await updateAdvertisement({ imageUrl: res.url, isActive: true });
          showNotification(t("admin.texts.txt_131"));
        } else {
          showNotification(t("admin.texts.txt_132"), "error");
        }
      } catch (err) {
        showNotification(t("admin.texts.txt_133"), "error");
      } finally {
        setUploadingAd(false);
        e.target.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAdDelete = () => {
    triggerConfirm(t("admin.texts.txt_134"), async () => {
      setUploadingAd(true);
      try {
        if (data?.advertisement?.imageUrl) {
          await api.fetchWithAuth("/data/delete-ad", {
            method: "DELETE",
            body: JSON.stringify({ url: data.advertisement.imageUrl })
          });
        }
        await updateAdvertisement({ imageUrl: "", linkUrl: "", isActive: false });
        showNotification(t("admin.texts.txt_135"));
      } catch (err) {
        showNotification(t("admin.texts.txt_136"), "error");
      } finally {
        setUploadingAd(false);
      }
    });
  };

  if (loading && !users.length) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
            {t("adminPanel.core.loading", "ĐANG TẢI DỮ LIỆU...")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-[100dvh] min-h-[100dvh] bg-slate-50/30 dark:bg-background text-foreground flex flex-col md:flex-row overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >

      <SosOverlay alerts={crisisAlerts} />

      <HugoNoticeToast open={Boolean(toastMsg)} type={toastType || "info"} message={toastMsg} zIndex={150} />

      {/* MODAL XÁC NHẬN */}
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

      {/* Delete User Modal */}
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

      {/* MAIN WORKSPACE CONTENT */}
      <section className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)] relative min-h-0">
        
        {/* Workspace Title Header */}
        {activeTab !== "dashboard" && activeTab !== "automation" && (
          <div className="border-b border-border pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                {activeTab === "users" && t("admin.texts.txt_202", "Quản lý Thành Viên")}
                {activeTab === "community" && "Quản lý Cộng đồng"}
                {activeTab === "contactSupport" && "Liên Hệ & Hỗ Trợ"}
                {activeTab === "projects" && t("adminProjects.page.title", "Dự Án Khách Hàng")}
                {activeTab === "settings" && t("admin.texts.txt_207", "Cài Đặt Hệ Thống")}
              </h2>
            </div>
          </div>
        )}

        {/* Dynamic Tab Content */}
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
        {activeTab === "automation" && (
          <AdminAutomationTab showNotification={showNotification} stats={userStats} users={users} />
        )}
        {activeTab === "users" && (
          <AdminUsersTab
            userStats={userStats} searchInput={searchInput} setSearchInput={setSearchInput}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter} setUserPage={setUserPage}
            expirationFilter={expirationFilter} setExpirationFilter={setExpirationFilter}
            userSortBy={userSortBy} setUserSortBy={setUserSortBy} userSortOrder={userSortOrder}
            setUserSortOrder={setUserSortOrder} userLimit={userLimit} setUserLimit={setUserLimit}
            totalMatchedUsers={totalMatchedUsers} users={users} handleCopyText={handleCopyText}
            copiedUserId={copiedUserId} handleToggleBioStatus={handleToggleBioStatus}
            triggerConfirm={triggerConfirm} setDeleteTarget={setDeleteTarget}
            userPage={userPage} totalPages={totalPages} searchQuery={searchQuery}
            getExpirationDaysOnly={getExpirationDaysOnly} formatExpiration={formatExpiration}
            loadMoreUsers={loadMoreUsers} hasMoreUsers={userPage < totalPages}
          />
        )}
        {activeTab === "community" && (
          <AdminCommunityTab showNotification={showNotification} />
        )}
        {activeTab === "contactSupport" && (
          <AdminContactSupportTab showNotification={showNotification} triggerConfirm={triggerConfirm} />
        )}
        {activeTab === "services" && (
          <AdminServicesTab triggerConfirm={triggerConfirm} />
        )}
        {activeTab === "utilityStore" && (
          <AdminUtilityStoreTab />
        )}
        {activeTab === "projects" && (
          <AdminProjectsTab showNotification={showNotification} />
        )}
        {activeTab === "settings" && (
          <AdminSettingsTab
            data={data} updateSystemSettings={updateSystemSettings} updateAdvertisement={updateAdvertisement}
            showNotification={showNotification} handleLogout={handleLogout} uploadingAd={uploadingAd}
            handleAdImageUpload={handleAdImageUpload} handleAdDelete={handleAdDelete}
          />
        )}
      </section>
    </div>
  );
}
