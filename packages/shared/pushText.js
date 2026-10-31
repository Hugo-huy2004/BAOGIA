import { NOTIFICATION_TEXT, renderNotification } from "./notificationText.js";

/**
 * Chữ của thông báo đẩy (push) — chỉ server dựng push, nên bảng này tách khỏi
 * notificationText.js để không theo vào gói portal của trình duyệt. Nhập
 * renderNotification TỪ ĐÂY ở server thì khoá push.* mới có.
 */
export const PUSH_TEXT = {
  vi: {
    "push.wake.title": "Chào buổi sớm mai",
    "push.wake.message": "Một ngày mới đã khai mở. Kính mời Quý thành viên dành năm phút điểm danh tâm trạng để khởi đầu thật nhẹ nhàng.",
    "push.noon.title": "Giờ Ngọ nghỉ chân",
    "push.noon.message": "Giữa ngày bận rộn, đôi phút tĩnh tâm giúp buổi chiều minh mẫn hơn. Hugo Studio đã soạn sẵn đôi điều dành riêng cho Quý thành viên.",
    "push.checkin.title": "Người đồng hành đang chờ tin",
    "push.checkin.message": "Hôm nay của Quý thành viên ra sao? Chạm để kể đôi lời — mọi điều được giữ kín trong buồng trò chuyện.",
    "push.streak.title": "Giữ nhịp trước khi ngày khép lại",
    "push.streak.message": "Chỉ còn vài giờ nữa là hết ngày. Một lần ghé thăm hôm nay đủ giữ trọn nhịp đều đặn của Quý thành viên.",
    "push.sleep.title": "Đã đến giờ an giấc",
    "push.sleep.message": "Giấc ngủ trước 23 giờ giúp tinh thần ngày mai sáng suốt hơn. Kính chúc Quý thành viên một đêm an lành.",
    "push.unread.title": "Có {{count}} tin đang chờ Quý thành viên",
    "push.unread.message": "Những thông báo gần đây chưa được xem. Chạm để đọc trọn trong một lượt.",
    "push.missYou.title": "Đã {{days}} ngày chưa gặp lại",
    "push.missYou.message": "Hugo Studio vẫn giữ nguyên mọi thứ Quý thành viên đang dở dang. Ghé lại đôi phút là tiếp tục được ngay.",
    "push.winback.title": "Hugo Studio vẫn đợi Quý thành viên",
    "push.winback.message": "Thời gian qua có nhiều điều mới. Chạm để xem bảng tin hôm nay — không cần đăng nhập lại.",
    "push.joyAmount": "{{amount, joy}}",
    "push.joyBalance": "Số dư {{balance, joy}}",
    "push.joyRef": "Mã GD {{ref}}",
  },
  en: {
    "push.wake.title": "Good morning",
    "push.wake.message": "A new day has begun. Take five minutes to check in and start it lightly.",
    "push.noon.title": "A midday pause",
    "push.noon.message": "Halfway through a busy day, a short pause keeps the afternoon clear. Something is waiting for you.",
    "push.checkin.title": "Your companion is listening",
    "push.checkin.message": "How is today going? Tap to share a few words — the conversation stays private.",
    "push.streak.title": "Keep your rhythm before the day ends",
    "push.streak.message": "Only a few hours of today remain. One short visit keeps your streak going.",
    "push.sleep.title": "Time to wind down",
    "push.sleep.message": "Sleeping before 11 pm makes tomorrow sharper. Have a restful night.",
    "push.unread.title": "{{count}} updates are waiting",
    "push.unread.message": "You have recent notifications you have not seen yet. Tap to catch up in one go.",
    "push.missYou.title": "It has been {{days}} days",
    "push.missYou.message": "Everything you left off is right where you left it. A couple of minutes is enough to pick it back up.",
    "push.winback.title": "We kept your place",
    "push.winback.message": "A lot is new since your last visit. Tap to see today's feed — you are still signed in.",
    "push.joyBalance": "Balance {{balance, joy}}",
    "push.joyRef": "Ref {{ref}}",
  },
  zh: {
    "push.wake.title": "早安",
    "push.wake.message": "新的一天已经开始。花五分钟记录心情，轻松开启今天。",
    "push.noon.title": "午间小憩",
    "push.noon.message": "忙碌的一天过半，稍作休息，下午更清醒。有内容正在等您。",
    "push.checkin.title": "您的伙伴在等您",
    "push.checkin.message": "今天过得怎样？轻触聊几句——对话内容全程保密。",
    "push.streak.title": "今日结束前保持节奏",
    "push.streak.message": "今天只剩几个小时。一次短暂的访问即可延续您的连续记录。",
    "push.sleep.title": "该休息了",
    "push.sleep.message": "晚上 11 点前入睡，明天更有精神。祝您一夜安眠。",
    "push.unread.title": "有 {{count}} 条消息等您查看",
    "push.unread.message": "最近的通知您还没看过。轻触一次看完。",
    "push.missYou.title": "已经 {{days}} 天没见了",
    "push.missYou.message": "您未完成的内容都还在。花几分钟就能接着继续。",
    "push.winback.title": "我们为您保留着一切",
    "push.winback.message": "自您上次来访后有不少新内容。轻触查看今日动态——无需重新登录。",
    "push.joyBalance": "余额 {{balance, joy}}",
    "push.joyRef": "交易号 {{ref}}",
  },
};

for (const [lang, table] of Object.entries(PUSH_TEXT)) Object.assign(NOTIFICATION_TEXT[lang], table);

export { renderNotification };
