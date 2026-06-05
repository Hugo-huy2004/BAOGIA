/**
 * Frontend Utility Helper - Web Push Notification System
 * Hỗ trợ đăng ký Service Worker và gửi đối tượng Subscription Object lên server.
 */

// Hàm phụ để convert khóa VAPID Public Key dạng base64 sang Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

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

    try {
      // 1. Đăng ký Service Worker sw.js nằm ở thư mục root
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('✅ Service Worker registered successfully:', registration);

      // 2. Gọi API lấy VAPID Public Key từ server
      const keyResponse = await fetch(`${API_BASE_URL}/notifications/vapid-public-key`);
      if (!keyResponse.ok) {
        throw new Error('Không thể lấy VAPID Public Key từ máy chủ.');
      }
      const { publicKey } = await keyResponse.json();

      if (!publicKey) {
        throw new Error('VAPID Public Key trống hoặc không hợp lệ.');
      }

      // 3. Đăng ký Push với Google FCM thông qua trình duyệt
      const applicationServerKey = urlBase64ToUint8Array(publicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true, // Bắt buộc là true đối với bảo mật trên Chrome
        applicationServerKey: applicationServerKey
      });

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
  }
};
