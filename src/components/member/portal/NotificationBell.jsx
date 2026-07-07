import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Each category gets its own accent (icon + left bar), not just a generic
// success/warning/info/error tint — makes the list scannable at a glance
// instead of every item looking the same shade of blue.
const CATEGORY = {
  verification: { icon: 'verified_user', accent: 'text-success', bar: 'bg-success', bg: 'bg-success/10' },
  package:      { icon: 'card_membership', accent: 'text-violet-500', bar: 'bg-violet-500', bg: 'bg-violet-500/10' },
  wellness:     { icon: 'favorite', accent: 'text-pink-500', bar: 'bg-pink-500', bg: 'bg-pink-500/10' },
  security:     { icon: 'security', accent: 'text-rose-500', bar: 'bg-rose-500', bg: 'bg-rose-500/10' },
  payment:      { icon: 'payments', accent: 'text-warning', bar: 'bg-warning', bg: 'bg-warning/10' },
  joy:          { icon: 'paid', accent: 'text-yellow-500', bar: 'bg-yellow-500', bg: 'bg-yellow-500/10' },
  general:      { icon: 'notifications', accent: 'text-primary', bar: 'bg-primary', bg: 'bg-primary/10' },
  system:       { icon: 'notifications', accent: 'text-primary', bar: 'bg-primary', bg: 'bg-primary/10' },
};
const FALLBACK = CATEGORY.system;

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

// Buckets items into "Hôm nay / Hôm qua / Cũ hơn" sections so a long list
// reads like a real notification center instead of one undifferentiated feed.
function groupByDay(items) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const groups = { 'Hôm nay': [], 'Hôm qua': [], 'Cũ hơn': [] };
  for (const n of items) {
    const d = new Date(n.createdAt); d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) groups['Hôm nay'].push(n);
    else if (d.getTime() === yesterday.getTime()) groups['Hôm qua'].push(n);
    else groups['Cũ hơn'].push(n);
  }
  return Object.entries(groups).filter(([, list]) => list.length > 0);
}

function NotificationItem({ n, onMarkRead, onDismiss }) {
  const cfg = CATEGORY[n.category] || FALLBACK;
  return (
    <div
      onClick={() => !n.read && onMarkRead(n._id)}
      className={`relative flex items-start gap-3 px-4 py-3.5 pl-5 cursor-pointer transition-colors ${n.read ? 'opacity-55 hover:bg-muted' : 'hover:bg-muted/60'}`}
    >
      {!n.read && <span className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full ${cfg.bar}`} />}
      <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${cfg.bg} ${cfg.accent}`}>
        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-bold leading-snug ${n.read ? 'text-muted-foreground' : 'text-foreground'}`}>{n.title}</p>
        {n.message && <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>}
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
  );
}

export default function NotificationBell({ notifications, unreadCount, onMarkRead, onMarkAllRead, onDismiss, onOpen }) {
  const [open, setOpen]       = useState(false);
  const [filter, setFilter]   = useState('all');
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const ref = useRef(null);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [isMobile]);

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

  const visible = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;
  const grouped = useMemo(() => groupByDay(visible), [visible]);

  const panelContent = (
    <>
      <div className="px-4 py-3 border-b border-border space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-foreground">Thông báo</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 bg-destructive text-white rounded-full text-[9px] font-black">{unreadCount}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button type="button" onClick={onMarkAllRead} className="text-[10px] font-bold text-primary hover:underline">
                Đọc tất cả
              </button>
            )}
            {isMobile && (
              <button type="button" onClick={() => setOpen(false)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                <span className="material-symbols-outlined text-sm text-muted-foreground">close</span>
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-1.5 p-0.5 bg-muted rounded-lg w-fit">
          {[['all', 'Tất cả'], ['unread', 'Chưa đọc']].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${filter === id ? 'bg-white dark:bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-y-auto flex-1 max-h-[55vh] md:max-h-80 overscroll-contain">
        {grouped.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <span className="material-symbols-outlined text-4xl text-muted-foreground/40 block">notifications_off</span>
            <p className="text-xs text-muted-foreground font-semibold">{filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Không có thông báo nào'}</p>
          </div>
        ) : (
          grouped.map(([label, items]) => (
            <div key={label}>
              <p className="px-4 pt-3 pb-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/70 sticky top-0 bg-white/95 dark:bg-card/95 backdrop-blur-sm">{label}</p>
              <div className="divide-y divide-border">
                {items.map((n) => <NotificationItem key={n._id} n={n} onMarkRead={onMarkRead} onDismiss={onDismiss} />)}
              </div>
            </div>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-border shrink-0">
          <p className="text-[9px] text-muted-foreground text-center font-semibold">Thông báo tự xóa sau 90 ngày</p>
        </div>
      )}
    </>
  );

  return (
    <>
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
