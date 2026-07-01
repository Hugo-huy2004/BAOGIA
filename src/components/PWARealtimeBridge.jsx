import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import { getMemberSession } from '../services/authSession';
import { useJoyStore } from '../stores/joyStore';
import { webPushHelper } from '../utils/webPushHelper';
import { motion, AnimatePresence } from 'framer-motion';
import { playNotificationSound } from '../utils/audio';
import { isNotificationSoundEnabled } from '../utils/notificationSoundPref';

const apiBase = import.meta.env.VITE_API_URL || '/api';

function realtimeUrl(email) {
  const apiUrl = new URL(apiBase, window.location.origin);
  const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  const basePath = apiUrl.pathname.replace(/\/api\/?$/, '').replace(/\/$/, '');
  return `${protocol}//${apiUrl.host}${basePath}/ws?token=${encodeURIComponent(email)}`;
}

export default function PWARealtimeBridge() {
  useLocation(); // Re-evaluate the stored member session after login/logout navigation.
  const session = getMemberSession();
  const email = session?.email;
  const retryTimer = useRef(null);
  const retryCount = useRef(0);
  // Guard: show the push nudge at most once per browser session.
  const pushNudgeFired = useRef(false);

  useEffect(() => {
    if (!email) return undefined;
    let socket;
    let disposed = false;

    const sync = () => useJoyStore.getState().fetchBalance(email);
    const connect = () => {
      if (disposed) return;
      socket = new WebSocket(realtimeUrl(email));
      socket.addEventListener('open', () => {
        retryCount.current = 0;
        sync();
      });
      socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'bio_status_update') {
            // Admin approved/rejected a verification request — push the new
            // bio fields straight into the portal so it updates instantly,
            // no manual reload needed.
            window.dispatchEvent(new CustomEvent('hugo:bio-update', { detail: data }));
            if (data.isEduVerified) {
              if (isNotificationSoundEnabled()) playNotificationSound();
              toast.success('Tài khoản của bạn đã được xác minh sinh viên! Hạn dùng đã được nâng lên 365 ngày.', { duration: 6000 });
            }
            return;
          }

          if (data.type !== 'joy_update') return;
          useJoyStore.getState().setBalance(Number(data.balance) || 0);
          window.dispatchEvent(new CustomEvent('hugo:notification', { detail: data.notification }));
          if (data.notification && data.amount > 0) {
            
            // Banking-style Custom Toast
            toast.custom((t) => (
              <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className={`${
                  t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-sm w-full glass bg-card/90 shadow-2xl rounded-2xl pointer-events-auto flex items-center p-4 gap-4 border border-emerald-500/30 dark:border-emerald-500/20`}
              >
                <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                  <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    account_balance_wallet
                  </span>
                </div>
                
                <div className="flex-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Nhận Thưởng</p>
                  <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
                    {data.notification.message || `Tài khoản nhận điểm thưởng mới.`}
                  </p>
                </div>
                
                <div className="shrink-0 flex flex-col items-end pl-2 border-l border-border/50">
                  <span className="text-emerald-500 font-bold text-lg leading-none mb-1">
                    +{data.amount}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">JOY</span>
                </div>
              </motion.div>
            ), {
              id: `joy-${data.notification._id || data.createdAt}`,
              duration: 5000,
              position: 'top-center'
            });

          }
        } catch (_) {}
      });
      socket.addEventListener('close', () => {
        if (disposed) return;
        const delay = Math.min(30000, 1000 * (2 ** retryCount.current++));
        retryTimer.current = window.setTimeout(connect, delay);
      });
    };

    connect();
    sync();

    const handleResume = () => {
      if (document.visibilityState === 'visible') sync();
    };
    const handleOnline = () => {
      sync();
      if (!socket || socket.readyState > WebSocket.OPEN) connect();
    };
    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('focus', sync);
    window.addEventListener('online', handleOnline);
    const handlePushMessage = (event) => {
      if (event.data?.type !== 'HUGO_PUSH') return;
      sync();
      window.dispatchEvent(new CustomEvent('hugo:notification', { detail: event.data.payload }));
    };
    navigator.serviceWorker?.addEventListener('message', handlePushMessage);

    // Always subscribe silently when permission is already granted.
    if (webPushHelper.isSupported() && Notification.permission === 'granted') {
      webPushHelper.registerAndSubscribe(email).catch(() => {});
    }

    // Proactively nudge the user to enable push when they haven't decided yet.
    // Fires once per session, 4 s after login so the page has settled.
    let nudgeTimer = null;
    if (!pushNudgeFired.current && webPushHelper.isSupported() && 'Notification' in window) {
      pushNudgeFired.current = true;
      nudgeTimer = window.setTimeout(() => {
        const perm = Notification.permission;
        if (perm === 'denied') {
          toast('Thông báo đang bị tắt. Vào cài đặt trình duyệt để bật lại nhé!', {
            icon: '🔕',
            duration: 5000,
          });
          return;
        }
        if (perm === 'default') {
          toast.custom((t) => (
            <motion.div
              initial={{ opacity: 0, y: -40, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
              className={`${t.visible ? '' : 'pointer-events-none opacity-0'} max-w-sm w-full bg-white dark:bg-[#16151f] shadow-2xl rounded-2xl pointer-events-auto flex items-center p-3 gap-3 border border-blue-200/70 dark:border-blue-900/40`}
            >
              <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-bold text-zinc-900 dark:text-white leading-tight">Bật thông báo?</p>
                <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-snug mt-0.5">Nhận cập nhật JOY, xác minh tài khoản và tin nhắn quan trọng</p>
              </div>
              <button
                onClick={async () => {
                  toast.dismiss(t.id);
                  const result = await webPushHelper.requestPermission();
                  if (result === 'granted') {
                    await webPushHelper.registerAndSubscribe(email).catch(() => {});
                    toast.success('Đã bật thông báo! 🎉', { duration: 3000 });
                  }
                }}
                className="shrink-0 px-3 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-[11px] font-bold rounded-xl transition-all shadow-sm"
              >
                Bật ngay
              </button>
            </motion.div>
          ), { id: 'push-nudge', duration: 14000, position: 'top-center' });
        }
      }, 4000);
    }

    return () => {
      disposed = true;
      window.clearTimeout(retryTimer.current);
      if (nudgeTimer) window.clearTimeout(nudgeTimer);
      // Only close if past CONNECTING (readyState 0) to avoid the
      // "WebSocket is closed before the connection is established" warning
      // that React StrictMode triggers by double-invoking effects.
      if (socket && socket.readyState !== WebSocket.CONNECTING) {
        socket.close();
      } else if (socket) {
        socket.addEventListener('open', () => socket.close(), { once: true });
      }
      document.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('focus', sync);
      window.removeEventListener('online', handleOnline);
      navigator.serviceWorker?.removeEventListener('message', handlePushMessage);
    };
  }, [email]);

  useEffect(() => {
    if (import.meta.env.DEV) return undefined;
    if (!('serviceWorker' in navigator)) return undefined;
    let interval;
    let isRefreshing = false;
    const checkForUpdate = async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration?.update().catch(() => {});
    };
    checkForUpdate();
    interval = window.setInterval(checkForUpdate, 60_000);
    const activateUpdate = () => {
      if (isRefreshing || !navigator.serviceWorker.controller) return;
      isRefreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', activateUpdate);
    document.addEventListener('visibilitychange', checkForUpdate);
    return () => {
      window.clearInterval(interval);
      navigator.serviceWorker.removeEventListener('controllerchange', activateUpdate);
      document.removeEventListener('visibilitychange', checkForUpdate);
    };
  }, []);

  return null;
}
