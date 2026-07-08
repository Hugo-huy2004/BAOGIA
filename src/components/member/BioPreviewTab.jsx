import React from "react";
import { getMemberSession } from "../../services/authSession";

// Simple "Trang Bio" utility — Bio editing now lives in Settings, so this tile
// just previews the member's public bio page and points them to Settings to edit.
export default function BioPreviewTab({ bio, publicLink, showToast, onBack }) {
  const ready = !!publicLink;
  const session = getMemberSession();

  // Calculate membership end date (3 years from today for demo; in real case from server)
  const now = new Date();
  const membershipStart = bio?.createdAt ? new Date(bio.createdAt) : now;
  const membershipEnd = new Date(membershipStart.getTime() + 3 * 365 * 24 * 60 * 60 * 1000);

  const formatDate = (date) => date.toLocaleDateString("vi-VN");
  const daysRemaining = Math.max(0, Math.ceil((membershipEnd - now) / (24 * 60 * 60 * 1000)));
  const totalDays = 3 * 365;
  const elapsedDays = Math.max(0, Math.ceil((now - membershipStart) / (24 * 60 * 60 * 1000)));
  const progress = Math.min(100, (elapsedDays / totalDays) * 100);

  const copyLink = async () => {
    if (!ready) return;
    try {
      await navigator.clipboard.writeText(publicLink);
      showToast?.("Đã sao chép link trang Bio", "success");
    } catch {
      showToast?.("Không sao chép được link", "error");
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5 shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-foreground/[0.06] text-foreground transition hover:bg-foreground/10"
          aria-label="Quay lại"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div className="min-w-0">
          <h2 className="font-display text-base font-black leading-none text-foreground">Trang Bio</h2>
          <p className="mt-1 truncate text-[11px] text-muted-foreground">Xem trước trang cá nhân công khai</p>
        </div>
        {ready && (
          <a
            href={publicLink}
            target="_blank"
            rel="noreferrer"
            className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-white shadow-sm transition hover:bg-primary active:scale-95"
            aria-label="Mở trang Bio"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          </a>
        )}
      </div>

      {/* Developer Membership & Bio Expiry section */}
      {ready && session?.email && (
        <div className="space-y-4">
          {/* 3-Year Developer Membership Header */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-pink-500/10 border border-amber-500/20 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">3-Year Developer Membership</p>
            <p className="text-sm font-bold text-foreground">Hết hạn: <span className="text-amber-600 dark:text-amber-400">{formatDate(membershipEnd)}</span></p>
          </div>

          {/* Bio Package Info */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1 mb-3">Trang Bio sở hữu</h3>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/15 via-pink-500/15 to-amber-500/10 border border-purple-500/30 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">GÓI CÓ BẢN</p>
                  <p className="text-sm font-black text-foreground mt-1">BIO + MEMBERSHIP</p>
                </div>
                <span className="material-symbols-outlined text-2xl text-purple-600/60">verified_user</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground font-bold">NGÀY BẮT ĐẦU</p>
                  <p className="text-foreground font-bold mt-0.5">{formatDate(membershipStart)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-bold">HẠN DÙNG BIO</p>
                  <p className="text-purple-600 dark:text-purple-400 font-bold mt-0.5">{formatDate(membershipEnd)}</p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="h-2.5 rounded-full bg-gradient-to-r from-purple-200/50 to-pink-200/50 dark:from-purple-900/50 dark:to-pink-900/50 overflow-hidden border border-border/30">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground flex justify-between">
                  <span>{elapsedDays}/{totalDays} ngày</span>
                  <span>Còn {daysRemaining} ngày</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {ready ? (
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          {/* Edit hint */}
          <div className="flex items-start gap-2.5 border-b border-border bg-primary/[0.05] p-3.5">
            <span className="material-symbols-outlined mt-0.5 text-[18px] text-primary">info</span>
            <p className="text-[12px] leading-relaxed text-foreground/85">
              Chỉnh sửa nội dung Bio tại <b>Cài đặt › Thông tin cá nhân</b> — thay đổi sẽ tự cập nhật ở bản xem trước bên dưới.
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-1.5 border-b border-border bg-foreground/[0.03] px-3.5 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning" />
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
            <span className="ml-2 flex-1 truncate text-[10.5px] text-muted-foreground">{publicLink}</span>
            <button
              type="button"
              onClick={copyLink}
              className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
              aria-label="Sao chép link"
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
            </button>
          </div>

          {/* Live preview */}
          <iframe
            key={bio?.updatedAt || publicLink}
            src={publicLink}
            title="Xem trước trang Bio"
            className="h-[68vh] w-full bg-card"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card py-16 text-center shadow-sm">
          <span className="material-symbols-outlined text-4xl text-muted-foreground/50">badge</span>
          <p className="mt-3 text-sm font-black text-foreground">Trang Bio chưa sẵn sàng</p>
          <p className="mt-1 max-w-xs px-6 text-[11px] text-muted-foreground">
            Hãy hoàn tất thông tin tại <b>Cài đặt › Thông tin cá nhân</b> để có link trang Bio công khai.
          </p>
        </div>
      )}
    </div>
  );
}
