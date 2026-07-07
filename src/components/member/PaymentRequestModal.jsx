import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PaymentRequestModal({ isOpen, notification, onClose, onAction }) {
  if (!isOpen || !notification) return null;

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
              {notification.title || "Yêu cầu thanh toán"}
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
              Để sau
            </button>
            <button
              type="button"
              onClick={onAction}
              className="py-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-[11px] font-bold shadow-md transition-colors"
            >
              Thanh toán ngay
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
