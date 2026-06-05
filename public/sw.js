/**
 * Service Worker - Web Push Notification System
 * Hỗ trợ hiển thị thông báo đẩy dưới nền ngay cả khi tắt tab trình duyệt.
 */

// Lắng nghe sự kiện nhận thông báo đẩy từ Server (Google Chrome Push Service)
self.addEventListener('push', function (event) {
  try {
    let payload = {
      title: 'Bạn Học Đường',
      body: 'Bạn có thông báo mới từ Chuyên viên Đồng Hành.',
      icon: '/image/avt7.png', // Logo không nền của mascot
      url: '/member/portal?tab=banhocduong'
    };

    if (event.data) {
      payload = event.data.json();
    }

    const options = {
      body: payload.body,
      icon: payload.icon || '/image/avt7.png',
      badge: '/favicon.ico', // Icon hiển thị trên thanh trạng thái (status bar)
      vibrate: [100, 50, 100], // Rung máy (với thiết bị di động hỗ trợ)
      data: {
        url: payload.url || '/member/portal?tab=banhocduong'
      }
    };

    event.waitUntil(
      self.registration.showNotification(payload.title, options)
    );
  } catch (error) {
    console.error('Lỗi hiển thị thông báo Push:', error);
  }
});

// Lắng nghe sự kiện người dùng click vào thông báo đẩy
self.addEventListener('notificationclick', function (event) {
  try {
    event.notification.close(); // Đóng thông báo hiện tại

    const targetUrl = event.notification.data.url;

    // Tìm kiếm các window hiện có của website và tập trung (focus) vào đó
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
        // Nếu đã có tab của trang web đang mở, chuyển sang tab đó và điều hướng
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes('/member/portal') && 'focus' in client) {
            return client.focus().then(() => client.navigate(targetUrl));
          }
        }
        // Nếu chưa mở tab nào, mở tab mới đến địa chỉ targetUrl
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
    );
  } catch (error) {
    console.error('Lỗi xử lý click thông báo:', error);
  }
});
