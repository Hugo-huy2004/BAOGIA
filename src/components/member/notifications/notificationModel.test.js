import { describe, it, expect } from "vitest";
import {
  buildFeed,
  applyFilter,
  availableFilters,
  groupByDay,
  directionOf,
  signedJoy,
  dayBucket,
  groupOf,
  notificationDestination,
  timeAgo,
} from "./notificationModel";

const DAY = 86_400_000;

const notif = (over = {}) => ({
  _id: "n1", title: "Tiêu đề", message: "", category: "joy",
  createdAt: new Date(), read: false, ...over,
});

describe("directionOf — hướng tiền lấy từ DẤU, không đoán từ câu chữ", () => {
  it("dương vào ví, âm ra khỏi ví", () => {
    expect(directionOf(150)).toBe("in");
    expect(directionOf(-165)).toBe("out");
  });

  it("không phải giao dịch thì không có hướng", () => {
    expect(directionOf(null)).toBe("none");
    expect(directionOf(undefined)).toBe("none");
    expect(directionOf(0)).toBe("none");
    expect(directionOf(NaN)).toBe("none");
  });
});

describe("fromNotification — đọc field, không regex", () => {
  it("giữ nguyên số liệu server gửi", () => {
    const [item] = buildFeed([notif({ amount: -165, balanceAfter: 980, refCode: "JOYABC", counterparty: "Lan" })]);
    expect(item.amount).toBe(-165);
    expect(item.balanceAfter).toBe(980);
    expect(item.refCode).toBe("JOYABC");
    expect(item.counterparty).toBe("Lan");
    expect(item.direction).toBe("out");
  });

  it("thông báo cũ chưa có field số vẫn đọc được, chỉ là không có hướng", () => {
    const [item] = buildFeed([notif({ message: "Bạn nhận 50 JOY từ Nam" })]);
    expect(item.amount).toBeNull();
    expect(item.direction).toBe("none");
    expect(item.icon).toBeTruthy(); // có icon thay cho mũi tên
  });

  it("giao dịch không lấy icon theo loại — chỗ đó là mũi tên hướng tiền", () => {
    const [item] = buildFeed([notif({ amount: 50 })]);
    expect(item.icon).toBeNull();
  });
});

describe("buildFeed — gộp thông báo với lịch sử hồ sơ", () => {
  it("mới nhất lên đầu bất kể nguồn nào", () => {
    const feed = buildFeed(
      [notif({ _id: "cu", createdAt: new Date(Date.now() - 3 * DAY) })],
      [{ timestamp: new Date(Date.now() - 1000), title: "Cập nhật hồ sơ" }]
    );
    expect(feed[0].source).toBe("history");
    expect(feed[1].source).toBe("notification");
  });

  it("mốc lịch sử luôn coi như đã đọc và không xoá được", () => {
    const [item] = buildFeed([], [{ timestamp: new Date(), title: "X" }]);
    expect(item.read).toBe(true);
    expect(item.dismissible).toBe(false);
  });

  it("key không trùng nhau giữa hai nguồn", () => {
    const feed = buildFeed([notif({ _id: "1" })], [{ timestamp: new Date(), title: "A" }]);
    expect(new Set(feed.map(i => i.key)).size).toBe(feed.length);
  });
});

describe("groupOf — mọi category của schema đều có nhóm", () => {
  it("không có category nào rơi ra ngoài", () => {
    const all = ["verification", "package", "system", "wellness", "security", "joy", "payment", "general"];
    for (const c of all) expect(["joy", "account", "system"]).toContain(groupOf(c));
  });

  it("category lạ thì về hệ thống chứ không làm hỏng danh sách", () => {
    expect(groupOf("khong_ton_tai")).toBe("system");
  });
});

describe("notificationDestination — không tự chuyển tab vô lý", () => {
  it("chỉ nhận route sâu có hành động rõ ràng", () => {
    expect(notificationDestination("/member/utilities/hugoso")).toBe("/member/utilities/hugoso");
    expect(notificationDestination("/member/joy?view=history")).toBe("/member/joy?view=history");
    expect(notificationDestination("/pay/order-123")).toBe("/pay/order-123");
  });

  it("loại route chung, route ngoài và URL không hợp lệ", () => {
    expect(notificationDestination("/member")).toBe("");
    expect(notificationDestination("/member/activity")).toBe("");
    expect(notificationDestination("https://example.com/member/joy")).toBe("");
    expect(notificationDestination("//example.com/member/joy")).toBe("");
    expect(notificationDestination("/member\\utilities\\hugoso")).toBe("");
  });
});

