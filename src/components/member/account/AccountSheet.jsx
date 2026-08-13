import { useEffect } from "react";
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
  // Esc đóng sheet, và khoá cuộn nền để nội dung dài không kéo trang phía sau.
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="portal-safe-modal fixed inset-0 z-[500] flex items-end justify-center bg-black/45 p-0 backdrop-blur-xl animate-fadeIn sm:items-center sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`ios-sheet-panel flex max-h-[92dvh] w-full flex-col rounded-t-[34px] border-t border-border/60 bg-card text-left shadow-2xl animate-slideUp sm:max-h-[88vh] sm:rounded-[30px] sm:border ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"}`}
      >
        <div className="shrink-0 px-5 pb-3 pt-2.5">
          <span className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-foreground/15 sm:hidden" aria-hidden="true" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[22px] font-bold leading-tight tracking-[-0.02em] text-foreground">{title}</h3>
              {subtitle && <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 shrink-0 px-1 text-[17px] font-semibold text-primary active:opacity-60"
            >
              {t("memberPortal.accountHub.done")}
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
