import { useEffect, useRef } from 'react';
import { notify } from "../lib/notify";
import { useLocation } from 'react-router-dom';
import { getMemberSession, getMemberToken } from '../services/authSession';
import { useJoyStore } from '../stores/joyStore';
import { webPushHelper } from '../utils/webPushHelper';
import { playNotificationSound } from '../utils/audio';
import { isNotificationSoundEnabled } from '../utils/notificationSoundPref';
import { autoBluePrintPWAPermissions } from '../utils/pwaPermissions';

const apiBase = import.meta.env.VITE_API_URL || '/api';

function realtimeUrl() {
  const apiUrl = new URL(apiBase, window.location.origin);
  const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  const basePath = apiUrl.pathname.replace(/\/api\/?$/, '').replace(/\/$/, '');
  // token is the member JWT — the server derives the email from it after
  // verifying; sending a bare email would let anyone subscribe to any wallet.
  return `${protocol}//${apiUrl.host}${basePath}/ws?token=${encodeURIComponent(getMemberToken() || '')}`;
}

export default function PWARealtimeBridge() {
  useLocation(); // Re-evaluate the stored member session after login/logout navigation.
  const session = getMemberSession();
  const email = session?.email;
  const retryTimer = useRef(null);
  const retryCount = useRef(0);
  // Guard: show the push nudge at most once per browser session.
  const pushNudgeFired = useRef(false);
  const permissionsSetup = useRef(false);

  useEffect(() => {
    if (!email) return undefined;

    // Auto-setup PWA permissions (weather, location, push) on first login
    if (!permissionsSetup.current) {
      permissionsSetup.current = true;
      autoBluePrintPWAPermissions().catch(() => {});
    }
    let socket;
    let disposed = false;

    const abortRef = { current: null };
    const sync = () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      return useJoyStore.getState().fetchBalance(email, abortRef.current.signal).catch(() => {});
    };
    let stableTimer = null;
    const connect = () => {
      if (disposed) return;
      try {
        socket = new WebSocket(realtimeUrl());
      } catch (e) {
        console.warn("WebSocket initialization error:", e);
        retryTimer.current = window.setTimeout(connect, 30000);
        return;
      }

      socket.addEventListener('open', () => {
        stableTimer = window.setTimeout(() => { retryCount.current = 0; }, 4000);
        sync();
      });
      socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'bio_status_update') {
            window.dispatchEvent(new CustomEvent('hugo:bio-update', { detail: data }));
            if (data.isEduVerified) {
              if (isNotificationSoundEnabled()) playNotificationSound();
              notify.success('Tài khoản của bạn đã được xác minh sinh viên! Hạn dùng đã được nâng lên 365 ngày.', { duration: 6000 });
            }
            return;
          }

          if (data.type !== 'joy_update') return;
          useJoyStore.getState().setBalance(Number(data.balance) || 0);
          window.dispatchEvent(new CustomEvent('hugo:notification', { detail: data.notification }));
          if (data.notification) {
            const isCredit = data.amount > 0;
            if (isCredit || data.source !== 'joy_gift_sent') {
              notify.success(`${isCredit ? 'Nhận JOY' : 'Đã dùng JOY'}: ${isCredit ? '+' : ''}${data.amount} JOY - ${data.notification.message || (isCredit ? 'Tài khoản nhận điểm thưởng mới.' : 'Giao dịch hoàn tất.')}`, {
                id: `joy-${data.notification._id || data.createdAt}`,
                duration: 5000,
                position: 'top-center'
              });
            }
          }
        } catch (_) {}
      });
      socket.addEventListener('error', () => {
        // Suppress console spam on server 503 / network downtime
      });
      socket.addEventListener('close', (event) => {
        if (stableTimer) { window.clearTimeout(stableTimer); stableTimer = null; }
        if (disposed) return;
        if (event.code === 4001) {
          retryTimer.current = window.setTimeout(connect, 5 * 60_000);
          return;
        }
        // Cap backoff at 60s when server returns 503
        const delay = Math.min(60000, Math.max(5000, 1000 * (2 ** Math.min(6, retryCount.current++))));
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
          notify.info('Thông báo đang bị tắt. Vào cài đặt trình duyệt để bật lại nhé!', {
            icon: '🔕',
            duration: 5000,
          });
          return;
        }
        if (perm === 'default') {
          notify.info('Bật thông báo trình duyệt để nhận cập nhật JOY, xác minh tài khoản và tin nhắn quan trọng.', {
            id: 'push-nudge',
            icon: 'notifications',
            duration: 7000,
            position: 'top-center',
          });
        }
      }, 4000);
    }

    return () => {
      disposed = true;
      abortRef.current?.abort();
      window.clearTimeout(retryTimer.current);
      if (stableTimer) window.clearTimeout(stableTimer);
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
