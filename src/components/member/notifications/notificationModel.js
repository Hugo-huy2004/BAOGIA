import { localeForLanguage } from "../../../i18n/languages";

/**
 * Chuẩn hoá dữ liệu cho trung tâm thông báo.
 *
 * Thay cho `parseJoyDetail` cũ — hàm đó dùng regex bóc số tiền / mã GD / số dư
 * ra từ CÂU TIẾNG VIỆT mà server viết. Đổi một chữ ở server (ví dụ "chuyển" →
 * "gửi") là client im lặng mất hết phần số, không lỗi, không ai biết.
 *
 * Giờ server gửi số liệu thành field riêng (amount/balanceAfter/refCode/
 * counterparty — xem server/models/InAppNotification.js) và ở đây chỉ còn việc
 * chuẩn hoá dữ liệu hiển thị.
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

/**
 * Icon + màu theo loại thông báo. Mỗi loại một khuôn mặt riêng để lướt mắt là
 * biết ngay việc gì, thay vì cả trang chỉ toàn một cái chuông giống nhau.
 *
 * Giao dịch JOY vẫn ưu tiên mũi tên hướng tiền (xem directionOf) — hướng tiền
 * quan trọng hơn chủ đề.
 */
export const CATEGORY_STYLE = {
  verification: { icon: "verified", tint: "#0A84FF" },
  security: { icon: "shield_person", tint: "#FF453A" },
  package: { icon: "inventory_2", tint: "#BF5AF2" },
  payment: { icon: "credit_card", tint: "#30D158" },
  wellness: { icon: "spa", tint: "#40C8E0" },
  system: { icon: "settings", tint: "#8E8E93" },
  general: { icon: "campaign", tint: "#FF9F0A" },
  joy: { icon: "toll", tint: "#FF9F0A" },
};

/** Icon riêng cho vài mốc lịch sử hồ sơ hay gặp. */
export const HISTORY_STYLE = {
  welcome: { icon: "celebration", tint: "#FF375F" },
  birthday_wish: { icon: "cake", tint: "#FF375F" },
  birthday_voucher: { icon: "redeem", tint: "#FF9F0A" },
  referral_bonus: { icon: "group_add", tint: "#30D158" },
  package_redeemed: { icon: "card_giftcard", tint: "#BF5AF2" },
  profile_update: { icon: "edit_note", tint: "#0A84FF" },
};

const CATEGORY_ICON = Object.fromEntries(
  Object.entries(CATEGORY_STYLE).map(([key, value]) => [key, value.icon])
);

/** Màu của một dòng — dùng cho vòng tròn icon và chấm chưa đọc. */
export function tintOf(item) {
  if (item.direction === "in") return "#30D158";
  if (item.direction === "out") return "#FF9F0A";
  if (item.source === "history") return (HISTORY_STYLE[item.historyType] || {}).tint || "#8E8E93";
  return (CATEGORY_STYLE[item.category] || CATEGORY_STYLE.system).tint;
}

export const groupOf = (category) => CATEGORY_GROUP.get(category) || "system";

/**
 * Chỉ giữ các đích sâu, có ý nghĩa trong khu vực thành viên.
 *
 * Những URL chung như `/member` từng làm một lần chạm vào thông báo tự đổi tab
 * về màn hình mặc định. URL ngoài origin hoặc route cũ cũng không được phép
 * điều hướng từ inbox.
 */
export function notificationDestination(rawUrl) {
  if (typeof rawUrl !== "string") return "";
  const raw = rawUrl.trim();
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return "";

  try {
    const parsed = new URL(raw, "https://hugo.local");
    let pathname = parsed.pathname.replace(/\/+$/, "") || "/";

    // Ví JOY đã dọn vào trang Tài khoản. Thông báo cũ trong hộp thư vẫn trỏ
    // `/member/joy`, nên đổi đích thay vì để nó thành liên kết chết.
    if (pathname === "/member/joy" || pathname.startsWith("/member/joy/")) {
      pathname = "/member/account";
    }

    const isMeaningfulMemberRoute = (
      pathname === "/member/account"
      || pathname.startsWith("/member/utilities/")
    );
    const isPaymentRoute = /^\/pay\/[^/]+$/.test(pathname);

    if (!isMeaningfulMemberRoute && !isPaymentRoute) return "";
    return `${pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "";
  }
}

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
    actionUrl: notificationDestination(n.actionUrl),
    read: Boolean(n.read),
    dismissible: true,
  };
}

/** Một mốc lịch sử trong hồ sơ → cùng hình dạng, luôn coi như đã đọc. */
export function fromHistory(entry, index, fallbackTitle = "Cập nhật hồ sơ") {
  return {
    key: `h:${index}:${entry.timestamp}`,
    id: null,
    source: "history",
    at: entry.timestamp,
    title: entry.title || fallbackTitle,
    message: entry.detail || "",
    amount: null,
    balanceAfter: null,
    refCode: "",
    counterparty: "",
    direction: "none",
    category: "system",
    group: "system",
    icon: (HISTORY_STYLE[entry.type] || {}).icon || entry.icon || "history",
    actionUrl: "",
    read: true,
    dismissible: false,
    historyType: entry.type || "",
  };
}

/** Gộp hai nguồn, mới nhất lên đầu. */
export function buildFeed(notifications = [], history = [], fallbackHistoryTitle) {
  return [
    ...notifications.map(fromNotification),
    ...history.map((entry, index) => fromHistory(entry, index, fallbackHistoryTitle)),
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
export function availableFilters(items, labels = {}) {
  const chips = [{ id: "all", label: labels.all || "Tất cả", icon: "inbox" }];
  const unread = items.filter(i => !i.read).length;
  if (unread > 0) {
    chips.push({
      id: "unread",
      label: labels.unread ? labels.unread(unread) : `Chưa đọc (${unread})`,
      icon: "mark_email_unread",
    });
  }
  for (const group of Object.values(GROUPS)) {
    if (items.some(i => i.group === group.id)) {
      chips.push({
        id: group.id,
        label: labels[group.id] || group.label,
        icon: group.icon,
      });
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
export function groupByDay(items, now = new Date(), labels = BUCKET_LABEL) {
  const out = [];
  for (const item of items) {
    const bucket = dayBucket(item.at, now);
    const last = out[out.length - 1];
    if (last?.bucket === bucket) last.items.push(item);
    else out.push({ bucket, label: labels[bucket] || BUCKET_LABEL[bucket], items: [item] });
  }
  return out;
}

/** Thời gian tương đối, ngắn gọn. */
export function timeAgo(at, now = new Date(), language = "vi") {
  const value = new Date(at);
  if (Number.isNaN(value.getTime())) return "";
  const seconds = Math.max(0, (now.getTime() - value.getTime()) / 1000);
  const locale = localeForLanguage(language);
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  if (seconds < 60) return relative.format(0, "second");
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return relative.format(-minutes, "minute");
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return relative.format(-hours, "hour");
  }
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400);
    return relative.format(-days, "day");
  }
  return value.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
  });
}

/** Số JOY có dấu, để hiện "+150" / "−165". Dùng dấu trừ thật (U+2212). */
export function signedJoy(amount, language = "vi") {
  const locale = localeForLanguage(language);
  const value = Math.abs(Number(amount) || 0).toLocaleString(locale);
  return `${amount > 0 ? "+" : "−"}${value} JOY`;
}
