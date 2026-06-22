import { useState, useCallback, useRef, useEffect } from 'react';
import dataApi from '../services/dataApi';

// Only these categories are saved to DB — everything else is toast-only
const PERSISTENT = new Set(['verification', 'package', 'wellness', 'security', 'joy']);

export function useNotifications(email) {
  const [items, setItems] = useState([]);
  const [toast, setToast] = useState({ message: '', type: '' });
  const toastTimer = useRef(null);

  const unreadCount = items.filter(n => !n.read).length;

  const refresh = useCallback(async () => {
    if (!email) return;
    try {
      const { notifications } = await dataApi.getInbox(email, 30);
      setItems(notifications);
    } catch (_) {}
  }, [email]);

  // Load on mount
  useEffect(() => { refresh(); }, [refresh]);

  // Realtime JOY events are persisted by the server; refresh the inbox instead
  // of creating a duplicate notification on the client.
  useEffect(() => {
    const handleRealtimeNotification = () => refresh();
    window.addEventListener('hugo:notification', handleRealtimeNotification);
    return () => window.removeEventListener('hugo:notification', handleRealtimeNotification);
  }, [refresh]);

  // Transient toast only — never hits DB
  const showToast = useCallback((message, type = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast({ message: '', type: '' }), 4000);
  }, []);

  /**
   * Smart notification: always shows a toast.
   * If category is in PERSISTENT set, also saves to DB inbox.
   *
   * @param {{ category, type, title, message, actionUrl }} config
   */
  const sendNotification = useCallback(async ({
    category = 'system',
    type = 'info',
    title,
    message = '',
    actionUrl = ''
  }) => {
    const toastType = type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'success';
    showToast(title, toastType);

    if (!email || !PERSISTENT.has(category)) return;
    try {
      const { notification } = await dataApi.createNotification(email, type, category, title, message, actionUrl);
      setItems(prev => [notification, ...prev]);
    } catch (_) {}
  }, [email, showToast]);

  const markRead = useCallback(async (id) => {
    setItems(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    await dataApi.markNotificationRead(id).catch(() => {});
  }, []);

  const markAllRead = useCallback(async () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    if (email) await dataApi.markAllNotificationsRead(email).catch(() => {});
  }, [email]);

  const dismiss = useCallback(async (id) => {
    setItems(prev => prev.filter(n => n._id !== id));
    await dataApi.deleteNotification(id).catch(() => {});
  }, []);

  return {
    notifications: items,
    unreadCount,
    toast,
    setToast,
    showToast,
    sendNotification,
    markRead,
    markAllRead,
    dismiss,
    refresh,
  };
}
