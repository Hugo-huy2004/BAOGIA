/**
 * HugoOS — nhật ký sử dụng cục bộ.
 *
 * Hệ điều hành nào cũng nhớ bạn vừa mở gì: để xếp Spotlight theo mức dùng, để
 * trang chủ mỗi app biết "tiếp tục việc đang dở". Portal trước đây không nhớ gì
 * cả nên mọi màn hình luôn mở ra như lần đầu.
 *
 * ponytail: localStorage, không đồng bộ lên server. Đây là thói quen thao tác
 * trên đúng thiết bị này, không phải dữ liệu cần khôi phục — đẩy lên server chỉ
 * khi người dùng thật sự đòi thấy "gần đây" giống nhau giữa các máy.
 */
const KEY = "hugo_os_recent";
const LIMIT = 12;

const read = () => {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
};

const write = (value) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* hết quota hoặc chế độ riêng tư: nhật ký gần đây không đáng để làm vỡ app */
  }
};

/**
 * Ghi nhận một lượt mở. `scope` là app ("handle", "supporter"…), `id` là thứ
 * vừa mở bên trong app đó. Mở chính app thì `id` bỏ trống.
 */
export function trackOpen(scope, id = "__app__") {
  if (!scope) return;
  const all = read();
  const list = (all[scope] || []).filter((entry) => entry.id !== id);
  list.unshift({ id, at: Date.now() });
  all[scope] = list.slice(0, LIMIT);
  write(all);
}

/** Danh sách id đã mở trong một app, mới nhất trước. */
export function recentIds(scope, limit = LIMIT) {
  return (read()[scope] || [])
    .filter((entry) => entry.id !== "__app__")
    .slice(0, limit)
    .map((entry) => entry.id);
}

/** Lần mở gần nhất của một mục, dạng timestamp — null nếu chưa mở bao giờ. */
export function lastOpenedAt(scope, id = "__app__") {
  return read()[scope]?.find((entry) => entry.id === id)?.at ?? null;
}

/** Số lượt mở app, dùng để xếp hạng Spotlight. Mới hơn thì đứng trước. */
export function appOpenOrder() {
  const all = read();
  return Object.keys(all)
    .map((scope) => ({ scope, at: all[scope]?.[0]?.at || 0 }))
    .sort((a, b) => b.at - a.at)
    .map((entry) => entry.scope);
}

export function clearUsage() {
  write({});
}
