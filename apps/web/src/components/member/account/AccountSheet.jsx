import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

/**
 * Tấm sheet dùng chung cho mọi thứ mở ra từ trang Tài khoản: thông tin cá nhân,
 * ví JOY, nhiệm vụ, cửa hàng, tài liệu…
 *
 * Trước đây mỗi mục tự dựng lại một lớp phủ + panel + nút đóng, nên bốn bản sao
 * lệch nhau về bo góc, chiều cao và cách cuộn. Giờ chỉ còn một chỗ: sửa ở đây
 * là mọi sheet đổi theo.
 *
 * BẮT BUỘC đi qua `createPortal` ra thẳng <body>: trên mobile, vùng cuộn của
 * portal (`.mobile-portal-content`) mang `transform: translateZ(0)` để lớp kính
 * của thanh tab có ảnh mà lấy mẫu. Một phần tử `position: fixed` nằm trong đó
 * lấy CHÍNH khối cha ấy làm gốc toạ độ chứ không phải khung nhìn — `inset-0`
 * hoá ra cao bằng cả trang, và sheet rơi xuống đáy trang, hiện ra nửa vời ở
 * lưng chừng màn hình. Đừng bỏ portal đi để "cho gọn".
 */
export default function AccountSheet({ title, subtitle, onClose, children, wide = false }) {
  const { t } = useTranslation();
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef(null);
  const requestClose = useCallback(() => {
    if (closing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onClose?.();
      return;
    }
    setClosing(true);
    closeTimer.current = window.setTimeout(() => onClose?.(), 260);
  }, [closing, onClose]);

  // Esc đóng sheet.
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") requestClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);

  // Khoá cuộn nền để nội dung dài không kéo trang phía sau.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  return createPortal(
    <div
      className={`portal-safe-modal fixed inset-0 z-[500] flex items-end justify-center bg-black/55 p-0 backdrop-blur-2xl sm:items-center sm:p-4 ${closing ? "account-sheet-backdrop-out" : "animate-fadeIn"}`}
      onClick={(e) => { if (e.target === e.currentTarget) requestClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`ios-sheet-panel flex max-h-[92dvh] w-full flex-col rounded-t-[36px] border-t border-border/70 bg-card/95 backdrop-blur-xl text-left shadow-2xl sm:max-h-[88vh] sm:rounded-[32px] sm:border ${closing ? "account-sheet-slide-down" : "animate-slideUp"} ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"}`}
      >
        <div className="shrink-0 px-6 pb-3 pt-3 border-b border-border/40 bg-muted/20">
          <span className="mx-auto mb-3 block h-1.5 w-12 rounded-full bg-foreground/20 sm:hidden" aria-hidden="true" />
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[20px] font-extrabold leading-tight tracking-[-0.02em] text-foreground">{title}</h3>
              {subtitle && <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={requestClose}
              className="flex min-h-[38px] shrink-0 items-center justify-center rounded-full bg-primary/10 px-4 text-[14px] font-bold text-primary transition-colors hover:bg-primary hover:text-white active:scale-95"
            >
              {t("memberPortal.accountHub.done")}
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
