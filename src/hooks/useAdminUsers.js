import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { userApi } from "../services/api/modules/userApi";

/**
 * Toàn bộ state liên quan đến danh sách thành viên tập trung ở đây.
 * AdminPanel.jsx chỉ cần gọi hook này — không còn hàng chục useState rải rác.
 */
export function useAdminUsers({ isAuthenticated, showNotification }) {
  const { t } = useTranslation();

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

  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState({
    total: 0, active: 0, pending: 0, rejected: 0,
    locked: 0, lifetime: 0, locationAnomaly: 0,
  });
  const [loading, setLoading] = useState(false);

  const [copiedUserId, setCopiedUserId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState("");

  // Debounce searchInput -> searchQuery
  useEffect(() => {
    const timer = setTimeout(() => { setSearchQuery(searchInput); setUserPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchUsers = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await userApi.getBios({
        search: searchQuery, status: statusFilter, expiration: expirationFilter,
        sortBy: userSortBy, sortOrder: userSortOrder, page: userPage, limit: userLimit,
      });
      if (res?.bios) {
        setUsers(res.bios);
        setTotalPages(res.pagination?.pages ?? res.pagination?.totalPages ?? 1);
        setTotalMatchedUsers(res.pagination?.totalMatched ?? res.pagination?.total ?? res.bios.length);
        if (res.stats) setUserStats(res.stats);
      }
    } catch (e) { console.error("useAdminUsers:fetchUsers", e); }
    finally { setLoading(false); }
  }, [isAuthenticated, searchQuery, statusFilter, expirationFilter, userSortBy, userSortOrder, userPage, userLimit]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCopyText = useCallback((text, userId) => {
    navigator.clipboard.writeText(text);
    setCopiedUserId(userId);
    showNotification(t("admin.texts.txt_137", "Đã sao chép vào bộ nhớ tạm"));
    setTimeout(() => setCopiedUserId(null), 2000);
  }, [showNotification, t]);

  const handleToggleBioStatus = useCallback(async (bioId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "locked" : "active";
    try {
      await userApi.updateStatus(bioId, newStatus);
      setUsers(prev => prev.map(u => u._id === bioId ? { ...u, status: newStatus } : u));
      showNotification(`Đã ${newStatus === "active" ? "mở khóa" : "khóa"} thành viên!`);
    } catch { showNotification("Lỗi cập nhật trạng thái", "error"); }
  }, [showNotification]);

  const handleToggleVip = useCallback(async (bioId, currentVip) => {
    try {
      await userApi.setVip(bioId, !currentVip);
      setUsers(prev => prev.map(u => u._id === bioId ? { ...u, starVip: !currentVip } : u));
      showNotification(!currentVip ? "Đã gắn hạng Star-VIP!" : "Đã gỡ hạng Star-VIP.");
    } catch { showNotification("Lỗi cập nhật hạng thành viên", "error"); }
  }, [showNotification]);

  const handleExecuteDelete = useCallback(async () => {
    setConfirmError("");
    if (!confirmPassword) return setConfirmError(t("admin.texts.txt_139", "Vui lòng nhập mật khẩu xác nhận"));
    try {
      await userApi.deleteBio(deleteTarget._id);
      showNotification(`Đã xóa vĩnh viễn tài khoản của ${deleteTarget.displayName}! 🗑️`);
      setUsers(prev => prev.filter(u => u._id !== deleteTarget._id));
      setDeleteTarget(null);
      setConfirmPassword("");
      fetchUsers();
    } catch { setConfirmError(t("admin.texts.txt_142", "Mật khẩu Admin không đúng hoặc lỗi hệ thống")); }
  }, [confirmPassword, deleteTarget, fetchUsers, showNotification, t]);

  const getExpirationDaysOnly = useCallback((expiresAt) => {
    if (!expiresAt) return 0;
    const today = new Date(); today.setHours(0,0,0,0);
    const exp = new Date(expiresAt); exp.setHours(0,0,0,0);
    return Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
  }, []);

  const formatExpiration = useCallback((expiresAt) => {
    if (!expiresAt) return "Vĩnh viễn";
    const days = getExpirationDaysOnly(expiresAt);
    if (days < 0) return "Đã hết hạn";
    if (days === 0) return "Hôm nay";
    return `Còn ${days} ngày`;
  }, [getExpirationDaysOnly]);

  const loadMoreUsers = useCallback(() => {
    if (userPage < totalPages) setUserPage(p => p + 1);
  }, [userPage, totalPages]);

  return {
    users, userStats, loading,
    searchInput, setSearchInput, searchQuery,
    statusFilter, setStatusFilter,
    expirationFilter, setExpirationFilter,
    userSortBy, setUserSortBy,
    userSortOrder, setUserSortOrder,
    userPage, setUserPage,
    userLimit, setUserLimit,
    totalPages, totalMatchedUsers,
    copiedUserId,
    deleteTarget, setDeleteTarget,
    confirmPassword, setConfirmPassword,
    confirmError, setConfirmError,
    fetchUsers,
    handleCopyText, handleToggleBioStatus, handleToggleVip, handleExecuteDelete,
    getExpirationDaysOnly, formatExpiration,
    loadMoreUsers, hasMoreUsers: userPage < totalPages,
  };
}
