import { DEFAULT_DENOM, formatDenom } from "./joyCurrency.js";

/**
 * Chữ của thông báo — MỘT nguồn duy nhất cho cả trình duyệt lẫn máy chủ.
 *
 * Trước đây máy chủ ghi thẳng câu tiếng Việt vào MongoDB ("Đã mở dùng thử…",
 * "Thanh toán thành công!"), nên máy đặt tiếng Hàn mở hộp thư vẫn thấy tiếng
 * Việt và không có cách nào sửa: câu đã nằm trong dữ liệu rồi.
 *
 * Giờ máy chủ chỉ lưu KHOÁ + THAM SỐ (`i18nKey` / `i18nParams` trong
 * models/InAppNotification.js), còn câu chữ dựng lúc hiển thị theo ngôn ngữ
 * người đọc đang dùng. Thông báo đẩy thì máy chủ dựng sẵn theo ngôn ngữ của
 * từng thiết bị (`NotificationSubscription.device.locale`) vì hệ điều hành vẽ
 * nó, không phải app.
 *
 * File nằm ở `shared/` chứ không phải trong bộ i18n của frontend: máy chủ cũng
 * phải đọc được để soạn push. Hai bản chép tay ở hai phía chắc chắn sẽ lệch.
 *
 * Quy ước khoá:
 *   `source.<joy_source>`  — tiêu đề cho một biến động JOY (xem
 *                            server/utils/joySources.js, khoá trùng nhau).
 *   `event.<tên>.title`    — tiêu đề của một sự kiện.
 *   `event.<tên>.message`  — câu mô tả của chính sự kiện đó.
 *
 * ── GIỌNG VĂN: LONG TRỌNG TUYÊN BỐ ─────────────────────────────────────────
 * Thông báo của Hugo Studio là lời TUYÊN CÁO, không phải tin nhắn tán gẫu. Giọng
 * chuẩn ở đây là Apple gặp Hoàng Gia: câu ngắn và rõ như Apple, phẩm cách và
 * kính ngữ như một văn thư chính thức.
 *
 * LUẬT:
 *   · Xưng hô: "Quý thành viên" / "you" / "阁下". KHÔNG "bạn", "cậu", "mày".
 *   · Động từ tuyên cáo: "đã được ban", "xin trân trọng", "đã được ghi nhận".
 *   · KHÔNG dấu chấm than. Sự trang trọng không cần lớn tiếng.
 *   · KHÔNG từ đệm suồng sã: "nhé", "nha", "luôn", "ngay và luôn".
 *   · KHÔNG emoji trong câu chữ — biểu tượng thuộc về giao diện, không thuộc
 *     về lời tuyên cáo.
 *   · Danh từ trang trọng: "chứng từ" thay "mã đơn", "khoản thưởng" thay "quà".
 *
 * `npm run check:notification-tone` canh những luật đếm được ở trên.
 *
 * Tham số viết dạng {{tên}}. Giá trị là chuỗi ngày ISO sẽ tự động đổi sang
 * định dạng ngày của ngôn ngữ đang dựng.
 */

const LANGUAGES = ["vi", "en", "zh"];

