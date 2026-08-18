import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import UserDetailModal from './UserDetailModal';
import { formatJoyDual, formatJoyCompact } from '../../utils/joyFormatter';
import { toDenom } from '../../../shared/joyCurrency.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const AdminUsersTab = ({
  userStats,
  searchInput,
  setSearchInput,
  statusFilter,
  setStatusFilter,
  setUserPage,
  expirationFilter,
  setExpirationFilter,
  userSortBy,
  setUserSortBy,
  userSortOrder,
  setUserSortOrder,
  userLimit,
  setUserLimit,
  totalMatchedUsers,
  users,
  handleCopyText,
  copiedUserId,
  handleToggleBioStatus,
  handleToggleVip,
  triggerConfirm,
  setDeleteTarget,
  userPage,
  totalPages,
  searchQuery,
  getExpirationDaysOnly,
  formatExpiration,
  loadMoreUsers,
  hasMoreUsers,
}) => {
  const { t } = useTranslation();
  const [selectedVerificationUser, setSelectedVerificationUser] = useState(null);
  const [inspectingUser, setInspectingUser] = useState(null);
  const [onlineStatuses, setOnlineStatuses] = useState({});
  const sentinelRef = useRef(null);

  const stableLoadMore = useCallback(() => {
    if (hasMoreUsers && loadMoreUsers) loadMoreUsers();
  }, [hasMoreUsers, loadMoreUsers]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) stableLoadMore(); },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [stableLoadMore]);

  useEffect(() => {
    const emails = (users || []).map(u => u.email).filter(Boolean);
    if (emails.length === 0) return;

    const pollStatuses = () => {
      fetch(`${API_BASE_URL}/presence/status?emails=${encodeURIComponent(emails.join(','))}`)
        .then(r => r.json())
        .then(setOnlineStatuses)
        .catch(() => {});
    };

    pollStatuses();
    const interval = setInterval(pollStatuses, 15000);
    return () => clearInterval(interval);
  }, [users]);

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1: Total */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white/70 dark:bg-[#141626]/75 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-lg flex items-center gap-3.5 hover:scale-[1.02] transition-all">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-xl">group</span>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">{t("admin.texts.txt_26")}</div>
            <div className="text-lg sm:text-xl font-black text-foreground mt-0.5 leading-tight">{userStats.total.toLocaleString()}</div>
          </div>
        </div>
        {/* Card 2: Active */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white/70 dark:bg-[#141626]/75 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-lg flex items-center gap-3.5 hover:scale-[1.02] transition-all">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-xl">person_play</span>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">{t("admin.texts.txt_27")}</div>
            <div className="text-lg sm:text-xl font-black text-foreground mt-0.5 leading-tight">{userStats.active.toLocaleString()}</div>
          </div>
        </div>
        {/* Card 3: Pending */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white/70 dark:bg-[#141626]/75 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-lg flex items-center gap-3.5 hover:scale-[1.02] transition-all">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-xl">hourglass_empty</span>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Chờ duyệt</div>
            <div className="text-lg sm:text-xl font-black text-foreground mt-0.5 leading-tight">{(userStats.pending || 0).toLocaleString()}</div>
          </div>
        </div>
        {/* Card 4: Rejected */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white/70 dark:bg-[#141626]/75 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-lg flex items-center gap-3.5 hover:scale-[1.02] transition-all">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-xl">cancel</span>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">Từ chối</div>
            <div className="text-lg sm:text-xl font-black text-foreground mt-0.5 leading-tight">{(userStats.rejected || 0).toLocaleString()}</div>
          </div>
        </div>
        {/* Card 5: Locked */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white/70 dark:bg-[#141626]/75 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-lg flex items-center gap-3.5 hover:scale-[1.02] transition-all">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-xl">block</span>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">{t("admin.texts.txt_28")}</div>
            <div className="text-lg sm:text-xl font-black text-foreground mt-0.5 leading-tight">{userStats.locked.toLocaleString()}</div>
          </div>
        </div>
        {/* Card 6: Lifetime */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white/70 dark:bg-[#141626]/75 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-lg flex items-center gap-3.5 hover:scale-[1.02] transition-all">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-xl">workspace_premium</span>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">{t("admin.texts.txt_29")}</div>
            <div className="text-lg sm:text-xl font-black text-foreground mt-0.5 leading-tight">{userStats.lifetime.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/70 dark:bg-[#141626]/75 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl border border-white/20 dark:border-white/10 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input Capsule */}
          <div className="relative flex-grow">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 text-xl">search</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("admin.texts.txt_55")}
              className="w-full pl-11 pr-10 py-2.5 rounded-full border border-black/5 dark:border-white/10 bg-black/5 dark:bg-black/40 text-xs font-semibold focus:ring-2 focus:ring-blue-500 transition-all placeholder-slate-400 text-foreground outline-none shadow-inner"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center w-6 h-6 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
          
          {/* Filters Capsules */}
          <div className="flex flex-wrap gap-2">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setUserPage(1); }}
              className="px-4 py-2.5 rounded-full border border-black/5 dark:border-white/10 bg-black/5 dark:bg-black/40 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            >
              <option value="">{t("admin.texts.txt_30")}</option>
              <option value="active">{t("admin.texts.txt_31")}</option>
              <option value="pending">Chờ duyệt</option>
              <option value="locked">{t("admin.texts.txt_32")}</option>
            </select>

            {/* Expiration filter */}
            <select
              value={expirationFilter}
              onChange={(e) => { setExpirationFilter(e.target.value); setUserPage(1); }}
              className="px-4 py-2.5 rounded-full border border-black/5 dark:border-white/10 bg-black/5 dark:bg-black/40 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            >
              <option value="">{t("admin.texts.txt_33")}</option>
              <option value="active">{t("admin.texts.txt_34")}</option>
              <option value="expired">{t("admin.texts.txt_35")}</option>
              <option value="lifetime">{t("admin.texts.txt_36")}</option>
            </select>

            {/* Sort by */}
            <select
              value={userSortBy}
              onChange={(e) => { setUserSortBy(e.target.value); setUserPage(1); }}
              className="px-4 py-2.5 rounded-full border border-black/5 dark:border-white/10 bg-black/5 dark:bg-black/40 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt">{t("admin.texts.txt_37")}</option>
              <option value="expiresAt">{t("admin.texts.txt_38")}</option>
              <option value="displayName">{t("admin.texts.txt_39")}</option>
            </select>

            {/* Sort Order Toggle */}
            <button
              onClick={() => setUserSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2.5 rounded-full border border-black/5 dark:border-white/10 bg-black/5 dark:bg-black/40 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 hover:bg-black/10 dark:hover:bg-white/10 transition-all"
            >
              <span className="material-symbols-outlined text-sm font-bold text-blue-500">
                {userSortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
              </span>
              <span>{userSortOrder === 'asc' ? t("admin.texts.txt_56") : t("admin.texts.txt_57")}</span>
            </button>

            {/* Limit filter */}
            <select
              value={userLimit}
              onChange={(e) => { setUserLimit(parseInt(e.target.value)); setUserPage(1); }}
              className="px-4 py-2.5 rounded-full border border-black/5 dark:border-white/10 bg-black/5 dark:bg-black/40 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>{t("admin.texts.txt_40")}</option>
              <option value={20}>{t("admin.texts.txt_41")}</option>
              <option value={50}>{t("admin.texts.txt_42")}</option>
              <option value={100}>{t("admin.texts.txt_43")}</option>
            </select>
          </div>
        </div>
      </div>
      <div className="bg-slate-900/70 dark:bg-[#12131e]/90 backdrop-blur-3xl rounded-[28px] border border-slate-200/40 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-300">
        <div className="px-6 py-4 border-b border-slate-200/40 dark:border-white/10 bg-slate-100/30 dark:bg-white/[0.03] flex justify-between items-center">
          <h3 className="font-extrabold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-500 text-base">group</span>
            {t("admin.texts.txt_229")} ({totalMatchedUsers.toLocaleString()})
          </h3>
        </div>

        {users.length > 0 ? (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 border-b border-slate-200/40 dark:border-white/10 font-black uppercase tracking-widest text-[9px]">
                    <th className="px-6 py-4">{t("admin.texts.txt_44")}</th>
                    <th className="px-6 py-4">Bio Link</th>
                    <th className="px-6 py-4">Ví JOY</th>
                    <th className="px-6 py-4">{t("admin.texts.txt_45")}</th>
                    <th className="px-6 py-4">{t("admin.texts.txt_46")}</th>
                    <th className="px-6 py-4 text-center">{t("admin.texts.txt_47")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/60 font-medium">
                  {users.map((user) => {
                    const bioUrl = `${window.location.origin}/bio/${user.slug}`;
                    return (
                      <tr key={user._id} className="hover:bg-slate-100/40 dark:hover:bg-white/[0.03] transition-all duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-9 h-9 shrink-0">
                              <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-[#221b2b] overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-inner">
                                {user.avatarUrl ? (
                                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="material-symbols-outlined text-slate-400 text-sm">person</span>
                                )}
                              </div>
                              <span
                                title={onlineStatuses[user.email] ? 'Online' : 'Offline'}
                                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#12111a] ${onlineStatuses[user.email] ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-400'}`}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-foreground text-xs truncate">{user.displayName}</div>
                              <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-[11px]">
                          <div className="flex items-center gap-2">
                            <a href={bioUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-400 hover:underline font-bold truncate">
                              /bio/{user.slug}
                            </a>
                            <button
                              onClick={() => handleCopyText(bioUrl, user._id)}
                              className="text-slate-400 hover:text-white shrink-0 flex items-center justify-center w-6 h-6 rounded-md hover:bg-slate-800 transition-colors"
                              title={t("admin.texts.txt_58")}
                            >
                              <span className={`material-symbols-outlined text-xs ${copiedUserId === user._id ? "text-emerald-400 font-bold" : ""}`}>
                                {copiedUserId === user._id ? "check" : "content_copy"}
                              </span>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs font-black text-amber-500 dark:text-amber-400 whitespace-nowrap">
                          <div>{formatJoyDual(user.joyBalance || 0)}</div>
                          {user.joyDenom && (
                            <div className="text-[10px] text-purple-400 font-semibold font-sans">
                              {toDenom(user.joyBalance || 0, user.joyDenom).amount.toLocaleString()} {toDenom(user.joyBalance || 0, user.joyDenom).code}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatExpiration(user.expiresAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.status === 'locked' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/25 shadow-[0_0_12px_rgba(244,63,94,0.15)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                              {t("admin.texts.txt_48")}
                            </span>
                          ) : user.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Chờ duyệt
                            </span>
                          ) : user.status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/25 shadow-[0_0_12px_rgba(244,63,94,0.15)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Từ chối
                            </span>
                          ) : user.verificationRequest?.submitted && !user.isEduVerified ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Thử 30 ngày · Chờ duyệt
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {t("admin.texts.txt_49")}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0">
                            <button
                              onClick={() => setInspectingUser(user)}
                              className="px-3.5 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white shadow-[0_4px_16px_rgba(59,130,246,0.35)] hover:shadow-[0_6px_22px_rgba(59,130,246,0.5)] transition-all duration-300 active:scale-95 flex items-center gap-1.5 whitespace-nowrap shrink-0"
                              title="Soi hồ sơ chi tiết, ví JOY & gửi Email"
                            >
                              <span className="material-symbols-outlined text-[14px]">visibility</span>
                              <span>Soi chi tiết</span>
                            </button>
                            {user.verificationRequest?.submitted && (
                              <button
                                onClick={() => setSelectedVerificationUser(user)}
                                className="px-3.5 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-[0_4px_16px_rgba(168,85,247,0.35)] hover:shadow-[0_6px_22px_rgba(168,85,247,0.5)] transition-all duration-300 active:scale-95 flex items-center gap-1.5 whitespace-nowrap shrink-0"
                                title="Xem hồ sơ yêu cầu xác minh sinh viên"
                              >
                                <span className="material-symbols-outlined text-[14px]">school</span>
                                <span>Hồ sơ</span>
                              </button>
                            )}
                            {user.status === 'locked' || user.status === 'rejected' ? (
                              <button
                                onClick={() => handleToggleBioStatus(user._id, user.status, 'active')}
                                className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 hover:border-emerald-500 shadow-[0_2px_10px_rgba(16,185,129,0.15)] transition-all duration-300 active:scale-95 whitespace-nowrap shrink-0"
                              >
                                Kích hoạt
                              </button>
                            ) : (user.status === 'pending' || (user.status === 'active' && user.verificationRequest?.submitted && !user.isEduVerified)) ? (
                              <button
                                onClick={() => handleToggleBioStatus(user._id, user.status, 'active')}
                                className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 hover:border-emerald-500 shadow-[0_2px_10px_rgba(16,185,129,0.15)] transition-all duration-300 active:scale-95 whitespace-nowrap shrink-0"
                              >
                                Duyệt
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleBioStatus(user._id, 'active', 'locked')}
                                className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 hover:border-rose-500 shadow-[0_2px_10px_rgba(244,63,94,0.15)] transition-all duration-300 active:scale-95 whitespace-nowrap shrink-0"
                              >
                                Khóa
                              </button>
                            )}
                            <button
                              onClick={() => handleToggleVip?.(user._id, user.starVip)}
                              title={user.starVip ? "Gỡ hạng danh dự Star-VIP" : "Gắn hạng danh dự Star-VIP"}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all duration-300 active:scale-95 flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                                user.starVip
                                  ? "bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-500 text-slate-950 shadow-[0_4px_16px_rgba(245,158,11,0.35)]"
                                  : "bg-slate-800/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 border border-slate-700 hover:border-amber-500/30"
                              }`}
                            >
                              <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
                              <span>{user.starVip ? "Star-VIP" : "VIP"}</span>
                            </button>
                            <button
                              onClick={() => triggerConfirm(t("admin.texts.txt_230", { name: user.displayName }), () => setDeleteTarget(user))}
                              className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-800/90 hover:bg-rose-900/80 text-slate-400 hover:text-rose-200 border border-slate-700/80 hover:border-rose-500/40 transition-all duration-300 active:scale-95 whitespace-nowrap shrink-0"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Ultra-Compact Mobile Card List View */}
            <div className="md:hidden p-3 space-y-2.5">
              {users.map((user) => {
                const bioUrl = `${window.location.origin}/bio/${user.slug}`;
                const expDays = getExpirationDaysOnly(user.expiresAt);
                return (
                  <div key={user._id} className="p-3 rounded-2xl bg-slate-900/60 dark:bg-black/50 border border-white/10 shadow-md space-y-2">
                    {/* Header Row: Avatar, Name, Status, JOY */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative w-7 h-7 shrink-0">
                          <div className="w-7 h-7 rounded-full bg-slate-800 overflow-hidden border border-white/10 flex items-center justify-center">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-slate-400 text-xs">person</span>
                            )}
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black ${onlineStatuses[user.email] ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-white text-xs truncate leading-tight">{user.displayName}</div>
                          <div className="text-[9.5px] text-slate-400 truncate leading-none">{user.email}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          {formatJoyCompact(user.joyBalance || 0)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8.5px] font-extrabold border ${
                          user.status === 'locked'
                            ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                            : user.status === 'pending'
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        }`}>
                          {user.status === 'locked' ? 'Khóa' : user.status === 'pending' ? 'Chờ' : 'Active'}
                        </span>
                      </div>
                    </div>

                    {/* Bio Link & Expiration Info Row */}
                    <div className="flex items-center justify-between text-[10px] bg-slate-950/60 px-2.5 py-1 rounded-xl border border-white/5">
                      <div className="flex items-center gap-1.5 min-w-0 font-mono">
                        <a href={bioUrl} target="_blank" rel="noreferrer" className="text-blue-400 font-bold truncate">
                          /bio/{user.slug}
                        </a>
                        <button
                          onClick={() => handleCopyText(bioUrl, user._id)}
                          className="text-slate-400 hover:text-white shrink-0"
                          title="Copy link"
                        >
                          <span className={`material-symbols-outlined text-[12px] ${copiedUserId === user._id ? "text-emerald-400" : ""}`}>
                            {copiedUserId === user._id ? "check" : "content_copy"}
                          </span>
                        </button>
                      </div>

                      <div className="text-slate-400 text-[9px] font-medium shrink-0 ml-2">
                        {user.expiresAt ? (
                          <span>Hạn: <strong className="text-slate-200">{expDays <= 0 ? 'Hết hạn' : `${expDays} ngày`}</strong></span>
                        ) : (
                          <span className="text-emerald-400 font-bold">Vĩnh viễn</span>
                        )}
                      </div>
                    </div>

                    {/* Compact Action Buttons */}
                    <div className="flex items-center justify-end gap-1.5 pt-0.5">
                      <button
                        onClick={() => setInspectingUser(user)}
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm active:scale-95 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[12px]">visibility</span>
                        <span>Soi</span>
                      </button>
                      
                      {user.status === 'locked' || user.status === 'rejected' ? (
                        <button
                          onClick={() => handleToggleBioStatus(user._id, user.status, 'active')}
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        >
                          Mở
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleBioStatus(user._id, 'active', 'locked')}
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        >
                          Khóa
                        </button>
                      )}

                      <button
                        onClick={() => handleToggleVip?.(user._id, user.starVip)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${user.starVip ? "bg-amber-400 text-black font-extrabold" : "bg-slate-800 text-slate-300 border border-white/10"}`}
                      >
                        {user.starVip ? "Star-VIP" : "VIP"}
                      </button>

                      <button
                        onClick={() => triggerConfirm(t("admin.texts.txt_230", { name: user.displayName }), () => setDeleteTarget(user))}
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-white/10 hover:text-rose-400"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Smart Pagination Controls */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/30 dark:bg-[#181622]/20 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
              <div className="text-muted-foreground font-medium">
                {t("admin.texts.txt_232")} <strong className="text-slate-700 dark:text-white">{totalMatchedUsers > 0 ? (userPage - 1) * userLimit + 1 : 0}</strong> {t("admin.texts.txt_52")} <strong className="text-slate-700 dark:text-white">{Math.min(userPage * userLimit, totalMatchedUsers)}</strong> {t("admin.texts.txt_53")} <strong className="text-slate-700 dark:text-white">{totalMatchedUsers}</strong> {t("admin.texts.txt_233")}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={userPage === 1}
                    onClick={() => setUserPage(1)}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-40 disabled:pointer-events-none text-muted-foreground"
                    title={t("admin.texts.txt_67")}
                  >
                    <span className="material-symbols-outlined text-sm font-bold">first_page</span>
                  </button>
                  <button
                    disabled={userPage === 1}
                    onClick={() => setUserPage(prev => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-40 disabled:pointer-events-none text-muted-foreground"
                    title={t("admin.texts.txt_68")}
                  >
                    <span className="material-symbols-outlined text-sm font-bold">chevron_left</span>
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const p = i + 1;
                    if (p === 1 || p === totalPages || (p >= userPage - 1 && p <= userPage + 1)) {
                      return (
                        <button
                          key={p}
                          onClick={() => setUserPage(p)}
                          className={`w-8 h-8 rounded-lg border font-bold transition-all ${
                            userPage === p
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                              : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-muted-foreground"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    } else if (p === userPage - 2 || p === userPage + 2) {
                      return (
                        <span key={p} className="text-slate-400 select-none px-0.5">...</span>
                      );
                    }
                    return null;
                  })}

                  <button
                    disabled={userPage === totalPages}
                    onClick={() => setUserPage(prev => Math.min(totalPages, prev + 1))}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-40 disabled:pointer-events-none text-muted-foreground"
                    title={t("admin.texts.txt_234")}
                  >
                    <span className="material-symbols-outlined text-sm font-bold">chevron_right</span>
                  </button>
                  <button
                    disabled={userPage === totalPages}
                    onClick={() => setUserPage(totalPages)}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-40 disabled:pointer-events-none text-muted-foreground"
                    title={t("admin.texts.txt_69")}
                  >
                    <span className="material-symbols-outlined text-sm font-bold">last_page</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-3xl opacity-40">group</span>
            <p className="font-bold text-xs uppercase tracking-wider text-slate-400">{t("admin.texts.txt_54")}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-1 max-w-[280px]">
              {searchQuery ? t("admin.texts.txt_70") : t("admin.texts.txt_71")}
            </p>
          </div>
        )}
      </div>
      {/* Verification Details Modal */}
      {selectedVerificationUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-background rounded-[2rem] border border-slate-200 dark:border-slate-800/80 shadow-2xl overflow-hidden relative space-y-6 p-6 sm:p-8">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500 text-2xl">school</span>
                <h3 className="text-base sm:text-lg font-black text-foreground uppercase tracking-tight">Chi tiết yêu cầu xác minh</h3>
              </div>
              <button
                onClick={() => setSelectedVerificationUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-1 py-2 border-b border-slate-100 dark:border-slate-800/50">
                <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider mt-0.5">Email Google</span>
                <span className="col-span-2 font-mono text-slate-700 dark:text-slate-200 font-bold truncate">{selectedVerificationUser.email}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 py-2 border-b border-slate-100 dark:border-slate-800/50">
                <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider mt-0.5">Họ và tên</span>
                <span className="col-span-2 text-foreground font-bold">{selectedVerificationUser.verificationRequest?.fullName}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 py-2 border-b border-slate-100 dark:border-slate-800/50">
                <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider mt-0.5">Sinh nhật</span>
                <span className="col-span-2 text-slate-800 dark:text-slate-200 font-bold">
                  {selectedVerificationUser.verificationRequest?.birthday ? new Date(selectedVerificationUser.verificationRequest.birthday).toLocaleDateString('vi-VN') : 'Chưa cung cấp'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 py-2 border-b border-slate-100 dark:border-slate-800/50">
                <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider mt-0.5">Trường học</span>
                <span className="col-span-2 text-slate-800 dark:text-slate-200 font-bold">
                  [{selectedVerificationUser.verificationRequest?.schoolLevel}] {selectedVerificationUser.verificationRequest?.schoolName}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 py-2 border-b border-slate-100 dark:border-slate-800/50">
                <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider mt-0.5">Mã HS/SV</span>
                <span className="col-span-2 text-slate-800 dark:text-slate-200 font-mono font-bold">{selectedVerificationUser.verificationRequest?.schoolIdCode || 'Chưa cung cấp'}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 py-2 border-b border-slate-100 dark:border-slate-800/50">
                <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider mt-0.5">Số điện thoại (Zalo)</span>
                <span className="col-span-2 text-slate-800 dark:text-slate-200 font-mono font-bold">{selectedVerificationUser.verificationRequest?.phoneZalo}</span>
              </div>
              <div className="grid grid-cols-3 gap-1 py-2 border-b border-slate-100 dark:border-slate-800/50">
                <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider mt-0.5">Trạng thái hiện tại</span>
                <span className="col-span-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                    selectedVerificationUser.status === 'pending'
                      ? 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
                      : selectedVerificationUser.status === 'rejected'
                      ? 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-500 dark:border-rose-900/30'
                      : (selectedVerificationUser.status === 'active' && !selectedVerificationUser.isEduVerified)
                      ? 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                  }`}>
                    {selectedVerificationUser.status === 'pending' ? 'Chờ duyệt' : selectedVerificationUser.status === 'rejected' ? 'Từ chối' : (selectedVerificationUser.status === 'active' && !selectedVerificationUser.isEduVerified) ? 'Đang thử 30 ngày · Chờ duyệt' : 'Đã duyệt'}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedVerificationUser(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-foreground text-xs font-bold rounded-xl transition-all active:scale-95"
              >
                Đóng
              </button>

              {(selectedVerificationUser.status === 'pending' || (selectedVerificationUser.status === 'active' && !selectedVerificationUser.isEduVerified)) && (
                <>
                  <button
                    onClick={() => {
                      handleToggleBioStatus(selectedVerificationUser._id, selectedVerificationUser.status, 'rejected');
                      setSelectedVerificationUser(null);
                    }}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-md"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => {
                      handleToggleBioStatus(selectedVerificationUser._id, selectedVerificationUser.status, 'active');
                      setSelectedVerificationUser(null);
                    }}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-md"
                  >
                    Phê duyệt
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Detail Inspector Modal */}
      {inspectingUser && (
        <UserDetailModal
          user={inspectingUser}
          onClose={() => setInspectingUser(null)}
        />
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-2" />
      {hasMoreUsers && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default AdminUsersTab;
