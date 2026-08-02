// Kho cục bộ của chế độ Bảo vệ môi trường: bộ nhớ đệm bản tin, kho bài "đọc
// lại", và sổ ghi những gì đã tiết kiệm được.
//
// Tất cả nằm trong localStorage của máy — không một byte nào gửi lên máy chủ.
// Đây chính là phần "tái chế": dữ liệu đã tải một lần thì dùng lại, không tải
// lại lần hai.

const NS = "hugo.saveE.";

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(NS + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

// Trả về false khi đầy quota hoặc đang duyệt web riêng tư — người gọi tự xử lý,
// không ném lỗi ra giao diện.
const write = (key, value) => {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
    return true;
  } catch { return false; }
};

const bytesOf = (value) => {
  try { return JSON.stringify(value).length; } catch { return 0; }
};

/* ── Bộ nhớ đệm bản tin ────────────────────────────────────────────────────
   Mở lại ứng dụng trong vòng CACHE_MAX_AGE là KHÔNG gọi máy chủ lần nào. Kho
   bài của server làm mới mỗi 10 phút, nhưng ở chế độ này 6 tiếng vẫn là bản
   tin dùng được — đổi lại là số lượt gọi gần bằng 0. */
export const CACHE_MAX_AGE = 6 * 60 * 60 * 1000;

export function cacheFeed(key, data) {
  const bytes = bytesOf(data);
  if (write(`feed.${key}`, { at: Date.now(), bytes, data })) bumpLedger({ feedBytes: bytes });
}

export function readFeedCache(key) {
  const hit = read(`feed.${key}`, null);
  if (!hit || Date.now() - hit.at > CACHE_MAX_AGE) return null;
  return hit;
}

/* ── Kho bài đọc lại ─────────────────────────────────────────────────────── */
const SAVED = "saved";
const MAX_SAVED = 30;

export const listSaved = () => read(SAVED, []);
export const isSaved = (id) => listSaved().some((item) => item.id === id);

export function saveArticle(article) {
  let list = [
    { ...article, savedAt: Date.now() },
    ...listSaved().filter((item) => item.id !== article.id),
  ].slice(0, MAX_SAVED);
  // Toàn văn một bài có thể vài chục KB. Đầy quota thì bỏ dần bài cũ nhất rồi
  // thử lại, thay vì để người dùng nhận một lỗi cụt.
  while (list.length && !write(SAVED, list)) list = list.slice(0, -1);
  return list.length > 0;
}

export function removeSaved(id) {
  write(SAVED, listSaved().filter((item) => item.id !== id));
}

/* ── Sổ tiết kiệm ─────────────────────────────────────────────────────────
   Chỉ ghi những gì ĐẾM ĐƯỢC THẬT: số lượt gọi máy chủ đã tránh, số byte lấy
   từ máy thay vì từ mạng, số phút chạy nền đen. Phần quy ra điện nằm ở giao
   diện và luôn ghi rõ là ước tính có dẫn nguồn. */
const LEDGER = "ledger";
const EMPTY_LEDGER = { minutes: 0, feedHits: 0, savedReads: 0, bytesFromCache: 0, feedBytes: 0, startedAt: null };

export const readLedger = () => ({ ...EMPTY_LEDGER, ...read(LEDGER, {}) });

function bumpLedger(patch) {
  const ledger = readLedger();
  for (const [key, value] of Object.entries(patch)) {
    // feedBytes là kích thước hiện tại của một lượt tải, không phải tổng cộng.
    ledger[key] = key === "feedBytes" ? value : (ledger[key] || 0) + value;
  }
  write(LEDGER, ledger);
  return ledger;
}

/** Một lượt mở bản tin được phục vụ từ máy, không gọi máy chủ. */
export const recordFeedHit = (bytes) => bumpLedger({ feedHits: 1, bytesFromCache: bytes || 0 });

/** Một bài đọc lại từ kho, không gọi máy chủ. */
export const recordSavedRead = (bytes) => bumpLedger({ savedReads: 1, bytesFromCache: bytes || 0 });

/** Bắt đầu tính giờ chạy nền đen. Gọi lại nhiều lần vẫn an toàn. */
export function startEcoClock() {
  const ledger = readLedger();
  if (!ledger.startedAt) write(LEDGER, { ...ledger, startedAt: Date.now() });
}

/** Gộp quãng đang chạy vào tổng. Gọi khi rời chế độ hoặc khi ẩn cửa sổ. */
export function stopEcoClock() {
  const ledger = readLedger();
  if (!ledger.startedAt) return ledger;
  const minutes = ledger.minutes + (Date.now() - ledger.startedAt) / 60000;
  const next = { ...ledger, minutes, startedAt: null };
  write(LEDGER, next);
  return next;
}

/** Tổng phút, tính cả quãng đang chạy dở. */
export function ecoMinutes(ledger = readLedger()) {
  const running = ledger.startedAt ? (Date.now() - ledger.startedAt) / 60000 : 0;
  return ledger.minutes + running;
}

export function resetLedger() {
  write(LEDGER, EMPTY_LEDGER);
}
