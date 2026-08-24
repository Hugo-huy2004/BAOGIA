import { useTranslation } from "react-i18next";
import { localeForLanguage } from "../../../i18n/languages";
import { hapticSelect } from "../../../utils/haptics";
import { useJoy } from "../../../lib/joyDisplay";

/**
 * Hóa Đơn Điện Tử Thông Minh (Smart Digital Receipt Modal/Sheet)
 * Hiển thị chi tiết hóa đơn biến động cộng/trừ JOY với giao diện iOS 27 Glassmorphism sắc nét.
 */
export default function TransactionReceiptModal({ tx, onClose, showToast }) {
  const { t, i18n } = useTranslation();
  const locale = localeForLanguage(i18n.resolvedLanguage || i18n.language);
  const joy = useJoy();

  if (!tx) return null;

  const isCredit = (tx.amount ?? 0) >= 0;
  const absAmount = Math.abs(tx.amount || 0);
  const txCode = tx.id ? `JOY-${String(tx.id).toUpperCase()}` : `JOY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const dateFormatted = tx.createdAt
    ? new Date(tx.createdAt).toLocaleString(locale, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      })
    : new Date().toLocaleString(locale);

  const copyCode = async () => {
    hapticSelect();
    try {
      await navigator.clipboard.writeText(txCode);
      showToast?.("Đã sao chép mã giao dịch: " + txCode, "success");
    } catch {
      showToast?.("Không thể sao chép", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn select-none">
      <div
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden transform transition-all animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Receipt Header Visual */}
        <div className={`p-6 text-center border-b relative ${
          isCredit
            ? "bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20"
            : "bg-gradient-to-b from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/20"
        }`}>
          {/* Close Icon */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>

          {/* Badge Icon */}
          <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center shadow-lg mb-3 ${
            isCredit
              ? "bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-emerald-500/30"
              : "bg-gradient-to-tr from-rose-500 to-red-400 text-white shadow-rose-500/30"
          }`}>
            <span className="material-symbols-outlined text-3xl font-black">
              {isCredit ? "add_circle" : "remove_circle"}
            </span>
          </div>

          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide ${
            isCredit
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
          }`}>
            <span>{isCredit ? "Hóa Đơn Cộng JOY (Cộng Vui)" : "Hóa Đơn Trừ JOY (Chi Dùng)"}</span>
          </span>

          {/* Large Amount Display */}
          <div className={`mt-3 font-mono text-3xl font-black tracking-tight ${
            isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          }`}>
            {isCredit ? "+" : "−"}{joy.text(absAmount)}
          </div>
        </div>

        {/* Receipt Body Details */}
        <div className="p-5 space-y-3.5 text-xs">
          {/* Status Bar */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-500 font-bold">Trạng thái giao dịch</span>
            <span className="inline-flex items-center gap-1 font-extrabold text-emerald-600 dark:text-emerald-400">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>Thành công</span>
            </span>
          </div>

          {/* Details Table */}
          <div className="space-y-2.5 py-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Nội dung giao dịch</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-right max-w-[200px] truncate">
                {tx.title || tx.description || "Giao dịch JOY"}
              </span>
            </div>

            {tx.description && (
              <div className="flex items-start justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Mô tả</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-right max-w-[200px]">
                  {tx.description}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Thời gian thực hiện</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {dateFormatted}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Mã hóa đơn</span>
              <button
                type="button"
                onClick={copyCode}
                className="font-mono font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
              >
                <span>{txCode}</span>
                <span className="material-symbols-outlined text-xs">content_copy</span>
              </button>
            </div>

            {tx.balanceAfter !== undefined && (
              <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Số dư JOY còn lại</span>
                <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
                  {joy.text(tx.balanceAfter)}
                </span>
              </div>
            )}
          </div>

          {/* Receipt Footer Smart Actions */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={copyCode}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">content_copy</span>
              <span>Sao chép mã</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-extrabold shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
            >
              <span>Đóng hóa đơn</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
