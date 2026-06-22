import React from "react";

export default function RejectedVerification({ handleLogout }) {
  return (
    <div className="max-w-md mx-auto py-12 px-4 animate-fadeIn relative">
      <div className="bg-white/80 dark:bg-card/80 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/60 p-8 rounded-xl shadow-xl text-center space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-rose-500" />
        
        <div className="w-16 h-16 bg-red-55/5 dark:bg-red-950/20 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-100 dark:border-red-900/40">
          <span className="material-symbols-outlined text-3xl">error_outline</span>
        </div>
        
        <div className="space-y-2.5">
          <h2 className="font-display text-xl font-black text-red-500 dark:text-red-400 uppercase tracking-tight">
            Yêu Cầu Không Được Chấp Thuận
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed px-2">
            Bạn không được chấp thuận do độ tuổi của bạn chưa được cho phép hoặc lý do khác, vui lòng liên hệ quản trị viên để được hỗ trợ.
          </p>
        </div>
        
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md shadow-sm transition-all active:scale-95 text-xs flex justify-center items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
