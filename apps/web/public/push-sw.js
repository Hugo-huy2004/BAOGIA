/**
 * Service Worker
 * Handles: Web Push Notifications
 * Imported by the Workbox-generated /sw.js in production.
 */


// Remove API responses persisted by older workers, including account data.
self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all(
    ['api-cache', 'user-bootstrap-cache', 'arcade-leaderboard'].map(name => caches.delete(name))
  ));
});

// ── Message handler — SKIP_WAITING + unknown types ────────────────────────
// Workbox's autoUpdate registerType sends a SKIP_WAITING message to activate
// a newly installed SW. Without an explicit handler the channel closes before
// a response arrives, producing the console warning:
//   "A listener indicated an asynchronous response by returning true,
//    but the message channel closed before a response was received"
// Handling it explicitly (and NOT returning true for fire-and-forget types)
// silences that warning completely.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    // Activate the new SW immediately and reply on the same message channel.
    // Some update helpers use MessageChannel and warn if no response arrives.
    event.waitUntil((async () => {
      await self.skipWaiting();
      event.ports?.[0]?.postMessage({ ok: true });
    })());
    return;
  }
  // All other message types are fire-and-forget (no response expected).
  // Do NOT return true — that would tell the browser to expect a response
  // and trigger the warning when none arrives.
});

// ── Precache 404 Auto-Recovery ─────────────────────────────────────────────
// When a new build deployment purges old hashed JS chunks, Workbox precache
// might fail with bad-precaching-response 404. Clean up stale caches gracefully.
self.addEventListener('error', (event) => {
  if (String(event.message || '').includes('bad-precaching-response') || String(event.message || '').includes('404')) {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => {});
  }
});

self.addEventListener('unhandledrejection', (event) => {
  if (String(event.reason || '').includes('bad-precaching-response') || String(event.reason || '').includes('404')) {
    event.preventDefault();
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => {});
  }
});

// Lắng nghe sự kiện nhận thông báo đẩy từ Server (Google Chrome Push Service)
self.addEventListener('push', function (event) {
  try {
    // Service worker không có i18n và cũng không cần: chữ trong thông báo đẩy
    // do máy chủ soạn sẵn theo ngôn ngữ của thiết bị (packages/shared/notificationText.js).
    // Vì vậy câu dự phòng ở đây chỉ còn tên thương hiệu — không ngôn ngữ nào cả,
    // thay cho hai câu tiếng Việt cứng trước kia.
    const FALLBACK_URL = '/member/today';
    let payload = {
      title: 'Hugo Studio',
      body: '',
      icon: '/image/avt7.png', // Logo không nền của mascot
      url: FALLBACK_URL
    };

    if (event.data) {
      try {
        payload = event.data.json();
      } catch (jsonErr) {
        payload = {
          title: 'Hugo Studio',
          body: event.data.text() || '',
          icon: '/image/avt7.png',
          url: FALLBACK_URL
        };
      }
    }

    const options = {
      body: payload.body,
      icon: payload.icon || '/image/avt7.png',
      badge: '/favicon.ico', // Icon hiển thị trên thanh trạng thái (status bar)
      vibrate: [100, 50, 100], // Rung máy (với thiết bị di động hỗ trợ)
      data: {
        url: payload.url || FALLBACK_URL
      },
      // Ví JOY nay nằm trong trang Tài khoản; `/member/joy` là đường cũ nhưng
      // thông báo đã đẩy đi từ trước vẫn mang nó, nên gộp cả hai vào một tag.
      tag: payload.tag || (['/member/account', '/member/joy'].includes(payload.url) ? 'hugo-joy-wallet' : undefined)
    };
    // Chrome bắt buộc renotify phải đi kèm tag khác rỗng
    if (options.tag) options.renotify = true;
    // Thông báo hệ thống (biến động JOY) nằm lại trên màn hình tới khi được chạm.
    if (payload.requireInteraction) options.requireInteraction = true;

    event.waitUntil(
      Promise.all([
        self.registration.showNotification(payload.title, options),
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
          clientList.forEach((client) => client.postMessage({ type: 'HUGO_PUSH', payload }));
        })
      ])
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
          if ('focus' in client) {
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
