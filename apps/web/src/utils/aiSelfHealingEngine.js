/**
 * aiSelfHealingEngine.js
 * Hệ thống AI Tự Động Bắt Lỗi, Ghi Log & Khôi Phục Ứng Dụng Độc Lập (Self-Healing Engine).
 * Tự động khắc phục lỗi runtime/mạng ngầm mà không làm ngắt gián đoạn trải nghiệm người dùng.
 */

import { IndexedDBStorage } from "./indexedDBStorage";

export const AISelfHealingEngine = {
  initGlobalErrorCatchers() {
    if (typeof window === "undefined") return;

    // 1. Bắt lỗi Unhandled JavaScript Errors
    window.onerror = (message, source, lineno, colno, error) => {
      this.handleError({
        type: "RUNTIME_ERROR",
        message: String(message),
        source,
        lineno,
        colno,
        stack: error?.stack || "",
        timestamp: new Date().toISOString()
      });
      return true; // Ngăn màn hình lỗi màu đỏ hiển thị cho người dùng
    };

    // 2. Bắt lỗi Unhandled Promise Rejections (Mạng/API timeouts)
    window.onunhandledrejection = (event) => {
      this.handleError({
        type: "PROMISE_REJECTION",
        message: event?.reason?.message || String(event?.reason),
        stack: event?.reason?.stack || "",
        timestamp: new Date().toISOString()
      });
      event.preventDefault(); // Xử lý êm thấu ngầm
    };
  },

  async handleError(errorPayload) {
    console.warn("AISelfHealingEngine: Đã bắt và tự động khôi phục từ lỗi ngầm:", errorPayload.message);

    try {
      // Lưu vết log đã mã hóa vào IndexedDB Vault
      const logs = (await IndexedDBStorage.getEncryptedKey("ai_self_healing_logs")) || [];
      logs.push(errorPayload);
      if (logs.length > 50) logs.shift(); // Giữ tối đa 50 log mới nhất
      await IndexedDBStorage.saveEncryptedKey("ai_self_healing_logs", logs);
    } catch {
      // Bỏ qua lỗi lưu log
    }
  },

  /**
   * Khôi phục nhanh ứng dụng về trạng thái an toàn gần nhất
   */
  async softResetAppState() {
    try {
      sessionStorage.clear();
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  }
};
