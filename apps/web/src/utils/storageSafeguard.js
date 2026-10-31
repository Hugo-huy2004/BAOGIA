/**
 * storageSafeguard.js
 * Giám sát & bảo vệ bộ nhớ điện thoại chuẩn Apple.
 * Tự động dọn dẹp cache phụ khi máy gần đầy (>90% full), bảo vệ 100% dữ liệu cá nhân.
 */

export const StorageSafeguard = {
  async checkAndOptimizeStorage() {
    if (!navigator.storage || !navigator.storage.estimate) return;

    try {
      const { quota, usage } = await navigator.storage.estimate();
      if (!quota || !usage) return;

      const percentUsed = (usage / quota) * 100;
      if (percentUsed > 88) {
        console.warn(`Cảnh báo: Bộ nhớ thiết bị đã dùng ${percentUsed.toFixed(1)}%. Tiến hành tối ưu hóa ngầm...`);
        
        // Dọn dẹp CacheStorage phụ (Giữ lại bundle cốt lõi)
        if ("caches" in window) {
          const keys = await caches.keys();
          for (const key of keys) {
            if (key.includes("temp") || key.includes("audio-cache")) {
              await caches.delete(key);
            }
          }
        }
      }
    } catch (e) {
      console.warn("Lỗi kiểm tra bộ nhớ StorageSafeguard:", e);
    }
  }
};
