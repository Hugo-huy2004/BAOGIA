import React from 'react';

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
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div className="bg-white dark:bg-[#12111a] p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-[#a5b4fc] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">group</span>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng thành viên</div>
            <div className="text-lg font-extrabold text-slate-850 dark:text-white mt-0.5">{userStats.total.toLocaleString()}</div>
          </div>
        </div>
        {/* Card 2: Active */}
        <div className="bg-white dark:bg-[#12111a] p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">person_play</span>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đang hoạt động</div>
            <div className="text-lg font-extrabold text-slate-850 dark:text-white mt-0.5">{userStats.active.toLocaleString()}</div>
          </div>
        </div>
        {/* Card 3: Locked */}
        <div className="bg-white dark:bg-[#12111a] p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">block</span>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bị khóa</div>
            <div className="text-lg font-extrabold text-slate-850 dark:text-white mt-0.5">{userStats.locked.toLocaleString()}</div>
          </div>
        </div>
        {/* Card 4: Lifetime */}
        <div className="bg-white dark:bg-[#12111a] p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">workspace_premium</span>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vô thời hạn</div>
            <div className="text-lg font-extrabold text-slate-850 dark:text-white mt-0.5">{userStats.lifetime.toLocaleString()}</div>
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
              placeholder="Tìm theo tên, email, slug..."
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0c0b11] text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-slate-400 text-slate-850 dark:text-white outline-none"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 dark:hover:text-white flex items-center justify-center w-5 h-5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-850"
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
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0c0b11] text-xs text-slate-650 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Trạng thái: Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="locked">Bị khóa</option>
            </select>

            {/* Expiration filter */}
            <select
              value={expirationFilter}
              onChange={(e) => { setExpirationFilter(e.target.value); setUserPage(1); }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0c0b11] text-xs text-slate-650 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Thời hạn: Tất cả</option>
              <option value="active">Còn hạn</option>
              <option value="expired">Hết hạn</option>
              <option value="lifetime">Vô thời hạn</option>
            </select>

            {/* Sort by */}
            <select
              value={userSortBy}
              onChange={(e) => { setUserSortBy(e.target.value); setUserPage(1); }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0c0b11] text-xs text-slate-650 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="createdAt">Sắp xếp: Ngày tạo</option>
              <option value="expiresAt">Sắp xếp: Ngày hết hạn</option>
              <option value="displayName">Sắp xếp: Tên hiển thị</option>
            </select>

            {/* Sort Order Toggle */}
            <button
              onClick={() => setUserSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0c0b11] text-xs text-slate-650 dark:text-slate-300 flex items-center gap-1 hover:bg-slate-105 dark:hover:bg-slate-900 transition-colors"
            >
              <span className="material-symbols-outlined text-sm font-bold">
                {userSortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
              </span>
              <span>{userSortOrder === 'asc' ? 'Tăng' : 'Giảm'}</span>
            </button>

            {/* Limit filter */}
            <select
              value={userLimit}
              onChange={(e) => { setUserLimit(parseInt(e.target.value)); setUserPage(1); }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0c0b11] text-xs text-slate-650 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={10}>Hiện: 10</option>
              <option value={20}>Hiện: 20</option>
              <option value={50}>Hiện: 50</option>
              <option value={100}>Hiện: 100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Users Table / List Card */}
      <div className="bg-white dark:bg-[#12111a] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#181622]/40 flex justify-between items-center">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-550 dark:text-slate-455 text-base">group</span>
            Danh sách thành viên ({totalMatchedUsers})
          </h3>
        </div>

        {users.length > 0 ? (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/70 font-bold uppercase tracking-wider text-[9px]">
                    <th className="px-6 py-4">Thành viên</th>
                    <th className="px-6 py-4">Bio Link</th>
                    <th className="px-6 py-4">Thời hạn</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60 font-medium">
                  {users.map((user) => {
                    const bioUrl = `${window.location.origin}/bio/${user.slug}`;
                    return (
                      <tr key={user._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-[#221b2b] overflow-hidden border border-slate-200 dark:border-slate-750 flex items-center justify-center shrink-0 shadow-inner">
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="material-symbols-outlined text-slate-400 text-sm">person</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-850 dark:text-white text-xs truncate">{user.displayName}</div>
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
                              className="text-slate-400 hover:text-slate-650 dark:hover:text-white shrink-0 flex items-center justify-center w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Sao chép liên kết"
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
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-455 border border-rose-100 dark:border-rose-900/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                              Bị khóa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Hoạt động
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleToggleBioStatus(user._id, user.status)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shadow-sm active:scale-95 ${
                                user.status === 'locked'
                                  ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                  : "bg-rose-600 hover:bg-rose-700 text-white"
                              }`}
                            >
                              {user.status === 'locked' ? "Mở khóa" : "Khóa"}
                            </button>
                            <button
                              onClick={() => triggerConfirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản của ${user.displayName}?`, () => setDeleteTarget(user))}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase bg-slate-200 hover:bg-slate-350 dark:bg-slate-880 dark:hover:bg-slate-700 text-slate-800 dark:text-white transition-all shadow-sm active:scale-95"
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

            {/* Compressed Mobile List View */}
            <div className="md:hidden divide-y divide-slate-150 dark:divide-slate-800/60 px-4">
              {users.map((user) => {
                const bioUrl = `${window.location.origin}/bio/${user.slug}`;
                const isLocked = user.status === 'locked';
                const expDays = getExpirationDaysOnly(user.expiresAt);
                return (
                  <div key={user._id} className="py-4 space-y-3 first:pt-2 last:pb-2">
                    {/* Top info row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#221b2b] overflow-hidden border border-slate-200 dark:border-slate-750 flex items-center justify-center shrink-0">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-slate-400 text-xs">person</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-850 dark:text-white text-xs truncate leading-tight">{user.displayName}</h4>
                          <p className="text-[10px] text-slate-400 truncate leading-none mt-0.5">{user.email}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-extrabold border shrink-0 ${
                        isLocked
                          ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-455 dark:border-rose-900/30"
                          : "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                      }`}>
                        {isLocked ? "Bị khóa" : "Hoạt động"}
                      </span>
                    </div>

                    {/* Copy Link Pill Row */}
                    <div className="flex items-center justify-between bg-slate-100/60 dark:bg-[#1a1626]/80 px-3 py-1.5 rounded-xl border border-slate-200/40 dark:border-slate-800/80">
                      <a href={bioUrl} target="_blank" rel="noreferrer" className="text-primary dark:text-[#a5b4fc] text-xs font-mono font-bold truncate hover:underline flex-1">
                        /bio/{user.slug}
                      </a>
                      <button
                        onClick={() => handleCopyText(bioUrl, user._id)}
                        className="text-slate-400 hover:text-slate-650 dark:hover:text-white shrink-0 ml-2"
                        title="Sao chép"
                      >
                        <span className={`material-symbols-outlined text-xs ${copiedUserId === user._id ? "text-emerald-500 font-bold" : ""}`}>
                          {copiedUserId === user._id ? "check" : "content_copy"}
                        </span>
                      </button>
                    </div>

                    {/* Metadata & Mini Actions Row */}
                    <div className="flex items-center justify-between text-xs gap-4 pt-1">
                      <div className="text-[10px] font-medium text-slate-450 dark:text-slate-400">
                        {user.expiresAt ? (
                          <span>Hạn: <strong className="text-slate-700 dark:text-slate-200">{new Date(user.expiresAt).toLocaleDateString('vi-VN')}</strong> ({expDays <= 0 ? "Hết hạn" : `còn ${expDays} ngày`})</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Vĩnh viễn</span>
                        )}
                      </div>
                      
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleBioStatus(user._id, user.status)}
                          className={`px-2.5 py-1 rounded-md text-[9.5px] font-extrabold uppercase transition-all border ${
                            isLocked
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "bg-white border-rose-200 text-rose-600 hover:bg-rose-50 dark:bg-slate-850 dark:border-rose-900/45 dark:text-rose-455"
                          }`}
                        >
                          {isLocked ? "Mở" : "Khóa"}
                        </button>
                        <button
                          onClick={() => triggerConfirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản của ${user.displayName}?`, () => setDeleteTarget(user))}
                          className="px-2.5 py-1 rounded-md text-[9.5px] font-extrabold uppercase bg-slate-100 border border-slate-200 text-slate-605 hover:bg-slate-200 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-350 transition-all"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Smart Pagination Controls */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/30 dark:bg-[#181622]/20 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
              <div className="text-slate-550 dark:text-slate-400 font-medium">
                Hiển thị từ <strong className="text-slate-700 dark:text-white">{totalMatchedUsers > 0 ? (userPage - 1) * userLimit + 1 : 0}</strong> đến <strong className="text-slate-700 dark:text-white">{Math.min(userPage * userLimit, totalMatchedUsers)}</strong> trong tổng số <strong className="text-slate-700 dark:text-white">{totalMatchedUsers}</strong> thành viên
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={userPage === 1}
                    onClick={() => setUserPage(1)}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-40 disabled:pointer-events-none text-slate-650 dark:text-slate-350"
                    title="Trang đầu"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">first_page</span>
                  </button>
                  <button
                    disabled={userPage === 1}
                    onClick={() => setUserPage(prev => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-40 disabled:pointer-events-none text-slate-650 dark:text-slate-350"
                    title="Trang trước"
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
                              : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-350"
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
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-40 disabled:pointer-events-none text-slate-650 dark:text-slate-350"
                    title="Trang sau"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">chevron_right</span>
                  </button>
                  <button
                    disabled={userPage === totalPages}
                    onClick={() => setUserPage(totalPages)}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-40 disabled:pointer-events-none text-slate-650 dark:text-slate-350"
                    title="Trang cuối"
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
            <p className="font-bold text-xs uppercase tracking-wider text-slate-400">Không tìm thấy thành viên nào</p>
            <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-1 max-w-[280px]">
              {searchQuery ? "Thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc." : "Chưa có thành viên nào tạo tài khoản."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersTab;
