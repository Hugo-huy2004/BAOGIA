/**
 * indexedDBStorage.js
 * Trình lưu trữ Local-First trên thiết bị điện thoại bằng IndexedDB.
 * Phản hồi tức thì 0ms, lưu trữ dung lượng lớn và không làm nghẽn UI.
 */

const DB_NAME = "HugoStudioEdgeDB";
const DB_VERSION = 3;
const STORE_SYNC_QUEUE = "sync_queue";
const STORE_BOOTSTRAP_CACHE = "bootstrap_cache";
const STORE_USER_SETTINGS = "user_settings";

function openDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject("IndexedDB không được hỗ trợ trên thiết bị này");
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // HugoSkin đã ngừng hoạt động: xóa luôn dữ liệu cục bộ cũ khi DB nâng cấp.
      if (db.objectStoreNames.contains("skin_history")) db.deleteObjectStore("skin_history");
      if (db.objectStoreNames.contains("skincare_checklist")) db.deleteObjectStore("skincare_checklist");
      if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
        db.createObjectStore(STORE_SYNC_QUEUE, { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_BOOTSTRAP_CACHE)) {
        db.createObjectStore(STORE_BOOTSTRAP_CACHE, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORE_USER_SETTINGS)) {
        db.createObjectStore(STORE_USER_SETTINGS, { keyPath: "key" });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

export const IndexedDBStorage = {
  async enqueuePendingSync(endpoint, payload) {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_SYNC_QUEUE, "readwrite");
      const store = tx.objectStore(STORE_SYNC_QUEUE);
      store.add({
        endpoint,
        payload,
        timestamp: Date.now()
      });
    } catch (e) {
      console.warn("Lỗi enqueue sync queue:", e);
    }
  },

  async getPendingSyncQueue() {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_SYNC_QUEUE, "readonly");
      const store = tx.objectStore(STORE_SYNC_QUEUE);
      return new Promise((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  },

  async clearPendingSyncItem(id) {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_SYNC_QUEUE, "readwrite");
      const store = tx.objectStore(STORE_SYNC_QUEUE);
      store.delete(id);
    } catch (e) {
      console.warn("Lỗi xóa sync queue item:", e);
    }
  },

  async saveBootstrapCache(data) {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_BOOTSTRAP_CACHE, "readwrite");
      const store = tx.objectStore(STORE_BOOTSTRAP_CACHE);
      store.put({ key: "me_bootstrap", data, updatedAt: Date.now() });
    } catch (e) {
      console.warn("Lỗi saveBootstrapCache IndexedDB:", e);
    }
  },

  async getBootstrapCache() {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_BOOTSTRAP_CACHE, "readonly");
      const store = tx.objectStore(STORE_BOOTSTRAP_CACHE);
      return new Promise((resolve) => {
        const req = store.get("me_bootstrap");
        req.onsuccess = () => resolve(req.result?.data || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }
};
