/**
 * pwaUpdateManager.js
 * Quản lý Cập Nhật 1-Chạm (1-Tap Hot Update) & Bảo Vệ Dữ Liệu An Toàn Trước/Sau Update.
 * Giúp người dùng PWA cập nhật phiên bản mới nhất tức thì mà KHÔNG CẦN xóa PWA hay tải lại từ web.
 */

import { IndexedDBStorage } from "./indexedDBStorage";

export const PWAUpdateManager = {
  registration: null,

  init(registration) {
    this.registration = registration;
  },

  /**
   * Sao lưu an toàn dữ liệu cá nhân trước khi áp dụng bản cập nhật
   */
  async backupUserDataBeforeUpdate() {
    try {
      const brainStore = await IndexedDBStorage.getEncryptedKey("on_device_brain_store");
      const scanHistory = await IndexedDBStorage.getEncryptedKey("skin_scan_history");

      await IndexedDBStorage.saveEncryptedKey("pre_update_backup_snapshot", {
        brainStore,
        scanHistory,
        backupTime: new Date().toISOString()
      });
      console.log("PWAUpdateManager: Đã sao lưu dữ liệu an toàn trước khi Update!");
    } catch (e) {
      console.warn("Lỗi sao lưu trước Update:", e);
    }
  },

  /**
   * Kích hoạt Cập nhật 1-Chạm (Skip Waiting & Hot Swap Service Worker)
   */
  async applyHotUpdate() {
    await this.backupUserDataBeforeUpdate();

    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }

    // Tự động nạp lại ứng dụng với bản mã mới nhất
    window.location.reload();
  }
};
