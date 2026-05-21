import React from "react";

export default function AdminPackagesTab({
  newPkg,
  setNewPkg,
  handleCreatePackage,
  assignForm,
  setAssignForm,
  packageTemplates,
  handleAssignPackageToUser,
  memberPkgSearchEmail,
  setMemberPkgSearchEmail,
  handleSearchUserPackages,
  searchedMemberBio,
  handleRemoveUserPackage,
  handleDeletePackageTemplate,
  formatExpiration
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
      {/* Left panel: forms */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Create package form */}
        <div className="bg-white dark:bg-[#12111a] rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-5">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">add_card</span>
            Tạo Gói Dịch Vụ Mới
          </h3>
          
          <form onSubmit={handleCreatePackage} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">Tên Gói Dịch Vụ:</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Gói tặng 3 tháng, Gói Bio VIP..."
                value={newPkg.name}
                onChange={(e) => setNewPkg(p => ({ ...p, name: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">Thời Hạn:</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Ví dụ: 3"
                  value={newPkg.duration}
                  onChange={(e) => setNewPkg(p => ({ ...p, duration: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">Đơn Vị:</label>
                <select
                  value={newPkg.durationUnit}
                  onChange={(e) => setNewPkg(p => ({ ...p, durationUnit: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-855 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                >
                  <option value="months">Tháng</option>
                  <option value="days">Ngày</option>
                  <option value="years">Năm</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">Quyền Lợi (Mỗi dòng 1 quyền lợi):</label>
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
              Tạo Mẫu Gói Dịch Vụ
            </button>
          </form>
        </div>

        {/* Grant package form */}
        <div className="bg-white dark:bg-[#12111a] rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-5">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-500 text-base">card_membership</span>
            Cấp Gói Cho Thành Viên
          </h3>

          <form onSubmit={handleAssignPackageToUser} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">Email Người Nhận:</label>
              <input
                type="email"
                required
                placeholder="partner@gmail.com..."
                value={assignForm.email}
                onChange={(e) => setAssignForm(p => ({ ...p, email: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">Chọn Gói Dịch Vụ:</label>
              <select
                required
                value={assignForm.packageId}
                onChange={(e) => setAssignForm(p => ({ ...p, packageId: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
              >
                <option value="">-- Chọn một gói để cấp --</option>
                {packageTemplates.map(pkg => (
                  <option key={pkg._id} value={pkg._id}>
                    {pkg.name} ({pkg.duration} {pkg.durationUnit === "days" ? "ngày" : pkg.durationUnit === "years" ? "năm" : "tháng"})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm hover:scale-[1.01] active:scale-98 transition-all"
            >
              <span className="material-symbols-outlined text-sm">verified</span>
              Cấp Gói & Kích Hoạt
            </button>
          </form>
        </div>

      </div>

      {/* Right panel: Templates list & Member packages search */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Search and delete user packages */}
        <div className="bg-white dark:bg-[#12111a] rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-5">
          <div className="space-y-1">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-500 text-base">manage_accounts</span>
              Xóa / Quản Lý Gói Của Thành Viên
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Nhập email thành viên để kiểm tra các gói đã nhận và hủy/xóa gói.</p>
          </div>

          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Nhập email thành viên cần quản lý..."
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
              Tìm
            </button>
          </div>

          {searchedMemberBio && (
            <div className="border border-zinc-150 dark:border-zinc-800/85 rounded-2xl p-4 space-y-4 bg-zinc-50/50 dark:bg-[#181622]/40 animate-fadeIn">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h4 className="font-bold text-xs text-slate-855 dark:text-white">{searchedMemberBio.displayName}</h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{searchedMemberBio.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[8px] font-bold text-slate-450 uppercase tracking-wider">Hạn dùng Bio:</div>
                  <div className="text-[10px] font-mono font-bold text-rose-500 mt-0.5">{formatExpiration(searchedMemberBio.expiresAt)}</div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Các gói dịch vụ đang có:</span>
                
                {/* Base package (non-deletable) */}
                <div className="flex items-center justify-between p-3 bg-white dark:bg-[#1c1c1e] rounded-xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                    <div>
                      <span className="text-xs font-bold text-slate-850 dark:text-zinc-200">{searchedMemberBio.serviceLabel || "Student Bio"} (Gói gốc)</span>
                      <span className="text-[9px] text-zinc-400 block mt-0.5">Kích hoạt khi tạo Bio • Không thể xóa</span>
                    </div>
                  </div>
                  <span className="text-[9.5px] font-bold text-zinc-455 italic">Mặc định</span>
                </div>

                {/* Custom packages */}
                {searchedMemberBio.packages && searchedMemberBio.packages.length > 0 ? (
                  searchedMemberBio.packages.map((pkg) => (
                    <div key={pkg._id} className="flex items-center justify-between p-3 bg-white dark:bg-[#1c1c1e] rounded-xl border border-zinc-200/50 dark:border-zinc-800/60 hover:border-red-500/20 transition-all shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: pkg.color || "#10b981" }} />
                        <div>
                          <span className="text-xs font-bold text-slate-850 dark:text-zinc-200">{pkg.name}</span>
                          <span className="text-[9px] text-zinc-400 block mt-0.5">Cấp ngày: {new Date(pkg.addedAt).toLocaleDateString('vi-VN')} (+{pkg.duration} {pkg.durationUnit === "days" ? "ngày" : pkg.durationUnit === "years" ? "năm" : "tháng"})</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveUserPackage(pkg._id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-455 font-bold text-[9px] uppercase tracking-wide transition-colors active:scale-95"
                      >
                        Hủy Gói
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-zinc-455 italic">Thành viên chưa được cấp gói khuyến mãi/bổ sung nào.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Package templates list */}
        <div className="bg-white dark:bg-[#12111a] rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-5">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-550 dark:text-slate-450 text-base">list_alt</span>
            Mẫu Gói Dịch Vụ Đã Tạo ({packageTemplates.length})
          </h3>

          {packageTemplates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {packageTemplates.map(pkg => (
                <div 
                  key={pkg._id} 
                  className="rounded-2xl p-4 border border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10 space-y-3 relative group"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: pkg.color || "#6366f1" }} />
                      <h4 className="font-bold text-xs text-slate-850 dark:text-white uppercase tracking-wide">{pkg.name}</h4>
                    </div>
                    <button
                      onClick={() => handleDeletePackageTemplate(pkg._id)}
                      className="text-zinc-455 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Xóa mẫu gói"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>

                  <div className="flex justify-between text-[10px] text-zinc-455">
                    <span>Thời hạn:</span>
                    <span className="font-bold text-slate-700 dark:text-zinc-300 font-mono">+{pkg.duration} {pkg.durationUnit === "days" ? "ngày" : pkg.durationUnit === "years" ? "năm" : "tháng"}</span>
                  </div>

                  {pkg.benefits && pkg.benefits.length > 0 && (
                    <div className="space-y-1.5 border-t border-zinc-200/50 dark:border-zinc-800/50 pt-2.5">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Quyền lợi:</span>
                      <ul className="space-y-1">
                        {pkg.benefits.slice(0, 3).map((benefit, i) => (
                          <li key={i} className="text-[9.5px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-zinc-400 shrink-0" />
                            {benefit}
                          </li>
                        ))}
                        {pkg.benefits.length > 3 && (
                          <li className="text-[8.5px] italic text-zinc-400 pl-2">và {pkg.benefits.length - 3} quyền lợi khác...</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-6">Chưa có mẫu gói dịch vụ nào được tạo.</p>
          )}
        </div>

      </div>

    </div>
  );
}
