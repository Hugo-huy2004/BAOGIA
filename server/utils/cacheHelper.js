import NodeCache from 'node-cache';

// Cache giữ dữ liệu mãi mãi trên RAM, nhưng "Stale" sau 60 giây
const cache = new NodeCache({ stdTTL: 0, checkperiod: 0 }); 

// Map lưu trữ các Promise đang thực thi (Single-flight lock)
const pendingRequests = new Map();

/**
 * Thuật toán Stale-while-revalidate kết hợp Request Coalescing (Single-flight Lock)
 * @param {string} key - Cache key
 * @param {number} staleTimeMs - Thời gian (mili-giây) dữ liệu được coi là "Fresh"
 * @param {Function} fetcher - Hàm (Promise) gọi DB để lấy dữ liệu mới
 */
export const fetchWithCache = async (key, staleTimeMs, fetcher) => {
  const cached = cache.get(key);
  const now = Date.now();

  // 1. Nếu có Cache và Cache còn Fresh -> Trả về ngay lập tức O(1)
  if (cached && now - cached.updatedAt < staleTimeMs) {
    return cached.data;
  }

  // 2. Nếu Cache đã "Stale" (hết hạn) -> Kích hoạt ngầm (Background) để lấy mới
  // Trả về dữ liệu cũ (Stale) ngay lập tức cho người dùng
  if (cached) {
    revalidateInBackground(key, fetcher);
    return cached.data;
  }

  // 3. Không có Cache (Cold start) -> Phải chờ lấy mới từ DB
  // Áp dụng thuật toán Single-flight Lock để gom các request cùng lúc
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key); // Chờ chung 1 Promise duy nhất
  }

  const promise = fetcher().then(data => {
    cache.set(key, { data, updatedAt: Date.now() });
    pendingRequests.delete(key);
    return data;
  }).catch(err => {
    pendingRequests.delete(key);
    throw err;
  });

  pendingRequests.set(key, promise);
  return promise;
};

// Hàm revalidate âm thầm lấy dữ liệu mà không làm kẹt luồng chính
const revalidateInBackground = (key, fetcher) => {
  if (pendingRequests.has(key)) return; // Đang lấy rồi thì bỏ qua

  const promise = fetcher().then(data => {
    cache.set(key, { data, updatedAt: Date.now() });
    pendingRequests.delete(key);
  }).catch(err => {
    console.error(`[Background Revalidate Error] Key: ${key}`, err);
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
};

export const clearCache = (key) => {
  cache.del(key);
};