describe("availableFilters — không bày chip rỗng", () => {
  it("chỉ có giao dịch thì không hiện chip Tài khoản", () => {
    const chips = availableFilters(buildFeed([notif({ category: "joy", amount: 10 })]));
    const ids = chips.map(c => c.id);
    expect(ids).toContain("joy");
    expect(ids).not.toContain("account");
  });

  it("đọc hết rồi thì không còn chip Chưa đọc", () => {
    const read = availableFilters(buildFeed([notif({ read: true })]));
    expect(read.map(c => c.id)).not.toContain("unread");
    const unread = availableFilters(buildFeed([notif({ read: false })]));
    expect(unread.map(c => c.id)).toContain("unread");
  });

  it("luôn có chip Tất cả", () => {
    expect(availableFilters([])[0].id).toBe("all");
  });
});

describe("applyFilter", () => {
  const feed = buildFeed([
    notif({ _id: "a", category: "joy", read: false }),
    notif({ _id: "b", category: "security", read: true }),
  ]);

  it("all trả về nguyên vẹn", () => {
    expect(applyFilter(feed, "all")).toHaveLength(2);
  });

  it("lọc theo nhóm", () => {
    expect(applyFilter(feed, "joy").map(i => i.id)).toEqual(["a"]);
    expect(applyFilter(feed, "account").map(i => i.id)).toEqual(["b"]);
  });

  it("lọc chưa đọc", () => {
    expect(applyFilter(feed, "unread").map(i => i.id)).toEqual(["a"]);
  });
});

describe("dayBucket & groupByDay", () => {
  const now = new Date(2026, 6, 30, 12, 0, 0);

  it("chia đúng hôm nay / hôm qua / trong tuần / cũ hơn", () => {
    expect(dayBucket(new Date(2026, 6, 30, 1, 0), now)).toBe("today");
    expect(dayBucket(new Date(2026, 6, 29, 23, 0), now)).toBe("yesterday");
    expect(dayBucket(new Date(2026, 6, 25), now)).toBe("this_week");
    expect(dayBucket(new Date(2026, 5, 1), now)).toBe("earlier");
  });

  it("gộp các dòng cùng ngày vào một khối, giữ thứ tự", () => {
    const items = [
      { at: new Date(2026, 6, 30, 9, 0) },
      { at: new Date(2026, 6, 30, 8, 0) },
      { at: new Date(2026, 6, 29, 8, 0) },
    ];
    const days = groupByDay(items, now);
    expect(days).toHaveLength(2);
    expect(days[0].items).toHaveLength(2);
    expect(days[1].label).toBe("Hôm qua");
  });

  it("ngày không hợp lệ không làm nổ danh sách", () => {
    expect(dayBucket("khong-phai-ngay", now)).toBe("earlier");
  });
});

describe("signedJoy & timeAgo", () => {
  it("số vào ví có dấu +, ra khỏi ví có dấu trừ thật", () => {
    expect(signedJoy(1500)).toBe("+1.500 JOY");
    expect(signedJoy(-165)).toBe("−165 JOY");
  });

  it("thời gian tương đối đọc được", () => {
    const now = new Date(2026, 6, 30, 12, 0, 0);
    expect(timeAgo(new Date(2026, 6, 30, 11, 59, 30), now)).toBe("vừa xong");
    expect(timeAgo(new Date(2026, 6, 30, 11, 0), now)).toBe("1 giờ");
    expect(timeAgo(new Date(2026, 6, 28, 12, 0), now)).toBe("2 ngày");
  });

  it("định dạng số và thời gian đúng khi giao diện là tiếng Anh", () => {
    const now = new Date(2026, 6, 30, 12, 0, 0);
    expect(signedJoy(1500, "en")).toBe("+1,500 JOY");
    expect(timeAgo(new Date(2026, 6, 30, 11, 59, 30), now, "en")).toBe("just now");
    expect(timeAgo(new Date(2026, 6, 30, 11, 0), now, "en")).toBe("1 hr ago");
    expect(timeAgo(new Date(2026, 6, 28, 12, 0), now, "en")).toBe("2 days ago");
  });
});

describe("nhãn thông báo theo ngôn ngữ", () => {
  it("nhận nhãn tiếng Anh cho bộ lọc và nhóm ngày", () => {
    const feed = buildFeed([notif({ category: "joy", read: false })]);
    const chips = availableFilters(feed, {
      all: "All",
      unread: count => `Unread (${count})`,
      joy: "Transactions",
    });
    expect(chips.map(chip => chip.label)).toEqual([
      "All",
      "Unread (1)",
      "Transactions",
    ]);

    const now = new Date(2026, 6, 30, 12, 0, 0);
    expect(groupByDay(
      [{ at: new Date(2026, 6, 29, 8, 0) }],
      now,
      { yesterday: "Yesterday" },
    )[0].label).toBe("Yesterday");
  });
});
