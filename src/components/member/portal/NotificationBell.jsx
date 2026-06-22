import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const CATEGORY_ICON = {
  verification: 'verified_user',
  package:      'card_membership',
  wellness:     'favorite',
  security:     'security',
  payment:      'payments',
  system:       'notifications',
};
const TYPE_COLOR = {
  success: 'text-success',
  warning: 'text-warning',
  info:    'text-primary',
  error:   'text-destructive',
};
const TYPE_BG = {
  success: 'bg-success/10 border-success/20',
  warning: 'bg-warning/10 border-warning/20',
  info:    'bg-info/10 border-info/20',
  error:   'bg-destructive/10 border-destructive/20',
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

export default function NotificationBell({ notifications, unreadCount, onMarkRead, onMarkAllRead, onDismiss, onOpen }) {
  const [open, setOpen]       = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const ref = useRef(null);

  // Track viewport size
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Close dropdown on outside click (desktop only)
  useEffect(() => {
    if (isMobile) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [isMobile]);

  // Prevent body scroll when mobile sheet is open
  useEffect(() => {
    if (isMobile && open) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && onOpen) onOpen();
  };

  const panelContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-foreground">Thông báo</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-destructive text-white rounded-full text-[9px] font-black">{unreadCount}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button type="button" onClick={onMarkAllRead}
              className="text-[10px] font-bold text-primary dark:text-primary hover:underline">
              Đọc tất cả
            </button>
          )}
          {isMobile && (
            <button type="button" onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
              <span className="material-symbols-outlined text-sm text-muted-foreground">close</span>
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 max-h-[55vh] md:max-h-80 overscroll-contain">
        {notifications.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <span className="material-symbols-outlined text-4xl text-muted-foreground/40 block">notifications_off</span>
            <p className="text-xs text-muted-foreground font-semibold">Không có thông báo nào</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => !n.read && onMarkRead(n._id)}
                className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors ${
                  n.read
                    ? 'opacity-55 hover:bg-muted'
                    : `${TYPE_BG[n.type] || TYPE_BG.info} hover:opacity-90`
                }`}
              >
                <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-muted border border-border ${TYPE_COLOR[n.type] || TYPE_COLOR.info}`}>
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {CATEGORY_ICON[n.category] || CATEGORY_ICON.system}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <p className={`text-[11px] font-bold leading-snug ${n.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {n.title}
                    </p>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-0.5 shrink-0" />}
                  </div>
                  {n.message && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                  )}
                  <p className="text-[9px] text-muted-foreground mt-1 font-mono">{timeAgo(n.createdAt)}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDismiss(n._id); }}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-0.5 p-1 active:scale-90"
                  aria-label="Xóa"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-border shrink-0">
          <p className="text-[9px] text-muted-foreground text-center font-semibold">Thông báo tự xóa sau 90 ngày</p>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {open && isMobile && (
          <motion.div
            key="notif-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[148]"
          />
        )}
      </AnimatePresence>

      <div className="relative" ref={ref}>
        {/* Bell button */}
        <button
          type="button"
          onClick={toggle}
          className="relative w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:bg-muted/70 active:scale-95 transition-all overflow-visible"
          aria-label="Thông báo"
        >
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: unreadCount > 0 ? "'FILL' 1" : "'FILL' 0" }}>
            notifications
          </span>
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 min-w-[17px] h-[17px] bg-destructive rounded-full text-[9px] text-white font-black flex items-center justify-center px-0.5 shadow-md ring-2 ring-background pointer-events-none"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* ── DESKTOP: dropdown ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {open && !isMobile && (
            <motion.div
              key="notif-desktop"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="absolute right-0 top-11 w-[360px] bg-white/96 dark:bg-card/96 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl z-[200] overflow-hidden flex flex-col"
            >
              {panelContent}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── MOBILE: bottom sheet (outside relative container so it's truly fixed) */}
      <AnimatePresence>
        {open && isMobile && (
          <motion.div
            key="notif-mobile"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-card rounded-t-3xl z-[149] flex flex-col shadow-2xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {/* Drag handle */}
            <div className="pt-3 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1 bg-muted rounded-full" />
            </div>
            {panelContent}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
