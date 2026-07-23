/**
 * indexedDBStorage.js
 * Trình lưu trữ Local-First trên thiết bị điện thoại bằng IndexedDB.
 * Phản hồi tức thì 0ms, lưu trữ dung lượng lớn và không làm nghẽn UI.
 */

const DB_NAME = "HugoStudioEdgeDB";
const DB_VERSION = 1;
const STORE_SKIN_HISTORY = "skin_history";
const STORE_CHECKLIST = "skincare_checklist";
const STORE_SYNC_QUEUE = "sync_queue";

function openDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject("IndexedDB không được hỗ trợ trên thiết bị này");
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_SKIN_HISTORY)) {
        db.createObjectStore(STORE_SKIN_HISTORY, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_CHECKLIST)) {
        db.createObjectStore(STORE_CHECKLIST, { keyPath: "date" });
      }
      if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
        db.createObjectStore(STORE_SYNC_QUEUE, { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

export const IndexedDBStorage = {
  async saveSkinScan(scanResult) {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_SKIN_HISTORY, "readwrite");
      const store = tx.objectStore(STORE_SKIN_HISTORY);
      const record = {
        id: scanResult.id || `scan_${Date.now()}`,
        ...scanResult,
        createdAt: scanResult.createdAt || new Date().toISOString()
      };
      store.put(record);
      return record;
    } catch (err) {
      console.warn("Lỗi lưu IndexedDB:", err);
      return null;
    }
  },

  async getAllSkinScans() {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_SKIN_HISTORY, "readonly");
      const store = tx.objectStore(STORE_SKIN_HISTORY);
      return new Promise((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result ? req.result.reverse() : []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  },

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
  }
};
