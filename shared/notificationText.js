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
    "source.joy_gift_received": "Nhận JOY từ bạn bè",
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
    "vocab.reminder.title": "Đến giờ ôn từ vựng ✍️",
    "vocab.reminder.message": "Bạn có {{count}} thẻ cần ôn: {{words}} — ôn ngay 2 phút để không quên nhé!",
    "vocab.word.title": "{{hanzi}} · {{pinyin}}",
    "vocab.word.message": "{{meaning}} — chạm để học thêm từ mới hôm nay.",

    "event.trialStarted.title": "Đã mở dùng thử {{app}}",
    "event.trialStarted.message": "Bạn có {{days}} ngày dùng thử miễn phí, hết hạn ngày {{date}}.",
    "event.appGift.title": "{{sender}} đã tặng bạn {{item}}",
    "event.appGift.message": "Mở cửa hàng để bắt đầu dùng ngay.",
    "event.adminBonus.title": "Nhận JOY thưởng",
    "event.adminBonus.message": "Admin vừa tặng bạn {{amount, joy}}.",
    "event.adminBonusReason.title": "Nhận JOY thưởng",
    "event.adminBonusReason.message": "Admin vừa tặng bạn {{amount, joy}}. Lý do: {{reason}}",
    "event.cartCheckout.title": "Thanh toán thành công",
    "event.cartCheckout.message": "{{count}} sản phẩm · {{total, joy}} · Mã đơn: {{code}}",
    "event.productPurchase.title": "Mua hàng thành công",
    "event.productPurchase.message": "Bạn đã mua “{{product}}” với {{total, joy}}. Mã đơn: {{code}}",
    "event.wellnessNudge.title": "Lời nhắn chăm sóc tinh thần",
    "event.wellnessNudge.message": "Hôm nay có một gợi ý nhỏ dành cho bạn.",
    "event.stockBreakEven.title": "Cổ phiếu vượt mốc hoà vốn",
    "event.stockBreakEven.message": "{{symbol}} đang cao hơn giá vốn của bạn {{pct}}% — đã qua mốc hoà vốn sau phí. Chốt lời hay giữ tiếp là bài học hôm nay.",
    "event.paymentRequest.title": "Yêu cầu thanh toán",
    "event.paymentRequest.message": "Admin gửi một yêu cầu thanh toán {{amount}} ₫. Lý do: {{reason}}",
    "event.friendRequest.title": "{{sender}} muốn kết bạn",
    "event.friendRequest.message": "Mở ứng dụng Bạn bè để trả lời lời mời.",
    "event.friendAccepted.title": "{{friend}} đã chấp nhận lời mời",
    "event.friendAccepted.message": "Hai bạn giờ đã có thể xem hồ sơ và kết nối với nhau.",
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

    "event.trialStarted.title": "{{app}} trial started",
    "event.trialStarted.message": "You have {{days}} free trial days, ending {{date}}.",
    "event.appGift.title": "{{sender}} gifted you {{item}}",
    "event.appGift.message": "Open the store to start using it.",
    "event.adminBonus.title": "Bonus JOY received",
    "event.adminBonus.message": "The admin just gave you {{amount, joy}}.",
    "event.adminBonusReason.title": "Bonus JOY received",
    "event.adminBonusReason.message": "The admin just gave you {{amount, joy}}. Reason: {{reason}}",
    "event.cartCheckout.title": "Payment complete",
    "event.cartCheckout.message": "{{count}} items · {{total, joy}} · Order: {{code}}",
    "event.productPurchase.title": "Purchase complete",
    "event.productPurchase.message": "You bought “{{product}}” for {{total, joy}}. Order: {{code}}",
    "event.wellnessNudge.title": "A wellbeing nudge",
    "event.wellnessNudge.message": "There is a small suggestion waiting for you today.",
    "event.stockBreakEven.title": "Stock passed break-even",
    "event.stockBreakEven.message": "{{symbol}} is {{pct}}% above your cost basis — past the after-fee break-even point. To sell or to hold is today's lesson.",
    "event.paymentRequest.title": "Payment request",
    "event.paymentRequest.message": "The admin sent a payment request for {{amount}} ₫. Reason: {{reason}}",
    "event.friendRequest.title": "{{sender}} sent you a friend request",
    "event.friendRequest.message": "Open Friends to respond.",
    "event.friendAccepted.title": "{{friend}} accepted your request",
    "event.friendAccepted.message": "You can now view each other's profiles and connect.",
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

    "event.trialStarted.title": "已开始 {{app}} 试用",
    "event.trialStarted.message": "你有 {{days}} 天免费试用，到期日 {{date}}。",
    "event.appGift.title": "{{sender}} 送了你 {{item}}",
    "event.appGift.message": "打开商店即可开始使用。",
    "event.adminBonus.title": "收到奖励 JOY",
    "event.adminBonus.message": "管理员刚刚赠送你 {{amount, joy}}。",
    "event.adminBonusReason.title": "收到奖励 JOY",
    "event.adminBonusReason.message": "管理员刚刚赠送你 {{amount, joy}}。原因：{{reason}}",
    "event.cartCheckout.title": "支付成功",
    "event.cartCheckout.message": "{{count}} 件商品 · {{total, joy}} · 订单号：{{code}}",
    "event.productPurchase.title": "购买成功",
    "event.productPurchase.message": "你以 {{total, joy}} 购买了“{{product}}”。订单号：{{code}}",
    "event.wellnessNudge.title": "心理关怀提醒",
    "event.wellnessNudge.message": "今天有一个小建议等着你。",
    "event.stockBreakEven.title": "股票已过盈亏平衡点",
    "event.stockBreakEven.message": "{{symbol}} 已高于你的成本 {{pct}}%，超过扣费后的盈亏平衡点。卖出还是持有，就是今天的功课。",
    "event.paymentRequest.title": "付款请求",
    "event.paymentRequest.message": "管理员发来一笔 {{amount}} ₫ 的付款请求。原因：{{reason}}",
    "event.friendRequest.title": "{{sender}} 想添加你为好友",
    "event.friendRequest.message": "打开好友应用即可回复邀请。",
    "event.friendAccepted.title": "{{friend}} 已接受你的邀请",
    "event.friendAccepted.message": "你们现在可以查看彼此的个人资料并互动。",
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
