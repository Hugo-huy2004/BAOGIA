import React from "react";

export default function PendingVerification({ fullName, handleLogout }) {
  return (
    <div className="max-w-md mx-auto py-12 px-4 animate-fadeIn">
      <div className="bg-white/80 dark:bg-card/80 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-850/60 p-8 rounded-xl shadow-xl text-center space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-400" />
        
        <div className="w-16 h-16 bg-amber-55/5 dark:bg-amber-950/20 text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-100 dark:border-amber-900/40">
          <span className="material-symbols-outlined text-3xl animate-spin-slow">hourglass_empty</span>
        </div>
        
        <div className="space-y-2.5">
          <h2 className="font-display text-xl font-black text-amber-600 dark:text-amber-400 uppercase tracking-tight">
            Đang Chờ Phê Duyệt
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed px-2">
            Chào <strong>{fullName}</strong> nhé! Hồ sơ yêu cầu xác minh của bạn đã được gửi đến Admin. Tụi mình đang xem xét thông tin học tập của bạn. Trải nghiệm sẽ tự động mở khóa ngay khi Admin bấm duyệt nha!
          </p>
        </div>
        
        <div className="p-4 rounded-md bg-amber-500/5 dark:bg-amber-950/10 border border-amber-500/10 text-[11px] text-amber-700 dark:text-amber-400 flex gap-2.5 text-left leading-relaxed">
          <span className="material-symbols-outlined text-amber-500 shrink-0 text-base mt-0.5 animate-spin">
            sync
          </span>
          <p className="font-semibold">
            Hệ thống đang tự động kiểm tra trạng thái phê duyệt... Hãy giữ tab này nhé, trang sẽ tự reload ngay khi được Admin bấm duyệt!
          </p>
        </div>
        
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-2.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-md transition-all active:scale-95"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
