import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { renderNotification } from '../../../shared/notificationText';

// Hộp thoại này bật lên từ một thông báo yêu cầu thanh toán, nên chữ của nó
// phải theo cùng một luật với hộp thư: tiêu đề mượn đúng khoá của thông báo
// (shared/notificationText.js), nút bấm lấy từ i18n. Trước đây cả ba chuỗi đều
// viết cứng tiếng Việt ngay trong JSX.
export default function PaymentRequestModal({ isOpen, notification, onClose, onAction }) {
  const { t, i18n } = useTranslation();
  if (!isOpen || !notification) return null;

  const fallbackTitle = renderNotification('event.paymentRequest', {}, i18n.resolvedLanguage || i18n.language)?.title;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4"
        >
          <div className="flex items-center gap-3 text-primary">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings:"'FILL' 1" }}>payments</span>
            <h3 className="font-extrabold text-base tracking-tight text-foreground">
              {notification.title || fallbackTitle}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
            {notification.message}
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-3 rounded-xl border border-border text-[11px] font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-muted transition-colors"
            >
              {t('memberPortal.permissions.later')}
            </button>
            <button
              type="button"
              onClick={onAction}
              className="py-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-[11px] font-bold shadow-md transition-colors"
            >
              {t('utilities.store.cart.checkout')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
