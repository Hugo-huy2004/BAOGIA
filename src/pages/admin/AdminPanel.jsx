import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from "../../context/DataContext";
import { logoutAuth, getAdminSession } from "../../services/authSession";

const fetchWithAuth = async (url, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  const response = await fetch(url, { ...options, credentials: "include", headers });
  if (response.status === 401 || response.status === 403) {
    await logoutAuth();
    window.location.href = '/login';
  }
  return response;
};
import HugoLogo from "../../components/HugoLogo";
import AdminSettingsTab from "../../components/admin/AdminSettingsTab";
import AdminUsersTab from "../../components/admin/AdminUsersTab";
import AdminProjectsTab from "../../components/admin/AdminProjectsTab";
import AdminPaymentsTab from "../../components/admin/AdminPaymentsTab";
// Hugo Studio Brand Logo component to match styling exactly

export default function AdminPanel() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith("vi") ? "en" : "vi";
    i18n.changeLanguage(newLang);
  };

  const { data, updateAdvertisement, updateSystemSettings } = useData();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [partners, setPartners] = useState([]);

  // Smart User Management States
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
  const [userStats, setUserStats] = useState({ total: 0, active: 0, locked: 0, lifetime: 0 });
  
  // Package Management States
  const [packageTemplates, setPackageTemplates] = useState([]);
  const [newPkg, setNewPkg] = useState({ name: "", duration: "", durationUnit: "months", benefits: "" });
  const [assignForm, setAssignForm] = useState({ email: "", packageId: "" });
  const [memberPkgSearchEmail, setMemberPkgSearchEmail] = useState("");
  const [searchedMemberBio, setSearchedMemberBio] = useState(null);

  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");

  // Advertisement State
  const [uploadingAd, setUploadingAd] = useState(false);

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

  // Reusable custom confirm modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: "", onConfirm: null });
  
  // Visual polish States
  const [copiedUserId, setCopiedUserId] = useState(null);
  const [bookingSubTab, setBookingSubTab] = useState("pending");

  // Support Request States
  const [supportTickets, setSupportTickets] = useState([]);
  const [pendingTicketsCount, setPendingTicketsCount] = useState(0);
  const [supportPage, setSupportPage] = useState(1);
  const [supportLimit] = useState(15);
  const [supportTotalPages, setSupportTotalPages] = useState(1);
  const [supportStatusFilter, setSupportStatusFilter] = useState(""); // "" (All), "pending", "resolved"

  const [projectsUnreadCount, setProjectsUnreadCount] = useState(0);

  const triggerConfirm = (message, onConfirm) => {
    setConfirmModal({ isOpen: true, message, onConfirm });
  };

  const handleAdImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showNotification(t("admin.texts.txt_130"), "error");
      return;
    }

    setUploadingAd(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Str = reader.result;
      try {
        const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/data/upload-ad`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base64Str,
            oldUrl: data?.advertisement?.imageUrl || ""
          })
        });
        const result = await res.json();
        if (res.ok && result.url) {
          await updateAdvertisement({ imageUrl: result.url, isActive: true });
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
          await fetchWithAuth(`${import.meta.env.VITE_API_URL}/data/delete-ad`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
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

  const handleCopyText = (text, userId) => {
    navigator.clipboard.writeText(text);
    setCopiedUserId(userId);
    showNotification(t("admin.texts.txt_137"));
    setTimeout(() => setCopiedUserId(null), 2000);
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

  // Fetch users with filters and pagination
  const handleRefreshUsers = async () => {
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        status: statusFilter,
        expiration: expirationFilter,
        sortBy: userSortBy,
        sortOrder: userSortOrder,
        page: userPage,
        limit: userLimit
      });
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/bios?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        if (result && result.bios && result.pagination && result.stats) {
          setUsers(result.bios || []);
          setTotalPages(result.pagination.pages || 1);
          setTotalMatchedUsers(result.pagination.totalMatched || 0);
          setUserStats(result.stats || { total: 0, active: 0, locked: 0, lifetime: 0 });
        } else if (Array.isArray(result)) {
          setUsers(result);
          setTotalPages(1);
          setTotalMatchedUsers(result.length);
          setUserStats({
            total: result.length,
            active: result.filter(u => u.status !== 'locked').length,
            locked: result.filter(u => u.status === 'locked').length,
            lifetime: result.filter(u => !u.expiresAt).length
          });
        }
      }
    } catch (e) {
      console.error("Error fetching users:", e);
    }
  };

  const handleRefreshTickets = async () => {
    try {
      const params = new URLSearchParams({
        status: supportStatusFilter,
        page: supportPage.toString(),
        limit: supportLimit.toString()
      });
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/support/tickets?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setSupportTickets(result.tickets || []);
        setSupportTotalPages(result.pagination?.pages || 1);
        setPendingTicketsCount(result.pendingCount || 0);
      }
    } catch (e) {
      console.error("Error fetching support tickets:", e);
    }
  };

  // Fetch support tickets when tab, filters or page changes
  useEffect(() => {
    handleRefreshTickets();
  }, [supportPage, supportStatusFilter, activeTab]);

  // Fetch users whenever pagination, sorting or filter options change
  useEffect(() => {
    handleRefreshUsers();
  }, [searchQuery, statusFilter, expirationFilter, userSortBy, userSortOrder, userPage, userLimit]);

  // Debounce search query changes to prevent over-fetching
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearchQuery(searchInput);
      setUserPage(1); // Reset to page 1 on new search
    }, 450);
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  // Fetch other dashboard data on mount (bookings, partners, packages, support tickets)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [bookingsRes, partnersRes, packagesRes, ticketsRes, unreadProjectsRes] = await Promise.all([
          fetchWithAuth(import.meta.env.VITE_API_URL + "/bookings"),
          fetchWithAuth(import.meta.env.VITE_API_URL + "/partners"),
          fetchWithAuth(import.meta.env.VITE_API_URL + "/packages"),
          fetchWithAuth(import.meta.env.VITE_API_URL + "/support/tickets?limit=1"),
          fetchWithAuth(import.meta.env.VITE_API_URL + "/customer-projects/unread-total")
        ]);

        if (bookingsRes.ok) setBookings(await bookingsRes.json());
        if (partnersRes.ok) setPartners(await partnersRes.json());
        if (packagesRes.ok) setPackageTemplates(await packagesRes.json());
        if (ticketsRes.ok) {
          const tData = await ticketsRes.json();
          setPendingTicketsCount(tData.pendingCount || 0);
        }
        if (unreadProjectsRes.ok) {
          const uData = await unreadProjectsRes.json();
          setProjectsUnreadCount(uData.total || 0);
        }
      } catch (err) {
        console.error("Failed to load admin data:", err);
        showNotification(t("admin.texts.txt_138"), "error");
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
      setConfirmError(t("admin.texts.txt_139"));
      return;
    }

    const expectedPasswordHash = import.meta.env.VITE_ADMIN_PASSWORD_HASH || "ac5828f24a8a65e366395faa1d58abe1e2dda05853e45bdb0ae696712e3f1bb3";
    const inputHash = await sha256(confirmPassword);

    if (inputHash !== expectedPasswordHash) {
      setConfirmError(t("admin.texts.txt_140"));
      return;
    }

    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/bios/${deleteTarget._id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        showNotification(`Đã xóa vĩnh viễn tài khoản của ${deleteTarget.displayName}! 🗑️`);
        setUsers(prev => prev.filter(u => u._id !== deleteTarget._id));
        setDeleteTarget(null);
        setConfirmPassword("");
        handleRefreshUsers();
      } else {
        setConfirmError(t("admin.texts.txt_141"));
      }
    } catch (err) {
      console.error(err);
      setConfirmError(t("admin.texts.txt_142"));
    }
  };

  // 1. Bios Actions
  const handleToggleBioStatus = async (bioId, currentStatus) => {
    const nextStatus = currentStatus === 'locked' ? 'active' : 'locked';
    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/bios/${bioId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (response.ok) {
        showNotification(nextStatus === 'locked' ? t("admin.texts.txt_143") : t("admin.texts.txt_144"));
        setUsers(prev => prev.map(u => u._id === bioId ? { ...u, status: nextStatus } : u));
        handleRefreshUsers();
      } else {
        showNotification(t("admin.texts.txt_145"), "error");
      }
    } catch (e) {
      console.error(e);
      showNotification(t("admin.texts.txt_146"), "error");
    }
  };

  // 2. Booking Actions
  const handleToggleBookingContacted = async (bookingId, currentContacted) => {
    const nextContacted = !currentContacted;
    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/bookings/${bookingId}/contact`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacted: nextContacted })
      });
      if (response.ok) {
        const updated = await response.json();
        showNotification(nextContacted ? t("admin.texts.txt_147") : t("admin.texts.txt_148"));
        setBookings(prev => prev.map(b => b._id === bookingId ? updated : b));
      } else {
        showNotification(t("admin.texts.txt_149"), "error");
      }
    } catch (e) {
      console.error(e);
      showNotification(t("admin.texts.txt_150"), "error");
    }
  };

  const handleDeleteBooking = (bookingId) => {
    triggerConfirm(t("admin.texts.txt_151"), async () => {
      try {
        const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/bookings/${bookingId}`, {
          method: "DELETE"
        });
        if (response.ok) {
          showNotification(t("admin.texts.txt_152"));
          setBookings(prev => prev.filter(b => b._id !== bookingId));
        } else {
          showNotification(t("admin.texts.txt_153"), "error");
        }
      } catch (e) {
        console.error(e);
        showNotification(t("admin.texts.txt_154"), "error");
      }
    });
  };

  // Support Tickets Actions
  const handleResolveTicket = async (ticketId) => {
    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/support/tickets/${ticketId}/resolve`, {
        method: "PATCH"
      });
      if (res.ok) {
        showNotification(t("admin.texts.txt_155"));
        handleRefreshTickets();
      } else {
        showNotification(t("admin.texts.txt_156"), "error");
      }
    } catch (err) {
      showNotification(t("admin.texts.txt_157"), "error");
    }
  };

  // 3. Partner Actions
  const handleAddPartner = async (e) => {
    e.preventDefault();
    const shouldExportIframe = e.nativeEvent?.submitter?.value === "export-iframe";
    if (!partnerForm.name || !partnerForm.iframeUrl) {
      showNotification(t("admin.texts.txt_158"), "error");
      return;
    }

    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/partners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partnerForm)
      });
      if (response.ok) {
        const newPartner = await response.json();
        showNotification(t("admin.texts.txt_159"));
        setPartners(prev => [newPartner, ...prev]);
        setPartnerForm({ name: "", iframeUrl: "" });
        if (shouldExportIframe) {
          setExportPartner(newPartner);
        }
      } else {
        showNotification(t("admin.texts.txt_160"), "error");
      }
    } catch (e) {
      console.error(e);
      showNotification(t("admin.texts.txt_161"), "error");
    }
  };

  const handleDeletePartner = (partnerId) => {
    triggerConfirm(t("admin.texts.txt_162"), async () => {
      try {
        const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/partners/${partnerId}`, {
          method: "DELETE"
        });
        if (response.ok) {
          showNotification(t("admin.texts.txt_163"));
          setPartners(prev => prev.filter(p => p._id !== partnerId));
          if (previewPartner?._id === partnerId) setPreviewPartner(null);
          if (exportPartner?._id === partnerId) setExportPartner(null);
          if (exportLinkPartner?._id === partnerId) setExportLinkPartner(null);
        } else {
          showNotification(t("admin.texts.txt_164"), "error");
        }
      } catch (e) {
        console.error(e);
        showNotification(t("admin.texts.txt_165"), "error");
      }
    });
  };

  const fetchPackageTemplates = async () => {
    try {
      const res = await fetchWithAuth(import.meta.env.VITE_API_URL + "/packages");
      if (res.ok) setPackageTemplates(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    if (!newPkg.name || !newPkg.duration) {
      showNotification(t("admin.texts.txt_166"), "error");
      return;
    }

    try {
      const res = await fetchWithAuth(import.meta.env.VITE_API_URL + "/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPkg.name,
          duration: Number(newPkg.duration),
          durationUnit: newPkg.durationUnit,
          benefits: newPkg.benefits.split("\n").map(b => b.trim()).filter(Boolean)
        })
      });

      if (res.ok) {
        showNotification(t("admin.texts.txt_167"));
        setNewPkg({ name: "", duration: "", durationUnit: "months", benefits: "" });
        fetchPackageTemplates();
      } else {
        const err = await res.json();
        showNotification(err.error || t("admin.texts.txt_168"), "error");
      }
    } catch (e) {
      showNotification(t("admin.texts.txt_169"), "error");
    }
  };

  const handleDeletePackageTemplate = async (id) => {
    triggerConfirm(t("admin.texts.txt_170"), async () => {
      try {
        const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/packages/${id}`, {
          method: "DELETE"
        });
        if (res.ok) {
          showNotification(t("admin.texts.txt_171"));
          fetchPackageTemplates();
        } else {
          showNotification(t("admin.texts.txt_172"), "error");
        }
      } catch (e) {
        showNotification(t("admin.texts.txt_173"), "error");
      }
    });
  };

  const handleAssignPackageToUser = async (e) => {
    e.preventDefault();
    if (!assignForm.email || !assignForm.packageId) {
      showNotification(t("admin.texts.txt_174"), "error");
      return;
    }

    try {
      const isAssignAll = assignForm.email.toUpperCase() === "ALL";
      const endpoint = isAssignAll ? "/packages/assign-all" : "/packages/user";
      const payload = isAssignAll ? {
        packageId: assignForm.packageId,
        customDuration: assignForm.customDuration
      } : {
        email: assignForm.email,
        packageId: assignForm.packageId,
        customDuration: assignForm.customDuration
      };

      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showNotification(isAssignAll ? t("admin.texts.txt_175") : `Đã cấp gói cho ${assignForm.email} thành công!`);
        setAssignForm({ email: "", packageId: "", customDuration: "" });
        // Refresh users list
        handleRefreshUsers();
        // If searching this user, refresh search
        if (!isAssignAll && memberPkgSearchEmail.toLowerCase() === assignForm.email.toLowerCase()) {
          handleSearchUserPackages(assignForm.email);
        }
      } else {
        const err = await res.json();
        showNotification(err.error || t("admin.texts.txt_176"), "error");
      }
    } catch (e) {
      showNotification(t("admin.texts.txt_177"), "error");
    }
  };

  const handleRegenerateGiftCode = async (packageId) => {
    triggerConfirm(t("admin.texts.txt_178"), async () => {
      try {
        const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/packages/${packageId}/regenerate-code`, {
          method: "POST"
        });
        if (res.ok) {
          const data = await res.json();
          showNotification(t("admin.texts.txt_179"));
          setPackageTemplates(prev => prev.map(pkg => pkg._id === packageId ? data.package : pkg));
        } else {
          showNotification(t("admin.texts.txt_180"), "error");
        }
      } catch (e) {
        showNotification(t("admin.texts.txt_181"), "error");
      }
    });
  };

  const handleSearchUserPackages = async (emailToSearch) => {
    const email = emailToSearch || memberPkgSearchEmail;
    if (!email) {
      showNotification(t("admin.texts.txt_182"), "error");
      return;
    }

    try {
      const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/bios/me?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.bio) {
          setSearchedMemberBio(data.bio);
        } else {
          showNotification(t("admin.texts.txt_183"), "error");
          setSearchedMemberBio(null);
        }
      } else {
        showNotification(t("admin.texts.txt_184"), "error");
        setSearchedMemberBio(null);
      }
    } catch (e) {
      showNotification(t("admin.texts.txt_185"), "error");
    }
  };

  const handleRemoveUserPackage = async (packageInstanceId) => {
    if (!searchedMemberBio) return;
    triggerConfirm(`Bạn có chắc chắn muốn xóa gói này khỏi thành viên ${searchedMemberBio.email}? Thời hạn trang Bio của họ sẽ tự động bị trừ tương ứng.`, async () => {
      try {
        const res = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/packages/user`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: searchedMemberBio.email,
            packageInstanceId
          })
        });

        if (res.ok) {
          showNotification(t("admin.texts.txt_186"));
          // Refresh search result
          handleSearchUserPackages(searchedMemberBio.email);
          // Refresh users list
          handleRefreshUsers();
        } else {
          showNotification(t("admin.texts.txt_187"), "error");
        }
      } catch (e) {
        showNotification(t("admin.texts.txt_188"), "error");
      }
    });
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
    if (!expiresAt) return <span className="font-bold text-emerald-650 dark:text-emerald-400">{t("admin.texts.txt_120")}</span>;
    const expDate = new Date(expiresAt);
    const diffDays = getExpirationDaysOnly(expiresAt);
    
    const formattedDate = expDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    if (diffDays <= 0) {
      return (
        <span className="text-red-500 font-bold">Đã hết hạn ({formattedDate})</span>
      );
    }
    return (
      <div className="flex flex-col leading-tight">
        <span className="text-slate-800 dark:text-slate-200 font-bold">{formattedDate}</span>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold mt-0.5">Còn {diffDays} ngày</span>
      </div>
    );
  };

  const getExpirationDaysOnly = (expiresAt) => {
    if (!expiresAt) return 0;
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const expMidnight = new Date(expiresAt);
    expMidnight.setHours(0, 0, 0, 0);
    const diffTime = expMidnight.getTime() - todayMidnight.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  const getAutoDeleteDays = (booking) => {
    if (!booking.contacted || !booking.expiresAt) return null;
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const expMidnight = new Date(booking.expiresAt);
    expMidnight.setHours(0, 0, 0, 0);
    
    const diffTime = expMidnight.getTime() - todayMidnight.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            {t("adminPanel.core.loading")}
          </p>
        </div>
      </div>
    );
  }

  // Pre-calculate sub-tab lists for bookings
  const pendingBookings = bookings.filter(b => !b.contacted);
  const contactedBookings = bookings.filter(b => b.contacted);
  const displayedBookings = bookingSubTab === "pending" ? pendingBookings : contactedBookings;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50 dark:bg-[#0b0910] text-slate-850 dark:text-slate-100 flex flex-col md:flex-row pb-20 md:pb-0 overflow-x-hidden">
      <button onClick={toggleLanguage} className="fixed top-4 right-4 md:top-6 md:right-6 z-50 flex h-9 w-12 items-center justify-center rounded-full bg-slate-200/80 dark:bg-[#1f1929]/80 backdrop-blur shadow-sm text-[11px] font-bold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-[#2d253b] transition-all">{i18n.language.startsWith("en") ? "EN" : "VI"}</button>
      
      {/* SUCCESS/WARNING TOAST */}
      {toastMsg && (
        <div className={`fixed top-16 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 z-50 flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl bg-white dark:bg-[#161420] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.35)] max-w-md border-2 transition-all ${
          toastType === "success" 
            ? "border-emerald-500 dark:border-emerald-600" 
            : "border-red-500 dark:border-rose-500"
        }`}>
          <span className="material-symbols-outlined shrink-0 text-lg sm:text-xl text-slate-800 dark:text-slate-200">
            {toastType === "success" ? "check_circle" : "error"}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">{toastMsg}</span>
        </div>
      )}

      {/* DESKTOP SIDEBAR - STICKY UNDER NAVBAR */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#12111a] sticky top-14 h-[calc(100vh-56px)] z-20 justify-between p-6">
        <div className="space-y-6">
          <div>
            <span className="text-[9px] bg-primary/10 text-primary dark:bg-[#1a1727] dark:text-[#a5b4fc] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest border border-primary/20 inline-block">
              Admin Workspace
            </span>
            <h1 className="font-display text-lg font-black text-slate-800 dark:text-white mt-2">
              <HugoLogo className="text-xl font-black tracking-tight" />
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{t("admin.texts.txt_121")}</p>
          </div>

          <nav className="space-y-1">
            {[
              { id: "users", label: t("admin.texts.txt_189"), icon: "group", count: users.length },
              { id: "bookings", label: t("admin.texts.txt_190"), icon: "calendar_month", count: pendingBookings.length },
              { id: "partners", label: t("admin.texts.txt_191"), icon: "handshake", count: partners.length },
              { id: "packages", label: t("admin.texts.txt_192"), icon: "featured_play_list", count: packageTemplates.length },
              { id: "projects", label: t("admin.texts.txt_193"), icon: "assignment", count: projectsUnreadCount },
              { id: "payments", label: "Chuyển Khoản", icon: "payments" },
              { id: "support", label: t("admin.texts.txt_194"), icon: "support_agent", count: pendingTicketsCount },
              { id: "settings", label: t("admin.texts.txt_195"), icon: "settings" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'projects') {
                    window.location.href = '/admin/projects';
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold text-xs transition-all ${
                  (activeTab === tab.id && tab.id !== 'projects')
                    ? "bg-primary/10 text-primary dark:bg-[#201830] dark:text-[#a5b4fc]"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                    tab.id === "bookings" || tab.id === "support"
                      ? "bg-rose-500 text-white animate-pulse"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-bold text-xs py-3 rounded-xl border border-slate-200 dark:border-slate-750 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          <span>{t("admin.texts.txt_122")}</span>
        </button>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 nav-bottom-safe bg-white/95 dark:bg-[#12111a]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 flex items-center justify-around px-2 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        {[
          { id: "users", label: t("admin.texts.txt_196"), icon: "group", count: users.length },
          { id: "bookings", label: t("admin.texts.txt_197"), icon: "calendar_month", count: pendingBookings.length },
          { id: "partners", label: t("admin.texts.txt_198"), icon: "handshake" },
          { id: "packages", label: t("admin.texts.txt_199"), icon: "featured_play_list" },
          { id: "payments", label: "PayOS", icon: "payments" },
          { id: "support", label: t("admin.texts.txt_200"), icon: "support_agent", count: pendingTicketsCount },
          { id: "settings", label: t("admin.texts.txt_201"), icon: "settings" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full relative transition-all ${
              activeTab === tab.id
                ? "text-primary dark:text-[#a5b4fc]"
                : "text-slate-400 hover:text-slate-655 dark:text-slate-500 dark:hover:text-slate-350"
            }`}
          >
            <div className="relative">
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`absolute -top-1.5 -right-2 px-1 rounded-full text-[7.5px] font-black leading-none ${
                  tab.id === "bookings" || tab.id === "support"
                    ? "bg-rose-500 text-white animate-pulse"
                    : "bg-slate-500 text-white"
                }`}>
                  {tab.count}
                </span>
              )}
            </div>
            <span className="text-[9px] font-bold mt-1 tracking-wide">{tab.label}</span>
            {activeTab === tab.id && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary dark:bg-[#a5b4fc]" />
            )}
          </button>
        ))}
      </nav>

      {/* MAIN WORKSPACE CONTENT */}
      <section className="flex-grow p-4 sm:p-6 md:p-8 space-y-6 overflow-y-auto content-bottom-safe md:pb-8">
        
        {/* Workspace Title Header */}
        <div className="border-b border-slate-200 dark:border-slate-800/80 pb-3 flex justify-between items-center">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              {activeTab === "users" && t("admin.texts.txt_202")}
              {activeTab === "bookings" && t("admin.texts.txt_203")}
              {activeTab === "partners" && t("admin.texts.txt_204")}
              { activeTab === "packages" && t("admin.texts.txt_205") }
              { activeTab === "payments" && "Quản lý Chuyển Khoản" }
              { activeTab === "support" && t("admin.texts.txt_206") }
              { activeTab === "settings" && t("admin.texts.txt_207") }
            </h2>
            <p className="text-xs text-slate-450 mt-1 hidden sm:block">
              {activeTab === "users" && t("admin.texts.txt_208")}
              {activeTab === "bookings" && t("admin.texts.txt_209")}
              {activeTab === "partners" && t("admin.texts.txt_210")}
              {activeTab === "packages" && t("admin.texts.txt_211")}
              {activeTab === "support" && t("admin.texts.txt_212")}
              {activeTab === "settings" && t("admin.texts.txt_213")}
            </p>
          </div>
        </div>

        {/* TAB 1: USERS */}
        {activeTab === "users" && (
          <AdminUsersTab
            userStats={userStats}
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            setUserPage={setUserPage}
            expirationFilter={expirationFilter}
            setExpirationFilter={setExpirationFilter}
            userSortBy={userSortBy}
            setUserSortBy={setUserSortBy}
            userSortOrder={userSortOrder}
            setUserSortOrder={setUserSortOrder}
            userLimit={userLimit}
            setUserLimit={setUserLimit}
            totalMatchedUsers={totalMatchedUsers}
            users={users}
            handleCopyText={handleCopyText}
            copiedUserId={copiedUserId}
            handleToggleBioStatus={handleToggleBioStatus}
            triggerConfirm={triggerConfirm}
            setDeleteTarget={setDeleteTarget}
            userPage={userPage}
            totalPages={totalPages}
            searchQuery={searchQuery}
            getExpirationDaysOnly={getExpirationDaysOnly}
            formatExpiration={formatExpiration}
          />
        )}

        {/* TAB 2: BOOKINGS */}
        {activeTab === "bookings" && (
          <div className="bg-white dark:bg-[#12111a] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden animate-fadeIn">
            
            {/* Split sub-tabs navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-4 bg-slate-50/50 dark:bg-[#181622]/40 gap-4">
              <button
                onClick={() => setBookingSubTab("pending")}
                className={`pb-3 font-bold text-xs relative transition-all flex items-center gap-2 ${
                  bookingSubTab === "pending"
                    ? "text-primary dark:text-[#a5b4fc]"
                    : "text-slate-450 hover:text-slate-800 dark:text-slate-550 dark:hover:text-slate-350"
                }`}
              >
                <span>{t("admin.texts.txt_123")}</span>
                {pendingBookings.length > 0 && (
                  <span className="bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse">
                    {pendingBookings.length}
                  </span>
                )}
                {bookingSubTab === "pending" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-[#a5b4fc] rounded-full" />
                )}
              </button>

              <button
                onClick={() => setBookingSubTab("contacted")}
                className={`pb-3 font-bold text-xs relative transition-all flex items-center gap-2 ${
                  bookingSubTab === "contacted"
                    ? "text-primary dark:text-[#a5b4fc]"
                    : "text-slate-450 hover:text-slate-800 dark:text-slate-550 dark:hover:text-slate-350"
                }`}
              >
                <span>{t("admin.texts.txt_124")}</span>
                {contactedBookings.length > 0 && (
                  <span className="bg-slate-200 dark:bg-slate-800 text-slate-655 dark:text-slate-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                    {contactedBookings.length}
                  </span>
                )}
                {bookingSubTab === "contacted" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-[#a5b4fc] rounded-full" />
                )}
              </button>
            </div>

            {displayedBookings.length > 0 ? (
              <div>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/70 font-bold uppercase tracking-wider text-[9px]">
                        <th className="px-6 py-4 w-16 text-center">{t("admin.texts.txt_125")}</th>
                        <th className="px-6 py-4">{t("admin.texts.txt_126")}</th>
                        <th className="px-6 py-4">{t("admin.texts.txt_127")}</th>
                        <th className="px-6 py-4">{t("admin.texts.txt_128")}</th>
                        <th className="px-6 py-4 text-center">{t("admin.texts.txt_129")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60 font-medium">
                      {displayedBookings.map((booking) => {
                        const deleteDays = getAutoDeleteDays(booking);
                        return (
                          <tr key={booking._id} className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition-colors">
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => handleToggleBookingContacted(booking._id, booking.contacted)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors border shadow-sm ${
                                  booking.contacted
                                    ? "bg-emerald-50 border-emerald-255 text-emerald-600 dark:bg-[#102a1e] dark:border-[#104a30] dark:text-emerald-455"
                                    : "bg-white border-slate-200 text-slate-400 hover:border-primary hover:text-primary dark:bg-slate-850 dark:border-slate-800"
                                }`}
                                title={booking.contacted ? t("admin.texts.txt_214") : t("admin.texts.txt_215")}
                              >
                                <span className="material-symbols-outlined text-base">
                                  {booking.contacted ? "check_box" : "check_box_outline_blank"}
                                </span>
                              </button>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="font-bold text-slate-850 dark:text-white text-xs">{booking.fullName}</div>
                                <div className="text-[10px] text-slate-405 font-mono select-all">{booking.phone}</div>
                                <div className="text-[10px] text-slate-405 font-mono select-all">{booking.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 max-w-xs">
                              <p className="text-slate-600 dark:text-slate-350 text-xs line-clamp-3 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 leading-relaxed">
                                {booking.message || t("admin.texts.txt_216")}
                              </p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs">
                              <div className="flex flex-col font-medium">
                                <span className="text-slate-800 dark:text-slate-200">
                                  {new Date(booking.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                                <span className="text-[9px] text-slate-400">
                                  {new Date(booking.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {deleteDays !== null && (
                                  <span className="text-[9px] text-rose-500 font-bold mt-1">
                                    Tự xóa sau {deleteDays} ngày
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => handleDeleteBooking(booking._id)}
                                className="text-rose-555 hover:text-rose-700 dark:hover:text-rose-400 w-8 h-8 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors flex items-center justify-center mx-auto"
                                title={t("admin.texts.txt_217")}
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Compressed Mobile List View */}
                <div className="md:hidden divide-y divide-slate-150 dark:divide-slate-800/60 px-4">
                  {displayedBookings.map((booking) => {
                    const deleteDays = getAutoDeleteDays(booking);
                    return (
                      <div key={booking._id} className="py-4 space-y-2.5 first:pt-2 last:pb-2">
                        {/* Top Row: Name, Date, Toggle Contacted status */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-850 dark:text-white text-xs truncate leading-tight">{booking.fullName}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-none">
                              {new Date(booking.createdAt).toLocaleDateString('vi-VN')} • {new Date(booking.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleToggleBookingContacted(booking._id, booking.contacted)}
                              className={`px-2 py-0.5 rounded-md text-[8.5px] font-extrabold uppercase border flex items-center gap-1 transition-all ${
                                booking.contacted
                                  ? "bg-emerald-50 border-emerald-250 text-emerald-600 dark:bg-[#102a1e] dark:border-[#104a30] dark:text-emerald-455"
                                  : "bg-white border-slate-200 text-slate-500 dark:bg-slate-850 dark:border-slate-800"
                              }`}
                            >
                              <span className="material-symbols-outlined text-[10px] font-bold">
                                {booking.contacted ? "check_box" : "check_box_outline_blank"}
                              </span>
                              <span>{booking.contacted ? t("admin.texts.txt_218") : t("admin.texts.txt_219")}</span>
                            </button>
                            
                            <button
                              onClick={() => handleDeleteBooking(booking._id)}
                              className="text-rose-500 hover:text-rose-700 w-7 h-7 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors flex items-center justify-center border border-slate-200/50 dark:border-slate-800/80 shrink-0"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </div>

                        {/* Contact details row */}
                        <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-350">
                          <a href={`tel:${booking.phone}`} className="flex items-center gap-1 bg-slate-100/80 dark:bg-[#1a1626]/80 px-2.5 py-1 rounded-lg border border-slate-200/40 dark:border-slate-800/80 font-mono">
                            <span className="material-symbols-outlined text-[9px] font-bold">call</span>
                            <span>{booking.phone}</span>
                          </a>
                          <a href={`mailto:${booking.email}`} className="flex items-center gap-1 bg-slate-100/80 dark:bg-[#1a1626]/80 px-2.5 py-1 rounded-lg border border-slate-200/40 dark:border-slate-800/80 font-mono truncate max-w-[190px]">
                            <span className="material-symbols-outlined text-[9px] font-bold">mail</span>
                            <span className="truncate">{booking.email}</span>
                          </a>
                        </div>

                        {/* Message content */}
                        <p className="text-xs text-slate-655 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 leading-relaxed italic">
                          "{booking.message || t('adminTabs.bookings.empty')}"
                        </p>

                        {deleteDays !== null && (
                          <div className="text-[9px] text-rose-600 dark:text-rose-450 bg-rose-500/5 border border-rose-500/10 p-2 rounded-lg font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">info</span>
                            <span>{t("adminTabs.bookings.autoDelete", { days: deleteDays })}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-3xl opacity-40">calendar_today</span>
                <p className="text-sm font-semibold">{t("adminTabs.bookings.empty")}</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PARTNERS */}
        {activeTab === "partners" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
            
            {/* Left panel: Add partner form */}
            <div className="lg:col-span-4 bg-white dark:bg-[#12111a] rounded-xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">add_link</span>
                    {t("adminTabs.partners.addBtn")}
                  </h3>
              
              <form onSubmit={handleAddPartner} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">{t("adminTabs.partners.partnerName")}</label>
                  <input
                    type="text"
                    required
                    placeholder={t("adminTabs.partners.partnerNamePlaceholder")}
                    value={partnerForm.name}
                    onChange={(e) => setPartnerForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-805 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-455 uppercase tracking-wider">{t("adminTabs.partners.website")}</label>
                  <textarea
                    rows="5"
                    required
                    placeholder={t("adminTabs.partners.websitePlaceholder")}
                    value={partnerForm.iframeUrl}
                    onChange={(e) => setPartnerForm(p => ({ ...p, iframeUrl: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-805 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-mono leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="submit"
                    value="save"
                    className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs py-3 rounded-xl transition-colors border border-slate-200 dark:border-slate-750 active:scale-98"
                  >
                    Liên Kết
                  </button>
                  <button
                    type="submit"
                    value="export-iframe"
                    className="w-full bg-primary hover:bg-indigo-650 text-white font-bold text-xs py-3 rounded-xl hover:scale-102 transition-transform shadow-md flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <span className="material-symbols-outlined text-sm">iframe</span>
                    {t("adminTabs.partners.createExportBtn")}
                  </button>
                </div>
              </form>
            </div>

            {/* Right panel: Active partner list & iframe preview */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* List */}
              <div className="bg-white dark:bg-[#12111a] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col justify-between min-h-[350px]">
                
                {/* Header with Search */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#181622]/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-550 dark:text-slate-455 text-base">handshake</span>
                    Danh Sách Đối Tác ({partners.length})
                  </h3>
                  
                  {/* Real-time search */}
                  <div className="w-full sm:w-56 relative shrink-0">
                    <input
                      type="text"
                      placeholder={t("adminTabs.partners.search")}
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
                        <div key={partner._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Logo from Favicon */}
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1f1929] border border-slate-200/50 dark:border-slate-800 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
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
                              <p className="text-[10px] text-slate-400 truncate max-w-sm font-mono mt-0.5">{partner.iframeUrl}</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <button
                              onClick={() => setExportPartner(partner)}
                              className="bg-primary hover:bg-indigo-650 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors shadow-sm active:scale-95"
                            >
                              <span className="material-symbols-outlined text-[10px]">code</span>
                              {t("adminTabs.partners.exportIframe")}
                            </button>
                            <button
                              onClick={() => setExportLinkPartner(partner)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors shadow-sm active:scale-95"
                            >
                              <span className="material-symbols-outlined text-[10px]">link</span>
                              {t("adminTabs.partners.exportLink")}
                            </button>
                            <button
                              onClick={() => setPreviewPartner(partner)}
                              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px] px-3.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-750 transition-colors shadow-sm active:scale-95"
                            >
                              Xem Thử
                            </button>
                            <button
                              onClick={() => handleDeletePartner(partner._id)}
                              className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-450 p-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                              title={t("adminTabs.partners.delete")}
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
                      <p className="italic">{t("adminTabs.partners.empty")}</p>
                    ) : (
                      <div className="space-y-2 max-w-sm">
                        <p className="font-bold text-slate-500 dark:text-slate-350 not-italic">{t("adminTabs.partners.empty")}</p>
                        <p className="text-[11px] leading-relaxed">
                          {t("adminTabs.partners.createInstruction")}
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
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161420] text-slate-750 dark:text-slate-350 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        Trước
                      </button>
                      <button
                        onClick={() => setPartnerPage(p => Math.min(p + 1, totalPartnerPages))}
                        disabled={partnerPage === totalPartnerPages}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161420] text-slate-750 dark:text-slate-350 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview modal drawer formatted as a browser frame */}
              {previewPartner && (
                <div className="bg-white dark:bg-[#12111a] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-550 dark:text-slate-400 text-sm">visibility</span>
                      {t("adminTabs.partners.previewPrefix")} {previewPartner.name}
                    </h4>
                    <button 
                      onClick={() => setPreviewPartner(null)}
                      className="text-slate-400 hover:text-slate-650 dark:hover:text-white"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>

                  {/* Modern Browser Mock Frame */}
                  <div className="w-full bg-[#f1f5f9] dark:bg-[#1c1a27] rounded-xl overflow-hidden border border-slate-250 dark:border-slate-800 flex flex-col shadow-inner">
                    {/* Browser top-bar */}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-200/60 dark:bg-slate-900/60 border-b border-slate-250 dark:border-slate-800 select-none">
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      </div>
                      <div className="flex-grow max-w-md mx-auto bg-white/70 dark:bg-black/30 rounded-lg text-[10px] text-center text-slate-500 py-1 font-mono truncate px-4">
                        {previewPartner.iframeUrl.includes('<iframe') ? "Embedded Code Output" : previewPartner.iframeUrl}
                      </div>
                    </div>
                    
                    {/* Browser window body */}
                    <div className="w-full bg-white dark:bg-[#100e16] min-h-[420px] relative z-10 flex">
                      {previewPartner.iframeUrl.includes('<iframe') ? (
                        <div 
                          className="w-full h-full min-h-[420px] flex [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:min-h-[420px]"
                          dangerouslySetInnerHTML={{ __html: previewPartner.iframeUrl }}
                        />
                      ) : (
                        <iframe
                          src={previewPartner.iframeUrl}
                          className="w-full h-full min-h-[420px] flex-grow"
                          style={{ border: 'none' }}
                          allowFullScreen
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* TAB 4: PACKAGES */}
        {activeTab === "packages" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
            
            {/* Left panel: forms */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Create package form */}
              <div className="bg-white dark:bg-[#12111a] rounded-xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-5">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">add_card</span>
                  {t("adminTabs.packages.createTpl")}
                </h3>
                
                <form onSubmit={handleCreatePackage} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">{t("adminTabs.packages.createName")}</label>
                    <input
                      type="text"
                      required
                      placeholder={t("adminTabs.packages.createNamePlaceholder")}
                      value={newPkg.name}
                      onChange={(e) => setNewPkg(p => ({ ...p, name: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">{t("adminTabs.packages.createDurationValue")}</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder={t("adminTabs.packages.createDurationPlaceholder")}
                        value={newPkg.duration}
                        onChange={(e) => setNewPkg(p => ({ ...p, duration: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">{t("adminTabs.packages.createDurationType")}</label>
                      <select
                        value={newPkg.durationUnit}
                        onChange={(e) => setNewPkg(p => ({ ...p, durationUnit: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-855 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                      >
                        <option value="months">{t("adminTabs.packages.months")}</option>
                        <option value="days">{t("adminTabs.packages.days")}</option>
                        <option value="years">{t("adminTabs.packages.years")}</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">{t("adminTabs.packages.createBenefits")}</label>
                    <textarea
                      rows="4"
                      placeholder="Quyền lợi 1&#10;Quyền lợi 2&#10;Quyền lợi 3"
                      value={newPkg.benefits}
                      onChange={(e) => setNewPkg(p => ({ ...p, benefits: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-primary hover:bg-indigo-650 text-white font-bold text-xs shadow-sm hover:scale-[1.01] active:scale-98 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">save</span>
                    {t("adminTabs.packages.createBtn")}
                  </button>
                </form>
              </div>

              {/* Grant package form */}
              <div className="bg-white dark:bg-[#12111a] rounded-xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-5">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-500 text-base">card_membership</span>
                  {t("adminTabs.packages.grant")}
                </h3>

                <form onSubmit={handleAssignPackageToUser} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">{t("adminTabs.packages.grantEmail")}</label>
                    <input
                      type="text"
                      required
                      placeholder={t("adminTabs.packages.grantEmailPlaceholder")}
                      value={assignForm.email}
                      onChange={(e) => setAssignForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">{t("adminTabs.packages.grantSelect")}</label>
                    <select
                      required
                      value={assignForm.packageId}
                      onChange={(e) => setAssignForm(p => ({ ...p, packageId: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                    >
                      <option value="">{t("adminTabs.packages.grantSelectOption")}</option>
                      {packageTemplates.map(pkg => (
                        <option key={pkg._id} value={pkg._id}>
                          {pkg.name} ({pkg.duration} {pkg.durationUnit === "days" ? t("adminTabs.packages.days") : pkg.durationUnit === "years" ? t("adminTabs.packages.years") : t("adminTabs.packages.months")})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">{t("adminTabs.packages.grantCustomDays")}</label>
                    <input
                      type="number"
                      min="1"
                      placeholder={t("adminTabs.packages.grantCustomDaysPlaceholder")}
                      value={assignForm.customDuration || ""}
                      onChange={(e) => setAssignForm(p => ({ ...p, customDuration: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm hover:scale-[1.01] active:scale-98 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">verified</span>
                    {t("adminTabs.packages.grantBtn")}
                  </button>
                </form>
              </div>

            </div>

            {/* Right panel: Templates list & Member packages search */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Search and delete user packages */}
              <div className="bg-white dark:bg-[#12111a] rounded-xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-5">
                <div className="space-y-1">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <span className="material-symbols-outlined text-rose-500 text-base">manage_accounts</span>
                  {t("adminTabs.packages.manageTitle")}
                </h3>
                  <p className="text-[10px] text-slate-400 font-medium">{t("adminTabs.packages.manageDesc")}</p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder={t("adminTabs.packages.managePlaceholder")}
                    value={memberPkgSearchEmail}
                    onChange={(e) => setMemberPkgSearchEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearchUserPackages(); }}
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                  />
                  <button
                    onClick={() => handleSearchUserPackages()}
                    className="px-5 bg-zinc-900 hover:bg-zinc-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-sm">search</span>
                    {t("adminTabs.packages.manageSearch")}
                  </button>
                </div>

                {searchedMemberBio && (
                  <div className="border border-zinc-150 dark:border-zinc-800/85 rounded-xl p-4 space-y-4 bg-zinc-50/50 dark:bg-[#181622]/40 animate-fadeIn">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-bold text-xs text-slate-855 dark:text-white">{searchedMemberBio.displayName}</h4>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{searchedMemberBio.email}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[8px] font-bold text-slate-450 uppercase tracking-wider">{t("adminTabs.packages.expiry")}</div>
                        <div className="text-[10px] font-mono font-bold text-rose-500 mt-0.5">{formatExpiration(searchedMemberBio.expiresAt)}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t("adminTabs.packages.currentPackages")}</span>
                      
                      {/* Base package (non-deletable) */}
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-[#1c1c1e] rounded-xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                          <div>
                            <span className="text-xs font-bold text-slate-850 dark:text-zinc-200">{searchedMemberBio.serviceLabel || t("adminTabs.packages.defaultPackage")} {t("adminTabs.packages.originalPackage")}</span>
                            <span className="text-[9px] text-zinc-400 block mt-0.5">{t("adminTabs.packages.packageDefaultNote")}</span>
                          </div>
                        </div>
                        <span className="text-[9.5px] font-bold text-zinc-455 italic">{t("adminTabs.packages.defaultBadge")}</span>
                      </div>

                      {/* Custom packages */}
                      {searchedMemberBio.packages && searchedMemberBio.packages.length > 0 ? (
                        searchedMemberBio.packages.map((pkg) => (
                          <div key={pkg._id} className="flex items-center justify-between p-3 bg-white dark:bg-[#1c1c1e] rounded-xl border border-zinc-200/50 dark:border-zinc-800/60 hover:border-red-500/20 transition-all shadow-sm">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: pkg.color || "#10b981" }} />
                              <div>
                                <span className="text-xs font-bold text-slate-850 dark:text-zinc-200">{pkg.name}</span>
                                <span className="text-[9px] text-zinc-400 block mt-0.5">{t("adminTabs.packages.grantedOn")} {new Date(pkg.addedAt).toLocaleDateString("vi-VN")} (+{pkg.duration} {pkg.durationUnit === "days" ? t("adminTabs.packages.days") : pkg.durationUnit === "years" ? t("adminTabs.packages.years") : t("adminTabs.packages.months")})</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveUserPackage(pkg._id)}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-455 font-bold text-[9px] uppercase tracking-wide transition-colors active:scale-95"
                            >
                                  <span className="material-symbols-outlined text-[10px]">cancel</span>
                                  {t("adminTabs.packages.cancelPackage")}
                                </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-zinc-455 italic">{t("adminTabs.packages.noPackages")}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Package templates list */}
              <div className="bg-white dark:bg-[#12111a] rounded-xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-5">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-550 dark:text-slate-450 text-base">list_alt</span>
                    {t("adminTabs.packages.templates")} ({packageTemplates.length})
                  </h3>

                {packageTemplates.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {packageTemplates.map(pkg => (
                      <div 
                        key={pkg._id} 
                        className="rounded-xl p-4 border border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10 space-y-3 relative group"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: pkg.color || "#6366f1" }} />
                            <h4 className="font-bold text-xs text-slate-850 dark:text-white uppercase tracking-wide">{pkg.name}</h4>
                          </div>
                          <button
                            onClick={() => handleDeletePackageTemplate(pkg._id)}
                            className="text-zinc-455 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title={t("adminTabs.packages.delTpl")}
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>

                        <div className="flex justify-between text-[10px] text-zinc-455">
                          <span>{t("adminTabs.packages.duration")}</span>
                          <span className="font-bold text-slate-700 dark:text-zinc-300 font-mono">+{pkg.duration} {pkg.durationUnit === "days" ? t("adminTabs.packages.days") : pkg.durationUnit === "years" ? t("adminTabs.packages.years") : t("adminTabs.packages.months")}</span>
                        </div>

                        <div className="flex justify-between items-center bg-white dark:bg-[#1c1c1e] p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className="material-symbols-outlined text-[11px] text-amber-500">redeem</span>
                            <span className="font-mono text-xs font-black tracking-widest text-slate-800 dark:text-slate-200 truncate">{pkg.giftCode || "NONE"}</span>
                          </div>
                          <button
                            onClick={() => handleRegenerateGiftCode(pkg._id)}
                            className="text-[9px] font-bold text-primary hover:text-indigo-600 dark:text-[#a5b4fc] dark:hover:text-[#c7d2fe] bg-primary/5 dark:bg-[#a5b4fc]/10 px-2 py-1 rounded-md transition-colors whitespace-nowrap"
                            title={t("adminTabs.packages.newCode")}
                          >
                                <span className="material-symbols-outlined text-[10px]">refresh</span>
                                {t("adminTabs.packages.newCodeBtn")}
                              </button>
                        </div>

                        {pkg.benefits && pkg.benefits.length > 0 && (
                          <div className="space-y-1.5 border-t border-zinc-200/50 dark:border-zinc-800/50 pt-2.5">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">{t("adminTabs.packages.benefits")}</span>
                            <ul className="space-y-1">
                              {pkg.benefits.slice(0, 3).map((benefit, i) => (
                                <li key={i} className="text-[9.5px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-zinc-400 shrink-0" />
                                  {benefit}
                                </li>
                              ))}
                              {pkg.benefits.length > 3 && (
                                <li className="text-[8.5px] italic text-zinc-400 pl-2">{t("adminTabs.packages.andMore", { count: pkg.benefits.length - 3 })}</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-6">{t("adminTabs.packages.emptyTpl")}</p>
                )}
              </div>

            </div>

          </div>
        )}

        {/* TAB: PAYMENTS */}
        {activeTab === "payments" && (
          <div className="animate-fadeIn">
            <AdminPaymentsTab />
          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === "settings" && (
          <AdminSettingsTab
            data={data}
            updateSystemSettings={updateSystemSettings}
            updateAdvertisement={updateAdvertisement}
            showNotification={showNotification}
            handleLogout={handleLogout}
            uploadingAd={uploadingAd}
            handleAdImageUpload={handleAdImageUpload}
            handleAdDelete={handleAdDelete}
          />
        )}

        {/* TAB 6: SUPPORT TICKETS */}
        {activeTab === "support" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#12111a] p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-[#a5b4fc] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">support_agent</span>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {t("adminSupport.totalReq")}
                  </div>
                  <div className="text-lg font-extrabold text-slate-850 dark:text-white mt-0.5">{supportTickets.length || 0}</div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#12111a] p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-[#fde047] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl animate-pulse">pending</span>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {t("adminSupport.pending")}
                  </div>
                  <div className="text-lg font-extrabold text-slate-850 dark:text-white mt-0.5">{pendingTicketsCount}</div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#12111a] p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-[#86efac] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {t("adminSupport.resolved")}
                  </div>
                  <div className="text-lg font-extrabold text-slate-850 dark:text-white mt-0.5">
                    {Math.max(0, (supportTickets.length || 0) - pendingTicketsCount)}
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Content Card */}
            <div className="bg-white dark:bg-[#12111a] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 sm:p-8 space-y-6">
              
              {/* Header section with Filter controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-5">
                <div className="space-y-1">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  {t("adminSupport.statusTitle")}
                </h3>
                  <p className="text-[10px] text-slate-400">
                  {t("adminSupport.statusDesc")}
                </p>
                </div>
                
                {/* Status Chips */}
                <div className="flex gap-2">
                  {[
                    { id: "", label: t("adminSupport.filterAll") },
                    { id: "pending", label: t("adminSupport.filterPending") },
                    { id: "resolved", label: t("adminSupport.filterResolved") }
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => {
                        setSupportStatusFilter(filter.id);
                        setSupportPage(1);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        supportStatusFilter === filter.id
                          ? "bg-primary text-white shadow-md"
                          : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tickets Table / List */}
              {supportTickets.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    {supportTickets.map(ticket => {
                      const nameInitials = ticket.fullName ? ticket.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'HT';
                      const formattedDate = new Date(ticket.createdAt).toLocaleString('vi-VN');
                      
                      return (
                        <div
                          key={ticket._id}
                          className="p-5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-[#161420]/30 hover:border-slate-200 dark:hover:border-slate-700/60 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4"
                        >
                          {/* Left column: User info & description */}
                          <div className="flex gap-4 items-start min-w-0">
                            {/* Initials Avatar */}
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md">
                              {nameInitials}
                            </div>
                            
                            <div className="space-y-2 min-w-0">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-extrabold text-sm text-slate-800 dark:text-white">{ticket.fullName}</span>
                                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                                    ticket.status === 'pending'
                                      ? "bg-amber-500/10 text-amber-500"
                                      : "bg-emerald-500/10 text-emerald-500"
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${ticket.status === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                                    {ticket.status === "pending" ? t("adminSupport.reqPending") : t("adminSupport.reqResolved")}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5">{t("adminSupport.sendTime")} {formattedDate}</p>
                              </div>

                              <div className="space-y-1">
                                <div className="flex gap-2 items-center text-xs">
                                  <span className="font-bold text-slate-450 dark:text-zinc-550 shrink-0">Email:</span>
                                  <span className="font-semibold text-slate-700 dark:text-zinc-300 break-all select-all">{ticket.email}</span>
                                </div>
                                <div className="flex gap-2 items-center text-xs">
                                  <span className="font-bold text-slate-450 dark:text-zinc-550 shrink-0">{t("adminSupport.zaloPhone")}</span>
                                  <span className="font-semibold text-slate-700 dark:text-zinc-300 select-all">{ticket.phone}</span>
                                </div>
                              </div>

                              <div className="pt-2">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t("adminSupport.inquiry")}</span>
                                <p className="mt-1 text-xs text-slate-650 dark:text-slate-300 leading-relaxed font-semibold bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-3.5 rounded-xl whitespace-pre-wrap select-text">
                                  {ticket.issue}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Right column: Action buttons */}
                          <div className="flex md:flex-col gap-2 shrink-0 items-end justify-end pt-2 md:pt-0">
                            {/* Zalo Direct Link Button */}
                            <a
                              href={`https://zalo.me/${ticket.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full sm:w-auto px-4 py-2.5 bg-[#0068ff] hover:bg-[#005ad4] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/10 flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all text-center"
                              style={{ minHeight: 0, minWidth: 0 }}
                            >
                              <span className="material-symbols-outlined text-sm">chat</span>
                                <span className="material-symbols-outlined text-sm">chat</span>
                                {t("adminSupport.chatZalo")}
                              </a>

                            {/* Resolve Ticket Button */}
                            {ticket.status === 'pending' && (
                              <button
                                onClick={() => handleResolveTicket(ticket._id)}
                                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all"
                                style={{ minHeight: 0, minWidth: 0 }}
                              >
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                {t("adminSupport.markResolved")}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination Section */}
                  {supportTotalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-5">
                      <span className="text-xs font-bold text-slate-400">
                        Trang {supportPage} / {supportTotalPages}
                      </span>
                      <div className="flex gap-2">
                        <button
                          disabled={supportPage === 1}
                          onClick={() => setSupportPage(prev => Math.max(1, prev - 1))}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-850 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                        >
                          Trước
                        </button>
                        <button
                          disabled={supportPage === supportTotalPages}
                          onClick={() => setSupportPage(prev => Math.min(supportTotalPages, prev + 1))}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-850 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                        >
                          Sau
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center mx-auto text-slate-400">
                    <span className="material-symbols-outlined text-2xl">support_agent</span>
                  </div>
                  <p className="text-xs text-slate-450 italic font-medium">{t("adminSupport.notFound")}</p>
                </div>
              )}
            </div>
          </div>
        )}

      </section>

      {/* CONFIRM DELETE BIO ACCOUNT MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#12111a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-500">
              <span className="material-symbols-outlined text-2xl animate-pulse">warning</span>
              <h3 className="font-extrabold text-sm uppercase tracking-wider">{t("adminPanel.modals.delAccountTitle")}</h3>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t("adminPanel.modals.delAccountReq1")} <strong>{deleteTarget.displayName}</strong> ({deleteTarget.email}) {t("adminPanel.modals.delAccountReq2")} <code>/bio/{deleteTarget.slug}</code>.
            </p>
            <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30 font-semibold">
              {t("adminPanel.modals.delAccountWarn")}
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">{t("adminPanel.modals.delPassLabel")}</label>
              <input
                type="password"
                placeholder={t("adminPanel.modals.delPassPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleExecuteDelete(); }}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                autoFocus
              />
              {confirmError && (
                <p className="text-[10px] text-rose-555 font-bold mt-1">{confirmError}</p>
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
                {t("adminPanel.core.modalCancel")}
              </button>
              <button
                onClick={handleExecuteDelete}
                className="flex-1 bg-red-650 hover:bg-red-600 text-white font-bold text-xs py-3 rounded-xl hover:scale-102 transition-transform shadow-md"
              >
                  {t("adminPanel.modals.delConfirmBtn")}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT DIRECT PARTNER LINK MODAL */}
      {exportLinkPartner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#12111a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-405">
                <span className="material-symbols-outlined text-xl">link</span>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-white">{t("adminPanel.modals.exportLinkTitle")} {exportLinkPartner.name}</h3>
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
                {t("adminPanel.modals.exportLinkDesc")}
              </p>

              <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30 space-y-2">
                <span className="block text-[9px] font-bold text-emerald-700 dark:text-emerald-305 uppercase tracking-wider">{t("adminPanel.modals.exportLinkReady")}</span>
                <textarea
                  readOnly
                  rows={3}
                  className="w-full bg-white dark:bg-black/40 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-3 text-[10px] font-mono text-slate-700 dark:text-emerald-200 focus:outline-none resize-none"
                  value={getPartnerBioEditorUrl(exportLinkPartner)}
                />
              </div>

              <div className="bg-slate-50 dark:bg-[#1f1929] p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                If partner website already has member's email, auto-pass via param: <code>{`${getPartnerBioEditorUrl(exportLinkPartner)}&email=CUSTOMER_EMAIL`}</code>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setExportLinkPartner(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs py-3 rounded-xl transition-all"
              >
                {t("adminPanel.core.iframeClose")}
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
                {t("adminPanel.modals.copyLinkBtn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT IFRAME PARTNER MODAL */}
      {exportPartner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#12111a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <span className="material-symbols-outlined text-xl">share</span>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-white">{t("adminPanel.modals.exportIframeTitle")} {exportPartner.name}</h3>
              </div>
              <button 
                onClick={() => setExportPartner(null)}
                className="text-slate-400 hover:text-slate-655 dark:hover:text-white"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                {t("adminPanel.modals.exportIframeDesc1")} <strong>Hugo Studio</strong> {t("adminPanel.modals.exportIframeDesc2")} <code>email</code> {t("adminPanel.modals.exportIframeDesc3")}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-indigo-50/70 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                  <span className="block text-[9px] font-bold text-indigo-600 dark:text-indigo-305 uppercase tracking-wider">{t("adminPanel.modals.exportIframeReady")}</span>
                  <p className="mt-1 text-[10px] font-mono text-slate-650 dark:text-slate-305 break-all">
                    {getPartnerBioEditorUrl(exportPartner)}
                  </p>
                </div>
                <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                  <span className="block text-[9px] font-bold text-emerald-700 dark:text-emerald-305 uppercase tracking-wider">{t("adminPanel.modals.exportIframeAuto")}</span>
                  <p className="mt-1 text-[10px] text-slate-650 dark:text-slate-305 leading-relaxed">
                    {t("adminPanel.modals.exportIframeAutoDesc")}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-[#1f1929] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2">
                <span className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">{t("adminPanel.modals.exportIframeCode")}</span>
                <textarea
                  readOnly
                  rows={4}
                  className="w-full bg-slate-100 dark:bg-black/40 border border-slate-250 dark:border-slate-800 rounded-xl p-3 text-[10px] font-mono text-indigo-600 dark:text-[#a5b4fc] focus:outline-none resize-none"
                  value={getPartnerBioIframeCode(exportPartner)}
                />
              </div>

              <div className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl space-y-1.5 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs">info</span>
                  <span className="material-symbols-outlined text-xs">info</span>
                  {t("adminPanel.modals.exportIframeGuide")}
                </p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>{t("adminPanel.modals.exportIframeRule1")}</li>
                  <li>{t("adminPanel.modals.exportIframeRule2")}</li>
                  <li>{t("adminPanel.modals.exportIframeRule3")}</li>
                </ol>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setExportPartner(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs py-3 rounded-xl transition-all"
              >
                {t("adminPanel.core.iframeClose")}
              </button>
              <button
                onClick={() => {
                  const code = getPartnerBioIframeCode(exportPartner);
                  navigator.clipboard.writeText(code);
                  showNotification(`${t("adminPanel.core.copySuccess")} ${exportPartner.name}! 📋`);
                  setExportPartner(null);
                }}
                className="flex-grow bg-primary hover:bg-indigo-650 text-white font-bold text-xs py-3 rounded-xl hover:scale-102 transition-transform shadow-md"
              >
                {t("adminPanel.core.iframeCopy")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM REUSABLE CONFIRM MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#12111a] border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-500">
              <span className="material-symbols-outlined text-2xl">warning</span>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-white">{t("adminPanel.core.modalConfirmTitle")}</h3>
            </div>
            <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmModal({ isOpen: false, message: "", onConfirm: null })}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs py-3 rounded-xl transition-all"
              >
                {t("adminPanel.core.modalCancel")}
              </button>
              <button
                onClick={() => {
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                  setConfirmModal({ isOpen: false, message: "", onConfirm: null });
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md"
              >
                {t("adminPanel.core.modalConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