export const NOTIFICATION_TEXT = {
  vi: {
    "source.referral_referrer": "Quà giới thiệu",
    "source.referral_referee": "Quà giới thiệu",
    "source.chess_win": "Thắng trận cờ vua",
    "source.chess_match": "Trận đấu cờ vua",
    "source.companion": "Trị liệu tâm lý",
    "source.checkin": "Điểm danh nhận JOY",
    "source.gift_code": "Đổi mã quà tặng",
    "source.store_purchase": "Mua hàng",
    "source.admin_adjustment": "Điều chỉnh JOY",
    "source.companion_unlock": "Mở khoá tính năng trị liệu",
    "source.daily_challenge": "Thử thách hàng ngày",
    "source.arcade_score": "Kỷ lục mới ở sân chơi",
    "source.daily_tree_bonus": "Cây nhiệm vụ trưởng thành",
    "source.joylater_open": "Mở khoá bằng JOYlater",
    "source.joylater_repay": "Trả nợ JOYlater",
    "source.focus_session": "Phiên tập trung sâu",
    "source.aura_theme_rent": "Thuê giao diện tập trung",
    "source.joy_gift_sent": "Gửi JOY cho bạn bè",
    "source.joy_gift_received": "Khoản tặng từ thành viên khác",
    "source.ide_learning": "Hoàn thành bài học Phát triển Web",
    "source.hugoso_course": "Mở khoá phần Năng suất số và AI",
    "source.info_bonus": "Khám phá Thông tin và phiên bản",
    "source.feature_subscription": "Trao đổi JOY mở khoá tính năng",
    "source.bio_theme_rental": "Trao đổi JOY đổi giao diện Bio",
    "source.file_compression": "Trao đổi JOY nén tệp",
    "source.admin_direct_add": "Nhận JOY từ Admin",
    "source.app_plan": "Mở gói ứng dụng",
    "source.app_plan_gift": "Tặng gói ứng dụng",
    "source.ide_course_completion": "Tốt nghiệp bộ Phát triển Web",
    "source.chat_tokens_exchange": "Đổi thêm lượt trò chuyện",
    "source.coder_exam_retake": "Mua lượt thi lại",
    "source.lifetime_unlock": "Mở khoá vĩnh viễn một chặng",
    "source.lifetime_unlock_all": "Mở khoá vĩnh viễn toàn bộ chặng",
    "source.info_read_bonus": "Đọc tin trong Thông tin và phiên bản",
    "source.ide_phase_1_completion": "Hoàn thành phần 1 · Phát triển Web",
    "source.ide_phase_2_completion": "Hoàn thành phần 2 · Phát triển Web",
    "source.ide_phase_3_completion": "Hoàn thành phần 3 · Phát triển Web",
    "source.ide_phase_4_completion": "Hoàn thành phần 4 · Phát triển Web",
    "source.ide_phase_5_completion": "Hoàn thành phần 5 · Phát triển Web",
    "source.ide_phase_6_completion": "Hoàn thành phần 6 · Phát triển Web",
    "source.ide_phase_7_completion": "Hoàn thành bộ Phát triển Web",
    "source.birthday_spin": "Vòng quay tháng sinh nhật",
    "source.credit": "Nhận JOY",
    "source.debit": "Dùng JOY",
    "source.transfer_held": "Giao dịch đang được rà soát an toàn",
    "source.transfer_rejected": "Giao dịch lớn chưa được duyệt",
    "source.vocab_essay_retake": "Phí thi lại bài viết luận",
    "vocab.reminder.title": "Đã đến giờ ôn tập",
    "vocab.reminder.message": "Quý thành viên có {{count}} thẻ đến hạn ôn: {{words}}. Hai phút hôm nay giữ lại trọn vẹn phần đã học.",
    "vocab.word.title": "{{hanzi}} · {{pinyin}}",
    "vocab.word.message": "{{meaning}} — chạm để học thêm từ mới hôm nay.",

    "event.trialStarted.title": "Quyền dùng thử {{app}} đã được ban",
    "event.trialStarted.message": "Quý thành viên được toàn quyền trải nghiệm trong {{days}} ngày, hiệu lực đến hết ngày {{date}}.",
    "event.appGift.title": "{{sender}} trân trọng gửi tặng {{item}}",
    "event.appGift.message": "Món quà đã được ghi nhận vào tài khoản. Mời Quý thành viên ghé Cửa Hàng để tiếp nhận.",
    "event.adminBonus.title": "Khoản thưởng đã được ban",
    "event.adminBonus.message": "Hugo Studio xin trân trọng gửi đến Quý thành viên {{amount, joy}}.",
    "event.adminBonusReason.title": "Khoản thưởng đã được ban",
    "event.adminBonusReason.message": "Hugo Studio xin trân trọng gửi đến Quý thành viên {{amount, joy}}. Lý do: {{reason}}",
    "event.cartCheckout.title": "Giao dịch đã hoàn tất",
    "event.cartCheckout.message": "{{count}} sản phẩm · {{total, joy}} · Chứng từ số {{code}}",
    "event.productPurchase.title": "Giao dịch đã hoàn tất",
    "event.productPurchase.message": "Quý thành viên đã tiếp nhận “{{product}}” với {{total, joy}}. Chứng từ số {{code}}.",
    "event.wellnessNudge.title": "Đôi lời thăm hỏi",
    "event.wellnessNudge.message": "Hugo Studio có một lời nhắn dành riêng cho Quý thành viên hôm nay.",
    "event.paymentRequest.title": "Thông báo yêu cầu thanh toán",
    "event.paymentRequest.message": "Hugo Studio trân trọng đề nghị khoản thanh toán {{amount}} ₫. Lý do: {{reason}}",
    "event.friendRequest.title": "{{sender}} ngỏ lời kết giao",
    "event.friendRequest.message": "Mời Quý thành viên mở ứng dụng Bạn Bè để phúc đáp.",
    "event.friendAccepted.title": "{{friend}} đã nhận lời kết giao",
    "event.friendAccepted.message": "Kể từ nay hai vị có thể xem hồ sơ và kết nối cùng nhau.",
  },

  en: {
    "source.referral_referrer": "Referral reward",
    "source.referral_referee": "Referral reward",
    "source.chess_win": "Chess victory",
    "source.chess_match": "Chess match",
    "source.companion": "Therapy session",
    "source.checkin": "Daily check-in",
    "source.gift_code": "Gift code redeemed",
    "source.store_purchase": "Purchase",
    "source.admin_adjustment": "JOY adjustment",
    "source.companion_unlock": "Therapy feature unlocked",
    "source.daily_challenge": "Daily challenge",
    "source.arcade_score": "New arcade record",
    "source.daily_tree_bonus": "Your daily tree is fully grown",
    "source.joylater_open": "Unlocked with JOYlater",
    "source.joylater_repay": "JOYlater repayment",
    "source.focus_session": "Deep focus session",
    "source.aura_theme_rent": "Focus theme rental",
    "source.joy_gift_sent": "JOY sent to a friend",
    "source.joy_gift_received": "JOY from a friend",
    "source.ide_learning": "Web Development lesson completed",
    "source.hugoso_course": "Digital Productivity & AI unlocked",
    "source.info_bonus": "Explored Info and Version",
    "source.feature_subscription": "JOY spent to unlock a feature",
    "source.bio_theme_rental": "JOY spent on a Bio theme",
    "source.file_compression": "JOY spent on file compression",
    "source.admin_direct_add": "JOY from the admin",
    "source.app_plan": "App plan opened",
    "source.app_plan_gift": "App plan gifted",
    "source.ide_course_completion": "Web Development track completed",
    "source.chat_tokens_exchange": "Extra chat turns",
    "source.coder_exam_retake": "Exam retake purchased",
    "source.lifetime_unlock": "Lifetime access to a stage",
    "source.lifetime_unlock_all": "Lifetime access to every stage",
    "source.info_read_bonus": "Read a post in Info and Version",
    "source.ide_phase_1_completion": "Part 1 completed · Web Development",
    "source.ide_phase_2_completion": "Part 2 completed · Web Development",
    "source.ide_phase_3_completion": "Part 3 completed · Web Development",
    "source.ide_phase_4_completion": "Part 4 completed · Web Development",
    "source.ide_phase_5_completion": "Part 5 completed · Web Development",
    "source.ide_phase_6_completion": "Part 6 completed · Web Development",
    "source.ide_phase_7_completion": "Web Development track finished",
    "source.birthday_spin": "Birthday month spin",
    "source.credit": "JOY received",
    "source.debit": "JOY spent",

    "event.trialStarted.title": "Your trial of {{app}} has been granted",
    "event.trialStarted.message": "You are granted full access for {{days}} days, valid through {{date}}.",
    "event.appGift.title": "{{sender}} presents you with {{item}}",
    "event.appGift.message": "The gift has been recorded to your account. Visit the Store to receive it.",
    "event.adminBonus.title": "A reward has been granted",
    "event.adminBonus.message": "Hugo Studio is pleased to present you with {{amount, joy}}.",
    "event.adminBonusReason.title": "A reward has been granted",
    "event.adminBonusReason.message": "Hugo Studio is pleased to present you with {{amount, joy}}. Reason: {{reason}}",
    "event.cartCheckout.title": "Your transaction is complete",
    "event.cartCheckout.message": "{{count}} items · {{total, joy}} · Record no. {{code}}",
    "event.productPurchase.title": "Your transaction is complete",
    "event.productPurchase.message": "You have received “{{product}}” for {{total, joy}}. Record no. {{code}}.",
    "event.wellnessNudge.title": "A word of care",
    "event.wellnessNudge.message": "Hugo Studio has a message intended for you today.",
    "event.paymentRequest.title": "Notice of payment request",
    "event.paymentRequest.message": "Hugo Studio respectfully requests a payment of {{amount}} ₫. Reason: {{reason}}",
    "event.friendRequest.title": "{{sender}} extends an invitation",
    "event.friendRequest.message": "Open the Friends app to offer your reply.",
    "event.friendAccepted.title": "{{friend}} has accepted your invitation",
    "event.friendAccepted.message": "From this day you may view each other's profiles and connect.",
  },

  zh: {
    "source.referral_referrer": "邀请奖励",
    "source.referral_referee": "邀请奖励",
    "source.chess_win": "国际象棋获胜",
    "source.chess_match": "国际象棋对局",
    "source.companion": "心理疗愈",
    "source.checkin": "每日签到",
    "source.gift_code": "兑换礼品码",
    "source.store_purchase": "购买",
    "source.admin_adjustment": "JOY 调整",
    "source.companion_unlock": "解锁疗愈功能",
    "source.daily_challenge": "每日挑战",
    "source.arcade_score": "游艺厅新纪录",
    "source.daily_tree_bonus": "今日之树已长成",
    "source.joylater_open": "使用 JOYlater 解锁",
    "source.joylater_repay": "JOYlater 还款",
    "source.focus_session": "深度专注时段",
    "source.aura_theme_rent": "租用专注主题",
    "source.joy_gift_sent": "赠送 JOY 给朋友",
    "source.joy_gift_received": "收到朋友的 JOY",
    "source.ide_learning": "完成 Web 开发课程",
    "source.hugoso_course": "解锁数字效率与 AI",
    "source.info_bonus": "浏览系统信息与版本",
    "source.feature_subscription": "用 JOY 解锁功能",
    "source.bio_theme_rental": "用 JOY 更换 Bio 主题",
    "source.file_compression": "用 JOY 压缩文件",
    "source.admin_direct_add": "管理员赠送 JOY",
    "source.app_plan": "开通应用套餐",
    "source.app_plan_gift": "赠送应用套餐",
    "source.ide_course_completion": "完成 Web 开发全课程",
    "source.chat_tokens_exchange": "兑换更多对话次数",
    "source.coder_exam_retake": "购买重考次数",
    "source.lifetime_unlock": "永久解锁一个阶段",
    "source.lifetime_unlock_all": "永久解锁全部阶段",
    "source.info_read_bonus": "阅读系统信息与版本",
    "source.ide_phase_1_completion": "完成第 1 部分 · Web 开发",
    "source.ide_phase_2_completion": "完成第 2 部分 · Web 开发",
    "source.ide_phase_3_completion": "完成第 3 部分 · Web 开发",
    "source.ide_phase_4_completion": "完成第 4 部分 · Web 开发",
    "source.ide_phase_5_completion": "完成第 5 部分 · Web 开发",
    "source.ide_phase_6_completion": "完成第 6 部分 · Web 开发",
    "source.ide_phase_7_completion": "完成 Web 开发全部内容",
    "source.birthday_spin": "生日月转盘",
    "source.credit": "获得 JOY",
    "source.debit": "使用 JOY",

    "event.trialStarted.title": "{{app}} 试用权限已授予",
    "event.trialStarted.message": "谨授予阁下 {{days}} 天全功能体验，有效期至 {{date}}。",
    "event.appGift.title": "{{sender}} 谨赠 {{item}}",
    "event.appGift.message": "此礼已记入阁下账户，敬请移步商店领取。",
    "event.adminBonus.title": "奖励已授予",
    "event.adminBonus.message": "Hugo Studio 谨向阁下奉上 {{amount, joy}}。",
    "event.adminBonusReason.title": "奖励已授予",
    "event.adminBonusReason.message": "Hugo Studio 谨向阁下奉上 {{amount, joy}}。事由：{{reason}}",
    "event.cartCheckout.title": "交易已完成",
    "event.cartCheckout.message": "{{count}} 件商品 · {{total, joy}} · 凭证编号 {{code}}",
    "event.productPurchase.title": "交易已完成",
    "event.productPurchase.message": "阁下已以 {{total, joy}} 取得「{{product}}」。凭证编号 {{code}}。",
    "event.wellnessNudge.title": "问候一则",
    "event.wellnessNudge.message": "Hugo Studio 今日有一则专为阁下而备的讯息。",
    "event.paymentRequest.title": "付款请求通告",
    "event.paymentRequest.message": "Hugo Studio 谨请阁下支付 {{amount}} ₫。事由：{{reason}}",
    "event.friendRequest.title": "{{sender}} 谨致结交之意",
    "event.friendRequest.message": "敬请开启「好友」应用予以回覆。",
    "event.friendAccepted.title": "{{friend}} 已应允结交",
    "event.friendAccepted.message": "自今日起，二位可互阅名帖并往来联络。",
  },
};

