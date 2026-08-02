// Tín hiệu của MÁY để chế độ "tự động" biết lúc nào nên tiết kiệm.
//
// Ba tín hiệu, đều là API sẵn có của trình duyệt — không thêm thư viện, không
// gọi máy chủ lần nào:
//  - Pin yếu và không cắm sạc (Battery Status API).
//  - Người dùng đã bật "Tiết kiệm dữ liệu" trong hệ điều hành (`saveData`).
//  - Mạng chậm 2G/EDGE — tải nặng lúc này vừa hao pin sóng vừa lâu.
//
// Battery API trả Promise nên đọc một lần rồi giữ ảnh chụp trong module; phần
// còn lại của app đọc đồng bộ từ ảnh chụp đó.

export const LOW_BATTERY = 0.3;

const snapshot = { level: null, charging: null, saveData: false, slowNet: false };
const listeners = new Set();
const emit = () => listeners.forEach((listener) => listener());

const connection = () => (typeof navigator === "undefined" ? null : navigator.connection || null);

function readNetwork() {
  const conn = connection();
  snapshot.saveData = Boolean(conn?.saveData);
  snapshot.slowNet = conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g";
}

if (typeof navigator !== "undefined") {
  readNetwork();
  connection()?.addEventListener?.("change", () => { readNetwork(); emit(); });
  navigator.getBattery?.().then((battery) => {
    const sync = () => {
      snapshot.level = battery.level;
      snapshot.charging = battery.charging;
      emit();
    };
    sync();
    battery.addEventListener("levelchange", sync);
    battery.addEventListener("chargingchange", sync);
  }).catch(() => { /* Safari/iOS không có Battery API — hai tín hiệu kia vẫn chạy */ });
}

export const getEcoSignals = () => ({ ...snapshot });

/** Có tín hiệu nào đáng để tự bật chế độ tiết kiệm không. */
export function shouldAutoEco() {
  const { level, charging, saveData, slowNet } = snapshot;
  if (saveData || slowNet) return true;
  return level != null && level <= LOW_BATTERY && !charging;
}

/** Câu giải thích vì sao chế độ tự động đang bật (hoặc đang nằm im). */
export function autoReason() {
  const { level, charging, saveData, slowNet } = snapshot;
  if (saveData) return "Máy đang bật Tiết kiệm dữ liệu";
  if (slowNet) return "Mạng đang chậm (2G)";
  if (level != null && level <= LOW_BATTERY && !charging) return `Pin còn ${Math.round(level * 100)}%, chưa cắm sạc`;
  if (level != null) return `Pin ${Math.round(level * 100)}%${charging ? ", đang sạc" : ""} — chưa cần bật`;
  return "Chưa đọc được pin trên máy này";
}

export function subscribeEcoSignals(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
