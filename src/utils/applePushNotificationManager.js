/**
 * applePushNotificationManager.js
 * Quản lý Thông Báo Ngầm Chuẩn Apple iOS (Web Push & Local Periodic Notifications).
 * Tự động nhắc nhở phác đồ dưỡng da 21:00 và kiểm tra sức khỏe tinh thần ngầm.
 */

export const ApplePushNotificationManager = {
  async requestNotificationPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }

    if (Notification.permission === "granted") {
      return "granted";
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return "denied";
  },

  /**
   * Đặt lịch thông báo cục bộ ngầm (Local Notification)
   */
  async scheduleLocalNotification({ title, body, icon = "/favicon/web-app-manifest-192x192.png", delayMs = 0 }) {
    const permission = await this.requestNotificationPermission();
    if (permission !== "granted") return false;

    const showNotify = () => {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon,
            badge: "/favicon/apple-touch-icon.png",
            vibrate: [100, 50, 100],
            tag: "apple-hugo-studio-notify",
            renotify: true,
            data: { url: window.location.href }
          });
        });
      } else {
        new Notification(title, { body, icon });
      }
    };

    if (delayMs > 0) {
      setTimeout(showNotify, delayMs);
    } else {
      showNotify();
    }

    return true;
  },

  /**
   * Đăng ký nhắc nhở dưỡng da buổi tối 21:00 ngầm
   */
  scheduleEveningSkincareRoutine() {
    const now = new Date();
    const target = new Date();
    target.setHours(21, 0, 0, 0);

    if (now > target) {
      target.setDate(target.getDate() + 1); // Lùi sang 21:00 tối mai
    }

    const delayMs = target.getTime() - now.getTime();
    this.scheduleLocalNotification({
      title: "Hugo Skin — Phác Đồ Buổi Tối 🌙",
      body: "Đã đến 21:00! Đừng quên thực hiện các bước dưỡng da phác đồ tối nay.",
      delayMs
    });
  }
};
