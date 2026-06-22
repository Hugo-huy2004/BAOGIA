/**
 * Service Worker
 * Handles: Web Push Notifications + PeriodicBackgroundSync (sleep monitor)
 * Imported by the Workbox-generated /sw.js in production.
 */

// ── PeriodicBackgroundSync — sleep monitor heartbeat ──────────────────────
// Runs in background every 30 min (when PWA is installed + permission granted).
// Reads sleep state written by useSleepAutoDetect hook via CacheStorage.

const SLEEP_CACHE = "hugo-sleep-state-v1";
const API_ORIGIN  = self.registration.scope.replace(/\/$/, "");

self.addEventListener("periodicsync", (event) => {
  if (event.tag !== "sleep-monitor") return;
  event.waitUntil(handleSleepSync());
});

async function handleSleepSync() {
  try {
    const cache   = await caches.open(SLEEP_CACHE);
    const cached  = await cache.match("sleep-user-state");
    if (!cached) return;

    const data    = await cached.json();
    const { email, state, sleepStart, savedAt } = data;
    if (!email) return;

    const ageMs   = Date.now() - (savedAt || 0);
    const hour    = new Date().getHours();

    // If stored state is "sleeping" and it's now morning (4–12h), trigger wake detection
    if (state === "sleeping" && sleepStart && hour >= 4 && hour <= 12 && ageMs > 3 * 3_600_000) {
      const now      = new Date();
      const wakeTime = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;

      await fetch(`${API_ORIGIN}/api/sleep/passive`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          email,
          event:      "wake_onset",
          wakeTime,
          bedtime:    sleepStart.time,
          date:       sleepStart.date,
          confidence: 70,
          signals:    ["sw_periodic_sync"],
        }),
      });

      // Update cache to reflect "awake" state
      await cache.put("sleep-user-state", new Response(
        JSON.stringify({ email, state: "awake", sleepStart: null, savedAt: Date.now() }),
        { headers: { "Content-Type": "application/json" } }
      ));
    }

    // If monitoring and it's evening, send a heartbeat so server knows user is active
    if (state === "monitoring" && hour >= 20) {
      await fetch(`${API_ORIGIN}/api/sleep/passive`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, event: "hidden" }),
      }).catch(() => {});
    }
  } catch (_) {}
}

// Lắng nghe sự kiện nhận thông báo đẩy từ Server (Google Chrome Push Service)
self.addEventListener('push', function (event) {
  try {
    let payload = {
      title: 'Bạn Học Đường - HUGO STUDIO',
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
      },
      tag: payload.tag || (payload.url === '/member/joy' ? 'hugo-joy-wallet' : undefined),
      renotify: true
    };

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
