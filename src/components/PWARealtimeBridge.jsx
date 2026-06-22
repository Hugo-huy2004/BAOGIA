import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import { getMemberSession } from '../services/authSession';
import { useJoyStore } from '../stores/joyStore';
import { webPushHelper } from '../utils/webPushHelper';

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
          if (data.type !== 'joy_update') return;
          useJoyStore.getState().setBalance(Number(data.balance) || 0);
          window.dispatchEvent(new CustomEvent('hugo:notification', { detail: data.notification }));
          if (data.notification && data.amount > 0) {
            toast.success(data.notification.message || `Bạn vừa nhận ${data.amount} JOY`, {
              id: `joy-${data.notification._id || data.createdAt}`,
              icon: '✨',
              duration: 6000,
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

    if (webPushHelper.isSupported() && Notification.permission === 'granted') {
      webPushHelper.registerAndSubscribe(email).catch(() => {});
    }

    return () => {
      disposed = true;
      window.clearTimeout(retryTimer.current);
      socket?.close();
      document.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('focus', sync);
      window.removeEventListener('online', handleOnline);
      navigator.serviceWorker?.removeEventListener('message', handlePushMessage);
    };
  }, [email]);

  useEffect(() => {
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
