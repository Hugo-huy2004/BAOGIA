import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import dataApi from '../services/dataApi';
import { renderNotification } from '../../shared/notificationText';
import { playNotificationSound } from '../utils/audio';
import { isNotificationSoundEnabled } from '../utils/notificationSoundPref';

// Only these categories are saved to DB — everything else is toast-only
const PERSISTENT = new Set(['verification', 'package', 'wellness', 'security', 'joy', 'payment']);
const EMPTY_NOTIFICATIONS = [];

const asList = (value) => Array.isArray(value) ? value : [];
const countUnread = (value) => asList(value).filter(item => !item.read).length;
const sortNewestFirst = (value) => [...value].sort(
  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
);

export function useNotifications(
  email,
  bootstrapItems = EMPTY_NOTIFICATIONS,
  bootstrapUnreadCount,
) {
  const initialItems = asList(bootstrapItems);
  const initialCount = Number(bootstrapUnreadCount);
  const [items, setItems] = useState(() => initialItems);
  const [unreadCount, setUnreadCount] = useState(() => (
    Number.isFinite(initialCount) && initialCount >= 0
      ? initialCount
      : countUnread(initialItems)
  ));
  const { i18n } = useTranslation();
  const language = i18n.language;
  const [toast, setToast] = useState({ message: '', type: '' });
  const toastTimer = useRef(null);
  const itemsRef = useRef(initialItems);
  const unreadCountRef = useRef(unreadCount);
  const currentEmailRef = useRef(email);
  const mutationRevisionRef = useRef(0);
  const locallyReadIdsRef = useRef(new Set());

  const commitItems = useCallback((nextOrUpdater) => {
    setItems(previous => {
      const next = typeof nextOrUpdater === 'function'
        ? nextOrUpdater(previous)
        : nextOrUpdater;
      itemsRef.current = next;
      return next;
    });
  }, []);

  const commitUnreadCount = useCallback((nextOrUpdater) => {
    setUnreadCount(previous => {
      const next = typeof nextOrUpdater === 'function'
        ? nextOrUpdater(previous)
        : nextOrUpdater;
      const safeNext = Math.max(0, Number(next) || 0);
      unreadCountRef.current = safeNext;
      return safeNext;
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!email) return;
    const requestEmail = email;
    const requestRevision = mutationRevisionRef.current;
    try {
      const { notifications } = await dataApi.getInbox(email, 100);
      // Một GET cũ không được phép hoàn tác thao tác "đã đọc" hoặc "xoá" vừa
      // diễn ra trong lúc request còn đang bay.
      if (
        currentEmailRef.current !== requestEmail
        || mutationRevisionRef.current !== requestRevision
      ) return;

      // API cũ, proxy lỗi hoặc response rỗng không được phép biến state thành
      // undefined rồi làm toàn bộ portal trắng ở lần render tiếp theo.
      const next = asList(notifications).map(item => (
        locallyReadIdsRef.current.has(item._id)
          ? { ...item, read: true }
          : item
      ));
      commitItems(next);
      commitUnreadCount(countUnread(next));
    } catch (_) {}
  }, [commitItems, commitUnreadCount, email]);

  // Bootstrap là nguồn dữ liệu đầu tiên; không gọi lại /inbox ngay sau đó.
  // Khi bootstrap được revalidate, trạng thái read:true ở máy luôn thắng bản
  // snapshot cũ read:false để badge không nhảy ngược.
  useEffect(() => {
    if (bootstrapItems?.length) {
      commitItems((previous) => {
        const byId = new Map(previous.map((item) => [item._id, item]));
        bootstrapItems.forEach((item) => {
          const existing = byId.get(item._id);
          byId.set(item._id, {
            ...existing,
            ...item,
            read: Boolean(
              item.read
              || existing?.read
              || locallyReadIdsRef.current.has(item._id)
            ),
          });
        });
        return sortNewestFirst([...byId.values()]);
      });

      // Chỉ nhận tổng từ bootstrap trước khi có thao tác cục bộ. Sau khi người
      // dùng đã đọc/xoá, tổng cũ không còn đủ mới để ghi đè.
      const count = Number(bootstrapUnreadCount);
      if (
        mutationRevisionRef.current === 0
        && Number.isFinite(count)
        && count >= 0
      ) {
        commitUnreadCount(count);
      }
    }
  }, [bootstrapItems, bootstrapUnreadCount, commitItems, commitUnreadCount]);

  useEffect(() => {
    currentEmailRef.current = email;
    mutationRevisionRef.current += 1;
    locallyReadIdsRef.current.clear();

    if (!email) {
      commitItems([]);
      commitUnreadCount(0);
      return;
    }

    const hasBootstrapSnapshot = Number.isFinite(Number(bootstrapUnreadCount));
    if (!hasBootstrapSnapshot) refresh();
  }, [bootstrapUnreadCount, commitItems, commitUnreadCount, email, refresh]);

  // The WS path (PWARealtimeBridge) already hands us the full persisted
  // notification document — splice it straight into state instead of paying
  // for a whole extra GET /inbox round trip. The background-push path only
  // carries a display payload (no _id), so that one still falls back to a
  // real refresh.
  useEffect(() => {
    const handleRealtimeNotification = (e) => {
      const incoming = e.detail;
      if (isNotificationSoundEnabled()) playNotificationSound();
      if (incoming?._id) {
        const previous = itemsRef.current;
        const existing = previous.find(item => item._id === incoming._id);
        const merged = {
          ...existing,
          ...incoming,
          read: Boolean(
            incoming.read
            || existing?.read
            || locallyReadIdsRef.current.has(incoming._id)
          ),
        };
        const next = existing
          ? previous.map(item => item._id === incoming._id ? merged : item)
          : [merged, ...previous];
        const delta = Number(!merged.read) - Number(existing && !existing.read);
        commitItems(sortNewestFirst(next));
        if (delta) commitUnreadCount(count => count + delta);
      } else {
        refresh();
      }
    };
    window.addEventListener('hugo:notification', handleRealtimeNotification);
    return () => window.removeEventListener('hugo:notification', handleRealtimeNotification);
  }, [commitItems, commitUnreadCount, refresh]);

  // Transient toast only — never hits DB
  const showToast = useCallback((message, type = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast({ message: '', type: '' }), 4000);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
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
      if (!notification?._id) return;
      const previous = itemsRef.current;
      if (previous.some(item => item._id === notification._id)) return;
      commitItems([notification, ...previous]);
      if (!notification.read) commitUnreadCount(count => count + 1);
    } catch (_) {}
  }, [commitItems, commitUnreadCount, email, showToast]);

  const markRead = useCallback(async (id) => {
    const target = itemsRef.current.find(item => item._id === id);
    if (!target || target.read) return true;

    const previousItems = itemsRef.current;
    const previousUnreadCount = unreadCountRef.current;
    const revision = ++mutationRevisionRef.current;
    locallyReadIdsRef.current.add(id);
    commitItems(previousItems.map(item => item._id === id ? { ...item, read: true } : item));
    commitUnreadCount(previousUnreadCount - 1);

    try {
      await dataApi.markNotificationRead(id);
      return true;
    } catch (_) {
      if (mutationRevisionRef.current === revision) {
        locallyReadIdsRef.current.delete(id);
        commitItems(previousItems);
        commitUnreadCount(previousUnreadCount);
      }
      return false;
    }
  }, [commitItems, commitUnreadCount]);

  const markAllRead = useCallback(async () => {
    const previousItems = itemsRef.current;
    const previousUnreadCount = unreadCountRef.current;
    if (previousUnreadCount === 0) return true;

    const revision = ++mutationRevisionRef.current;
    const newlyReadIds = previousItems
      .filter(item => !item.read && item._id)
      .map(item => item._id);
    newlyReadIds.forEach(id => locallyReadIdsRef.current.add(id));
    commitItems(previousItems.map(item => ({ ...item, read: true })));
    commitUnreadCount(0);

    if (!email) return true;
    try {
      await dataApi.markAllNotificationsRead();
      return true;
    } catch (_) {
      if (mutationRevisionRef.current === revision) {
        newlyReadIds.forEach(id => locallyReadIdsRef.current.delete(id));
        commitItems(previousItems);
        commitUnreadCount(previousUnreadCount);
      }
      return false;
    }
  }, [commitItems, commitUnreadCount, email]);

  const dismiss = useCallback(async (id) => {
    const target = itemsRef.current.find(item => item._id === id);
    if (!target) return true;

    const previousItems = itemsRef.current;
    const previousUnreadCount = unreadCountRef.current;
    const revision = ++mutationRevisionRef.current;
    commitItems(previousItems.filter(item => item._id !== id));
    if (!target.read) commitUnreadCount(previousUnreadCount - 1);

    try {
      await dataApi.deleteNotification(id);
      return true;
    } catch (_) {
      if (mutationRevisionRef.current === revision) {
        commitItems(previousItems);
        commitUnreadCount(previousUnreadCount);
      }
      return false;
    }
  }, [commitItems, commitUnreadCount]);

  // Máy chủ lưu KHOÁ + THAM SỐ chứ không lưu câu (xem shared/notificationText.js),
  // nên câu chữ dựng ở đây theo ngôn ngữ đang dùng — và dựng lại ngay khi người
  // dùng đổi ngôn ngữ. Bản ghi cũ (và tin admin tự viết) không có khoá thì giữ
  // nguyên `title`/`message` đã lưu.
  const localized = useMemo(() => items.map((item) => {
    const text = renderNotification(item.i18nKey, item.i18nParams || {}, language);
    return text ? { ...item, title: text.title, message: text.message } : item;
  }), [items, language]);

  return {
    notifications: localized,
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
