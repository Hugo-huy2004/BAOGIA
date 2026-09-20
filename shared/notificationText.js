import { DEFAULT_DENOM, formatDenom } from "./joyCurrency.js";
import { sino } from "./sinoNumerals.js";

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
 * ── GIỌNG VĂN: LONG TRỌNG TUYÊN BỐ, HÁN VIỆT CUNG ĐÌNH ─────────────────────
 * Thông báo của Hugo Studio là lời TUYÊN CÁO, không phải tin nhắn tán gẫu. Giọng
 * chuẩn ở đây là Apple gặp Hoàng Gia: câu ngắn và rõ như Apple, phẩm cách và
 * kính ngữ như một văn thư chính thức.
 *
 * Bản TIẾNG VIỆT viết theo THỂ VĂN CHIẾU CHỈ: nêu cớ trước, tuyên sau.
 *
 *   "Nay xét…"      — mở đầu bằng sự việc làm căn cứ
 *   "Chiếu theo…"   — dẫn điều đã định trước đó
 *   "Kính trình…"   — khi bề dưới trình lên
 *   "Kính ban…"     — khi bề trên ban xuống
 *   "Kính mong…"    — lời kết, chỗ đặt nguyện vọng
 *
 * Từ ngữ dùng Hán Việt chuẩn:
 *
 *   thụ lĩnh (không "nhận")        · chi dụng (không "tiêu")
 *   thẩm định (không "xem xét")    · tái thẩm định (không "xét lại")
 *   phong toả (không "khoá")       · đình chỉ (không "đóng băng")
 *   đệ trình (không "nộp")         · phê chuẩn (không "duyệt")
 *   duyên do (không "lý do")       · tặng phẩm (không "món quà")
 *   khai mở (không "mở")           · đáo hạn (không "tới hạn")
 *
 * NHƯNG không ép mọi từ thuần Việt thành chữ hiểm. "ngày", "tuần", "nút", "tệp"
 * không có bản Hán Việt nào dễ hiểu hơn. Một thông báo trang trọng tới mức
 * không ai hiểu thì cũng vô dụng như một thông báo suồng sã — trang trọng là để
 * người đọc thấy được tôn trọng, không phải để người viết khoe chữ.
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
    "source.referral_referrer": "Tặng phẩm tiến cử",
    "source.referral_referee": "Tặng phẩm tiến cử",
    "source.chess_win": "Chiến thắng cờ vua",
    "source.chess_match": "Kỳ cuộc cờ vua",
    "source.companion": "Trị liệu tâm lý",
    "source.checkin": "Điểm danh thụ lĩnh JOY",
    "source.gift_code": "Quy đổi mã tặng phẩm",
    "source.store_purchase": "Giao dịch mua sắm",
    "source.admin_adjustment": "Điều chỉnh JOY",
    "source.companion_unlock": "Khai mở tính năng trị liệu",
    "source.daily_challenge": "Thử thách thường nhật",
    "source.arcade_score": "Kỷ lục mới tại Trò Chơi",
    "source.daily_tree_bonus": "Cây nhiệm vụ đã trưởng thành",
    "source.joylater_open": "Khai mở bằng JOYlater",
    "source.joylater_repay": "Hoàn trả JOYlater",
    "source.focus_session": "Phiên chuyên chú",
    "source.aura_theme_rent": "Thuê giao diện chuyên chú",
    "source.joy_gift_sent": "Tặng JOY cho thân hữu",
    "source.joy_gift_received": "Tặng phẩm từ thành viên khác",
    "source.ide_learning": "Hoàn tất bài học Phát triển Web",
    "source.hugoso_course": "Khai mở phần Năng suất số và AI",
    "source.info_bonus": "Tra cứu Thông tin và phiên bản",
    "source.feature_subscription": "Dụng JOY khai mở tính năng",
    "source.bio_theme_rental": "Dụng JOY thay giao diện Bio",
    "source.file_compression": "Dụng JOY nén tệp",
    "source.admin_direct_add": "Ân tứ từ Quản trị",
    "source.app_plan": "Khai mở gói ứng dụng",
    "source.app_plan_gift": "Tặng gói ứng dụng",
    "source.ide_course_completion": "Tốt nghiệp bộ Phát triển Web",
    "source.chat_tokens_exchange": "Quy đổi thêm lượt đàm thoại",
    "source.coder_exam_retake": "Mua lượt phúc khảo",
    "source.lifetime_unlock": "Khai mở vĩnh viễn một chặng",
    "source.lifetime_unlock_all": "Khai mở vĩnh viễn toàn bộ chặng",
    "source.info_read_bonus": "Duyệt tin trong Thông tin và phiên bản",
    "source.ide_phase_1_completion": "Hoàn thành phần 1 · Phát triển Web",
    "source.ide_phase_2_completion": "Hoàn thành phần 2 · Phát triển Web",
    "source.ide_phase_3_completion": "Hoàn thành phần 3 · Phát triển Web",
    "source.ide_phase_4_completion": "Hoàn thành phần 4 · Phát triển Web",
    "source.ide_phase_5_completion": "Hoàn thành phần 5 · Phát triển Web",
    "source.ide_phase_6_completion": "Hoàn thành phần 6 · Phát triển Web",
    "source.ide_phase_7_completion": "Hoàn tất bộ Phát triển Web",
    "source.birthday_spin": "Vòng quay thọ nhật",
    "source.credit": "Thụ lĩnh JOY",
    "source.debit": "Chi dụng JOY",
    "source.transfer_held": "Giao dịch đang được rà soát an toàn",
    "source.transfer_rejected": "Giao dịch trọng ngạch chưa được phê chuẩn",
    "source.vocab_essay_retake": "Lệ phí phúc khảo bài luận",
    "vocab.reminder.title": "Đã đến giờ ôn tập",
    "vocab.reminder.message": "Quý thành viên có {{count}} thẻ đến hạn ôn: {{words}}. Hai phút hôm nay giữ lại trọn vẹn phần đã học.",
    "vocab.word.title": "{{hanzi}} · {{pinyin}}",
    "vocab.word.message": "{{meaning}} — chạm để học thêm từ mới hôm nay.",

    "event.trialStarted.title": "Chiếu ban quyền dùng thử {{app}}",
    "event.trialStarted.message": "Nay đặc chuẩn cho Quý thành viên toàn quyền trải nghiệm {{app}} trong {{days, sinodays}}, hiệu lực đến hết ngày {{date}}.",
    "event.appGift.title": "{{sender}} kính tặng {{item}}",
    "event.appGift.message": "Tặng phẩm đã nhập vào tài khoản. Kính mời Quý thành viên quá bộ Thương Điếm để thụ lĩnh.",
    "event.adminBonus.title": "Chiếu ban ân thưởng",
    "event.adminBonus.message": "Nay xét công lao của Quý thành viên, Hugo Studio kính ban {{amount, sinojoy}}.",
    "event.adminBonusReason.title": "Chiếu ban ân thưởng",
    "event.adminBonusReason.message": "Nay xét công lao của Quý thành viên, Hugo Studio kính ban {{amount, sinojoy}}.\n\nDuyên do: {{reason}}",
    "event.cartCheckout.title": "Giao dịch đã hoàn tất",
    "event.cartCheckout.message": "{{count}} phẩm vật · {{total, joy}} · Chứng từ số {{code}}. Kính mong Quý thành viên lưu giữ chứng từ này.",
    "event.productPurchase.title": "Giao dịch đã hoàn tất",
    "event.productPurchase.message": "Quý thành viên đã thụ nhận “{{product}}” với {{total, joy}}. Chứng từ số {{code}}, kính mong lưu giữ.",
    "event.wellnessNudge.title": "Đôi lời vấn an",
    "event.wellnessNudge.message": "Hugo Studio kính gửi Quý thành viên đôi lời trong ngày hôm nay.",
    "event.paymentRequest.title": "Thông tri thỉnh cầu thanh toán",
    "event.paymentRequest.message": "Hugo Studio kính trình Quý thành viên khoản thanh toán {{amount}} ₫. Duyên do: {{reason}}",
    "event.friendRequest.title": "{{sender}} ngỏ lời kết giao",
    "event.friendRequest.message": "Kính mời Quý thành viên khai mở ứng dụng Bạn Bè để phúc đáp.",
    "event.friendAccepted.title": "{{friend}} đã nhận lời kết giao",
    "event.friendAccepted.message": "Kể từ nay hai vị được tương giao và tường lãm hồ sơ của nhau.",
    "event.joyLaterStage.grace.title": "Thông tri khoản JOYlater đã đáo hạn",
    "event.joyLaterStage.grace.message": "Chiếu theo điều lệ JOYlater, khoản vay {{amount, sinojoy}} nay đã quá hạn {{days, sinodays}}.\n\nCăn cứ quy chế, khoản này cần được hoàn tất trong tuần, hầu bảo toàn trọn vẹn quyền lợi của tài khoản.\n\nNay ban thông cáo, kính mong Quý thành viên liệu định.",
    "event.joyLaterStage.restricted.title": "Chiếu hạn chế quyền tài khoản",
    "event.joyLaterStage.restricted.message": "Chiếu theo điều lệ JOYlater, khoản vay {{amount, sinojoy}} nay đã quá hạn {{days, sinodays}}.\n\nCăn cứ quy chế, đặc chuẩn tạm đình chỉ quyền chuyển JOY và quyền khai mở khoản mới của tài khoản Quý thành viên.\n\nNay ban thông cáo, các quyền trên sẽ được phục hồi ngay khi dư nợ hoàn tất.",
    "event.joyLaterStage.frozen.title": "Chiếu đình chỉ quyền chi dụng",
    "event.joyLaterStage.frozen.message": "Chiếu theo điều lệ JOYlater, khoản vay {{amount, sinojoy}} nay đã quá hạn {{days, sinodays}}.\n\nCăn cứ quy chế, đặc chuẩn đình chỉ quyền chi dụng; JOY thụ lĩnh kể từ nay dành trọn cho việc hoàn trả dư nợ.\n\nNay ban thông cáo, quyền chi dụng sẽ được phục hồi ngay khi dư nợ hoàn tất.",
    "event.joyLaterStage.locked.title": "Chiếu phong toả tài khoản có kỳ hạn",
    "event.joyLaterStage.locked.message": "Chiếu theo điều lệ JOYlater, khoản vay {{amount, sinojoy}} nay đã quá hạn {{days, sinodays}}.\n\nCăn cứ quy chế, đặc chuẩn phong toả tài khoản Quý thành viên trong thời hạn tam thập nhật (30 ngày).\n\nNay ban thông cáo, Quý thành viên được quyền dâng lệnh kháng nghị, thỉnh cầu tái thẩm định án khoản.",
    "event.joyLaterStage.review.title": "Hồ sơ đã trình lên thẩm định",
    "event.joyLaterStage.review.message": "Chiếu theo điều lệ JOYlater, khoản vay {{amount, sinojoy}} nay đã quá hạn {{days, sinodays}}.\n\nCăn cứ quy chế, án khoản đã được lập thành hồ sơ và trình lên Quản trị thẩm định biện pháp vĩnh viễn.\n\nNay ban thông cáo, Quý thành viên còn được hoàn tất dư nợ trước khi hồ sơ phê chuẩn, hầu tránh chế tài vĩnh viễn.",
    "event.joyCreditLimit.title": "Chiếu phê chuẩn hạn mức JOYlater",
    "event.joyCreditLimit.message": "Nay xét hồ sơ tín dụng của Quý thành viên đạt {{score, sino}} điểm.\n\nCăn cứ quy chế, đặc chuẩn hạn mức JOYlater là {{limit, sinojoy}}.\n\nNay ban thông cáo, hạn mức sẽ được tái thẩm định vào giờ Dậu (17:00) mỗi thứ Bảy.",
    "event.joyCreditDenied.title": "Hạn mức JOYlater chưa được phê chuẩn",
    "event.joyCreditDenied.message": "Nay xét hồ sơ tín dụng của Quý thành viên đạt {{score, sino}} điểm, chưa tới ngưỡng cấp hạn mức.\n\nCăn cứ quy chế, hạn mức chưa được phê chuẩn trong kỳ này.\n\nNay ban thông cáo, hệ thống sẽ tự tái thẩm định vào giờ Dậu (17:00) thứ Bảy; Quý thành viên không phải đệ trình lại.",
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
    "event.joyLaterStage.grace.title": "Your JOYlater instalment is due",
    "event.joyLaterStage.grace.message": "{{amount, joy}} remains outstanding, {{days}} days past due. Settle it this week and your account keeps every privilege.",
    "event.joyLaterStage.restricted.title": "Account temporarily restricted",
    "event.joyLaterStage.restricted.message": "Because {{amount, joy}} has been outstanding for {{days}} days, transfers and new JOYlater plans are suspended until the balance is settled.",
    "event.joyLaterStage.frozen.title": "Spending has been frozen",
    "event.joyLaterStage.frozen.message": "{{amount, joy}} has been outstanding for {{days}} days. From now on, the JOY you earn is applied in full to the outstanding balance.",
    "event.joyLaterStage.locked.title": "Account locked for a fixed term",
    "event.joyLaterStage.locked.message": "{{amount, joy}} has been outstanding for {{days}} days. The account is locked for thirty days under the policy. You are entitled to submit an appeal for review.",
    "event.joyLaterStage.review.title": "Your case has been referred for review",
    "event.joyLaterStage.review.message": "An outstanding balance of {{amount, joy}}, {{days}} days past due, has been referred to administration. Settle it before the case is decided to avoid permanent measures.",
    "event.joyCreditLimit.title": "Your JOYlater limit has been assessed",
    "event.joyCreditLimit.message": "Your limit is now {{limit, joy}}, on a profile score of {{score}}. It is reassessed every Saturday at 17:00.",
    "event.joyCreditDenied.title": "No JOYlater limit granted yet",
    "event.joyCreditDenied.message": "Your profile scores {{score}}, below the threshold for a limit. The system reassesses it every Saturday at 17:00; there is nothing for you to submit again.",
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
    "event.joyLaterStage.grace.title": "JOYlater 分期已到期",
    "event.joyLaterStage.grace.message": "尚余 {{amount, joy}} 逾期 {{days}} 天。请于本周内结清，账户即可保全全部权限。",
    "event.joyLaterStage.restricted.title": "账户暂受限制",
    "event.joyLaterStage.restricted.message": "因 {{amount, joy}} 逾期 {{days}} 天，转赠 JOY 与新开分期暂停，待结清后恢复。",
    "event.joyLaterStage.frozen.title": "消费已冻结",
    "event.joyLaterStage.frozen.message": "{{amount, joy}} 已逾期 {{days}} 天。自即日起，所得 JOY 将全数用于偿付欠款。",
    "event.joyLaterStage.locked.title": "账户已定期封禁",
    "event.joyLaterStage.locked.message": "{{amount, joy}} 逾期 {{days}} 天。依政策，账户封禁三十日。阁下有权提出申诉以待复核。",
    "event.joyLaterStage.review.title": "案卷已呈报复核",
    "event.joyLaterStage.review.message": "逾期 {{days}} 天、尚余 {{amount, joy}} 的欠款已呈报管理层。请于裁定前结清，以免招致永久措施。",
    "event.joyCreditLimit.title": "JOYlater 额度已评定",
    "event.joyCreditLimit.message": "阁下的额度现为 {{limit, joy}}，对应评分 {{score}}。额度于每周六 17:00 重新评定。",
    "event.joyCreditDenied.title": "尚未核发 JOYlater 额度",
    "event.joyCreditDenied.message": "阁下的评分为 {{score}}，未达核发门槛。系统将于每周六 17:00 自动重评，无须再次提交。",
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
    // `{{days, sino}}` → "tứ thập ngũ nhật (45 ngày)" trong bản chiếu tiếng
    // Việt. Các ngôn ngữ khác đọc số thường: chữ số Hán Việt chỉ có nghĩa với
    // người đọc tiếng Việt, với người khác nó là một chuỗi ký tự vô nghĩa.
    // `{{amount, sinojoy}}` → "ngũ vạn nhị thiên (52.000 JOY)".
    if (format === "sinojoy") {
      const n = Number(value);
      const money = formatDenom(value, denom, language);
      if (!Number.isFinite(n) || language !== "vi") return money;
      return `${sino(n)} (${money})`;
    }
    // `{{days, sinodays}}` → "tứ thập ngũ nhật (45 ngày)". Đơn vị đếm nằm TRONG
    // ngoặc cùng chữ số, vì "nhật" và "ngày" là một; tách ra thành "tứ thập ngũ
    // (45) ngày" là đọc lửng giữa hai lối.
    if (format === "sinodays") {
      const n = Number(value);
      if (!Number.isFinite(n)) return String(value);
      const digits = n.toLocaleString(language);
      return language === "vi" ? `${sino(n)} nhật (${digits} ngày)` : `${digits} days`;
    }
    if (format === "sino") {
      const n = Number(value);
      if (!Number.isFinite(n)) return String(value);
      const digits = n.toLocaleString(language);
      return language === "vi" ? `${sino(n)} (${digits})` : digits;
    }
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
