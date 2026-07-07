import React from "react";
import VerificationForm from "./VerificationForm";

// The "Sinh viên chưa xác minh" entry used to navigate into its own tab —
// now it opens this popup instead, so submitting/checking status doesn't
// knock the member out of whatever tab they were already on.
export default function VerificationModal({
  open,
  onClose,
  bio,
  verificationForm,
  setVerificationForm,
  handleVerificationSubmit,
  handleLogout,
  verifying
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl my-8">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors"
          aria-label="Đóng"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>

        {bio?.isEduVerified ? (
          <div className="py-6 px-4 animate-fadeIn">
            <div className="bg-white/95 dark:bg-card/95 backdrop-blur-md border border-border/50 p-6 sm:p-8 rounded-xl shadow-xl text-center space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success to-teal-400" />
              <div className="w-14 h-14 bg-success/5 dark:bg-success/20 text-success rounded-full flex items-center justify-center mx-auto border border-success/15 dark:border-success/40">
                <span className="material-symbols-outlined text-2xl">verified</span>
              </div>
              <h2 className="font-display text-lg font-black text-success uppercase tracking-tight">
                Đã Xác Minh
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed px-2">
                Thông tin của bạn đã được xác minh và cố định. Tài khoản đã có đầy đủ 365 ngày sử dụng kể từ ngày đăng ký.
              </p>
            </div>
          </div>
        ) : bio?.verificationRequest?.submitted ? (
          <div className="py-6 px-4 animate-fadeIn">
            <div className="bg-white/95 dark:bg-card/95 backdrop-blur-md border border-border/50 p-6 sm:p-8 rounded-xl shadow-xl text-center space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-warning to-yellow-400" />
              <div className="w-14 h-14 bg-warning/5 dark:bg-warning/20 text-warning rounded-full flex items-center justify-center mx-auto border border-warning/15 dark:border-warning/40">
                <span className="material-symbols-outlined text-2xl animate-spin-slow">hourglass_empty</span>
              </div>
              <h2 className="font-display text-lg font-black text-warning uppercase tracking-tight">
                Đang Chờ Phê Duyệt
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed px-2">
                Yêu cầu xác minh sinh viên của bạn đã được gửi đến Admin. Bạn vẫn dùng được toàn bộ tính năng trong thời gian dùng thử — khi được duyệt, hạn dùng của bạn sẽ tự động nâng lên đủ 365 ngày kể từ ngày đăng ký, không cần làm gì thêm.
              </p>
            </div>
          </div>
        ) : (
          <VerificationForm
            verificationForm={verificationForm}
            setVerificationForm={setVerificationForm}
            handleVerificationSubmit={handleVerificationSubmit}
            handleLogout={handleLogout}
            verifying={verifying}
          />
        )}
      </div>
    </div>
  );
}