/** Mã ngôn ngữ hợp lệ, chấp nhận cả dạng "ko-KR" hoặc "zh_CN". */
export function notificationLanguage(input) {
  const code = String(input || "").toLowerCase().replace("_", "-").split("-")[0];
  return LANGUAGES.includes(code) ? code : "vi";
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T|$)/;

/**
 * Thay {{tham số}}; giá trị là ngày ISO thì đổi sang định dạng của ngôn ngữ.
 *
 * Dạng `{{tên, joy}}` là SỐ TIỀN: nó được viết theo đơn vị của chính người nhận
 * thông báo (`denom`), giống hệt mọi con số khác trong app. Thông báo đẩy do
 * server dựng nên đơn vị phải đi kèm tham số, không đọc từ trình duyệt được.
 */
function interpolate(template, params, language, denom) {
  return template.replace(/\{\{(\w+)(?:,\s*(\w+))?\}\}/g, (whole, name, format) => {
    const value = params?.[name];
    if (value === undefined || value === null) return whole;
    if (format === "joy") return formatDenom(value, denom, language);
    if (typeof value === "string" && ISO_DATE.test(value)) {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date.toLocaleDateString(language);
    }
    if (typeof value === "number") return value.toLocaleString(language);
    return String(value);
  });
}

/**
 * Dựng tiêu đề + nội dung của một thông báo.
 *
 * Trả `null` khi không có khoá (thông báo cũ, hoặc tin admin tự viết) — nơi gọi
 * cứ dùng tiếp `title`/`message` đã lưu trong DB.
 */
export function renderNotification(key, params = {}, language = "vi", denom = DEFAULT_DENOM) {
  if (!key) return null;
  const lang = notificationLanguage(language);
  const dict = NOTIFICATION_TEXT[lang];
  const fallback = NOTIFICATION_TEXT.vi;
  const pick = (name) => dict[name] ?? fallback[name] ?? null;

  const title = pick(`${key}.title`) ?? pick(key);
  if (!title) return null;
  const message = pick(`${key}.message`);

  return {
    title: interpolate(title, params, lang, denom),
    // `note` là chữ người dùng tự viết (lời nhắn kèm quà, lý do của admin).
    // Không dịch được và cũng không nên dịch — nó thay hẳn câu mặc định.
    message: params?.note
      ? String(params.note)
      : (message ? interpolate(message, params, lang, denom) : ""),
  };
}

export const NOTIFICATION_LANGUAGES = LANGUAGES;
