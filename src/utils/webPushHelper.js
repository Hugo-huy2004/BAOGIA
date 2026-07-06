/**
 * Frontend Utility Helper - Web Push Notification System
 * Hỗ trợ đăng ký Service Worker và gửi đối tượng Subscription Object lên server.
 */

// Hàm phụ để convert khóa VAPID Public Key dạng base64 sang Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function applicationServerKeysMatch(subscription, expectedKey) {
  const currentKey = subscription?.options?.applicationServerKey;
  if (!currentKey) return false;
  const currentBytes = new Uint8Array(currentKey);
  if (currentBytes.length !== expectedKey.length) return false;
  return currentBytes.every((byte, index) => byte === expectedKey[index]);
}

async function ensurePushSubscription(registration, applicationServerKey) {
  let existing = await registration.pushManager.getSubscription();

  if (existing && applicationServerKeysMatch(existing, applicationServerKey)) {
    return existing;
  }

  if (existing) {
    await existing.unsubscribe();
    existing = null;
  }

  const options = { userVisibleOnly: true, applicationServerKey };
  try {
    return await registration.pushManager.subscribe(options);
  } catch (error) {
    // Another app instance may have subscribed between getSubscription() and
    // subscribe(). Reuse it when the key matches; otherwise replace it once.
    if (error?.name !== 'InvalidStateError') throw error;
    const current = await registration.pushManager.getSubscription();
    if (current && applicationServerKeysMatch(current, applicationServerKey)) {
      return current;
    }
    if (current) await current.unsubscribe();
    return registration.pushManager.subscribe(options);
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const webPushHelper = {
  /**
   * Kiểm tra xem trình duyệt có hỗ trợ Service Worker và Push Notification không.
   */
  isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },

  /**
   * Yêu cầu người dùng cấp quyền hiển thị thông báo.
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Trình duyệt không hỗ trợ thông báo Notification API.');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Lỗi khi xin cấp quyền thông báo:', error);
      return 'default';
    }
  },

  /**
   * Đăng ký Service Worker và đăng ký Push Subscription lên Server.
   * @param {string} email Email của người dùng hiện tại để liên kết
   */
  async registerAndSubscribe(email) {
    if (!this.isSupported()) {
      console.warn('Thiết bị hoặc trình duyệt không hỗ trợ thông báo đẩy.');
      return null;
    }

    if (import.meta.env.DEV) {
      return null;
    }

    try {
      // 1. Đăng ký Service Worker sw.js nằm ở thư mục root
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('✅ Service Worker registered successfully:', registration);

      // 2. Gọi API lấy VAPID Public Key từ server
      const keyResponse = await fetch(`${API_BASE_URL}/notifications/vapid-public-key`, {
        cache: 'no-store',
        credentials: 'include'
      });
      if (!keyResponse.ok) {
        throw new Error('Không thể lấy VAPID Public Key từ máy chủ.');
      }
      const { publicKey } = await keyResponse.json();

      if (!publicKey) {
        throw new Error('VAPID Public Key trống hoặc không hợp lệ.');
      }

      // 3. Tái sử dụng subscription đúng key, hoặc tự thay subscription cũ.
      const applicationServerKey = urlBase64ToUint8Array(publicKey);
      const subscription = await ensurePushSubscription(registration, applicationServerKey);

      console.log('✅ Browser Push Subscription Object acquired:', subscription);

      // 4. Gửi đối tượng Subscription Object lên server kèm theo email
      const registerResponse = await fetch(`${API_BASE_URL}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          subscription
        })
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        throw new Error(errorData.error || 'Lỗi khi gửi Subscription lên máy chủ.');
      }

      console.log('🎉 Đăng ký Web Push Notification thành công!');
      return subscription;
    } catch (error) {
      console.error('Lỗi trong quá trình đăng ký Web Push:', error);
      throw error;
    }
  },

  /**
   * True nếu thiết bị này đang có một push subscription hoạt động — dùng để
   * đồng bộ trạng thái công tắc trong tab Cài đặt với thực tế của trình duyệt.
   */
  async isSubscribed() {
    if (!this.isSupported()) return false;
    try {
      const registration = await navigator.serviceWorker.getRegistration('/');
      if (!registration) return false;
      const sub = await registration.pushManager.getSubscription();
      return !!sub;
    } catch (_) {
      return false;
    }
  },

  /**
   * Hủy push subscription trên cả trình duyệt và server — đúng nghĩa "tắt"
   * thông báo đẩy, không chỉ ẩn giao diện.
   */
  async unsubscribe() {
    if (!this.isSupported()) return;
    const registration = await navigator.serviceWorker.getRegistration('/');
    const sub = await registration?.pushManager.getSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    await fetch(`${API_BASE_URL}/notifications/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    }).catch(() => {});
  }
};
