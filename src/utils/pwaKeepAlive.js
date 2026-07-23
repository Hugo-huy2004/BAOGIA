/**
 * pwaKeepAlive.js
 * Smart On-Demand Pre-Wake Protocol cho Render.
 * Chỉ đánh thức server ngầm KHI NGƯỜI DÙNG BẬT APP, tuyệt đối không ping định kỳ 24/7
 * để tiết kiệm 100% hạn ngạch 750 giờ free/tháng của Render.
 */

const API_BASE = import.meta.env.VITE_API_URL || "/api";
let preWoken = false;

export const PWAKeepAlive = {
  startKeepAlive() {
    // Chỉ pre-wake 1 lần duy nhất khi người dùng mở ứng dụng
    if (preWoken) return;
    preWoken = true;

    this.pingServer();
  },

  async pingServer() {
    try {
      await fetch(`${API_BASE}/health`, { method: "GET", cache: "no-store" });
    } catch {
      // Bỏ qua nếu offline
    }
  },

  stopKeepAlive() {
    preWoken = false;
  }
};

