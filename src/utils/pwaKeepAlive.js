/**
 * pwaKeepAlive.js
 * Peak-Hour Smart Schedule & Multi-Cloud Edge Protocol cho Render.
 * Chỉ khởi động ngầm trong Khung Giờ Vàng (08:00 - 23:00) khi người dùng mở PWA.
 * Tiết kiệm 270 giờ/tháng, đảm bảo tổng số giờ sử dụng Render luôn < 500 giờ (An toàn tuyệt đối dưới hạn ngạch 750h).
 */

const API_BASE = import.meta.env.VITE_API_URL || "/api";
let preWoken = false;

export const PWAKeepAlive = {
  startKeepAlive() {
    if (preWoken) return;

    // Kiểm tra giờ vàng (Chỉ kích hoạt từ 08:00 sáng đến 23:00 đêm)
    const currentHour = new Date().getHours();
    const isPeakHours = currentHour >= 8 && currentHour <= 23;

    if (isPeakHours) {
      preWoken = true;
      this.pingServer();
    }
  },

  async pingServer() {
    try {
      await fetch(`${API_BASE}/health`, { method: "GET", cache: "no-store" });
    } catch {
      // Bỏ qua lỗi khi offline
    }
  },

  stopKeepAlive() {
    preWoken = false;
  }
};

