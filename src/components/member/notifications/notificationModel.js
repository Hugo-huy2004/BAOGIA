/**
 * Chuẩn hoá dữ liệu cho trung tâm thông báo.
 *
 * Thay cho `parseJoyDetail` cũ — hàm đó dùng regex bóc số tiền / mã GD / số dư
 * ra từ CÂU TIẾNG VIỆT mà server viết. Đổi một chữ ở server (ví dụ "chuyển" →
 * "gửi") là client im lặng mất hết phần số, không lỗi, không ai biết.
 *
 * Giờ server gửi số liệu thành field riêng (amount/balanceAfter/refCode/
 * counterparty — xem server/models/InAppNotification.js) và ở đây chỉ còn việc
 * gộp hai nguồn (thông báo + lịch sử hồ sơ) về một hình dạng.
 */

/** Nhóm hiển thị — cũng là bộ lọc trên đầu trang. */
export const GROUPS = {
  joy: { id: "joy", label: "Giao dịch", icon: "swap_horiz", categories: ["joy", "payment"] },
  account: { id: "account", label: "Tài khoản", icon: "person", categories: ["verification", "security", "package"] },
  system: { id: "system", label: "Hệ thống", icon: "settings", categories: ["system", "general", "wellness"] },
};

const CATEGORY_GROUP = new Map(
  Object.values(GROUPS).flatMap(g => g.categories.map(c => [c, g.id]))
);

/** Icon cho thông báo không phải giao dịch. */
const CATEGORY_ICON = {
  verification: "verified_user",
  security: "shield",
  package: "inventory_2",
  payment: "credit_card",
  wellness: "spa",
  system: "settings",
  general: "notifications",
  joy: "toll",
};

export const groupOf = (category) => CATEGORY_GROUP.get(category) || "system";

/**
 * Hướng dòng tiền. Dựa vào DẤU của `amount` chứ không đoán từ câu chữ.
 * 'in' = vào ví, 'out' = ra khỏi ví, 'none' = không phải giao dịch.
 */
export function directionOf(amount) {
  if (typeof amount !== "number" || Number.isNaN(amount) || amount === 0) return "none";
  return amount > 0 ? "in" : "out";
}

/** Một thông báo từ DB → hình dạng dùng để vẽ. */
export function fromNotification(n) {
  const direction = directionOf(n.amount);
  return {
    key: `n:${n._id}`,
    id: n._id,
    source: "notification",
    at: n.createdAt,
    title: n.title,
    message: n.message || "",
    amount: typeof n.amount === "number" ? n.amount : null,
    balanceAfter: typeof n.balanceAfter === "number" ? n.balanceAfter : null,
    refCode: n.refCode || "",
    counterparty: n.counterparty || "",
    direction,
    category: n.category || "system",
    group: groupOf(n.category),
    icon: direction === "none" ? (CATEGORY_ICON[n.category] || "notifications") : null,
    actionUrl: n.actionUrl || "",
    read: Boolean(n.read),
    dismissible: true,
  };
}

/** Một mốc lịch sử trong hồ sơ → cùng hình dạng, luôn coi như đã đọc. */
export function fromHistory(entry, index) {
  return {
    key: `h:${index}:${entry.timestamp}`,
    id: null,
    source: "history",
    at: entry.timestamp,
    title: entry.title || "Cập nhật hồ sơ",
    message: entry.detail || "",
    amount: null,
    balanceAfter: null,
    refCode: "",
    counterparty: "",
    direction: "none",
    category: "system",
    group: "system",
    icon: entry.icon || "history",
    actionUrl: "",
    read: true,
    dismissible: false,
    historyType: entry.type || "",
  };
}

/** Gộp hai nguồn, mới nhất lên đầu. */
export function buildFeed(notifications = [], history = []) {
  return [
    ...notifications.map(fromNotification),
    ...history.map(fromHistory),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

/**
 * Lọc theo chip đang chọn.
 * `filter`: 'all' | 'unread' | id của GROUPS.
 */
export function applyFilter(items, filter) {
  if (!filter || filter === "all") return items;
  if (filter === "unread") return items.filter(i => !i.read);
  return items.filter(i => i.group === filter);
}

/** Chỉ trả về những chip THẬT SỰ có nội dung — không bày tab rỗng. */
export function availableFilters(items) {
  const chips = [{ id: "all", label: "Tất cả", icon: "inbox" }];
  const unread = items.filter(i => !i.read).length;
  if (unread > 0) chips.push({ id: "unread", label: `Chưa đọc (${unread})`, icon: "mark_email_unread" });
  for (const group of Object.values(GROUPS)) {
    if (items.some(i => i.group === group.id)) {
      chips.push({ id: group.id, label: group.label, icon: group.icon });
    }
  }
  return chips;
}

const DAY_MS = 86_400_000;

/** Nhãn ngày: hôm nay / hôm qua / trong tuần / cũ hơn. */
export function dayBucket(at, now = new Date()) {
  const value = new Date(at);
  if (Number.isNaN(value.getTime())) return "earlier";
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfDay = new Date(value);
  startOfDay.setHours(0, 0, 0, 0);
  const diff = Math.round((startOfToday.getTime() - startOfDay.getTime()) / DAY_MS);
  if (diff <= 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff <= 7) return "this_week";
  return "earlier";
}

export const BUCKET_LABEL = {
  today: "Hôm nay",
  yesterday: "Hôm qua",
  this_week: "Trong tuần",
  earlier: "Cũ hơn",
};

/** Chia danh sách thành các khối theo ngày, giữ nguyên thứ tự đã sắp. */
export function groupByDay(items, now = new Date()) {
  const out = [];
  for (const item of items) {
    const bucket = dayBucket(item.at, now);
    const last = out[out.length - 1];
    if (last?.bucket === bucket) last.items.push(item);
    else out.push({ bucket, label: BUCKET_LABEL[bucket], items: [item] });
  }
  return out;
}

/** Thời gian tương đối, ngắn gọn. */
export function timeAgo(at, now = new Date()) {
  const value = new Date(at);
  if (Number.isNaN(value.getTime())) return "";
  const seconds = Math.max(0, (now.getTime() - value.getTime()) / 1000);
  if (seconds < 60) return "vừa xong";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày`;
  return value.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

/** Số JOY có dấu, để hiện "+150" / "−165". Dùng dấu trừ thật (U+2212). */
export function signedJoy(amount) {
  const value = Math.abs(Number(amount) || 0).toLocaleString("vi-VN");
  return `${amount > 0 ? "+" : "−"}${value} JOY`;
}
