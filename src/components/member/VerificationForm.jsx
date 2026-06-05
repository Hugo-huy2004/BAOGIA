import React from "react";

export default function VerificationForm({
  verificationForm,
  setVerificationForm,
  handleVerificationSubmit,
  handleLogout,
  verifying
}) {
  return (
    <div className="max-w-xl mx-auto py-8 px-4 animate-fadeIn">
      <div className="bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-850/60 p-6 sm:p-8 rounded-xl shadow-xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <div className="text-center space-y-2">
          <span className="material-symbols-outlined text-4xl text-indigo-500">
            school
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
            Xác Minh Tài Khoản Sinh Viên
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Để nhận đặc quyền Bio Link miễn phí, vui lòng cung cấp thông tin học tập của bạn dưới đây. Quản trị viên sẽ phê duyệt trong vòng 24 giờ.
          </p>
        </div>
        
        <form onSubmit={handleVerificationSubmit} className="space-y-5">
          <div className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider block">
                Họ và tên
              </label>
              <input
                type="text"
                required
                placeholder="Nhập họ và tên của bạn..."
                value={verificationForm.fullName}
                onChange={(e) => setVerificationForm({ ...verificationForm, fullName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#121214] text-xs text-zinc-800 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-zinc-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Birthday */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider block">
                  Sinh nhật
                </label>
                <input
                  type="date"
                  required
                  value={verificationForm.birthday}
                  onChange={(e) => setVerificationForm({ ...verificationForm, birthday: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#121214] text-xs text-zinc-800 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Phone Zalo */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider block">
                  Số điện thoại (Zalo)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Nhập số điện thoại Zalo..."
                  value={verificationForm.phoneZalo}
                  onChange={(e) => setVerificationForm({ ...verificationForm, phoneZalo: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#121214] text-xs text-zinc-800 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-zinc-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* School Level */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider block">
                  Trường đang học (Cấp học)
                </label>
                <select
                  required
                  value={verificationForm.schoolLevel}
                  onChange={(e) => setVerificationForm({ ...verificationForm, schoolLevel: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#121214] text-xs text-zinc-800 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  <option value="">-- Chọn Cấp Học --</option>
                  <option value="TH">Tiểu học (TH)</option>
                  <option value="THCS">Trung học cơ sở (THCS)</option>
                  <option value="THPT">Trung học phổ thông (THPT)</option>
                </select>
              </div>

              {/* School Name */}
              {verificationForm.schoolLevel && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="text-[10px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider block">
                    Tên trường học
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Tên trường học của bạn..."
                    value={verificationForm.schoolName}
                    onChange={(e) => setVerificationForm({ ...verificationForm, schoolName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#121214] text-xs text-zinc-800 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-zinc-400"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={verificationForm.acceptTerms}
                onChange={(e) => setVerificationForm({ ...verificationForm, acceptTerms: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded border-zinc-350 dark:border-zinc-800 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-zinc-650 dark:text-zinc-400 leading-normal">
                Chấp nhận cung cấp thông tin và miễn trừ pháp lý
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={verificationForm.acceptContact}
                onChange={(e) => setVerificationForm({ ...verificationForm, acceptContact: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded border-zinc-350 dark:border-zinc-800 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-zinc-650 dark:text-zinc-400 leading-normal">
                Chúng tôi sẽ liên hệ bạn trong 24 tiếng tới để xác minh edu của bạn.
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 py-2.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-md transition-all active:scale-95"
            >
              Đăng xuất
            </button>
            <button
              type="submit"
              disabled={verifying}
              className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md transition-all active:scale-95 shadow-md shadow-indigo-200/40 dark:shadow-none flex justify-center items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
            >
              {verifying && (
                <span className="animate-spin border-2 border-white border-t-transparent w-3 h-3 rounded-full shrink-0" />
              )}
              Gửi yêu cầu xác minh
              <span className="material-symbols-outlined text-xs">send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
