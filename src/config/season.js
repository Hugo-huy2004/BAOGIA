/* Trang trí theo mùa. Mặc định do NGÀY quyết định — không cần deploy để bật/tắt.

   Ép bằng query, giá trị lưu localStorage nên gõ một lần là giữ luôn:
     ?season=spider   → xem trước mùa đó dù ngoài lịch
     ?season=off      → tắt hẳn, kể cả đang trong mùa
     ?season=auto     → xoá ép buộc, trả quyền quyết định lại cho ngày tháng   */

// MMDD. from > to nghĩa là mùa vắt qua giao thừa (Noel, Tết) — vẫn tính đúng.
export const SEASONS = {
  spider: { from: 731, to: 815 }, // 31/07 → hết 15/08, cửa sổ do user đặt
  halloween: { from: 1020, to: 1102 },
};

const KEY = "hugo-season";

// Safari private mode ném lỗi khi đụng storage → coi như không có override.
function storage(action, value) {
  try {
    if (action === "read") return localStorage.getItem(KEY);
    if (action === "clear") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, value);
  } catch {
    /* bỏ qua */
  }
  return null;
}

function readOverride() {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search).get("season");
  if (q === "auto") storage("clear");
  else if (q) storage("write", q);
  return storage("read");
}

/** Đang bị ép mùa bằng ?season= (kể cả "off")? Dùng để biết có phải chế độ xem trước. */
export function seasonForced() {
  return Boolean(readOverride());
}

/** Id mùa đang chạy, hoặc null nếu ngoài mùa / bị tắt. */
export function activeSeason(now = new Date()) {
  const forced = readOverride();
  if (forced) return forced === "off" ? null : forced;
  const md = (now.getMonth() + 1) * 100 + now.getDate();
  return (
    Object.keys(SEASONS).find((id) => {
      const { from, to } = SEASONS[id];
      return from <= to ? md >= from && md <= to : md >= from || md <= to;
    }) ?? null
  );
}
