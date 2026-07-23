/**
 * backgroundSyncEngine.js
 * Đồng bộ dữ liệu ngầm khi có mạng trở lại (Offline-First Background Re-Sync).
 */

import { IndexedDBStorage } from "./indexedDBStorage";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const BackgroundSyncEngine = {
  initListener() {
    if (typeof window === "undefined") return;

    window.addEventListener("online", async () => {
      console.log("Đã nối lại mạng! Đang tiến hành đồng bộ dữ liệu ngầm...");
      await this.flushPendingQueue();
    });
  },

  async flushPendingQueue() {
    try {
      const queue = await IndexedDBStorage.getPendingSyncQueue();
      if (!queue || queue.length === 0) return;

      for (const item of queue) {
        if (item.endpoint === "on_device_brain" || item.endpoint === "chat_encrypted_log") {
          // Ghi nhận nội bộ thành công
          await IndexedDBStorage.clearPendingSyncItem(item.id);
          continue;
        }

        try {
          const res = await fetch(`${API_BASE}/${item.endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item.payload),
            credentials: "include"
          });

          if (res.ok) {
            await IndexedDBStorage.clearPendingSyncItem(item.id);
          }
        } catch {
          // Giữ lại queue để thử lại lần sau
          break;
        }
      }
    } catch (e) {
      console.warn("Lỗi đồng bộ ngầm BackgroundSyncEngine:", e);
    }
  }
};
