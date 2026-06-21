import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
  triggerConfirm,
  setDeleteTarget,
  userPage,
  totalPages,
  searchQuery,
  getExpirationDaysOnly,
  formatExpiration
}) => {
  const { t } = useTranslation();
  const [selectedVerificationUser, setSelectedVerificationUser] = useState(null);
  const [onlineStatuses, setOnlineStatuses] = useState({});

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
    <div className="space-y-6 animate-fadeIn">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1: Total */}
        <div className="bg-white dark:bg-[#12111a] p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-2.5 sm:gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-[#a5b4fc] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-lg sm:text-xl">group</span>
          </div>
          <div className="min-w-0">
            <div className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{t("admin.texts.txt_26")}</div>
            <div className="text-sm sm:text-lg font-extrabold text-slate-800 dark:text-white mt-0.5 leading-tight">{userStats.total.toLocaleString()}</div>
          </div>
        </div>
        {/* Card 2: Active */}
        <div className="bg-white dark:bg-[#12111a] p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-2.5 sm:gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-lg sm:text-xl">person_play</span>
          </div>
          <div className="min-w-0">
            <div className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{t("admin.texts.txt_27")}</div>
            <div className="text-sm sm:text-lg font-extrabold text-slate-800 dark:text-white mt-0.5 leading-tight">{userStats.active.toLocaleString()}</div>
          </div>
        </div>
        {/* Card 3: Pending */}
        <div className="bg-white dark:bg-[#12111a] p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-2.5 sm:gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-lg sm:text-xl">hourglass_empty</span>
          </div>
          <div className="min-w-0">
            <div className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Chờ duyệt</div>
            <div className="text-sm sm:text-lg font-extrabold text-slate-800 dark:text-white mt-0.5 leading-tight">{(userStats.pending || 0).toLocaleString()}</div>
          </div>
        </div>
        {/* Card 4: Rejected */}
        <div className="bg-white dark:bg-[#12111a] p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-2.5 sm:gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-lg sm:text-xl">cancel</span>
          </div>
          <div className="min-w-0">
            <div className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Từ chối</div>
            <div className="text-sm sm:text-lg font-extrabold text-slate-800 dark:text-white mt-0.5 leading-tight">{(userStats.rejected || 0).toLocaleString()}</div>
          </div>
        </div>
        {/* Card 5: Locked */}
        <div className="bg-white dark:bg-[#12111a] p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-2.5 sm:gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-lg sm:text-xl">block</span>
          </div>
          <div className="min-w-0">
            <div className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{t("admin.texts.txt_28")}</div>
            <div className="text-sm sm:text-lg font-extrabold text-slate-800 dark:text-white mt-0.5 leading-tight">{userStats.locked.toLocaleString()}</div>
          </div>
        </div>
        {/* Card 6: Lifetime */}
        <div className="bg-white dark:bg-[#12111a] p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-2.5 sm:gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-450 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-lg sm:text-xl">workspace_premium</span>
          </div>
          <div className="min-w-0">
            <div className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{t("admin.texts.txt_29")}</div>
            <div className="text-sm sm:text-lg font-extrabold text-slate-800 dark:text-white mt-0.5 leading-tight">{userStats.lifetime.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#12111a] p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-grow">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("admin.texts.txt_55")}
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0c0b11] text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-slate-400 text-slate-800 dark:text-white outline-none"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center w-5 h-5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setUserPage(1); }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0c0b11] text-xs text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0c0b11] text-xs text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0c0b11] text-xs text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="createdAt">{t("admin.texts.txt_37")}</option>
              <option value="expiresAt">{t("admin.texts.txt_38")}</option>
              <option value="displayName">{t("admin.texts.txt_39")}</option>
            </select>

            {/* Sort Order Toggle */}
            <button
              onClick={() => setUserSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0c0b11] text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1 hover:bg-slate-105 dark:hover:bg-slate-900 transition-colors"
            >
              <span className="material-symbols-outlined text-sm font-bold">
                {userSortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
              </span>
              <span>{userSortOrder === 'asc' ? t("admin.texts.txt_56") : t("admin.texts.txt_57")}</span>
            </button>

            {/* Limit filter */}
            <select
              value={userLimit}
              onChange={(e) => { setUserLimit(parseInt(e.target.value)); setUserPage(1); }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0c0b11] text-xs text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={10}>{t("admin.texts.txt_40")}</option>
              <option value={20}>{t("admin.texts.txt_41")}</option>
              <option value={50}>{t("admin.texts.txt_42")}</option>
              <option value={100}>{t("admin.texts.txt_43")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Users Table / List Card */}
      <div className="bg-white dark:bg-[#12111a] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#181622]/40 flex justify-between items-center">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-base">group</span>
            {t("admin.texts.txt_229")} ({totalMatchedUsers})
          </h3>
        </div>

        {users.length > 0 ? (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/70 font-bold uppercase tracking-wider text-[9px]">
                    <th className="px-6 py-4">{t("admin.texts.txt_44")}</th>
                    <th className="px-6 py-4">Bio Link</th>
                    <th className="px-6 py-4">{t("admin.texts.txt_45")}</th>
                    <th className="px-6 py-4">{t("admin.texts.txt_46")}</th>
                    <th className="px-6 py-4 text-center">{t("admin.texts.txt_47")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                  {users.map((user) => {
                    const bioUrl = `${window.location.origin}/bio/${user.slug}`;
                    return (
                      <tr key={user._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
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
                                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#12111a] ${onlineStatuses[user.email] ? 'bg-emerald-500' : 'bg-zinc-400'}`}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-800 dark:text-white text-xs truncate">{user.displayName}</div>
                              <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-[11px]">
                          <div className="flex items-center gap-2">
                            <a href={bioUrl} target="_blank" rel="noreferrer" className="text-primary dark:text-[#a5b4fc] hover:underline font-bold truncate">
                              /bio/{user.slug}
                            </a>
                            <button
                              onClick={() => handleCopyText(bioUrl, user._id)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-white shrink-0 flex items-center justify-center w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title={t("admin.texts.txt_58")}
                            >
                              <span className={`material-symbols-outlined text-xs ${copiedUserId === user._id ? "text-emerald-500 font-bold" : ""}`}>
                                {copiedUserId === user._id ? "check" : "content_copy"}
                              </span>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatExpiration(user.expiresAt)}
                        </td>
                        <td className="px-6 py-4">
                          {user.status === 'locked' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-500 border border-rose-100 dark:border-rose-900/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                              {t("admin.texts.txt_48")}
                            </span>
                          ) : user.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Chờ duyệt
                            </span>
                          ) : user.status === 'rejected' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-500 border border-rose-100 dark:border-rose-900/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Từ chối
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {t("admin.texts.txt_49")}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {user.verificationRequest?.submitted && (
                              <button
                                onClick={() => setSelectedVerificationUser(user)}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm active:scale-95 flex items-center gap-1.5"
                                title="Xem hồ sơ yêu cầu xác minh sinh viên"
                              >
                                <span className="material-symbols-outlined text-[14px]">school</span>
                                Hồ sơ
                              </button>
                            )}
                            {user.status === 'locked' || user.status === 'rejected' ? (
                              <button
                                onClick={() => handleToggleBioStatus(user._id, user.status, 'active')}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm active:scale-95"
                              >
                                Kích hoạt
                              </button>
                            ) : user.status === 'pending' ? (
                              <button
                                onClick={() => handleToggleBioStatus(user._id, 'pending', 'active')}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm active:scale-95"
                              >
                                Duyệt
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleBioStatus(user._id, 'active', 'locked')}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase bg-rose-600 hover:bg-rose-700 text-white shadow-sm active:scale-95"
                              >
                                Khóa
                              </button>
                            )}
                            <button
                              onClick={() => triggerConfirm(t("admin.texts.txt_230", { name: user.displayName }), () => setDeleteTarget(user))}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white transition-all shadow-sm active:scale-95"
                            >
                              {t("admin.texts.txt_231")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Compressed Mobile List View */}
            <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800/60 px-4">
              {users.map((user) => {
                const bioUrl = `${window.location.origin}/bio/${user.slug}`;
                const isLocked = user.status === 'locked';
                const expDays = getExpirationDaysOnly(user.expiresAt);
                return (
                  <div key={user._id} className="py-4 space-y-3 first:pt-2 last:pb-2">
                    {/* Top info row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative w-8 h-8 shrink-0">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#221b2b] overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-slate-400 text-xs">person</span>
                            )}
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#12111a] ${onlineStatuses[user.email] ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-800 dark:text-white text-xs truncate leading-tight">{user.displayName}</h4>
                          <p className="text-[10px] text-slate-400 truncate leading-none mt-0.5">{user.email}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-extrabold border shrink-0 ${
                        user.status === 'locked'
                          ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-500 dark:border-rose-900/30"
                          : user.status === 'pending'
                          ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
                          : user.status === 'rejected'
                          ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-500 dark:border-rose-900/30"
                          : "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                      }`}>
                        {user.status === 'locked' ? t("admin.texts.txt_61") : user.status === 'pending' ? 'Chờ duyệt' : user.status === 'rejected' ? 'Từ chối' : t("admin.texts.txt_62")}
                      </span>
                    </div>

                    {/* Copy Link Pill Row */}
                    <div className="flex items-center justify-between bg-slate-100/60 dark:bg-[#1a1626]/80 px-3 py-1.5 rounded-xl border border-slate-200/40 dark:border-slate-800/80">
                      <a href={bioUrl} target="_blank" rel="noreferrer" className="text-primary dark:text-[#a5b4fc] text-xs font-mono font-bold truncate hover:underline flex-1">
                        /bio/{user.slug}
                      </a>
                      <button
                        onClick={() => handleCopyText(bioUrl, user._id)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white shrink-0 ml-2"
                        title={t("admin.texts.txt_63")}
                      >
                        <span className={`material-symbols-outlined text-xs ${copiedUserId === user._id ? "text-emerald-500 font-bold" : ""}`}>
                          {copiedUserId === user._id ? "check" : "content_copy"}
                        </span>
                      </button>
                    </div>

                    {/* Metadata & Mini Actions Row */}
                    <div className="flex items-center justify-between text-xs gap-4 pt-1">
                      <div className="text-[10px] font-medium text-slate-400 dark:text-slate-400">
                        {user.expiresAt ? (
                          <span>{t("admin.texts.txt_50")} <strong className="text-slate-700 dark:text-slate-200">{new Date(user.expiresAt).toLocaleDateString('vi-VN')}</strong> ({expDays <= 0 ? t("admin.texts.txt_64") : `${t("admin.texts.txt_235")} ${expDays} ${t("admin.texts.txt_236")}`})</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{t("admin.texts.txt_51")}</span>
                        )}
                      </div>
                      
                      <div className="flex gap-2 shrink-0">
                        {user.verificationRequest?.submitted && (
                          <button
                            onClick={() => setSelectedVerificationUser(user)}
                            className="px-2.5 py-1 rounded-md text-[9.5px] font-extrabold uppercase bg-indigo-500 border-indigo-500 text-white transition-all"
                          >
                            Hồ sơ
                          </button>
                        )}
                        {user.status === 'locked' || user.status === 'rejected' ? (
                          <button
                            onClick={() => handleToggleBioStatus(user._id, user.status, 'active')}
                            className="px-2.5 py-1 rounded-md text-[9.5px] font-extrabold uppercase bg-emerald-500 border-emerald-500 text-white transition-all"
                          >
                            Kích hoạt
                          </button>
                        ) : user.status === 'pending' ? (
                          <button
                            onClick={() => handleToggleBioStatus(user._id, 'pending', 'active')}
                            className="px-2.5 py-1 rounded-md text-[9.5px] font-extrabold uppercase bg-emerald-500 border-emerald-500 text-white transition-all"
                          >
                            Duyệt
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleBioStatus(user._id, 'active', 'locked')}
                            className="px-2.5 py-1 rounded-md text-[9.5px] font-extrabold uppercase bg-white border-rose-300 text-rose-600 hover:bg-rose-50 dark:bg-slate-800 dark:border-rose-900/45 dark:text-rose-500 transition-all"
                          >
                            Khóa
                          </button>
                        )}
                        <button
                          onClick={() => triggerConfirm(t("admin.texts.txt_230", { name: user.displayName }), () => setDeleteTarget(user))}
                          className="px-2.5 py-1 rounded-md text-[9.5px] font-extrabold uppercase bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-800 dark:text-slate-300 transition-all"
                        >
                          {t("admin.texts.txt_231")}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Smart Pagination Controls */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/30 dark:bg-[#181622]/20 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
              <div className="text-slate-500 dark:text-slate-400 font-medium">
                {t("admin.texts.txt_232")} <strong className="text-slate-700 dark:text-white">{totalMatchedUsers > 0 ? (userPage - 1) * userLimit + 1 : 0}</strong> {t("admin.texts.txt_52")} <strong className="text-slate-700 dark:text-white">{Math.min(userPage * userLimit, totalMatchedUsers)}</strong> {t("admin.texts.txt_53")} <strong className="text-slate-700 dark:text-white">{totalMatchedUsers}</strong> {t("admin.texts.txt_233")}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={userPage === 1}
                    onClick={() => setUserPage(1)}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-40 disabled:pointer-events-none text-slate-600 dark:text-slate-300"
                    title={t("admin.texts.txt_67")}
                  >
                    <span className="material-symbols-outlined text-sm font-bold">first_page</span>
                  </button>
                  <button
                    disabled={userPage === 1}
                    onClick={() => setUserPage(prev => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-40 disabled:pointer-events-none text-slate-600 dark:text-slate-300"
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
                              : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300"
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
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-40 disabled:pointer-events-none text-slate-600 dark:text-slate-300"
                    title={t("admin.texts.txt_234")}
                  >
                    <span className="material-symbols-outlined text-sm font-bold">chevron_right</span>
                  </button>
                  <button
                    disabled={userPage === totalPages}
                    onClick={() => setUserPage(totalPages)}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-40 disabled:pointer-events-none text-slate-600 dark:text-slate-300"
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
          <div className="w-full max-w-md bg-white dark:bg-[#12111a] rounded-[2rem] border border-slate-200 dark:border-slate-800/80 shadow-2xl overflow-hidden relative space-y-6 p-6 sm:p-8">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500 text-2xl">school</span>
                <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Chi tiết yêu cầu xác minh</h3>
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
                <span className="col-span-2 text-slate-800 dark:text-white font-bold">{selectedVerificationUser.verificationRequest?.fullName}</span>
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
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                  }`}>
                    {selectedVerificationUser.status === 'pending' ? 'Chờ duyệt' : selectedVerificationUser.status === 'rejected' ? 'Từ chối' : 'Đã duyệt'}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedVerificationUser(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold rounded-xl transition-all active:scale-95"
              >
                Đóng
              </button>
              
              {selectedVerificationUser.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleToggleBioStatus(selectedVerificationUser._id, 'pending', 'rejected');
                      setSelectedVerificationUser(null);
                    }}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-md"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => {
                      handleToggleBioStatus(selectedVerificationUser._id, 'pending', 'active');
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
    </div>
  );
};

export default AdminUsersTab;
