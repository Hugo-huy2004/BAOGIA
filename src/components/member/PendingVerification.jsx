import React from "react";

export default function PendingVerification({ fullName, handleLogout }) {
  return (
    <div className="max-w-md mx-auto py-12 px-4 animate-fadeIn">
      <div className="bg-white/80 dark:bg-card/80 backdrop-blur-md border border-border/50 p-8 rounded-xl shadow-xl text-center space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-warning to-yellow-400" />
        
        <div className="w-16 h-16 bg-warning/5 dark:bg-warning/20 text-warning rounded-full flex items-center justify-center mx-auto border border-warning/15 dark:border-warning/40">
          <span className="material-symbols-outlined text-3xl animate-spin-slow">hourglass_empty</span>
        </div>
        
        <div className="space-y-2.5">
          <h2 className="font-display text-xl font-black text-warning uppercase tracking-tight">
            Đang Chờ Phê Duyệt
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed px-2">
            Chào <strong>{fullName}</strong> nhé! Hồ sơ yêu cầu xác minh của bạn đã được gửi đến Admin. Tụi mình đang xem xét thông tin học tập của bạn. Trải nghiệm sẽ tự động mở khóa ngay khi Admin bấm duyệt nha!
          </p>
        </div>
        
        <div className="p-4 rounded-md bg-warning/5 dark:bg-warning/10 border border-warning/10 text-[11px] text-warning/90 dark:text-warning flex gap-2.5 text-left leading-relaxed">
          <span className="material-symbols-outlined text-warning shrink-0 text-base mt-0.5 animate-spin">
            sync
          </span>
          <p className="font-semibold">
            Hệ thống đang tự động kiểm tra trạng thái phê duyệt... Hãy giữ tab này nhé, trang sẽ tự reload ngay khi được Admin bấm duyệt!
          </p>
        </div>
        
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-2.5 border border-border hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-foreground/80 text-xs font-bold rounded-md transition-all active:scale-95"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
